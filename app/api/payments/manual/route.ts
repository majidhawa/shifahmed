import { NextResponse } from 'next/server';

import pool from '@/lib/db';

const PAYMENT_AMOUNT = 1500;

export async function POST(request: Request) {
  const client = await pool.connect();

  try {
    const body = await request.json();

    const applicationNumber =
      typeof body.applicationNumber === 'string'
        ? body.applicationNumber.trim()
        : '';

    const mpesaCode =
      typeof body.mpesaCode === 'string'
        ? body.mpesaCode.trim().toUpperCase()
        : '';

    const phoneNumber =
      typeof body.phoneNumber === 'string'
        ? body.phoneNumber.trim()
        : '';

    if (!applicationNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application number is required.',
        },
        { status: 400 }
      );
    }

    if (!mpesaCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please enter the M-Pesa transaction code.',
        },
        { status: 400 }
      );
    }

    /*
    =========================================================
    BASIC M-PESA CODE VALIDATION
    =========================================================
    */

    if (!/^[A-Z0-9]{8,20}$/.test(mpesaCode)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please enter a valid M-Pesa transaction code.',
        },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    /*
    =========================================================
    FIND APPLICATION
    =========================================================
    */

    const applicationResult = await client.query(
      `
      SELECT
        id,
        application_number,
        application_fee,
        payment_status
      FROM applications
      WHERE application_number = $1
      LIMIT 1
      `,
      [applicationNumber]
    );

    if (applicationResult.rows.length === 0) {
      await client.query('ROLLBACK');

      return NextResponse.json(
        {
          success: false,
          message: 'Application not found.',
        },
        { status: 404 }
      );
    }

    const application = applicationResult.rows[0];

    /*
    =========================================================
    CHECK CURRENT PAYMENT STATUS
    =========================================================
    */

    if (
      String(application.payment_status || '')
        .trim()
        .toLowerCase() === 'paid'
    ) {
      await client.query('ROLLBACK');

      return NextResponse.json(
        {
          success: false,
          message: 'This application has already been paid.',
        },
        { status: 400 }
      );
    }

    /*
    =========================================================
    CHECK DUPLICATE MPESA CODE
    =========================================================
    */

    const duplicateResult = await client.query(
      `
      SELECT
        id,
        application_number,
        status
      FROM manual_payment_submissions
      WHERE mpesa_code = $1
      LIMIT 1
      `,
      [mpesaCode]
    );

    if (duplicateResult.rows.length > 0) {
      await client.query('ROLLBACK');

      return NextResponse.json(
        {
          success: false,
          message:
            'This M-Pesa transaction code has already been submitted.',
        },
        { status: 409 }
      );
    }

    /*
    =========================================================
    CREATE PAYMENT SUBMISSION
    =========================================================
    */

    const paymentResult = await client.query(
      `
      INSERT INTO manual_payment_submissions (
        application_id,
        application_number,
        mpesa_code,
        amount,
        phone_number,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        application_number,
        mpesa_code,
        amount,
        phone_number,
        status,
        created_at
      `,
      [
        application.id,
        application.application_number,
        mpesaCode,
        PAYMENT_AMOUNT,
        phoneNumber || null,
        'Pending Verification',
      ]
    );

    /*
    =========================================================
    UPDATE APPLICATION STATUS
    =========================================================
    */

    await client.query(
      `
      UPDATE applications
      SET payment_status = $1
      WHERE id = $2
      `,
      ['Pending Verification', application.id]
    );

    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        message:
          'M-Pesa payment submitted successfully. Your payment is awaiting verification.',
        payment: paymentResult.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');

    console.error(
      'Manual payment submission error:',
      error
    );

    /*
    =========================================================
    HANDLE UNIQUE MPESA CODE ERROR
    =========================================================
    */

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === '23505'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This M-Pesa transaction code has already been submitted.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to submit payment. Please try again.',
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}