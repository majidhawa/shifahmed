import { cookies } from 'next/headers';
import crypto from 'crypto';

import pool from '@/lib/db';

/* =========================================================
   LECTURER AUTHENTICATION
   Shifah Medical Training College LMS

   Responsibilities:
   - Create lecturer sessions
   - Verify lecturer sessions
   - Retrieve current lecturer
   - Protect lecturer pages
   - Completely destroy lecturer sessions
========================================================= */

/* =========================================================
   SESSION COOKIE
========================================================= */

const SESSION_COOKIE = 'smtc_lecturer_session';

/* =========================================================
   SESSION SECRET
========================================================= */

const SESSION_SECRET =
  process.env.LECTURER_SESSION_SECRET ||
  'smtc-lecturer-development-secret';

/* =========================================================
   SESSION SETTINGS
========================================================= */

const DEFAULT_SESSION_MAX_AGE =
  7 * 24 * 60 * 60;

const REMEMBER_ME_MAX_AGE =
  30 * 24 * 60 * 60;

/* =========================================================
   TYPES
========================================================= */

export type Lecturer = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'lecturer';
};

/* =========================================================
   CREATE SESSION TOKEN
========================================================= */

function createSessionToken(
  lecturerId: number
): string {
  const timestamp =
    Date.now().toString();

  const payload =
    `${lecturerId}.${timestamp}`;

  const signature =
    crypto
      .createHmac(
        'sha256',
        SESSION_SECRET
      )
      .update(payload)
      .digest('hex');

  return `${payload}.${signature}`;
}

/* =========================================================
   VERIFY SESSION TOKEN
========================================================= */

function verifySessionToken(
  token: string
): number | null {
  try {
    /* =====================================================
       SPLIT TOKEN
    ===================================================== */

    const parts =
      token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    const [
      lecturerIdString,
      timestamp,
      signature,
    ] = parts;

    /* =====================================================
       VALIDATE LECTURER ID
    ===================================================== */

    const lecturerId =
      Number(lecturerIdString);

    if (
      !Number.isInteger(lecturerId) ||
      lecturerId <= 0
    ) {
      return null;
    }

    /* =====================================================
       VALIDATE TIMESTAMP
    ===================================================== */

    const createdAt =
      Number(timestamp);

    if (
      !Number.isFinite(createdAt) ||
      createdAt <= 0
    ) {
      return null;
    }

    /* =====================================================
       CHECK SESSION AGE

       Maximum server-side session lifetime:
       7 days.

       NOTE:
       The rememberMe cookie may live for 30 days,
       but the token itself is currently limited to
       7 days by this verification logic.

       We keep this consistent with your existing
       authentication behaviour.
    ===================================================== */

    const maxAge =
      DEFAULT_SESSION_MAX_AGE * 1000;

    if (
      Date.now() - createdAt >
      maxAge
    ) {
      return null;
    }

    /* =====================================================
       RECREATE EXPECTED SIGNATURE
    ===================================================== */

    const payload =
      `${lecturerId}.${timestamp}`;

    const expectedSignature =
      crypto
        .createHmac(
          'sha256',
          SESSION_SECRET
        )
        .update(payload)
        .digest('hex');

    /* =====================================================
       CONVERT SIGNATURES TO BUFFERS
    ===================================================== */

    let providedBuffer: Buffer;
    let expectedBuffer: Buffer;

    try {
      providedBuffer =
        Buffer.from(
          signature,
          'hex'
        );

      expectedBuffer =
        Buffer.from(
          expectedSignature,
          'hex'
        );
    } catch {
      return null;
    }

    /* =====================================================
       CHECK SIGNATURE LENGTH
    ===================================================== */

    if (
      providedBuffer.length !==
      expectedBuffer.length
    ) {
      return null;
    }

    /* =====================================================
       TIMING-SAFE SIGNATURE COMPARISON
    ===================================================== */

    if (
      !crypto.timingSafeEqual(
        providedBuffer,
        expectedBuffer
      )
    ) {
      return null;
    }

    /* =====================================================
       SESSION IS VALID
    ===================================================== */

    return lecturerId;

  } catch (error) {
    console.error(
      'verifySessionToken error:',
      error
    );

    return null;
  }
}

/* =========================================================
   CREATE LECTURER SESSION
========================================================= */

export async function createLecturerSession(
  lecturerId: number,
  rememberMe = false
) {
  /* =====================================================
     CREATE TOKEN
  ===================================================== */

  const token =
    createSessionToken(
      lecturerId
    );

  /* =====================================================
     GET COOKIE STORE
  ===================================================== */

  const cookieStore =
    await cookies();

  /* =====================================================
     CREATE SESSION COOKIE
  ===================================================== */

  cookieStore.set(
    SESSION_COOKIE,
    token,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        'production',

      sameSite: 'lax',

      path: '/',

      maxAge: rememberMe
        ? REMEMBER_ME_MAX_AGE
        : DEFAULT_SESSION_MAX_AGE,
    }
  );
}

/* =========================================================
   GET CURRENT LECTURER
========================================================= */

export async function getLecturer(): Promise<Lecturer | null> {
  try {
    /* =====================================================
       GET COOKIE STORE
    ===================================================== */

    const cookieStore =
      await cookies();

    /* =====================================================
       GET SESSION COOKIE
    ===================================================== */

    const token =
      cookieStore.get(
        SESSION_COOKIE
      )?.value;

    /* =====================================================
       NO SESSION
    ===================================================== */

    if (!token) {
      return null;
    }

    /* =====================================================
       VERIFY SESSION TOKEN
    ===================================================== */

    const lecturerId =
      verifySessionToken(
        token
      );

    /* =====================================================
       INVALID SESSION
    ===================================================== */

    if (!lecturerId) {
      /*
       * Remove invalid/expired cookie.
       */
      cookieStore.delete(
        SESSION_COOKIE
      );

      return null;
    }

    /* =====================================================
       FIND LECTURER
       
       Lecturers are stored in `users`.

       Required:
       - matching ID
       - role = lecturer
       - active = TRUE
    ===================================================== */

    const result =
      await pool.query(
        `
        SELECT
          id,
          name,
          email,
          phone,
          role
        FROM users
        WHERE id = $1
          AND role = 'lecturer'
          AND active = TRUE
        LIMIT 1
        `,
        [lecturerId]
      );

    /* =====================================================
       LECTURER ACCOUNT NOT FOUND
    ===================================================== */

    if (
      result.rows.length === 0
    ) {
      /*
       * The account may have been:
       * - deleted
       * - deactivated
       * - changed from lecturer role
       *
       * Destroy the stale session.
       */

      cookieStore.delete(
        SESSION_COOKIE
      );

      return null;
    }

    /* =====================================================
       RETURN LECTURER
    ===================================================== */

    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      phone: result.rows[0].phone,
      role: 'lecturer',
    };

  } catch (error) {
    console.error(
      'getLecturer error:',
      error
    );

    return null;
  }
}

/* =========================================================
   REQUIRE LECTURER
========================================================= */

export async function requireLecturer(): Promise<Lecturer | null> {
  return await getLecturer();
}

/* =========================================================
   LOGOUT LECTURER
========================================================= */

export async function logoutLecturer() {
  try {
    /* =====================================================
       GET COOKIE STORE
    ===================================================== */

    const cookieStore =
      await cookies();

    /* =====================================================
       DELETE SESSION COOKIE
    ===================================================== */

    cookieStore.delete(
      SESSION_COOKIE
    );

    /*
     * Explicitly overwrite the cookie with:
     *
     * maxAge = 0
     * expires = 1970
     *
     * This provides an additional guarantee that the
     * browser removes the authentication cookie.
     */

    cookieStore.set(
      SESSION_COOKIE,
      '',
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          'production',

        sameSite: 'lax',

        path: '/',

        maxAge: 0,

        expires:
          new Date(0),
      }
    );

  } catch (error) {
    console.error(
      'logoutLecturer error:',
      error
    );

    throw error;
  }
}