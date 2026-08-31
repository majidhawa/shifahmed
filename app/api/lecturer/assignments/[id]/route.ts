import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================================================
   GET SINGLE ASSIGNMENT
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
    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const assignmentId = Number(id);

    if (!Number.isInteger(assignmentId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid assignment ID.',
        },
        { status: 400 }
      );
    }

    const assignmentResult = await pool.query(
      `
        SELECT
          a.*,

          l.title AS lesson_title,

          t.id AS topic_id,
          t.title AS topic_title,

          u.id AS unit_id,
          u.name AS unit_name,

          p.id AS program_id,
          p.name AS program_name,
          p.code AS program_code

        FROM lms_assignments a

        INNER JOIN lms_lessons l
          ON l.id = a.lesson_id

        INNER JOIN lms_topics t
          ON t.id = l.topic_id

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_programs p
          ON p.id = u.program_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = p.id

        WHERE a.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [
        assignmentId,
        Number(lecturer.id),
      ]
    );

    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Assignment not found.',
        },
        { status: 404 }
      );
    }

    const assignment =
      assignmentResult.rows[0];

    const questionsResult =
      await pool.query(
        `
          SELECT
            id,
            assignment_id,
            question_number,
            question,
            marks,
            created_at,
            updated_at

          FROM lms_assignment_questions

          WHERE assignment_id = $1

          ORDER BY question_number, id
        `,
        [assignmentId]
      );

    const requirementsResult =
      await pool.query(
        `
          SELECT
            id,
            assignment_id,
            requirement,
            requirement_number,
            created_at

          FROM lms_assignment_requirements

          WHERE assignment_id = $1

          ORDER BY requirement_number, id
        `,
        [assignmentId]
      );

    return NextResponse.json(
      {
        success: true,

        assignment: {
          ...assignment,
          questions:
            questionsResult.rows,
          requirements:
            requirementsResult.rows,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'GET SINGLE LECTURER ASSIGNMENT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load assignment.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT / PATCH
   UPDATE ASSIGNMENT
========================================================= */

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const client = await pool.connect();

  try {
    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const assignmentId = Number(id);

    if (!Number.isInteger(assignmentId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid assignment ID.',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      lesson_id,
      title,
      description,
      due_date,
      status,
      questions,
      requirements,
    } = body;

    /* =====================================================
       VERIFY OWNERSHIP
    ===================================================== */

    const ownershipResult = await pool.query(
      `
        SELECT a.id

        FROM lms_assignments a

        INNER JOIN lms_lessons l
          ON l.id = a.lesson_id

        INNER JOIN lms_topics t
          ON t.id = l.topic_id

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        WHERE a.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [
        assignmentId,
        Number(lecturer.id),
      ]
    );

    if (ownershipResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to modify this assignment.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!lesson_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson is required.',
        },
        { status: 400 }
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Assignment title is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY NEW LESSON
    ===================================================== */

    const lessonResult = await pool.query(
      `
        SELECT l.id

        FROM lms_lessons l

        INNER JOIN lms_topics t
          ON t.id = l.topic_id

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        WHERE l.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [
        Number(lesson_id),
        Number(lecturer.id),
      ]
    );

    if (lessonResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to use this lesson.',
        },
        { status: 403 }
      );
    }

    const cleanQuestions = Array.isArray(
      questions
    )
      ? questions
          .map((item: {
            question?: string;
            marks?: number;
          }) => ({
            question: String(
              item.question || ''
            ).trim(),

            marks: Math.max(
              0,
              Number(item.marks || 0)
            ),
          }))
          .filter((item) => item.question)
      : [];

    const cleanRequirements =
      Array.isArray(requirements)
        ? requirements
            .map((item: {
              requirement?: string;
            }) => ({
              requirement: String(
                item.requirement || ''
              ).trim(),
            }))
            .filter(
              (item) => item.requirement
            )
        : [];

    const totalMarks =
      cleanQuestions.reduce(
        (sum, item) =>
          sum + item.marks,
        0
      );

    /* =====================================================
       TRANSACTION
    ===================================================== */

    await client.query('BEGIN');

    await client.query(
      `
        UPDATE lms_assignments

        SET
          lesson_id = $1,
          title = $2,
          description = $3,
          due_date = $4,
          status = $5,
          total_marks = $6,
          updated_at = NOW()

        WHERE id = $7
      `,
      [
        Number(lesson_id),
        title.trim(),
        description?.trim() || null,
        due_date || null,
        status || 'active',
        totalMarks,
        assignmentId,
      ]
    );

    /* =====================================================
       REPLACE QUESTIONS
    ===================================================== */

    await client.query(
      `
        DELETE FROM lms_assignment_questions
        WHERE assignment_id = $1
      `,
      [assignmentId]
    );

    for (
      let index = 0;
      index < cleanQuestions.length;
      index++
    ) {
      await client.query(
        `
          INSERT INTO lms_assignment_questions (
            assignment_id,
            question_number,
            question,
            marks,
            created_at,
            updated_at
          )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            NOW(),
            NOW()
          )
        `,
        [
          assignmentId,
          index + 1,
          cleanQuestions[index].question,
          cleanQuestions[index].marks,
        ]
      );
    }

    /* =====================================================
       REPLACE REQUIREMENTS
    ===================================================== */

    await client.query(
      `
        DELETE FROM lms_assignment_requirements
        WHERE assignment_id = $1
      `,
      [assignmentId]
    );

    for (
      let index = 0;
      index < cleanRequirements.length;
      index++
    ) {
      await client.query(
        `
          INSERT INTO lms_assignment_requirements (
            assignment_id,
            requirement,
            requirement_number,
            created_at
          )

          VALUES (
            $1,
            $2,
            $3,
            NOW()
          )
        `,
        [
          assignmentId,
          cleanRequirements[index]
            .requirement,
          index + 1,
        ]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        message:
          'Assignment updated successfully.',
      },
      { status: 200 }
    );
  } catch (error) {
    await client.query('ROLLBACK');

    console.error(
      'UPDATE LECTURER ASSIGNMENT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update assignment.',
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/* =========================================================
   DELETE ASSIGNMENT
========================================================= */

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const client = await pool.connect();

  try {
    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const assignmentId = Number(id);

    if (!Number.isInteger(assignmentId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid assignment ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY OWNERSHIP
    ===================================================== */

    const ownershipResult = await pool.query(
      `
        SELECT a.id

        FROM lms_assignments a

        INNER JOIN lms_lessons l
          ON l.id = a.lesson_id

        INNER JOIN lms_topics t
          ON t.id = l.topic_id

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        WHERE a.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [
        assignmentId,
        Number(lecturer.id),
      ]
    );

    if (ownershipResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to delete this assignment.',
        },
        { status: 403 }
      );
    }

    await client.query('BEGIN');

    /* =====================================================
       DELETE CHILD RECORDS FIRST
    ===================================================== */

    await client.query(
      `
        DELETE FROM lms_assignment_questions
        WHERE assignment_id = $1
      `,
      [assignmentId]
    );

    await client.query(
      `
        DELETE FROM lms_assignment_requirements
        WHERE assignment_id = $1
      `,
      [assignmentId]
    );

    /* =====================================================
       DELETE ASSIGNMENT
    ===================================================== */

    await client.query(
      `
        DELETE FROM lms_assignments
        WHERE id = $1
      `,
      [assignmentId]
    );

    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        message:
          'Assignment deleted successfully.',
      },
      { status: 200 }
    );
  } catch (error) {
    await client.query('ROLLBACK');

    console.error(
      'DELETE LECTURER ASSIGNMENT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to delete assignment.',
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}