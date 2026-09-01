'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Hash,
  BadgeCheck,
  RefreshCw,
  UserRound,
  ClipboardList,
  School,
  Clock3,
} from 'lucide-react';

type Student = {
  id: number | string;
  name: string;

  admission_number?: string | null;
  student_number?: string | null;
  application_number?: string | null;

  email?: string | null;
  phone?: string | null;

  course?: string | null;
  intake?: string | null;
  admission_date?: string | null;

  admission_status?: string | null;
  enrollment_status?: string | null;

  enrolled_at?: string | null;
  year_of_study?: number | string | null;

  application_id?: number | string | null;
  enrollment_id?: number | string | null;

  program?: {
    id?: number | string | null;
    name?: string | null;
    code?: string | null;
    level?: string | null;
  };
};

export default function LecturerStudentDetailsPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* =====================================================
     LOAD STUDENT
  ===================================================== */

  const loadStudent = async () => {
    try {
      setLoading(true);
      setError('');

      const pathParts = window.location.pathname.split('/');
      const studentId = pathParts[pathParts.length - 1];

      if (!studentId) {
        throw new Error('Student ID is missing.');
      }

      const response = await fetch(
        `/api/lecturer/students/${studentId}`,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to load student (${response.status})`
        );
      }

      setStudent(data.student || null);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load student details.'
      );

      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudent();
  }, []);

  /* =====================================================
     DATE FORMATTER
  ===================================================== */

  const formatDate = (value?: string | null) => {
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
  };

  /* =====================================================
     STATUS
  ===================================================== */

  const getStatusClasses = (
    status?: string | null
  ) => {
    const normalized = (status || '').toLowerCase();

    if (
      normalized === 'active' ||
      normalized === 'approved' ||
      normalized === 'enrolled'
    ) {
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200';
    }

    if (
      normalized === 'inactive' ||
      normalized === 'rejected' ||
      normalized === 'suspended'
    ) {
      return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200';
    }

    return 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200';
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
        <div className="mx-auto flex min-h-[600px] max-w-7xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10">
              <RefreshCw
                size={28}
                className="animate-spin text-brand-green"
              />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Loading student profile...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Please wait while we retrieve the student information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">

          <Link
            href="/lecturer/dashboard/students"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-brand-green"
          >
            <ArrowLeft size={17} />
            Back to My Students
          </Link>

          <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
            <div className="border-b border-red-100 bg-red-50 px-6 py-5">
              <h2 className="font-bold text-red-800">
                Unable to load student
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error ||
                  'The requested student could not be found.'}
              </p>
            </div>

            <div className="p-6">
              <button
                type="button"
                onClick={loadStudent}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const initial =
    student.name?.charAt(0).toUpperCase() || 'S';

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =================================================
            BACK NAVIGATION
        ================================================= */}

        <div className="flex items-center justify-between">
          <Link
            href="/lecturer/dashboard/students"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-brand-green hover:shadow-sm"
          >
            <ArrowLeft size={17} />
            Back to My Students
          </Link>

          <button
            type="button"
            onClick={loadStudent}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-brand-green/20 hover:bg-brand-green/5 hover:text-brand-green"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* =================================================
            PROFILE HEADER
        ================================================= */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* Brand Header */}
          <div className="relative overflow-hidden bg-brand-green px-6 py-8 md:px-8 md:py-10">

            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-5">

                {/* Avatar */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white/30 bg-white text-3xl font-bold text-brand-green shadow-lg md:h-24 md:w-24">
                  {initial}
                </div>

                <div className="min-w-0">

                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    Student Profile
                  </p>

                  <h1 className="truncate text-2xl font-bold text-white md:text-3xl">
                    {student.name}
                  </h1>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/85">

                    <span className="inline-flex items-center gap-1.5">
                      <Hash size={14} />
                      {student.admission_number ||
                        student.student_number ||
                        'No admission number'}
                    </span>

                    {student.program?.name && (
                      <>
                        <span className="text-white/40">
                          •
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen size={14} />
                          {student.program.name}
                        </span>
                      </>
                    )}

                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-wrap gap-2">

                {student.admission_status && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-bold text-white ring-1 ring-inset ring-white/20 backdrop-blur">
                    <BadgeCheck size={15} />
                    {student.admission_status}
                  </span>
                )}

                {student.enrollment_status && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold capitalize text-brand-green shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-brand-green" />
                    {student.enrollment_status}
                  </span>
                )}

              </div>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

            <QuickStat
              icon={<GraduationCap size={19} />}
              label="Program"
              value={
                student.program?.name ||
                student.course ||
                '—'
              }
            />

            <QuickStat
              icon={<School size={19} />}
              label="Level"
              value={
                student.program?.level || '—'
              }
            />

            <QuickStat
              icon={<CalendarDays size={19} />}
              label="Intake"
              value={student.intake || '—'}
            />

          </div>
        </div>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">

            <SectionHeader
              icon={<UserRound size={19} />}
              title="Personal Information"
              description="Basic student identification and contact details."
            />

            <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">

              <InfoItem
                icon={<User size={17} />}
                label="Full Name"
                value={student.name}
              />

              <InfoItem
                icon={<Hash size={17} />}
                label="Admission Number"
                value={student.admission_number}
              />

              <InfoItem
                icon={<Hash size={17} />}
                label="Student Number"
                value={student.student_number}
              />

              <InfoItem
                icon={<ClipboardList size={17} />}
                label="Application Number"
                value={student.application_number}
              />

              <InfoItem
                icon={<Mail size={17} />}
                label="Email Address"
                value={student.email}
                emptyText="No email available"
              />

              <InfoItem
                icon={<Phone size={17} />}
                label="Phone Number"
                value={student.phone}
                emptyText="No phone number available"
              />

            </div>
          </section>

          {/* =================================================
              PROGRAM CARD
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <SectionHeader
              icon={<BookOpen size={19} />}
              title="Program"
              description="Current academic program."
            />

            <div className="space-y-5 p-6">

              <ProgramItem
                label="Program Name"
                value={
                  student.program?.name ||
                  student.course
                }
                highlight
              />

              <ProgramItem
                label="Program Code"
                value={student.program?.code}
              />

              <ProgramItem
                label="Level"
                value={student.program?.level}
              />

            </div>
          </section>

          {/* =================================================
              ACADEMIC INFORMATION
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">

            <SectionHeader
              icon={<GraduationCap size={19} />}
              title="Academic Information"
              description="Enrollment and academic details."
            />

            <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">

              <InfoItem
                icon={<BookOpen size={17} />}
                label="Course"
                value={
                  student.course ||
                  student.program?.name
                }
              />

              <InfoItem
                icon={<GraduationCap size={17} />}
                label="Year of Study"
                value={
                  student.year_of_study
                    ? `Year ${student.year_of_study}`
                    : null
                }
              />

              <InfoItem
                icon={<CalendarDays size={17} />}
                label="Intake"
                value={student.intake}
              />

              <InfoItem
                icon={<CalendarDays size={17} />}
                label="Admission Date"
                value={formatDate(student.admission_date)}
              />

              <InfoItem
                icon={<Clock3 size={17} />}
                label="Enrollment Date"
                value={formatDate(student.enrolled_at)}
              />

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Enrollment Status
                </p>

                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold capitalize ${getStatusClasses(
                    student.enrollment_status
                  )}`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {student.enrollment_status || '—'}
                </span>
              </div>

            </div>
          </section>

          {/* =================================================
              ENROLLMENT SUMMARY
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <SectionHeader
              icon={<ClipboardList size={19} />}
              title="Enrollment Summary"
              description="System enrollment information."
            />

            <div className="p-6">

              <div className="divide-y divide-slate-100">

                <SummaryRow
                  label="Enrollment ID"
                  value={
                    student.enrollment_id
                      ? String(student.enrollment_id)
                      : '—'
                  }
                />

                <SummaryRow
                  label="Application ID"
                  value={
                    student.application_id
                      ? String(student.application_id)
                      : '—'
                  }
                />

                <SummaryRow
                  label="Admission Status"
                  value={
                    student.admission_status || '—'
                  }
                  badge
                />

                <SummaryRow
                  label="Enrollment Status"
                  value={
                    student.enrollment_status || '—'
                  }
                  badge
                />

              </div>

            </div>
          </section>

        </div>

        {/* =================================================
            FUTURE ACTION AREA
        ================================================= */}

        <div className="rounded-2xl border border-brand-green/15 bg-brand-green/5 p-5 md:p-6">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-3">

              <div className="rounded-xl bg-brand-green/10 p-2.5 text-brand-green">
                <GraduationCap size={21} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Academic Management
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Student academic performance, assignments,
                  quizzes and grades can be managed from the
                  lecturer portal.
                </p>
              </div>

            </div>

            <span className="inline-flex w-fit rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
              Academic tools coming next
            </span>

          </div>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   QUICK STAT
========================================================= */

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-4">

      <div className="rounded-xl bg-brand-green/10 p-2.5 text-brand-green">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-sm font-bold text-slate-800">
          {value}
        </p>
      </div>

    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">

      <div className="rounded-xl bg-brand-green/10 p-2.5 text-brand-green">
        {icon}
      </div>

      <div>
        <h2 className="font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-0.5 text-xs text-slate-500">
          {description}
        </p>
      </div>

    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  icon,
  label,
  value,
  emptyText = '—',
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
  emptyText?: string;
}) {
  const hasValue =
    value !== null &&
    value !== undefined &&
    String(value).trim() !== '';

  return (
    <div className="flex items-start gap-3">

      <div className="mt-0.5 rounded-lg bg-slate-50 p-2 text-brand-green">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p
          className={`mt-1 break-words text-sm font-semibold ${
            hasValue
              ? 'text-slate-800'
              : 'text-slate-400'
          }`}
        >
          {hasValue ? value : emptyText}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   PROGRAM ITEM
========================================================= */

function ProgramItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value?: string | null;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? 'rounded-xl bg-brand-green/5 p-4'
          : ''
      }
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 font-semibold ${
          highlight
            ? 'text-brand-green'
            : 'text-slate-800'
        }`}
      >
        {value || '—'}
      </p>
    </div>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      {badge ? (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-700">
          {value}
        </span>
      ) : (
        <span className="text-right text-sm font-bold text-slate-800">
          {value}
        </span>
      )}

    </div>
  );
}

