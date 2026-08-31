import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   HELPERS
========================================================= */

function parseId(value: string) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function cleanString(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();

  return text.length > 0 ? text : null;
}

function parseBoolean(
  value: unknown,
  fallback: boolean
) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value
      .trim()
      .toLowerCase();

    if (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'on' ||
      normalized === 'yes'
    ) {
      return true;
    }

    if (
      normalized === 'false' ||
      normalized === '0' ||
      normalized === 'off' ||
      normalized === 'no'
    ) {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  return fallback;
}

/* =========================================================
   GET SINGLE QUIZ
========================================================= */

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       QUIZ ID
    ===================================================== */

    const { id } = await context.params;

    const quizId = parseId(id);

    if (!quizId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid quiz ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GET QUIZ
       
       Lecturer can only access quizzes belonging to
       programs assigned to them.
    ===================================================== */

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

          l.id AS lesson_id_ref,
          l.title AS lesson_title,

          t.id AS topic_id,
          t.title AS topic_title,

          u.id AS unit_id,
          u.code AS unit_code,
          u.name AS unit_name,

          p.id AS program_id,
          p.name AS program_name

        FROM lms_quizzes q

        INNER JOIN lms_lessons l
          ON l.id = q.lesson_id

        INNER JOIN lms_topics t
          ON t.id = l.topic_id

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_programs p
          ON p.id = u.program_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = p.id
          AND lp.lecturer_id = $2

        WHERE q.id = $1

        LIMIT 1
      `,
      [quizId, lecturer.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Quiz not found or you do not have permission to access it.',
        },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      quiz: {
        id: Number(row.id),

        lessonId: Number(row.lesson_id),

        title: row.title,

        description:
          row.description ?? null,

        instructions:
          row.instructions ?? null,

        totalMarks:
          Number(row.total_marks) || 0,

        timeLimitMinutes:
          Number(row.time_limit_minutes) || 0,

        attemptsAllowed:
          Number(row.attempts_allowed) || 1,

        passingScore:
          Number(row.passing_score) || 0,

        status:
          row.status ?? 'draft',

        /* =========================================
           SHUFFLE / RESULT SETTINGS
        ========================================= */

        shuffleQuestions:
          Boolean(row.shuffle_questions),

        shuffleOptions:
          Boolean(row.shuffle_options),

        showResults:
          Boolean(row.show_results),

        showCorrectAnswers:
          Boolean(
            row.show_correct_answers
          ),

        /* =========================================
           AVAILABILITY
        ========================================= */

        availableFrom:
          row.available_from ?? null,

        availableUntil:
          row.available_until ?? null,

        /* =========================================
           TIMESTAMPS
        ========================================= */

        createdAt:
          row.created_at ?? null,

        updatedAt:
          row.updated_at ?? null,

        /* =========================================
           LESSON
        ========================================= */

        lesson: {
          id: Number(row.lesson_id_ref),
          title: row.lesson_title,
        },

        /* =========================================
           TOPIC
        ========================================= */

        topic: {
          id: Number(row.topic_id),
          title: row.topic_title,
        },

        /* =========================================
           UNIT
        ========================================= */

        unit: {
          id: Number(row.unit_id),
          code: row.unit_code,
          name: row.unit_name,
        },

        /* =========================================
           PROGRAM
        ========================================= */

        program: {
          id: Number(row.program_id),
          name: row.program_name,
        },
      },
    });
  } catch (error) {
    console.error(
      'GET /api/lecturer/quizzes/[id] ERROR:',
      error
    );

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
   PUT - UPDATE QUIZ
========================================================= */

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       QUIZ ID
    ===================================================== */

    const { id } = await context.params;

    const quizId = parseId(id);

    if (!quizId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid quiz ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       READ BODY
    ===================================================== */

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON request body.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       FIND EXISTING QUIZ
       
       Also loads the current shuffle settings so that
       older clients which do not send them do not
       accidentally disable them.
    ===================================================== */

    const existingResult =
      await pool.query(
        `
          SELECT
            q.id,
            q.lesson_id,

            q.shuffle_questions,
            q.shuffle_options,
            q.show_results,
            q.show_correct_answers,

            l.title AS lesson_title,

            t.id AS topic_id,
            t.title AS topic_title,

            u.id AS unit_id,
            u.code AS unit_code,
            u.name AS unit_name,

            p.id AS program_id,
            p.name AS program_name

          FROM lms_quizzes q

          INNER JOIN lms_lessons l
            ON l.id = q.lesson_id

          INNER JOIN lms_topics t
            ON t.id = l.topic_id

          INNER JOIN lms_units u
            ON u.id = t.unit_id

          INNER JOIN lms_programs p
            ON p.id = u.program_id

          INNER JOIN lms_lecturer_programs lp
            ON lp.program_id = p.id
            AND lp.lecturer_id = $2

          WHERE q.id = $1

          LIMIT 1
        `,
        [quizId, lecturer.id]
      );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Quiz not found or you do not have permission to edit it.',
        },
        { status: 404 }
      );
    }

    const existing =
      existingResult.rows[0];

    /* =====================================================
       BASIC FIELDS
    ===================================================== */

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : '';

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Assessment title is required.',
        },
        { status: 400 }
      );
    }

    if (title.length > 255) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Assessment title cannot exceed 255 characters.',
        },
        { status: 400 }
      );
    }

    const description =
      cleanString(body.description);

    const instructions =
      cleanString(body.instructions);

    /* =====================================================
       NUMERIC SETTINGS
    ===================================================== */

    const totalMarks = Number(
      body.totalMarks ??
        body.total_marks
    );

    const timeLimitMinutes = Number(
      body.timeLimitMinutes ??
        body.time_limit_minutes ??
        0
    );

    const attemptsAllowed = Number(
      body.attemptsAllowed ??
        body.attempts_allowed ??
        1
    );

    const passingScore = Number(
      body.passingScore ??
        body.passing_score
    );

    if (
      !Number.isFinite(totalMarks) ||
      totalMarks < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Total marks must be at least 1.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(timeLimitMinutes) ||
      timeLimitMinutes < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Time limit cannot be negative.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(attemptsAllowed) ||
      attemptsAllowed < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'At least one attempt must be allowed.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(passingScore) ||
      passingScore < 0 ||
      passingScore > 100
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
       SHUFFLE / RESULT SETTINGS
       
       IMPORTANT:
       If the edit page sends a value, use it.
       
       If the edit page does not send a value, preserve
       the existing database value.
    ===================================================== */

    const shuffleQuestions =
      parseBoolean(
        body.shuffleQuestions ??
          body.shuffle_questions,
        Boolean(
          existing.shuffle_questions
        )
      );

    const shuffleOptions =
      parseBoolean(
        body.shuffleOptions ??
          body.shuffle_options,
        Boolean(
          existing.shuffle_options
        )
      );

    const showResults =
      parseBoolean(
        body.showResults ??
          body.show_results,
        Boolean(
          existing.show_results
        )
      );

    const showCorrectAnswers =
      parseBoolean(
        body.showCorrectAnswers ??
          body.show_correct_answers,
        Boolean(
          existing.show_correct_answers
        )
      );

    /* =====================================================
       STATUS
    ===================================================== */

    const allowedStatuses = [
      'draft',
      'active',
      'published',
      'inactive',
      'closed',
    ];

    const requestedStatus =
      typeof body.status === 'string'
        ? body.status
            .trim()
            .toLowerCase()
        : 'draft';

    const status =
      allowedStatuses.includes(
        requestedStatus
      )
        ? requestedStatus
        : 'draft';

    /* =====================================================
       DUPLICATE TITLE
    ===================================================== */

    const duplicateResult =
      await pool.query(
        `
          SELECT id

          FROM lms_quizzes

          WHERE lesson_id = $1

            AND LOWER(TRIM(title)) =
                LOWER(TRIM($2))

            AND id <> $3

          LIMIT 1
        `,
        [
          Number(existing.lesson_id),
          title,
          quizId,
        ]
      );

    if (
      duplicateResult.rows.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Another assessment with this title already exists for this lesson.',
        },
        { status: 409 }
      );
    }

    /* =====================================================
       UPDATE QUIZ
    ===================================================== */

    const updateResult =
      await pool.query(
        `
          UPDATE lms_quizzes

          SET
            title = $1,
            description = $2,
            instructions = $3,

            total_marks = $4,
            time_limit_minutes = $5,
            attempts_allowed = $6,
            passing_score = $7,

            status = $8,

            shuffle_questions = $9,
            shuffle_options = $10,

            show_results = $11,
            show_correct_answers = $12,

            updated_at = NOW()

          WHERE id = $13

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
          title,

          description,

          instructions,

          Math.floor(totalMarks),

          Math.floor(
            timeLimitMinutes
          ),

          Math.floor(
            attemptsAllowed
          ),

          passingScore,

          status,

          shuffleQuestions,

          shuffleOptions,

          showResults,

          showCorrectAnswers,

          quizId,
        ]
      );

    if (
      updateResult.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Assessment could not be updated.',
        },
        { status: 500 }
      );
    }

    const quiz =
      updateResult.rows[0];

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        'Assessment updated successfully.',

      quiz: {
        id: Number(quiz.id),

        lessonId:
          Number(quiz.lesson_id),

        title:
          quiz.title,

        description:
          quiz.description ?? null,

        instructions:
          quiz.instructions ?? null,

        totalMarks:
          Number(
            quiz.total_marks
          ) || 0,

        timeLimitMinutes:
          Number(
            quiz.time_limit_minutes
          ) || 0,

        attemptsAllowed:
          Number(
            quiz.attempts_allowed
          ) || 1,

        passingScore:
          Number(
            quiz.passing_score
          ) || 0,

        status:
          quiz.status ?? 'draft',

        /* =========================================
           SHUFFLE SETTINGS
        ========================================= */

        shuffleQuestions:
          Boolean(
            quiz.shuffle_questions
          ),

        shuffleOptions:
          Boolean(
            quiz.shuffle_options
          ),

        /* =========================================
           RESULT SETTINGS
        ========================================= */

        showResults:
          Boolean(
            quiz.show_results
          ),

        showCorrectAnswers:
          Boolean(
            quiz.show_correct_answers
          ),

        /* =========================================
           AVAILABILITY
        ========================================= */

        availableFrom:
          quiz.available_from ??
          null,

        availableUntil:
          quiz.available_until ??
          null,

        /* =========================================
           TIMESTAMPS
        ========================================= */

        createdAt:
          quiz.created_at ??
          null,

        updatedAt:
          quiz.updated_at ??
          null,

        /* =========================================
           COURSE STRUCTURE
        ========================================= */

        lesson: {
          id: Number(
            existing.lesson_id
          ),
          title:
            existing.lesson_title,
        },

        topic: {
          id: Number(
            existing.topic_id
          ),
          title:
            existing.topic_title,
        },

        unit: {
          id: Number(
            existing.unit_id
          ),
          code:
            existing.unit_code,
          name:
            existing.unit_name,
        },

        program: {
          id: Number(
            existing.program_id
          ),
          name:
            existing.program_name,
        },
      },

      redirectUrl:
        `/lecturer/dashboard/quizzes/${quizId}`,
    });
  } catch (error: any) {
    console.error(
      'PUT /api/lecturer/quizzes/[id] ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          'Failed to update assessment.',

        error:
          process.env.NODE_ENV ===
          'development'
            ? error?.message
            : undefined,
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
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    const lecturer =
      await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Authentication required.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       QUIZ ID
    ===================================================== */

    const { id } =
      await context.params;

    const quizId =
      parseId(id);

    if (!quizId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid quiz ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY ACCESS
    ===================================================== */

    const quizResult =
      await pool.query(
        `
          SELECT
            q.id,
            q.title

          FROM lms_quizzes q

          INNER JOIN lms_lessons l
            ON l.id = q.lesson_id

          INNER JOIN lms_topics t
            ON t.id = l.topic_id

          INNER JOIN lms_units u
            ON u.id = t.unit_id

          INNER JOIN lms_programs p
            ON p.id = u.program_id

          INNER JOIN lms_lecturer_programs lp
            ON lp.program_id = p.id
            AND lp.lecturer_id = $2

          WHERE q.id = $1

          LIMIT 1
        `,
        [quizId, lecturer.id]
      );

    if (
      quizResult.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Quiz not found or you do not have permission to delete it.',
        },
        { status: 404 }
      );
    }

    const quiz =
      quizResult.rows[0];

    /* =====================================================
       TRANSACTION
    ===================================================== */

    const client =
      await pool.connect();

    try {
      await client.query(
        'BEGIN'
      );

      /* ===============================================
         DELETE OPTIONS
      =============================================== */

      await client.query(
        `
          DELETE FROM lms_quiz_options

          WHERE question_id IN (
            SELECT id
            FROM lms_quiz_questions
            WHERE quiz_id = $1
          )
        `,
        [quizId]
      );

      /* ===============================================
         DELETE QUESTIONS
      =============================================== */

      await client.query(
        `
          DELETE FROM lms_quiz_questions

          WHERE quiz_id = $1
        `,
        [quizId]
      );

      /* ===============================================
         DELETE ATTEMPTS
      =============================================== */

      await client.query(
        `
          DELETE FROM lms_quiz_attempts

          WHERE quiz_id = $1
        `,
        [quizId]
      );

      /* ===============================================
         DELETE QUIZ
      =============================================== */

      const deleteResult =
        await client.query(
          `
            DELETE FROM lms_quizzes

            WHERE id = $1

            RETURNING
              id,
              title
          `,
          [quizId]
        );

      await client.query(
        'COMMIT'
      );

      /* ===============================================
         VERIFY DELETE
      =============================================== */

      if (
        deleteResult.rows.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Quiz could not be deleted.',
          },
          { status: 404 }
        );
      }

      /* ===============================================
         RESPONSE
      =============================================== */

      return NextResponse.json({
        success: true,

        message:
          'Assessment deleted successfully.',

        deletedQuiz: {
          id: Number(
            quiz.id
          ),

          title:
            quiz.title,
        },
      });
    } catch (error) {
      await client.query(
        'ROLLBACK'
      );

      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error(
      'DELETE /api/lecturer/quizzes/[id] ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          'Failed to delete assessment.',

        error:
          process.env.NODE_ENV ===
          'development'
            ? error?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}