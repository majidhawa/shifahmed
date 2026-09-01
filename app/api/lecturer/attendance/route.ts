import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   LECTURER ATTENDANCE API

   GET
   - Get lecturer's assigned programs
   - Get units
   - Get enrolled students
   - Get attendance records

   POST
   - Save attendance for one or many students

   PUT
   - Update attendance

   DELETE
   - Delete attendance
========================================================= */

const VALID_STATUSES = [
  'present',
  'absent',
  'late',
  'excused',
] as const;

type AttendanceStatus =
  (typeof VALID_STATUSES)[number];

/* =========================================================
   TYPES
========================================================= */

type AttendanceRecordInput = {
  enrollment_id: unknown;
  status: unknown;
  remarks?: unknown;
};

/* =========================================================
   HELPERS
========================================================= */

function isValidStatus(
  status: unknown
): status is AttendanceStatus {
  return (
    typeof status === 'string' &&
    VALID_STATUSES.includes(
      status as AttendanceStatus
    )
  );
}

function isValidDate(
  value: unknown
): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isPositiveInteger(
  value: unknown
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0
  );
}

/* =========================================================
   GET ATTENDANCE
========================================================= */

export async function GET(
  request: Request
) {
  try {
    /* =====================================================
       AUTHENTICATE LECTURER
    ===================================================== */

    const lecturer =
      await requireLecturer();

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

    const lecturerResult =
      await pool.query(
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

    if (
      lecturerResult.rows.length === 0
    ) {
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

    const currentLecturer =
      lecturerResult.rows[0];

    /* =====================================================
       QUERY PARAMETERS
    ===================================================== */

    const { searchParams } =
      new URL(request.url);

    const programId =
      searchParams.get('program_id');

    const unitId =
      searchParams.get('unit_id');

    /*
     * Support BOTH:
     *
     * ?date=2026-09-01
     *
     * and
     *
     * ?attendance_date=2026-09-01
     *
     * This keeps the API backwards compatible.
     */
    const date =
      searchParams.get('date') ||
      searchParams.get(
        'attendance_date'
      );

    /* =====================================================
       GET ASSIGNED PROGRAMS
    ===================================================== */

    const programsResult =
      await pool.query(
        `
          SELECT
            p.id,
            p.name,
            p.code,
            p.description,
            p.duration,
            p.level,
            p.status

          FROM lms_lecturer_programs lp

          INNER JOIN lms_programs p
            ON p.id = lp.program_id

          WHERE lp.lecturer_id = $1

          ORDER BY p.name ASC
        `,
        [currentLecturer.id]
      );

    const programs =
      programsResult.rows;

    /* =====================================================
       VERIFY SELECTED PROGRAM
    ===================================================== */

    if (programId) {
      const assignedProgram =
        programs.find(
          (program) =>
            String(program.id) ===
            String(programId)
        );

      if (!assignedProgram) {
        return NextResponse.json(
          {
            success: false,
            message:
              'You are not assigned to this program.',
          },
          {
            status: 403,
          }
        );
      }
    }

    /* =====================================================
       GET UNITS
    ===================================================== */

    let unitsQuery = `
      SELECT
        u.id,
        u.program_id,
        u.code,
        u.name,
        u.description,
        u.credit_hours,
        u.year_of_study,
        u.term_number,
        u.status,

        p.name AS program_name,
        p.code AS program_code

      FROM lms_units u

      INNER JOIN lms_programs p
        ON p.id = u.program_id

      INNER JOIN lms_lecturer_programs lp
        ON lp.program_id = u.program_id

      WHERE lp.lecturer_id = $1
    `;

    const unitsParams: (
      string | number
    )[] = [currentLecturer.id];

    if (programId) {
      unitsQuery += `
        AND u.program_id = $2
      `;

      unitsParams.push(
        Number(programId)
      );
    }

    if (unitId) {
      unitsQuery += `
        AND u.id = $${unitsParams.length + 1}
      `;

      unitsParams.push(
        Number(unitId)
      );
    }

    unitsQuery += `
      ORDER BY
        p.name ASC,
        u.year_of_study ASC,
        u.term_number ASC,
        u.name ASC
    `;

    const unitsResult =
      await pool.query(
        unitsQuery,
        unitsParams
      );

    const units =
      unitsResult.rows;

    /* =====================================================
       GET ENROLLED STUDENTS
    ===================================================== */

    let studentsQuery = `
      SELECT DISTINCT

        e.id AS enrollment_id,
        e.application_id,
        e.program_id,
        e.student_number,
        e.year_of_study,
        e.enrollment_status,
        e.enrolled_at,

        p.name AS program_name,
        p.code AS program_code,

        a.student_name,
        a.admission_number,
        a.application_number,

        app.first_name,
        app.middle_name,
        app.surname,
        app.mobile,
        app.email

      FROM lms_enrollments e

      INNER JOIN lms_programs p
        ON p.id = e.program_id

      INNER JOIN lms_lecturer_programs lp
        ON lp.program_id = e.program_id

      INNER JOIN admissions a
        ON a.application_id = e.application_id

      LEFT JOIN applications app
        ON app.id = e.application_id

      WHERE lp.lecturer_id = $1

        AND (
          e.enrollment_status IS NULL
          OR LOWER(e.enrollment_status)
             NOT IN (
               'completed',
               'cancelled'
             )
        )
    `;

    const studentsParams: (
      string | number
    )[] = [currentLecturer.id];

    if (programId) {
      studentsQuery += `
        AND e.program_id = $2
      `;

      studentsParams.push(
        Number(programId)
      );
    }

    studentsQuery += `
      ORDER BY
        a.student_name ASC
    `;

    const studentsResult =
      await pool.query(
        studentsQuery,
        studentsParams
      );

    /* =====================================================
       FORMAT STUDENTS
    ===================================================== */

    const students =
      studentsResult.rows.map(
        (student) => {
          const name =
            [
              student.first_name,
              student.middle_name,
              student.surname,
            ]
              .filter(
                (value) =>
                  value &&
                  String(value).trim() !== ''
              )
              .join(' ') ||
            student.student_name ||
            'Student';

          return {
            enrollment_id:
              student.enrollment_id,

            application_id:
              student.application_id,

            program_id:
              student.program_id,

            student_number:
              student.student_number,

            admission_number:
              student.admission_number ||
              student.student_number ||
              student.application_number ||
              null,

            name,

            email:
              student.email || null,

            phone:
              student.mobile || null,

            year_of_study:
              student.year_of_study,

            enrollment_status:
              student.enrollment_status,

            program: {
              id:
                student.program_id,

              name:
                student.program_name,

              code:
                student.program_code,
            },
          };
        }
      );

    /* =====================================================
       GET ATTENDANCE RECORDS
    ===================================================== */

    let attendanceQuery = `
      SELECT

        att.id,
        att.enrollment_id,
        att.program_id,
        att.unit_id,
        att.lecturer_id,
        att.attendance_date,
        att.status,
        att.remarks,
        att.created_at,
        att.updated_at,

        p.name AS program_name,
        p.code AS program_code,

        u.name AS unit_name,
        u.code AS unit_code,

        e.student_number,

        a.student_name,
        a.admission_number,

        app.first_name,
        app.middle_name,
        app.surname,
        app.mobile,
        app.email

      FROM lms_attendance att

      INNER JOIN lms_enrollments e
        ON e.id = att.enrollment_id

      INNER JOIN lms_programs p
        ON p.id = att.program_id

      LEFT JOIN lms_units u
        ON u.id = att.unit_id

      INNER JOIN admissions a
        ON a.application_id = e.application_id

      LEFT JOIN applications app
        ON app.id = e.application_id

      WHERE att.lecturer_id = $1
    `;

    const attendanceParams: (
      string | number
    )[] = [currentLecturer.id];

    if (programId) {
      attendanceQuery += `
        AND att.program_id = $2
      `;

      attendanceParams.push(
        Number(programId)
      );
    }

    if (unitId) {
      attendanceQuery += `
        AND att.unit_id = $${attendanceParams.length + 1}
      `;

      attendanceParams.push(
        Number(unitId)
      );
    }

    if (date) {
      attendanceQuery += `
        AND att.attendance_date = $${attendanceParams.length + 1}
      `;

      attendanceParams.push(date);
    }

    attendanceQuery += `
      ORDER BY
        att.attendance_date DESC,
        a.student_name ASC
    `;

    const attendanceResult =
      await pool.query(
        attendanceQuery,
        attendanceParams
      );

    /* =====================================================
       FORMAT ATTENDANCE
    ===================================================== */

    const attendance =
      attendanceResult.rows.map(
        (record) => {
          const name =
            [
              record.first_name,
              record.middle_name,
              record.surname,
            ]
              .filter(
                (value) =>
                  value &&
                  String(value).trim() !== ''
              )
              .join(' ') ||
            record.student_name ||
            'Student';

          return {
            id: record.id,

            enrollment_id:
              record.enrollment_id,

            program_id:
              record.program_id,

            unit_id:
              record.unit_id,

            lecturer_id:
              record.lecturer_id,

            attendance_date:
              record.attendance_date,

            status:
              record.status,

            remarks:
              record.remarks,

            student: {
              name,

              admission_number:
                record.admission_number ||
                record.student_number ||
                null,

              student_number:
                record.student_number,

              email:
                record.email || null,

              phone:
                record.mobile || null,
            },

            program: {
              id:
                record.program_id,

              name:
                record.program_name,

              code:
                record.program_code,
            },

            unit: record.unit_id
              ? {
                  id:
                    record.unit_id,

                  name:
                    record.unit_name,

                  code:
                    record.unit_code,
                }
              : null,

            created_at:
              record.created_at,

            updated_at:
              record.updated_at,
          };
        }
      );

    /* =====================================================
       STATISTICS
    ===================================================== */

    const statistics = {
      total:
        attendance.length,

      present:
        attendance.filter(
          (item) =>
            item.status === 'present'
        ).length,

      absent:
        attendance.filter(
          (item) =>
            item.status === 'absent'
        ).length,

      late:
        attendance.filter(
          (item) =>
            item.status === 'late'
        ).length,

      excused:
        attendance.filter(
          (item) =>
            item.status === 'excused'
        ).length,
    };

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        lecturer: {
          id:
            currentLecturer.id,

          name:
            currentLecturer.name,

          email:
            currentLecturer.email,

          phone:
            currentLecturer.phone,

          role:
            currentLecturer.role,
        },

        programs,

        units,

        students,

        attendance,

        statistics,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET LECTURER ATTENDANCE ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load attendance.',
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST ATTENDANCE

   Supports BULK:

   {
     program_id: 4,
     unit_id: 3,
     attendance_date: "2026-09-01",
     records: [
       {
         enrollment_id: 5,
         status: "present",
         remarks: ""
       }
     ]
   }

   Also supports SINGLE record:

   {
     enrollment_id: 5,
     program_id: 4,
     unit_id: 3,
     attendance_date: "2026-09-01",
     status: "present",
     remarks: ""
   }
========================================================= */

export async function POST(
  request: Request
) {
  try {
    /* =====================================================
       AUTHENTICATE
    ===================================================== */

    const lecturer =
      await requireLecturer();

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
       PARSE BODY
    ===================================================== */

    let body: Record<
      string,
      unknown
    >;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid JSON request body.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       COMMON VALUES
    ===================================================== */

    const programId =
      Number(body.program_id);

    const unitId =
      body.unit_id === null ||
      body.unit_id === undefined ||
      body.unit_id === ''
        ? null
        : Number(body.unit_id);

    const attendanceDate =
      body.attendance_date;

    /* =====================================================
       VALIDATE PROGRAM
    ===================================================== */

    if (
      !isPositiveInteger(programId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A valid program_id is required.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDATE UNIT
    ===================================================== */

    if (
      unitId !== null &&
      !isPositiveInteger(unitId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid unit_id.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDATE DATE
    ===================================================== */

    if (
      !isValidDate(
        attendanceDate
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A valid attendance_date is required in YYYY-MM-DD format.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VERIFY LECTURER PROGRAM ASSIGNMENT
    ===================================================== */

    const programResult =
      await pool.query(
        `
          SELECT
            p.id,
            p.name,
            p.code

          FROM lms_lecturer_programs lp

          INNER JOIN lms_programs p
            ON p.id = lp.program_id

          WHERE lp.lecturer_id = $1
            AND p.id = $2

          LIMIT 1
        `,
        [
          lecturer.id,
          programId,
        ]
      );

    if (
      programResult.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not assigned to this program.',
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       VERIFY UNIT
    ===================================================== */

    if (unitId !== null) {
      const unitResult =
        await pool.query(
          `
            SELECT
              id,
              program_id,
              name,
              code

            FROM lms_units

            WHERE id = $1
              AND program_id = $2

            LIMIT 1
          `,
          [
            unitId,
            programId,
          ]
        );

      if (
        unitResult.rows.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'The selected unit does not belong to this program.',
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       BUILD RECORDS

       Prefer the bulk records array.
       Fall back to the single-record format.
    ===================================================== */

    let records:
      AttendanceRecordInput[] = [];

    if (
      Array.isArray(body.records)
    ) {
      records =
        body.records as AttendanceRecordInput[];
    } else {
      records = [
        {
          enrollment_id:
            body.enrollment_id,

          status:
            body.status,

          remarks:
            body.remarks,
        },
      ];
    }

    /* =====================================================
       VALIDATE RECORDS ARRAY
    ===================================================== */

    if (
      records.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'At least one attendance record is required.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       NORMALIZE + VALIDATE RECORDS
    ===================================================== */

    const normalizedRecords =
      records.map(
        (record, index) => {
          const enrollmentId =
            Number(
              record.enrollment_id
            );

          const status =
            record.status;

          const remarks =
            typeof record.remarks ===
            'string'
              ? record.remarks.trim() ||
                null
              : null;

          if (
            !isPositiveInteger(
              enrollmentId
            )
          ) {
            throw new Error(
              `Record ${index + 1}: A valid enrollment_id is required.`
            );
          }

          if (
            !isValidStatus(status)
          ) {
            throw new Error(
              `Record ${index + 1}: Invalid attendance status.`
            );
          }

          return {
            enrollmentId,
            status,
            remarks,
          };
        }
      );

    /* =====================================================
       REMOVE DUPLICATE ENROLLMENTS

       This prevents the same student being inserted
       more than once in the same request.
    ===================================================== */

    const uniqueRecords =
      Array.from(
        new Map(
          normalizedRecords.map(
            (record) => [
              record.enrollmentId,
              record,
            ]
          )
        ).values()
      );

    /* =====================================================
       VERIFY ALL ENROLLMENTS

       Every student must belong to the selected program.
    ===================================================== */

    const enrollmentIds =
      uniqueRecords.map(
        (record) =>
          record.enrollmentId
      );

    const enrollmentResult =
      await pool.query(
        `
          SELECT
            e.id,
            e.application_id,
            e.program_id,
            e.student_number,
            e.enrollment_status

          FROM lms_enrollments e

          WHERE e.id = ANY($1::int[])
            AND e.program_id = $2
        `,
        [
          enrollmentIds,
          programId,
        ]
      );

    const validEnrollmentIds =
      new Set(
        enrollmentResult.rows.map(
          (row) =>
            Number(row.id)
        )
      );

    const invalidEnrollmentIds =
      enrollmentIds.filter(
        (id) =>
          !validEnrollmentIds.has(
            Number(id)
          )
      );

    if (
      invalidEnrollmentIds.length >
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'One or more students do not belong to the selected program.',
          invalid_enrollment_ids:
            invalidEnrollmentIds,
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       SAVE ALL ATTENDANCE RECORDS

       Use a transaction so the entire attendance sheet
       succeeds or fails together.
    ===================================================== */

    const client =
      await pool.connect();

    try {
      await client.query(
        'BEGIN'
      );

      const savedRecords = [];

      for (
        const record of uniqueRecords
      ) {
        const result =
          await client.query(
            `
              INSERT INTO lms_attendance (
                enrollment_id,
                program_id,
                unit_id,
                lecturer_id,
                attendance_date,
                status,
                remarks,
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
                $7,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
              )

              ON CONFLICT (
                enrollment_id,
                unit_id,
                attendance_date
              )

              DO UPDATE SET
                program_id =
                  EXCLUDED.program_id,

                lecturer_id =
                  EXCLUDED.lecturer_id,

                status =
                  EXCLUDED.status,

                remarks =
                  EXCLUDED.remarks,

                updated_at =
                  CURRENT_TIMESTAMP

              RETURNING *
            `,
            [
              record.enrollmentId,
              programId,
              unitId,
              lecturer.id,
              attendanceDate,
              record.status,
              record.remarks,
            ]
          );

        savedRecords.push(
          result.rows[0]
        );
      }

      await client.query(
        'COMMIT'
      );

      return NextResponse.json(
        {
          success: true,

          message:
            `Attendance saved successfully for ${savedRecords.length} student${
              savedRecords.length === 1
                ? ''
                : 's'
            }.`,
          
          count:
            savedRecords.length,

          attendance:
            savedRecords,
        },
        {
          status: 200,
        }
      );
    } catch (error) {
      await client.query(
        'ROLLBACK'
      );

      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(
      'POST LECTURER ATTENDANCE ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to save attendance.',
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PUT ATTENDANCE
========================================================= */

export async function PUT(
  request: Request
) {
  try {
    const lecturer =
      await requireLecturer();

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

    let body:
      Record<string, unknown>;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid JSON request body.',
        },
        {
          status: 400,
        }
      );
    }

    const id =
      Number(body.id);

    const status =
      body.status;

    const remarks =
      typeof body.remarks ===
      'string'
        ? body.remarks.trim() ||
          null
        : null;

    if (
      !isPositiveInteger(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A valid attendance id is required.',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidStatus(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid attendance status.',
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await pool.query(
        `
          UPDATE lms_attendance

          SET
            status = $1,
            remarks = $2,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $3
            AND lecturer_id = $4

          RETURNING *
        `,
        [
          status,
          remarks,
          id,
          lecturer.id,
        ]
      );

    if (
      result.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Attendance record was not found or you do not have permission to update it.',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          'Attendance updated successfully.',

        attendance:
          result.rows[0],
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'PUT LECTURER ATTENDANCE ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update attendance.',
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE ATTENDANCE
========================================================= */

export async function DELETE(
  request: Request
) {
  try {
    const lecturer =
      await requireLecturer();

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

    const { searchParams } =
      new URL(request.url);

    const id =
      Number(
        searchParams.get('id')
      );

    if (
      !isPositiveInteger(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A valid attendance id is required.',
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await pool.query(
        `
          DELETE FROM lms_attendance

          WHERE id = $1
            AND lecturer_id = $2

          RETURNING id
        `,
        [
          id,
          lecturer.id,
        ]
      );

    if (
      result.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Attendance record was not found or you do not have permission to delete it.',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          'Attendance deleted successfully.',

        id:
          result.rows[0].id,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'DELETE LECTURER ATTENDANCE ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to delete attendance.',
      },
      {
        status: 500,
      }
    );
  }
}