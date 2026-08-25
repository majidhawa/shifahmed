import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   GET QUIZZES
   GET /api/lms/quizzes?lesson_id=1
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const lessonId =
      searchParams.get('lesson_id');

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          message: 'lesson_id is required.',
        },
        { status: 400 }
      );
    }

    const lessonIdNumber =
      Number(lessonId);

    if (
      !Number.isInteger(lessonIdNumber) ||
      lessonIdNumber <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid lesson_id.',
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

      WHERE q.lesson_id = $1

      GROUP BY q.id

      ORDER BY q.created_at DESC
      `,
      [lessonIdNumber]
    );

    return NextResponse.json({
      success: true,
      quizzes: result.rows,
    });

  } catch (error) {
    console.error(
      'GET quizzes error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load quizzes.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST QUIZ
   POST /api/lms/quizzes
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

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

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!lesson_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'lesson_id is required.',
        },
        { status: 400 }
      );
    }

    if (
      !title ||
      typeof title !== 'string' ||
      !title.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quiz title is required.',
        },
        { status: 400 }
      );
    }

    const lessonIdNumber =
      Number(lesson_id);

    if (
      !Number.isInteger(lessonIdNumber) ||
      lessonIdNumber <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid lesson_id.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY LESSON EXISTS
    ===================================================== */

    const lessonResult =
      await pool.query(
        `
        SELECT id
        FROM lms_lessons
        WHERE id = $1
        LIMIT 1
        `,
        [lessonIdNumber]
      );

    if (lessonResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       NORMALIZE VALUES
    ===================================================== */

    const totalMarksNumber =
      total_marks === undefined ||
      total_marks === null ||
      total_marks === ''
        ? 0
        : Number(total_marks);

    const timeLimitNumber =
      time_limit_minutes === undefined ||
      time_limit_minutes === null ||
      time_limit_minutes === ''
        ? null
        : Number(time_limit_minutes);

    const attemptsNumber =
      attempts_allowed === undefined ||
      attempts_allowed === null ||
      attempts_allowed === ''
        ? 1
        : Number(attempts_allowed);

    const passingScoreNumber =
      passing_score === undefined ||
      passing_score === null ||
      passing_score === ''
        ? null
        : Number(passing_score);

    /* =====================================================
       NUMERIC VALIDATION
    ===================================================== */

    if (
      !Number.isFinite(totalMarksNumber) ||
      totalMarksNumber < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid total marks.',
        },
        { status: 400 }
      );
    }

    if (
      timeLimitNumber !== null &&
      (!Number.isFinite(timeLimitNumber) ||
        timeLimitNumber <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Time limit must be greater than zero.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(attemptsNumber) ||
      attemptsNumber < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Attempts allowed must be at least 1.',
        },
        { status: 400 }
      );
    }

    if (
      passingScoreNumber !== null &&
      (!Number.isFinite(
        passingScoreNumber
      ) ||
        passingScoreNumber < 0 ||
        passingScoreNumber > 100)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Passing score must be between 0 and 100.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       STATUS VALIDATION
    ===================================================== */

    const validStatuses = [
      'draft',
      'active',
      'closed',
    ];

    const quizStatus =
      validStatuses.includes(status)
        ? status
        : 'draft';

    /* =====================================================
       CREATE QUIZ
    ===================================================== */

    const result =
      await pool.query(
        `
        INSERT INTO lms_quizzes (
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
          available_until
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15
        )

        RETURNING *
        `,
        [
          lessonIdNumber,
          title.trim(),
          description?.trim() || null,
          instructions?.trim() || null,
          totalMarksNumber,
          timeLimitNumber,
          attemptsNumber,
          passingScoreNumber,
          quizStatus,
          Boolean(shuffle_questions),
          Boolean(shuffle_options),
          show_results !== false,
          Boolean(show_correct_answers),
          available_from || null,
          available_until || null,
        ]
      );

    return NextResponse.json(
      {
        success: true,
        message: 'Quiz created successfully.',
        quiz: {
          ...result.rows[0],
          question_count: 0,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(
      'POST quiz error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create quiz.',
      },
      { status: 500 }
    );
  }
}