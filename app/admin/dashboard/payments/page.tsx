
import Link from 'next/link';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

import {
  CreditCard,
  CheckCircle2,
  Clock3,
  XCircle,
  Receipt,
  Search,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

/* =========================================================
   PAYMENT TYPE
========================================================= */

type Payment = {
  id: number;
  application_number: string;
  student_name: string;
  course: string;
  intake: string;
  application_fee: number;
  payment_status: string;

  /*
    For the temporary manual verification system,
    mpesa_receipt_number stores the M-Pesa transaction
    code submitted by the student.
  */

  mpesa_receipt_number: string | null;
  mpesa_phone_number: string | null;
  mpesa_transaction_date: string | null;

  created_at: string;
};

/* =========================================================
   PAGE
========================================================= */

export default async function PaymentsPage() {
  /* =======================================================
     ADMIN AUTHENTICATION
  ======================================================= */

  const admin = requireAdmin();

  if (!admin) {
    return null;
  }

  /* =======================================================
     GET PAYMENT DATA
  ======================================================= */

  const result = await pool.query(`
    SELECT
      id,
      application_number,

      CONCAT_WS(
        ' ',
        surname,
        middle_name,
        first_name
      ) AS student_name,

      course,
      intake,
      application_fee,
      payment_status,
      mpesa_receipt_number,
      mpesa_phone_number,
      mpesa_transaction_date,
      created_at

    FROM applications

    ORDER BY created_at DESC
  `);

  const payments: Payment[] = result.rows;

  /* =======================================================
     STATISTICS
  ======================================================= */

  const totalPayments = payments.length;

  const paidPayments = payments.filter(
    (payment) =>
      String(payment.payment_status)
        .trim()
        .toLowerCase() === 'paid'
  );

  const pendingPayments = payments.filter(
    (payment) =>
      String(payment.payment_status)
        .trim()
        .toLowerCase() === 'pending'
  );

  const failedPayments = payments.filter(
    (payment) =>
      ['failed', 'rejected'].includes(
        String(payment.payment_status)
          .trim()
          .toLowerCase()
      )
  );

  /*
    Only count money from verified payments.
  */

  const totalCollected = paidPayments.reduce(
    (total, payment) =>
      total + Number(payment.application_fee || 0),
    0
  );

  /* =======================================================
     HELPERS
  ======================================================= */

  const formatCurrency = (amount: number) =>
    `KSh ${Number(amount || 0).toLocaleString('en-KE')}`;

  const formatDate = (value: string | null) => {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div>
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
                Finance
              </p>

              <h1 className="mt-1 text-3xl font-bold text-brand-dark">
                Payments
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Review and verify application fee payments
                submitted by students through M-Pesa.
              </p>
            </div>

            <Link
              href="/admin/dashboard/receipts"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              <Receipt className="h-4 w-4" />

              View Receipts
            </Link>

          </div>

        </div>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* =================================================
            MANUAL PAYMENT NOTICE
        ================================================= */}

        <div className="mb-8 rounded-2xl border border-brand-gold/30 bg-brand-gold/5 p-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>

                <h2 className="font-bold text-brand-dark">
                  Manual M-Pesa Verification
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Students currently pay using the college
                  Paybill and submit their M-Pesa transaction
                  code for verification by an administrator.
                </p>

              </div>

            </div>

            <div className="shrink-0 rounded-xl bg-white px-5 py-3 shadow-sm ring-1 ring-slate-100">

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Paybill
              </p>

              <p className="mt-0.5 text-lg font-bold text-brand-green">
                247247
              </p>

              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Account
              </p>

              <p className="font-mono text-sm font-semibold text-brand-dark">
                0330287421280
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Total Payments
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {totalPayments}
                </p>

              </div>

              <div className="rounded-xl bg-brand-cream p-3">

                <CreditCard className="h-6 w-6 text-brand-green" />

              </div>

            </div>

          </div>

          {/* PAID */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Verified
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-green">
                  {paidPayments.length}
                </p>

              </div>

              <div className="rounded-xl bg-green-50 p-3">

                <CheckCircle2 className="h-6 w-6 text-brand-green" />

              </div>

            </div>

            <p className="mt-3 text-sm font-semibold text-brand-green">
              {formatCurrency(totalCollected)} collected
            </p>

          </div>

          {/* PENDING */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Awaiting Verification
                </p>

                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {pendingPayments.length}
                </p>

              </div>

              <div className="rounded-xl bg-amber-50 p-3">

                <Clock3 className="h-6 w-6 text-amber-600" />

              </div>

            </div>

          </div>

          {/* REJECTED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Rejected
                </p>

                <p className="mt-2 text-3xl font-bold text-red-600">
                  {failedPayments.length}
                </p>

              </div>

              <div className="rounded-xl bg-red-50 p-3">

                <XCircle className="h-6 w-6 text-red-600" />

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            PAYMENT TABLE
        ================================================= */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">

          {/* TABLE HEADER */}

          <div className="border-b border-slate-200 px-6 py-5">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  Payment Submissions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review M-Pesa codes submitted by applicants.
                </p>

              </div>

              <div className="relative w-full lg:w-80">

                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search payments..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

            </div>

          </div>

          {/* =================================================
              DESKTOP TABLE
          ================================================= */}

          <div className="hidden overflow-x-auto md:block">

            <table className="w-full text-left">

              <thead className="bg-brand-cream">

                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                  <th className="px-6 py-4">
                    Application
                  </th>

                  <th className="px-6 py-4">
                    Student
                  </th>

                  <th className="px-6 py-4">
                    Course
                  </th>

                  <th className="px-6 py-4">
                    Amount
                  </th>

                  <th className="px-6 py-4">
                    M-Pesa Code
                  </th>

                  <th className="px-6 py-4">
                    Phone
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {payments.map((payment) => {

                  const status =
                    String(payment.payment_status || '')
                      .trim()
                      .toLowerCase();

                  const hasCode =
                    Boolean(
                      payment.mpesa_receipt_number
                    );

                  return (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* APPLICATION */}

                      <td className="px-6 py-4">

                        <p className="font-semibold text-brand-dark">
                          {payment.application_number}
                        </p>

                      </td>

                      {/* STUDENT */}

                      <td className="px-6 py-4">

                        <p className="font-medium text-slate-800">
                          {payment.student_name || '—'}
                        </p>

                      </td>

                      {/* COURSE */}

                      <td className="max-w-[180px] px-6 py-4">

                        <p className="truncate text-sm text-slate-600">
                          {payment.course || '—'}
                        </p>

                      </td>

                      {/* AMOUNT */}

                      <td className="px-6 py-4">

                        <p className="font-semibold text-brand-dark">
                          {formatCurrency(
                            payment.application_fee
                          )}
                        </p>

                      </td>

                      {/* M-PESA CODE */}

                      <td className="px-6 py-4">

                        {hasCode ? (

                          <div>

                            <p className="font-mono text-sm font-bold text-brand-dark">
                              {payment.mpesa_receipt_number}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Submitted
                            </p>

                          </div>

                        ) : (

                          <span className="text-sm text-slate-400">
                            Not submitted
                          </span>

                        )}

                      </td>

                      {/* PHONE */}

                      <td className="px-6 py-4">

                        <p className="text-sm text-slate-600">
                          {payment.mpesa_phone_number || '—'}
                        </p>

                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">

                        {status === 'paid' ? (

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-brand-green">

                            <CheckCircle2 className="h-3.5 w-3.5" />

                            VERIFIED

                          </span>

                        ) : status === 'pending' ? (

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">

                            <Clock3 className="h-3.5 w-3.5" />

                            PENDING

                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">

                            <XCircle className="h-3.5 w-3.5" />

                            {String(
                              payment.payment_status ||
                                'UNKNOWN'
                            ).toUpperCase()}

                          </span>

                        )}

                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-4 text-right">

                        {status === 'pending' && hasCode ? (

                          <Link
                            href={`/admin/dashboard/payments/${encodeURIComponent(
                              payment.application_number
                            )}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-green px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
                          >
                            Review

                            <ArrowRight className="h-3.5 w-3.5" />

                          </Link>

                        ) : (

                          <Link
                            href={`/admin/dashboard/applications/${encodeURIComponent(
                              payment.application_number
                            )}`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-brand-green transition hover:bg-brand-cream"
                          >
                            View

                            <ArrowRight className="h-3.5 w-3.5" />

                          </Link>

                        )}

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {payments.length === 0 && (

            <div className="px-6 py-16 text-center">

              <CreditCard className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 text-lg font-semibold text-brand-dark">
                No payment records
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Payment submissions will appear here
                once students submit their M-Pesa details.
              </p>

            </div>

          )}

          {/* =================================================
              MOBILE
          ================================================= */}

          {payments.length > 0 && (

            <div className="divide-y divide-slate-100 md:hidden">

              {payments.map((payment) => {

                const status =
                  String(payment.payment_status || '')
                    .trim()
                    .toLowerCase();

                const hasCode =
                  Boolean(
                    payment.mpesa_receipt_number
                  );

                return (

                  <div
                    key={payment.id}
                    className="p-5"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="text-sm font-bold text-brand-dark">
                          {payment.application_number}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {payment.student_name || '—'}
                        </p>

                      </div>

                      {status === 'paid' ? (

                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-brand-green">
                          VERIFIED
                        </span>

                      ) : status === 'pending' ? (

                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          PENDING
                        </span>

                      ) : (

                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          {status.toUpperCase()}
                        </span>

                      )}

                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4">

                      <div>

                        <p className="text-xs text-slate-400">
                          Amount
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatCurrency(
                            payment.application_fee
                          )}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-slate-400">
                          M-Pesa Code
                        </p>

                        <p className="mt-1 font-mono text-sm font-bold text-slate-700">
                          {payment.mpesa_receipt_number || '—'}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-slate-400">
                          Phone
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {payment.mpesa_phone_number || '—'}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-slate-400">
                          Course
                        </p>

                        <p className="mt-1 truncate text-sm text-slate-700">
                          {payment.course || '—'}
                        </p>

                      </div>

                    </div>

                    {status === 'pending' && hasCode ? (

                      <Link
                        href={`/admin/dashboard/payments/${encodeURIComponent(
                          payment.application_number
                        )}`}
                        className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white"
                      >

                        <ShieldCheck className="h-4 w-4" />

                        Review Payment

                      </Link>

                    ) : (

                      <Link
                        href={`/admin/dashboard/applications/${encodeURIComponent(
                          payment.application_number
                        )}`}
                        className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-brand-green px-4 py-3 text-sm font-semibold text-brand-green"
                      >

                        View Application

                        <ArrowRight className="h-4 w-4" />

                      </Link>

                    )}

                  </div>

                );
              })}

            </div>

          )}

        </div>

      </main>
    </div>
  );
}

