import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   GET SINGLE UNIT
========================================================= */

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const unitId = Number(id);

    if (!Number.isInteger(unitId) || unitId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid unit ID.',
        },
        { status: 400 }
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
          p.name AS program_name,
          p.code AS program_code
        FROM lms_units u
        INNER JOIN lms_programs p
          ON p.id = u.program_id
        WHERE u.id = $1
      `,
      [unitId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unit not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      unit: result.rows[0],
    });
  } catch (error: any) {
    console.error('LMS single unit GET error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load unit.',
        error: error?.message || String(error),
        code: error?.code || null,
      },
      { status: 500 }
    );
  }
}