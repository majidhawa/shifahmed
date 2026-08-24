
import { NextResponse } from 'next/server';
import crypto from 'crypto';

import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/* =========================================================
   GENERATE ADMISSION NUMBER
========================================================= */

function generateAdmissionNumber(): string {
  const year = new Date().getFullYear();

  const randomPart = crypto
    .randomBytes(3)
    .toString('hex')
    .toUpperCase();

  return `SMTC/${year}/ADM/${randomPart}`;
}

/* =========================================================
   GET ADMISSIONS
========================================================= */

export async function GET() {
  try {
    const admin = requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const result = await pool.query(`
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

  } catch (error) {
    console.error(
      'GET ADMISSIONS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load admissions.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE ADMISSION
========================================================= */

export async function POST(request: Request) {
  try {
    const admin = requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const applicationId = Number(
      body?.application_id
    );

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A valid application ID is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK APPLICATION
    ===================================================== */

    const applicationResult =
      await pool.query(
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
            payment_status

          FROM applications

          WHERE id = $1

          LIMIT 1
        `,
        [applicationId]
      );

    if (applicationResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application not found.',
        },
        { status: 404 }
      );
    }

    const application =
      applicationResult.rows[0];

    /* =====================================================
       ONLY APPROVED APPLICATIONS
    ===================================================== */

    if (
      application.application_status !==
      'Approved'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Only approved applications can be admitted.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       PAYMENT CHECK
    ===================================================== */

    if (
      application.payment_status !==
      'paid'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The application fee must be paid before admission.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK EXISTING ADMISSION
    ===================================================== */

    const existingAdmission =
      await pool.query(
        `
          SELECT
            id,
            admission_number,
            application_number,
            student_name,
            course,
            intake,
            admission_date,
            admission_status,
            admission_letter_path

          FROM admissions

          WHERE application_id = $1

          LIMIT 1
        `,
        [applicationId]
      );

    if (
      existingAdmission.rows.length > 0
    ) {
      return NextResponse.json({
        success: true,
        message:
          'Admission already exists for this application.',
        admission:
          existingAdmission.rows[0],
      });
    }

    /* =====================================================
       STUDENT NAME
    ===================================================== */

    const studentName = [
      application.first_name,
      application.middle_name,
      application.surname,
    ]
      .filter(Boolean)
      .join(' ');

    /* =====================================================
       GENERATE ADMISSION NUMBER
    ===================================================== */

    let admissionNumber = '';

    let admissionCreated = false;

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate =
        generateAdmissionNumber();

      try {
        const result =
          await pool.query(
            `
              INSERT INTO admissions (
                application_id,
                admission_number,
                application_number,
                student_name,
                course,
                intake,
                admission_date,
                admission_status
              )

              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                CURRENT_DATE,
                'Active'
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
              candidate,
              application.application_number,
              studentName,
              application.course,
              application.intake,
            ]
          );

        admissionNumber =
          candidate;

        admissionCreated = true;

        return NextResponse.json(
          {
            success: true,
            message:
              'Admission created successfully.',
            admission: result.rows[0],
          },
          { status: 201 }
        );

      } catch (error: any) {

        if (
          error?.code === '23505'
        ) {
          continue;
        }

        throw error;
      }
    }

    if (!admissionCreated) {
      throw new Error(
        'Unable to generate a unique admission number.'
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          `Unable to create admission ${admissionNumber}.`,
      },
      { status: 500 }
    );

  } catch (error) {
    console.error(
      'CREATE ADMISSION ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to create admission.',
      },
      { status: 500 }
    );
  }
}

