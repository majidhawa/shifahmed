
import Link from 'next/link';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import {
  BarChart3,
  Users,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  Clock3,
  FileText,
  ArrowRight,
  TrendingUp,
  MapPin,
  UserRound,
  Wallet,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

/* =========================================================
   TYPES
========================================================= */

type Summary = {
  total_applications: number;
  paid_applications: number;
  pending_payments: number;
  approved_applications: number;
  pending_applications: number;
  rejected_applications: number;
  total_collected: number;
};

type CourseReport = {
  course: string;
  total: number;
};

type IntakeReport = {
  intake: string;
  total: number;
};

type GenderReport = {
  gender: string;
  total: number;
};

type CountyReport = {
  county: string;
  total: number;
};

type RecentApplication = {
  id: number;
  application_number: string;
  student_name: string;
  course: string;
  intake: string;
  payment_status: string;
  application_status: string;
  created_at: string;
};

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (amount: number) => {
  return `KSh ${Number(amount || 0).toLocaleString('en-KE')}`;
};

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

const getPercentage = (
  value: number,
  total: number
) => {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
};

const getStatusClass = (status: string) => {
  const normalized = String(status || '')
    .trim()
    .toLowerCase();

  if (
    normalized === 'paid' ||
    normalized === 'approved' ||
    normalized === 'accepted'
  ) {
    return 'bg-green-50 text-brand-green';
  }

  if (
    normalized === 'rejected' ||
    normalized === 'declined'
  ) {
    return 'bg-red-50 text-red-600';
  }

  return 'bg-amber-50 text-amber-700';
};

/* =========================================================
   PAGE
========================================================= */

export default async function ReportsPage() {
  /* =======================================================
     ADMIN AUTHENTICATION
  ======================================================= */

  const admin = requireAdmin();

  if (!admin) {
    return null;
  }

  /* =======================================================
     SUMMARY
  ======================================================= */

  const summaryResult = await pool.query(`
    SELECT
      COUNT(*)::int AS total_applications,

      COUNT(*) FILTER (
        WHERE LOWER(TRIM(payment_status)) = 'paid'
      )::int AS paid_applications,

      COUNT(*) FILTER (
        WHERE LOWER(TRIM(payment_status)) <> 'paid'
           OR payment_status IS NULL
      )::int AS pending_payments,

      COUNT(*) FILTER (
        WHERE LOWER(TRIM(application_status))
          IN ('approved', 'accepted')
      )::int AS approved_applications,

      COUNT(*) FILTER (
        WHERE LOWER(TRIM(application_status))
          = 'pending'
      )::int AS pending_applications,

      COUNT(*) FILTER (
        WHERE LOWER(TRIM(application_status))
          IN ('rejected', 'declined')
      )::int AS rejected_applications,

      COALESCE(
        SUM(
          CASE
            WHEN LOWER(TRIM(payment_status)) = 'paid'
            THEN COALESCE(application_fee, 0)
            ELSE 0
          END
        ),
        0
      )::numeric AS total_collected

    FROM applications
  `);

  const summary: Summary =
    summaryResult.rows[0] || {
      total_applications: 0,
      paid_applications: 0,
      pending_payments: 0,
      approved_applications: 0,
      pending_applications: 0,
      rejected_applications: 0,
      total_collected: 0,
    };

  /* =======================================================
     APPLICATIONS BY COURSE
  ======================================================= */

  const courseResult = await pool.query(`
    SELECT
      COALESCE(NULLIF(TRIM(course), ''), 'Not specified')
        AS course,

      COUNT(*)::int AS total

    FROM applications

    GROUP BY course

    ORDER BY total DESC
  `);

  const courses: CourseReport[] =
    courseResult.rows;

  /* =======================================================
     APPLICATIONS BY INTAKE
  ======================================================= */

  const intakeResult = await pool.query(`
    SELECT
      COALESCE(NULLIF(TRIM(intake), ''), 'Not specified')
        AS intake,

      COUNT(*)::int AS total

    FROM applications

    GROUP BY intake

    ORDER BY total DESC
  `);

  const intakes: IntakeReport[] =
    intakeResult.rows;

  /* =======================================================
     APPLICATIONS BY GENDER
  ======================================================= */

  const genderResult = await pool.query(`
    SELECT
      COALESCE(NULLIF(TRIM(gender), ''), 'Not specified')
        AS gender,

      COUNT(*)::int AS total

    FROM applications

    GROUP BY gender

    ORDER BY total DESC
  `);

  const genders: GenderReport[] =
    genderResult.rows;

  /* =======================================================
     APPLICATIONS BY COUNTY
  ======================================================= */

  const countyResult = await pool.query(`
    SELECT
      COALESCE(NULLIF(TRIM(county), ''), 'Not specified')
        AS county,

      COUNT(*)::int AS total

    FROM applications

    GROUP BY county

    ORDER BY total DESC
  `);

  const counties: CountyReport[] =
    countyResult.rows;

  /* =======================================================
     RECENT APPLICATIONS
  ======================================================= */

  const recentResult = await pool.query(`
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
      payment_status,
      application_status,
      created_at

    FROM applications

    ORDER BY created_at DESC

    LIMIT 10
  `);

  const recentApplications: RecentApplication[] =
    recentResult.rows;

  /* =======================================================
     MAX VALUES FOR PROGRESS BARS
  ======================================================= */

  const maxCourseTotal = Math.max(
    ...courses.map((item) => Number(item.total)),
    1
  );

  const maxIntakeTotal = Math.max(
    ...intakes.map((item) => Number(item.total)),
    1
  );

  const maxGenderTotal = Math.max(
    ...genders.map((item) => Number(item.total)),
    1
  );

  const maxCountyTotal = Math.max(
    ...counties.map((item) => Number(item.total)),
    1
  );

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-screen bg-brand-cream">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
                Administration
              </p>

              <h1 className="mt-1 text-3xl font-bold text-brand-dark">
                Reports
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Monitor applications, admissions,
                payments and student trends.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                href="/admin/dashboard/applications"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-green px-4 py-3 text-sm font-semibold text-brand-green transition hover:bg-brand-cream"
              >
                Applications

                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/admin/dashboard/payments"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Payments

                <CreditCard className="h-4 w-4" />
              </Link>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL APPLICATIONS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Total Applications
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {summary.total_applications}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  All submitted applications
                </p>

              </div>

              <div className="rounded-xl bg-brand-cream p-3">
                <FileText className="h-7 w-7 text-brand-green" />
              </div>

            </div>

          </div>

          {/* PAID */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Paid Applications
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-green">
                  {summary.paid_applications}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {getPercentage(
                    summary.paid_applications,
                    summary.total_applications
                  )}
                  % of applications
                </p>

              </div>

              <div className="rounded-xl bg-green-50 p-3">
                <CheckCircle2 className="h-7 w-7 text-brand-green" />
              </div>

            </div>

          </div>

          {/* PENDING PAYMENT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Pending Payments
                </p>

                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {summary.pending_payments}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Awaiting application fee
                </p>

              </div>

              <div className="rounded-xl bg-amber-50 p-3">
                <Clock3 className="h-7 w-7 text-amber-600" />
              </div>

            </div>

          </div>

          {/* REVENUE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Total Collected
                </p>

                <p className="mt-2 text-2xl font-bold text-brand-green">
                  {formatCurrency(
                    Number(summary.total_collected)
                  )}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Verified application fees
                </p>

              </div>

              <div className="rounded-xl bg-brand-cream p-3">
                <Wallet className="h-7 w-7 text-brand-green" />
              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            APPLICATION STATUS
        ================================================= */}

        <div className="mt-8 grid gap-5 md:grid-cols-3">

          {/* APPROVED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-4">

              <div className="rounded-xl bg-green-50 p-3">
                <CheckCircle2 className="h-6 w-6 text-brand-green" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Approved
                </p>

                <p className="text-2xl font-bold text-brand-dark">
                  {summary.approved_applications}
                </p>
              </div>

            </div>

          </div>

          {/* PENDING */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-4">

              <div className="rounded-xl bg-amber-50 p-3">
                <Clock3 className="h-6 w-6 text-amber-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Pending Review
                </p>

                <p className="text-2xl font-bold text-brand-dark">
                  {summary.pending_applications}
                </p>
              </div>

            </div>

          </div>

          {/* REJECTED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-4">

              <div className="rounded-xl bg-red-50 p-3">
                <FileText className="h-6 w-6 text-red-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Rejected
                </p>

                <p className="text-2xl font-bold text-brand-dark">
                  {summary.rejected_applications}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            COURSE + INTAKE
        ================================================= */}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          {/* COURSES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-brand-cream p-3">
                <GraduationCap className="h-6 w-6 text-brand-green" />
              </div>

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  Applications by Course
                </h2>

                <p className="text-sm text-slate-500">
                  Course demand across all applications.
                </p>

              </div>

            </div>

            <div className="mt-6 space-y-5">

              {courses.length === 0 ? (

                <p className="text-sm text-slate-400">
                  No course data available.
                </p>

              ) : (

                courses.map((item) => {

                  const total =
                    Number(item.total);

                  const percentage =
                    getPercentage(
                      total,
                      summary.total_applications
                    );

                  return (
                    <div key={item.course}>

                      <div className="flex items-center justify-between gap-4">

                        <p className="text-sm font-medium text-slate-700">
                          {item.course}
                        </p>

                        <p className="text-sm font-bold text-brand-dark">
                          {total}
                        </p>

                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-brand-green"
                          style={{
                            width: `${Math.min(
                              100,
                              (total / maxCourseTotal) * 100
                            )}%`,
                          }}
                        />

                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {percentage}% of total applications
                      </p>

                    </div>
                  );
                })

              )}

            </div>

          </div>

          {/* INTAKES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-brand-cream p-3">
                <TrendingUp className="h-6 w-6 text-brand-green" />
              </div>

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  Applications by Intake
                </h2>

                <p className="text-sm text-slate-500">
                  Demand across upcoming intakes.
                </p>

              </div>

            </div>

            <div className="mt-6 space-y-5">

              {intakes.length === 0 ? (

                <p className="text-sm text-slate-400">
                  No intake data available.
                </p>

              ) : (

                intakes.map((item) => {

                  const total =
                    Number(item.total);

                  return (
                    <div key={item.intake}>

                      <div className="flex items-center justify-between gap-4">

                        <p className="text-sm font-medium text-slate-700">
                          {item.intake}
                        </p>

                        <p className="text-sm font-bold text-brand-dark">
                          {total}
                        </p>

                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-brand-gold"
                          style={{
                            width: `${Math.min(
                              100,
                              (total / maxIntakeTotal) * 100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                })

              )}

            </div>

          </div>

        </div>

        {/* =================================================
            GENDER + COUNTY
        ================================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* GENDER */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-purple-50 p-3">
                <UserRound className="h-6 w-6 text-purple-600" />
              </div>

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  Applicants by Gender
                </h2>

                <p className="text-sm text-slate-500">
                  Gender distribution of applicants.
                </p>

              </div>

            </div>

            <div className="mt-6 space-y-5">

              {genders.length === 0 ? (

                <p className="text-sm text-slate-400">
                  No gender data available.
                </p>

              ) : (

                genders.map((item) => {

                  const total =
                    Number(item.total);

                  return (
                    <div key={item.gender}>

                      <div className="flex items-center justify-between">

                        <p className="text-sm font-medium capitalize text-slate-700">
                          {item.gender}
                        </p>

                        <p className="text-sm font-bold text-brand-dark">
                          {total}
                        </p>

                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-purple-500"
                          style={{
                            width: `${Math.min(
                              100,
                              (total / maxGenderTotal) * 100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                })

              )}

            </div>

          </div>

          {/* COUNTY */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-blue-50 p-3">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  Applicants by County
                </h2>

                <p className="text-sm text-slate-500">
                  Geographic distribution of applicants.
                </p>

              </div>

            </div>

            <div className="mt-6 space-y-5">

              {counties.length === 0 ? (

                <p className="text-sm text-slate-400">
                  No county data available.
                </p>

              ) : (

                counties.slice(0, 10).map((item) => {

                  const total =
                    Number(item.total);

                  return (
                    <div key={item.county}>

                      <div className="flex items-center justify-between">

                        <p className="text-sm font-medium text-slate-700">
                          {item.county}
                        </p>

                        <p className="text-sm font-bold text-brand-dark">
                          {total}
                        </p>

                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${Math.min(
                              100,
                              (total / maxCountyTotal) * 100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                })

              )}

            </div>

          </div>

        </div>

        {/* =================================================
            RECENT APPLICATIONS
        ================================================= */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">

          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-lg font-bold text-brand-dark">
                Recent Applications
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                The latest applications submitted to SMTC.
              </p>

            </div>

            <Link
              href="/admin/dashboard/applications"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green hover:text-brand-dark"
            >
              View All

              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

          {recentApplications.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 text-lg font-semibold text-brand-dark">
                No applications yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Reports will populate automatically
                when applications are submitted.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead className="bg-brand-cream">

                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                    <th className="px-6 py-4">
                      Applicant
                    </th>

                    <th className="px-6 py-4">
                      Course
                    </th>

                    <th className="px-6 py-4">
                      Payment
                    </th>

                    <th className="px-6 py-4">
                      Status
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

                  {recentApplications.map(
                    (application) => (

                      <tr
                        key={application.id}
                        className="transition hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">

                          <p className="font-semibold text-brand-dark">
                            {application.student_name || '—'}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {application.application_number}
                          </p>

                        </td>

                        <td className="px-6 py-4">

                          <p className="text-sm text-slate-700">
                            {application.course || '—'}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {application.intake || '—'}
                          </p>

                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                              application.payment_status
                            )}`}
                          >
                            {application.payment_status || 'Pending'}
                          </span>

                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                              application.application_status
                            )}`}
                          >
                            {application.application_status || 'Pending'}
                          </span>

                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">

                          {formatDate(
                            application.created_at
                          )}

                        </td>

                        <td className="px-6 py-4 text-right">

                          <Link
                            href={`/admin/dashboard/applications/${encodeURIComponent(
                              application.application_number
                            )}`}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
                          >

                            View

                            <ArrowRight className="h-3.5 w-3.5" />

                          </Link>

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
            QUICK LINKS
        ================================================= */}

        <div className="mt-8">

          <h2 className="text-lg font-bold text-brand-dark">
            Quick Reports
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Link
              href="/admin/dashboard/applications"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-green"
            >

              <FileText className="h-6 w-6 text-brand-green" />

              <p className="mt-4 font-semibold text-brand-dark">
                Applications
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Review submitted applications.
              </p>

              <ArrowRight className="mt-4 h-4 w-4 text-brand-green transition group-hover:translate-x-1" />

            </Link>

            <Link
              href="/admin/dashboard/students"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-green"
            >

              <Users className="h-6 w-6 text-brand-green" />

              <p className="mt-4 font-semibold text-brand-dark">
                Students
              </p>

              <p className="mt-1 text-sm text-slate-500">
                View registered students.
              </p>

              <ArrowRight className="mt-4 h-4 w-4 text-brand-green transition group-hover:translate-x-1" />

            </Link>

            <Link
              href="/admin/dashboard/payments"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-green"
            >

              <CreditCard className="h-6 w-6 text-brand-green" />

              <p className="mt-4 font-semibold text-brand-dark">
                Payments
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Monitor application payments.
              </p>

              <ArrowRight className="mt-4 h-4 w-4 text-brand-green transition group-hover:translate-x-1" />

            </Link>

            <Link
              href="/admin/dashboard/receipts"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-green"
            >

              <Wallet className="h-6 w-6 text-brand-green" />

              <p className="mt-4 font-semibold text-brand-dark">
                Receipts
              </p>

              <p className="mt-1 text-sm text-slate-500">
                View official payment receipts.
              </p>

              <ArrowRight className="mt-4 h-4 w-4 text-brand-green transition group-hover:translate-x-1" />

            </Link>

          </div>

        </div>

      </main>

    </div>
  );
}

