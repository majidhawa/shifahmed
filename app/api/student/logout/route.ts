import { NextResponse } from 'next/server';

import {
  destroyStudentSession,
} from '@/lib/student-auth';

/* =========================================================
   POST /api/student/logout
========================================================= */
export async function POST(request: Request) {
  await destroyStudentSession();

  return NextResponse.redirect(
    new URL('/student/login', request.url),
    303
  );
}