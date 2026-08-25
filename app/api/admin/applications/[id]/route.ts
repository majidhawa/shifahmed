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
   HELPERS
========================================================= */

function normalizeStatus(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value).trim();
}

function cleanValue(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed === '' ? null : trimmed;
  }

  return value;
}

/* =========================================================
   GET SINGLE APPLICATION
========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
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

    /* =====================================================
       GET ID
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

          application_status,
          approved_at,
          rejection_reason,

          admission_number,

          created_at,
          updated_at

        FROM applications

        WHERE id = $1

        LIMIT 1
      `,
      [id]
    );

    /* =====================================================
       NOT FOUND
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

    const paymentStatus = String(
      application.payment_status || 'Pending'
    ).trim();

    const manualMpesaCode =
      application.manual_mpesa_code
        ? String(application.manual_mpesa_code).trim()
        : null;

    const manualMpesaPhone =
      application.manual_mpesa_phone
        ? String(application.manual_mpesa_phone).trim()
        : null;

    const rejectionReason =
      application.manual_payment_rejection_reason
        ? String(
            application.manual_payment_rejection_reason
          ).trim()
        : null;

    return NextResponse.json({
      success: true,

      application: {
        ...application,

        manualMpesaCode,

        manualMpesaPhone,

        manualPaymentSubmittedAt:
          application.manual_payment_submitted_at || null,

        manualPaymentVerifiedAt:
          application.manual_payment_verified_at || null,

        manualPaymentVerifiedBy:
          application.manual_payment_verified_by || null,

        manualPaymentRejectionReason:
          rejectionReason,

        manualMpesaPayment: {
          code: manualMpesaCode,

          phone: manualMpesaPhone,

          submittedAt:
            application.manual_payment_submitted_at || null,

          verifiedAt:
            application.manual_payment_verified_at || null,

          verifiedBy:
            application.manual_payment_verified_by || null,

          rejectionReason,

          status: paymentStatus,

          awaitingApproval:
            paymentStatus
              .toLowerCase()
              .replace(/[\s-]+/g, '_') ===
            'awaiting_approval',

          approved:
            ['paid', 'approved', 'verified'].includes(
              paymentStatus.toLowerCase()
            ),

          rejected:
            paymentStatus.toLowerCase() === 'rejected',

          submitted:
            Boolean(manualMpesaCode),
        },
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
   PATCH APPLICATION
========================================================= */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    /* =====================================================
       ADMIN AUTHENTICATION
    ===================================================== */

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
       READ BODY
    ===================================================== */

    let body: Record<string, unknown>;

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

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GET EXISTING APPLICATION
    ===================================================== */

    const existingResult = await pool.query(
      `
        SELECT
          *

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
       STATUS VALUES
    ===================================================== */

    const applicationStatus =
      normalizeStatus(body.application_status);

    const paymentStatus =
      normalizeStatus(body.payment_status);

    const paymentRejectionReason =
      body.manual_payment_rejection_reason;

    const applicationRejectionReason =
      body.rejection_reason;

    /* =====================================================
       VALIDATE APPLICATION STATUS
    ===================================================== */

    const validApplicationStatuses = [
      'Pending',
      'Approved',
      'Rejected',
    ];

    if (
      applicationStatus !== undefined &&
      !validApplicationStatuses.includes(
        applicationStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid application status.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE PAYMENT STATUS
    ===================================================== */

    const validPaymentStatuses = [
      'Pending',
      'Awaiting Approval',
      'Paid',
      'Rejected',
    ];

    if (
      paymentStatus !== undefined &&
      !validPaymentStatuses.includes(
        paymentStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid payment status.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       EDITABLE APPLICATION FIELDS

       IMPORTANT:

       These are the fields that the edit page is
       allowed to modify.

       This prevents users from injecting arbitrary
       database column names into the SQL query.
    ===================================================== */

    const editableFields = [
      /* PERSONAL */
      'surname',
      'middle_name',
      'first_name',
      'date_of_birth',
      'gender',
      'nationality',
      'country',
      'id_passport_number',
      'marital_status',

      /* CONTACT */
      'postal_address',
      'postal_code',
      'town',
      'county',
      'mobile',
      'email',

      /* ACADEMIC */
      'kcse_index',
      'kcse_year',
      'kcse_mean_grade',
      'english_grade',
      'kiswahili_grade',
      'biology_grade',
      'chemistry_grade',
      'physics_grade',
      'mathematics_grade',
      'previous_institution',
      'highest_qualification',

      /* COURSE */
      'course',
      'intake',

      /* SPONSOR */
      'sponsor_type',
      'sponsor_name',
      'sponsor_relationship',
      'sponsor_mobile',
      'sponsor_email',

      /* GUARDIAN */
      'guardian_name',
      'guardian_relationship',
      'guardian_mobile',
      'guardian_email',

      /* DOCUMENTS */
      'id_document',
      'kcse_certificate',
      'passport_photo',

      /* DECLARATION */
      'declaration',

      /* APPLICATION */
      'application_fee',

      /* ADMISSION */
      'admission_number',
    ] as const;

    /* =====================================================
       BUILD UPDATE
    ===================================================== */

    const fields: string[] = [];
    const values: unknown[] = [];

    let parameterIndex = 1;

    /* =====================================================
       UPDATE NORMAL APPLICATION FIELDS
    ===================================================== */

    for (const field of editableFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          body,
          field
        )
      ) {
        fields.push(
          `${field} = $${parameterIndex}`
        );

        values.push(
          cleanValue(body[field])
        );

        parameterIndex++;
      }
    }

    /* =====================================================
       UPDATE APPLICATION STATUS
    ===================================================== */

    if (applicationStatus !== undefined) {
      fields.push(
        `application_status = $${parameterIndex}`
      );

      values.push(applicationStatus);

      parameterIndex++;
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
        applicationRejectionReason !== undefined
      ) {
        const reason =
          cleanValue(
            applicationRejectionReason
          );

        fields.push(
          `rejection_reason = $${parameterIndex}`
        );

        values.push(reason);

        parameterIndex++;
      }
    }

    /* =====================================================
       APPLICATION RETURNED TO PENDING
    ===================================================== */

    if (applicationStatus === 'Pending') {
      fields.push(
        `approved_at = NULL`
      );
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

      /* -----------------------------------------------
         Verification information
      ------------------------------------------------ */

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

      /* -----------------------------------------------
         Save manual M-Pesa code as official code
      ------------------------------------------------ */

      fields.push(
        `mpesa_transaction_code = $${parameterIndex}`
      );

      values.push(
        String(transactionCode).trim()
      );

      parameterIndex++;

      /* -----------------------------------------------
         Save manual M-Pesa phone
      ------------------------------------------------ */

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
        paymentRejectionReason !== undefined
      ) {
        fields.push(
          `manual_payment_rejection_reason = $${parameterIndex}`
        );

        values.push(
          cleanValue(
            paymentRejectionReason
          )
        );

        parameterIndex++;
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
       PAYMENT RESET TO PENDING
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
       PAYMENT AWAITING APPROVAL
    ===================================================== */

    if (
      paymentStatus === 'Awaiting Approval'
    ) {
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
       NOTHING TO UPDATE
    ===================================================== */

    if (fields.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No editable fields were provided.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       UPDATED AT

       This is included explicitly so every edit updates
       the timestamp even if the database does not have a
       trigger.
    ===================================================== */

    fields.push(
      `updated_at = NOW()`
    );

    /* =====================================================
       APPLICATION ID
    ===================================================== */

    values.push(id);

    /* =====================================================
       EXECUTE UPDATE
    ===================================================== */

    const result = await pool.query(
      `
        UPDATE applications

        SET
          ${fields.join(', ')}

        WHERE id = $${parameterIndex}

        RETURNING *
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

    console.log(
      `Admin ${admin.email} updated application #${id}`
    );

    if (applicationStatus !== undefined) {
      console.log(
        `Application #${id} status changed to ${applicationStatus}`
      );
    }

    if (paymentStatus !== undefined) {
      console.log(
        `Application #${id} payment status changed to ${paymentStatus}`
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
       RETURN UPDATED APPLICATION
    ===================================================== */

    return NextResponse.json({
      success: true,

      message,

      application: {
        ...updatedApplication,

        manualMpesaCode:
          updatedApplication.manual_mpesa_code ||
          null,

        manualMpesaPhone:
          updatedApplication.manual_mpesa_phone ||
          null,

        manualPaymentSubmittedAt:
          updatedApplication
            .manual_payment_submitted_at ||
          null,

        manualPaymentVerifiedAt:
          updatedApplication
            .manual_payment_verified_at ||
          null,

        manualPaymentVerifiedBy:
          updatedApplication
            .manual_payment_verified_by ||
          null,

        manualPaymentRejectionReason:
          updatedApplication
            .manual_payment_rejection_reason ||
          null,

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
            updatedApplication.payment_status,

          submitted:
            Boolean(
              updatedApplication
                .manual_mpesa_code
            ),

          awaitingApproval:
            String(
              updatedApplication.payment_status ||
                ''
            )
              .toLowerCase()
              .replace(/[\s-]+/g, '_') ===
            'awaiting_approval',

          approved:
            ['paid', 'approved', 'verified'].includes(
              String(
                updatedApplication.payment_status ||
                  ''
              ).toLowerCase()
            ),

          rejected:
            String(
              updatedApplication.payment_status ||
                ''
            ).toLowerCase() === 'rejected',
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

/* =========================================================
   DELETE APPLICATION
========================================================= */

export async function DELETE(
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
       GET ID
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
       CHECK APPLICATION
    ===================================================== */

    const existingResult = await pool.query(
      `
        SELECT
          id,
          application_number,
          first_name,
          middle_name,
          surname,
          application_status,
          payment_status

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

    const application =
      existingResult.rows[0];

    /* =====================================================
       DELETE
    ===================================================== */

    await pool.query(
      `
        DELETE FROM applications

        WHERE id = $1
      `,
      [id]
    );

    /* =====================================================
       LOG
    ===================================================== */

    console.log(
      `Admin ${admin.email} deleted application #${id} (${application.application_number})`
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        'Application deleted successfully.',

      application: {
        id: application.id,

        application_number:
          application.application_number,

        applicant_name: [
          application.first_name,
          application.middle_name,
          application.surname,
        ]
          .filter(Boolean)
          .join(' '),
      },
    });
  } catch (error) {
    console.error(
      'DELETE ADMIN APPLICATION ERROR:',
      error
    );

    /* =====================================================
       FOREIGN KEY ERROR
    ===================================================== */

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === '23503'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This application cannot be deleted because it has related records in the system. Remove or handle the related records first.',
        },
        { status: 409 }
      );
    }

    /* =====================================================
       GENERAL ERROR
    ===================================================== */

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to delete application.',
      },
      { status: 500 }
    );
  }
}