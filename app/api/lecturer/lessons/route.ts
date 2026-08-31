import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   GET /api/lecturer/lessons?topic_id=4

   Get all lessons belonging to a topic.

   The lecturer can only access lessons under topics
   belonging to units/programs assigned to them.
========================================================= */

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);

    const topicId = Number(
      searchParams.get('topic_id')
    );

    if (!Number.isInteger(topicId) || topicId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid topic ID is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY TOPIC ACCESS
    ===================================================== */

    const topicAccess = await pool.query(
      `
        SELECT
          t.id,
          t.title,
          t.unit_id,
          u.name AS unit_name,
          u.code AS unit_code,
          u.program_id,
          p.name AS course_name,
          p.code AS course_code

        FROM lms_topics t

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_programs p
          ON p.id = u.program_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        WHERE t.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [
        topicId,
        lecturer.id,
      ]
    );

    if (topicAccess.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Topic not found or you are not authorized to access it.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       GET LESSONS
    ===================================================== */

    const result = await pool.query(
      `
        SELECT
          id,
          topic_id,
          title,
          description,
          content,
          order_number,
          status,
          created_at,
          updated_at

        FROM lms_lessons

        WHERE topic_id = $1

        ORDER BY
          order_number ASC,
          title ASC,
          id ASC
      `,
      [topicId]
    );

    return NextResponse.json(
      {
        success: true,

        topic: topicAccess.rows[0],

        lessons: result.rows,

        count: result.rows.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'GET LECTURER LESSONS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load lessons.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST /api/lecturer/lessons

   Create a new lesson.

   Expected body:

   {
     "topic_id": 4,
     "title": "Introduction to Emergency Care",
     "description": "...",
     "content": "...",
     "order_number": 1,
     "status": "active"
   }
========================================================= */

export async function POST(request: Request) {
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

    /* =====================================================
       READ JSON SAFELY
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

    /* =====================================================
       EXTRACT DATA
    ===================================================== */

    const topicId = Number(
      body.topic_id
    );

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : '';

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : '';

    const content =
      typeof body.content === 'string'
        ? body.content.trim()
        : '';

    const orderNumber =
      body.order_number === null ||
      body.order_number === undefined ||
      body.order_number === ''
        ? 1
        : Number(body.order_number);

    const status =
      typeof body.status === 'string' &&
      body.status.trim()
        ? body.status.trim().toLowerCase()
        : 'active';

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !Number.isInteger(topicId) ||
      topicId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid topic is required.',
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson title is required.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(orderNumber) ||
      orderNumber < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Order must be a whole number greater than or equal to 1.',
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
       VERIFY TOPIC BELONGS TO LECTURER
    ===================================================== */

    const topicAccess = await pool.query(
      `
        SELECT
          t.id,
          t.title,
          t.unit_id,
          u.program_id

        FROM lms_topics t

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        WHERE t.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [
        topicId,
        lecturer.id,
      ]
    );

    if (topicAccess.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to add a lesson to this topic.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       CREATE LESSON
    ===================================================== */

    const result = await pool.query(
      `
        INSERT INTO lms_lessons (
          topic_id,
          title,
          description,
          content,
          order_number,
          status
        )

        VALUES (
          $1,
          $2,
          NULLIF($3, ''),
          NULLIF($4, ''),
          $5,
          $6
        )

        RETURNING
          id,
          topic_id,
          title,
          description,
          content,
          order_number,
          status,
          created_at,
          updated_at
      `,
      [
        topicId,
        title,
        description,
        content,
        orderNumber,
        status,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Lesson created successfully.',
        lesson: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'CREATE LECTURER LESSON ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        messagae:
          error instanceof Error
            ? error.message
            : 'Unable to create lesson.',
      },
      { status: 500 }
    );
  }
}