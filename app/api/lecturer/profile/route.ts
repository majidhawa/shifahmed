import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import pool from '@/lib/db';
import { getLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================================================
   RESPONSE HEADERS
========================================================= */

function noStoreHeaders() {
  return {
    'Cache-Control':
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
    'Surrogate-Control': 'no-store',
  };
}

/* =========================================================
   GET /api/lecturer/profile

   Retrieve currently authenticated lecturer.
========================================================= */

export async function GET() {
  try {
    const lecturer = await getLecturer();

    /* =====================================================
       AUTHORIZATION
    ===================================================== */

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your lecturer session has expired. Please log in again.',
        },
        {
          status: 401,
          headers: noStoreHeaders(),
        }
      );
    }

    /* =====================================================
       RETURN PROFILE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
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
        headers: noStoreHeaders(),
      }
    );
  } catch (error) {
    console.error(
      'GET /api/lecturer/profile error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to load your profile.',
      },
      {
        status: 500,
        headers: noStoreHeaders(),
      }
    );
  }
}

/* =========================================================
   PATCH /api/lecturer/profile

   Update:
   - name
   - email
   - phone
========================================================= */

export async function PATCH(
  request: Request
) {
  try {
    /* =====================================================
       AUTHORIZATION
    ===================================================== */

    const lecturer =
      await getLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your lecturer session has expired. Please log in again.',
        },
        {
          status: 401,
          headers: noStoreHeaders(),
        }
      );
    }

    /* =====================================================
       READ REQUEST
    ===================================================== */

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid request data.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    if (
      typeof body !== 'object' ||
      body === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid request data.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    const data =
      body as Record<string, unknown>;

    /* =====================================================
       NORMALIZE NAME
    ===================================================== */

    const name =
      typeof data.name === 'string'
        ? data.name.trim()
        : '';

    /* =====================================================
       NORMALIZE EMAIL
    ===================================================== */

    const email =
      typeof data.email === 'string'
        ? data.email.trim().toLowerCase()
        : '';

    /* =====================================================
       NORMALIZE PHONE
    ===================================================== */

    const phone =
      typeof data.phone === 'string'
        ? data.phone.trim()
        : '';

    /* =====================================================
       VALIDATE NAME
    ===================================================== */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please enter your full name.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your name must contain at least 2 characters.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    if (name.length > 150) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your name is too long.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    /* =====================================================
       VALIDATE EMAIL
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
          headers: noStoreHeaders(),
        }
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your email address is too long.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please enter a valid email address.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    /* =====================================================
       VALIDATE PHONE

       Phone is optional.
    ===================================================== */

    if (phone.length > 30) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your phone number is too long.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    /* =====================================================
       CHECK DUPLICATE EMAIL

       Exclude the current lecturer.
    ===================================================== */

    const duplicateEmail =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) = $1
          AND id <> $2
        LIMIT 1
        `,
        [email, lecturer.id]
      );

    if (
      duplicateEmail.rows.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'That email address is already being used by another account.',
        },
        {
          status: 409,
          headers: noStoreHeaders(),
        }
      );
    }

    /* =====================================================
       UPDATE PROFILE
    ===================================================== */

    const result =
      await pool.query(
        `
        UPDATE users
        SET
          name = $1,
          email = $2,
          phone = $3,
          updated_at = NOW()
        WHERE id = $4
          AND role = 'lecturer'
          AND active = TRUE
        RETURNING
          id,
          name,
          email,
          phone,
          role
        `,
        [
          name,
          email,
          phone || null,
          lecturer.id,
        ]
      );

    /* =====================================================
       UPDATE FAILED
    ===================================================== */

    if (
      result.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unable to update your profile. Your account may have been deactivated.',
        },
        {
          status: 404,
          headers: noStoreHeaders(),
        }
      );
    }

    const updated =
      result.rows[0];

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          'Your profile has been updated successfully.',
        lecturer: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          role: updated.role,
        },
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      }
    );
  } catch (error: unknown) {
    console.error(
      'PATCH /api/lecturer/profile error:',
      error
    );

    /*
     * PostgreSQL unique constraint protection.
     */
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code ===
        '23505'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'That email address is already being used by another account.',
        },
        {
          status: 409,
          headers: noStoreHeaders(),
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to update your profile. Please try again.',
      },
      {
        status: 500,
        headers: noStoreHeaders(),
      }
    );
  }
}

/* =========================================================
   POST /api/lecturer/profile

   Change lecturer password.

   Request:
   {
     currentPassword: string,
     newPassword: string,
     confirmPassword: string
   }
========================================================= */

export async function POST(
  request: Request
) {
  try {
    /* =====================================================
       AUTHORIZATION
    ===================================================== */

    const lecturer =
      await getLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your lecturer session has expired. Please log in again.',
        },
        {
          status: 401,
          headers: noStoreHeaders(),
        }
      );
    }

    /* =====================================================
       READ REQUEST
    ===================================================== */

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid request data.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    if (
      typeof body !== 'object' ||
      body === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid request data.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    const data =
      body as Record<string, unknown>;

    const currentPassword =
      typeof data.currentPassword ===
      'string'
        ? data.currentPassword
        : '';

    const newPassword =
      typeof data.newPassword ===
      'string'
        ? data.newPassword
        : '';

    const confirmPassword =
      typeof data.confirmPassword ===
      'string'
        ? data.confirmPassword
        : '';

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!currentPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please enter your current password.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please enter your new password.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your new password must be at least 8 characters long.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    if (newPassword.length > 128) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your new password is too long.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    if (!confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please confirm your new password.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The new passwords do not match.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your new password must be different from your current password.',
        },
        {
          status: 400,
          headers: noStoreHeaders(),
        }
      );
    }

    /* =====================================================
       GET PASSWORD HASH

       Only retrieve the password hash when actually
       changing the password.
    ===================================================== */

    const result =
      await pool.query(
        `
        SELECT
          id,
          password_hash
        FROM users
        WHERE id = $1
          AND role = 'lecturer'
          AND active = TRUE
        LIMIT 1
        `,
        [lecturer.id]
      );

    if (
      result.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your lecturer account could not be found.',
        },
        {
          status: 404,
          headers: noStoreHeaders(),
        }
      );
    }

    const passwordHash =
      result.rows[0]
        .password_hash;

    /* =====================================================
       CHECK EXISTING PASSWORD
    ===================================================== */

    if (!passwordHash) {
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
          headers: noStoreHeaders(),
        }
      );
    }

    const currentPasswordMatches =
      await bcrypt.compare(
        currentPassword,
        passwordHash
      );

    if (!currentPasswordMatches) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Your current password is incorrect.',
        },
        {
          status: 401,
          headers: noStoreHeaders(),
        }
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

    const updateResult =
      await pool.query(
        `
        UPDATE users
        SET
          password_hash = $1,
          updated_at = NOW()
        WHERE id = $2
          AND role = 'lecturer'
          AND active = TRUE
        RETURNING id
        `,
        [
          newPasswordHash,
          lecturer.id,
        ]
      );

    if (
      updateResult.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unable to change your password. Please try again.',
        },
        {
          status: 500,
          headers: noStoreHeaders(),
        }
      );
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          'Your password has been changed successfully.',
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      }
    );
  } catch (error) {
    console.error(
      'POST /api/lecturer/profile error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to change your password. Please try again.',
      },
      {
        status: 500,
        headers: noStoreHeaders(),
      }
    );
  }
}