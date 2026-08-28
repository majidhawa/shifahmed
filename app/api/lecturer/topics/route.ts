import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   GET /api/lecturer/topics?unit_id=123

   Returns all topics belonging to a unit.

   The lecturer must be assigned to the course/program
   that owns the unit.
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

    const unitIdParam = searchParams.get('unit_id');

    const unitId = Number(unitIdParam);

    if (!Number.isInteger(unitId) || unitId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid unit ID is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY UNIT BELONGS TO LECTURER'S ASSIGNED COURSE
    ===================================================== */

    const ownership = await pool.query(
      `
        SELECT
          u.id,
          u.name,
          u.code,
          u.program_id,
          p.name AS course_name,
          p.code AS course_code

        FROM lms_units u

        INNER JOIN lms_programs p
          ON p.id = u.program_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        WHERE u.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [unitId, lecturer.id]
    );

    if (ownership.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to access topics for this unit.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       GET TOPICS
    ===================================================== */

    const result = await pool.query(
      `
        SELECT
          id,
          unit_id,
          title,
          description,
          order_number,
          status,
          created_at,
          updated_at

        FROM lms_topics

        WHERE unit_id = $1

        ORDER BY
          order_number ASC,
          id ASC
      `,
      [unitId]
    );

    return NextResponse.json(
      {
        success: true,

        unit: {
          id: ownership.rows[0].id,
          name: ownership.rows[0].name,
          code: ownership.rows[0].code,
          program_id: ownership.rows[0].program_id,
          course_name: ownership.rows[0].course_name,
          course_code: ownership.rows[0].course_code,
        },

        topics: result.rows,
        count: result.rows.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'GET LECTURER TOPICS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load topics.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST /api/lecturer/topics

   Create a topic under a unit.

   Body:

   {
     "unit_id": 1,
     "title": "Introduction to Emergency Care",
     "description": "...",
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

    const unitId = Number(body.unit_id);

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : '';

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : '';

    const orderNumber =
      body.order_number === undefined ||
      body.order_number === null ||
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

    if (!Number.isInteger(unitId) || unitId <= 0) {
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
            'Order number must be a whole number greater than 0.',
        },
        { status: 400 }
      );
    }

    if (!['active', 'inactive'].includes(status)) {
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
       VERIFY UNIT OWNERSHIP
    ===================================================== */

    const ownership = await pool.query(
      `
        SELECT
          u.id,
          u.program_id

        FROM lms_units u

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        WHERE u.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [unitId, lecturer.id]
    );

    if (ownership.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to add a topic to this unit.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       CREATE TOPIC
    ===================================================== */

    const result = await pool.query(
      `
        INSERT INTO lms_topics (
          unit_id,
          title,
          description,
          order_number,
          status
        )

        VALUES (
          $1,
          $2,
          NULLIF($3, ''),
          $4,
          $5
        )

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
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Topic created successfully.',
        topic: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'CREATE LECTURER TOPIC ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to create topic.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH /api/lecturer/topics

   Update an existing topic.

   Body:

   {
     "id": 1,
     "unit_id": 1,
     "title": "...",
     "description": "...",
     "order_number": 2,
     "status": "active"
   }
========================================================= */

export async function PATCH(request: Request) {
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

    const topicId = Number(body.id);

    const unitId = Number(body.unit_id);

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : '';

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : '';

    const orderNumber =
      body.order_number === undefined ||
      body.order_number === null ||
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
          message: 'A valid topic ID is required.',
        },
        { status: 400 }
      );
    }

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
            'Order number must be a whole number greater than 0.',
        },
        { status: 400 }
      );
    }

    if (!['active', 'inactive'].includes(status)) {
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

    const ownership = await pool.query(
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
      [topicId, lecturer.id]
    );

    if (ownership.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to edit this topic.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       VERIFY NEW UNIT IS ALSO ASSIGNED
    ===================================================== */

    const unitOwnership = await pool.query(
      `
        SELECT 1

        FROM lms_units u

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        WHERE u.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [unitId, lecturer.id]
    );

    if (unitOwnership.rowCount === 0) {
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
       UPDATE TOPIC
    ===================================================== */

    const result = await pool.query(
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

    return NextResponse.json(
      {
        success: true,
        message: 'Topic updated successfully.',
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
   DELETE /api/lecturer/topics

   Supports:

   DELETE /api/lecturer/topics?id=123

   OR

   DELETE /api/lecturer/topics
   Body:
   {
     "id": 123
   }
========================================================= */

export async function DELETE(request: Request) {
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
       GET TOPIC ID FROM QUERY STRING
    ===================================================== */

    const { searchParams } = new URL(request.url);

    const queryId = searchParams.get('id');

    let topicId: number | null = null;

    if (queryId) {
      const parsedQueryId = Number(queryId);

      if (
        Number.isInteger(parsedQueryId) &&
        parsedQueryId > 0
      ) {
        topicId = parsedQueryId;
      }
    }

    /* =====================================================
       IF QUERY ID DOES NOT EXIST,
       TRY JSON BODY
    ===================================================== */

    if (topicId === null) {
      try {
        const body = await request.json();

        const bodyId = Number(body?.id);

        if (
          Number.isInteger(bodyId) &&
          bodyId > 0
        ) {
          topicId = bodyId;
        }
      } catch {
        /*
         * DELETE may not contain JSON.
         */
      }
    }

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

    const ownership = await pool.query(
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
      [topicId, lecturer.id]
    );

    if (ownership.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to delete this topic.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       DELETE TOPIC
    ===================================================== */

    const result = await pool.query(
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
        message: 'Topic deleted successfully.',
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