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

/* =========================================================
   PUT — EDIT ADMIN APPLICATION
========================================================= */

export async function PUT(request: Request) {
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
       READ REQUEST BODY
    ===================================================== */

    const body = await request.json();

    const id = Number(body.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid application ID is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       ALLOWED FIELDS
       
       application_number and id are intentionally NOT
       editable.
    ===================================================== */

    const allowedFields = [
      /* =============================================
         PERSONAL INFORMATION
      ============================================= */

      'surname',
      'middle_name',
      'first_name',
      'date_of_birth',
      'gender',
      'nationality',
      'country',
      'id_passport_number',
      'marital_status',

      /* =============================================
         CONTACT INFORMATION
      ============================================= */

      'postal_address',
      'postal_code',
      'town',
      'county',
      'mobile',
      'email',

      /* =============================================
         ACADEMIC INFORMATION
      ============================================= */

      'kcse_index',
      'kcse_year',
      'kcse_mean_grade',
      'english_grade',
      'kiswahili_grade',
      'biology_grade',
      'chemistry_grade',
      'physics_grade',
      'mathematics_grade',
      'previous_institution',
      'highest_qualification',

      /* =============================================
         COURSE
      ============================================= */

      'course',
      'intake',

      /* =============================================
         SPONSOR
      ============================================= */

      'sponsor_type',
      'sponsor_name',
      'sponsor_relationship',
      'sponsor_mobile',
      'sponsor_email',

      /* =============================================
         GUARDIAN
      ============================================= */

      'guardian_name',
      'guardian_relationship',
      'guardian_mobile',
      'guardian_email',

      /* =============================================
         DOCUMENTS
      ============================================= */

      'id_document',
      'kcse_certificate',
      'passport_photo',

      /* =============================================
         DECLARATION
      ============================================= */

      'declaration',

      /* =============================================
         APPLICATION FEE
      ============================================= */

      'application_fee',

      /* =============================================
         APPLICATION STATUS
      ============================================= */

      'application_status',

      /* =============================================
         MANUAL PAYMENT
      ============================================= */

      'payment_status',
      'manual_mpesa_code',
      'manual_mpesa_phone',
      'manual_payment_submitted_at',

      /* =============================================
         EXISTING M-PESA FIELDS
      ============================================= */

      'mpesa_transaction_code',
      'mpesa_phone',
      'payment_submitted_at',
    ];

    /* =====================================================
       BUILD UPDATE
    ===================================================== */

    const updates: string[] = [];
    const values: unknown[] = [];

    let parameterIndex = 1;

    for (const field of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          body,
          field
        )
      ) {
        updates.push(
          `${field} = $${parameterIndex}`
        );

        /*
         * Empty strings are converted to NULL.
         * This makes the database cleaner and prevents
         * empty values from being stored unnecessarily.
         */
        values.push(
          body[field] === ''
            ? null
            : body[field]
        );

        parameterIndex++;
      }
    }

    /* =====================================================
       NOTHING TO UPDATE
    ===================================================== */

    if (updates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No fields provided for update.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       NORMALIZE APPLICATION STATUS
    ===================================================== */

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        'application_status'
      )
    ) {
      const statusIndex =
        allowedFields.indexOf(
          'application_status'
        );

      if (statusIndex !== -1) {
        const updatePosition =
          updates.findIndex((update) =>
            update.startsWith(
              'application_status ='
            )
          );

        if (updatePosition !== -1) {
          values[updatePosition] =
            body.application_status
              ?.toString()
              .trim()
              .toLowerCase() || null;
        }
      }
    }

    /* =====================================================
       NORMALIZE PAYMENT STATUS
    ===================================================== */

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        'payment_status'
      )
    ) {
      const updatePosition =
        updates.findIndex((update) =>
          update.startsWith(
            'payment_status ='
          )
        );

      if (updatePosition !== -1) {
        values[updatePosition] =
          body.payment_status
            ?.toString()
            .trim()
            .toLowerCase() || null;
      }
    }

    /* =====================================================
       APPLICATION FEE
    ===================================================== */

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        'application_fee'
      )
    ) {
      const updatePosition =
        updates.findIndex((update) =>
          update.startsWith(
            'application_fee ='
          )
        );

      if (updatePosition !== -1) {
        const fee =
          body.application_fee === null ||
          body.application_fee === ''
            ? null
            : Number(body.application_fee);

        if (
          fee !== null &&
          Number.isNaN(fee)
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                'Application fee must be a valid number.',
            },
            {
              status: 400,
            }
          );
        }

        values[updatePosition] = fee;
      }
    }

    /* =====================================================
       UPDATE DATABASE
    ===================================================== */

    const query = `
      UPDATE applications

      SET
        ${updates.join(', ')}

      WHERE id = $${parameterIndex}

      RETURNING
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

        LOWER(
          COALESCE(
            payment_status,
            'pending'
          )
        ) AS payment_status,

        LOWER(
          COALESCE(
            application_status,
            'pending'
          )
        ) AS application_status,

        manual_mpesa_code,
        manual_mpesa_phone,
        manual_payment_submitted_at,

        mpesa_transaction_code,
        mpesa_phone,
        payment_submitted_at,

        created_at
    `;

    /* =====================================================
       APPLICATION ID
    ===================================================== */

    values.push(id);

    /* =====================================================
       EXECUTE UPDATE
    ===================================================== */

    const result = await pool.query(
      query,
      values
    );

    /* =====================================================
       APPLICATION NOT FOUND
    ===================================================== */

    if (result.rows.length === 0) {
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

    /* =====================================================
       NORMALIZE UPDATED APPLICATION
    ===================================================== */

    const application = {
      ...result.rows[0],

      application_fee:
        Number(
          result.rows[0]
            .application_fee || 0
        ),

      payment_status:
        String(
          result.rows[0]
            .payment_status ||
            'pending'
        )
          .trim()
          .toLowerCase(),

      application_status:
        String(
          result.rows[0]
            .application_status ||
            'pending'
        )
          .trim()
          .toLowerCase(),

      manual_mpesa_code:
        result.rows[0]
          .manual_mpesa_code ||
        null,

      manual_mpesa_phone:
        result.rows[0]
          .manual_mpesa_phone ||
        null,

      manual_payment_submitted_at:
        result.rows[0]
          .manual_payment_submitted_at ||
        null,
    };

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        'Application updated successfully.',

      application,
    });
  } catch (error) {
    console.error(
      'ADMIN EDIT APPLICATION ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update application.',
      },
      {
        status: 500,
      }
    );
  }
}