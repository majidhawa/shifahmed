import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================================================
   TYPES
========================================================= */

type QuestionInput = {
  question?: string;
  marks?: number;
};

type RequirementInput = {
  requirement?: string;
};

/* =========================================================
   GET
   /api/lecturer/assignments

   Returns:
   - lecturer assignments
   - assigned curriculum lessons

========================================================= */

export async function GET() {
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

    const lecturerId = Number(lecturer.id);

    /* =====================================================
       VERIFY LECTURER
    ===================================================== */

    const lecturerResult = await pool.query(
      `
        SELECT id, name, email
        FROM users
        WHERE id = $1
          AND role = 'lecturer'
          AND active = TRUE
        LIMIT 1
      `,
      [lecturerId]
    );

    if (lecturerResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lecturer account is inactive or unavailable.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       ASSIGNMENTS

       Lecturer can only see assignments whose lessons belong
       to programs assigned to that lecturer.
    ===================================================== */

    const assignmentsResult = await pool.query(
      `
        SELECT
          a.id,
          a.lesson_id,
          a.title,
          a.description,
          a.due_date,
          a.status,
          a.total_marks,
          a.created_at,
          a.updated_at,

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

        WHERE lp.lecturer_id = $1

        ORDER BY
          a.created_at DESC,
          a.id DESC
      `,
      [lecturerId]
    );

    /* =====================================================
       QUESTIONS
    ===================================================== */

    const questionsResult = await pool.query(
      `
        SELECT
          q.id,
          q.assignment_id,
          q.question_number,
          q.question,
          q.marks
        FROM lms_assignment_questions q

        INNER JOIN lms_assignments a
          ON a.id = q.assignment_id

        INNER JOIN lms_lessons l
          ON l.id = a.lesson_id

        INNER JOIN lms_topics t
          ON t.id = l.topic_id

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        WHERE lp.lecturer_id = $1

        ORDER BY
          q.assignment_id,
          q.question_number,
          q.id
      `,
      [lecturerId]
    );

    /* =====================================================
       REQUIREMENTS
    ===================================================== */

    const requirementsResult = await pool.query(
      `
        SELECT
          r.id,
          r.assignment_id,
          r.requirement,
          r.requirement_number
        FROM lms_assignment_requirements r

        INNER JOIN lms_assignments a
          ON a.id = r.assignment_id

        INNER JOIN lms_lessons l
          ON l.id = a.lesson_id

        INNER JOIN lms_topics t
          ON t.id = l.topic_id

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        WHERE lp.lecturer_id = $1

        ORDER BY
          r.assignment_id,
          r.requirement_number,
          r.id
      `,
      [lecturerId]
    );

    /* =====================================================
       LESSONS AVAILABLE TO LECTURER
    ===================================================== */

    const lessonsResult = await pool.query(
      `
        SELECT
          l.id AS lesson_id,
          l.title AS lesson_title,

          t.id AS topic_id,
          t.title AS topic_title,

          u.id AS unit_id,
          u.name AS unit_name,

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

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = p.id

        WHERE lp.lecturer_id = $1

        ORDER BY
          p.name,
          u.name,
          t.title,
          l.order_number,
          l.title
      `,
      [lecturerId]
    );

    /* =====================================================
       ATTACH QUESTIONS + REQUIREMENTS
    ===================================================== */

    const assignments = assignmentsResult.rows.map(
      (assignment) => ({
        ...assignment,

        questions: questionsResult.rows.filter(
          (question) =>
            Number(question.assignment_id) ===
            Number(assignment.id)
        ),

        requirements: requirementsResult.rows.filter(
          (requirement) =>
            Number(requirement.assignment_id) ===
            Number(assignment.id)
        ),
      })
    );

    return NextResponse.json(
      {
        success: true,

        lecturer: lecturerResult.rows[0],

        assignments,

        lessons: lessonsResult.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'GET LECTURER ASSIGNMENTS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load assignments.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   /api/lecturer/assignments

   Create assignment + questions + requirements
========================================================= */

export async function POST(request: Request) {
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

    const lecturerId = Number(lecturer.id);

    const body = await request.json();

    const {
      lesson_id,
      title,
      description,
      due_date,
      status,
      questions,
      requirements,
    } = body as {
      lesson_id?: number | string;
      title?: string;
      description?: string;
      due_date?: string | null;
      status?: string;
      questions?: QuestionInput[];
      requirements?: RequirementInput[];
    };

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!lesson_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please select a lesson.',
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
       VERIFY LESSON BELONGS TO LECTURER
    ===================================================== */

    const lessonResult = await pool.query(
      `
        SELECT
          l.id,
          l.title,
          p.id AS program_id,
          p.name AS program_name

        FROM lms_lessons l

        INNER JOIN lms_topics t
          ON t.id = l.topic_id

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_programs p
          ON p.id = u.program_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = p.id

        WHERE l.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [Number(lesson_id), lecturerId]
    );

    if (lessonResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to create an assignment for this lesson.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       PREPARE QUESTIONS
    ===================================================== */

    const cleanQuestions = Array.isArray(questions)
      ? questions
          .map((item) => ({
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

    /* =====================================================
       PREPARE REQUIREMENTS
    ===================================================== */

    const cleanRequirements = Array.isArray(
      requirements
    )
      ? requirements
          .map((item) => ({
            requirement: String(
              item.requirement || ''
            ).trim(),
          }))
          .filter((item) => item.requirement)
      : [];

    /* =====================================================
       TOTAL MARKS
    ===================================================== */

    const totalMarks = cleanQuestions.reduce(
      (total, question) =>
        total + question.marks,
      0
    );

    /* =====================================================
       TRANSACTION
    ===================================================== */

    await client.query('BEGIN');

    const assignmentResult =
      await client.query(
        `
          INSERT INTO lms_assignments (
            lesson_id,
            title,
            description,
            due_date,
            status,
            total_marks,
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
            NOW(),
            NOW()
          )

          RETURNING *
        `,
        [
          Number(lesson_id),
          title.trim(),
          description?.trim() || null,
          due_date || null,
          status || 'active',
          totalMarks,
        ]
      );

    const assignment =
      assignmentResult.rows[0];

    /* =====================================================
       INSERT QUESTIONS
    ===================================================== */

    for (
      let index = 0;
      index < cleanQuestions.length;
      index++
    ) {
      const question =
        cleanQuestions[index];

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
          assignment.id,
          index + 1,
          question.question,
          question.marks,
        ]
      );
    }

    /* =====================================================
       INSERT REQUIREMENTS
    ===================================================== */

    for (
      let index = 0;
      index < cleanRequirements.length;
      index++
    ) {
      const requirement =
        cleanRequirements[index];

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
          assignment.id,
          requirement.requirement,
          index + 1,
        ]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        message: 'Assignment created successfully.',
        assignment,
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');

    console.error(
      'POST LECTURER ASSIGNMENT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to create assignment.',
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}