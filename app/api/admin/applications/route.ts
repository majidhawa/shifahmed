
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/* =========================================================
   GET ADMIN APPLICATIONS
========================================================= */

export async function GET(request: Request) {
  try {
    /* =====================================================
       ADMIN AUTHENTICATION
    ===================================================== */

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

    /* =====================================================
       QUERY PARAMETERS
    ===================================================== */

    const { searchParams } = new URL(request.url);

    const search =
      searchParams.get('search')?.trim() || '';

    const course =
      searchParams.get('course')?.trim() || '';

    const status =
      searchParams.get('status')?.trim() || '';

    const paymentStatus =
      searchParams.get('paymentStatus')?.trim() || '';

    /* =====================================================
       WHERE CONDITIONS
    ===================================================== */

    const conditions: string[] = [];
    const values: string[] = [];

    let parameterIndex = 1;

    /* =====================================================
       SEARCH
    ===================================================== */

    if (search) {
      conditions.push(`
        (
          application_number ILIKE $${parameterIndex}
          OR surname ILIKE $${parameterIndex}
          OR middle_name ILIKE $${parameterIndex}
          OR first_name ILIKE $${parameterIndex}
          OR email ILIKE $${parameterIndex}
          OR mobile ILIKE $${parameterIndex}
          OR id_passport_number ILIKE $${parameterIndex}

          OR manual_mpesa_code ILIKE $${parameterIndex}
          OR manual_mpesa_phone ILIKE $${parameterIndex}

          OR mpesa_transaction_code ILIKE $${parameterIndex}
          OR mpesa_phone ILIKE $${parameterIndex}
        )
      `);

      values.push(`%${search}%`);
      parameterIndex++;
    }

    /* =====================================================
       COURSE FILTER
    ===================================================== */

    if (course) {
      conditions.push(`
        LOWER(COALESCE(course, '')) =
        LOWER($${parameterIndex})
      `);

      values.push(course);
      parameterIndex++;
    }

    /* =====================================================
       APPLICATION STATUS FILTER

       Case-insensitive so both:
       Pending / pending
       Approved / approved
       Rejected / rejected

       work correctly.
    ===================================================== */

    if (status) {
      conditions.push(`
        LOWER(COALESCE(application_status, '')) =
        LOWER($${parameterIndex})
      `);

      values.push(status);
      parameterIndex++;
    }

    /* =====================================================
       PAYMENT STATUS FILTER

       Supports:
       paid
       Paid
       awaiting_approval
       pending
       unpaid
    ===================================================== */

    if (paymentStatus) {
      conditions.push(`
        LOWER(COALESCE(payment_status, '')) =
        LOWER($${parameterIndex})
      `);

      values.push(paymentStatus);
      parameterIndex++;
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    /* =====================================================
       APPLICATIONS QUERY
    ===================================================== */

    const query = `
      SELECT
        id,
        application_number,

        surname,
        middle_name,
        first_name,

        date_of_birth,
        gender,
        nationality,
        country,
        id_passport_number,
        marital_status,

        postal_address,
        postal_code,
        town,
        county,
        mobile,
        email,

        kcse_index,
        kcse_year,
        kcse_mean_grade,
        english_grade,
        kiswahili_grade,
        biology_grade,
        chemistry_grade,
        physics_grade,
        mathematics_grade,
        previous_institution,
        highest_qualification,

        course,
        intake,

        sponsor_type,
        sponsor_name,
        sponsor_relationship,
        sponsor_mobile,
        sponsor_email,

        guardian_name,
        guardian_relationship,
        guardian_mobile,
        guardian_email,

        id_document,
        kcse_certificate,
        passport_photo,

        declaration,

        application_fee,

        /* =============================================
           PAYMENT STATUS
        ============================================= */

        LOWER(
          COALESCE(payment_status, 'pending')
        ) AS payment_status,

        /* =============================================
           APPLICATION STATUS
        ============================================= */

        LOWER(
          COALESCE(application_status, 'pending')
        ) AS application_status,

        /* =============================================
           MANUAL M-PESA PAYMENT
        ============================================= */

        manual_mpesa_code,
        manual_mpesa_phone,
        manual_payment_submitted_at,

        /* =============================================
           EXISTING / AUTOMATIC M-PESA FIELDS
        ============================================= */

        mpesa_transaction_code,
        mpesa_phone,
        payment_submitted_at,

        created_at

      FROM applications

      ${whereClause}

      ORDER BY created_at DESC
    `;

    /* =====================================================
       STATISTICS QUERY

       IMPORTANT:
       All status comparisons are now case-insensitive.
    ===================================================== */

    const statisticsQuery = `
      SELECT

        /* =============================================
           TOTAL
        ============================================= */

        COUNT(*)::int AS total,

        /* =============================================
           APPLICATION STATUS
        ============================================= */

        COUNT(*) FILTER (
          WHERE LOWER(
            COALESCE(application_status, '')
          ) = 'pending'
        )::int AS pending,

        COUNT(*) FILTER (
          WHERE LOWER(
            COALESCE(application_status, '')
          ) = 'approved'
        )::int AS approved,

        COUNT(*) FILTER (
          WHERE LOWER(
            COALESCE(application_status, '')
          ) = 'rejected'
        )::int AS rejected,

        /* =============================================
           PAYMENT STATUS
        ============================================= */

        COUNT(*) FILTER (
          WHERE LOWER(
            COALESCE(payment_status, '')
          ) = 'paid'
        )::int AS paid,

        COUNT(*) FILTER (
          WHERE LOWER(
            COALESCE(payment_status, '')
          ) IN (
            'pending',
            'unpaid'
          )
        )::int AS unpaid,

        COUNT(*) FILTER (
          WHERE LOWER(
            COALESCE(payment_status, '')
          ) = 'awaiting_approval'
        )::int AS awaiting_approval

      FROM applications
    `;

    /* =====================================================
       RUN QUERIES
    ===================================================== */

    const [
      applicationsResult,
      statisticsResult,
    ] = await Promise.all([
      pool.query(query, values),
      pool.query(statisticsQuery),
    ]);

    /* =====================================================
       NORMALIZE APPLICATION DATA
    ===================================================== */

    const applications =
      applicationsResult.rows.map((application) => ({
        ...application,

        application_fee:
          Number(application.application_fee || 0),

        payment_status:
          String(
            application.payment_status || 'pending'
          )
            .trim()
            .toLowerCase(),

        application_status:
          String(
            application.application_status || 'pending'
          )
            .trim()
            .toLowerCase(),

        manual_mpesa_code:
          application.manual_mpesa_code || null,

        manual_mpesa_phone:
          application.manual_mpesa_phone || null,

        manual_payment_submitted_at:
          application.manual_payment_submitted_at ||
          null,
      }));

    /* =====================================================
       STATISTICS
    ===================================================== */

    const statistics =
      statisticsResult.rows[0] || {};

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      applications,

      statistics: {
        total:
          Number(statistics.total) || 0,

        pending:
          Number(statistics.pending) || 0,

        approved:
          Number(statistics.approved) || 0,

        rejected:
          Number(statistics.rejected) || 0,

        paid:
          Number(statistics.paid) || 0,

        unpaid:
          Number(statistics.unpaid) || 0,

        awaiting_approval:
          Number(
            statistics.awaiting_approval
          ) || 0,
      },
    });
  } catch (error) {
    console.error(
      'ADMIN APPLICATIONS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load applications.',
      },
      {
        status: 500,
      }
    );
  }
}

