
import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/* =========================================================
   TYPES
========================================================= */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   GET ASSIGNMENT SUBMISSIONS
=========================================================

   GET
   /api/lecturer/dashboard/assignments/[id]/submissions

========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    /* =====================================================
       AUTHENTICATE LECTURER
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

    /* =====================================================
       GET ASSIGNMENT ID
    ===================================================== */

    const { id } = await context.params;

    const assignmentId = Number(id);

    if (
      !Number.isInteger(assignmentId) ||
      assignmentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid assignment ID.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       GET ASSIGNMENT

       IMPORTANT:
       lms_units uses "name", NOT "title".
    ===================================================== */

    const assignmentResult = await pool.query(
      `
        SELECT
          a.id,
          a.title,
          a.description,
          a.due_date,
          a.status,
          a.total_marks,

          l.id AS lesson_id,
          l.title AS lesson_title,

          t.id AS topic_id,
          t.title AS topic_title,

          u.id AS unit_id,
          u.name AS unit_name,

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
      [
        assignmentId,
        lecturer.id,
      ]
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

    const assignment =
      assignmentResult.rows[0];

    /* =====================================================
       GET QUESTIONS

       IMPORTANT:
       Database uses:
       - question
       - question_number

       NOT:
       - question_text
       - question_order
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

        ORDER BY
          question_number ASC,
          id ASC
      `,
      [assignmentId]
    );

    const questions =
      questionsResult.rows.map(
        (question) => ({
          id: question.id,

          assignment_id:
            question.assignment_id,

          question_number:
            question.question_number,

          question:
            question.question,

          marks:
            question.marks,

          created_at:
            question.created_at,

          updated_at:
            question.updated_at,
        })
      );

    /* =====================================================
       GET ENROLLED STUDENTS + SUBMISSIONS
    =====================================================

       We get all students enrolled in the assignment's
       program.

       LEFT JOIN ensures students who have NOT submitted
       are also displayed.

    ===================================================== */

    const studentsResult = await pool.query(
      `
        SELECT
          e.application_id,
          e.student_number,

          app.first_name,
          app.middle_name,
          app.last_name,
          app.email,
          app.phone,

          s.id AS submission_id,
          s.status AS submission_status,
          s.submitted_at,
          s.total_marks AS submission_total_marks,
          s.marks_awarded,
          s.lecturer_feedback,
          s.graded_at,
          s.file_name,
          s.file_url,
          s.file_size,
          s.mime_type,
          s.submission_text

        FROM lms_enrollments e

        INNER JOIN applications app
          ON app.id = e.application_id

        LEFT JOIN lms_assignment_submissions s
          ON s.assignment_id = $1
         AND s.application_id = e.application_id

        WHERE e.program_id = $2

        ORDER BY
          app.first_name ASC,
          app.last_name ASC
      `,
      [
        assignmentId,
        assignment.program_id,
      ]
    );

    /* =====================================================
       FORMAT STUDENTS
    ===================================================== */

    const students =
      studentsResult.rows.map(
        (student) => ({
          applicationId:
            student.application_id,

          studentNumber:
            student.student_number,

          name: [
            student.first_name,
            student.middle_name,
            student.last_name,
          ]
            .filter(Boolean)
            .join(' '),

          email:
            student.email,

          phone:
            student.phone,

          submission:
            student.submission_id
              ? {
                  id:
                    student.submission_id,

                  status:
                    student.submission_status,

                  submittedAt:
                    student.submitted_at,

                  marksAwarded:
                    student.marks_awarded !== null
                      ? Number(
                          student.marks_awarded
                        )
                      : null,

                  totalMarks:
                    student.submission_total_marks !==
                    null
                      ? Number(
                          student.submission_total_marks
                        )
                      : Number(
                          assignment.total_marks
                        ),

                  feedback:
                    student.lecturer_feedback,

                  gradedAt:
                    student.graded_at,

                  fileName:
                    student.file_name,

                  fileUrl:
                    student.file_url,

                  fileSize:
                    student.file_size,

                  mimeType:
                    student.mime_type,

                  submissionText:
                    student.submission_text,
                }
              : null,
        })
      );

    /* =====================================================
       STATISTICS
    ===================================================== */

    const totalStudents =
      students.length;

    const submitted =
      students.filter(
        (student) =>
          student.submission !== null
      ).length;

    const graded =
      students.filter(
        (student) =>
          student.submission?.status ===
          'graded'
      ).length;

    const pending =
      students.filter(
        (student) =>
          student.submission !== null &&
          student.submission.status !==
            'graded'
      ).length;

    const notSubmitted =
      students.filter(
        (student) =>
          student.submission === null
      ).length;

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        assignment: {
          id:
            assignment.id,

          title:
            assignment.title,

          description:
            assignment.description,

          dueDate:
            assignment.due_date,

          status:
            assignment.status,

          totalMarks:
            Number(
              assignment.total_marks
            ),

          lesson: {
            id:
              assignment.lesson_id,

            title:
              assignment.lesson_title,
          },

          topic: {
            id:
              assignment.topic_id,

            title:
              assignment.topic_title,
          },

          unit: {
            id:
              assignment.unit_id,

            name:
              assignment.unit_name,
          },

          program: {
            id:
              assignment.program_id,

            name:
              assignment.program_name,
          },
        },

        questions,

        statistics: {
          totalStudents,

          submitted,

          graded,

          pending,

          notSubmitted,
        },

        students,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET LECTURER ASSIGNMENT SUBMISSIONS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load assignment submissions.',
      },
      {
        status: 500,
      }
    );
  }
}

