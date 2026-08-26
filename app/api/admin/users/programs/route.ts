import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

/* =========================================================
   GET PROGRAMS
   GET /api/admin/users/programs
========================================================= */

export async function GET() {
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
       LOAD PROGRAMS
    ===================================================== */

    const result =
      await pool.query(`
        SELECT
          id,
          name,
          code,
          description,
          duration,
          level,
          status

        FROM lms_programs

        WHERE LOWER(COALESCE(status, 'active'))
          NOT IN ('inactive', 'archived')

        ORDER BY
          name ASC
      `);

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,
      programs: result.rows,
    });
  } catch (error) {
    console.error(
      'GET ADMIN PROGRAMS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load courses.',
      },
      { status: 500 }
    );
  }
}