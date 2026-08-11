import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { createStudentSession } from '@/lib/student-auth';

/* =========================================================
   NORMALIZE PHONE NUMBER
========================================================= */

function normalizeKenyanPhone(
  phone: string
): string {
  let value = phone
    .trim()
    .replace(/\s+/g, '')
    .replace(/-/g, '');

  /*
    0799676823
    -> 254799676823
  */

  if (
    value.startsWith('0') &&
    value.length === 10
  ) {
    return `254${value.substring(1)}`;
  }

  /*
    +254799676823
    -> 254799676823
  */

  if (value.startsWith('+254')) {
    return value.substring(1);
  }

  /*
    Already 254...
  */

  if (
    value.startsWith('254') &&
    value.length === 12
  ) {
    return value;
  }

  return value;
}

/* =========================================================
   POST /api/student/login
========================================================= */

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const applicationNumber =
      typeof body.applicationNumber === 'string'
        ? body.applicationNumber.trim().toUpperCase()
        : '';

    const phone =
      typeof body.phone === 'string'
        ? body.phone.trim()
        : '';

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!applicationNumber) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please enter your application number.',
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please enter the phone number used during application.',
        },
        { status: 400 }
      );
    }

    const normalizedPhone =
      normalizeKenyanPhone(phone);

    /* =====================================================
       FIND EXISTING APPLICATION
    ===================================================== */

    const query = `
      SELECT
        id,
        application_number,
        surname,
        middle_name,
        first_name,
        mobile,
        email,
        course,
        intake,
        application_fee,
        payment_status,
        application_status,
        created_at
      FROM applications
      WHERE UPPER(application_number) = $1
        AND (
          mobile = $2
          OR mobile = $3
          OR mobile = $4
        )
      LIMIT 1
    `;

    const result = await pool.query(
      query,
      [
        applicationNumber,
        phone,
        normalizedPhone,
        normalizedPhone.startsWith('254')
          ? `0${normalizedPhone.substring(3)}`
          : normalizedPhone,
      ]
    );

    /* =====================================================
       APPLICATION NOT FOUND
    ===================================================== */

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'We could not find an application matching those details. Please check your application number and phone number.',
        },
        { status: 401 }
      );
    }

    const application =
      result.rows[0];

    /* =====================================================
       CREATE SECURE SESSION
    ===================================================== */

    await createStudentSession(
      application.id,
      application.application_number
    );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          'Login successful.',
        student: {
          application_number:
            application.application_number,

          first_name:
            application.first_name,

          surname:
            application.surname,

          course:
            application.course,

          intake:
            application.intake,

          payment_status:
            application.payment_status,

          application_status:
            application.application_status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'STUDENT LOGIN ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to log in at the moment. Please try again.',
      },
      { status: 500 }
    );
  }
}