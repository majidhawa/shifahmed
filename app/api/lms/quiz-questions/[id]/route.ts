import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   GET ONE QUESTION
   /api/lms/quiz-questions/[id]
========================================================= */

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const questionId = Number(id);

    if (!Number.isInteger(questionId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid question ID.',
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

      WHERE id = $1
      `,
      [questionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Question not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question: result.rows[0],
    });
  } catch (error) {
    console.error(
      'GET question error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load question.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   UPDATE QUESTION
   PUT /api/lms/quiz-questions/[id]
========================================================= */

export async function PUT(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const questionId = Number(id);

    if (!Number.isInteger(questionId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid question ID.',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      question,
      question_text,
      question_type,
      options,
      correct_answer,
      marks,
      question_order,
      order_number,
      explanation,
    } = body;

    /* =====================================================
       QUESTION TEXT
       
       We support both:
       question_text
       question

       Internally we always save to question_text.
    ===================================================== */

    const finalQuestionText =
      typeof question_text === 'string'
        ? question_text.trim()
        : typeof question === 'string'
        ? question.trim()
        : '';

    if (!finalQuestionText) {
      return NextResponse.json(
        {
          success: false,
          message: 'Question is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       QUESTION TYPE
    ===================================================== */

    const allowedTypes = [
      'multiple_choice',
      'true_false',
      'short_answer',
    ];

    if (!allowedTypes.includes(question_type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid question type.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       MARKS
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
          message: 'Invalid question marks.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GET EXISTING QUESTION
    ===================================================== */

    const existing =
      await pool.query(
        `
        SELECT
          id,
          quiz_id
        FROM lms_quiz_questions

        WHERE id = $1
        `,
        [questionId]
      );

    if (existing.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Question not found.',
        },
        { status: 404 }
      );
    }

    const quizId =
      existing.rows[0].quiz_id;

    /* =====================================================
       PREPARE OPTIONS
    ===================================================== */

    let finalOptions: string[] = [];

    /* =====================================================
       MULTIPLE CHOICE
    ===================================================== */

    if (
      question_type ===
      'multiple_choice'
    ) {
      if (!Array.isArray(options)) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Multiple-choice questions require options.',
          },
          { status: 400 }
        );
      }

      finalOptions = options
        .map((option: unknown) =>
          String(option).trim()
        )
        .filter(Boolean);

      if (finalOptions.length < 2) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Multiple-choice questions require at least two valid options.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       TRUE / FALSE
    ===================================================== */

    if (
      question_type ===
      'true_false'
    ) {
      finalOptions = [
        'True',
        'False',
      ];
    }

    /* =====================================================
       SHORT ANSWER
    ===================================================== */

    if (
      question_type ===
      'short_answer'
    ) {
      finalOptions = [];
    }

    /* =====================================================
       CORRECT ANSWER
    ===================================================== */

    const finalCorrectAnswer =
      correct_answer !== undefined &&
      correct_answer !== null
        ? String(correct_answer).trim()
        : '';

    if (!finalCorrectAnswer) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Correct answer is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE MULTIPLE CHOICE ANSWER
    ===================================================== */

    if (
      question_type ===
      'multiple_choice'
    ) {
      if (
        !finalOptions.includes(
          finalCorrectAnswer
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

    /* =====================================================
       VALIDATE TRUE / FALSE ANSWER
    ===================================================== */

    if (
      question_type ===
      'true_false'
    ) {
      if (
        !['True', 'False'].includes(
          finalCorrectAnswer
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Correct answer for true/false must be True or False.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       QUESTION ORDER
    ===================================================== */

    let finalQuestionOrder = 1;

    if (
      question_order !== undefined &&
      question_order !== ''
    ) {
      finalQuestionOrder =
        Number(question_order);
    } else if (
      order_number !== undefined &&
      order_number !== ''
    ) {
      finalQuestionOrder =
        Number(order_number);
    }

    if (
      !Number.isInteger(
        finalQuestionOrder
      ) ||
      finalQuestionOrder < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid question order.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       UPDATE QUESTION
    ===================================================== */

    const result = await pool.query(
      `
      UPDATE lms_quiz_questions

      SET
        question_text = $1,
        question_type = $2,
        options = $3::jsonb,
        correct_answer = $4,
        marks = $5,
        question_order = $6,
        explanation = $7,
        updated_at = NOW()

      WHERE id = $8

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
        finalQuestionText,

        question_type,

        JSON.stringify(
          finalOptions
        ),

        finalCorrectAnswer,

        questionMarks,

        finalQuestionOrder,

        explanation?.trim() || null,

        questionId,
      ]
    );

    /* =====================================================
       RECALCULATE QUIZ TOTAL MARKS
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

    return NextResponse.json({
      success: true,
      message:
        'Question updated successfully.',
      question: result.rows[0],
    });
  } catch (error) {
    console.error(
      'PUT question error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update question.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE QUESTION
   DELETE /api/lms/quiz-questions/[id]
========================================================= */

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const questionId = Number(id);

    if (!Number.isInteger(questionId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid question ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       DELETE QUESTION
    ===================================================== */

    const result = await pool.query(
      `
      DELETE FROM lms_quiz_questions

      WHERE id = $1

      RETURNING
        id,
        quiz_id
      `,
      [questionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Question not found.',
        },
        { status: 404 }
      );
    }

    const quizId =
      result.rows[0].quiz_id;

    /* =====================================================
       RECALCULATE QUIZ TOTAL MARKS
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

    return NextResponse.json({
      success: true,
      message:
        'Question deleted successfully.',
      id: questionId,
    });
  } catch (error) {
    console.error(
      'DELETE question error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to delete question.',
      },
      { status: 500 }
    );
  }
}