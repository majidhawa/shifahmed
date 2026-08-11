
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

/* =========================================================
   PAYMENT STATUS ROUTE

   URL:
   /api/applications/[applicationNumber]/payment-status

   IMPORTANT:
   In the current Next.js route-handler format,
   params is a Promise and MUST be awaited.
========================================================= */

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
       GET APPLICATION NUMBER FROM URL
    ===================================================== */

    const { applicationNumber } =
      await context.params;

    console.log(
      'PAYMENT STATUS REQUEST FOR APPLICATION:',
      applicationNumber
    );

    /* =====================================================
       VALIDATE APPLICATION NUMBER
    ===================================================== */

    if (
      !applicationNumber ||
      !applicationNumber.trim()
    ) {
      console.error(
        'PAYMENT STATUS ERROR: applicationNumber is missing.'
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Application number is required.',
        },
        { status: 400 }
      );
    }

    const normalizedApplicationNumber =
      applicationNumber.trim();

    console.log(
      'Checking payment status for:',
      normalizedApplicationNumber
    );

    /* =====================================================
       DATABASE QUERY
    ===================================================== */

    const result = await pool.query(
      `
        SELECT
          id,
          application_number,
          application_fee,

          payment_status,

          manual_mpesa_code,
          manual_mpesa_phone,
          manual_payment_submitted_at,
          manual_payment_verified_at,
          manual_payment_verified_by,
          manual_payment_rejection_reason,

          mpesa_receipt_number,
          mpesa_transaction_code,
          mpesa_transaction_date,
          mpesa_phone_number,
          mpesa_result_code,
          mpesa_result_description,
          mpesa_amount,
          paid_at,

          payment_receipt_number,
          payment_verified_at

        FROM applications

        WHERE application_number = $1

        LIMIT 1
      `,
      [normalizedApplicationNumber]
    );

    /* =====================================================
       APPLICATION NOT FOUND
    ===================================================== */

    if (result.rows.length === 0) {
      console.error(
        'PAYMENT STATUS: Application not found:',
        normalizedApplicationNumber
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Application not found.',
        },
        { status: 404 }
      );
    }

    const application =
      result.rows[0];

    /* =====================================================
       NORMALIZE PAYMENT STATUS
    ===================================================== */

    const paymentStatus = String(
      application.payment_status ||
        'payment_pending'
    )
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

    /* =====================================================
       PAYMENT STATES
    ===================================================== */

    const isApproved =
      paymentStatus === 'paid' ||
      paymentStatus === 'approved' ||
      paymentStatus === 'verified';

    const isAwaitingApproval =
      paymentStatus ===
        'awaiting_approval' ||
      paymentStatus ===
        'awaiting_verification' ||
      paymentStatus ===
        'verification_pending' ||
      paymentStatus === 'submitted';

    const isPaymentPending =
      paymentStatus ===
        'payment_pending' ||
      paymentStatus ===
        'pending_payment' ||
      paymentStatus === 'pending' ||
      paymentStatus === 'unpaid';

    const isRejected =
      paymentStatus === 'rejected' ||
      paymentStatus === 'declined';

    /* =====================================================
       MANUAL M-PESA CODE
    ===================================================== */

    const manualMpesaCode =
      application.manual_mpesa_code
        ? String(
            application.manual_mpesa_code
          ).trim()
        : '';

    const manualMpesaPhone =
      application.manual_mpesa_phone
        ? String(
            application.manual_mpesa_phone
          ).trim()
        : '';

    const hasManualMpesaCode =
      manualMpesaCode.length > 0;

    /* =====================================================
       AUTOMATIC / EXISTING M-PESA CODE
    ===================================================== */

    const automaticMpesaReceipt =
      application.mpesa_receipt_number
        ? String(
            application.mpesa_receipt_number
          ).trim()
        : '';

    const automaticTransactionCode =
      application.mpesa_transaction_code
        ? String(
            application.mpesa_transaction_code
          ).trim()
        : '';

    const hasMpesaCode =
      hasManualMpesaCode ||
      automaticMpesaReceipt.length > 0 ||
      automaticTransactionCode.length > 0;

    /* =====================================================
       REJECTION REASON
    ===================================================== */

    const rejectionReason =
      application
        .manual_payment_rejection_reason
        ? String(
            application
              .manual_payment_rejection_reason
          ).trim()
        : '';

    /* =====================================================
       PHONE NUMBER

       Manual payment phone takes priority because
       your current workflow is manual.
    ===================================================== */

    const phoneNumber =
      manualMpesaPhone ||
      application.mpesa_phone_number ||
      null;

    /* =====================================================
       AMOUNT
    ===================================================== */

    const applicationFee =
      Number(
        application.application_fee || 0
      );

    const mpesaAmount =
      application.mpesa_amount !==
        null &&
      application.mpesa_amount !==
        undefined
        ? Number(
            application.mpesa_amount
          )
        : null;

    /* =====================================================
       RESPONSE

       The response intentionally contains BOTH:

       camelCase fields
       AND

       snake_case fields

       This keeps the frontend compatible with the
       existing ApplyForm.
    ===================================================== */

    return NextResponse.json({
      success: true,

      paymentStatus:
        paymentStatus,

      rejectionReason:
        rejectionReason || null,

      manualMpesaCode:
        manualMpesaCode || null,

      manual_mpesa_code:
        manualMpesaCode || null,

      manualMpesaPhone:
        manualMpesaPhone || null,

      manual_mpesa_phone:
        manualMpesaPhone || null,

      payment: {
        applicationNumber:
          application.application_number,

        application_number:
          application.application_number,

        amount:
          applicationFee,

        /* =============================================
           PAYMENT STATUS
        ============================================= */

        status:
          paymentStatus,

        paymentStatus:
          paymentStatus,

        /* =============================================
           PAYMENT FLAGS
        ============================================= */

        paid:
          isApproved,

        approved:
          isApproved,

        receiptAvailable:
          isApproved,

        awaitingApproval:
          isAwaitingApproval,

        rejected:
          isRejected,

        paymentPending:
          isPaymentPending,

        /* =============================================
           MANUAL M-PESA
        ============================================= */

        hasMpesaCode:
          hasMpesaCode,

        hasManualMpesaCode:
          hasManualMpesaCode,

        manualMpesaCode:
          manualMpesaCode || null,

        manual_mpesa_code:
          manualMpesaCode || null,

        manualMpesaPhone:
          manualMpesaPhone || null,

        manual_mpesa_phone:
          manualMpesaPhone || null,

        manualPaymentSubmittedAt:
          application
            .manual_payment_submitted_at ||
          null,

        manual_payment_submitted_at:
          application
            .manual_payment_submitted_at ||
          null,

        manualPaymentVerifiedAt:
          application
            .manual_payment_verified_at ||
          null,

        manual_payment_verified_at:
          application
            .manual_payment_verified_at ||
          null,

        manualPaymentVerifiedBy:
          application
            .manual_payment_verified_by ||
          null,

        manual_payment_verified_by:
          application
            .manual_payment_verified_by ||
          null,

        manualPaymentRejectionReason:
          rejectionReason || null,

        manual_payment_rejection_reason:
          rejectionReason || null,

        rejectionReason:
          rejectionReason || null,

        rejection_reason:
          rejectionReason || null,

        /* =============================================
           M-PESA PHONE
        ============================================= */

        phoneNumber:
          phoneNumber,

        phone:
          phoneNumber,

        /* =============================================
           EXISTING / AUTOMATIC M-PESA
        ============================================= */

        mpesaReceipt:
          automaticMpesaReceipt ||
          null,

        receipt:
          automaticMpesaReceipt ||
          null,

        mpesaReceiptNumber:
          automaticMpesaReceipt ||
          null,

        mpesaTransactionCode:
          automaticTransactionCode ||
          null,

        transactionCode:
          automaticTransactionCode ||
          null,

        transactionDate:
          application
            .mpesa_transaction_date ||
          null,

        transaction_date:
          application
            .mpesa_transaction_date ||
          null,

        resultCode:
          application
            .mpesa_result_code ||
          null,

        resultDescription:
          application
            .mpesa_result_description ||
          null,

        mpesaAmount:
          mpesaAmount,

        paidAt:
          application.paid_at ||
          null,

        /* =============================================
           RECEIPT
        ============================================= */

        paymentReceiptNumber:
          application
            .payment_receipt_number ||
          null,

        paymentVerifiedAt:
          application
            .payment_verified_at ||
          null,
      },
    });
  } catch (error) {
    console.error(
      'PAYMENT STATUS DATABASE ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to check payment status.',
      },
      { status: 500 }
    );
  }
}

