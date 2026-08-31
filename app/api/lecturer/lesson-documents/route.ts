import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

/* =========================================================
   GET DOCUMENTS FOR A LESSON

   GET /api/lecturer/lesson-documents?lesson_id=1
========================================================= */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const lessonIdValue =
      searchParams.get('lesson_id');

    /* =====================================================
       VALIDATE LESSON ID
    ===================================================== */

    if (!lessonIdValue) {
      return NextResponse.json(
        {
          success: false,
          message: 'lesson_id is required.',
        },
        { status: 400 }
      );
    }

    const lessonId = Number(lessonIdValue);

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid lesson_id.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK LESSON EXISTS
    ===================================================== */

    const lessonCheck = await pool.query(
      `
        SELECT
          id
        FROM lms_lessons
        WHERE id = $1
        LIMIT 1
      `,
      [lessonId]
    );

    if (lessonCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson not found.',
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
        ORDER BY
          created_at ASC,
          id ASC
      `,
      [lessonId]
    );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        documents: result.rows,
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error(
      'LECTURER LESSON DOCUMENTS GET ERROR:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to load lesson documents.';

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}


/* =========================================================
   CREATE LESSON DOCUMENT RECORD

   POST /api/lecturer/lesson-documents

   JSON BODY:

   {
     lesson_id,
     title,
     description,
     file_name,
     file_url,
     file_size,
     mime_type,
     status
   }

========================================================= */

export async function POST(request: Request) {
  try {
    /* =====================================================
       READ JSON BODY
    ===================================================== */

    const body = await request.json();

    const {
      lesson_id,
      title,
      description,
      file_name,
      file_url,
      file_size,
      mime_type,
      status,
    } = body;

    /* =====================================================
       CONVERT LESSON ID
    ===================================================== */

    const lessonId = Number(lesson_id);

    /* =====================================================
       CLEAN VALUES
    ===================================================== */

    const cleanTitle =
      typeof title === 'string'
        ? title.trim()
        : '';

    const cleanDescription =
      typeof description === 'string'
        ? description.trim()
        : '';

    const cleanFileName =
      typeof file_name === 'string'
        ? file_name.trim()
        : '';

    const cleanFileUrl =
      typeof file_url === 'string'
        ? file_url.trim()
        : '';

    const cleanMimeType =
      typeof mime_type === 'string'
        ? mime_type.trim()
        : 'application/octet-stream';

    const cleanStatus =
      typeof status === 'string'
        ? status.trim().toLowerCase()
        : 'active';

    /* =====================================================
       VALIDATE LESSON ID
    ===================================================== */

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid lesson_id is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE TITLE
    ===================================================== */

    if (!cleanTitle) {
      return NextResponse.json(
        {
          success: false,
          message: 'Material title is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE FILE URL
    ===================================================== */

    if (!cleanFileUrl) {
      return NextResponse.json(
        {
          success: false,
          message: 'Document file URL is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE FILE NAME
    ===================================================== */

    if (!cleanFileName) {
      return NextResponse.json(
        {
          success: false,
          message: 'Document file name is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE STATUS
    ===================================================== */

    const validStatuses = [
      'active',
      'inactive',
    ];

    const finalStatus =
      validStatuses.includes(cleanStatus)
        ? cleanStatus
        : 'active';

    /* =====================================================
       VALIDATE FILE SIZE
    ===================================================== */

    let finalFileSize: number | null = null;

    if (
      file_size !== null &&
      file_size !== undefined &&
      file_size !== ''
    ) {
      const parsedFileSize =
        Number(file_size);

      if (
        !Number.isFinite(parsedFileSize) ||
        parsedFileSize < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid file size.',
          },
          { status: 400 }
        );
      }

      finalFileSize =
        Math.trunc(parsedFileSize);
    }

    /* =====================================================
       CHECK LESSON EXISTS
    ===================================================== */

    const lessonCheck =
      await pool.query(
        `
          SELECT
            id
          FROM lms_lessons
          WHERE id = $1
          LIMIT 1
        `,
        [lessonId]
      );

    if (
      lessonCheck.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       INSERT DOCUMENT

       This matches the form fields:

       lesson_id
       title
       description
       file_name
       file_url
       file_size
       mime_type
       status
    ===================================================== */

    const result =
      await pool.query(
        `
          INSERT INTO lms_lesson_documents
          (
            lesson_id,
            title,
            description,
            file_name,
            file_url,
            file_size,
            mime_type,
            status
          )
          VALUES
          (
            $1,
            $2,
            $3,
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
          cleanTitle,
          cleanDescription || null,
          cleanFileName,
          cleanFileUrl,
          finalFileSize,
          cleanMimeType,
          finalStatus,
        ]
      );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          'Lesson material created successfully.',
        document:
          result.rows[0],
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error(
      'LECTURER LESSON DOCUMENTS POST ERROR:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to create lesson material.';

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}