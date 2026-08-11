
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/* =========================================================
   PATCH PAYMENT APPROVAL
   action = approve
   action = reject
========================================================= */

export async function PATCH(
  request: Request,
  context: {
    params: {
      id: string;
    };
  }
) {
  const client =
    await pool.connect();

  try {
    /* =======================================================
       ADMIN AUTHENTICATION
    ======================================================= */

    const admin = requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        {
          status: 401,
        }
      );
    }

    /* =======================================================
       APPLICATION ID
    ======================================================= */

    const applicationId =
      Number(context.params.id);

    if (
      !Number.isInteger(
        applicationId
      ) ||
      applicationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid application ID.',
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================================
       REQUEST BODY
    ======================================================= */

    const body =
      await request.json();

    const action =
      String(
        body?.action || ''
      )
        .trim()
        .toLowerCase();

    if (
      action !== 'approve' &&
      action !== 'reject'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid payment action.',
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================================
       START TRANSACTION
    ======================================================= */

    await client.query(
      'BEGIN'
    );

    /* =======================================================
       GET PAYMENT
    ======================================================= */

    const paymentResult =
      await client.query(
        `
          SELECT
            id,
            application_number,
            first_name,
            middle_name,
            surname,
            application_fee,
            payment_status,
            manual_mpesa_phone,
            manual_mpesa_code

          FROM applications

          WHERE id = $1

          FOR UPDATE
        `,
        [applicationId]
      );

    if (
      paymentResult.rows.length === 0
    ) {
      await client.query(
        'ROLLBACK'
      );

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

    const payment =
      paymentResult.rows[0];

    /* =======================================================
       MAKE SURE TRANSACTION CODE EXISTS
    ======================================================= */

    if (
      !payment.manual_mpesa_code
    ) {
      await client.query(
        'ROLLBACK'
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'This application does not have an M-Pesa transaction code.',
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================================
       ONLY PROCESS AWAITING APPROVAL
    ======================================================= */

    if (
      String(
        payment.payment_status || ''
      ).toLowerCase() !==
      'awaiting_approval'
    ) {
      await client.query(
        'ROLLBACK'
      );

      return NextResponse.json(
        {
          success: false,
          message:
            `This payment is already ${payment.payment_status || 'processed'}.`,
        },
        {
          status: 409,
        }
      );
    }

    /* =======================================================
       APPROVE PAYMENT
    ======================================================= */

    if (action === 'approve') {
      const updateResult =
        await client.query(
          `
            UPDATE applications

            SET
              payment_status = 'paid'

            WHERE id = $1

            RETURNING
              id,
              application_number,
              payment_status,
              manual_mpesa_phone,
              manual_mpesa_code,
              application_fee
          `,
          [applicationId]
        );

      await client.query(
        'COMMIT'
      );

      return NextResponse.json({
        success: true,
        message:
          'Payment approved successfully.',
        payment:
          updateResult.rows[0],
      });
    }

    /* =======================================================
       REJECT PAYMENT
    ======================================================= */

    const updateResult =
      await client.query(
        `
          UPDATE applications

          SET
            payment_status = 'rejected'

          WHERE id = $1

          RETURNING
            id,
            application_number,
            payment_status,
            manual_mpesa_phone,
            manual_mpesa_code,
            application_fee
        `,
        [applicationId]
      );

    await client.query(
      'COMMIT'
    );

    return NextResponse.json({
      success: true,
      message:
        'Payment rejected successfully.',
      payment:
        updateResult.rows[0],
    });
  } catch (error) {
    await client.query(
      'ROLLBACK'
    );

    console.error(
      'PAYMENT APPROVAL ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to process payment approval.',
      },
      {
        status: 500,
      }
    );
  } finally {
    client.release();
  }
}

