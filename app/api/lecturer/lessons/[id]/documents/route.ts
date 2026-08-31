import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   GET /api/lecturer/lessons/[id]/documents

   Get all documents belonging to a lesson.
========================================================= */

export async function GET(
  request: Request,
  context: {
    params: { id: string };
  }
) {
  try {
    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const lessonId = Number(context.params.id);

    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid lesson ID is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY LESSON ACCESS
    ===================================================== */

    const lessonAccess = await pool.query(
      `
        SELECT
          l.id,
          l.title,
          l.topic_id,
          t.title AS topic_title,
          u.id AS unit_id,
          u.name AS unit_name,
          u.code AS unit_code,
          p.id AS course_id,
          p.name AS course_name,
          p.code AS course_code

        FROM lms_lessons l

        INNER JOIN lms_topics t
          ON t.id = l.topic_id

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_programs p
          ON p.id = u.program_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        WHERE l.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [lessonId, lecturer.id]
    );

    if (lessonAccess.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Lesson not found or you are not authorized to access it.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       GET DOCUMENTS
    ===================================================== */

    const result = await pool.query(
      `
        SELECT
          id,
          lesson_id,
          title,
          description,
          file_name,
          file_url,
          file_size,
          mime_type,
          status,
          created_at,
          updated_at

        FROM lms_lesson_documents

        WHERE lesson_id = $1

        ORDER BY created_at DESC, id DESC
      `,
      [lessonId]
    );

    return NextResponse.json(
      {
        success: true,
        lesson: lessonAccess.rows[0],
        documents: result.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'GET LESSON DOCUMENTS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load lesson materials.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST /api/lecturer/lessons/[id]/documents

   Create a document/material.
========================================================= */

export async function POST(
  request: Request,
  context: {
    params: { id: string };
  }
) {
  try {
    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const lessonId = Number(context.params.id);

    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid lesson ID is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY LESSON ACCESS
    ===================================================== */

    const lessonAccess = await pool.query(
      `
        SELECT
          l.id,
          l.topic_id,
          u.program_id

        FROM lms_lessons l

        INNER JOIN lms_topics t
          ON t.id = l.topic_id

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        WHERE l.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [lessonId, lecturer.id]
    );

    if (lessonAccess.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Lesson not found or you are not authorized to add materials to it.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       READ BODY
    ===================================================== */

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON request body.',
        },
        { status: 400 }
      );
    }

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : '';

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : '';

    const fileName =
      typeof body.file_name === 'string'
        ? body.file_name.trim()
        : '';

    const fileUrl =
      typeof body.file_url === 'string'
        ? body.file_url.trim()
        : '';

    const mimeType =
      typeof body.mime_type === 'string' &&
      body.mime_type.trim()
        ? body.mime_type.trim()
        : 'application/pdf';

    const fileSize =
      body.file_size === null ||
      body.file_size === undefined ||
      body.file_size === ''
        ? null
        : Number(body.file_size);

    const status =
      typeof body.status === 'string' &&
      body.status.trim()
        ? body.status.trim().toLowerCase()
        : 'active';

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Material title is required.',
        },
        { status: 400 }
      );
    }

    if (!fileName) {
      return NextResponse.json(
        {
          success: false,
          message: 'File name is required.',
        },
        { status: 400 }
      );
    }

    if (!fileUrl) {
      return NextResponse.json(
        {
          success: false,
          message: 'File URL is required.',
        },
        { status: 400 }
      );
    }

    if (
      fileSize !== null &&
      (!Number.isInteger(fileSize) || fileSize < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size must be a valid number.',
        },
        { status: 400 }
      );
    }

    if (
      status !== 'active' &&
      status !== 'inactive'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Status must be either active or inactive.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       INSERT
    ===================================================== */

    const result = await pool.query(
      `
        INSERT INTO lms_lesson_documents (
          lesson_id,
          title,
          description,
          file_name,
          file_url,
          file_size,
          mime_type,
          status
        )

        VALUES (
          $1,
          $2,
          NULLIF($3, ''),
          $4,
          $5,
          $6,
          $7,
          $8
        )

        RETURNING
          id,
          lesson_id,
          title,
          description,
          file_name,
          file_url,
          file_size,
          mime_type,
          status,
          created_at,
          updated_at
      `,
      [
        lessonId,
        title,
        description,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        status,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Material added successfully.',
        document: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'CREATE LESSON DOCUMENT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to add lesson material.',
      },
      { status: 500 }
    );
  }
}