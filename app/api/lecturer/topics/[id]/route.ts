import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   HELPERS
========================================================= */

function getTopicId(
  params: { id: string }
): number | null {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

/* =========================================================
   GET /api/lecturer/topics/[id]

   Get a single topic.

   The topic must belong to a unit that belongs to a
   course/program assigned to the authenticated lecturer.
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

    const topicId = getTopicId(
      context.params
    );

    if (topicId === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid topic ID is required.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          t.id,
          t.unit_id,
          t.title,
          t.description,
          t.order_number,
          t.status,
          t.created_at,
          t.updated_at,

          u.code AS unit_code,
          u.name AS unit_name,

          p.id AS course_id,
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

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Topic not found or you are not authorized to access it.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        topic: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'GET LECTURER TOPIC ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load topic.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH /api/lecturer/topics/[id]

   Update an existing topic.

   Expected body:

   {
     "unit_id": 6,
     "title": "Introduction to Emergency Care",
     "description": "...",
     "order_number": 1,
     "status": "active"
   }
========================================================= */

export async function PATCH(
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

    /* =====================================================
       GET TOPIC ID
    ===================================================== */

    const topicId = getTopicId(
      context.params
    );

    if (topicId === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid topic ID is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       READ JSON BODY SAFELY
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

    const unitId = Number(
      body.unit_id
    );

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : '';

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
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
      !Number.isInteger(unitId) ||
      unitId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid unit is required.',
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Topic title is required.',
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
       VERIFY EXISTING TOPIC

       This checks both:
       1. Topic exists
       2. Lecturer owns the program containing its unit
    ===================================================== */

    const ownership =
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

    if (ownership.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Topic not found or you are not authorized to edit it.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       VERIFY SELECTED UNIT

       This prevents a lecturer from moving a topic into
       another unit that they do not have access to.
    ===================================================== */

    const unitAccess =
      await pool.query(
        `
          SELECT
            u.id,
            u.name,
            u.program_id
          FROM lms_units u

          INNER JOIN lms_lecturer_programs lp
            ON lp.program_id = u.program_id

          WHERE u.id = $1
            AND lp.lecturer_id = $2

          LIMIT 1
        `,
        [
          unitId,
          lecturer.id,
        ]
      );

    if (unitAccess.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not assigned to the selected unit.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       OPTIONAL DUPLICATE ORDER CHECK

       We allow the same order number for now because this
       gives the lecturer flexibility when reorganizing topics.
    ===================================================== */

    /* =====================================================
       UPDATE TOPIC
    ===================================================== */

    const result =
      await pool.query(
        `
          UPDATE lms_topics
          SET
            unit_id = $1,
            title = $2,
            description = NULLIF($3, ''),
            order_number = $4,
            status = $5,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $6

          RETURNING
            id,
            unit_id,
            title,
            description,
            order_number,
            status,
            created_at,
            updated_at
        `,
        [
          unitId,
          title,
          description,
          orderNumber,
          status,
          topicId,
        ]
      );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Topic not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          'Topic updated successfully.',
        topic: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'UPDATE LECTURER TOPIC ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update topic.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE /api/lecturer/topics/[id]

   Delete a topic.

   The lecturer must own the program containing the unit.
========================================================= */

export async function DELETE(
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

    const topicId = getTopicId(
      context.params
    );

    if (topicId === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid topic ID is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY TOPIC OWNERSHIP
    ===================================================== */

    const ownership =
      await pool.query(
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

    if (ownership.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Topic not found or you are not authorized to delete it.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       DELETE TOPIC

       At this stage we only delete the topic itself.
       Once lessons/materials are implemented, this can
       be expanded to protect topics containing content.
    ===================================================== */

    const result =
      await pool.query(
        `
          DELETE FROM lms_topics
          WHERE id = $1
          RETURNING
            id,
            title,
            unit_id
        `,
        [topicId]
      );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Topic not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Topic deleted successfully.',
        topic: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'DELETE LECTURER TOPIC ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to delete topic.',
      },
      { status: 500 }
    );
  }
}