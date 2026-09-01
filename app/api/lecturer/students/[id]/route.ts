
import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   GET /api/lecturer/students/[id]

   Returns one student assigned to the authenticated lecturer.

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

   Student contact information comes from:

   applications.mobile
   applications.email
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
       VERIFY LECTURER
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
       GET STUDENT ID
    ===================================================== */

    const { id } = await context.params;

    const studentId = Number(id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid student ID.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       GET STUDENT

       IMPORTANT:

       The URL ID represents the enrollment ID.

       We verify that the enrollment belongs to a program
       assigned to the current lecturer.

       Contact details come from applications.
    ===================================================== */

    const studentResult = await pool.query(
      `
        SELECT
          /* =========================
             ENROLLMENT
          ========================= */

          e.id AS enrollment_id,
          e.application_id,
          e.program_id,
          e.term_id,
          e.student_number,
          e.year_of_study,
          e.enrollment_status,
          e.enrolled_at,
          e.completed_at,

          /* =========================
             PROGRAM
          ========================= */

          p.name AS program_name,
          p.code AS program_code,
          p.level AS program_level,

          /* =========================
             APPLICATION
          ========================= */

          app.id AS application_id,
          app.application_number,

          app.surname,
          app.middle_name,
          app.first_name,

          app.date_of_birth,
          app.gender,
          app.nationality,
          app.country,

          app.id_passport_number,

          app.marital_status,

          app.postal_address,
          app.postal_code,
          app.town,
          app.county,

          /* CONTACT DETAILS */

          app.mobile,
          app.email,

          /* =========================
             ACADEMIC
          ========================= */

          app.kcse_index,
          app.kcse_year,
          app.kcse_mean_grade,

          app.english_grade,
          app.kiswahili_grade,
          app.biology_grade,
          app.chemistry_grade,
          app.physics_grade,
          app.mathematics_grade,

          app.previous_institution,
          app.highest_qualification,

          app.course,
          app.intake,

          /* =========================
             SPONSOR
          ========================= */

          app.sponsor_type,
          app.sponsor_name,
          app.sponsor_relationship,
          app.sponsor_mobile,
          app.sponsor_email,

          /* =========================
             GUARDIAN
          ========================= */

          app.guardian_name,
          app.guardian_relationship,
          app.guardian_mobile,
          app.guardian_email,

          /* =========================
             ADMISSION
          ========================= */

          a.id AS admission_id,
          a.admission_number,
          a.student_name,
          a.admission_date,
          a.admission_status

        FROM lms_enrollments e

        INNER JOIN applications app
          ON app.id = e.application_id

        INNER JOIN admissions a
          ON a.application_id = e.application_id

        INNER JOIN lms_programs p
          ON p.id = e.program_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = e.program_id

        WHERE e.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [studentId, currentLecturer.id]
    );

    /* =====================================================
       STUDENT NOT FOUND
    ===================================================== */

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Student was not found or is not assigned to you.',
        },
        {
          status: 404,
        }
      );
    }

    const student = studentResult.rows[0];

    /* =====================================================
       BUILD FULL STUDENT NAME

       applications is the source of the student's names.
    ===================================================== */

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

        student: {
          /* =========================
             BASIC
          ========================= */

          id: student.enrollment_id,

          name: fullName,

          admission_number:
            student.admission_number || null,

          student_number:
            student.student_number || null,

          application_number:
            student.application_number || null,

          /* =========================
             CONTACT
          ========================= */

          email:
            student.email || null,

          phone:
            student.mobile || null,

          /* =========================
             PERSONAL
          ========================= */

          date_of_birth:
            student.date_of_birth || null,

          gender:
            student.gender || null,

          nationality:
            student.nationality || null,

          country:
            student.country || null,

          id_passport_number:
            student.id_passport_number || null,

          marital_status:
            student.marital_status || null,

          /* =========================
             ADDRESS
          ========================= */

          postal_address:
            student.postal_address || null,

          postal_code:
            student.postal_code || null,

          town:
            student.town || null,

          county:
            student.county || null,

          /* =========================
             ACADEMIC
          ========================= */

          course:
            student.course ||
            student.program_name ||
            null,

          intake:
            student.intake || null,

          year_of_study:
            student.year_of_study || null,

          previous_institution:
            student.previous_institution || null,

          highest_qualification:
            student.highest_qualification || null,

          kcse_index:
            student.kcse_index || null,

          kcse_year:
            student.kcse_year || null,

          kcse_mean_grade:
            student.kcse_mean_grade || null,

          english_grade:
            student.english_grade || null,

          kiswahili_grade:
            student.kiswahili_grade || null,

          biology_grade:
            student.biology_grade || null,

          chemistry_grade:
            student.chemistry_grade || null,

          physics_grade:
            student.physics_grade || null,

          mathematics_grade:
            student.mathematics_grade || null,

          /* =========================
             ADMISSION
          ========================= */

          admission_date:
            student.admission_date || null,

          admission_status:
            student.admission_status || null,

          /* =========================
             ENROLLMENT
          ========================= */

          enrollment_status:
            student.enrollment_status || null,

          enrolled_at:
            student.enrolled_at || null,

          completed_at:
            student.completed_at || null,

          /* =========================
             IDS
          ========================= */

          application_id:
            student.application_id || null,

          enrollment_id:
            student.enrollment_id || null,

          admission_id:
            student.admission_id || null,

          /* =========================
             PROGRAM
          ========================= */

          program: {
            id:
              student.program_id || null,

            name:
              student.program_name || null,

            code:
              student.program_code || null,

            level:
              student.program_level || null,
          },

          /* =========================
             SPONSOR
          ========================= */

          sponsor: {
            type:
              student.sponsor_type || null,

            name:
              student.sponsor_name || null,

            relationship:
              student.sponsor_relationship || null,

            mobile:
              student.sponsor_mobile || null,

            email:
              student.sponsor_email || null,
          },

          /* =========================
             GUARDIAN
          ========================= */

          guardian: {
            name:
              student.guardian_name || null,

            relationship:
              student.guardian_relationship || null,

            mobile:
              student.guardian_mobile || null,

            email:
              student.guardian_email || null,
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET LECTURER STUDENT DETAILS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load student details.',
      },
      {
        status: 500,
      }
    );
  }
}

