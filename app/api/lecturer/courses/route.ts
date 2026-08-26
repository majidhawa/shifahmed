import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   GET /api/lecturer/courses

   Returns only the courses assigned to the
   currently authenticated lecturer.

   DATABASE RELATIONSHIP:

   users
      ↓
   lms_lecturer_programs
      ↓
   lms_programs
========================================================= */

export async function GET() {
  try {
    /* =====================================================
       GET CURRENT LECTURER FROM SESSION
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
       VERIFY LECTURER IN USERS TABLE

       The lecturer ID comes directly from
       the authenticated lecturer session.
    ===================================================== */

    const lecturerResult = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          phone,
          role,
          active
        FROM users
        WHERE id = $1
          AND role = 'lecturer'
          AND active = TRUE
        LIMIT 1
      `,
      [lecturer.id]
    );

    if (lecturerResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Lecturer account was not found or is inactive.',
        },
        {
          status: 401,
        }
      );
    }

    const currentLecturer =
      lecturerResult.rows[0];

    /* =====================================================
       GET ASSIGNED COURSES

       IMPORTANT:
       The correct table is:

       lms_lecturer_programs

       NOT:

       lecturer_programs
    ===================================================== */

    const coursesResult = await pool.query(
      `
        SELECT
          lp.id AS assignment_id,

          p.id,
          p.name,
          p.code,
          p.description,
          p.duration,
          p.level,
          p.status,

          lp.assigned_at,
          lp.updated_at AS assignment_updated_at

        FROM lms_lecturer_programs lp

        INNER JOIN lms_programs p
          ON p.id = lp.program_id

        WHERE lp.lecturer_id = $1

        ORDER BY p.name ASC
      `,
      [currentLecturer.id]
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        lecturer: {
          id: currentLecturer.id,
          name: currentLecturer.name,
          email: currentLecturer.email,
          phone: currentLecturer.phone,
          role: currentLecturer.role,
        },

        courses: coursesResult.rows,

        count: coursesResult.rows.length,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET LECTURER COURSES ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load lecturer courses.',
      },
      {
        status: 500,
      }
    );
  }
}