import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const applicationNumber =
      searchParams.get('applicationNumber')?.trim() || '';

    if (!applicationNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application number is required.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          application_number,
          application_fee,
          payment_status,
          mpesa_receipt_number,
          mpesa_result_code,
          mpesa_result_description,
          mpesa_transaction_date,
          mpesa_phone_number
        FROM applications
        WHERE application_number = $1
        LIMIT 1
      `,
      [applicationNumber]
    );

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

    return NextResponse.json({
      success: true,

      payment: {
        applicationNumber:
          application.application_number,

        amount:
          Number(application.application_fee),

        status:
          application.payment_status,

        receiptNumber:
          application.mpesa_receipt_number || null,

        resultCode:
          application.mpesa_result_code ?? null,

        resultDescription:
          application.mpesa_result_description || null,

        transactionDate:
          application.mpesa_transaction_date || null,

        phoneNumber:
          application.mpesa_phone_number || null,
      },
    });

  } catch (error) {
    console.error(
      'M-PESA STATUS CHECK ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to check payment status.',
      },
      { status: 500 }
    );
  }
}