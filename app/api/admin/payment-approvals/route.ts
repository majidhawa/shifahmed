import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
export const dynamic = 'force-dynamic';

/* =========================================================
   GET PAYMENT APPROVALS

   Returns applications whose MANUAL M-Pesa payment is
   awaiting administrator approval.

   Manual payment fields:
   - manual_mpesa_code
   - manual_mpesa_phone
   - manual_payment_submitted_at
========================================================= */

export async function GET(request: Request) {
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
       QUERY PARAMETERS
    ======================================================= */

    const { searchParams } = new URL(request.url);

    const search =
      searchParams.get('search')?.trim() || '';

    /* =======================================================
       BASE QUERY
    ======================================================= */

    const values: string[] = [];

    let query = `
      SELECT
        id,
        application_number,

        first_name,
        middle_name,
        surname,

        mobile,
        email,

        course,
        intake,

        application_fee,

        payment_status,

        /* ===============================================
           MANUAL M-PESA PAYMENT INFORMATION
        =============================================== */

        manual_mpesa_code,
        manual_mpesa_phone,
        manual_payment_submitted_at,

        /* ===============================================
           OLD / EXISTING M-PESA FIELDS
           Kept for compatibility with existing records
        =============================================== */

        manual_mpesa_phone,
        manual_mpesa_code,
        manual_payment_submitted_at,

        created_at

      FROM applications

      WHERE LOWER(
        COALESCE(payment_status, '')
      ) = 'awaiting_approval'
    `;

    /* =======================================================
       SEARCH
    ======================================================= */

    if (search) {
      values.push(`%${search.toLowerCase()}%`);

      query += `
        AND (
          /* Application number */

          LOWER(
            COALESCE(application_number, '')
          ) LIKE $${values.length}

          /* Applicant name */

          OR LOWER(
            CONCAT(
              COALESCE(first_name, ''),
              ' ',
              COALESCE(middle_name, ''),
              ' ',
              COALESCE(surname, '')
            )
          ) LIKE $${values.length}

          /* Normal mobile */

          OR LOWER(
            COALESCE(mobile, '')
          ) LIKE $${values.length}

          /* Email */

          OR LOWER(
            COALESCE(email, '')
          ) LIKE $${values.length}

          /* Manual M-Pesa phone */

          OR LOWER(
            COALESCE(manual_mpesa_phone, '')
          ) LIKE $${values.length}

          /* Manual M-Pesa transaction code */

          OR LOWER(
            COALESCE(manual_mpesa_code, '')
          ) LIKE $${values.length}

          /* Old M-Pesa phone */

          OR LOWER(
            COALESCE(manual_mpesa_phone, '')
          ) LIKE $${values.length}

          /* Manual M-Pesa transaction code */

          OR LOWER(
            COALESCE(manual_mpesa_code, '')
          ) LIKE $${values.length}
        )
      `;
    }

    /* =======================================================
       ORDER
    ======================================================= */

    query += `
      ORDER BY
        COALESCE(
          manual_payment_submitted_at,
          payment_submitted_at,
          created_at
        ) DESC
    `;

    /* =======================================================
       EXECUTE
    ======================================================= */

    const result = await pool.query(
      query,
      values
    );

    /* =======================================================
       NORMALIZE RESPONSE

       This gives the frontend a predictable structure even
       if some older applications still contain the old
       M-Pesa fields.
    ======================================================= */

    const payments = result.rows.map((row) => ({
      id: row.id,

      application_number:
        row.application_number,

      first_name:
        row.first_name,

      middle_name:
        row.middle_name,

      surname:
        row.surname,

      mobile:
        row.mobile,

      email:
        row.email,

      course:
        row.course,

      intake:
        row.intake,

      application_fee:
        Number(row.application_fee || 0),

      payment_status:
        row.payment_status,

      /* ===============================================
         MANUAL PAYMENT FIELDS
      =============================================== */

      manual_mpesa_code:
        row.manual_mpesa_code || null,

      manual_mpesa_phone:
        row.manual_mpesa_phone || null,

      manual_payment_submitted_at:
        row.manual_payment_submitted_at || null,

      /* ===============================================
         LEGACY FIELDS
      =============================================== */

      mpesa_phone:
        row.manual_mpesa_phone || null,

      mpesa_transaction_code:
        row.manual_mpesa_code || null,

      payment_submitted_at:
        row.manual_payment_submitted_at || null,

      created_at:
        row.created_at,
    }));

    /* =======================================================
       RESPONSE
    ======================================================= */

    return NextResponse.json({
      success: true,

      payments,

      count: payments.length,
    });
  } catch (error) {
    console.error(
      'GET PAYMENT APPROVALS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to load payment approvals.',
      },
      {
        status: 500,
      }
    );
  }
}