import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(
  request: Request
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

    const body =
      await request.json();

    const applicationId =
      Number(body.applicationId);

    const reason =
      String(
        body.reason || ''
      ).trim();

    if (
      !Number.isInteger(
        applicationId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid application ID.',
        },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Rejection reason is required.',
        },
        { status: 400 }
      );
    }

    const result =
      await pool.query(
        `
        SELECT
          id,
          application_number,
          payment_status
        FROM applications
        WHERE id = $1
        LIMIT 1
        `,
        [applicationId]
      );

    if (result.rows.length === 0) {
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

    if (
      String(
        application.payment_status || ''
      )
        .trim()
        .toLowerCase() === 'paid'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A verified payment cannot be rejected.',
        },
        { status: 400 }
      );
    }

    await pool.query(
      `
      UPDATE applications
      SET
        payment_status = 'rejected',
        manual_payment_rejection_reason = $1,
        manual_payment_verified_at = NULL,
        manual_payment_verified_by = NULL
      WHERE id = $2
      `,
      [
        reason,
        applicationId,
      ]
    );

    return NextResponse.json({
      success: true,
      message:
        'Payment rejected successfully.',
    });

  } catch (error) {

    console.error(
      'ADMIN PAYMENT REJECT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to reject payment.',
      },
      { status: 500 }
    );
  }
}