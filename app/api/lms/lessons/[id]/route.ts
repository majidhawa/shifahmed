import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   GET LESSON
   GET /api/lms/lessons/[id]
========================================================= */

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const lessonId = Number(id);

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid lesson ID.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          l.id,
          l.topic_id,
          l.title,
          l.description,
          l.order_number,
          l.status,
          l.created_at,
          l.updated_at,

          t.title AS topic_name,
          t.unit_id,

          u.name AS unit_name,
          u.code AS unit_code,

          p.id AS program_id,
          p.name AS program_name,
          p.code AS program_code

        FROM lms_lessons l

        INNER JOIN lms_topics t
          ON t.id = l.topic_id

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_programs p
          ON p.id = u.program_id

        WHERE l.id = $1

        LIMIT 1
      `,
      [lessonId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lesson: result.rows[0],
    });

  } catch (error: any) {

    console.error(
      'LMS lesson GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load lesson.',
        error: error?.message,
        code: error?.code,
      },
      { status: 500 }
    );
  }
}