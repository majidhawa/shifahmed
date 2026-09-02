import { NextResponse } from 'next/server';

import { logoutLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================================================
   POST /api/lecturer/logout

   Lecturer logout endpoint.

   IMPORTANT:
   - Destroys the lecturer session through logoutLecturer()
   - Prevents the response from being cached
   - Prevents browser/proxy caching after logout
========================================================= */

export async function POST() {
  try {
    /*
     * Destroy the lecturer authentication session/cookie.
     */
    await logoutLecturer();

    const response = NextResponse.json(
      {
        success: true,
        message: 'Lecturer logged out successfully.',
      },
      {
        status: 200,
      }
    );

    /*
     * Prevent the browser from caching the logout response.
     */
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    );

    response.headers.set(
      'Pragma',
      'no-cache'
    );

    response.headers.set(
      'Expires',
      '0'
    );

    /*
     * Additional protection against intermediary caches.
     */
    response.headers.set(
      'Surrogate-Control',
      'no-store'
    );

    return response;
  } catch (error) {
    console.error(
      'POST /api/lecturer/logout error:',
      error
    );

    const response = NextResponse.json(
      {
        success: false,
        message: 'Unable to log out.',
      },
      {
        status: 500,
      }
    );

    /*
     * Never cache an error response from logout either.
     */
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    );

    response.headers.set(
      'Pragma',
      'no-cache'
    );

    response.headers.set(
      'Expires',
      '0'
    );

    response.headers.set(
      'Surrogate-Control',
      'no-store'
    );

    return response;
  }
}