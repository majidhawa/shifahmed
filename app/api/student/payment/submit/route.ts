
import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { getStudentSession } from '@/lib/student-auth';

export const runtime = 'nodejs';

/* =========================================================
   POST PAYMENT TRANSACTION
========================================================= */

export async function POST(
  request: Request
) {
  try {
    /* =======================================================
       AUTHENTICATE STUDENT
    ======================================================= */

    const session =
      await getStudentSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your session has expired. Please log in again.',
        },
        {
          status: 401,
        }
      );
    }

    /* =======================================================
       READ REQUEST
    ======================================================= */

    const body =
      await request.json();

    const {
      applicationId,
      applicationNumber,
      mpesaReceiptNumber,
      mpesaPhoneNumber,
    } = body;

    /* =======================================================
       VALIDATE APPLICATION
    ======================================================= */

    if (
      !applicationId ||
      !applicationNumber
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid application details.',
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================================
       VALIDATE TRANSACTION CODE
    ======================================================= */

    const receipt =
      String(
        mpesaReceiptNumber || ''
      )
        .trim()
        .toUpperCase();

    if (
      !receipt ||
      !/^[A-Z0-9]{8,20}$/.test(
        receipt
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please provide a valid M-Pesa transaction code.',
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================================
       VALIDATE PHONE
    ======================================================= */

    let phone =
      String(
        mpesaPhoneNumber || ''
      )
        .trim()
        .replace(/\s+/g, '');

    if (phone.startsWith('+254')) {
      phone =
        phone.substring(1);
    }

    if (phone.startsWith('0')) {
      phone =
        '254' +
        phone.substring(1);
    }

    if (
      !/^2547\d{8}$/.test(phone)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please provide a valid Kenyan M-Pesa phone number.',
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================================
       VERIFY APPLICATION BELONGS TO SESSION
    ======================================================= */

    const applicationResult =
      await pool.query(
        `
        SELECT
          id,
          application_number,
          application_fee,
          payment_status,
          mpesa_receipt_number

        FROM applications

        WHERE id = $1
          AND application_number = $2

        LIMIT 1
        `,
        [
          session.applicationId,
          session.applicationNumber,
        ]
      );

    if (
      applicationResult.rows
        .length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Application not found.',
        },
        {
          status: 404,
        }
      );
    }

    const application =
      applicationResult.rows[0];

    /* =======================================================
       CHECK IF ALREADY PAID
    ======================================================= */

    if (
      String(
        application.payment_status ||
          ''
      )
        .toLowerCase()
        .trim() === 'paid'
    ) {
      return NextResponse.json(
        {
          success: true,
          message:
            'This application has already been paid.',
          paymentStatus: 'Paid',
        }
      );
    }

    /* =======================================================
       CHECK DUPLICATE M-PESA CODE
    ======================================================= */

    const duplicateResult =
      await pool.query(
        `
        SELECT
          id,
          application_number,
          payment_status

        FROM applications

        WHERE mpesa_receipt_number = $1

        LIMIT 1
        `,
        [receipt]
      );

    if (
      duplicateResult.rows
        .length > 0
    ) {
      const duplicate =
        duplicateResult.rows[0];

      if (
        String(
          duplicate.application_number
        ) !==
        String(
          application.application_number
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'This M-Pesa transaction code has already been submitted for another application.',
          },
          {
            status: 409,
          }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message:
            'This payment transaction has already been submitted and is awaiting verification.',
          paymentStatus:
            duplicate.payment_status ||
            'Pending',
        }
      );
    }

    /* =======================================================
       SAVE PAYMENT
       
       IMPORTANT:
       We deliberately set the status to Pending.
       The admin must verify the transaction.
    ======================================================= */

    const updateResult =
      await pool.query(
        `
        UPDATE applications

        SET
          mpesa_receipt_number = $1,
          mpesa_phone_number = $2,
          payment_status = 'Pending'

        WHERE id = $3
          AND application_number = $4

        RETURNING
          id,
          application_number,
          application_fee,
          payment_status,
          mpesa_receipt_number,
          mpesa_phone_number
        `,
        [
          receipt,
          phone,
          application.id,
          application.application_number,
        ]
      );

    if (
      updateResult.rows
        .length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unable to save your payment details.',
        },
        {
          status: 500,
        }
      );
    }

    const updated =
      updateResult.rows[0];

    /* =======================================================
       SUCCESS
    ======================================================= */

    return NextResponse.json(
      {
        success: true,

        message:
          'Payment submitted successfully. It is now awaiting verification.',

        paymentStatus:
          updated.payment_status,

        mpesaReceiptNumber:
          updated.mpesa_receipt_number,

        mpesaPhoneNumber:
          updated.mpesa_phone_number,
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    console.error(
      'PAYMENT SUBMISSION ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to submit payment details. Please try again.',
      },
      {
        status: 500,
      }
    );
  }
}

