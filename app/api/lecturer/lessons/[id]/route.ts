
import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   GET /api/lecturer/lessons/[id]

   Get one lesson belonging to the logged-in lecturer.
========================================================= */

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
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

    const { id } = await context.params;

    const lessonId = Number(id);

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid lesson ID is required.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          l.id,
          l.topic_id,
          l.title,
          l.description,
          l.content,
          l.order_number,
          l.status,
          l.created_at,
          l.updated_at,

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
      [
        lessonId,
        lecturer.id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Lesson not found or you are not authorized to access it.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        lesson: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'GET LECTURER LESSON ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load lesson.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH /api/lecturer/lessons/[id]

   Update lesson.
========================================================= */

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
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

    const { id } = await context.params;

    const lessonId = Number(id);

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid lesson ID is required.',
        },
        { status: 400 }
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

    const content =
      typeof body.content === 'string'
        ? body.content.trim()
        : '';

    const topicId = Number(body.topic_id);

    const orderNumber =
      body.order_number === undefined ||
      body.order_number === null ||
      body.order_number === ''
        ? 1
        : Number(body.order_number);

    const status =
      typeof body.status === 'string'
        ? body.status.trim().toLowerCase()
        : 'active';

    /* =====================================================
       VALIDATION
    ===================================================== */

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
       VERIFY LESSON OWNERSHIP
    ===================================================== */

    const ownership =
      await pool.query(
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
        [
          lessonId,
          lecturer.id,
        ]
      );

    if (ownership.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Lesson not found or you are not authorized to edit it.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       VERIFY TOPIC ACCESS
    ===================================================== */

    const topicAccess =
      await pool.query(
        `
          SELECT
            t.id,
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
            'You are not authorized to use the selected topic.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       UPDATE LESSON
    ===================================================== */

    const result =
      await pool.query(
        `
          UPDATE lms_lessons

          SET
            topic_id = $1,
            title = $2,
            description = NULLIF($3, ''),
            content = NULLIF($4, ''),
            order_number = $5,
            status = $6,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $7

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
          lessonId,
        ]
      );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Lesson updated successfully.',
        lesson: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'UPDATE LECTURER LESSON ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update lesson.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE /api/lecturer/lessons/[id]
========================================================= */

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
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

    const { id } = await context.params;

    const lessonId = Number(id);

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid lesson ID is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY OWNERSHIP
    ===================================================== */

    const ownership =
      await pool.query(
        `
          SELECT
            l.id,
            l.title,
            l.topic_id

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
        [
          lessonId,
          lecturer.id,
        ]
      );

    if (ownership.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Lesson not found or you are not authorized to delete it.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       DELETE
    ===================================================== */

    const result =
      await pool.query(
        `
          DELETE FROM lms_lessons
          WHERE id = $1
          RETURNING
            id,
            title,
            topic_id
        `,
        [lessonId]
      );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Lesson deleted successfully.',
        lesson: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'DELETE LECTURER LESSON ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to delete lesson.',
      },
      { status: 500 }
    );
  }
}

