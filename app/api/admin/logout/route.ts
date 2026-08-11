
import { NextResponse } from 'next/server';

import { clearAdminSession } from '@/lib/admin-auth';

/* =========================================================
   POST /api/admin/logout
========================================================= */

export async function POST() {
  try {
    clearAdminSession();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('Admin logout error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to log out.',
      },
      { status: 500 }
    );
  }
}

