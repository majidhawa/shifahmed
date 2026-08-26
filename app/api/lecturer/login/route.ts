import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import pool from '@/lib/db';

import {
  createLecturerSession,
} from '@/lib/lecturer-auth';

/* =========================================================
   POST /api/lecturer/login

   Shifah Medical Training College
   Lecturer LMS Authentication
========================================================= */

export async function POST(
  request: Request
) {
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
       VALIDATION
    ===================================================== */

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please enter your email address.',
        },
        {
          status: 400,
        }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please enter your password.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       FIND LECTURER

       IMPORTANT:
       Lecturers are stored in the `users` table.

       We identify a lecturer using:

       role = 'lecturer'
       active = TRUE
    ===================================================== */

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        password_hash,
        role,
        active
      FROM users
      WHERE LOWER(email) = $1
        AND role = 'lecturer'
      LIMIT 1
      `,
      [email]
    );

    /* =====================================================
       LECTURER NOT FOUND
    ===================================================== */

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid email or password.',
        },
        {
          status: 401,
        }
      );
    }

    const lecturer = result.rows[0];

    /* =====================================================
       CHECK ACCOUNT ROLE
    ===================================================== */

    if (
      lecturer.role !== 'lecturer'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This account does not have lecturer access.',
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       CHECK ACCOUNT STATUS
    ===================================================== */

    if (lecturer.active !== true) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your lecturer account is not active. Please contact the administrator.',
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       CHECK PASSWORD

       Passwords are stored in:
       users.password_hash

       Example:
       $2b$12$...
    ===================================================== */

    if (!lecturer.password_hash) {
      console.error(
        `Lecturer ${lecturer.id} does not have a password hash.`
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Your account has not been configured correctly. Please contact the administrator.',
        },
        {
          status: 500,
        }
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        lecturer.password_hash
      );

    /* =====================================================
       INVALID PASSWORD
    ===================================================== */

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid email or password.',
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       CREATE LECTURER SESSION

       The session stores only the lecturer ID.
       lecturer-auth.ts will use that ID to retrieve
       the current lecturer from the users table.
    ===================================================== */

    await createLecturerSession(
      lecturer.id,
      rememberMe
    );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          'Lecturer login successful.',

        lecturer: {
          id: lecturer.id,
          name: lecturer.name,
          email: lecturer.email,
          phone: lecturer.phone,
          role: lecturer.role,
        },
      },
      {
        status: 200,
      }
    );

  } catch (error) {
    /* =====================================================
       SERVER ERROR
    ===================================================== */

    console.error(
      'Lecturer login error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to process lecturer login. Please try again.',
      },
      {
        status: 500,
      }
    );
  }
}