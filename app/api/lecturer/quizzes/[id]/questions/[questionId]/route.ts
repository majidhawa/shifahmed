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

function parseNumber(
  value: unknown,
  fallback = 0
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
}

/* =========================================================
   GET SINGLE QUESTION
========================================================= */

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
      questionId: string;
    }>;
  }
) {
  try {
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

    const { id, questionId } =
      await context.params;

    const quizId = parseId(id);
    const questionIdNumber =
      parseId(questionId);

    if (!quizId || !questionIdNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid quiz or question ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GET QUESTION + VERIFY LECTURER ACCESS
    ===================================================== */

    const questionResult =
      await pool.query(
        `
          SELECT
            qq.id,
            qq.quiz_id,
            qq.question_text,
            qq.question_type,
            qq.marks,
            qq.question_order,
            qq.explanation,
            qq.options,
            qq.correct_answer,
            qq.created_at,
            qq.updated_at,

            q.title AS quiz_title,

            l.id AS lesson_id,
            l.title AS lesson_title,

            t.id AS topic_id,
            t.title AS topic_title,

            u.id AS unit_id,
            u.code AS unit_code,
            u.name AS unit_name,

            p.id AS program_id,
            p.name AS program_name

          FROM lms_quiz_questions qq

          INNER JOIN lms_quizzes q
            ON q.id = qq.quiz_id

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
            AND lp.lecturer_id = $3

          WHERE
            qq.id = $1
            AND qq.quiz_id = $2

          LIMIT 1
        `,
        [
          questionIdNumber,
          quizId,
          lecturer.id,
        ]
      );

    if (questionResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Question not found or you do not have permission to access it.',
        },
        { status: 404 }
      );
    }

    const row =
      questionResult.rows[0];

    /* =====================================================
       GET OPTIONS
    ===================================================== */

    const optionsResult =
      await pool.query(
        `
          SELECT
            id,
            question_id,
            option_text,
            is_correct,
            option_order

          FROM lms_quiz_options

          WHERE question_id = $1

          ORDER BY
            option_order ASC,
            id ASC
        `,
        [questionIdNumber]
      );

    return NextResponse.json({
      success: true,

      question: {
        id: Number(row.id),

        quizId:
          Number(row.quiz_id),

        questionText:
          row.question_text,

        questionType:
          row.question_type ??
          'multiple_choice',

        marks:
          Number(row.marks) || 1,

        questionOrder:
          Number(row.question_order) || 1,

        explanation:
          row.explanation ?? null,

        optionsJson:
          row.options ?? null,

        correctAnswer:
          row.correct_answer ?? null,

        createdAt:
          row.created_at ?? null,

        updatedAt:
          row.updated_at ?? null,

        options:
          optionsResult.rows.map(
            (option) => ({
              id:
                Number(option.id),

              questionId:
                Number(option.question_id),

              optionText:
                option.option_text,

              isCorrect:
                Boolean(option.is_correct),

              optionOrder:
                Number(
                  option.option_order
                ) || 1,
            })
          ),
      },

      quiz: {
        id:
          quizId,

        title:
          row.quiz_title,

        lesson: {
          id:
            Number(row.lesson_id),

          title:
            row.lesson_title,
        },

        topic: {
          id:
            Number(row.topic_id),

          title:
            row.topic_title,
        },

        unit: {
          id:
            Number(row.unit_id),

          code:
            row.unit_code,

          name:
            row.unit_name,
        },

        program: {
          id:
            Number(row.program_id),

          name:
            row.program_name,
        },
      },
    });
  } catch (error: any) {
    console.error(
      'GET /api/lecturer/quizzes/[id]/questions/[questionId] ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load question.',

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
   PUT - UPDATE QUESTION
========================================================= */

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      id: string;
      questionId: string;
    }>;
  }
) {
  try {
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

    const { id, questionId } =
      await context.params;

    const quizId = parseId(id);
    const questionIdNumber =
      parseId(questionId);

    if (!quizId || !questionIdNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid quiz or question ID.',
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
          message:
            'Invalid JSON request body.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY QUESTION + LECTURER ACCESS
    ===================================================== */

    const existingResult =
      await pool.query(
        `
          SELECT
            qq.id,
            qq.quiz_id,
            qq.question_text,
            qq.question_type,
            qq.marks,
            qq.question_order,

            q.title AS quiz_title,

            l.id AS lesson_id,
            l.title AS lesson_title,

            t.id AS topic_id,
            t.title AS topic_title,

            u.id AS unit_id,
            u.code AS unit_code,
            u.name AS unit_name,

            p.id AS program_id,
            p.name AS program_name

          FROM lms_quiz_questions qq

          INNER JOIN lms_quizzes q
            ON q.id = qq.quiz_id

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
            AND lp.lecturer_id = $3

          WHERE
            qq.id = $1
            AND qq.quiz_id = $2

          LIMIT 1
        `,
        [
          questionIdNumber,
          quizId,
          lecturer.id,
        ]
      );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Question not found or you do not have permission to edit it.',
        },
        { status: 404 }
      );
    }

    const existing =
      existingResult.rows[0];

    /* =====================================================
       BASIC FIELDS
    ===================================================== */

    const questionText =
      typeof body.questionText ===
      'string'
        ? body.questionText.trim()
        : typeof body.question_text ===
          'string'
        ? body.question_text.trim()
        : '';

    if (!questionText) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Question text is required.',
        },
        { status: 400 }
      );
    }

    const questionType =
      cleanString(
        body.questionType ??
          body.question_type
      ) ??
      'multiple_choice';

    const marks =
      parseNumber(
        body.marks,
        1
      );

    const questionOrder =
      parseNumber(
        body.questionOrder ??
          body.question_order,
        Number(existing.question_order) ||
          1
      );

    const explanation =
      cleanString(
        body.explanation
      );

    const correctAnswer =
      cleanString(
        body.correctAnswer ??
          body.correct_answer
      );

    if (
      !Number.isFinite(marks) ||
      marks <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Question marks must be greater than 0.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(questionOrder) ||
      questionOrder <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Question order must be a positive number.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       OPTIONS
    ===================================================== */

    let options =
      Array.isArray(body.options)
        ? body.options
        : [];

    options = options
      .map(
        (
          option: any,
          index: number
        ) => ({
          id:
            option?.id
              ? Number(option.id)
              : null,

          optionText:
            typeof option?.optionText ===
            'string'
              ? option.optionText.trim()
              : typeof option?.option_text ===
                'string'
              ? option.option_text.trim()
              : '',

          isCorrect:
            Boolean(
              option?.isCorrect ??
                option?.is_correct
            ),

          optionOrder:
            Number(
              option?.optionOrder ??
                option?.option_order ??
                index + 1
            ),
        })
      )
      .filter(
        (option: any) =>
          option.optionText.length > 0
      );

    const normalizedType =
      questionType
        .toLowerCase()
        .replace(/-/g, '_')
        .trim();

    const isMultipleChoice =
      normalizedType === 'mcq' ||
      normalizedType ===
        'multiple_choice';

    const isTrueFalse =
      normalizedType ===
        'true_false' ||
      normalizedType ===
        'boolean';

    /* =====================================================
       VALIDATE OPTIONS
    ===================================================== */

    if (
      isMultipleChoice &&
      options.length < 2
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Multiple choice questions require at least two answer options.',
        },
        { status: 400 }
      );
    }

    if (
      isMultipleChoice
    ) {
      const correctCount =
        options.filter(
          (option: any) =>
            option.isCorrect
        ).length;

      if (correctCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Please select a correct answer.',
          },
          { status: 400 }
        );
      }

      if (correctCount > 1) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Only one correct answer is allowed for multiple choice questions.',
          },
          { status: 400 }
        );
      }
    }

    if (isTrueFalse) {
      if (
        !correctAnswer ||
        !['true', 'false'].includes(
          correctAnswer.toLowerCase()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'True / False questions require a correct answer of True or False.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       CHECK DUPLICATE QUESTION ORDER
    ===================================================== */

    const duplicateOrderResult =
      await pool.query(
        `
          SELECT id

          FROM lms_quiz_questions

          WHERE
            quiz_id = $1
            AND question_order = $2
            AND id <> $3

          LIMIT 1
        `,
        [
          quizId,
          questionOrder,
          questionIdNumber,
        ]
      );

    if (
      duplicateOrderResult.rows.length >
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Question order ${questionOrder} is already being used in this assessment.`,
        },
        { status: 409 }
      );
    }

    /* =====================================================
       BUILD OPTIONS JSON
    ===================================================== */

    const optionsJson =
      options.length > 0
        ? options.map(
            (option: any) => ({
              text:
                option.optionText,

              isCorrect:
                option.isCorrect,

              order:
                option.optionOrder,
            })
          )
        : [];

    /* =====================================================
       DATABASE TRANSACTION
    ===================================================== */

    const client =
      await pool.connect();

    try {
      await client.query(
        'BEGIN'
      );

      /* ===================================================
         UPDATE QUESTION
      =================================================== */

      const updateResult =
        await client.query(
          `
            UPDATE lms_quiz_questions

            SET
              question_text = $1,
              question_type = $2,
              marks = $3,
              question_order = $4,
              explanation = $5,
              options = $6,
              correct_answer = $7,
              updated_at = NOW()

            WHERE
              id = $8
              AND quiz_id = $9

            RETURNING
              id,
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
          `,
          [
            questionText,
            questionType,
            Math.max(
              1,
              marks
            ),
            Math.floor(
              questionOrder
            ),
            explanation,
            JSON.stringify(
              optionsJson
            ),
            correctAnswer,
            questionIdNumber,
            quizId,
          ]
        );

      if (
        updateResult.rows.length ===
        0
      ) {
        throw new Error(
          'Question update failed.'
        );
      }

      /* ===================================================
         DELETE EXISTING OPTIONS
      =================================================== */

      await client.query(
        `
          DELETE FROM lms_quiz_options

          WHERE question_id = $1
        `,
        [questionIdNumber]
      );

      /* ===================================================
         INSERT UPDATED OPTIONS
      =================================================== */

      if (
        options.length > 0
      ) {
        for (
          const option of options
        ) {
          await client.query(
            `
              INSERT INTO lms_quiz_options (
                question_id,
                option_text,
                is_correct,
                option_order
              )

              VALUES (
                $1,
                $2,
                $3,
                $4
              )
            `,
            [
              questionIdNumber,
              option.optionText,
              option.isCorrect,
              Math.max(
                1,
                Math.floor(
                  option.optionOrder
                )
              ),
            ]
          );
        }
      }

      await client.query(
        'COMMIT'
      );

      const question =
        updateResult.rows[0];

      return NextResponse.json({
        success: true,

        message:
          'Question updated successfully.',

        question: {
          id:
            Number(question.id),

          quizId:
            Number(question.quiz_id),

          questionText:
            question.question_text,

          questionType:
            question.question_type,

          marks:
            Number(question.marks) || 0,

          questionOrder:
            Number(
              question.question_order
            ) || 1,

          explanation:
            question.explanation ??
            null,

          optionsJson:
            question.options ??
            [],

          correctAnswer:
            question.correct_answer ??
            null,

          createdAt:
            question.created_at ??
            null,

          updatedAt:
            question.updated_at ??
            null,

          options:
            options.map(
              (
                option: any,
                index: number
              ) => ({
                id:
                  option.id,

                questionId:
                  questionIdNumber,

                optionText:
                  option.optionText,

                isCorrect:
                  option.isCorrect,

                optionOrder:
                  option.optionOrder ||
                  index + 1,
              })
            ),
        },

        redirectUrl:
          `/lecturer/dashboard/quizzes/${quizId}/questions`,
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
      'PUT /api/lecturer/quizzes/[id]/questions/[questionId] ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update question.',

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
   DELETE QUESTION
========================================================= */

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      id: string;
      questionId: string;
    }>;
  }
) {
  try {
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

    const { id, questionId } =
      await context.params;

    const quizId = parseId(id);
    const questionIdNumber =
      parseId(questionId);

    if (!quizId || !questionIdNumber) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid quiz or question ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY ACCESS
    ===================================================== */

    const accessResult =
      await pool.query(
        `
          SELECT
            qq.id,
            qq.question_text

          FROM lms_quiz_questions qq

          INNER JOIN lms_quizzes q
            ON q.id = qq.quiz_id

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
            AND lp.lecturer_id = $3

          WHERE
            qq.id = $1
            AND qq.quiz_id = $2

          LIMIT 1
        `,
        [
          questionIdNumber,
          quizId,
          lecturer.id,
        ]
      );

    if (
      accessResult.rows.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Question not found or you do not have permission to delete it.',
        },
        { status: 404 }
      );
    }

    const client =
      await pool.connect();

    try {
      await client.query(
        'BEGIN'
      );

      await client.query(
        `
          DELETE FROM lms_quiz_options

          WHERE question_id = $1
        `,
        [questionIdNumber]
      );

      const deleteResult =
        await client.query(
          `
            DELETE FROM lms_quiz_questions

            WHERE
              id = $1
              AND quiz_id = $2

            RETURNING
              id,
              question_text
          `,
          [
            questionIdNumber,
            quizId,
          ]
        );

      if (
        deleteResult.rows.length ===
        0
      ) {
        throw new Error(
          'Question could not be deleted.'
        );
      }

      await client.query(
        'COMMIT'
      );

      return NextResponse.json({
        success: true,

        message:
          'Question deleted successfully.',

        deletedQuestion: {
          id:
            Number(
              deleteResult.rows[0].id
            ),

          questionText:
            deleteResult.rows[0]
              .question_text,
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
      'DELETE /api/lecturer/quizzes/[id]/questions/[questionId] ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to delete question.',

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