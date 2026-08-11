'use client';

import {
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock3,
  XCircle,
  Loader2,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

/* =========================================================
   TYPES
========================================================= */

type DashboardStatistics = {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  paidApplications: number;
  totalAmountReceived: number;
  totalAdmissions: number;
};

type RecentApplication = {
  id: number;
  applicationNumber: string;
  studentName: string;
  course: string;
  intake: string;
  applicationStatus: string;
  paymentStatus: string;
  applicationFee: number;
  createdAt: string;
};

type DashboardData = {
  statistics: DashboardStatistics;
  recentApplications: RecentApplication[];
};

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value: string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === 'Approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approved
      </span>
    );
  }

  if (status === 'Rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
      <Clock3 className="h-3.5 w-3.5" />
      Pending
    </span>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminDashboardPage() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = useCallback(
    async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          '/api/admin/dashboard',
          {
            cache: 'no-store',
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              'Unable to load dashboard.'
          );
        }

        setData(result);

      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load dashboard.'
        );

      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-brand-green" />

          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !data) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center">

          <XCircle className="mx-auto h-10 w-10 text-red-500" />

          <h1 className="mt-4 text-xl font-bold text-red-800">
            Unable to load dashboard
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error ||
              'Dashboard data could not be loaded.'}
          </p>

          <button
            type="button"
            onClick={loadDashboard}
            className="mt-6 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white hover:bg-brand-dark"
          >
            Try Again
          </button>

        </div>
      </div>
    );
  }

  const {
    totalApplications,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    paidApplications,
    totalAmountReceived,
    totalAdmissions,
  } = data.statistics;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* =================================================
            PAGE HEADER
        ================================================== */}

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-brand-dark sm:text-3xl">
            Dashboard Overview
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor applications, admissions, payments and
            student activity from one central location.
          </p>

        </div>

        {/* =================================================
            STATISTICS
        ================================================== */}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {/* Applications */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Total Applications
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {totalApplications}
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">

                <ClipboardList className="h-6 w-6 text-brand-green" />

              </div>

            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">

              <TrendingUp className="h-4 w-4 text-brand-gold" />

              {pendingApplications} awaiting review

            </div>

          </div>

          {/* Payments */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Payments Received
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {formatCurrency(
                    totalAmountReceived
                  )}
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/15">

                <CreditCard className="h-6 w-6 text-brand-gold" />

              </div>

            </div>

            <div className="mt-5 text-xs text-slate-400">

              {paidApplications} paid application
              {paidApplications === 1 ? '' : 's'}

            </div>

          </div>

          {/* Admissions */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Admissions
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {totalAdmissions}
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">

                <GraduationCap className="h-6 w-6 text-brand-green" />

              </div>

            </div>

            <div className="mt-5 text-xs text-slate-400">

              {approvedApplications} approved application
              {approvedApplications === 1 ? '' : 's'}

            </div>

          </div>

          {/* Receipts */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Paid Applications
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {paidApplications}
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/15">

                <FileText className="h-6 w-6 text-brand-gold" />

              </div>

            </div>

            <div className="mt-5 text-xs text-slate-400">

              Application fees confirmed

            </div>

          </div>

        </div>

        {/* =================================================
            APPLICATION SUMMARY
        ================================================== */}

        <div className="mt-8 grid gap-5 sm:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Pending
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-600">
              {pendingApplications}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Applications awaiting review
            </p>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Approved
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {approvedApplications}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Applications approved
            </p>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Rejected
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {rejectedApplications}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Applications rejected
            </p>

          </div>

        </div>

        {/* =================================================
            RECENT APPLICATIONS
        ================================================== */}

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-lg font-bold text-brand-dark">
                Recent Applications
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest applications submitted through
                the college website.
              </p>

            </div>

            <Link
              href="/admin/dashboard/applications"
              className="text-sm font-bold text-brand-green transition hover:text-brand-gold"
            >
              View all
            </Link>

          </div>

          {data.recentApplications.length === 0 ? (

            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">

              <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-500">
                No applications found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Applications will appear here once
                students submit them.
              </p>

            </div>

          ) : (

            <div className="mt-6 overflow-x-auto">

              <table className="w-full min-w-[850px]">

                <thead>

                  <tr className="border-b border-slate-100 text-left">

                    <th className="pb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Application
                    </th>

                    <th className="pb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Student
                    </th>

                    <th className="pb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Course
                    </th>

                    <th className="pb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Intake
                    </th>

                    <th className="pb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Status
                    </th>

                    <th className="pb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Payment
                    </th>

                    <th className="pb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Date
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {data.recentApplications.map(
                    (application) => (

                      <tr
                        key={application.id}
                        className="border-b border-slate-50 last:border-0"
                      >

                        <td className="py-4">

                          <Link
                            href={`/admin/dashboard/applications/${application.id}`}
                            className="font-bold text-brand-green hover:text-brand-dark"
                          >
                            {application.applicationNumber}
                          </Link>

                        </td>

                        <td className="py-4">

                          <p className="text-sm font-semibold text-brand-dark">
                            {application.studentName}
                          </p>

                        </td>

                        <td className="py-4">

                          <p className="text-sm text-slate-600">
                            {application.course ||
                              '—'}
                          </p>

                        </td>

                        <td className="py-4">

                          <p className="text-sm text-slate-600">
                            {application.intake ||
                              '—'}
                          </p>

                        </td>

                        <td className="py-4">

                          <StatusBadge
                            status={
                              application.applicationStatus
                            }
                          />

                        </td>

                        <td className="py-4">

                          <span
                            className={
                              application.paymentStatus ===
                              'Paid'
                                ? 'text-sm font-bold text-green-600'
                                : 'text-sm font-medium text-slate-400'
                            }
                          >
                            {
                              application.paymentStatus
                            }
                          </span>

                        </td>

                        <td className="py-4">

                          <p className="text-sm text-slate-500">
                            {formatDate(
                              application.createdAt
                            )}
                          </p>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* =================================================
            QUICK ACTIONS
        ================================================== */}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft lg:col-span-2">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/10">

                <ClipboardList className="h-5 w-5 text-brand-green" />

              </div>

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  Application Management
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review, approve or reject submitted
                  applications.
                </p>

              </div>

            </div>

            <div className="mt-5 flex flex-wrap gap-3">

              <Link
                href="/admin/dashboard/applications"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                <ClipboardList className="h-4 w-4" />
                Review Applications
              </Link>

              <Link
                href="/admin/dashboard/payments"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
              >
                <CreditCard className="h-4 w-4" />
                Check Payments
              </Link>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gold/15">

                <Users className="h-5 w-5 text-brand-gold" />

              </div>

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  Admissions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {totalAdmissions} admission
                  {totalAdmissions === 1
                    ? ''
                    : 's'} created
                </p>

              </div>

            </div>

            <Link
              href="/admin/dashboard/students"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-green hover:text-brand-gold"
            >
              <GraduationCap className="h-4 w-4" />
              Student Records
            </Link>

          </div>

        </div>

        {/* =================================================
            WELCOME PANEL
        ================================================== */}

        <div className="mt-8 overflow-hidden rounded-3xl bg-brand-green shadow-soft">

          <div className="relative p-7 sm:p-8">

            <div className="relative z-10 max-w-2xl">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
                SMTC Administration
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white">
                Health through innovation and research
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/70">
                Your central administration portal for
                managing admissions, applications, payments,
                receipts and student records.
              </p>

            </div>

            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[40px] border-brand-gold/10" />

            <div className="pointer-events-none absolute -bottom-28 right-20 h-56 w-56 rounded-full border-[30px] border-white/5" />

          </div>

        </div>

      </div>

    </div>
  );
}