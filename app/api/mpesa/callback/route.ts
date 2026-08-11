import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   FORCE NODE.JS RUNTIME
========================================================= */

export const runtime = 'nodejs';

/* =========================================================
   TYPES
========================================================= */

type MpesaCallbackItem = {
  Name?: string;
  Value?: string | number;
};

type MpesaCallback = {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: MpesaCallbackItem[];
      };
    };
  };
};

/* =========================================================
   GET
========================================================= */

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'M-Pesa callback endpoint is working.',
  });
}

/* =========================================================
   POST - M-PESA CALLBACK
========================================================= */

export async function POST(request: Request) {
  try {
    /* =====================================================
       READ CALLBACK
    ===================================================== */

    const body =
      (await request.json()) as MpesaCallback;

    console.log(
      '========================================'
    );

    console.log(
      'M-PESA CALLBACK RECEIVED:'
    );

    console.log(
      JSON.stringify(body, null, 2)
    );

    console.log(
      '========================================'
    );

    /* =====================================================
       GET STK CALLBACK
    ===================================================== */

    const callback =
      body?.Body?.stkCallback;

    if (!callback) {
      console.error(
        'Invalid M-Pesa callback structure.'
      );

      return NextResponse.json(
        {
          ResultCode: 0,
          ResultDesc: 'Accepted',
        },
        { status: 200 }
      );
    }

    const merchantRequestId =
      callback.MerchantRequestID || null;

    const checkoutRequestId =
      callback.CheckoutRequestID || null;

    const resultCode =
      typeof callback.ResultCode === 'number'
        ? callback.ResultCode
        : null;

    const resultDesc =
      callback.ResultDesc || '';

    console.log(
      'M-Pesa Result:',
      {
        merchantRequestId,
        checkoutRequestId,
        resultCode,
        resultDesc,
      }
    );

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (!checkoutRequestId) {
      console.error(
        'M-Pesa callback missing CheckoutRequestID.'
      );

      return NextResponse.json(
        {
          ResultCode: 0,
          ResultDesc: 'Accepted',
        },
        { status: 200 }
      );
    }

    /* =====================================================
       FIND APPLICATION
    ===================================================== */

    const applicationResult =
      await pool.query(
        `
          SELECT
            id,
            application_number,
            application_fee,
            payment_status
          FROM applications
          WHERE mpesa_checkout_request_id = $1
          LIMIT 1
        `,
        [checkoutRequestId]
      );

    if (
      applicationResult.rows.length === 0
    ) {
      console.error(
        'Application not found for CheckoutRequestID:',
        checkoutRequestId
      );

      return NextResponse.json(
        {
          ResultCode: 0,
          ResultDesc: 'Accepted',
        },
        { status: 200 }
      );
    }

    const application =
      applicationResult.rows[0];

    console.log(
      'Application matched:',
      application.application_number
    );

    /* =====================================================
       IMPORTANT:
       RESULT CODE 0 = SUCCESS
       RESULT CODE 1032 = USER CANCELLED
       RESULT CODE 1037 = TRANSACTION TIMEOUT
       OTHER NON-ZERO = FAILED
    ===================================================== */

    /* =====================================================
       CUSTOMER CANCELLED STK PUSH
    ===================================================== */

    if (resultCode === 1032) {
      await pool.query(
        `
          UPDATE applications
          SET
            payment_status = 'Cancelled',
            mpesa_result_code = $1,
            mpesa_result_description = $2
          WHERE id = $3
        `,
        [
          resultCode,
          resultDesc || 'M-Pesa payment was cancelled by the customer.',
          application.id,
        ]
      );

      console.log(
        `M-PESA PAYMENT CANCELLED: ${application.application_number}`
      );

      console.log(
        'Reason:',
        resultDesc
      );

      return NextResponse.json(
        {
          ResultCode: 0,
          ResultDesc: 'Accepted',
        },
        { status: 200 }
      );
    }

    /* =====================================================
       STK PUSH TIMEOUT
    ===================================================== */

    if (resultCode === 1037) {
      await pool.query(
        `
          UPDATE applications
          SET
            payment_status = 'Timeout',
            mpesa_result_code = $1,
            mpesa_result_description = $2
          WHERE id = $3
        `,
        [
          resultCode,
          resultDesc || 'M-Pesa payment request timed out.',
          application.id,
        ]
      );

      console.log(
        `M-PESA PAYMENT TIMEOUT: ${application.application_number}`
      );

      return NextResponse.json(
        {
          ResultCode: 0,
          ResultDesc: 'Accepted',
        },
        { status: 200 }
      );
    }

    /* =====================================================
       OTHER PAYMENT FAILURES
    ===================================================== */

    if (resultCode !== 0) {
      await pool.query(
        `
          UPDATE applications
          SET
            payment_status = 'Failed',
            mpesa_result_code = $1,
            mpesa_result_description = $2
          WHERE id = $3
        `,
        [
          resultCode,
          resultDesc,
          application.id,
        ]
      );

      console.log(
        `M-PESA PAYMENT FAILED: ${application.application_number}`
      );

      console.log(
        'Result code:',
        resultCode
      );

      console.log(
        'Reason:',
        resultDesc
      );

      return NextResponse.json(
        {
          ResultCode: 0,
          ResultDesc: 'Accepted',
        },
        { status: 200 }
      );
    }

    /* =====================================================
       CALLBACK METADATA
    ===================================================== */

    const metadata =
      callback.CallbackMetadata?.Item || [];

    const getMetadataValue = (
      name: string
    ) => {
      const item = metadata.find(
        (entry) => entry.Name === name
      );

      return item?.Value ?? null;
    };

    const mpesaReceiptNumber =
      getMetadataValue('MpesaReceiptNumber');

    const transactionDate =
      getMetadataValue('TransactionDate');

    const phoneNumber =
      getMetadataValue('PhoneNumber');

    const amount =
      getMetadataValue('Amount');

    /* =====================================================
       PREVENT DUPLICATE SUCCESS PROCESSING
    ===================================================== */

    if (
      application.payment_status === 'Paid'
    ) {
      console.log(
        `Application ${application.application_number} is already marked as paid.`
      );

      return NextResponse.json(
        {
          ResultCode: 0,
          ResultDesc: 'Accepted',
        },
        { status: 200 }
      );
    }

    /* =====================================================
       VALIDATE PAYMENT AMOUNT
    ===================================================== */

    const expectedAmount =
      Number(application.application_fee);

    const receivedAmount =
      Number(amount);

    if (
      !Number.isFinite(receivedAmount) ||
      receivedAmount !== expectedAmount
    ) {
      console.error(
        'M-Pesa amount mismatch:',
        {
          application:
            application.application_number,

          expectedAmount,

          receivedAmount,
        }
      );

      await pool.query(
        `
          UPDATE applications
          SET
            payment_status = 'Failed',
            mpesa_result_code = $1,
            mpesa_result_description = $2
          WHERE id = $3
        `,
        [
          -1,
          'M-Pesa payment amount does not match the application fee.',
          application.id,
        ]
      );

      return NextResponse.json(
        {
          ResultCode: 0,
          ResultDesc: 'Accepted',
        },
        { status: 200 }
      );
    }

    /* =====================================================
       PAYMENT SUCCESS
    ===================================================== */

    await pool.query(
      `
        UPDATE applications
        SET
          payment_status = 'Paid',
          mpesa_receipt_number = $1,
          mpesa_transaction_date = $2,
          mpesa_phone_number = $3,
          mpesa_result_code = $4,
          mpesa_result_description = $5
        WHERE id = $6
      `,
      [
        mpesaReceiptNumber
          ? String(mpesaReceiptNumber)
          : null,

        transactionDate
          ? String(transactionDate)
          : null,

        phoneNumber
          ? String(phoneNumber)
          : null,

        resultCode,

        resultDesc,

        application.id,
      ]
    );

    /* =====================================================
       LOG SUCCESS
    ===================================================== */

    console.log(
      '========================================'
    );

    console.log(
      'M-PESA PAYMENT SUCCESS:'
    );

    console.log({
      applicationNumber:
        application.application_number,

      receipt:
        mpesaReceiptNumber,

      amount:
        receivedAmount,

      phone:
        phoneNumber,

      transactionDate:
        transactionDate,
    });

    console.log(
      '========================================'
    );

    /* =====================================================
       ACKNOWLEDGE SAFARICOM
    ===================================================== */

    return NextResponse.json(
      {
        ResultCode: 0,
        ResultDesc: 'Accepted',
      },
      { status: 200 }
    );

  } catch (error) {

    console.error(
      '========================================'
    );

    console.error(
      'M-PESA CALLBACK ERROR:',
      error
    );

    console.error(
      '========================================'
    );

    /*
     * Always acknowledge the callback.
     */

    return NextResponse.json(
      {
        ResultCode: 0,
        ResultDesc: 'Accepted',
      },
      { status: 200 }
    );
  }
}