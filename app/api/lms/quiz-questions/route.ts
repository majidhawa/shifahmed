import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   GET QUESTIONS
   /api/lms/quiz-questions?quiz_id=1
========================================================= */

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const quizId = Number(
      searchParams.get('quiz_id')
    );

    if (!Number.isInteger(quizId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid quiz_id is required.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        id,
        quiz_id,
        question_text,
        question_type,
        options,
        correct_answer,
        marks,
        question_order,
        explanation,
        created_at,
        updated_at
      FROM lms_quiz_questions
      WHERE quiz_id = $1
      ORDER BY question_order ASC, id ASC
      `,
      [quizId]
    );

    return NextResponse.json({
      success: true,
      questions: result.rows,
    });

  } catch (error) {
    console.error(
      'GET quiz questions error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load quiz questions.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE QUESTION
========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      quiz_id,
      question_text,
      question_type,
      options,
      correct_answer,
      marks,
      question_order,
      explanation,
    } = body;

    /* =====================================================
       VALIDATE QUIZ ID
    ===================================================== */

    const quizId = Number(quiz_id);

    if (!Number.isInteger(quizId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid quiz_id is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE QUESTION
    ===================================================== */

    if (
      !question_text ||
      !String(question_text).trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Question text is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE QUESTION TYPE
    ===================================================== */

    const allowedTypes = [
      'multiple_choice',
      'true_false',
      'short_answer',
    ];

    if (
      !allowedTypes.includes(
        question_type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid question type.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE MARKS
    ===================================================== */

    const questionMarks =
      marks === undefined ||
      marks === ''
        ? 1
        : Number(marks);

    if (
      !Number.isFinite(questionMarks) ||
      questionMarks < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid question marks.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK QUIZ EXISTS
    ===================================================== */

    const quizResult =
      await pool.query(
        `
        SELECT id
        FROM lms_quizzes
        WHERE id = $1
        `,
        [quizId]
      );

    if (
      quizResult.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quiz not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       QUESTION ORDER
    ===================================================== */

    let finalQuestionOrder =
      question_order !== undefined
        ? Number(question_order)
        : null;

    if (
      !finalQuestionOrder ||
      finalQuestionOrder < 1
    ) {
      const orderResult =
        await pool.query(
          `
          SELECT COALESCE(
            MAX(question_order),
            0
          ) + 1 AS next_order
          FROM lms_quiz_questions
          WHERE quiz_id = $1
          `,
          [quizId]
        );

      finalQuestionOrder =
        Number(
          orderResult.rows[0]
            .next_order
        );
    }

    /* =====================================================
       OPTIONS
    ===================================================== */

    let finalOptions: string[] = [];

    /* -----------------------------------------------------
       MULTIPLE CHOICE
    ----------------------------------------------------- */

    if (
      question_type ===
      'multiple_choice'
    ) {
      if (
        !Array.isArray(options) ||
        options.length < 2
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Multiple-choice questions require at least two options.',
          },
          { status: 400 }
        );
      }

      finalOptions = options
        .map((option: unknown) =>
          String(option).trim()
        )
        .filter(Boolean);

      if (
        finalOptions.length < 2
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Multiple-choice questions require at least two valid options.',
          },
          { status: 400 }
        );
      }

      /* -----------------------------------------------
         CORRECT ANSWER
      ------------------------------------------------ */

      if (
        !correct_answer ||
        !String(
          correct_answer
        ).trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Correct answer is required.',
          },
          { status: 400 }
        );
      }

      const cleanCorrectAnswer =
        String(
          correct_answer
        ).trim();

      if (
        !finalOptions.includes(
          cleanCorrectAnswer
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Correct answer must match one of the provided options.',
          },
          { status: 400 }
        );
      }
    }

    /* -----------------------------------------------------
       TRUE / FALSE
    ----------------------------------------------------- */

    if (
      question_type ===
      'true_false'
    ) {
      finalOptions = [
        'True',
        'False',
      ];

      if (
        !correct_answer ||
        !['True', 'False'].includes(
          String(
            correct_answer
          ).trim()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Correct answer must be True or False.',
          },
          { status: 400 }
        );
      }
    }

    /* -----------------------------------------------------
       SHORT ANSWER
    ----------------------------------------------------- */

    if (
      question_type ===
      'short_answer'
    ) {
      /*
       * Short-answer questions can optionally
       * have an expected answer.
       */
      if (
        correct_answer !==
          undefined &&
        correct_answer !== null
      ) {
        const answer =
          String(
            correct_answer
          ).trim();

        if (answer) {
          // Keep the answer.
        }
      }
    }

    /* =====================================================
       FINAL CORRECT ANSWER
    ===================================================== */

    const finalCorrectAnswer =
      correct_answer !==
        undefined &&
      correct_answer !== null &&
      String(
        correct_answer
      ).trim()
        ? String(
            correct_answer
          ).trim()
        : null;

    /* =====================================================
       CREATE QUESTION
    ===================================================== */

    const result =
      await pool.query(
        `
        INSERT INTO lms_quiz_questions (
          quiz_id,
          question_text,
          question_type,
          marks,
          question_order,
          explanation,
          options,
          correct_answer,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7::jsonb,
          $8,
          NOW(),
          NOW()
        )
        RETURNING
          id,
          quiz_id,
          question_text,
          question_type,
          options,
          correct_answer,
          marks,
          question_order,
          explanation,
          created_at,
          updated_at
        `,
        [
          quizId,

          String(
            question_text
          ).trim(),

          question_type,

          questionMarks,

          finalQuestionOrder,

          explanation?.trim() ||
            null,

          JSON.stringify(
            finalOptions
          ),

          finalCorrectAnswer,
        ]
      );

    /* =====================================================
       UPDATE QUIZ TOTAL MARKS
    ===================================================== */

    await pool.query(
      `
      UPDATE lms_quizzes
      SET
        total_marks = (
          SELECT COALESCE(
            SUM(marks),
            0
          )
          FROM lms_quiz_questions
          WHERE quiz_id = $1
        ),
        updated_at = NOW()
      WHERE id = $1
      `,
      [quizId]
    );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          'Question created successfully.',
        question:
          result.rows[0],
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error(
      'POST quiz question error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          'Failed to create quiz question.',
      },
      { status: 500 }
    );
  }
}