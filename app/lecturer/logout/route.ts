import { NextResponse } from 'next/server';

import { logoutLecturer } from '@/lib/lecturer-auth';

/* =========================================================
   POST /api/lecturer/logout
========================================================= */

export async function POST() {
  try {
    await logoutLecturer();

    return NextResponse.json(
      {
        success: true,
        message: 'Lecturer logged out successfully.',
      },
      {
        status: 200,
      }
    );
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
      }
    );
  }
}