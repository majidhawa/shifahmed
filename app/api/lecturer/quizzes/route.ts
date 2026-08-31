import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   TYPES
========================================================= */

type CreateQuizBody = {
  title?: unknown;
  description?: unknown;
  instructions?: unknown;

  program_id?: unknown;
  unit_id?: unknown;
  topic_id?: unknown;
  lesson_id?: unknown;

  // Also support camelCase in case the frontend changes later.
  programId?: unknown;
  unitId?: unknown;
  topicId?: unknown;
  lessonId?: unknown;

  total_marks?: unknown;
  time_limit_minutes?: unknown;
  attempts_allowed?: unknown;
  passing_score?: unknown;

  totalMarks?: unknown;
  timeLimitMinutes?: unknown;
  attemptsAllowed?: unknown;
  passingScore?: unknown;

  status?: unknown;
};

/* =========================================================
   HELPERS
========================================================= */

function parsePositiveInteger(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    !Number.isInteger(number) ||
    number <= 0
  ) {
    return null;
  }

  return number;
}

function parseNonNegativeInteger(
  value: unknown,
  fallback: number
): number {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return fallback;
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    !Number.isInteger(number) ||
    number < 0
  ) {
    return fallback;
  }

  return number;
}

function parsePercentage(
  value: unknown,
  fallback: number
): number {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
}

function cleanString(
  value: unknown
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return '';
  }

  return String(value).trim();
}

function cleanNullableString(
  value: unknown
): string | null {
  const text = cleanString(value);

  return text.length > 0 ? text : null;
}

/* =========================================================
   GET ALL LECTURER QUIZZES

   GET /api/lecturer/quizzes
========================================================= */

export async function GET() {
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
       FETCH QUIZZES
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
          q.created_at,
          q.updated_at,

          l.title AS lesson_title,

          t.id AS topic_id,
          t.title AS topic_title,

          u.id AS unit_id,
          u.code AS unit_code,
          u.name AS unit_name,

          p.id AS program_id,
          p.name AS program_name,

          COUNT(DISTINCT qq.id)::int AS question_count,

          COALESCE(
            SUM(qq.marks),
            0
          )::int AS question_marks

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
          AND lp.lecturer_id = $1

        LEFT JOIN lms_quiz_questions qq
          ON qq.quiz_id = q.id

        GROUP BY
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
          q.created_at,
          q.updated_at,

          l.title,

          t.id,
          t.title,

          u.id,
          u.code,
          u.name,

          p.id,
          p.name

        ORDER BY
          q.created_at DESC,
          q.id DESC
      `,
      [lecturer.id]
    );

    const quizzes = result.rows.map(
      (row) => ({
        id: Number(row.id),

        lessonId:
          Number(row.lesson_id),

        title:
          row.title,

        description:
          row.description ?? null,

        instructions:
          row.instructions ?? null,

        totalMarks:
          Number(row.total_marks) || 0,

        timeLimitMinutes:
          Number(
            row.time_limit_minutes
          ) || 0,

        attemptsAllowed:
          Number(
            row.attempts_allowed
          ) || 1,

        passingScore:
          Number(
            row.passing_score
          ) || 0,

        status:
          row.status ?? 'draft',

        createdAt:
          row.created_at ?? null,

        updatedAt:
          row.updated_at ?? null,

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

        questionCount:
          Number(
            row.question_count
          ) || 0,

        questionMarks:
          Number(
            row.question_marks
          ) || 0,
      })
    );

    return NextResponse.json(
      {
        success: true,
        quizzes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'GET /api/lecturer/quizzes ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load quizzes.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE QUIZ

   POST /api/lecturer/quizzes

   Expected form fields:

   title
   description
   instructions

   program_id
   unit_id
   topic_id
   lesson_id

   total_marks
   time_limit_minutes
   attempts_allowed
   passing_score

   status
========================================================= */

export async function POST(
  request: Request
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

    const lecturerId =
      Number(lecturer.id);

    if (
      !Number.isInteger(lecturerId) ||
      lecturerId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid lecturer session.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       READ REQUEST BODY

       The page currently uses a normal HTML form:

       <form
         action="/api/lecturer/quizzes"
         method="POST"
       >

       Therefore Next.js sends:

       application/x-www-form-urlencoded

       We support BOTH:

       - formData()
       - JSON

       This makes the API much more robust.
    ===================================================== */

    let body: CreateQuizBody = {};

    const contentType =
      request.headers.get(
        'content-type'
      ) || '';

    try {
      if (
        contentType.includes(
          'application/json'
        )
      ) {
        body =
          await request.json();
      } else {
        const formData =
          await request.formData();

        body = {
          title:
            formData.get('title'),

          description:
            formData.get('description'),

          instructions:
            formData.get(
              'instructions'
            ),

          program_id:
            formData.get(
              'program_id'
            ),

          unit_id:
            formData.get(
              'unit_id'
            ),

          topic_id:
            formData.get(
              'topic_id'
            ),

          lesson_id:
            formData.get(
              'lesson_id'
            ),

          total_marks:
            formData.get(
              'total_marks'
            ),

          time_limit_minutes:
            formData.get(
              'time_limit_minutes'
            ),

          attempts_allowed:
            formData.get(
              'attempts_allowed'
            ),

          passing_score:
            formData.get(
              'passing_score'
            ),

          status:
            formData.get(
              'status'
            ),
        };
      }
    } catch (error) {
      console.error(
        'READ QUIZ REQUEST ERROR:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Unable to read the submitted assessment data.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       BASIC INFORMATION
    ===================================================== */

    const title =
      cleanString(body.title);

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
      cleanNullableString(
        body.description
      );

    const instructions =
      cleanNullableString(
        body.instructions
      );

    /* =====================================================
       PROGRAM
    ===================================================== */

    const programId =
      parsePositiveInteger(
        body.program_id ??
          body.programId
      );

    if (!programId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A valid program is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       UNIT
    ===================================================== */

    const unitId =
      parsePositiveInteger(
        body.unit_id ??
          body.unitId
      );

    if (!unitId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A valid unit is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       TOPIC
    ===================================================== */

    const topicId =
      parsePositiveInteger(
        body.topic_id ??
          body.topicId
      );

    if (!topicId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A valid topic is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       LESSON
    ===================================================== */

    const lessonId =
      parsePositiveInteger(
        body.lesson_id ??
          body.lessonId
      );

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A valid lesson is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       ASSESSMENT SETTINGS
    ===================================================== */

    const totalMarks =
      parseNonNegativeInteger(
        body.total_marks ??
          body.totalMarks,
        0
      );

    const timeLimitMinutes =
      parseNonNegativeInteger(
        body.time_limit_minutes ??
          body.timeLimitMinutes,
        0
      );

    const attemptsAllowed =
      parseNonNegativeInteger(
        body.attempts_allowed ??
          body.attemptsAllowed,
        1
      );

    const passingScore =
      parsePercentage(
        body.passing_score ??
          body.passingScore,
        50
      );

    /* =====================================================
       VALIDATE TOTAL MARKS
    ===================================================== */

    if (totalMarks <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Total marks must be greater than 0.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE TIME
    ===================================================== */

    if (timeLimitMinutes < 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Time limit cannot be negative.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE ATTEMPTS
    ===================================================== */

    if (attemptsAllowed < 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            'At least one attempt must be allowed.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE PASSING SCORE
    ===================================================== */

    if (
      !Number.isFinite(
        passingScore
      ) ||
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
       STATUS
    ===================================================== */

    const allowedStatuses = [
      'draft',
      'active',
      'published',
      'inactive',
    ];

    const requestedStatus =
      cleanString(
        body.status
      ).toLowerCase();

    const status =
      allowedStatuses.includes(
        requestedStatus
      )
        ? requestedStatus
        : 'draft';

    /* =====================================================
       VERIFY COMPLETE HIERARCHY

       Lecturer
          ↓
       Assigned Program
          ↓
       Unit
          ↓
       Topic
          ↓
       Lesson

       This prevents someone from submitting IDs
       belonging to unrelated programs.
    ===================================================== */

    const hierarchyResult =
      await pool.query(
        `
          SELECT
            p.id AS program_id,
            p.name AS program_name,

            u.id AS unit_id,
            u.code AS unit_code,
            u.name AS unit_name,

            t.id AS topic_id,
            t.title AS topic_title,

            l.id AS lesson_id,
            l.title AS lesson_title

          FROM lms_programs p

          INNER JOIN lms_lecturer_programs lp
            ON lp.program_id = p.id
            AND lp.lecturer_id = $1

          INNER JOIN lms_units u
            ON u.program_id = p.id
            AND u.id = $2

          INNER JOIN lms_topics t
            ON t.unit_id = u.id
            AND t.id = $3

          INNER JOIN lms_lessons l
            ON l.topic_id = t.id
            AND l.id = $4

          WHERE p.id = $5

          LIMIT 1
        `,
        [
          lecturerId,
          unitId,
          topicId,
          lessonId,
          programId,
        ]
      );

    /* =====================================================
       HIERARCHY NOT VALID
    ===================================================== */

    if (
      hierarchyResult.rows.length === 0
    ) {
      /*
       * First determine whether the lesson exists.
       * This gives better debugging information.
       */

      const lessonCheck =
        await pool.query(
          `
            SELECT
              l.id AS lesson_id,
              l.title AS lesson_title,

              t.id AS topic_id,
              t.title AS topic_title,

              u.id AS unit_id,
              u.code AS unit_code,
              u.name AS unit_name,

              p.id AS program_id,
              p.name AS program_name

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

      /* ===================================================
         LESSON DOES NOT EXIST
      =================================================== */

      if (
        lessonCheck.rows.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'The selected lesson does not exist.',
          },
          { status: 404 }
        );
      }

      const actual =
        lessonCheck.rows[0];

      /* ===================================================
         CHECK WHICH PART IS WRONG
      =================================================== */

      const problems: string[] = [];

      if (
        Number(actual.program_id) !==
        programId
      ) {
        problems.push(
          'The selected program does not match the lesson.'
        );
      }

      if (
        Number(actual.unit_id) !==
        unitId
      ) {
        problems.push(
          'The selected unit does not belong to the lesson.'
        );
      }

      if (
        Number(actual.topic_id) !==
        topicId
      ) {
        problems.push(
          'The selected topic does not belong to the lesson.'
        );
      }

      /* ===================================================
         CHECK LECTURER PROGRAM ASSIGNMENT
      =================================================== */

      const lecturerProgramResult =
        await pool.query(
          `
            SELECT
              1
            FROM lms_lecturer_programs
            WHERE lecturer_id = $1
              AND program_id = $2
            LIMIT 1
          `,
          [
            lecturerId,
            Number(
              actual.program_id
            ),
          ]
        );

      if (
        lecturerProgramResult.rows
          .length === 0
      ) {
        problems.push(
          'You are not assigned to the program containing this lesson.'
        );
      }

      console.error(
        'LECTURER QUIZ HIERARCHY VALIDATION FAILED:',
        {
          lecturerId,

          submitted: {
            programId,
            unitId,
            topicId,
            lessonId,
          },

          actual: {
            programId:
              Number(
                actual.program_id
              ),
            unitId:
              Number(
                actual.unit_id
              ),
            topicId:
              Number(
                actual.topic_id
              ),
            lessonId:
              Number(
                actual.lesson_id
              ),
          },

          problems,
        }
      );

      return NextResponse.json(
        {
          success: false,

          message:
            'The selected program, unit, topic and lesson do not match or you do not have permission to use them.',

          details: {
            submitted: {
              programId,
              unitId,
              topicId,
              lessonId,
            },

            actualLesson: {
              lessonId:
                Number(
                  actual.lesson_id
                ),
              lessonTitle:
                actual.lesson_title,

              topicId:
                Number(
                  actual.topic_id
                ),
              topicTitle:
                actual.topic_title,

              unitId:
                Number(
                  actual.unit_id
                ),
              unitCode:
                actual.unit_code,
              unitName:
                actual.unit_name,

              programId:
                Number(
                  actual.program_id
                ),
              programName:
                actual.program_name,
            },

            problems,
          },
        },
        { status: 403 }
      );
    }

    /* =====================================================
       VALIDATED CONTEXT
    ===================================================== */

    const context =
      hierarchyResult.rows[0];

    /* =====================================================
       PREVENT DUPLICATE TITLE
    ===================================================== */

    const duplicateResult =
      await pool.query(
        `
          SELECT
            id,
            title
          FROM lms_quizzes
          WHERE lesson_id = $1
            AND LOWER(TRIM(title)) =
                LOWER(TRIM($2))
          LIMIT 1
        `,
        [
          lessonId,
          title,
        ]
      );

    if (
      duplicateResult.rows.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'An assessment with this title already exists for this lesson.',
        },
        { status: 409 }
      );
    }

    /* =====================================================
       CREATE QUIZ
    ===================================================== */

    const insertResult =
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
            status
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
            $9
          )
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
            created_at,
            updated_at
        `,
        [
          lessonId,
          title,
          description,
          instructions,
          totalMarks,
          timeLimitMinutes,
          attemptsAllowed,
          passingScore,
          status,
        ]
      );

    const quiz =
      insertResult.rows[0];

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          'Assessment created successfully.',

        quiz: {
          id:
            Number(quiz.id),

          lessonId:
            Number(
              quiz.lesson_id
            ),

          title:
            quiz.title,

          description:
            quiz.description ??
            null,

          instructions:
            quiz.instructions ??
            null,

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
            quiz.status ??
            'draft',

          createdAt:
            quiz.created_at ??
            null,

          updatedAt:
            quiz.updated_at ??
            null,

          lesson: {
            id:
              Number(
                context.lesson_id
              ),
            title:
              context.lesson_title,
          },

          topic: {
            id:
              Number(
                context.topic_id
              ),
            title:
              context.topic_title,
          },

          unit: {
            id:
              Number(
                context.unit_id
              ),
            code:
              context.unit_code,
            name:
              context.unit_name,
          },

          program: {
            id:
              Number(
                context.program_id
              ),
            name:
              context.program_name,
          },
        },

        redirectUrl:
          `/lecturer/dashboard/quizzes/${quiz.id}/questions`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      'POST /api/lecturer/quizzes ERROR:',
      error
    );

    /* =====================================================
       DATABASE CONSTRAINT ERRORS
    ===================================================== */

    if (
      error?.code === '23505'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'An assessment with these details already exists.',
        },
        { status: 409 }
      );
    }

    if (
      error?.code === '23503'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The selected lesson is invalid or no longer exists.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       UNKNOWN ERROR
    ===================================================== */

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create assessment.',

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