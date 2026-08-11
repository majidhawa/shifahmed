
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import pool from '@/lib/db';
import { createAdminSession } from '@/lib/admin-auth';

/* =========================================================
   POST /api/admin/login
========================================================= */

export async function POST(request: Request) {
  try {
    /* =====================================================
       READ REQUEST
    ===================================================== */

    const body = await request.json();

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';

    const password =
      typeof body.password === 'string'
        ? body.password
        : '';

    const rememberMe =
      body.rememberMe === true;

    /* =====================================================
       VALIDATE INPUT
    ===================================================== */

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please enter your email address and password.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       FIND ADMIN
    ===================================================== */

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        password_hash,
        role,
        is_active
      FROM admin_users
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    /* =====================================================
       DO NOT REVEAL WHETHER EMAIL EXISTS
    ===================================================== */

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid email or password.',
        },
        { status: 401 }
      );
    }

    const admin = result.rows[0];

    /* =====================================================
       CHECK ACCOUNT STATUS
    ===================================================== */

    if (!admin.is_active) {
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
       VERIFY PASSWORD
    ===================================================== */

    const passwordMatches =
      await bcrypt.compare(
        password,
        admin.password_hash
      );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid email or password.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       UPDATE LAST LOGIN
    ===================================================== */

    await pool.query(
      `
      UPDATE admin_users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [admin.id]
    );

    /* =====================================================
       CREATE SECURE SESSION
    ===================================================== */

    createAdminSession({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      rememberMe,
    });

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json({
      success: true,
      message: 'Login successful.',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error(
      'Admin login error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to process login. Please try again.',
      },
      { status: 500 }
    );
  }
}

