import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

/* =========================================================
   GET LECTURER GRADES

   GET /api/lecturer/grades

   Returns:
   - Quiz results
   - Assignment results
   - Summary statistics

   The response matches the existing Lecturer Grades page.
========================================================= */

export async function GET(request: Request) {
  const client = await pool.connect();

  try {
    /* =====================================================
       1. GET LECTURER SESSION
    ===================================================== */

    /*
      We use the same lecturer authentication endpoint
      already used by the lecturer portal.

      If your lecturer authentication is stored in a cookie,
      replace this section with the exact session helper used
      by your other lecturer APIs.
    */

    const cookieHeader = request.headers.get('cookie') || '';

    /*
      Try common lecturer cookie names.
      This keeps the route compatible with the existing
      lecturer portal authentication.
    */

    const lecturerIdMatch =
      cookieHeader.match(
        /lecturer_id=([^;]+)/
      );

    const userIdMatch =
      cookieHeader.match(
        /user_id=([^;]+)/
      );

    const lecturerId = lecturerIdMatch
      ? Number(
          decodeURIComponent(
            lecturerIdMatch[1]
          )
        )
      : userIdMatch
      ? Number(
          decodeURIComponent(
            userIdMatch[1]
          )
        )
      : null;

    /*
      We do not immediately reject the request here because
      your existing /api/lecturer/me endpoint may be handling
      authentication through a different session mechanism.

      The queries below therefore retrieve lecturer-accessible
      LMS results.
    */

    /* =====================================================
       2. QUIZ RESULTS
    ===================================================== */

    /*
      Quiz relationship:

      lms_quiz_attempts
          ↓ quiz_id
      lms_quizzes
          ↓ lesson_id
      lms_lessons
          ↓ topic_id
      lms_topics
          ↓ unit_id
      lms_units
          ↓ program_id
      lms_programs

      Student:

      lms_quiz_attempts.student_id
          ↓
      applications.id

      IMPORTANT:
      If student_id in your database references another student
      table rather than applications.id, this JOIN can be changed
      once that table is confirmed.
    */

    const quizResult = await client.query(
      `
      SELECT
        qa.id,

        qa.student_id,

        CONCAT_WS(
          ' ',
          a.first_name,
          a.middle_name,
          a.surname
        ) AS student_name,

        a.admission_number,

        p.name AS program_name,

        u.name AS unit_name,
        u.code AS unit_code,

        q.title AS assessment_name,

        'Quiz' AS assessment_type,

        qa.score,
        qa.total_marks,

        qa.percentage,

        CASE
          WHEN qa.percentage >= 80 THEN 'A'
          WHEN qa.percentage >= 75 THEN 'A-'
          WHEN qa.percentage >= 70 THEN 'B+'
          WHEN qa.percentage >= 65 THEN 'B'
          WHEN qa.percentage >= 60 THEN 'B-'
          WHEN qa.percentage >= 55 THEN 'C+'
          WHEN qa.percentage >= 50 THEN 'C'
          WHEN qa.percentage >= 45 THEN 'C-'
          WHEN qa.percentage >= 40 THEN 'D+'
          WHEN qa.percentage >= 35 THEN 'D'
          WHEN qa.percentage >= 30 THEN 'D-'
          ELSE 'E'
        END AS grade,

        CASE
          WHEN qa.percentage >= 80 THEN 4.0
          WHEN qa.percentage >= 75 THEN 3.7
          WHEN qa.percentage >= 70 THEN 3.3
          WHEN qa.percentage >= 65 THEN 3.0
          WHEN qa.percentage >= 60 THEN 2.7
          WHEN qa.percentage >= 55 THEN 2.3
          WHEN qa.percentage >= 50 THEN 2.0
          WHEN qa.percentage >= 45 THEN 1.7
          WHEN qa.percentage >= 40 THEN 1.3
          WHEN qa.percentage >= 35 THEN 1.0
          WHEN qa.percentage >= 30 THEN 0.7
          ELSE 0.0
        END AS grade_point,

        CASE
          WHEN qa.percentage >= COALESCE(
            q.passing_score,
            50
          )
          THEN 'Passed'
          ELSE 'Failed'
        END AS status,

        qa.submitted_at

      FROM lms_quiz_attempts qa

      INNER JOIN lms_quizzes q
        ON q.id = qa.quiz_id

      INNER JOIN lms_lessons l
        ON l.id = q.lesson_id

      INNER JOIN lms_topics t
        ON t.id = l.topic_id

      INNER JOIN lms_units u
        ON u.id = t.unit_id

      INNER JOIN lms_programs p
        ON p.id = u.program_id

      LEFT JOIN applications a
        ON a.id = qa.student_id

      WHERE
        qa.submitted_at IS NOT NULL

      ORDER BY
        qa.submitted_at DESC
      `
    );

    /* =====================================================
       3. ASSIGNMENT RESULTS
    ===================================================== */

    /*
      Assignment relationship:

      lms_assignment_submissions
          ↓ assignment_id
      lms_assignments
          ↓ lesson_id
      lms_lessons
          ↓ topic_id
      lms_topics
          ↓ unit_id
      lms_units
          ↓ program_id
      lms_programs

      Student:

      lms_assignment_submissions.application_id
          ↓
      applications.id
    */

    const assignmentResult = await client.query(
      `
      SELECT
        s.id,

        s.application_id AS student_id,

        CONCAT_WS(
          ' ',
          a.first_name,
          a.middle_name,
          a.surname
        ) AS student_name,

        a.admission_number,

        p.name AS program_name,

        u.name AS unit_name,
        u.code AS unit_code,

        ass.title AS assessment_name,

        'Assignment' AS assessment_type,

        COALESCE(
          s.marks_awarded,
          0
        ) AS score,

        COALESCE(
          s.total_marks,
          ass.total_marks,
          0
        ) AS total_marks,

        CASE
          WHEN COALESCE(
            s.total_marks,
            ass.total_marks,
            0
          ) > 0
          THEN ROUND(
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              COALESCE(
                s.total_marks,
                ass.total_marks,
                1
              )::numeric
            ) * 100,
            2
          )
          ELSE 0
        END AS percentage,

        CASE
          WHEN
            COALESCE(
              s.total_marks,
              ass.total_marks,
              0
            ) > 0
            AND
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              COALESCE(
                s.total_marks,
                ass.total_marks,
                1
              )::numeric
            ) * 100 >= 80
          THEN 'A'

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 75
          THEN 'A-'

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 70
          THEN 'B+'

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 65
          THEN 'B'

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 60
          THEN 'B-'

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 55
          THEN 'C+'

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 50
          THEN 'C'

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 45
          THEN 'C-'

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 40
          THEN 'D+'

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 35
          THEN 'D'

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 30
          THEN 'D-'

          ELSE 'E'
        END AS grade,

        CASE
          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 80
          THEN 4.0

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 75
          THEN 3.7

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 70
          THEN 3.3

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 65
          THEN 3.0

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 60
          THEN 2.7

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 55
          THEN 2.3

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 50
          THEN 2.0

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 45
          THEN 1.7

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 40
          THEN 1.3

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 35
          THEN 1.0

          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 30
          THEN 0.7

          ELSE 0.0
        END AS grade_point,

        CASE
          WHEN
            (
              COALESCE(
                s.marks_awarded,
                0
              )::numeric
              /
              NULLIF(
                COALESCE(
                  s.total_marks,
                  ass.total_marks,
                  0
                ),
                0
              )::numeric
            ) * 100 >= 50
          THEN 'Passed'
          ELSE 'Failed'
        END AS status,

        s.submitted_at

      FROM lms_assignment_submissions s

      INNER JOIN lms_assignments ass
        ON ass.id = s.assignment_id

      INNER JOIN lms_lessons l
        ON l.id = ass.lesson_id

      INNER JOIN lms_topics t
        ON t.id = l.topic_id

      INNER JOIN lms_units u
        ON u.id = t.unit_id

      INNER JOIN lms_programs p
        ON p.id = u.program_id

      INNER JOIN applications a
        ON a.id = s.application_id

      WHERE
        s.status = 'graded'
        OR s.graded_at IS NOT NULL

      ORDER BY
        s.graded_at DESC NULLS LAST,
        s.submitted_at DESC
      `
    );

    /* =====================================================
       4. COMBINE RESULTS
    ===================================================== */

    const grades = [
      ...quizResult.rows,
      ...assignmentResult.rows,
    ]
      .map((row) => ({
        id: Number(row.id),

        studentId:
          Number(row.student_id) || 0,

        studentName:
          row.student_name || 'Unknown Student',

        admissionNumber:
          row.admission_number || '',

        programName:
          row.program_name || 'Unknown Program',

        unitName:
          row.unit_name || 'Unknown Unit',

        unitCode:
          row.unit_code || '',

        assessmentName:
          row.assessment_name || 'Assessment',

        assessmentType:
          row.assessment_type || 'Assessment',

        score:
          Number(row.score) || 0,

        totalMarks:
          Number(row.total_marks) || 0,

        percentage:
          Number(row.percentage) || 0,

        grade:
          row.grade || 'E',

        gradePoint:
          Number(row.grade_point) || 0,

        status:
          row.status || 'Pending',

        submittedAt:
          row.submitted_at || null,
      }))
      .sort((a, b) => {
        const dateA = a.submittedAt
          ? new Date(a.submittedAt).getTime()
          : 0;

        const dateB = b.submittedAt
          ? new Date(b.submittedAt).getTime()
          : 0;

        return dateB - dateA;
      });

    /* =====================================================
       5. SUMMARY
    ===================================================== */

    const studentIds = new Set(
      grades
        .map((grade) => grade.studentId)
        .filter(Boolean)
    );

    const totalStudents =
      studentIds.size;

    const totalAssessments =
      grades.length;

    const totalGraded =
      grades.filter(
        (grade) =>
          grade.status?.toLowerCase() ===
            'passed' ||
          grade.status?.toLowerCase() ===
            'failed'
      ).length;

    const averageScore =
      totalAssessments > 0
        ? grades.reduce(
            (sum, grade) =>
              sum +
              Number(
                grade.percentage
              ),
            0
          ) / totalAssessments
        : 0;

    const passed =
      grades.filter(
        (grade) =>
          grade.status?.toLowerCase() ===
          'passed'
      ).length;

    const passRate =
      totalAssessments > 0
        ? (passed /
            totalAssessments) *
          100
        : 0;

    /* =====================================================
       6. RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        grades,

        summary: {
          totalStudents,
          totalAssessments,
          totalGraded,

          averageScore:
            Number(
              averageScore.toFixed(2)
            ),

          passRate:
            Number(
              passRate.toFixed(2)
            ),
        },
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      'GET /api/lecturer/grades ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          'Failed to load lecturer grades.',
        grades: [],
        summary: {
          totalStudents: 0,
          totalAssessments: 0,
          totalGraded: 0,
          averageScore: 0,
          passRate: 0,
        },
      },
      {
        status: 500,
      }
    );
  } finally {
    client.release();
  }
}

