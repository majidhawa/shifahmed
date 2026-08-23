import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   GET UNITS
   Example:
   /api/lms/units?program_id=1
========================================================= */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const programIdParam = searchParams.get('program_id');

    if (!programIdParam) {
      return NextResponse.json(
        {
          success: false,
          message: 'program_id is required.',
        },
        { status: 400 }
      );
    }

    const programId = Number(programIdParam);

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
          id,
          program_id,
          code,
          name,
          description,
          credit_hours,
          year_of_study,
          term_number,
          status,
          created_at,
          updated_at
        FROM lms_units
        WHERE program_id = $1
        ORDER BY
          year_of_study ASC,
          term_number ASC,
          name ASC
      `,
      [programId]
    );

    return NextResponse.json({
      success: true,
      units: result.rows,
    });
  } catch (error: any) {
    console.error('LMS units GET error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load units.',
        error: error?.message || String(error),
        code: error?.code || null,
      },
      { status: 500 }
    );
  }
}


/* =========================================================
   CREATE UNIT
========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const programId = Number(body.program_id);
    const name = String(body.name || '').trim();
    const code = String(body.code || '').trim();
    const description = String(body.description || '').trim();

    const creditHours =
      body.credit_hours === undefined ||
      body.credit_hours === ''
        ? 0
        : Number(body.credit_hours);

    const yearOfStudy =
      body.year_of_study === undefined ||
      body.year_of_study === ''
        ? 1
        : Number(body.year_of_study);

    const termNumber =
      body.term_number === undefined ||
      body.term_number === ''
        ? 1
        : Number(body.term_number);

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!Number.isInteger(programId) || programId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid program_id is required.',
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
      !Number.isInteger(creditHours) ||
      creditHours < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credit hours must be 0 or greater.',
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
          message: 'Year of study must be 1 or greater.',
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
          message: 'Term number must be 1 or greater.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY PROGRAM EXISTS
    ===================================================== */

    const programCheck = await pool.query(
      `
        SELECT id
        FROM lms_programs
        WHERE id = $1
      `,
      [programId]
    );

    if (programCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Program not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       CREATE UNIT
    ===================================================== */

    const result = await pool.query(
      `
        INSERT INTO lms_units
        (
          program_id,
          code,
          name,
          description,
          credit_hours,
          year_of_study,
          term_number
        )
        VALUES
        ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          program_id,
          code,
          name,
          description,
          credit_hours,
          year_of_study,
          term_number,
          status,
          created_at,
          updated_at
      `,
      [
        programId,
        code || null,
        name,
        description || null,
        creditHours,
        yearOfStudy,
        termNumber,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Unit created successfully.',
        unit: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('LMS unit POST error:', error);

    if (error?.code === '23505') {
      return NextResponse.json(
        {
          success: false,
          message:
            'A unit with this name already exists in this program.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create LMS unit.',
        error: error?.message || String(error),
        code: error?.code || null,
      },
      { status: 500 }
    );
  }
}