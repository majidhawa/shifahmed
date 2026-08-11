import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  initiateSTKPush,
  normalizeMpesaPhone,
} from '@/lib/mpesa';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
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
          message: 'Invalid JSON request body.',
        },
        { status: 400 }
      );
    }

    const applicationNumber =
      typeof body?.applicationNumber === 'string'
        ? body.applicationNumber.trim()
        : '';

    const phoneNumber =
      typeof body?.phoneNumber === 'string'
        ? body.phoneNumber.trim()
        : '';

    /* =====================================================
       VALIDATE APPLICATION NUMBER
    ===================================================== */

    if (!applicationNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application number is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE PHONE
    ===================================================== */

    if (!phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'M-Pesa phone number is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       NORMALIZE PHONE
    ===================================================== */

    let normalizedPhone: string;

    try {
      normalizedPhone =
        normalizeMpesaPhone(phoneNumber);
    } catch (error) {
      console.error(
        'PHONE NORMALIZATION ERROR:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Invalid M-Pesa phone number.',
        },
        { status: 400 }
      );
    }

    console.log(
      'Normalized M-Pesa phone:',
      normalizedPhone
    );

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
            payment_status,
            application_status
          FROM applications
          WHERE application_number = $1
          LIMIT 1
        `,
        [applicationNumber]
      );

    if (applicationResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application could not be found.',
        },
        { status: 404 }
      );
    }

    const application =
      applicationResult.rows[0];

    console.log(
      'Application found:',
      application.application_number
    );

    /* =====================================================
       PREVENT DUPLICATE PAYMENT
    ===================================================== */

    if (
      application.payment_status === 'Paid'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This application has already been paid for.',
        },
        { status: 409 }
      );
    }

    /* =====================================================
       APPLICATION FEE
    ===================================================== */

    const amount = Number(
      application.application_fee
    );
console.log('=================================');
console.log('M-PESA DEBUG');
console.log('Application Number:', application.application_number);
console.log('Application ID:', application.id);
console.log('Database Application Fee:', application.application_fee);
console.log('Amount Being Sent To M-Pesa:', amount);
console.log('=================================');
    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid application fee configured.',
        },
        { status: 500 }
      );
    }

    console.log(
      'STK amount:',
      amount
    );

    /* =====================================================
       INITIATE STK PUSH
    ===================================================== */

    console.log(
      'Initiating STK Push...'
    );

    const stkResponse =
      await initiateSTKPush({
        phoneNumber:
          normalizedPhone,

        amount,

        accountReference:
          application.application_number,

        transactionDescription:
          'SMTC Application Fee',
      });

    console.log(
      'Safaricom STK response:',
      stkResponse
    );

    /* =====================================================
       CHECK RESPONSE
    ===================================================== */

    if (
      !stkResponse ||
      !stkResponse.CheckoutRequestID
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            stkResponse?.CustomerMessage ||
            'M-Pesa STK Push could not be initiated.',
          mpesaResponse:
            stkResponse || null,
        },
        { status: 502 }
      );
    }

    /* =====================================================
       SAVE PAYMENT DETAILS
    ===================================================== */

    await pool.query(
      `
        UPDATE applications
        SET
          mpesa_checkout_request_id = $1,
          mpesa_merchant_request_id = $2,
          mpesa_phone_number = $3,
          payment_status = 'Pending'
        WHERE id = $4
      `,
      [
        stkResponse.CheckoutRequestID,
        stkResponse.MerchantRequestID || null,
        normalizedPhone,
        application.id,
      ]
    );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          stkResponse.CustomerMessage ||
          'M-Pesa payment request sent successfully.',

        payment: {
          application_number:
            application.application_number,

          amount,

          phone:
            normalizedPhone,

          merchant_request_id:
            stkResponse.MerchantRequestID ||
            null,

          checkout_request_id:
            stkResponse.CheckoutRequestID,

          customer_message:
            stkResponse.CustomerMessage ||
            null,
        },
      },
      { status: 200 }
    );

  } catch (error) {

    console.error(
      '================================='
    );

    console.error(
      'M-PESA STK PUSH ERROR:'
    );

    console.error(error);

    console.error(
      '================================='
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to initiate M-Pesa payment.',
      },
      { status: 500 }
    );
  }
}