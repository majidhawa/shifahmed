
'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type PaymentApproval = {
  id: number;
  application_number: string;

  first_name: string;
  middle_name: string;
  surname: string;

  course: string;
  intake: string;

  application_fee: number;

  payment_status: string;

  mpesa_phone: string | null;
  mpesa_transaction_code: string | null;

  created_at: string;
  payment_submitted_at: string | null;
};

/* =========================================================
   HELPERS
========================================================= */

function getApplicantName(
  application: PaymentApproval
) {
  return [
    application.first_name,
    application.middle_name,
    application.surname,
  ]
    .filter(Boolean)
    .join(' ');
}

function formatDate(date: string | null) {
  if (!date) return '—';

  return new Date(date).toLocaleDateString(
    'en-KE',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(
    'en-KE',
    {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }
  ).format(Number(amount || 0));
}

/* =========================================================
   PAGE
========================================================= */

export default function PaymentApprovalsPage() {
  const [payments, setPayments] =
    useState<PaymentApproval[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  /* =======================================================
     LOAD PAYMENT APPROVALS
  ======================================================= */

  const loadPayments = useCallback(
    async () => {
      try {
        setLoading(true);
        setError('');

        const params =
          new URLSearchParams();

        if (search.trim()) {
          params.set(
            'search',
            search.trim()
          );
        }

        const response = await fetch(
          `/api/admin/payment-approvals?${params.toString()}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Unable to load payment approvals.'
          );
        }

        setPayments(
          data.payments || []
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load payment approvals.'
        );
      } finally {
        setLoading(false);
      }
    },
    [search]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  /* =======================================================
     APPROVE PAYMENT
  ======================================================= */

  async function approvePayment(
    payment: PaymentApproval
  ) {
    const confirmed =
      window.confirm(
        `Approve M-Pesa payment ${payment.mpesa_transaction_code} for ${getApplicantName(payment)}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(payment.id);
      setError('');

      const response = await fetch(
        `/api/admin/payment-approvals/${payment.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            action: 'approve',
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Unable to approve payment.'
        );
      }

      await loadPayments();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to approve payment.'
      );
    } finally {
      setProcessingId(null);
    }
  }

  /* =======================================================
     REJECT PAYMENT
  ======================================================= */

  async function rejectPayment(
    payment: PaymentApproval
  ) {
    const confirmed =
      window.confirm(
        `Reject M-Pesa payment ${payment.mpesa_transaction_code} for ${getApplicantName(payment)}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(payment.id);
      setError('');

      const response = await fetch(
        `/api/admin/payment-approvals/${payment.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            action: 'reject',
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Unable to reject payment.'
        );
      }

      await loadPayments();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reject payment.'
      );
    } finally {
      setProcessingId(null);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Finance
            </p>

            <h1 className="mt-1 text-2xl font-bold text-brand-dark sm:text-3xl">
              Payment Approvals
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review M-Pesa transaction codes submitted
              by applicants and approve or reject their
              application fee payments.
            </p>
          </div>

          <button
            type="button"
            onClick={loadPayments}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh
          </button>

        </div>

        {/* =================================================
            SUMMARY
        ================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Awaiting Approval
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {payments.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50">
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>

            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Payment Review
                </p>

                <p className="mt-2 text-lg font-bold text-brand-dark">
                  Manual Verification
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <ClipboardCheck className="h-5 w-5 text-brand-green" />
              </div>

            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Verification Method
                </p>

                <p className="mt-2 text-lg font-bold text-brand-dark">
                  M-Pesa Code
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gold/15">
                <CheckCircle2 className="h-5 w-5 text-brand-gold" />
              </div>

            </div>
          </div>

        </div>

        {/* =================================================
            SEARCH
        ================================================== */}

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

          <label
            htmlFor="payment-search"
            className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Search Payments
          </label>

          <div className="relative">

            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              id="payment-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Application number, applicant name, phone or M-Pesa code..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
            />

          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            PAYMENTS TABLE
        ================================================== */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">

          <div className="border-b border-slate-200 px-5 py-4">

            <h2 className="font-bold text-brand-dark">
              M-Pesa Payment Submissions
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Review each submitted transaction
              code before approving the payment.
            </p>

          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">

              <div className="text-center">

                <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-green" />

                <p className="mt-3 text-sm font-medium text-slate-500">
                  Loading payment submissions...
                </p>

              </div>

            </div>
          ) : payments.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center px-6">

              <div className="text-center">

                <CheckCircle2 className="mx-auto h-12 w-12 text-green-200" />

                <h3 className="mt-4 text-sm font-bold text-brand-dark">
                  No payments awaiting approval
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                  There are currently no M-Pesa
                  transaction submissions waiting
                  for administrator verification.
                </p>

              </div>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-[1250px] w-full">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Application
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Applicant
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Course
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      M-Pesa Phone
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Transaction Code
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Submitted
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {payments.map(
                    (payment) => {

                      const processing =
                        processingId ===
                        payment.id;

                      return (
                        <tr
                          key={payment.id}
                          className="transition hover:bg-brand-cream/40"
                        >

                          {/* APPLICATION */}

                          <td className="px-5 py-5">

                            <p className="text-sm font-bold text-brand-green">
                              {payment.application_number}
                            </p>

                            <Link
                              href={`/admin/dashboard/applications/${payment.id}`}
                              className="mt-1 inline-block text-xs font-semibold text-slate-400 hover:text-brand-green"
                            >
                              View application
                            </Link>

                          </td>

                          {/* APPLICANT */}

                          <td className="px-5 py-5">

                            <p className="text-sm font-semibold text-brand-dark">
                              {getApplicantName(
                                payment
                              )}
                            </p>

                          </td>

                          {/* COURSE */}

                          <td className="px-5 py-5">

                            <p className="max-w-[220px] text-sm font-medium text-slate-700">
                              {payment.course}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {payment.intake}
                            </p>

                          </td>

                          {/* PHONE */}

                          <td className="px-5 py-5">

                            <p className="text-sm font-semibold text-slate-700">
                              {payment.mpesa_phone ||
                                '—'}
                            </p>

                          </td>

                          {/* TRANSACTION CODE */}

                          <td className="px-5 py-5">

                            {payment.mpesa_transaction_code ? (
                              <div className="inline-flex rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-4 py-2">

                                <span className="font-mono text-sm font-extrabold tracking-wider text-brand-dark">
                                  {
                                    payment.mpesa_transaction_code
                                  }
                                </span>

                              </div>
                            ) : (
                              <span className="text-sm text-red-500">
                                No code submitted
                              </span>
                            )}

                          </td>

                          {/* AMOUNT */}

                          <td className="px-5 py-5">

                            <p className="text-sm font-bold text-brand-dark">
                              {formatCurrency(
                                payment.application_fee
                              )}
                            </p>

                          </td>

                          {/* DATE */}

                          <td className="px-5 py-5">

                            <p className="text-sm text-slate-500">
                              {formatDate(
                                payment.payment_submitted_at ||
                                  payment.created_at
                              )}
                            </p>

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-5 text-right">

                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                disabled={
                                  processing ||
                                  !payment.mpesa_transaction_code
                                }
                                onClick={() =>
                                  approvePayment(
                                    payment
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                              >

                                {processing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}

                                Approve
                              </button>

                              <button
                                type="button"
                                disabled={
                                  processing ||
                                  !payment.mpesa_transaction_code
                                }
                                onClick={() =>
                                  rejectPayment(
                                    payment
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >

                                <XCircle className="h-3.5 w-3.5" />

                                Reject
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

