import Link from 'next/link';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import {
  Users,
  UserCheck,
  Clock3,
  Search,
  Eye,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

/* =========================================================
   TYPES
========================================================= */

type StudentRecord = {
  id: number;
  application_number: string;
  student_name: string;
  email: string;
  mobile: string;
  course: string;
  intake: string;
  payment_status: string;
  application_status: string;
  created_at: string;
};

/* =========================================================
   PAGE
========================================================= */

export default async function StudentsPage() {
  /* =======================================================
     ADMIN AUTHENTICATION
  ======================================================= */

  const admin = requireAdmin();

  if (!admin) {
    return null;
  }

  /* =======================================================
     GET STUDENTS / APPLICANTS
  ======================================================= */

  const result = await pool.query(`
    SELECT
      id,
      application_number,

      CONCAT_WS(
        ' ',
        first_name,
        middle_name,
        surname
      ) AS student_name,

      email,
      mobile,
      course,
      intake,
      payment_status,
      application_status,
      created_at

    FROM applications

    ORDER BY created_at DESC
  `);

  const students: StudentRecord[] = result.rows;

  /* =======================================================
     HELPERS
  ======================================================= */

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

  const getStatusClass = (status: string) => {
    const normalized = String(status || '')
      .trim()
      .toLowerCase();

    if (
      normalized === 'accepted' ||
      normalized === 'approved'
    ) {
      return 'bg-green-50 text-brand-green';
    }

    if (
      normalized === 'rejected' ||
      normalized === 'declined'
    ) {
      return 'bg-red-50 text-red-700';
    }

    return 'bg-amber-50 text-amber-700';
  };

  const getPaymentClass = (status: string) => {
    const normalized = String(status || '')
      .trim()
      .toLowerCase();

    if (normalized === 'paid') {
      return 'bg-green-50 text-brand-green';
    }

    return 'bg-amber-50 text-amber-700';
  };

  /* =======================================================
     SUMMARY COUNTS
  ======================================================= */

  const totalStudents = students.length;

  const paidStudents = students.filter(
    (student) =>
      String(student.payment_status)
        .trim()
        .toLowerCase() === 'paid'
  ).length;

  const pendingStudents = students.filter(
    (student) =>
      String(student.application_status)
        .trim()
        .toLowerCase() === 'pending'
  ).length;

  const acceptedStudents = students.filter(
    (student) =>
      ['accepted', 'approved'].includes(
        String(student.application_status)
          .trim()
          .toLowerCase()
      )
  ).length;

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div>
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
                Admissions
              </p>

              <h1 className="mt-1 text-3xl font-bold text-brand-dark">
                Students
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                View and manage students who have
                submitted applications to Shifah Medical
                Training College.
              </p>
            </div>

            <Link
              href="/admin/dashboard/applications"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-green px-5 py-3 text-sm font-semibold text-brand-green transition hover:bg-brand-cream"
            >
              Applications

              <ArrowRight className="h-4 w-4" />
            </Link>
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

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Applicants
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {totalStudents}
                </p>
              </div>

              <div className="rounded-xl bg-brand-cream p-3">
                <Users className="h-7 w-7 text-brand-green" />
              </div>
            </div>
          </div>

          {/* PAID */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Paid Applicants
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-green">
                  {paidStudents}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3">
                <UserCheck className="h-7 w-7 text-brand-green" />
              </div>
            </div>
          </div>

          {/* PENDING */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Review
                </p>

                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {pendingStudents}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3">
                <Clock3 className="h-7 w-7 text-amber-600" />
              </div>
            </div>
          </div>

          {/* ACCEPTED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Accepted
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-green">
                  {acceptedStudents}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3">
                <GraduationCap className="h-7 w-7 text-brand-green" />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            STUDENTS TABLE
        ================================================= */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">

          {/* TABLE HEADER */}

          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h2 className="text-lg font-bold text-brand-dark">
                  Student Applications
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Applicants registered through the
                  college application system.
                </p>
              </div>

              <div className="relative w-full lg:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search students..."
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
                    Applicant
                  </th>

                  <th className="px-6 py-4">
                    Course
                  </th>

                  <th className="px-6 py-4">
                    Intake
                  </th>

                  <th className="px-6 py-4">
                    Payment
                  </th>

                  <th className="px-6 py-4">
                    Application
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

                {students.map((student) => (

                  <tr
                    key={student.id}
                    className="transition hover:bg-slate-50"
                  >

                    {/* APPLICANT */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cream">

                          <Users className="h-5 w-5 text-brand-green" />

                        </div>

                        <div>

                          <p className="font-semibold text-brand-dark">
                            {student.student_name || '—'}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {student.application_number}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* COURSE */}

                    <td className="max-w-[220px] px-6 py-4">

                      <p className="truncate text-sm text-slate-600">
                        {student.course || '—'}
                      </p>

                    </td>

                    {/* INTAKE */}

                    <td className="px-6 py-4">

                      <p className="text-sm text-slate-600">
                        {student.intake || '—'}
                      </p>

                    </td>

                    {/* PAYMENT */}

                    <td className="px-6 py-4">

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentClass(
                          student.payment_status
                        )}`}
                      >
                        {student.payment_status || 'Pending'}
                      </span>

                    </td>

                    {/* APPLICATION STATUS */}

                    <td className="px-6 py-4">

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          student.application_status
                        )}`}
                      >
                        {student.application_status || 'Pending'}
                      </span>

                    </td>

                    {/* DATE */}

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {formatDate(student.created_at)}
                    </td>

                    {/* ACTION */}

                    <td className="px-6 py-4 text-right">

                      {/* IMPORTANT:
                          Use numeric database ID here,
                          NOT application_number.
                      */}

                      <Link
                        href={`/admin/dashboard/applications/${student.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
                      >

                        <Eye className="h-3.5 w-3.5" />

                        View

                      </Link>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {students.length === 0 && (

            <div className="px-6 py-16 text-center">

              <Users className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 text-lg font-semibold text-brand-dark">
                No students yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Student applications will appear here
                after applicants submit the application
                form.
              </p>

            </div>

          )}

          {/* =================================================
              MOBILE
          ================================================= */}

          {students.length > 0 && (

            <div className="divide-y divide-slate-100 md:hidden">

              {students.map((student) => (

                <div
                  key={student.id}
                  className="p-5"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-cream">

                        <Users className="h-5 w-5 text-brand-green" />

                      </div>

                      <div>

                        <p className="font-semibold text-brand-dark">
                          {student.student_name || '—'}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {student.application_number}
                        </p>

                      </div>

                    </div>

                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentClass(
                        student.payment_status
                      )}`}
                    >
                      {student.payment_status || 'Pending'}
                    </span>

                  </div>

                  <div className="mt-5 space-y-3">

                    <div>

                      <p className="text-xs text-slate-400">
                        Course
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {student.course || '—'}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs text-slate-400">
                        Intake
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {student.intake || '—'}
                      </p>

                    </div>

                    <div className="grid grid-cols-2 gap-4">

                      <div>

                        <p className="text-xs text-slate-400">
                          Application
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                            student.application_status
                          )}`}
                        >
                          {student.application_status || 'Pending'}
                        </span>

                      </div>

                      <div>

                        <p className="text-xs text-slate-400">
                          Submitted
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {formatDate(student.created_at)}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* IMPORTANT:
                      Use student.id here too.
                  */}

                  <Link
                    href={`/admin/dashboard/applications/${student.id}`}
                    className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
                  >

                    <Eye className="h-4 w-4" />

                    View Student

                  </Link>

                </div>

              ))}

            </div>

          )}

        </div>

      </main>
    </div>
  );
}