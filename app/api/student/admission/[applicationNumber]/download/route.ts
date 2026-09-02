// app/api/student/admission/[applicationNumber]/download/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getStudentSession } from '@/lib/student-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    applicationNumber: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    /* =====================================================
       1. CHECK STUDENT SESSION
    ===================================================== */

    const session = await getStudentSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized. Please log in.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       2. GET APPLICATION NUMBER FROM URL
    ===================================================== */

    const { applicationNumber } = await context.params;

    if (!applicationNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application number is required.',
        },
        { status: 400 }
      );
    }

    const requestedApplicationNumber =
      String(applicationNumber).trim();

    if (!requestedApplicationNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application number is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       3. VERIFY APPLICATION BELONGS TO LOGGED-IN STUDENT

       IMPORTANT:
       We use BOTH application ID and application number
       from the authenticated student session.

       This prevents a student from changing the
       application number in the URL and accessing
       another student's admission letter.
    ===================================================== */

    const applicationResult = await pool.query(
      `
        SELECT
          id,
          application_number,
          surname,
          middle_name,
          first_name,
          course,
          intake,
          application_status
        FROM applications
        WHERE id = $1
          AND application_number = $2
        LIMIT 1
      `,
      [
        session.applicationId,
        requestedApplicationNumber,
      ]
    );

    if (applicationResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Application not found or does not belong to this student.',
        },
        { status: 404 }
      );
    }

    const application = applicationResult.rows[0];

    /* =====================================================
       4. CHECK APPLICATION APPROVAL

       Admission letters are only available after the
       application has been approved.
    ===================================================== */

    const applicationStatus = String(
      application.application_status || ''
    )
      .trim()
      .toLowerCase();

    const isApproved = [
      'approved',
      'accepted',
      'admitted',
    ].includes(applicationStatus);

    if (!isApproved) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your admission letter is only available after your application has been approved.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       5. GET THE STUDENT'S ADMISSION RECORD

       IMPORTANT:
       We DO NOT generate an admission here.

       The admission must already have been created by
       the administrator.
    ===================================================== */

    const admissionResult = await pool.query(
      `
        SELECT
          a.id,
          a.application_id,
          a.admission_number,
          a.application_number,
          a.student_name,
          a.course,
          a.intake,
          a.admission_date,
          a.admission_status,
          a.admission_letter_path,
          a.admission_letter_pdf,
          a.created_at,
          a.updated_at
        FROM admissions a
        WHERE a.application_id = $1
          AND a.application_number = $2
        LIMIT 1
      `,
      [
        application.id,
        application.application_number,
      ]
    );

    /* =====================================================
       6. ADMISSION RECORD DOES NOT EXIST

       This means the application may have been approved,
       but the administrator has not yet created the
       admission record.
    ===================================================== */

    if (admissionResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your application has been approved, but your admission record has not yet been created by the Admissions Office.',
        },
        { status: 404 }
      );
    }

    const admission = admissionResult.rows[0];

    /* =====================================================
       7. CHECK ADMISSION STATUS
    ===================================================== */

    const admissionStatus = String(
      admission.admission_status || ''
    )
      .trim()
      .toLowerCase();

    if (admissionStatus !== 'active') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your admission letter is currently unavailable. Please contact the Admissions Office.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       8. CHECK STORED PDF

       The student must NEVER generate a new admission
       letter.

       The administrator's generated PDF is stored in:

         admissions.admission_letter_pdf

       We return that exact stored PDF.
    ===================================================== */

    if (!admission.admission_letter_pdf) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your admission letter has not yet been generated by the Admissions Office. Please check again later.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       9. CONVERT STORED BYTEA TO BUFFER

       PostgreSQL BYTEA is returned by pg as a Buffer.
       We make sure the response receives a Uint8Array.
    ===================================================== */

    const pdfBuffer = Buffer.isBuffer(
      admission.admission_letter_pdf
    )
      ? admission.admission_letter_pdf
      : Buffer.from(
          admission.admission_letter_pdf
        );

    if (pdfBuffer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The stored admission letter is empty or invalid. Please contact the Admissions Office.',
        },
        { status: 500 }
      );
    }

    /* =====================================================
       10. USE STORED ADMISSION NUMBER

       Example:

       SMTC/GEM01/026

       DO NOT use the application number here.
    ===================================================== */

    const admissionNumber = String(
      admission.admission_number || ''
    ).trim();

    if (!admissionNumber) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The admission record does not contain a valid admission number. Please contact the Admissions Office.',
        },
        { status: 500 }
      );
    }

    /* =====================================================
       11. SAFE DOWNLOAD FILE NAME
    ===================================================== */

    const safeAdmissionNumber =
      admissionNumber.replace(
        /[^a-zA-Z0-9_-]/g,
        '-'
      );

    const fileName =
      `SMTC-Admission-Letter-${safeAdmissionNumber}.pdf`;

    /* =====================================================
       12. RETURN THE ADMIN-GENERATED PDF

       No PDFKit.
       No PDF generation.
       No filesystem access.
       No regeneration.

       This is the exact PDF stored by the admin.
    ===================================================== */

    return new NextResponse(
      new Uint8Array(pdfBuffer),
      {
        status: 200,

        headers: {
          'Content-Type':
            'application/pdf',

          'Content-Disposition':
            `attachment; filename="${fileName}"`,

          'Content-Length':
            String(pdfBuffer.length),

          'Cache-Control':
            'private, no-store, no-cache, must-revalidate',

          'Pragma':
            'no-cache',

          'Expires':
            '0',

          'X-Content-Type-Options':
            'nosniff',
        },
      }
    );
  } catch (error) {
    /* =====================================================
       ERROR HANDLING
    ===================================================== */

    console.error(
      '========================================'
    );

    console.error(
      'STUDENT ADMISSION LETTER DOWNLOAD ERROR'
    );

    console.error(
      '========================================'
    );

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to download your admission letter. Please try again later.',
      },
      {
        status: 500,
      }
    );
  }
}

