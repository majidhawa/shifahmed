
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

/* =========================================================
TYPES
========================================================= */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
GET SINGLE APPLICATION
========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const admin = requireAdmin();

    /* =====================================================
       ADMIN AUTHENTICATION
    ===================================================== */

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       GET APPLICATION ID
    ===================================================== */

    const { id: idParam } = await context.params;

    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid application ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GET APPLICATION
    ===================================================== */

    const result = await pool.query(
      `
        SELECT
          id,
          application_number,

          /* =================================================
             PERSONAL INFORMATION
          ================================================= */

          surname,
          middle_name,
          first_name,

          date_of_birth,
          gender,
          nationality,
          country,
          id_passport_number,
          marital_status,

          /* =================================================
             CONTACT INFORMATION
          ================================================= */

          postal_address,
          postal_code,
          town,
          county,
          mobile,
          email,

          /* =================================================
             ACADEMIC INFORMATION
          ================================================= */

          kcse_index,
          kcse_year,
          kcse_mean_grade,
          english_grade,
          kiswahili_grade,
          biology_grade,
          chemistry_grade,
          physics_grade,
          mathematics_grade,
          previous_institution,
          highest_qualification,

          /* =================================================
             COURSE & INTAKE
          ================================================= */

          course,
          intake,

          /* =================================================
             SPONSOR INFORMATION
          ================================================= */

          sponsor_type,
          sponsor_name,
          sponsor_relationship,
          sponsor_mobile,
          sponsor_email,

          /* =================================================
             GUARDIAN INFORMATION
          ================================================= */

          guardian_name,
          guardian_relationship,
          guardian_mobile,
          guardian_email,

          /* =================================================
             DOCUMENTS
          ================================================= */

          id_document,
          kcse_certificate,
          passport_photo,

          declaration,

          /* =================================================
             APPLICATION FEE
          ================================================= */

          application_fee,

          /* =================================================
             PAYMENT STATUS
          ================================================= */

          payment_status,

          /* =================================================
             MANUAL M-PESA PAYMENT
          ================================================= */

          manual_mpesa_code,
          manual_mpesa_phone,
          manual_payment_submitted_at,

          manual_payment_verified_at,
          manual_payment_verified_by,
          manual_payment_rejection_reason,

          /* =================================================
             AUTOMATIC / HISTORICAL M-PESA INFORMATION
          ================================================= */

          mpesa_checkout_request_id,
          mpesa_merchant_request_id,
          mpesa_transaction_code,
          mpesa_receipt_number,
          mpesa_phone_number,
          mpesa_transaction_date,
          mpesa_result_code,
          mpesa_result_description,
          mpesa_amount,
          paid_at,

          payment_receipt_number,
          payment_verified_at,

          /* =================================================
             APPLICATION STATUS
          ================================================= */

          application_status,
          approved_at,
          rejection_reason,

          /* =================================================
             ADMISSION
          ================================================= */

          admission_number,

          /* =================================================
             DATES
          ================================================= */

          created_at,
          updated_at

        FROM applications

        WHERE id = $1

        LIMIT 1
      `,
      [id]
    );

    /* =====================================================
       APPLICATION NOT FOUND
    ===================================================== */

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application not found.',
        },
        { status: 404 }
      );
    }

    const application = result.rows[0];

    /* =====================================================
       NORMALIZE MANUAL PAYMENT DATA
    ===================================================== */

    const manualMpesaCode =
      application.manual_mpesa_code
        ? String(
            application.manual_mpesa_code
          ).trim()
        : null;

    const manualMpesaPhone =
      application.manual_mpesa_phone
        ? String(
            application.manual_mpesa_phone
          ).trim()
        : null;

    const rejectionReason =
      application.manual_payment_rejection_reason
        ? String(
            application.manual_payment_rejection_reason
          ).trim()
        : null;

    const paymentStatus =
      application.payment_status
        ? String(
            application.payment_status
          ).trim()
        : 'Pending';

    /* =====================================================
       RETURN APPLICATION

       The original application object is preserved.

       A dedicated manualMpesaPayment object is also added
       so the admin UI can easily display the payment details.
    ===================================================== */

    return NextResponse.json({
      success: true,

      application: {
        ...application,

        /* =================================================
           MANUAL M-PESA PAYMENT OBJECT
        ================================================= */

        manualMpesaPayment: {
          code: manualMpesaCode,

          phone: manualMpesaPhone,

          submittedAt:
            application
              .manual_payment_submitted_at ||
            null,

          verifiedAt:
            application
              .manual_payment_verified_at ||
            null,

          verifiedBy:
            application
              .manual_payment_verified_by ||
            null,

          rejectionReason:
            rejectionReason,

          status:
            paymentStatus,

          awaitingApproval:
            paymentStatus
              .toLowerCase()
              .replace(/[\s-]+/g, '_') ===
            'awaiting_approval',

          approved:
            paymentStatus === 'Paid' ||
            paymentStatus === 'Approved' ||
            paymentStatus === 'Verified',

          rejected:
            paymentStatus === 'Rejected',

          submitted:
            Boolean(manualMpesaCode),
        },

        /* =================================================
           DIRECT / EASY-ACCESS FIELDS
        ================================================= */

        manualMpesaCode:
          manualMpesaCode,

        manualMpesaPhone:
          manualMpesaPhone,

        manualPaymentSubmittedAt:
          application
            .manual_payment_submitted_at ||
          null,

        manualPaymentVerifiedAt:
          application
            .manual_payment_verified_at ||
          null,

        manualPaymentVerifiedBy:
          application
            .manual_payment_verified_by ||
          null,

        manualPaymentRejectionReason:
          rejectionReason,
      },
    });
  } catch (error) {
    console.error(
      'GET ADMIN APPLICATION ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load application.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
PATCH APPLICATION / PAYMENT
========================================================= */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const admin = requireAdmin();

    /* =====================================================
       ADMIN AUTHENTICATION
    ===================================================== */

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       GET APPLICATION ID
    ===================================================== */

    const { id: idParam } = await context.params;

    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid application ID.',
        },
        { status: 400 }
      );
    }

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
          message: 'Invalid request body.',
        },
        { status: 400 }
      );
    }

    const applicationStatus =
      body?.application_status;

    const paymentStatus =
      body?.payment_status;

    const paymentRejectionReason =
      body?.manual_payment_rejection_reason;

    const applicationRejectionReason =
      body?.rejection_reason;

    /* =====================================================
       GET CURRENT APPLICATION
    ===================================================== */

    const existingResult = await pool.query(
      `
        SELECT
          id,
          application_number,

          payment_status,

          manual_mpesa_code,
          manual_mpesa_phone,
          manual_payment_submitted_at,
          manual_payment_verified_at,
          manual_payment_verified_by,
          manual_payment_rejection_reason,

          application_status

        FROM applications

        WHERE id = $1

        LIMIT 1
      `,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application not found.',
        },
        { status: 404 }
      );
    }

    const existingApplication =
      existingResult.rows[0];

    /* =====================================================
       VALIDATE APPLICATION STATUS
    ===================================================== */

    if (
      applicationStatus !== undefined &&
      applicationStatus !== 'Approved' &&
      applicationStatus !== 'Rejected' &&
      applicationStatus !== 'Pending'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid application status.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE PAYMENT STATUS
    ===================================================== */

    if (
      paymentStatus !== undefined &&
      paymentStatus !== 'Paid' &&
      paymentStatus !== 'Rejected' &&
      paymentStatus !== 'Awaiting Approval' &&
      paymentStatus !== 'Pending'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid payment status.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       NOTHING TO UPDATE
    ===================================================== */

    if (
      applicationStatus === undefined &&
      paymentStatus === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No valid status update was provided.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       PAYMENT APPROVAL VALIDATION
    ===================================================== */

    if (paymentStatus === 'Paid') {
      const transactionCode =
        existingApplication.manual_mpesa_code;

      if (
        !transactionCode ||
        String(transactionCode).trim() === ''
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Cannot approve payment because the applicant has not submitted an M-Pesa transaction code.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       PAYMENT APPROVAL DUPLICATE CHECK
    ===================================================== */

    if (
      paymentStatus === 'Paid' &&
      existingApplication.payment_status ===
        'Paid'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This payment has already been approved.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       BUILD UPDATE
    ===================================================== */

    const fields: string[] = [];
    const values: unknown[] = [];

    let parameterIndex = 1;

    /* =====================================================
       APPLICATION STATUS
    ===================================================== */

    if (applicationStatus !== undefined) {
      fields.push(
        `application_status = $${parameterIndex}`
      );

      values.push(applicationStatus);

      parameterIndex++;
    }

    /* =====================================================
       PAYMENT STATUS
    ===================================================== */

    if (paymentStatus !== undefined) {
      fields.push(
        `payment_status = $${parameterIndex}`
      );

      values.push(paymentStatus);

      parameterIndex++;
    }

    /* =====================================================
       PAYMENT APPROVED
    ===================================================== */

    if (paymentStatus === 'Paid') {
      fields.push(
        `manual_payment_verified_at = NOW()`
      );

      fields.push(
        `manual_payment_verified_by = $${parameterIndex}`
      );

      values.push(admin.email);

      parameterIndex++;

      fields.push(
        `payment_verified_at = NOW()`
      );

      fields.push(
        `paid_at = NOW()`
      );

      fields.push(
        `manual_payment_rejection_reason = NULL`
      );

      /* ===============================================
         KEEP MANUAL M-PESA CODE AS OFFICIAL CODE
      =============================================== */

      fields.push(
        `mpesa_transaction_code = $${parameterIndex}`
      );

      values.push(
        String(
          existingApplication.manual_mpesa_code
        ).trim()
      );

      parameterIndex++;

      /* ===============================================
         KEEP MANUAL PHONE AS M-PESA PHONE
      =============================================== */

      if (
        existingApplication.manual_mpesa_phone
      ) {
        fields.push(
          `mpesa_phone_number = $${parameterIndex}`
        );

        values.push(
          existingApplication.manual_mpesa_phone
        );

        parameterIndex++;
      }
    }

    /* =====================================================
       PAYMENT REJECTED
    ===================================================== */

    if (paymentStatus === 'Rejected') {
      if (
        paymentRejectionReason !== undefined &&
        paymentRejectionReason !== null
      ) {
        const reason =
          String(
            paymentRejectionReason
          ).trim();

        if (reason.length > 0) {
          fields.push(
            `manual_payment_rejection_reason = $${parameterIndex}`
          );

          values.push(reason);

          parameterIndex++;
        }
      }

      fields.push(
        `manual_payment_verified_at = NULL`
      );

      fields.push(
        `manual_payment_verified_by = NULL`
      );

      fields.push(
        `payment_verified_at = NULL`
      );

      fields.push(
        `paid_at = NULL`
      );
    }

    /* =====================================================
       PAYMENT MOVED BACK TO PENDING
    ===================================================== */

    if (paymentStatus === 'Pending') {
      fields.push(
        `manual_payment_verified_at = NULL`
      );

      fields.push(
        `manual_payment_verified_by = NULL`
      );

      fields.push(
        `manual_payment_rejection_reason = NULL`
      );

      fields.push(
        `payment_verified_at = NULL`
      );

      fields.push(
        `paid_at = NULL`
      );
    }

    /* =====================================================
       APPLICATION APPROVED
    ===================================================== */

    if (applicationStatus === 'Approved') {
      fields.push(
        `approved_at = NOW()`
      );

      fields.push(
        `rejection_reason = NULL`
      );
    }

    /* =====================================================
       APPLICATION REJECTED
    ===================================================== */

    if (applicationStatus === 'Rejected') {
      if (
        applicationRejectionReason !==
          undefined &&
        applicationRejectionReason !== null
      ) {
        const reason =
          String(
            applicationRejectionReason
          ).trim();

        if (reason.length > 0) {
          fields.push(
            `rejection_reason = $${parameterIndex}`
          );

          values.push(reason);

          parameterIndex++;
        }
      }
    }

    /* =====================================================
       APPLICATION ID
    ===================================================== */

    values.push(id);

    /* =====================================================
       UPDATE DATABASE
    ===================================================== */

    const result = await pool.query(
      `
        UPDATE applications

        SET
          ${fields.join(', ')}

        WHERE id = $${parameterIndex}

        RETURNING
          id,
          application_number,

          surname,
          middle_name,
          first_name,

          date_of_birth,
          gender,
          nationality,
          country,
          id_passport_number,
          marital_status,

          postal_address,
          postal_code,
          town,
          county,
          mobile,
          email,

          kcse_index,
          kcse_year,
          kcse_mean_grade,
          english_grade,
          kiswahili_grade,
          biology_grade,
          chemistry_grade,
          physics_grade,
          mathematics_grade,
          previous_institution,
          highest_qualification,

          course,
          intake,

          sponsor_type,
          sponsor_name,
          sponsor_relationship,
          sponsor_mobile,
          sponsor_email,

          guardian_name,
          guardian_relationship,
          guardian_mobile,
          guardian_email,

          id_document,
          kcse_certificate,
          passport_photo,

          declaration,

          application_fee,

          payment_status,

          manual_mpesa_code,
          manual_mpesa_phone,
          manual_payment_submitted_at,
          manual_payment_verified_at,
          manual_payment_verified_by,
          manual_payment_rejection_reason,

          mpesa_transaction_code,
          mpesa_receipt_number,
          mpesa_phone_number,
          mpesa_transaction_date,
          mpesa_amount,
          paid_at,

          payment_receipt_number,
          payment_verified_at,

          application_status,
          approved_at,
          rejection_reason,

          admission_number,

          created_at,
          updated_at
      `,
      values
    );

    /* =====================================================
       VERIFY UPDATE
    ===================================================== */

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Application could not be updated.',
        },
        { status: 404 }
      );
    }

    const updatedApplication =
      result.rows[0];

    /* =====================================================
       ADMIN LOGGING
    ===================================================== */

    if (applicationStatus !== undefined) {
      console.log(
        `Admin ${admin.email} changed application #${id} status to ${applicationStatus}`
      );
    }

    if (paymentStatus !== undefined) {
      console.log(
        `Admin ${admin.email} changed payment status for application #${id} to ${paymentStatus}. Manual M-Pesa code: ${
          existingApplication.manual_mpesa_code ||
          'NONE'
        }`
      );
    }

    /* =====================================================
       RESPONSE MESSAGE
    ===================================================== */

    let message =
      'Application updated successfully.';

    if (paymentStatus === 'Paid') {
      message =
        'M-Pesa payment verified and approved successfully.';
    } else if (
      paymentStatus === 'Rejected'
    ) {
      message =
        'M-Pesa payment has been rejected.';
    } else if (
      paymentStatus === 'Awaiting Approval'
    ) {
      message =
        'Payment marked as awaiting approval.';
    } else if (
      paymentStatus === 'Pending'
    ) {
      message =
        'Payment status reset to pending.';
    } else if (
      applicationStatus === 'Approved'
    ) {
      message =
        'Application approved successfully.';
    } else if (
      applicationStatus === 'Rejected'
    ) {
      message =
        'Application rejected successfully.';
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      message,

      application: {
        ...updatedApplication,

        manualMpesaPayment: {
          code:
            updatedApplication
              .manual_mpesa_code ||
            null,

          phone:
            updatedApplication
              .manual_mpesa_phone ||
            null,

          submittedAt:
            updatedApplication
              .manual_payment_submitted_at ||
            null,

          verifiedAt:
            updatedApplication
              .manual_payment_verified_at ||
            null,

          verifiedBy:
            updatedApplication
              .manual_payment_verified_by ||
            null,

          rejectionReason:
            updatedApplication
              .manual_payment_rejection_reason ||
            null,

          status:
            updatedApplication
              .payment_status,

          submitted:
            Boolean(
              updatedApplication
                .manual_mpesa_code
            ),
        },
      },
    });
  } catch (error) {
    console.error(
      'UPDATE ADMIN APPLICATION ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update application.',
      },
      { status: 500 }
    );
  }
}

