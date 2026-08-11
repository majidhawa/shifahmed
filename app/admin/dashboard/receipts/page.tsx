
import Link from 'next/link';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

import {
  Receipt,
  CheckCircle2,
  Search,
  Download,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

/* =========================================================
   TYPES
========================================================= */

type ReceiptRecord = {
  id: number;
  application_number: string;
  student_name: string;
  course: string;
  intake: string;
  application_fee: number;
  payment_status: string;
  mpesa_receipt_number: string | null;
  mpesa_phone_number: string | null;
  mpesa_transaction_date: string | null;
  created_at: string;
};

/* =========================================================
   PAGE
========================================================= */

export default async function ReceiptsPage() {
  /* =======================================================
     ADMIN AUTHENTICATION
  ======================================================= */

  const admin = requireAdmin();

  if (!admin) {
    return null;
  }

  /* =======================================================
     GET PAID APPLICATIONS

     IMPORTANT:
     We deliberately do NOT use:

     COALESCE(mpesa_transaction_date, created_at)

     because mpesa_transaction_date is stored as text/varchar
     while created_at is a PostgreSQL timestamp.

     Instead, we order by created_at only.
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

    WHERE LOWER(TRIM(payment_status)) = 'paid'

    ORDER BY created_at DESC
  `);

  const receipts: ReceiptRecord[] =
    result.rows;

  /* =======================================================
     HELPERS
  ======================================================= */

  const formatCurrency = (
    amount: number
  ): string => {
    return `KSh ${Number(
      amount || 0
    ).toLocaleString('en-KE')}`;
  };

  const formatDate = (
    value: string | null
  ): string => {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      'en-KE',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  /* =======================================================
     TOTAL COLLECTION
  ======================================================= */

  const totalCollected =
    receipts.reduce(
      (
        total,
        receipt
      ) =>
        total +
        Number(
          receipt.application_fee || 0
        ),
      0
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-brand-cream">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            {/* TITLE */}

            <div>

              <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
                Finance
              </p>

              <h1 className="mt-1 text-3xl font-bold text-brand-dark">
                Receipts
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                View and download official application
                fee receipts.
              </p>

            </div>

            {/* PAYMENTS BUTTON */}

            <Link
              href="/admin/dashboard/payments"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-green px-5 py-3 text-sm font-semibold text-brand-green transition hover:bg-brand-cream"
            >

              <ArrowRight className="h-4 w-4 rotate-180" />

              Payments

            </Link>

          </div>

        </div>

      </div>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid gap-5 md:grid-cols-2">

          {/* RECEIPTS ISSUED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Receipts Issued
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {receipts.length}
                </p>

              </div>

              <div className="rounded-xl bg-brand-cream p-3">

                <Receipt className="h-7 w-7 text-brand-green" />

              </div>

            </div>

          </div>

          {/* TOTAL COLLECTION */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Total Collected
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-green">
                  {formatCurrency(
                    totalCollected
                  )}
                </p>

              </div>

              <div className="rounded-xl bg-green-50 p-3">

                <CheckCircle2 className="h-7 w-7 text-brand-green" />

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            RECEIPTS TABLE CARD
        ================================================= */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">

          {/* =================================================
              TABLE HEADER
          ================================================= */}

          <div className="border-b border-slate-200 px-6 py-5">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  Official Receipts
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Only verified paid applications appear
                  here.
                </p>

              </div>

              {/* SEARCH UI */}

              <div className="relative w-full lg:w-80">

                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search receipts..."
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
                    Receipt
                  </th>

                  <th className="px-6 py-4">
                    Applicant
                  </th>

                  <th className="px-6 py-4">
                    Course
                  </th>

                  <th className="px-6 py-4">
                    Amount
                  </th>

                  <th className="px-6 py-4">
                    M-Pesa
                  </th>

                  <th className="px-6 py-4">
                    Date
                  </th>

                  <th className="px-6 py-4 text-right">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {receipts.map(
                  (
                    receipt
                  ) => {

                    /* =====================================
                       RECEIPT NUMBER
                    ===================================== */

                    const receiptNumber =
                      `SMTC-RCPT-${String(
                        receipt.id
                      ).padStart(
                        6,
                        '0'
                      )}`;

                    /* =====================================
                       DOWNLOAD URL
                    ===================================== */

                    const receiptUrl =
                      `/api/applications/${encodeURIComponent(
                        receipt.application_number
                      )}/receipt`;

                    return (

                      <tr
                        key={
                          receipt.id
                        }
                        className="transition hover:bg-slate-50"
                      >

                        {/* ===============================
                            RECEIPT
                        =============================== */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="rounded-lg bg-brand-cream p-2">

                              <Receipt className="h-4 w-4 text-brand-green" />

                            </div>

                            <div>

                              <p className="font-semibold text-brand-dark">
                                {receiptNumber}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {
                                  receipt.application_number
                                }
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* ===============================
                            APPLICANT
                        =============================== */}

                        <td className="px-6 py-4">

                          <p className="font-medium text-slate-800">
                            {
                              receipt.student_name ||
                              '—'
                            }
                          </p>

                        </td>

                        {/* ===============================
                            COURSE
                        =============================== */}

                        <td className="max-w-[200px] px-6 py-4">

                          <p className="truncate text-sm text-slate-600">
                            {
                              receipt.course ||
                              '—'
                            }
                          </p>

                        </td>

                        {/* ===============================
                            AMOUNT
                        =============================== */}

                        <td className="px-6 py-4">

                          <p className="font-semibold text-brand-green">
                            {formatCurrency(
                              receipt.application_fee
                            )}
                          </p>

                        </td>

                        {/* ===============================
                            M-PESA
                        =============================== */}

                        <td className="px-6 py-4">

                          <p className="font-mono text-xs font-semibold text-slate-700">
                            {
                              receipt.mpesa_receipt_number ||
                              '—'
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              receipt.mpesa_phone_number ||
                              '—'
                            }
                          </p>

                        </td>

                        {/* ===============================
                            DATE
                        =============================== */}

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">

                          {formatDate(
                            receipt.mpesa_transaction_date ||
                            receipt.created_at
                          )}

                        </td>

                        {/* ===============================
                            ACTION
                        =============================== */}

                        <td className="px-6 py-4 text-right">

                          <a
                            href={
                              receiptUrl
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
                          >

                            <Download className="h-3.5 w-3.5" />

                            Download

                          </a>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {receipts.length === 0 && (

            <div className="px-6 py-16 text-center">

              <Receipt className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 text-lg font-semibold text-brand-dark">
                No receipts available
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Receipts will appear here after
                successful M-Pesa payments.
              </p>

            </div>

          )}

          {/* =================================================
              MOBILE RECEIPTS
          ================================================= */}

          {receipts.length > 0 && (

            <div className="divide-y divide-slate-100 md:hidden">

              {receipts.map(
                (
                  receipt
                ) => {

                  /* =========================================
                     RECEIPT NUMBER
                  ========================================= */

                  const receiptNumber =
                    `SMTC-RCPT-${String(
                      receipt.id
                    ).padStart(
                      6,
                      '0'
                    )}`;

                  /* =========================================
                     DOWNLOAD URL
                  ========================================= */

                  const receiptUrl =
                    `/api/applications/${encodeURIComponent(
                      receipt.application_number
                    )}/receipt`;

                  return (

                    <div
                      key={
                        receipt.id
                      }
                      className="p-5"
                    >

                      {/* HEADER */}

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="font-semibold text-brand-dark">
                            {receiptNumber}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {
                              receipt.application_number
                            }
                          </p>

                        </div>

                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-brand-green">

                          <CheckCircle2 className="h-3.5 w-3.5" />

                          PAID

                        </span>

                      </div>

                      {/* DETAILS */}

                      <div className="mt-4 space-y-3">

                        {/* APPLICANT */}

                        <div>

                          <p className="text-xs text-slate-400">
                            Applicant
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {
                              receipt.student_name ||
                              '—'
                            }
                          </p>

                        </div>

                        {/* COURSE */}

                        <div>

                          <p className="text-xs text-slate-400">
                            Course
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {
                              receipt.course ||
                              '—'
                            }
                          </p>

                        </div>

                        {/* AMOUNT + MPESA */}

                        <div className="grid grid-cols-2 gap-4">

                          <div>

                            <p className="text-xs text-slate-400">
                              Amount
                            </p>

                            <p className="mt-1 text-sm font-semibold text-brand-green">
                              {formatCurrency(
                                receipt.application_fee
                              )}
                            </p>

                          </div>

                          <div>

                            <p className="text-xs text-slate-400">
                              M-Pesa
                            </p>

                            <p className="mt-1 font-mono text-xs font-semibold text-slate-700">
                              {
                                receipt.mpesa_receipt_number ||
                                '—'
                              }
                            </p>

                          </div>

                        </div>

                        {/* DATE */}

                        <div>

                          <p className="text-xs text-slate-400">
                            Payment Date
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {formatDate(
                              receipt.mpesa_transaction_date ||
                              receipt.created_at
                            )}
                          </p>

                        </div>

                      </div>

                      {/* DOWNLOAD */}

                      <a
                        href={
                          receiptUrl
                        }
                        className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
                      >

                        <Download className="h-4 w-4" />

                        Download Receipt

                      </a>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </div>

      </main>

    </div>
  );
}

