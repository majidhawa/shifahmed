import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import pool from '@/lib/db';
import {
  getAdminSession,
  clearAdminSession,
} from '@/lib/admin-auth';

/* =========================================================
   POST /api/admin/change-password
========================================================= */

export async function POST(request: Request) {
  try {
    /* =====================================================
       GET CURRENT ADMIN SESSION
    ===================================================== */

    const admin = getAdminSession();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Your admin session has expired. Please log in again.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       READ REQUEST
    ===================================================== */

    const body = await request.json();

    const currentPassword =
      typeof body.currentPassword === 'string'
        ? body.currentPassword
        : '';

    const newPassword =
      typeof body.newPassword === 'string'
        ? body.newPassword
        : '';

    const confirmPassword =
      typeof body.confirmPassword === 'string'
        ? body.confirmPassword
        : '';

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please complete all password fields.',
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your new password must contain at least 8 characters.',
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The new password and confirmation password do not match.',
        },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your new password must be different from your current password.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GET ADMIN FROM DATABASE
    ===================================================== */

    const result = await pool.query(
      `
      SELECT
        id,
        password_hash,
        is_active
      FROM admin_users
      WHERE id = $1
      LIMIT 1
      `,
      [admin.id]
    );

    if (result.rows.length === 0) {
      clearAdminSession();

      return NextResponse.json(
        {
          success: false,
          message:
            'Administrator account could not be found.',
        },
        { status: 404 }
      );
    }

    const databaseAdmin = result.rows[0];

    /* =====================================================
       CHECK ACCOUNT STATUS
    ===================================================== */

    if (!databaseAdmin.is_active) {
      clearAdminSession();

      return NextResponse.json(
        {
          success: false,
          message:
            'This administrator account has been disabled.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       VERIFY CURRENT PASSWORD
    ===================================================== */

    const currentPasswordMatches =
      await bcrypt.compare(
        currentPassword,
        databaseAdmin.password_hash
      );

    if (!currentPasswordMatches) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your current password is incorrect.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       HASH NEW PASSWORD
    ===================================================== */

    const newPasswordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    /* =====================================================
       UPDATE PASSWORD
    ===================================================== */

    await pool.query(
      `
      UPDATE admin_users
      SET
        password_hash = $1
      WHERE id = $2
      `,
      [
        newPasswordHash,
        admin.id,
      ]
    );

    /* =====================================================
       SECURITY
       INVALIDATE CURRENT SESSION
    ===================================================== */

    clearAdminSession();

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json({
      success: true,
      message:
        'Password changed successfully. Please log in again.',
    });

  } catch (error) {
    console.error(
      'Admin password change error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to change password. Please try again.',
      },
      { status: 500 }
    );
  }
}