import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

/* =========================================================
   ADMIN - ASSIGN STUDENTS

   GET
   /api/admin/assign-students

   Returns:
   - approved students
   - LMS programs
   - lecturers with authorized LMS programs
   - lecturer/program authorizations
   - current LMS enrollments
   - current lecturer assignments

   POST
   /api/admin/assign-students

   Creates/updates:
   - LMS enrollment
   - lecturer assignment

   DELETE
   /api/admin/assign-students

   Removes:
   - lecturer assignment
   - LMS enrollment
========================================================= */

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

/* =========================================================
   GET
========================================================= */

export async function GET() {
  const client = await pool.connect();

  try {
    /* =====================================================
       1. APPROVED STUDENTS
    ===================================================== */

    const studentsResult = await client.query(`
      SELECT
        a.id,
        a.id AS application_id,

        a.application_number,
        a.admission_number,

        a.first_name,
        a.middle_name,
        a.surname,

        TRIM(
          CONCAT_WS(
            ' ',
            a.first_name,
            a.middle_name,
            a.surname
          )
        ) AS full_name,

        a.email,
        a.mobile,

        a.course,
        a.intake,

        a.application_status,
        a.payment_status,

        a.created_at,
        a.approved_at

      FROM applications a

      WHERE LOWER(TRIM(a.application_status)) IN (
        'approved',
        'accepted'
      )

      ORDER BY
        LOWER(
          TRIM(
            CONCAT_WS(
              ' ',
              a.first_name,
              a.middle_name,
              a.surname
            )
          )
        ) ASC
    `);

    /* =====================================================
       2. LMS PROGRAMS
    ===================================================== */

    const programsResult = await client.query(`
      SELECT
        id,
        name

      FROM lms_programs

      ORDER BY
        LOWER(name) ASC
    `);

    /* =====================================================
       3. LECTURERS

       Only lecturers who have at least one authorized
       LMS program.

       GROUP BY is intentionally used instead of DISTINCT
       so PostgreSQL does not produce the previous
       transformDistinctClause error.
    ===================================================== */

    const lecturersResult = await client.query(`
      SELECT
        u.id,
        u.name,
        u.email

      FROM users u

      INNER JOIN lms_lecturer_programs lp
        ON lp.lecturer_id = u.id

      GROUP BY
        u.id,
        u.name,
        u.email

      ORDER BY
        LOWER(COALESCE(u.name, '')) ASC
    `);

    /* =====================================================
       4. LECTURER-PROGRAM AUTHORIZATIONS
    ===================================================== */

    const lecturerProgramsResult = await client.query(`
      SELECT
        lp.id,
        lp.lecturer_id,
        lp.program_id,
        lp.assigned_at,
        lp.updated_at,

        u.name AS lecturer_name,
        u.email AS lecturer_email,

        p.name AS program_name

      FROM lms_lecturer_programs lp

      INNER JOIN users u
        ON u.id = lp.lecturer_id

      INNER JOIN lms_programs p
        ON p.id = lp.program_id

      ORDER BY
        LOWER(COALESCE(u.name, '')) ASC,
        LOWER(COALESCE(p.name, '')) ASC
    `);

    /* =====================================================
       5. LMS ENROLLMENTS

       IMPORTANT:

       The frontend expects:

         status

       Therefore enrollment_status is returned as:

         status

       We ALSO return enrollment_status for compatibility.

       This is important because your database currently
       contains:

         application_id = 5
         program_id = 49
         program_name = German Language
         enrollment_status = active
         lecturer_id = 1

       So the frontend will correctly recognize it.
    ===================================================== */

    const enrollmentsResult = await client.query(`
      SELECT
        e.id,

        e.application_id,

        e.program_id,

        e.term_id,

        e.student_number,

        e.year_of_study,

        e.enrollment_status AS status,
        e.enrollment_status,

        e.enrolled_at,
        e.completed_at,

        e.lecturer_id,

        p.name AS program_name,

        u.name AS lecturer_name,
        u.email AS lecturer_email

      FROM lms_enrollments e

      LEFT JOIN lms_programs p
        ON p.id = e.program_id

      LEFT JOIN users u
        ON u.id = e.lecturer_id

      ORDER BY
        e.id DESC
    `);

    /* =====================================================
       6. LECTURER-STUDENT ASSIGNMENTS
    ===================================================== */

    const lecturerStudentsResult = await client.query(`
      SELECT
        ls.id,

        ls.lecturer_id,
        ls.application_id,
        ls.program_id,

        ls.assigned_at,
        ls.updated_at,

        u.name AS lecturer_name,
        u.email AS lecturer_email,

        p.name AS program_name,

        TRIM(
          CONCAT_WS(
            ' ',
            a.first_name,
            a.middle_name,
            a.surname
          )
        ) AS student_name,

        a.email AS student_email

      FROM lms_lecturer_students ls

      LEFT JOIN users u
        ON u.id = ls.lecturer_id

      LEFT JOIN lms_programs p
        ON p.id = ls.program_id

      LEFT JOIN applications a
        ON a.id = ls.application_id

      ORDER BY
        ls.id DESC
    `);

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      students: studentsResult.rows,

      programs: programsResult.rows,

      lecturers: lecturersResult.rows,

      lecturerPrograms:
        lecturerProgramsResult.rows,

      enrollments:
        enrollmentsResult.rows,

      lecturerAssignments:
        lecturerStudentsResult.rows,
    });
  } catch (error) {
    console.error(
      'GET /api/admin/assign-students:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error),
      },
      {
        status: 500,
      }
    );
  } finally {
    client.release();
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(request: Request) {
  const client = await pool.connect();

  try {
    const body = await request.json();

    /* =====================================================
       ACCEPT applicationId

       Also accept studentId for backwards compatibility.
    ===================================================== */

    const applicationId = Number(
      body.applicationId ??
        body.studentId
    );

    const programId = Number(
      body.programId
    );

    const lecturerId =
      body.lecturerId === null ||
      body.lecturerId === undefined ||
      body.lecturerId === ''
        ? null
        : Number(body.lecturerId);

    const termId =
      body.termId === null ||
      body.termId === undefined ||
      body.termId === ''
        ? null
        : Number(body.termId);

    const yearOfStudy =
      body.yearOfStudy === null ||
      body.yearOfStudy === undefined ||
      body.yearOfStudy === ''
        ? null
        : Number(body.yearOfStudy);

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A valid student application is required.',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(programId) ||
      programId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A valid LMS program is required.',
        },
        {
          status: 400,
        }
      );
    }

    if (
      lecturerId !== null &&
      (
        !Number.isInteger(lecturerId) ||
        lecturerId <= 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid lecturer.',
        },
        {
          status: 400,
        }
      );
    }

    await client.query('BEGIN');

    /* =====================================================
       1. VERIFY APPLICATION
    ===================================================== */

    const applicationResult =
      await client.query(
        `
          SELECT
            id,
            application_number,
            admission_number,
            first_name,
            middle_name,
            surname,
            email,
            course,
            intake,
            application_status

          FROM applications

          WHERE id = $1

          LIMIT 1
        `,
        [applicationId]
      );

    if (
      applicationResult.rowCount === 0
    ) {
      await client.query('ROLLBACK');

      return NextResponse.json(
        {
          success: false,
          error:
            'Student application not found.',
        },
        {
          status: 404,
        }
      );
    }

    const application =
      applicationResult.rows[0];

    /* =====================================================
       2. ONLY APPROVED STUDENTS
    ===================================================== */

    const status = String(
      application.application_status || ''
    )
      .trim()
      .toLowerCase();

    if (
      status !== 'approved' &&
      status !== 'accepted'
    ) {
      await client.query('ROLLBACK');

      return NextResponse.json(
        {
          success: false,
          error:
            'Only approved students can be assigned to the LMS.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       3. VERIFY LMS PROGRAM
    ===================================================== */

    const programResult =
      await client.query(
        `
          SELECT
            id,
            name

          FROM lms_programs

          WHERE id = $1

          LIMIT 1
        `,
        [programId]
      );

    if (
      programResult.rowCount === 0
    ) {
      await client.query('ROLLBACK');

      return NextResponse.json(
        {
          success: false,
          error:
            'LMS program not found.',
        },
        {
          status: 404,
        }
      );
    }

    const program =
      programResult.rows[0];

    /* =====================================================
       4. VERIFY LECTURER + AUTHORIZATION
    ===================================================== */

    let lecturer: {
      id: number;
      name: string;
      email: string;
    } | null = null;

    if (lecturerId !== null) {
      const lecturerResult =
        await client.query(
          `
            SELECT
              id,
              name,
              email

            FROM users

            WHERE id = $1

            LIMIT 1
          `,
          [lecturerId]
        );

      if (
        lecturerResult.rowCount === 0
      ) {
        await client.query('ROLLBACK');

        return NextResponse.json(
          {
            success: false,
            error: 'Lecturer not found.',
          },
          {
            status: 404,
          }
        );
      }

      lecturer =
        lecturerResult.rows[0];

      /* ===================================================
         VERIFY LECTURER IS AUTHORIZED FOR PROGRAM
      =================================================== */

      const authorizationResult =
        await client.query(
          `
            SELECT
              id

            FROM lms_lecturer_programs

            WHERE lecturer_id = $1
              AND program_id = $2

            LIMIT 1
          `,
          [
            lecturerId,
            programId,
          ]
        );

      if (
        authorizationResult.rowCount === 0
      ) {
        await client.query('ROLLBACK');

        return NextResponse.json(
          {
            success: false,
            error:
              'The selected lecturer is not authorized for this program.',
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       5. STUDENT NUMBER
    ===================================================== */

    const studentNumber =
      application.admission_number ||
      application.application_number ||
      `LMS-${application.id}`;

    /* =====================================================
       6. CHECK EXISTING LMS ENROLLMENT
    ===================================================== */

    const existingEnrollment =
      await client.query(
        `
          SELECT
            id

          FROM lms_enrollments

          WHERE application_id = $1

          ORDER BY id DESC

          LIMIT 1
        `,
        [applicationId]
      );

    let enrollmentId: number;

    /* =====================================================
       7. UPDATE EXISTING ENROLLMENT
    ===================================================== */

    if (
      existingEnrollment.rowCount &&
      existingEnrollment.rowCount > 0
    ) {
      enrollmentId =
        existingEnrollment.rows[0].id;

      await client.query(
        `
          UPDATE lms_enrollments

          SET
            program_id = $1,

            term_id = $2,

            student_number = $3,

            year_of_study =
              COALESCE(
                $4,
                year_of_study
              ),

            enrollment_status = 'active',

            lecturer_id = $5,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $6
        `,
        [
          programId,
          termId,
          studentNumber,
          yearOfStudy,
          lecturerId,
          enrollmentId,
        ]
      );
    }

    /* =====================================================
       8. CREATE NEW ENROLLMENT
    ===================================================== */

    else {
      const enrollmentInsert =
        await client.query(
          `
            INSERT INTO lms_enrollments (
              application_id,
              program_id,
              term_id,
              student_number,
              year_of_study,
              enrollment_status,
              enrolled_at,
              created_at,
              updated_at,
              lecturer_id
            )

            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              'active',
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP,
              $6
            )

            RETURNING id
          `,
          [
            applicationId,
            programId,
            termId,
            studentNumber,
            yearOfStudy,
            lecturerId,
          ]
        );

      enrollmentId =
        enrollmentInsert.rows[0].id;
    }

    /* =====================================================
       9. LECTURER-STUDENT ASSIGNMENT
    ===================================================== */

    if (lecturerId !== null) {
      /* ===================================================
         REMOVE PREVIOUS ASSIGNMENT
      =================================================== */

      await client.query(
        `
          DELETE FROM lms_lecturer_students

          WHERE application_id = $1
        `,
        [applicationId]
      );

      /* ===================================================
         CREATE CURRENT ASSIGNMENT
      =================================================== */

      await client.query(
        `
          INSERT INTO lms_lecturer_students (
            lecturer_id,
            application_id,
            program_id,
            assigned_at,
            updated_at
          )

          VALUES (
            $1,
            $2,
            $3,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `,
        [
          lecturerId,
          applicationId,
          programId,
        ]
      );
    } else {
      /* ===================================================
         NO LECTURER

         Remove lecturer assignment but keep LMS
         enrollment.
      =================================================== */

      await client.query(
        `
          DELETE FROM lms_lecturer_students

          WHERE application_id = $1
        `,
        [applicationId]
      );
    }

    /* =====================================================
       10. COMMIT
    ===================================================== */

    await client.query('COMMIT');

    /* =====================================================
       SUCCESS RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        lecturerId !== null
          ? `Student assigned to ${program.name} and ${lecturer?.name} successfully.`
          : `Student assigned to ${program.name} successfully.`,

      enrollmentId,

      applicationId,

      programId,

      programName: program.name,

      lecturerId,

      lecturerName:
        lecturer?.name || null,
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback errors
    }

    console.error(
      'POST /api/admin/assign-students:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error),
      },
      {
        status: 500,
      }
    );
  } finally {
    client.release();
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(
  request: Request
) {
  const client = await pool.connect();

  try {
    const body = await request.json();

    const applicationId = Number(
      body.applicationId ??
        body.studentId
    );

    const type =
      body.type || 'lecturer';

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A valid student application is required.',
        },
        {
          status: 400,
        }
      );
    }

    await client.query('BEGIN');

    /* =====================================================
       REMOVE LECTURER
    ===================================================== */

    if (type === 'lecturer') {
      await client.query(
        `
          DELETE FROM lms_lecturer_students

          WHERE application_id = $1
        `,
        [applicationId]
      );

      await client.query(
        `
          UPDATE lms_enrollments

          SET
            lecturer_id = NULL,
            updated_at = CURRENT_TIMESTAMP

          WHERE application_id = $1
        `,
        [applicationId]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,

        message:
          'Lecturer assignment removed successfully.',
      });
    }

    /* =====================================================
       REMOVE PROGRAM ENROLLMENT
    ===================================================== */

    if (type === 'program') {
      await client.query(
        `
          DELETE FROM lms_lecturer_students

          WHERE application_id = $1
        `,
        [applicationId]
      );

      await client.query(
        `
          DELETE FROM lms_enrollments

          WHERE application_id = $1
        `,
        [applicationId]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,

        message:
          'Student LMS enrollment removed successfully.',
      });
    }

    /* =====================================================
       INVALID DELETE TYPE
    ===================================================== */

    await client.query('ROLLBACK');

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid delete type.',
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback errors
    }

    console.error(
      'DELETE /api/admin/assign-students:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error),
      },
      {
        status: 500,
      }
    );
  } finally {
    client.release();
  }
}