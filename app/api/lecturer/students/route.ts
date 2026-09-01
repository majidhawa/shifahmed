
import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   GET /api/lecturer/students

   Returns only students enrolled in programs assigned
   to the currently authenticated lecturer.

   RELATIONSHIP:

   applications
        ↓
   admissions
        ↓
   lms_enrollments
        ↓
   lms_programs
        ↓
   lms_lecturer_programs

   STUDENT CONTACT DETAILS:

   applications.mobile
   applications.email
========================================================= */

export async function GET() {
  try {
    /* =====================================================
       GET CURRENT LECTURER
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
       VERIFY LECTURER ACCOUNT
    ===================================================== */

    const lecturerResult = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          phone,
          role,
          active
        FROM users
        WHERE id = $1
          AND role = 'lecturer'
          AND active = TRUE
        LIMIT 1
      `,
      [lecturer.id]
    );

    if (lecturerResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Lecturer account was not found or is inactive.',
        },
        {
          status: 401,
        }
      );
    }

    const currentLecturer = lecturerResult.rows[0];

    /* =====================================================
       GET STUDENTS

       Lecturer
          ↓
       Assigned Programs
          ↓
       Enrollments
          ↓
       Applications
          ↓
       Admissions

       IMPORTANT:

       Student phone and email are stored in applications:

       applications.mobile
       applications.email

       We therefore JOIN applications using:

       applications.id = lms_enrollments.application_id
    ===================================================== */

    const studentsResult = await pool.query(
      `
        SELECT DISTINCT
          /* =========================
             APPLICATION
          ========================= */

          app.id AS application_id,

          app.application_number,

          app.first_name,
          app.middle_name,
          app.surname,

          app.mobile AS student_phone,
          app.email AS student_email,

          app.course AS application_course,
          app.intake,

          /* =========================
             ADMISSION
          ========================= */

          a.id AS admission_id,

          a.student_name,

          a.admission_number,

          a.admission_date,

          a.admission_status,

          /* =========================
             ENROLLMENT
          ========================= */

          e.id AS enrollment_id,

          e.student_number,

          e.year_of_study,

          e.enrollment_status,

          e.enrolled_at,

          /* =========================
             PROGRAM
          ========================= */

          p.id AS program_id,

          p.name AS program_name,

          p.code AS program_code,

          p.level AS program_level

        FROM lms_lecturer_programs lp

        INNER JOIN lms_programs p
          ON p.id = lp.program_id

        INNER JOIN lms_enrollments e
          ON e.program_id = p.id

        INNER JOIN applications app
          ON app.id = e.application_id

        INNER JOIN admissions a
          ON a.application_id = e.application_id

        WHERE lp.lecturer_id = $1

        ORDER BY
          a.student_name ASC
      `,
      [currentLecturer.id]
    );

    /* =====================================================
       FORMAT STUDENTS
    ===================================================== */

    const students = studentsResult.rows.map(
      (student) => {
        /* -----------------------------------------------
           BUILD STUDENT NAME

           Prefer the structured application names.
        ------------------------------------------------ */

        const fullName =
          [
            student.first_name,
            student.middle_name,
            student.surname,
          ]
            .filter(
              (name) =>
                name !== null &&
                name !== undefined &&
                String(name).trim() !== ''
            )
            .join(' ') ||
          student.student_name ||
          'Student';

        /* -----------------------------------------------
           ADMISSION NUMBER

           Priority:

           1. admissions.admission_number
           2. enrollment.student_number
           3. applications.application_number
        ------------------------------------------------ */

        const admissionNumber =
          student.admission_number ||
          student.student_number ||
          student.application_number ||
          null;

        return {
          /* =========================
             FRONTEND ID
          ========================= */

          id: student.enrollment_id,

          /* =========================
             STUDENT
          ========================= */

          name: fullName,

          admission_number:
            admissionNumber,

          /* =========================
             CONTACT

             THESE ARE NOW REAL VALUES
             FROM applications.
          ========================= */

          email:
            student.student_email || null,

          phone:
            student.student_phone || null,

          /* =========================
             COURSE
          ========================= */

          course:
            student.program_name ||
            student.application_course ||
            null,

          /* =========================
             STATUS
          ========================= */

          status:
            student.enrollment_status ||
            student.admission_status ||
            'Active',

          /* =========================
             APPLICATION
          ========================= */

          application_id:
            student.application_id,

          application_number:
            student.application_number,

          /* =========================
             ENROLLMENT
          ========================= */

          enrollment_id:
            student.enrollment_id,

          student_number:
            student.student_number,

          year_of_study:
            student.year_of_study,

          enrollment_status:
            student.enrollment_status,

          enrolled_at:
            student.enrolled_at,

          /* =========================
             ADMISSION
          ========================= */

          admission_id:
            student.admission_id,

          intake:
            student.intake,

          admission_date:
            student.admission_date,

          admission_status:
            student.admission_status,

          /* =========================
             PROGRAM
          ========================= */

          program: {
            id:
              student.program_id,

            name:
              student.program_name,

            code:
              student.program_code,

            level:
              student.program_level,
          },
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
          id: currentLecturer.id,
          name: currentLecturer.name,
          email: currentLecturer.email,
          phone: currentLecturer.phone,
          role: currentLecturer.role,
        },

        students,

        count: students.length,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET LECTURER STUDENTS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load lecturer students.',
      },
      {
        status: 500,
      }
    );
  }
}

