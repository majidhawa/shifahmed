import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   GET ONE QUIZ
========================================================= */

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const quizId = Number(id);

    if (!Number.isInteger(quizId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid quiz ID.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        q.id,
        q.lesson_id,
        q.title,
        q.description,
        q.instructions,
        q.total_marks,
        q.time_limit_minutes,
        q.attempts_allowed,
        q.passing_score,
        q.status,
        q.shuffle_questions,
        q.shuffle_options,
        q.show_results,
        q.show_correct_answers,
        q.available_from,
        q.available_until,
        q.created_at,
        q.updated_at,

        COUNT(qq.id)::integer AS question_count

      FROM lms_quizzes q

      LEFT JOIN lms_quiz_questions qq
        ON qq.quiz_id = q.id

      WHERE q.id = $1

      GROUP BY q.id
      `,
      [quizId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quiz not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      quiz: result.rows[0],
    });
  } catch (error) {
    console.error('GET quiz error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load quiz.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   UPDATE QUIZ
========================================================= */

export async function PUT(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const quizId = Number(id);

    if (!Number.isInteger(quizId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid quiz ID.',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      lesson_id,
      title,
      description,
      instructions,
      total_marks,
      time_limit_minutes,
      attempts_allowed,
      passing_score,
      status,
      shuffle_questions,
      shuffle_options,
      show_results,
      show_correct_answers,
      available_from,
      available_until,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quiz title is required.',
        },
        { status: 400 }
      );
    }

    if (
      attempts_allowed !== undefined &&
      Number(attempts_allowed) < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Attempts allowed must be at least 1.',
        },
        { status: 400 }
      );
    }

    if (
      time_limit_minutes !== null &&
      time_limit_minutes !== undefined &&
      Number(time_limit_minutes) < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Time limit cannot be negative.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      UPDATE lms_quizzes
      SET
        lesson_id = COALESCE($1, lesson_id),
        title = $2,
        description = $3,
        instructions = $4,
        total_marks = COALESCE($5, total_marks),
        time_limit_minutes = $6,
        attempts_allowed = COALESCE($7, attempts_allowed),
        passing_score = $8,
        status = COALESCE($9, status),
        shuffle_questions = COALESCE($10, shuffle_questions),
        shuffle_options = COALESCE($11, shuffle_options),
        show_results = COALESCE($12, show_results),
        show_correct_answers = COALESCE($13, show_correct_answers),
        available_from = $14,
        available_until = $15,
        updated_at = NOW()

      WHERE id = $16

      RETURNING
        id,
        lesson_id,
        title,
        description,
        instructions,
        total_marks,
        time_limit_minutes,
        attempts_allowed,
        passing_score,
        status,
        shuffle_questions,
        shuffle_options,
        show_results,
        show_correct_answers,
        available_from,
        available_until,
        created_at,
        updated_at
      `,
      [
        lesson_id !== undefined
          ? Number(lesson_id)
          : null,

        title.trim(),

        description?.trim() || null,

        instructions?.trim() || null,

        total_marks !== undefined
          ? Number(total_marks)
          : null,

        time_limit_minutes !== undefined &&
        time_limit_minutes !== ''
          ? Number(time_limit_minutes)
          : null,

        attempts_allowed !== undefined
          ? Number(attempts_allowed)
          : null,

        passing_score !== undefined &&
        passing_score !== ''
          ? Number(passing_score)
          : null,

        status || null,

        shuffle_questions !== undefined
          ? Boolean(shuffle_questions)
          : null,

        shuffle_options !== undefined
          ? Boolean(shuffle_options)
          : null,

        show_results !== undefined
          ? Boolean(show_results)
          : null,

        show_correct_answers !== undefined
          ? Boolean(show_correct_answers)
          : null,

        available_from || null,

        available_until || null,

        quizId,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quiz not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz updated successfully.',
      quiz: result.rows[0],
    });
  } catch (error) {
    console.error('PUT quiz error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update quiz.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE QUIZ
========================================================= */

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const quizId = Number(id);

    if (!Number.isInteger(quizId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid quiz ID.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      DELETE FROM lms_quizzes
      WHERE id = $1
      RETURNING id
      `,
      [quizId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quiz not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully.',
      id: quizId,
    });
  } catch (error) {
    console.error('DELETE quiz error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete quiz.',
      },
      { status: 500 }
    );
  }
}