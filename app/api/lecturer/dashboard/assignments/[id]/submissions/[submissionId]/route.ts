import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================================================
   TYPES
========================================================= */

type RouteContext = {
  params: Promise<{
    id: string;
    submissionId: string;
  }>;
};

/* =========================================================
   HELPER
========================================================= */

function getApplicationName(application: Record<string, unknown>) {
  const firstName =
    application.first_name ??
    application.firstname ??
    application.firstName ??
    '';

  const lastName =
    application.last_name ??
    application.lastname ??
    application.lastName ??
    '';

  const fullName =
    application.full_name ??
    application.fullName ??
    application.name ??
    '';

  if (String(fullName).trim()) {
    return String(fullName).trim();
  }

  return `${String(firstName).trim()} ${String(lastName).trim()}`.trim();
}

/* =========================================================
   GET
   GET /api/lecturer/dashboard/assignments/[id]/submissions/[submissionId]
========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
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
          message: 'Unauthorized.',
        },
        {
          status: 401,
        }
      );
    }

    const { id, submissionId } = await context.params;

    const assignmentId = Number(id);
    const submissionIdNumber = Number(submissionId);

    if (
      !Number.isInteger(assignmentId) ||
      !Number.isInteger(submissionIdNumber)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid assignment or submission ID.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       GET ASSIGNMENT + VERIFY LECTURER ACCESS

       lecturer
          ↓
       lms_lecturer_programs
          ↓
       lms_programs
          ↓
       lms_units
          ↓
       lms_topics
          ↓
       lms_lessons
          ↓
       lms_assignments
    ===================================================== */

    const assignmentResult = await pool.query(
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
          u.title AS unit_title,

          p.id AS program_id,
          p.name AS program_name

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
      [assignmentId, lecturer.id]
    );

    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Assignment not found or you do not have permission to access it.',
        },
        {
          status: 404,
        }
      );
    }

    const assignment = assignmentResult.rows[0];

    /* =====================================================
       GET SUBMISSION

       Also make sure the submission belongs to this
       assignment.
    ===================================================== */

    const submissionResult = await pool.query(
      `
        SELECT
          s.id,
          s.assignment_id,
          s.application_id,
          s.submission_text,
          s.file_name,
          s.file_url,
          s.file_size,
          s.mime_type,
          s.status,
          s.submitted_at,
          s.total_marks,
          s.marks_awarded,
          s.lecturer_feedback,
          s.graded_at,
          s.graded_by,
          s.created_at,
          s.updated_at

        FROM lms_assignment_submissions s

        WHERE s.id = $1
          AND s.assignment_id = $2

        LIMIT 1
      `,
      [
        submissionIdNumber,
        assignmentId,
      ]
    );

    if (submissionResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Submission not found.',
        },
        {
          status: 404,
        }
      );
    }

    const submission = submissionResult.rows[0];

    /* =====================================================
       GET STUDENT APPLICATION

       We use to_jsonb so this endpoint does not depend on
       the exact naming of the application name columns.
    ===================================================== */

    let application: Record<string, unknown> = {};

    try {
      const applicationResult = await pool.query(
        `
          SELECT to_jsonb(a) AS application
          FROM applications a
          WHERE a.id = $1
          LIMIT 1
        `,
        [submission.application_id]
      );

      application =
        applicationResult.rows[0]?.application ?? {};
    } catch (error) {
      console.error(
        'Unable to load application:',
        error
      );
    }

    /* =====================================================
       GET QUESTIONS
    ===================================================== */

    const questionsResult = await pool.query(
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

        ORDER BY question_number ASC, id ASC
      `,
      [assignmentId]
    );

    const questions = questionsResult.rows;

    /* =====================================================
       GET ANSWERS
    ===================================================== */

    const answersResult = await pool.query(
      `
        SELECT
          aa.id,
          aa.submission_id,
          aa.question_id,
          aa.answer_text,
          aa.file_name,
          aa.file_url,
          aa.file_size,
          aa.mime_type,
          aa.marks_awarded,
          aa.lecturer_feedback,
          aa.graded_at,
          aa.created_at,
          aa.updated_at

        FROM lms_assignment_answers aa

        WHERE aa.submission_id = $1

        ORDER BY aa.question_id ASC
      `,
      [submissionIdNumber]
    );

    const answers = answersResult.rows;

    /* =====================================================
       COMBINE QUESTIONS + ANSWERS
    ===================================================== */

    const questionData = questions.map(
      (question) => {
        const answer = answers.find(
          (item) =>
            Number(item.question_id) ===
            Number(question.id)
        );

        return {
          ...question,
          answer: answer ?? null,
        };
      }
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        lecturer: {
          id: lecturer.id,
          name: lecturer.name,
          email: lecturer.email,
        },

        assignment: {
          id: assignment.id,
          lesson_id: assignment.lesson_id,
          title: assignment.title,
          description: assignment.description,
          due_date: assignment.due_date,
          status: assignment.status,
          total_marks: assignment.total_marks,
          lesson_title: assignment.lesson_title,
          topic_id: assignment.topic_id,
          topic_title: assignment.topic_title,
          unit_id: assignment.unit_id,
          unit_title: assignment.unit_title,
          program_id: assignment.program_id,
          program_name: assignment.program_name,
        },

        submission: {
          ...submission,

          student: {
            application_id:
              submission.application_id,

            name:
              getApplicationName(application),

            email:
              application.email ??
              application.email_address ??
              null,

            phone:
              application.phone ??
              application.phone_number ??
              application.mobile ??
              null,

            application_number:
              application.application_number ??
              application.application_no ??
              null,
          },
        },

        questions: questionData,

        studentApplication: application,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET ASSIGNMENT SUBMISSION ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load assignment submission.',
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH
   Save lecturer grading
========================================================= */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const client = await pool.connect();

  try {
    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        {
          status: 401,
        }
      );
    }

    const { id, submissionId } =
      await context.params;

    const assignmentId = Number(id);
    const submissionIdNumber =
      Number(submissionId);

    if (
      !Number.isInteger(assignmentId) ||
      !Number.isInteger(submissionIdNumber)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid assignment or submission ID.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       REQUEST BODY

       Expected:

       {
         answers: [
           {
             answerId: 1,
             marksAwarded: 5,
             lecturerFeedback: "Good answer."
           }
         ],
         lecturerFeedback: "Overall feedback"
       }
    ===================================================== */

    const body = await request.json();

    const answerUpdates = Array.isArray(
      body.answers
    )
      ? body.answers
      : [];

    const lecturerFeedback =
      typeof body.lecturerFeedback === 'string'
        ? body.lecturerFeedback.trim()
        : '';

    /* =====================================================
       VERIFY ASSIGNMENT ACCESS
    ===================================================== */

    const assignmentResult = await client.query(
      `
        SELECT
          a.id,
          a.total_marks

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
      [assignmentId, lecturer.id]
    );

    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Assignment not found or access denied.',
        },
        {
          status: 404,
        }
      );
    }

    const assignment =
      assignmentResult.rows[0];

    /* =====================================================
       VERIFY SUBMISSION
    ===================================================== */

    const submissionResult =
      await client.query(
        `
          SELECT
            id,
            assignment_id
          FROM lms_assignment_submissions
          WHERE id = $1
            AND assignment_id = $2
          LIMIT 1
        `,
        [
          submissionIdNumber,
          assignmentId,
        ]
      );

    if (submissionResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Submission not found.',
        },
        {
          status: 404,
        }
      );
    }

    await client.query('BEGIN');

    /* =====================================================
       UPDATE INDIVIDUAL ANSWERS
    ===================================================== */

    for (const item of answerUpdates) {
      const answerId =
        Number(item.answerId);

      const marksAwarded =
        Number(item.marksAwarded);

      if (
        !Number.isInteger(answerId) ||
        !Number.isFinite(marksAwarded) ||
        marksAwarded < 0
      ) {
        throw new Error(
          'Invalid answer grading data.'
        );
      }

      /* -----------------------------------------------
         Get question maximum marks
      ----------------------------------------------- */

      const answerCheck =
        await client.query(
          `
            SELECT
              aa.id,
              aa.question_id,
              q.marks
            FROM lms_assignment_answers aa
            INNER JOIN lms_assignment_questions q
              ON q.id = aa.question_id
            WHERE aa.id = $1
              AND aa.submission_id = $2
              AND q.assignment_id = $3
            LIMIT 1
          `,
          [
            answerId,
            submissionIdNumber,
            assignmentId,
          ]
        );

      if (answerCheck.rows.length === 0) {
        throw new Error(
          `Answer ${answerId} does not belong to this submission.`
        );
      }

      const maximumMarks =
        Number(answerCheck.rows[0].marks);

      if (marksAwarded > maximumMarks) {
        throw new Error(
          `Marks awarded cannot exceed ${maximumMarks} for answer ${answerId}.`
        );
      }

      const feedback =
        typeof item.lecturerFeedback ===
        'string'
          ? item.lecturerFeedback.trim()
          : null;

      /* -----------------------------------------------
         Update answer
      ----------------------------------------------- */

      await client.query(
        `
          UPDATE lms_assignment_answers

          SET
            marks_awarded = $1,
            lecturer_feedback = $2,
            graded_at = NOW(),
            updated_at = NOW()

          WHERE id = $3
            AND submission_id = $4
        `,
        [
          marksAwarded,
          feedback,
          answerId,
          submissionIdNumber,
        ]
      );
    }

    /* =====================================================
       CALCULATE TOTAL AWARDED MARKS
    ===================================================== */

    const totalResult =
      await client.query(
        `
          SELECT
            COALESCE(
              SUM(marks_awarded),
              0
            )::int AS total_awarded

          FROM lms_assignment_answers

          WHERE submission_id = $1
        `,
        [submissionIdNumber]
      );

    const totalAwarded =
      Number(
        totalResult.rows[0]
          ?.total_awarded ?? 0
      );

    /* =====================================================
       UPDATE SUBMISSION
    ===================================================== */

    await client.query(
      `
        UPDATE lms_assignment_submissions

        SET
          total_marks = $1,
          marks_awarded = $2,
          lecturer_feedback = $3,
          status = 'graded',
          graded_at = NOW(),
          graded_by = $4,
          updated_at = NOW()

        WHERE id = $5
          AND assignment_id = $6
      `,
      [
        Number(assignment.total_marks ?? 0),
        totalAwarded,
        lecturerFeedback || null,
        lecturer.id,
        submissionIdNumber,
        assignmentId,
      ]
    );

    await client.query('COMMIT');

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          'Submission graded successfully.',
        marksAwarded: totalAwarded,
        totalMarks:
          Number(assignment.total_marks ?? 0),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    await client.query('ROLLBACK');

    console.error(
      'PATCH ASSIGNMENT SUBMISSION ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to save grading.',
      },
      {
        status: 500,
      }
    );
  } finally {
    client.release();
  }
}