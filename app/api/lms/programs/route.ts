import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   GET PROGRAMS
========================================================= */

export async function GET() {
  try {
    const result = await pool.query(`
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
      GROUP BY
        p.id,
        p.name,
        p.code,
        p.description,
        p.duration,
        p.level,
        p.status,
        p.created_at
      ORDER BY p.name ASC
    `);

    return NextResponse.json({
      success: true,
      programs: result.rows,
    });
  } catch (error) {
    console.error('LMS programs GET error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load LMS programs.',
      },
      { status: 500 }
    );
  }
}


/* =========================================================
   CREATE PROGRAM
========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || '').trim();
    const code = String(body.code || '').trim();
    const description = String(body.description || '').trim();
    const duration = String(body.duration || '').trim();
    const level = String(body.level || '').trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Program name is required.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        INSERT INTO lms_programs
          (
            name,
            code,
            description,
            duration,
            level
          )
        VALUES
          ($1, $2, $3, $4, $5)
        RETURNING
          id,
          name,
          code,
          description,
          duration,
          level,
          status,
          created_at
      `,
      [
        name,
        code || null,
        description || null,
        duration || null,
        level || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Program created successfully.',
        program: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('LMS program POST error:', error);

    if (error?.code === '23505') {
      return NextResponse.json(
        {
          success: false,
          message: 'A program with this name or code already exists.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create LMS program.',
      },
      { status: 500 }
    );
  }
}