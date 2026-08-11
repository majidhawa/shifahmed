
import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/* =========================================================
   GET ADMISSION BY APPLICATION ID
========================================================= */

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
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
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       GET APPLICATION ID
    ===================================================== */

    const { id } = await context.params;

    const applicationId = Number(id);

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid application ID.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       GET ADMISSION
    ===================================================== */

    const result = await pool.query(
      `
        SELECT
          id,
          application_id,
          admission_number,
          application_number,
          student_name,
          course,
          intake,
          admission_date,
          admission_status,
          admission_letter_path,
          created_at,
          updated_at

        FROM admissions

        WHERE application_id = $1

        LIMIT 1
      `,
      [applicationId]
    );

    /* =====================================================
       NO ADMISSION
    ===================================================== */

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No admission exists for this application.',
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,
      admission: result.rows[0],
    });
  } catch (error) {
    console.error(
      'GET ADMISSION ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load admission.',
      },
      {
        status: 500,
      }
    );
  }
}

