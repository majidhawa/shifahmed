import { redirect } from 'next/navigation';
import Link from 'next/link';

import pool from '@/lib/db';
import { getStudentSession } from '@/lib/student-auth';

import {
  FileText,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  WalletCards,
} from 'lucide-react';

import PaymentClient from './PaymentClient';

/* =========================================================
   PAYMENT PAGE
========================================================= */

export const dynamic = 'force-dynamic';

export default async function StudentPaymentPage() {
  /* =======================================================
     CHECK STUDENT SESSION
  ======================================================= */

  const session = await getStudentSession();

  if (!session) {
    redirect('/student/login');
  }

  /* =======================================================
     GET AUTHENTICATED STUDENT APPLICATION

     We verify BOTH:
       - application ID
       - application number

     Nothing is trusted from the browser.
  ======================================================= */

  const result = await pool.query(
    `
      SELECT
        id,
        application_number,

        surname,
        middle_name,
        first_name,

        mobile,

        course,
        intake,

        application_fee,
        payment_status,
        application_status,

        mpesa_phone_number,
        mpesa_receipt_number,
        mpesa_transaction_date,

        mpesa_checkout_request_id,
        mpesa_merchant_request_id,

        created_at

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

  /* =======================================================
     APPLICATION NOT FOUND
  ======================================================= */

  if (result.rows.length === 0) {
    redirect('/student/login');
  }

  const student = result.rows[0];

  /* =======================================================
     FULL NAME
  ======================================================= */

  const fullName = [
    student.first_name,
    student.middle_name,
    student.surname,
  ]
    .filter(Boolean)
    .join(' ');

  /* =======================================================
     PAYMENT STATUS
  ======================================================= */

  const paymentStatus = String(
    student.payment_status || 'Pending'
  );

  const paymentStatusLower =
    paymentStatus.trim().toLowerCase();

  const isPaid =
    paymentStatusLower === 'paid';

  const isRejected =
    paymentStatusLower === 'rejected';

  /* =======================================================
     APPLICATION STATUS
  ======================================================= */

  const applicationStatus = String(
    student.application_status || 'Pending'
  );

  /* =======================================================
     APPLICATION FEE
  ======================================================= */

  const applicationFee = Number(
    student.application_fee || 0
  );

  /* =======================================================
     PAYMENT PHONE
  ======================================================= */

  const paymentPhone =
    student.mpesa_phone_number ||
    student.mobile ||
    '';

  /* =======================================================
     PAYMENT DATE
  ======================================================= */

  let paymentDate = '—';

  if (student.mpesa_transaction_date) {
    const rawDate = String(
      student.mpesa_transaction_date
    );

    /*
     * M-Pesa transaction dates normally arrive as:
     *
     * YYYYMMDDHHmmss
     *
     * Example:
     * 20260805162808
     */

    if (/^\d{14}$/.test(rawDate)) {
      const year = Number(
        rawDate.substring(0, 4)
      );

      const month =
        Number(
          rawDate.substring(4, 6)
        ) - 1;

      const day = Number(
        rawDate.substring(6, 8)
      );

      const hour = Number(
        rawDate.substring(8, 10)
      );

      const minute = Number(
        rawDate.substring(10, 12)
      );

      const second = Number(
        rawDate.substring(12, 14)
      );

      const date = new Date(
        year,
        month,
        day,
        hour,
        minute,
        second
      );

      if (!Number.isNaN(date.getTime())) {
        paymentDate =
          date.toLocaleString(
            'en-KE',
            {
              dateStyle: 'medium',
              timeStyle: 'short',
            }
          );
      }
    } else {
      const date = new Date(
        student.mpesa_transaction_date
      );

      if (
        !Number.isNaN(
          date.getTime()
        )
      ) {
        paymentDate =
          date.toLocaleString(
            'en-KE',
            {
              dateStyle: 'medium',
              timeStyle: 'short',
            }
          );
      }
    }
  }

  /* =======================================================
     APPLICATION DATE
  ======================================================= */

  const applicationDate =
    student.created_at
      ? new Date(
          student.created_at
        ).toLocaleDateString(
          'en-KE',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }
        )
      : '—';

  /* =======================================================
     PAYMENT STATUS COLORS
  ======================================================= */

  let paymentStatusClass =
    'border-amber-200 bg-amber-50 text-amber-700';

  if (isPaid) {
    paymentStatusClass =
      'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (isRejected) {
    paymentStatusClass =
      'border-red-200 bg-red-50 text-red-700';
  }

  /* =======================================================
     CLIENT PAYMENT DATA
  ======================================================= */

  const paymentData = {
    applicationNumber: String(
      student.application_number
    ),

    applicationId: Number(
      student.id
    ),

    fullName:
      fullName || 'Student',

    course: String(
      student.course || '—'
    ),

    intake: String(
      student.intake || '—'
    ),

    applicationFee:
      applicationFee,

    paymentStatus:
      paymentStatus,

    paymentPhone:
      String(paymentPhone || ''),

    mpesaReceiptNumber:
      student.mpesa_receipt_number
        ? String(
            student.mpesa_receipt_number
          )
        : null,

    mpesaTransactionDate:
      paymentDate,

    isPaid:
      isPaid,
  };

  /* =======================================================
     UI
     
     Header + Sidebar are supplied by:
     
     app/student/dashboard/layout.tsx
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f8faf9]">

      <main className="px-4 py-6 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-7xl">

          {/* =================================================
              BACK
          ================================================= */}

          <Link
            href="/student/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#0f4f3f]"
          >
            <ArrowLeft size={17} />

            Back to Dashboard
          </Link>

          {/* =================================================
              INTRO
          ================================================= */}

          <div className="mb-6">

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

              <div>

                <p className="text-sm font-semibold text-[#0f4f3f]">
                  Application Payment
                </p>

                <h2 className="mt-1 text-2xl font-bold text-[#0c1f1a] sm:text-3xl">
                  Payment & Receipt
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                  Pay your application fee securely
                  through M-Pesa and download your
                  official payment receipt after the
                  payment has been verified.
                </p>

              </div>

              <div className="flex items-center gap-3">

                <span className="text-xs text-gray-400">
                  Application No.
                </span>

                <span className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-xs font-bold text-gray-700">
                  {student.application_number}
                </span>

              </div>

            </div>

          </div>

          {/* =================================================
              PAYMENT STATUS SUMMARY
          ================================================= */}

          <section className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

            <div className="grid md:grid-cols-3">

              {/* =================================================
                  APPLICATION FEE
              ================================================= */}

              <div className="p-6 sm:p-7">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d7a93b]/15 text-[#a67d13]">

                    <WalletCards size={22} />

                  </div>

                  <div>

                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Application Fee
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#0c1f1a]">
                      KSh{' '}
                      {applicationFee.toLocaleString(
                        'en-KE'
                      )}
                    </p>

                  </div>

                </div>

              </div>

              {/* =================================================
                  PAYMENT STATUS
              ================================================= */}

              <div className="border-t bg-[#fafcfb] p-6 md:border-l md:border-t-0 sm:p-7">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">

                    {isPaid ? (
                      <CheckCircle2 size={22} />
                    ) : isRejected ? (
                      <AlertCircle size={22} />
                    ) : (
                      <Clock3 size={22} />
                    )}

                  </div>

                  <div>

                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Payment Status
                    </p>

                    <span
                      className={`mt-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${paymentStatusClass}`}
                    >

                      <span className="h-1.5 w-1.5 rounded-full bg-current" />

                      {paymentStatus}

                    </span>

                  </div>

                </div>

              </div>

              {/* =================================================
                  APPLICATION STATUS
              ================================================= */}

              <div className="border-t p-6 md:border-l md:border-t-0 sm:p-7">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                    <ShieldCheck size={22} />

                  </div>

                  <div>

                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Application Status
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#0c1f1a]">
                      {applicationStatus}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              PAYMENT CLIENT
          ================================================= */}

          <PaymentClient
            payment={paymentData}
          />

          {/* =================================================
              APPLICATION INFORMATION
          ================================================= */}

          <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">

                <FileText size={21} />

              </div>

              <div>

                <h3 className="font-bold text-[#0c1f1a]">
                  Application Information
                </h3>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Details associated with this payment.
                </p>

              </div>

            </div>

            <div className="mt-6 grid gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">

              <InfoItem
                label="Applicant"
                value={fullName}
              />

              <InfoItem
                label="Application Number"
                value={
                  student.application_number
                }
              />

              <InfoItem
                label="Course"
                value={
                  student.course
                }
              />

              <InfoItem
                label="Intake"
                value={
                  student.intake
                }
              />

              <InfoItem
                label="Date Submitted"
                value={
                  applicationDate
                }
              />

              <InfoItem
                label="M-Pesa Number"
                value={
                  paymentPhone ||
                  'Not provided'
                }
              />

              <InfoItem
                label="M-Pesa Receipt"
                value={
                  student.mpesa_receipt_number ||
                  'Not available'
                }
                highlight={
                  Boolean(
                    student.mpesa_receipt_number
                  )
                }
              />

              <InfoItem
                label="Payment Date"
                value={
                  paymentDate
                }
              />

            </div>

          </section>

          {/* =================================================
              SECURITY NOTICE
          ================================================= */}

          <div className="mt-6 rounded-2xl border border-[#d7a93b]/20 bg-[#fffdf5] p-5">

            <div className="flex gap-3">

              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-[#a67d13]"
              />

              <div>

                <p className="text-sm font-semibold text-[#0c1f1a]">
                  Important payment information
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Only make payment using the official
                  M-Pesa payment prompt generated by
                  this portal. Your receipt becomes
                  available only after the M-Pesa
                  transaction has been successfully
                  received and verified by the college
                  system.
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="py-8 text-center">

            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Shifah
              Medical Training College. All rights
              reserved.
            </p>

            <p className="mt-1 text-[11px] text-gray-400">
              Student Portal • Secure Applicant Access
            </p>

          </div>

        </div>

      </main>

    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p
        className={`
          mt-1.5 break-words text-sm font-semibold
          ${
            highlight
              ? 'text-[#0f4f3f]'
              : 'text-gray-800'
          }
        `}
      >
        {value || '—'}
      </p>

    </div>
  );
}