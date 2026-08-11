
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Application = {
  id: number;
  application_number: string;

  surname: string;
  middle_name: string;
  first_name: string;

  date_of_birth: string;
  gender: string;
  nationality: string;
  country: string;
  id_passport_number: string;
  marital_status: string;

  postal_address: string;
  postal_code: string;
  town: string;
  county: string;
  mobile: string;
  email: string;

  kcse_index: string;
  kcse_year: string;
  kcse_mean_grade: string;
  english_grade: string;
  kiswahili_grade: string;
  biology_grade: string;
  chemistry_grade: string;
  physics_grade: string;
  mathematics_grade: string;
  previous_institution: string;
  highest_qualification: string;

  course: string;
  intake: string;

  sponsor_type: string;
  sponsor_name: string;
  sponsor_relationship: string;
  sponsor_mobile: string;
  sponsor_email: string;

  guardian_name: string;
  guardian_relationship: string;
  guardian_mobile: string;
  guardian_email: string;

  id_document: string | null;
  kcse_certificate: string | null;
  passport_photo: string | null;

  declaration: boolean;

  application_fee: number;

  /*
   * IMPORTANT:
   * Database values are expected to be lowercase:
   *
   * unpaid
   * payment_pending
   * awaiting_approval
   * paid
   */
  payment_status: string;

  /*
   * Database values:
   *
   * Pending
   * Approved
   * Rejected
   */
  application_status: string;

  created_at: string;
};

type Statistics = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  paid: number;
  unpaid: number;
};

/* =========================================================
   HELPERS
========================================================= */

function normalizePaymentStatus(
  status: unknown
): string {
  return String(status || '')
    .trim()
    .toLowerCase();
}

function normalizeApplicationStatus(
  status: unknown
): string {
  return String(status || '')
    .trim()
    .toLowerCase();
}

function getApplicantName(
  application: Application
) {
  return [
    application.first_name,
    application.middle_name,
    application.surname,
  ]
    .filter(Boolean)
    .join(' ');
}

function formatDate(date: string) {
  if (!date) return '—';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return '—';
  }

  return parsedDate.toLocaleDateString(
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
   APPLICATION STATUS BADGE
========================================================= */

function ApplicationStatus({
  status,
}: {
  status: string;
}) {
  const normalized =
    normalizeApplicationStatus(status);

  if (normalized === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approved
      </span>
    );
  }

  if (normalized === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pending
    </span>
  );
}

/* =========================================================
   PAYMENT STATUS BADGE
========================================================= */

function PaymentStatus({
  status,
}: {
  status: string;
}) {
  const normalized =
    normalizePaymentStatus(status);

  /*
   * PAID
   */
  if (normalized === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Paid
      </span>
    );
  }

  /*
   * AWAITING ADMIN APPROVAL
   */
  if (
    normalized === 'awaiting_approval'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Awaiting Approval
      </span>
    );
  }

  /*
   * PAYMENT PENDING
   */
  if (
    normalized === 'payment_pending'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
        <CreditCard className="h-3.5 w-3.5" />
        Payment Pending
      </span>
    );
  }

  /*
   * UNPAID / UNKNOWN
   */
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
      Unpaid
    </span>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ApplicationsPage() {
  const [applications, setApplications] =
    useState<Application[]>([]);

  const [statistics, setStatistics] =
    useState<Statistics>({
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      paid: 0,
      unpaid: 0,
    });

  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /* =======================================================
     LOAD APPLICATIONS
  ======================================================= */

  const loadApplications = useCallback(
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

        if (course) {
          params.set(
            'course',
            course
          );
        }

        if (status) {
          params.set(
            'status',
            status
          );
        }

        if (paymentStatus) {
          params.set(
            'paymentStatus',
            paymentStatus
          );
        }

        const response =
          await fetch(
            `/api/admin/applications?${params.toString()}`,
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
              'Unable to load applications.'
          );
        }

        setApplications(
          data.applications || []
        );

        setStatistics({
          total:
            Number(
              data.statistics?.total
            ) || 0,

          pending:
            Number(
              data.statistics?.pending
            ) || 0,

          approved:
            Number(
              data.statistics?.approved
            ) || 0,

          rejected:
            Number(
              data.statistics?.rejected
            ) || 0,

          paid:
            Number(
              data.statistics?.paid
            ) || 0,

          unpaid:
            Number(
              data.statistics?.unpaid
            ) || 0,
        });
      } catch (err) {
        console.error(
          'LOAD APPLICATIONS ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load applications.'
        );
      } finally {
        setLoading(false);
      }
    },
    [
      search,
      course,
      status,
      paymentStatus,
    ]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  /* =======================================================
     COURSE LIST
  ======================================================= */

  const courses = useMemo(
    () => [
      'EMT',
      'Diploma in Paramedicine',
      'Safe Phlebotomy',
      'German Language',
      'Caregiving Level 4',
      'Dialysis Technology',
    ],
    []
  );

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  function clearFilters() {
    setSearch('');
    setCourse('');
    setStatus('');
    setPaymentStatus('');
  }

  const hasFilters =
    Boolean(
      search ||
      course ||
      status ||
      paymentStatus
    );

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
              Admissions
            </p>

            <h1 className="mt-1 text-2xl font-bold text-brand-dark sm:text-3xl">
              Applications
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review and manage applications submitted
              through the Shifah Medical Training College
              website.
            </p>
          </div>

          <button
            type="button"
            onClick={loadApplications}
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
            STATISTICS
        ================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Applications
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {statistics.total}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <ClipboardList className="h-5 w-5 text-brand-green" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Review
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {statistics.pending}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50">
                <ClipboardList className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Approved
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {statistics.approved}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Application Fees Paid
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {statistics.paid}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gold/15">
                <CreditCard className="h-5 w-5 text-brand-gold" />
              </div>
            </div>
          </div>

        </div>

        {/* =================================================
            FILTERS
        ================================================== */}

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="grid gap-4 lg:grid-cols-12">

            <div className="lg:col-span-5">
              <label
                htmlFor="application-search"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Search
              </label>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="application-search"
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Application number, name, phone or email..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <label
                htmlFor="course-filter"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Course
              </label>

              <select
                id="course-filter"
                value={course}
                onChange={(event) =>
                  setCourse(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
              >
                <option value="">
                  All Courses
                </option>

                {courses.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="status-filter"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
              >
                <option value="">
                  All Statuses
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="Approved">
                  Approved
                </option>

                <option value="Rejected">
                  Rejected
                </option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="payment-filter"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Payment
              </label>

              <select
                id="payment-filter"
                value={paymentStatus}
                onChange={(event) =>
                  setPaymentStatus(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
              >
                <option value="">
                  All
                </option>

                <option value="paid">
                  Paid
                </option>

                <option value="awaiting_approval">
                  Awaiting Approval
                </option>

                <option value="payment_pending">
                  Payment Pending
                </option>

                <option value="unpaid">
                  Unpaid
                </option>
              </select>
            </div>

          </div>

          {hasFilters && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-slate-500 transition hover:text-brand-green"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            APPLICATIONS TABLE
        ================================================== */}

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-bold text-brand-dark">
                Submitted Applications
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {applications.length}{' '}
                application
                {applications.length === 1
                  ? ''
                  : 's'} displayed
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-green" />

                <p className="mt-3 text-sm font-medium text-slate-500">
                  Loading applications...
                </p>
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center px-6">
              <div className="text-center">
                <ClipboardList className="mx-auto h-12 w-12 text-slate-200" />

                <h3 className="mt-4 text-sm font-bold text-brand-dark">
                  No applications found
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                  No applications match your current
                  search or filters.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full">

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
                      Payment
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
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

                  {applications.map(
                    (application) => {

                      const normalizedPayment =
                        normalizePaymentStatus(
                          application.payment_status
                        );

                      const isPaid =
                        normalizedPayment ===
                        'paid';

                      return (
                        <tr
                          key={application.id}
                          className="transition hover:bg-brand-cream/40"
                        >

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-brand-green">
                              {
                                application.application_number
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              ID #{application.id}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-brand-dark">
                              {getApplicantName(
                                application
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {application.mobile}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {application.email}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-[220px] text-sm font-medium text-slate-700">
                              {application.course}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {application.intake}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <PaymentStatus
                              status={
                                application.payment_status
                              }
                            />

                            <p className="mt-2 text-xs text-slate-400">
                              {formatCurrency(
                                application.application_fee
                              )}
                            </p>

                            {isPaid && (
                              <p className="mt-1 text-xs font-semibold text-green-600">
                                Payment confirmed
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <ApplicationStatus
                              status={
                                application.application_status
                              }
                            />
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(
                              application.created_at
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/admin/dashboard/applications/${application.id}`}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-brand-green transition hover:border-brand-green/30 hover:bg-brand-green/5"
                            >
                              View

                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
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

