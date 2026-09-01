import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   GET /api/lecturer/programs

   Returns programs assigned to the currently authenticated
   lecturer together with their LMS units.
========================================================= */

export async function GET() {
  try {
    /* =====================================================
       GET CURRENT LECTURER
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
       VERIFY LECTURER
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
          message: 'Lecturer account was not found or is inactive.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       GET ASSIGNED PROGRAMS

       lecturer
          ↓
       lms_lecturer_programs
          ↓
       lms_programs
          ↓
       lms_units
    ===================================================== */

    const result = await pool.query(
      `
        SELECT
          p.id AS program_id,
          p.name AS program_name,
          p.code AS program_code,
          p.description AS program_description,
          p.duration AS program_duration,
          p.level AS program_level,
          p.status AS program_status,

          u.id AS unit_id,
          u.code AS unit_code,
          u.name AS unit_name,
          u.description AS unit_description,
          u.credit_hours,
          u.year_of_study,
          u.term_number,
          u.status AS unit_status

        FROM lms_lecturer_programs lp

        INNER JOIN lms_programs p
          ON p.id = lp.program_id

        LEFT JOIN lms_units u
          ON u.program_id = p.id
          AND u.status = 'active'

        WHERE lp.lecturer_id = $1
          AND p.status = 'active'

        ORDER BY
          p.name ASC,
          u.year_of_study ASC,
          u.term_number ASC,
          u.name ASC
      `,
      [lecturer.id]
    );

    /* =====================================================
       GROUP PROGRAMS WITH THEIR UNITS
    ===================================================== */

    const programsMap = new Map<number, any>();

    for (const row of result.rows) {
      if (!programsMap.has(row.program_id)) {
        programsMap.set(row.program_id, {
          id: row.program_id,
          name: row.program_name,
          code: row.program_code,
          description: row.program_description,
          duration: row.program_duration,
          level: row.program_level,
          status: row.program_status,
          units: [],
        });
      }

      if (row.unit_id) {
        programsMap.get(row.program_id).units.push({
          id: row.unit_id,
          code: row.unit_code,
          name: row.unit_name,
          description: row.unit_description,
          credit_hours: row.credit_hours,
          year_of_study: row.year_of_study,
          term_number: row.term_number,
          status: row.unit_status,
        });
      }
    }

    const programs = Array.from(programsMap.values());

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
          phone: lecturer.phone,
        },

        programs,

        count: programs.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'GET LECTURER PROGRAMS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load lecturer programs.',
      },
      { status: 500 }
    );
  }
}