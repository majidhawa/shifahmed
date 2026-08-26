import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   GET /api/lecturer/units

   Returns only units belonging to courses/programs
   assigned to the currently authenticated lecturer.

   Relationship:

   users
      ↓
   lms_lecturer_programs
      ↓
   lms_programs
      ↓
   lms_units
========================================================= */

export async function GET() {
  try {
    /* =====================================================
       LECTURER AUTHENTICATION
    ===================================================== */

    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       GET LECTURER UNITS
    ===================================================== */

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

          /* PROGRAM INFORMATION */

          p.id AS course_id,
          p.name AS course_name,
          p.code AS course_code,

          /* COUNT TOPICS */

          COUNT(t.id)::int AS topic_count

        FROM lms_units u

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        INNER JOIN lms_programs p
          ON p.id = u.program_id

        LEFT JOIN lms_topics t
          ON t.unit_id = u.id

        WHERE
          lp.lecturer_id = $1

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

    /* =====================================================
       GROUP UNITS BY COURSE
    ===================================================== */

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

    const courses = Array.from(
      coursesMap.values()
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

        units: result.rows,

        courses,

        count: result.rows.length,

        course_count: courses.length,
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error(
      'GET LECTURER UNITS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : 'Unable to load lecturer units.',
      },
      {
        status: 500,
      }
    );
  }
}