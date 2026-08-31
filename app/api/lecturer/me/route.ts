import { NextResponse } from 'next/server';

import { requireLecturer } from '@/lib/lecturer-auth';

/* =========================================================
   GET /api/lecturer/me

   Returns the currently authenticated lecturer.
========================================================= */

export async function GET() {
  try {
    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Not authenticated.',
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        lecturer: {
          id: lecturer.id,
          name: lecturer.name,
          email: lecturer.email,
          phone: lecturer.phone ?? null,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET /api/lecturer/me error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load lecturer information.',
      },
      {
        status: 500,
      }
    );
  }
}