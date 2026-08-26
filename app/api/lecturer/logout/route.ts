import { NextResponse } from 'next/server';

import { logoutLecturer } from '@/lib/lecturer-auth';

/* =========================================================
   POST /api/lecturer/logout
   Shifah Medical Training College LMS
========================================================= */

export async function POST() {
  try {
    /*
     * Completely destroy the lecturer session cookie.
     */
    await logoutLecturer();

    /*
     * Explicitly expire the cookie as an additional safeguard.
     *
     * This ensures the browser removes the authentication
     * cookie immediately.
     */
    const response = NextResponse.json(
      {
        success: true,
        message: 'Lecturer logged out successfully.',
      },
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );

    response.cookies.set(
      'smtc_lecturer_session',
      '',
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(0),
        maxAge: 0,
      }
    );

    return response;

  } catch (error) {
    console.error(
      'Lecturer logout error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to log out.',
      },
      {
        status: 500,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}

/* =========================================================
   GET /api/lecturer/logout

   Prevent accidental GET requests from performing logout.
========================================================= */

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message:
        'Logout must be performed using POST.',
    },
    {
      status: 405,
      headers: {
        Allow: 'POST',
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}