import { NextResponse } from 'next/server';

import {
  clearParentSession,
} from '@/lib/parent-auth';

export async function POST() {
  try {
    await clearParentSession();

    return NextResponse.redirect(
      new URL(
        '/parent/login',
        process.env.NEXT_PUBLIC_SITE_URL ||
          'http://localhost:3000'
      )
    );
  } catch (error) {
    console.error(
      'PARENT LOGOUT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to log out.',
      },
      {
        status: 500,
      }
    );
  }
}