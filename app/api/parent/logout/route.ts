import { NextResponse } from 'next/server';

import {
  clearParentSession,
} from '@/lib/parent-auth';

export const runtime = 'nodejs';

/* =========================================================
   POST /api/parent/logout

   Parent Logout

   IMPORTANT:
   We do NOT use NEXT_PUBLIC_SITE_URL or localhost.

   The redirect URL is built from the actual request URL.
   Therefore:

   Local:
   http://localhost:3000/parent/login

   Vercel:
   https://your-vercel-domain.vercel.app/parent/login

   Custom domain:
   https://www.shifahmedicalcollege.co.ke/parent/login
========================================================= */

export async function POST(
  request: Request
) {
  try {
    /* =====================================================
       CLEAR PARENT SESSION
    ===================================================== */

    await clearParentSession();

    /* =====================================================
       BUILD REDIRECT URL

       request.url automatically contains the domain
       that the user is currently accessing.

       We only replace the pathname with:
       /parent/login

       No localhost is hardcoded.
    ===================================================== */

    const loginUrl = new URL(
      '/parent/login',
      request.url
    );

    /* =====================================================
       REDIRECT TO PARENT LOGIN
    ===================================================== */

    return NextResponse.redirect(
      loginUrl,
      303
    );
  } catch (error) {
    /* =====================================================
       LOG ERROR
    ===================================================== */

    console.error(
      'PARENT LOGOUT ERROR:',
      error
    );

    /* =====================================================
       EVEN IF SOMETHING GOES WRONG,
       REDIRECT TO THE CURRENT DOMAIN'S LOGIN PAGE.

       We do NOT redirect to localhost.
    ===================================================== */

    const loginUrl = new URL(
      '/parent/login',
      request.url
    );

    return NextResponse.redirect(
      loginUrl,
      303
    );
  }
}