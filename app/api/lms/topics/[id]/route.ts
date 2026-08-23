import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   GET TOPIC BY ID
   GET /api/lms/topics/1
========================================================= */

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const topicId = Number(params.id);

    if (!Number.isInteger(topicId) || topicId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid topic ID.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          t.id,
          t.unit_id,
          t.title,
          t.description,
          t.order_number,
          t.status,
          t.created_at,
          t.updated_at,

          u.name AS unit_name,
          u.code AS unit_code,

          p.id AS program_id,
          p.name AS program_name,
          p.code AS program_code

        FROM lms_topics t

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_programs p
          ON p.id = u.program_id

        WHERE t.id = $1

        LIMIT 1
      `,
      [topicId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Topic not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      topic: result.rows[0],
    });
  } catch (error: any) {
    console.error(
      'LMS topic GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load topic.',
        error: error?.message,
        code: error?.code,
      },
      { status: 500 }
    );
  }
}