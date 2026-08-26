
import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   GET /api/lecturer/units/[id]

   Returns one unit belonging to a course assigned
   to the currently authenticated lecturer.

   Relationship:

   users
      ↓
   lms_lecturer_programs
      ↓
   lms_programs
      ↓
   lms_units
      ↓
   lms_topics
========================================================= */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    /* =====================================================
       AUTHENTICATE LECTURER
    ===================================================== */

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
       GET UNIT ID
    ===================================================== */

    const { id } = await context.params;

    const unitId = Number(id);

    if (
      !Number.isInteger(unitId) ||
      unitId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid unit ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GET UNIT

       IMPORTANT:
       The lecturer must be assigned to the program
       containing this unit.
    ===================================================== */

    const unitResult = await pool.query(
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
          p.description AS course_description,
          p.duration AS course_duration,
          p.level AS course_level,
          p.status AS course_status

        FROM lms_units u

        INNER JOIN lms_programs p
          ON p.id = u.program_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = p.id

        WHERE
          u.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [
        unitId,
        lecturer.id,
      ]
    );

    /* =====================================================
       UNIT NOT FOUND
    ===================================================== */

    if (unitResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unit not found or you are not assigned to this course.',
        },
        { status: 404 }
      );
    }

    const unit =
      unitResult.rows[0];

    /* =====================================================
       GET TOPICS
    ===================================================== */

    const topicsResult =
      await pool.query(
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

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        lecturer: {
          id: lecturer.id,
          name: lecturer.name,
          email: lecturer.email,
        },

        unit: {
          id: unit.id,
          program_id: unit.program_id,

          code: unit.code,
          name: unit.name,
          description: unit.description,

          credit_hours:
            unit.credit_hours,

          year_of_study:
            unit.year_of_study,

          term_number:
            unit.term_number,

          status: unit.status,

          created_at:
            unit.created_at,

          updated_at:
            unit.updated_at,

          course: {
            id: unit.course_id,
            name: unit.course_name,
            code: unit.course_code,
            description:
              unit.course_description,
            duration:
              unit.course_duration,
            level:
              unit.course_level,
            status:
              unit.course_status,
          },

          topics:
            topicsResult.rows,

          topic_count:
            topicsResult.rows.length,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      'GET LECTURER UNIT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load unit.',
      },
      { status: 500 }
    );
  }
}

