import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   HELPER
   Safely read JSON from a request
========================================================= */

async function getRequestBody(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();

    if (!text.trim()) {
      return null;
    }

    const parsed: unknown = JSON.parse(text);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/* =========================================================
   GET /api/lecturer/units

   Returns only units belonging to programs assigned
   to the authenticated lecturer.
========================================================= */

export async function GET() {
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

    const result = await pool.query(
      `
        SELECT
          u.id,
          u.program_id,
          u.code,
          u.name,
          u.description,
          u.credit_hours,
          u.year_of_study,
          u.term_number,
          u.status,
          u.created_at,
          u.updated_at,

          p.id AS course_id,
          p.name AS course_name,
          p.code AS course_code,

          COUNT(t.id)::int AS topic_count

        FROM lms_units u

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        INNER JOIN lms_programs p
          ON p.id = u.program_id

        LEFT JOIN lms_topics t
          ON t.unit_id = u.id

        WHERE lp.lecturer_id = $1

        GROUP BY
          u.id,
          u.program_id,
          u.code,
          u.name,
          u.description,
          u.credit_hours,
          u.year_of_study,
          u.term_number,
          u.status,
          u.created_at,
          u.updated_at,
          p.id,
          p.name,
          p.code

        ORDER BY
          p.name ASC,
          u.year_of_study ASC NULLS LAST,
          u.term_number ASC NULLS LAST,
          u.name ASC
      `,
      [lecturer.id]
    );

    const coursesMap = new Map<
      number,
      {
        id: number;
        name: string;
        code: string | null;
        units: typeof result.rows;
      }
    >();

    for (const unit of result.rows) {
      const courseId = Number(unit.course_id);

      if (!coursesMap.has(courseId)) {
        coursesMap.set(courseId, {
          id: courseId,
          name: unit.course_name,
          code: unit.course_code,
          units: [],
        });
      }

      coursesMap.get(courseId)!.units.push(unit);
    }

    const courses = Array.from(coursesMap.values());

    return NextResponse.json(
      {
        success: true,

        lecturer: {
          id: lecturer.id,
          name: lecturer.name,
          email: lecturer.email,
        },

        units: result.rows,
        courses,
        count: result.rows.length,
        course_count: courses.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET LECTURER UNITS ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load lecturer units.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST /api/lecturer/units

   Create a new unit.

   Lecturer can only create units under programs
   assigned to that lecturer.
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

    const body = await getRequestBody(request);

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or empty request body.',
        },
        { status: 400 }
      );
    }

    const programId = Number(body.program_id);

    const name =
      typeof body.name === 'string'
        ? body.name.trim()
        : '';

    const code =
      typeof body.code === 'string'
        ? body.code.trim()
        : '';

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : '';

    const creditHours =
      body.credit_hours === null ||
      body.credit_hours === undefined ||
      body.credit_hours === ''
        ? 0
        : Number(body.credit_hours);

    const yearOfStudy =
      body.year_of_study === null ||
      body.year_of_study === undefined ||
      body.year_of_study === ''
        ? 1
        : Number(body.year_of_study);

    const termNumber =
      body.term_number === null ||
      body.term_number === undefined ||
      body.term_number === ''
        ? 1
        : Number(body.term_number);

    const status =
      typeof body.status === 'string' &&
      body.status.trim()
        ? body.status.trim().toLowerCase()
        : 'active';

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !Number.isInteger(programId) ||
      programId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid course is required.',
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unit name is required.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(creditHours) ||
      creditHours < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Credit hours must be a valid number.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(yearOfStudy) ||
      yearOfStudy < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Year of study must be at least 1.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(termNumber) ||
      termNumber < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Term number must be at least 1.',
        },
        { status: 400 }
      );
    }

    if (
      !['active', 'inactive'].includes(status)
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
       VERIFY COURSE ASSIGNMENT
    ===================================================== */

    const assignment = await pool.query(
      `
        SELECT 1
        FROM lms_lecturer_programs
        WHERE lecturer_id = $1
          AND program_id = $2
        LIMIT 1
      `,
      [lecturer.id, programId]
    );

    if (assignment.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not assigned to this course.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       CREATE UNIT
    ===================================================== */

    const result = await pool.query(
      `
        INSERT INTO lms_units (
          program_id,
          code,
          name,
          description,
          credit_hours,
          year_of_study,
          term_number,
          status
        )
        VALUES (
          $1,
          NULLIF($2, ''),
          $3,
          NULLIF($4, ''),
          $5,
          $6,
          $7,
          $8
        )
        RETURNING *
      `,
      [
        programId,
        code,
        name,
        description,
        creditHours,
        yearOfStudy,
        termNumber,
        status,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Course unit created successfully.',
        unit: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'CREATE LECTURER UNIT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to create course unit.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   UPDATE UNIT

   Supports BOTH:

   PUT   /api/lecturer/units
   PATCH /api/lecturer/units

   This fixes the 405 error when the frontend sends PUT.
========================================================= */

async function updateUnit(request: Request) {
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

    const body = await getRequestBody(request);

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or empty request body.',
        },
        { status: 400 }
      );
    }

    const unitId = Number(body.id);
    const programId = Number(body.program_id);

    const name =
      typeof body.name === 'string'
        ? body.name.trim()
        : '';

    const code =
      typeof body.code === 'string'
        ? body.code.trim()
        : '';

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : '';

    const creditHours =
      body.credit_hours === null ||
      body.credit_hours === undefined ||
      body.credit_hours === ''
        ? 0
        : Number(body.credit_hours);

    const yearOfStudy =
      body.year_of_study === null ||
      body.year_of_study === undefined ||
      body.year_of_study === ''
        ? 1
        : Number(body.year_of_study);

    const termNumber =
      body.term_number === null ||
      body.term_number === undefined ||
      body.term_number === ''
        ? 1
        : Number(body.term_number);

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

    if (
      !Number.isInteger(programId) ||
      programId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid course is required.',
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unit name is required.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(creditHours) ||
      creditHours < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Credit hours must be a valid number.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(yearOfStudy) ||
      yearOfStudy < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Year of study must be at least 1.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(termNumber) ||
      termNumber < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Term number must be at least 1.',
        },
        { status: 400 }
      );
    }

    if (
      !['active', 'inactive'].includes(status)
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
       VERIFY CURRENT UNIT BELONGS TO LECTURER
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
            'You are not authorized to edit this unit.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       VERIFY NEW COURSE IS ASSIGNED TO LECTURER
    ===================================================== */

    const assignment = await pool.query(
      `
        SELECT 1
        FROM lms_lecturer_programs
        WHERE lecturer_id = $1
          AND program_id = $2
        LIMIT 1
      `,
      [lecturer.id, programId]
    );

    if (assignment.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not assigned to the selected course.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       UPDATE UNIT
    ===================================================== */

    const result = await pool.query(
      `
        UPDATE lms_units
        SET
          program_id = $1,
          code = NULLIF($2, ''),
          name = $3,
          description = NULLIF($4, ''),
          credit_hours = $5,
          year_of_study = $6,
          term_number = $7,
          status = $8,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $9

        RETURNING *
      `,
      [
        programId,
        code,
        name,
        description,
        creditHours,
        yearOfStudy,
        termNumber,
        status,
        unitId,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unit not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Course unit updated successfully.',
        unit: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'UPDATE LECTURER UNIT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update course unit.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT

   Frontend currently sends PUT.
========================================================= */

export async function PUT(request: Request) {
  return updateUnit(request);
}

/* =========================================================
   PATCH

   Kept for compatibility.
========================================================= */

export async function PATCH(request: Request) {
  return updateUnit(request);
}

/* =========================================================
   DELETE /api/lecturer/units

   Supports:

   DELETE /api/lecturer/units?id=123

   OR

   DELETE /api/lecturer/units
   Body: { "id": 123 }
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
       GET UNIT ID FROM QUERY STRING
    ===================================================== */

    const { searchParams } = new URL(
      request.url
    );

    const queryId = searchParams.get('id');

    let unitId: number | null = null;

    if (queryId) {
      const parsedQueryId = Number(queryId);

      if (
        Number.isInteger(parsedQueryId) &&
        parsedQueryId > 0
      ) {
        unitId = parsedQueryId;
      }
    }

    /* =====================================================
       IF QUERY ID IS NOT PROVIDED,
       READ ID FROM JSON BODY
    ===================================================== */

    if (unitId === null) {
      const body = await getRequestBody(request);

      const bodyId = Number(body?.id);

      if (
        Number.isInteger(bodyId) &&
        bodyId > 0
      ) {
        unitId = bodyId;
      }
    }

    /* =====================================================
       VALIDATE UNIT ID
    ===================================================== */

    if (unitId === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A valid unit ID is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY LECTURER OWNS UNIT
    ===================================================== */

    const ownership = await pool.query(
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
      [unitId, lecturer.id]
    );

    if (ownership.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to delete this unit.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       CHECK WHETHER UNIT HAS TOPICS
    ===================================================== */

    const topics = await pool.query(
      `
        SELECT COUNT(*)::int AS count
        FROM lms_topics
        WHERE unit_id = $1
      `,
      [unitId]
    );

    const topicCount = Number(
      topics.rows[0]?.count ?? 0
    );

    if (topicCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            `This unit cannot be deleted because it contains ${topicCount} ${
              topicCount === 1
                ? 'topic'
                : 'topics'
            }. Delete or move the topics first.`,
          topic_count: topicCount,
        },
        { status: 409 }
      );
    }

    /* =====================================================
       DELETE UNIT
    ===================================================== */

    const result = await pool.query(
      `
        DELETE FROM lms_units
        WHERE id = $1
        RETURNING id, name
      `,
      [unitId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unit not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Course unit deleted successfully.',
        id: unitId,
        unit: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'DELETE LECTURER UNIT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to delete course unit.',
      },
      { status: 500 }
    );
  }
}