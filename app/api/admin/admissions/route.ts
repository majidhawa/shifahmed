import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================================================
   TYPES
========================================================= */

type Application = {
  id: number;
  application_number: string;

  first_name: string | null;
  middle_name: string | null;
  surname: string | null;

  course: string;
  intake: string;

  application_status: string | null;
  payment_status: string | null;

  created_at: string | Date;
};

type Admission = {
  id: number;
  application_id: number;
  admission_number: string;
  application_number: string;
  student_name: string;
  course: string;
  intake: string;
  admission_date: string;
  admission_status: string;
  admission_letter_path: string | null;
  created_at?: string;
  updated_at?: string;
};

/* =========================================================
   COURSE CODE MAPPING

   AGREED FORMAT:

   SMTC/COURSECODE##/YYY

   Examples:
   SMTC/GEM01/026
   SMTC/PMED02/026
========================================================= */

function getCourseCode(course: string): string {
  const normalized = course.trim().toLowerCase();

  switch (normalized) {
    case 'emergency medical technology':
      return 'EMT';

    case 'safe phlebotomy':
      return 'PLE';

    case 'german language':
      return 'GEM';

    case 'caregiving':
      return 'CG';

    case 'dialysis technology':
      return 'DT';

    case 'diploma in paramedicine':
      return 'PMED';

    default:
      throw new Error(
        `Unsupported course "${course}". Please add a course-code mapping before creating an admission.`,
      );
  }
}

/* =========================================================
   HELPERS
========================================================= */

function getFullName(application: Application): string {
  return [
    application.first_name,
    application.middle_name,
    application.surname,
  ]
    .filter(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0,
    )
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* =========================================================
   APPLICATION YEAR

   Uses applications.created_at because the admission
   sequence is based on when the application was submitted.
========================================================= */

function getApplicationYear(
  createdAt: string | Date,
): number {
  const date =
    createdAt instanceof Date
      ? createdAt
      : new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      'The application has an invalid submission date.',
    );
  }

  return date.getFullYear();
}

/* =========================================================
   SHORT YEAR

   2026 -> 026
   2027 -> 027
========================================================= */

function getShortYear(year: number): string {
  return String(year).slice(-3);
}

/* =========================================================
   ADMISSION NUMBER

   Final format:

   SMTC/${courseCode}${sequence}/${shortYear}

   Example:

   SMTC/GEM01/026
========================================================= */

function buildAdmissionNumber(
  courseCode: string,
  sequence: number,
  year: number,
): string {
  if (!Number.isInteger(sequence) || sequence <= 0) {
    throw new Error(
      'Invalid admission sequence.',
    );
  }

  /*
   * Minimum width is two digits.
   *
   * 1  -> 01
   * 9  -> 09
   * 10 -> 10
   * 99 -> 99
   * 100 -> 100
   *
   * We intentionally do not truncate values above 99.
   */
  const sequencePart = String(sequence).padStart(2, '0');

  return `SMTC/${courseCode}${sequencePart}/${getShortYear(year)}`;
}

/* =========================================================
   GET /api/admin/admissions

   Returns all admissions.
========================================================= */

export async function GET() {
  try {
    await requireAdmin();

    const result = await pool.query<Admission>(`
      SELECT
        id,
        application_id,
        admission_number,
        application_number,
        student_name,
        course,
        intake,
        admission_date,
        admission_status,
        admission_letter_path,
        created_at,
        updated_at
      FROM admissions
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      admissions: result.rows,
    });
  } catch (error: any) {
    console.error(
      'GET /api/admin/admissions error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Failed to load admissions.',
      },
      { status: 500 },
    );
  }
}

/* =========================================================
   POST /api/admin/admissions

   Creates an admission.

   IMPORTANT:

   This endpoint DOES NOT generate the admission-letter PDF.

   The admission letter is generated and permanently saved
   by:

   /api/admin/admissions/[id]/letter

   when the administrator clicks the enabled admission-letter
   button.

   Body:

   {
     application_id: number
   }

   Admission-number format:

   SMTC/COURSECODE##/YYY

   Example:

   SMTC/GEM01/026
========================================================= */

export async function POST(
  request: NextRequest,
) {
  const client = await pool.connect();

  try {
    await requireAdmin();

    /* =====================================================
       READ REQUEST
    ===================================================== */

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON request body.',
        },
        { status: 400 },
      );
    }

    const applicationId = Number(
      body?.application_id,
    );

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A valid application_id is required.',
        },
        { status: 400 },
      );
    }

    /* =====================================================
       BEGIN TRANSACTION
    ===================================================== */

    await client.query('BEGIN');

    /* =====================================================
       LOCK APPLICATION

       This prevents two simultaneous admin requests from
       creating two admissions for the same application.
    ===================================================== */

    const applicationResult =
      await client.query<Application>(
        `
          SELECT
            id,
            application_number,
            first_name,
            middle_name,
            surname,
            course,
            intake,
            application_status,
            payment_status,
            created_at
          FROM applications
          WHERE id = $1
          FOR UPDATE
        `,
        [applicationId],
      );

    if (
      !applicationResult.rowCount ||
      !applicationResult.rows[0]
    ) {
      await client.query('ROLLBACK');

      return NextResponse.json(
        {
          success: false,
          error: 'Application not found.',
        },
        { status: 404 },
      );
    }

    const application =
      applicationResult.rows[0];

    /* =====================================================
       CHECK APPLICATION STATUS

       Admission can only be created after approval.
    ===================================================== */

    const applicationStatus = String(
      application.application_status || '',
    )
      .trim()
      .toLowerCase();

    if (applicationStatus !== 'approved') {
      await client.query('ROLLBACK');

      return NextResponse.json(
        {
          success: false,
          error:
            'The application must be approved before an admission can be created.',
        },
        { status: 400 },
      );
    }

    /* =====================================================
       CHECK PAYMENT STATUS

       Admission can only be created after payment is Paid.
    ===================================================== */

    const paymentStatus = String(
      application.payment_status || '',
    )
      .trim()
      .toLowerCase();

    if (paymentStatus !== 'paid') {
      await client.query('ROLLBACK');

      return NextResponse.json(
        {
          success: false,
          error:
            'The application payment must be marked as Paid before an admission can be created.',
        },
        { status: 400 },
      );
    }

    /* =====================================================
       CHECK EXISTING ADMISSION

       VERY IMPORTANT:

       Once an admission number exists, it must NEVER be
       regenerated for that application.

       Therefore, we check first and immediately return the
       existing admission.
    ===================================================== */

    const existingResult =
      await client.query<Admission>(
        `
          SELECT
            id,
            application_id,
            admission_number,
            application_number,
            student_name,
            course,
            intake,
            admission_date,
            admission_status,
            admission_letter_path,
            created_at,
            updated_at
          FROM admissions
          WHERE application_id = $1
          LIMIT 1
          FOR UPDATE
        `,
        [applicationId],
      );

    if (
      existingResult.rowCount &&
      existingResult.rows[0]
    ) {
      const existing =
        existingResult.rows[0];

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        existing: true,
        admission: existing,
        has_letter:
          Boolean(
            existing.admission_letter_path,
          ),
        message:
          'An admission already exists for this application. The existing admission number has been preserved.',
      });
    }

    /* =====================================================
       COURSE CODE
    ===================================================== */

    let courseCode: string;

    try {
      courseCode = getCourseCode(
        application.course,
      );
    } catch (error: any) {
      await client.query('ROLLBACK');

      return NextResponse.json(
        {
          success: false,
          error:
            error?.message ||
            'The selected course does not have an admission code.',
        },
        { status: 400 },
      );
    }

    /* =====================================================
       APPLICATION YEAR
    ===================================================== */

    const applicationYear =
      getApplicationYear(
        application.created_at,
      );

    /* =====================================================
       ADVISORY LOCK

       We lock the specific course/year combination.

       Example:

       GEM:2026
       PMED:2026
       CG:2026

       This ensures two applications from the same
       course/year cannot calculate the same sequence at
       exactly the same time.
    ===================================================== */

    const lockKey =
      `${courseCode}:${applicationYear}`;

    await client.query(
      `
        SELECT pg_advisory_xact_lock(
          hashtextextended($1, 0)
        )
      `,
      [lockKey],
    );

    /* =====================================================
       DETERMINE APPLICATION SUBMISSION ORDER

       THIS IS THE IMPORTANT PART.

       The admission number is NOT based on:

       - when the admin creates the admission
       - when the admission letter is generated
       - the admissions table ID

       Instead, it is based on:

       1. Same course
       2. Same application year
       3. applications.created_at
       4. applications.id as deterministic tie-breaker

       Example:

       German applications:

       Application A
       created_at = Aug 01
       -> GEM01

       Application B
       created_at = Aug 03
       -> GEM02

       Application C
       created_at = Aug 05
       -> GEM03

       Even if C is approved first, C still gets GEM03.
    ===================================================== */

    const sequenceResult =
      await client.query<{
        sequence: string;
      }>(
        `
          SELECT
            COUNT(*) + 1 AS sequence
          FROM applications a
          WHERE
            LOWER(TRIM(a.course)) =
              LOWER(TRIM($1))

            AND EXTRACT(
              YEAR FROM a.created_at
            ) = $2

            AND (
              a.created_at < $3

              OR (
                a.created_at = $3
                AND a.id < $4
              )
            )
        `,
        [
          application.course,
          applicationYear,
          application.created_at,
          application.id,
        ],
      );

    const sequence = Number(
      sequenceResult.rows[0]?.sequence || 1,
    );

    if (
      !Number.isInteger(sequence) ||
      sequence <= 0
    ) {
      throw new Error(
        'Failed to determine the admission sequence.',
      );
    }

    /* =====================================================
       BUILD PERMANENT ADMISSION NUMBER
    ===================================================== */

    const admissionNumber =
      buildAdmissionNumber(
        courseCode,
        sequence,
        applicationYear,
      );

    /* =====================================================
       STUDENT NAME
    ===================================================== */

    const studentName =
      getFullName(application);

    if (!studentName) {
      throw new Error(
        'The application does not contain a valid student name.',
      );
    }

    /* =====================================================
       CREATE ADMISSION

       The letter fields remain NULL.

       The admission-letter endpoint will generate and save
       the PDF when the admin clicks:

       "Generate & Download Letter"

       After generation, subsequent clicks will download
       the exact saved PDF.
    ===================================================== */

    const insertResult =
      await client.query<Admission>(
        `
          INSERT INTO admissions (
            application_id,
            admission_number,
            application_number,
            student_name,
            course,
            intake,
            admission_date,
            admission_status,
            admission_letter_path,
            admission_letter_pdf
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            CURRENT_DATE,
            'Active',
            NULL,
            NULL
          )
          RETURNING
            id,
            application_id,
            admission_number,
            application_number,
            student_name,
            course,
            intake,
            admission_date,
            admission_status,
            admission_letter_path,
            created_at,
            updated_at
        `,
        [
          application.id,
          admissionNumber,
          application.application_number,
          studentName,
          application.course,
          application.intake,
        ],
      );

    const admission =
      insertResult.rows[0];

    if (!admission) {
      throw new Error(
        'Failed to create the admission record.',
      );
    }

    /* =====================================================
       KEEP APPLICATION ADMISSION NUMBER IN SYNC

       admissions.admission_number is the authoritative
       admission number.

       If applications.admission_number exists, mirror the
       same permanent number there.

       This update is intentionally non-fatal so that this
       admissions API continues working even if an older
       database schema does not contain that column.
    ===================================================== */

    try {
      await client.query(
        `
          UPDATE applications
          SET admission_number = $1
          WHERE id = $2
        `,
        [
          admissionNumber,
          application.id,
        ],
      );
    } catch (syncError) {
      console.warn(
        'Could not synchronize applications.admission_number:',
        syncError,
      );
    }

    /* =====================================================
       COMMIT
    ===================================================== */

    await client.query('COMMIT');

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        existing: false,
        admission,
        has_letter: false,
        message:
          `Admission ${admissionNumber} created successfully. The admission letter can now be generated because the application is approved.`,
      },
      { status: 201 },
    );
  } catch (error: any) {
    /* =====================================================
       ROLLBACK
    ===================================================== */

    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback errors.
    }

    console.error(
      'POST /api/admin/admissions error:',
      error,
    );

    /* =====================================================
       UNIQUE CONSTRAINT HANDLING

       If another request somehow created the admission
       first, return the existing record instead of creating
       another admission number.
    ===================================================== */

    if (error?.code === '23505') {
      try {
        const requestBody =
          await request
            .clone()
            .json()
            .catch(() => null);

        const applicationId = Number(
          requestBody?.application_id,
        );

        if (
          Number.isInteger(applicationId) &&
          applicationId > 0
        ) {
          const existing =
            await pool.query<Admission>(
              `
                SELECT
                  id,
                  application_id,
                  admission_number,
                  application_number,
                  student_name,
                  course,
                  intake,
                  admission_date,
                  admission_status,
                  admission_letter_path,
                  created_at,
                  updated_at
                FROM admissions
                WHERE application_id = $1
                LIMIT 1
              `,
              [applicationId],
            );

          if (
            existing.rowCount &&
            existing.rows[0]
          ) {
            return NextResponse.json({
              success: true,
              existing: true,
              admission:
                existing.rows[0],
              has_letter:
                Boolean(
                  existing.rows[0]
                    .admission_letter_path,
                ),
              message:
                'An admission already exists for this application. The existing admission number has been preserved.',
            });
          }
        }
      } catch (lookupError) {
        console.error(
          'Failed to retrieve existing admission after unique constraint:',
          lookupError,
        );
      }
    }

    /* =====================================================
       FINAL ERROR
    ===================================================== */

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Failed to create admission.',
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

