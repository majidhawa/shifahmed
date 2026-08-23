import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   GET SINGLE PROGRAM
========================================================= */

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const programId = Number(id);

    if (!Number.isInteger(programId) || programId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid program ID.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          p.id,
          p.name,
          p.code,
          p.description,
          p.duration,
          p.level,
          p.status,
          p.created_at,
          COUNT(u.id)::int AS unit_count
        FROM lms_programs p
        LEFT JOIN lms_units u
          ON u.program_id = p.id
          AND u.status = 'active'
        WHERE p.id = $1
        GROUP BY
          p.id,
          p.name,
          p.code,
          p.description,
          p.duration,
          p.level,
          p.status,
          p.created_at
      `,
      [programId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Program not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      program: result.rows[0],
    });
  } catch (error) {
    console.error('LMS single program GET error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load program.',
      },
      { status: 500 }
    );
  }
}