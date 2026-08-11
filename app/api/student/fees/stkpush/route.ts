
import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { getStudentSession } from '@/lib/student-auth';

/* =========================================================
   CONFIGURATION
========================================================= */

/*
 * IMPORTANT:
 *
 * The total programme fee INCLUDES the KSh 1,500
 * application fee already paid during application.
 *
 * Therefore:
 *
 * Total Programme Fee
 * - Application Fee Paid
 * - School Fees Paid
 * = Outstanding Balance
 */

const APPLICATION_FEE = 1500;

/*
 * Updated 2026 Fee Structure
 *
 * These values are the TOTAL programme fees.
 *
 * Application fee is already included in each amount.
 */

const COURSE_FEES: Record<string, number> = {
  'EMT': 58000,

  'Diploma in Paramedicine': 58000,

  'Safe Phlebotomy': 38000,

  'German A1/A2': 16500,

  'German B1/B2': 20500,

  'Caregiving Level 4': 75000,

  'Dialysis Technology': 75000,
};

/* =========================================================
   COURSE NAME NORMALIZATION
========================================================= */

function normalizeCourseName(
  course: string
): string {
  return course
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/* =========================================================
   GET COURSE FEE
========================================================= */

function getCourseFee(
  course: string
): number | null {

  const normalized =
    normalizeCourseName(course);

  const courseEntry =
    Object.entries(COURSE_FEES).find(
      ([courseName]) =>
        normalizeCourseName(courseName) ===
        normalized
    );

  return courseEntry
    ? courseEntry[1]
    : null;
}

/* =========================================================
   NORMALIZE PHONE
========================================================= */

function normalizePhone(
  phone: string
): string {

  let value =
    phone
      .trim()
      .replace(/\s+/g, '');

  if (
    value.startsWith('+254')
  ) {
    value =
      value.substring(1);
  }

  if (
    value.startsWith('0')
  ) {
    value =
      `254${value.substring(1)}`;
  }

  return value;
}

/* =========================================================
   VALIDATE KENYAN PHONE
========================================================= */

function isValidKenyanPhone(
  phone: string
): boolean {

  return /^2547\d{8}$/.test(
    phone
  );
}

/* =========================================================
   GET DARAJA ACCESS TOKEN
========================================================= */

async function getAccessToken(): Promise<string> {

  const consumerKey =
    process.env.MPESA_CONSUMER_KEY;

  const consumerSecret =
    process.env.MPESA_CONSUMER_SECRET;

  if (
    !consumerKey ||
    !consumerSecret
  ) {
    throw new Error(
      'M-Pesa consumer credentials are not configured.'
    );
  }

  const credentials =
    Buffer.from(
      `${consumerKey}:${consumerSecret}`
    ).toString('base64');

  const response =
    await fetch(
      'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        method: 'GET',

        headers: {
          Authorization:
            `Basic ${credentials}`,
        },

        cache: 'no-store',
      }
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    !data.access_token
  ) {
    console.error(
      'DARAJA TOKEN ERROR:',
      data
    );

    throw new Error(
      'Unable to obtain M-Pesa access token.'
    );
  }

  return data.access_token;
}

/* =========================================================
   POST /api/student/fees/stkpush
========================================================= */

export async function POST(
  request: Request
) {

  try {

    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    const session =
      await getStudentSession();

    if (!session) {

      return NextResponse.json(
        {
          success: false,
          message:
            'Unauthorized.',
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       REQUEST BODY
    ===================================================== */

    const body =
      await request.json();

    const amount =
      Number(body.amount);

    const phone =
      normalizePhone(
        String(
          body.phone || ''
        )
      );

    /* =====================================================
       VALIDATE AMOUNT
    ===================================================== */

    if (
      !Number.isFinite(amount) ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {

      return NextResponse.json(
        {
          success: false,
          message:
            'Please enter a valid whole-number payment amount.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDATE PHONE
    ===================================================== */

    if (
      !isValidKenyanPhone(phone)
    ) {

      return NextResponse.json(
        {
          success: false,
          message:
            'Please enter a valid Kenyan M-Pesa phone number.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       GET AUTHENTICATED STUDENT
    ===================================================== */

    const studentResult =
      await pool.query(
        `
        SELECT
          id,
          application_number,
          first_name,
          middle_name,
          surname,
          course,
          intake,
          payment_status
        FROM applications
        WHERE id = $1
          AND application_number = $2
        LIMIT 1
        `,
        [
          session.applicationId,
          session.applicationNumber,
        ]
      );

    if (
      studentResult.rows.length === 0
    ) {

      return NextResponse.json(
        {
          success: false,
          message:
            'Student application not found.',
        },
        {
          status: 404,
        }
      );
    }

    const student =
      studentResult.rows[0];

    /* =====================================================
       VALIDATE COURSE
    ===================================================== */

    const course =
      String(
        student.course || ''
      ).trim();

    if (!course) {

      return NextResponse.json(
        {
          success: false,
          message:
            'Your selected course could not be determined.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       GET TOTAL PROGRAMME FEE
    ===================================================== */

    const totalProgrammeFee =
      getCourseFee(course);

    if (
      totalProgrammeFee === null
    ) {

      return NextResponse.json(
        {
          success: false,
          message:
            `A fee structure has not been configured for ${course}.`,
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VERIFY APPLICATION FEE
    ===================================================== */

    /*
     * The application fee is KSh 1,500.
     *
     * We only count it toward the student's fee position
     * when the application payment has actually been
     * confirmed as paid.
     */

    const applicationFeePaid =
      String(
        student.payment_status || ''
      )
        .trim()
        .toLowerCase() === 'paid'
        ? APPLICATION_FEE
        : 0;

    /* =====================================================
       GET CONFIRMED SCHOOL FEE PAYMENTS
    ===================================================== */

    const paidResult =
      await pool.query(
        `
        SELECT
          COALESCE(
            SUM(amount),
            0
          ) AS total_paid
        FROM fee_payments
        WHERE application_id = $1
          AND status = 'paid'
        `,
        [
          student.id,
        ]
      );

    const schoolFeesPaid =
      Number(
        paidResult.rows[0]?.total_paid || 0
      );

    /* =====================================================
       CALCULATE TOTAL PAID
    ===================================================== */

    /*
     * Total Paid =
     *
     * Application Fee
     * +
     * Confirmed School Fee Payments
     */

    const totalPaid =
      applicationFeePaid +
      schoolFeesPaid;

    /* =====================================================
       CALCULATE BALANCE
    ===================================================== */

    const balance =
      Math.max(
        totalProgrammeFee -
        totalPaid,
        0
      );

    /* =====================================================
       FULLY PAID CHECK
    ===================================================== */

    if (
      balance <= 0
    ) {

      return NextResponse.json(
        {
          success: false,
          message:
            'Your school fees are already fully paid.',
          feeSummary: {
            totalProgrammeFee,
            applicationFeePaid,
            schoolFeesPaid,
            totalPaid,
            balance: 0,
          },
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       PREVENT OVERPAYMENT
    ===================================================== */

    if (
      amount > balance
    ) {

      return NextResponse.json(
        {
          success: false,
          message:
            `The amount cannot exceed your outstanding balance of KSh ${balance.toLocaleString('en-KE')}.`,
          feeSummary: {
            totalProgrammeFee,
            applicationFeePaid,
            schoolFeesPaid,
            totalPaid,
            balance,
          },
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       DARAJA CONFIGURATION
    ===================================================== */

    const shortcode =
      process.env.MPESA_SHORTCODE;

    const passkey =
      process.env.MPESA_PASSKEY;

    const callbackUrl =
      process.env.MPESA_CALLBACK_URL;

    if (
      !shortcode ||
      !passkey ||
      !callbackUrl
    ) {

      throw new Error(
        'M-Pesa STK configuration is incomplete.'
      );
    }

    /* =====================================================
       TIMESTAMP
    ===================================================== */

    const now =
      new Date();

    const timestamp =
      now.getFullYear().toString() +

      String(
        now.getMonth() + 1
      ).padStart(
        2,
        '0'
      ) +

      String(
        now.getDate()
      ).padStart(
        2,
        '0'
      ) +

      String(
        now.getHours()
      ).padStart(
        2,
        '0'
      ) +

      String(
        now.getMinutes()
      ).padStart(
        2,
        '0'
      ) +

      String(
        now.getSeconds()
      ).padStart(
        2,
        '0'
      );

    /* =====================================================
       PASSWORD
    ===================================================== */

    const password =
      Buffer.from(
        `${shortcode}${passkey}${timestamp}`
      ).toString(
        'base64'
      );

    /* =====================================================
       GET ACCESS TOKEN
    ===================================================== */

    const accessToken =
      await getAccessToken();

    /* =====================================================
       CREATE PENDING SCHOOL FEE PAYMENT
    ===================================================== */

    const paymentResult =
      await pool.query(
        `
        INSERT INTO fee_payments (
          application_id,
          application_number,
          course,
          amount,
          phone,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          'pending'
        )
        RETURNING id
        `,
        [
          student.id,
          student.application_number,
          course,
          amount,
          phone,
        ]
      );

    const paymentId =
      paymentResult.rows[0].id;

    /* =====================================================
       ACCOUNT REFERENCE
    ===================================================== */

    const accountReference =
      `FEES-${student.application_number}`;

    const transactionDescription =
      `School Fees ${student.application_number}`;

    /* =====================================================
       SEND STK PUSH
    ===================================================== */

    let stkResponse: Response;

    let stkData: {
      ResponseCode?: string;
      ResponseDescription?: string;
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
    };

    try {

      stkResponse =
        await fetch(
          'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                BusinessShortCode:
                  shortcode,

                Password:
                  password,

                Timestamp:
                  timestamp,

                TransactionType:
                  'CustomerPayBillOnline',

                Amount:
                  amount,

                PartyA:
                  phone,

                PartyB:
                  shortcode,

                PhoneNumber:
                  phone,

                CallBackURL:
                  callbackUrl,

                AccountReference:
                  accountReference,

                TransactionDesc:
                  transactionDescription,
              }),

            cache: 'no-store',
          }
        );

      stkData =
        await stkResponse.json();

    } catch (error) {

      /* ===================================================
         MARK PAYMENT FAILED IF REQUEST ITSELF FAILS
      =================================================== */

      await pool.query(
        `
        UPDATE fee_payments
        SET
          status = 'failed',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [
          paymentId,
        ]
      );

      console.error(
        'DARAJA STK REQUEST ERROR:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Unable to connect to M-Pesa. Please try again.',
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       LOG STK RESPONSE
    ===================================================== */

    console.log(
      'STUDENT FEE STK RESPONSE:',
      stkData
    );

    /* =====================================================
       STK FAILURE
    ===================================================== */

    if (
      !stkResponse.ok ||
      stkData.ResponseCode !== '0'
    ) {

      await pool.query(
        `
        UPDATE fee_payments
        SET
          status = 'failed',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [
          paymentId,
        ]
      );

      return NextResponse.json(
        {
          success: false,
          message:
            stkData.ResponseDescription ||
            'Unable to initiate M-Pesa payment.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       SAVE DARAJA REFERENCES
    ===================================================== */

    await pool.query(
      `
      UPDATE fee_payments
      SET
        merchant_request_id = $1,
        checkout_request_id = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      `,
      [
        stkData.MerchantRequestID ||
          null,

        stkData.CheckoutRequestID ||
          null,

        paymentId,
      ]
    );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          'M-Pesa payment request sent successfully. Please enter your M-Pesa PIN on your phone.',

        paymentId,

        checkoutRequestId:
          stkData.CheckoutRequestID,

        amount,

        phone,

        feeSummary: {
          totalProgrammeFee,
          applicationFeePaid,
          schoolFeesPaid,
          totalPaid,
          balanceBeforePayment:
            balance,
          balanceAfterPayment:
            Math.max(
              balance - amount,
              0
            ),
        },
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    console.error(
      'STUDENT FEE STK PUSH ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to initiate fee payment. Please try again.',
      },
      {
        status: 500,
      }
    );
  }
}

