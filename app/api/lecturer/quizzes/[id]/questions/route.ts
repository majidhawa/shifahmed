import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   TYPES
========================================================= */

type QuestionOptionInput = {
  optionText: string;
  isCorrect?: boolean;
  optionOrder?: number;
};

type CreateQuestionBody = {
  questionText?: string;
  questionType?: string;
  marks?: number;
  questionOrder?: number;
  explanation?: string | null;
  correctAnswer?: string | null;
  options?: QuestionOptionInput[];
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeQuestionType(
  type: string | undefined
): string {
  const normalized =
    type?.trim().toLowerCase();

  switch (normalized) {
    case 'mcq':
    case 'multiple_choice':
    case 'multiple-choice':
    case 'multiple choice':
      return 'multiple_choice';

    case 'true_false':
    case 'true-false':
    case 'true false':
    case 'boolean':
      return 'true_false';

    case 'short_answer':
    case 'short-answer':
    case 'short answer':
      return 'short_answer';

    case 'essay':
    case 'long_answer':
    case 'long-answer':
    case 'long answer':
      return 'essay';

    default:
      return '';
  }
}

/* =========================================================
   POST CREATE QUESTION

   POST /api/lecturer/quizzes/[id]/questions
========================================================= */

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const client = await pool.connect();

  try {
    /* =======================================================
       AUTHENTICATION
    ======================================================= */

    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        {
          status: 401,
        }
      );
    }

    /* =======================================================
       PARAMS
    ======================================================= */

    const { id } = await context.params;

    const quizId = Number(id);

    if (!Number.isInteger(quizId) || quizId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid quiz ID',
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================================
       READ BODY
    ======================================================= */

    let body: CreateQuestionBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON request body',
        },
        {
          status: 400,
        }
      );
    }

    const {
      questionText,
      questionType,
      marks,
      questionOrder,
      explanation,
      correctAnswer,
      options,
    } = body;

    /* =======================================================
       NORMALIZE TYPE
    ======================================================= */

    const normalizedType =
      normalizeQuestionType(questionType);

    if (!normalizedType) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid question type. Use multiple_choice, true_false, short_answer or essay.',
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================================
       VALIDATE QUESTION TEXT
    ======================================================= */

    if (
      typeof questionText !== 'string' ||
      questionText.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Question text is required',
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================================
       VALIDATE MARKS
    ======================================================= */

    const questionMarks =
      marks === undefined
        ? 1
        : Number(marks);

    if (
      !Number.isFinite(questionMarks) ||
      questionMarks <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Marks must be greater than 0',
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================================
       VALIDATE OPTIONS
    ======================================================= */

    const suppliedOptions =
      Array.isArray(options)
        ? options
        : [];

    if (
      normalizedType === 'multiple_choice'
    ) {
      if (suppliedOptions.length < 2) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Multiple choice questions require at least 2 options',
          },
          {
            status: 400,
          }
        );
      }

      const validOptions =
        suppliedOptions.filter(
          (option) =>
            typeof option?.optionText ===
              'string' &&
            option.optionText.trim()
              .length > 0
        );

      if (
        validOptions.length !==
        suppliedOptions.length
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Every multiple choice option must have option text',
          },
          {
            status: 400,
          }
        );
      }

      const correctOptions =
        validOptions.filter(
          (option) =>
            option.isCorrect === true
        );

      if (correctOptions.length !== 1) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Multiple choice questions must have exactly one correct answer',
          },
          {
            status: 400,
          }
        );
      }
    }

    if (
      normalizedType === 'true_false'
    ) {
      if (
        typeof correctAnswer !==
        'string'
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'True / False questions require a correct answer',
          },
          {
            status: 400,
          }
        );
      }

      const normalizedAnswer =
        correctAnswer
          .trim()
          .toLowerCase();

      if (
        normalizedAnswer !==
          'true' &&
        normalizedAnswer !==
          'false'
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'True / False correct answer must be true or false',
          },
          {
            status: 400,
          }
        );
      }
    }

    if (
      normalizedType ===
        'short_answer' ||
      normalizedType === 'essay'
    ) {
      if (
        typeof correctAnswer !==
          'string' ||
        correctAnswer.trim()
          .length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'A correct answer is required for written questions',
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =======================================================
       START TRANSACTION
    ======================================================= */

    await client.query('BEGIN');

    /* =======================================================
       VERIFY QUIZ + LECTURER AUTHORIZATION

       lms_quizzes
          ↓
       lms_lessons
          ↓
       lms_topics
          ↓
       lms_units
          ↓
       lms_programs

       lms_lecturer_programs
    ======================================================= */

    const quizResult =
      await client.query(
        `
          SELECT
            q.id,
            q.title,
            q.total_marks,
            q.status,
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

          WHERE
            q.id = $1
            AND lp.lecturer_id = $2

          LIMIT 1
        `,
        [
          quizId,
          lecturer.id,
        ]
      );

    if (quizResult.rows.length === 0) {
      await client.query(
        'ROLLBACK'
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Quiz not found or you are not authorized to modify it',
        },
        {
          status: 404,
        }
      );
    }

    /* =======================================================
       DETERMINE QUESTION ORDER
    ======================================================= */

    let finalQuestionOrder: number;

    if (
      questionOrder !== undefined
    ) {
      const suppliedOrder =
        Number(questionOrder);

      if (
        !Number.isInteger(
          suppliedOrder
        ) ||
        suppliedOrder <= 0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return NextResponse.json(
          {
            success: false,
            message:
              'Question order must be a positive integer',
          },
          {
            status: 400,
          }
        );
      }

      finalQuestionOrder =
        suppliedOrder;
    } else {
      const orderResult =
        await client.query(
          `
            SELECT
              COALESCE(
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
            ?.next_order
        ) || 1;
    }

    /* =======================================================
       SHIFT EXISTING QUESTIONS
       
       If an order is supplied, move existing questions
       down so the requested order remains available.
    ======================================================= */

    if (
      questionOrder !== undefined
    ) {
      await client.query(
        `
          UPDATE lms_quiz_questions

          SET
            question_order =
              question_order + 1,
            updated_at =
              CURRENT_TIMESTAMP

          WHERE
            quiz_id = $1
            AND question_order >= $2
        `,
        [
          quizId,
          finalQuestionOrder,
        ]
      );
    }

    /* =======================================================
       OPTIONS JSON
       
       Keep a JSON representation as well as the normalized
       lms_quiz_options records.
    ======================================================= */

    let optionsJson:
      | string
      | null = null;

    if (
      normalizedType ===
        'multiple_choice' &&
      suppliedOptions.length > 0
    ) {
      optionsJson =
        JSON.stringify(
          suppliedOptions.map(
            (
              option,
              index
            ) => ({
              optionText:
                option.optionText.trim(),

              isCorrect:
                option.isCorrect ===
                true,

              optionOrder:
                Number(
                  option.optionOrder
                ) ||
                index + 1,
            })
          )
        );
    }

    /* =======================================================
       INSERT QUESTION
    ======================================================= */

    const questionResult =
      await client.query(
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
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )

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
          quizId,
          questionText.trim(),
          normalizedType,
          questionMarks,
          finalQuestionOrder,
          explanation?.trim() ||
            null,
          optionsJson,
          correctAnswer?.trim() ||
            null,
        ]
      );

    const question =
      questionResult.rows[0];

    /* =======================================================
       INSERT OPTIONS
    ======================================================= */

    const createdOptions: Array<{
      id: number;
      questionId: number;
      optionText: string;
      isCorrect: boolean;
      optionOrder: number;
    }> = [];

    if (
      normalizedType ===
        'multiple_choice'
    ) {
      for (
        let index = 0;
        index <
        suppliedOptions.length;
        index++
      ) {
        const option =
          suppliedOptions[index];

        const optionText =
          option.optionText.trim();

        const optionOrder =
          Number(
            option.optionOrder
          ) || index + 1;

        const optionResult =
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

              RETURNING
                id,
                question_id,
                option_text,
                is_correct,
                option_order
            `,
            [
              question.id,
              optionText,
              option.isCorrect ===
                true,
              optionOrder,
            ]
          );

        const created =
          optionResult.rows[0];

        createdOptions.push({
          id: Number(
            created.id
          ),

          questionId:
            Number(
              created.question_id
            ),

          optionText:
            created.option_text,

          isCorrect:
            Boolean(
              created.is_correct
            ),

          optionOrder:
            Number(
              created.option_order
            ),
        });
      }
    }

    /* =======================================================
       UPDATE QUIZ TOTAL MARKS

       Recalculate from actual questions so the quiz total
       remains synchronized.
    ======================================================= */

    const totalMarksResult =
      await client.query(
        `
          SELECT
            COALESCE(
              SUM(marks),
              0
            ) AS total_marks

          FROM lms_quiz_questions

          WHERE quiz_id = $1
        `,
        [quizId]
      );

    const calculatedTotalMarks =
      Number(
        totalMarksResult.rows[0]
          ?.total_marks
      ) || 0;

    await client.query(
      `
        UPDATE lms_quizzes

        SET
          total_marks = $1,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $2
      `,
      [
        calculatedTotalMarks,
        quizId,
      ]
    );

    /* =======================================================
       COMMIT
    ======================================================= */

    await client.query(
      'COMMIT'
    );

    /* =======================================================
       RESPONSE
    ======================================================= */

    return NextResponse.json(
      {
        success: true,

        message:
          'Question created successfully',

        question: {
          id: Number(
            question.id
          ),

          quizId: Number(
            question.quiz_id
          ),

          questionText:
            question.question_text,

          questionType:
            question.question_type,

          marks:
            Number(
              question.marks
            ) || 0,

          questionOrder:
            Number(
              question.question_order
            ) || 0,

          explanation:
            question.explanation ??
            null,

          options:
            createdOptions,

          correctAnswer:
            question.correct_answer ??
            null,

          createdAt:
            question.created_at ??
            null,

          updatedAt:
            question.updated_at ??
            null,
        },

        quiz: {
          id: quizId,
          totalMarks:
            calculatedTotalMarks,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    /* =======================================================
       ROLLBACK
    ======================================================= */

    try {
      await client.query(
        'ROLLBACK'
      );
    } catch (rollbackError) {
      console.error(
        'ROLLBACK ERROR:',
        rollbackError
      );
    }

    console.error(
      'POST /api/lecturer/quizzes/[id]/questions ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create question',
      },
      {
        status: 500,
      }
    );
  } finally {
    client.release();
  }
}