
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    applicationNumber: string;
  }>;
};

/* =========================================================
   SUBMIT MANUAL M-PESA PAYMENT FOR VERIFICATION

   POST:
   /api/applications/[applicationNumber]/payment-verification

   Expected body:
   {
     mpesaCode,
     mpesaPhone,

     OR

     manualMpesaCode,
     manualMpesaPhone
   }

   The route:
   1. Finds the application
   2. Validates the M-Pesa code
   3. Saves the code
   4. Saves the phone number
   5. Saves submission timestamp
   6. Changes payment_status to awaiting_approval
   7. Returns success:true
========================================================= */

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    /* =====================================================
       GET APPLICATION NUMBER
    ===================================================== */

    const { applicationNumber } = await context.params;

    console.log(
      'PAYMENT VERIFICATION REQUEST:',
      applicationNumber
    );

    if (
      !applicationNumber ||
      !applicationNumber.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application number is required.',
        },
        { status: 400 }
      );
    }

    const normalizedApplicationNumber =
      applicationNumber.trim();

    /* =====================================================
       READ REQUEST BODY
    ===================================================== */

    let body: any;

    try {
      body = await request.json();
    } catch (error) {
      console.error(
        'PAYMENT VERIFICATION INVALID JSON:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       ACCEPT BOTH NAMING STYLES

       The ApplyForm may send:

       mpesaCode
       mpesaPhone

       OR:

       manualMpesaCode
       manualMpesaPhone
    ===================================================== */

    const mpesaCode = String(
      body?.mpesaCode ??
        body?.manualMpesaCode ??
        body?.manual_mpesa_code ??
        ''
    ).trim();

    const mpesaPhone = String(
      body?.mpesaPhone ??
        body?.manualMpesaPhone ??
        body?.manual_mpesa_phone ??
        ''
    ).trim();

    console.log(
      'M-PESA CODE RECEIVED:',
      mpesaCode
    );

    console.log(
      'M-PESA PHONE RECEIVED:',
      mpesaPhone
    );

    /* =====================================================
       VALIDATE M-PESA CODE
    ===================================================== */

    if (!mpesaCode) {
      return NextResponse.json(
        {
          success: false,
          message:
            'M-Pesa transaction code is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE APPLICATION
    ===================================================== */

    const applicationResult = await pool.query(
      `
        SELECT
          id,
          application_number,
          application_fee,
          payment_status,
          manual_mpesa_code,
          manual_mpesa_phone

        FROM applications

        WHERE application_number = $1

        LIMIT 1
      `,
      [normalizedApplicationNumber]
    );

    if (applicationResult.rows.length === 0) {
      console.error(
        'APPLICATION NOT FOUND:',
        normalizedApplicationNumber
      );

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
       NORMALIZE CURRENT PAYMENT STATUS
    ===================================================== */

    const currentPaymentStatus = String(
      application.payment_status || ''
    )
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

    /* =====================================================
       PREVENT DUPLICATE SUBMISSION

       If already approved, don't allow another code.
    ===================================================== */

    const alreadyApproved =
      currentPaymentStatus === 'paid' ||
      currentPaymentStatus === 'approved' ||
      currentPaymentStatus === 'verified';

    if (alreadyApproved) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This application payment has already been approved.',
          payment: {
            applicationNumber:
              application.application_number,
            application_number:
              application.application_number,
            status: 'approved',
            paymentStatus: 'approved',
            approved: true,
            paid: true,
          },
        },
        { status: 409 }
      );
    }

    /* =====================================================
       PREVENT RESUBMISSION WHILE UNDER REVIEW

       Applicant must wait for admin approval/rejection.
    ===================================================== */

    const alreadyAwaitingApproval =
      currentPaymentStatus ===
        'awaiting_approval' ||
      currentPaymentStatus ===
        'awaiting_verification' ||
      currentPaymentStatus ===
        'verification_pending' ||
      currentPaymentStatus ===
        'submitted' ||
      currentPaymentStatus ===
        'pending_verification';

    if (alreadyAwaitingApproval) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your payment is already awaiting approval.',
          payment: {
            applicationNumber:
              application.application_number,

            application_number:
              application.application_number,

            status:
              'awaiting_approval',

            paymentStatus:
              'awaiting_approval',

            awaitingApproval:
              true,

            approved: false,

            paid: false,

            manualMpesaCode:
              application.manual_mpesa_code ||
              null,

            manual_mpesa_code:
              application.manual_mpesa_code ||
              null,

            manualMpesaPhone:
              application.manual_mpesa_phone ||
              null,

            manual_mpesa_phone:
              application.manual_mpesa_phone ||
              null,
          },
        },
        { status: 409 }
      );
    }

    /* =====================================================
       SAVE MANUAL PAYMENT

       IMPORTANT:
       These are the columns used by your payment-status
       endpoint.
    ===================================================== */

    const updateResult = await pool.query(
      `
        UPDATE applications

        SET
          manual_mpesa_code = $1,

          manual_mpesa_phone =
            CASE
              WHEN $2 <> ''
              THEN $2
              ELSE manual_mpesa_phone
            END,

          manual_payment_submitted_at =
            CURRENT_TIMESTAMP,

          payment_status =
            'awaiting_approval',

          manual_payment_rejection_reason =
            NULL

        WHERE application_number = $3

        RETURNING
          id,
          application_number,
          application_fee,
          payment_status,
          manual_mpesa_code,
          manual_mpesa_phone,
          manual_payment_submitted_at,
          manual_payment_verified_at,
          manual_payment_verified_by,
          manual_payment_rejection_reason
      `,
      [
        mpesaCode,
        mpesaPhone,
        normalizedApplicationNumber,
      ]
    );

    if (updateResult.rows.length === 0) {
      console.error(
        'PAYMENT UPDATE FAILED:',
        normalizedApplicationNumber
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Unable to save payment submission.',
        },
        { status: 500 }
      );
    }

    const updatedApplication =
      updateResult.rows[0];

    /* =====================================================
       OPTIONAL: SAVE TO MANUAL SUBMISSIONS TABLE

       Only execute this if your database already contains
       the manual_payment_submissions table.

       This block intentionally uses a separate try/catch
       so failure of that optional historical record does
       NOT prevent the main application payment from being
       saved successfully.
    ===================================================== */

    try {
      await pool.query(
        `
          INSERT INTO manual_payment_submissions (
            application_number,
            mpesa_code,
            phone_number,
            submitted_at,
            status
          )

          VALUES (
            $1,
            $2,
            NULLIF($3, ''),
            CURRENT_TIMESTAMP,
            'Pending Verification'
          )
        `,
        [
          normalizedApplicationNumber,
          mpesaCode,
          mpesaPhone,
        ]
      );

      console.log(
        'MANUAL PAYMENT SUBMISSION RECORD CREATED'
      );
    } catch (submissionError) {
      console.warn(
        'MANUAL PAYMENT SUBMISSIONS TABLE INSERT FAILED:',
        submissionError
      );

      /*
       * Do not fail the main payment submission.
       * The applications table is the source of truth.
       */
    }

    /* =====================================================
       SUCCESS RESPONSE

       This shape matches the ApplyForm expectation:
       result.success === true
       result.payment.status
    ===================================================== */

    console.log(
      'PAYMENT SUBMITTED SUCCESSFULLY:',
      normalizedApplicationNumber,
      mpesaCode
    );

    return NextResponse.json(
      {
        success: true,

        message:
          'M-Pesa payment submitted successfully and is awaiting approval.',

        applicationNumber:
          updatedApplication.application_number,

        application_number:
          updatedApplication.application_number,

        paymentStatus:
          'awaiting_approval',

        status:
          'awaiting_approval',

        manualMpesaCode:
          updatedApplication.manual_mpesa_code,

        manual_mpesa_code:
          updatedApplication.manual_mpesa_code,

        manualMpesaPhone:
          updatedApplication.manual_mpesa_phone ||
          null,

        manual_mpesa_phone:
          updatedApplication.manual_mpesa_phone ||
          null,

        payment: {
          applicationNumber:
            updatedApplication.application_number,

          application_number:
            updatedApplication.application_number,

          amount:
            Number(
              updatedApplication.application_fee ||
                0
            ),

          status:
            'awaiting_approval',

          paymentStatus:
            'awaiting_approval',

          awaitingApproval:
            true,

          approved:
            false,

          paid:
            false,

          rejected:
            false,

          paymentPending:
            false,

          hasMpesaCode:
            true,

          hasManualMpesaCode:
            true,

          manualMpesaCode:
            updatedApplication.manual_mpesa_code,

          manual_mpesa_code:
            updatedApplication.manual_mpesa_code,

          manualMpesaPhone:
            updatedApplication.manual_mpesa_phone ||
            null,

          manual_mpesa_phone:
            updatedApplication.manual_mpesa_phone ||
            null,

          manualPaymentSubmittedAt:
            updatedApplication
              .manual_payment_submitted_at ||
            null,

          manual_payment_submitted_at:
            updatedApplication
              .manual_payment_submitted_at ||
            null,

          manualPaymentVerifiedAt:
            updatedApplication
              .manual_payment_verified_at ||
            null,

          manual_payment_verified_at:
            updatedApplication
              .manual_payment_verified_at ||
            null,

          manualPaymentVerifiedBy:
            updatedApplication
              .manual_payment_verified_by ||
            null,

          manual_payment_verified_by:
            updatedApplication
              .manual_payment_verified_by ||
            null,

          manualPaymentRejectionReason:
            null,

          manual_payment_rejection_reason:
            null,

          rejectionReason:
            null,

          rejection_reason:
            null,

          receiptAvailable:
            false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'PAYMENT VERIFICATION SERVER ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to submit payment for verification.',
      },
      { status: 500 }
    );
  }
}

