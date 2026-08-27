import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';

import pool from '@/lib/db';

import {
  getParentSession,
} from '@/lib/parent-auth';

import {
  LayoutDashboard,
  UserRound,
  GraduationCap,
  CreditCard,
  FileText,
  CalendarDays,
  Phone,
  LogOut,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  BookOpen,
  ChevronRight,
  Users,
} from 'lucide-react';

/* =========================================================
   PARENT DASHBOARD
   Shifah Medical Training College

   DATABASE STRUCTURE

   users
      ↓
   parent_students
      ↓
   applications
      ↓
   admissions

   Parent session:
      parentId
      email
      issuedAt
========================================================= */

/* =========================================================
   TYPES
========================================================= */

type StudentRecord = {
  id: number;
  application_number: string | null;

  surname: string | null;
  middle_name: string | null;
  first_name: string | null;

  mobile: string | null;
  email: string | null;

  course: string | null;
  intake: string | null;

  application_fee: string | number | null;
  payment_status: string | null;
  application_status: string | null;

  guardian_name: string | null;
  guardian_relationship: string | null;
  guardian_mobile: string | null;
  guardian_email: string | null;

  sponsor_type: string | null;
  sponsor_name: string | null;
  sponsor_relationship: string | null;
  sponsor_mobile: string | null;
  sponsor_email: string | null;

  created_at: string | null;

  relationship: string | null;
  is_primary: boolean | null;

  admission_id: number | null;
  admission_number: string | null;
  admission_status: string | null;
  admission_date: string | null;
};

type ParentRecord = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
};

/* =========================================================
   PARENT DASHBOARD PAGE
========================================================= */

export default async function ParentDashboardPage() {
  /* =======================================================
     CHECK SESSION
  ======================================================= */

  const session = await getParentSession();

  if (!session) {
    redirect('/parent/login');
  }

  /* =======================================================
     GET PARENT ACCOUNT

     IMPORTANT:
     Actual users table has:

       id
       name
       email
       phone
       password_hash
       role
       active
       created_at
       updated_at

     It does NOT have:
       first_name
       middle_name
       last_name
       status
  ======================================================= */

  const parentResult = await pool.query<ParentRecord>(
    `
      SELECT
        id,
        name,
        email,
        phone
      FROM users
      WHERE
        id = $1
        AND role = 'parent'
        AND active = TRUE
      LIMIT 1
    `,
    [session.parentId]
  );

  if (parentResult.rows.length === 0) {
    redirect('/parent/login');
  }

  const parent = parentResult.rows[0];

  /* =======================================================
     GET LINKED STUDENT

     The relationship is:

       users.id
            ↓
       parent_students.parent_id

       parent_students.application_id
            ↓
       applications.id
  ======================================================= */

  const studentResult =
    await pool.query<StudentRecord>(
      `
        SELECT
          a.id,
          a.application_number,

          a.surname,
          a.middle_name,
          a.first_name,

          a.mobile,
          a.email,

          a.course,
          a.intake,

          a.application_fee,
          a.payment_status,
          a.application_status,

          a.guardian_name,
          a.guardian_relationship,
          a.guardian_mobile,
          a.guardian_email,

          a.sponsor_type,
          a.sponsor_name,
          a.sponsor_relationship,
          a.sponsor_mobile,
          a.sponsor_email,

          a.created_at,

          ps.relationship,
          ps.is_primary,

          ad.id AS admission_id,
          ad.admission_number,
          ad.admission_status,
          ad.admission_date

        FROM parent_students ps

        INNER JOIN applications a
          ON a.id = ps.application_id

        LEFT JOIN admissions ad
          ON ad.application_id = a.id

        WHERE
          ps.parent_id = $1

        ORDER BY
          ps.is_primary DESC,
          a.created_at DESC

        LIMIT 1
      `,
      [session.parentId]
    );

  /* =======================================================
     NO LINKED STUDENT
  ======================================================= */

  if (studentResult.rows.length === 0) {
    return (
      <main className="min-h-screen bg-brand-cream">

        <div className="h-1.5 w-full bg-brand-gold" />

        <div className="flex min-h-screen items-center justify-center p-6">

          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Users size={30} />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-brand-dark">
              No Linked Student
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Your parent account is active, but there is currently
              no student linked to this account.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Please contact Shifah Medical Training College so
              your student can be linked to your parent account.
            </p>

            <div className="mt-6">

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                <Phone size={18} />

                Contact College
              </Link>

            </div>

          </div>

        </div>

      </main>
    );
  }

  const student = studentResult.rows[0];

  /* =======================================================
     FULL STUDENT NAME
  ======================================================= */

  const fullName = [
    student.first_name,
    student.middle_name,
    student.surname,
  ]
    .filter(
      (value: string | null): value is string =>
        Boolean(value && value.trim())
    )
    .join(' ');

  /* =======================================================
     STUDENT INITIAL
  ======================================================= */

  const studentInitial =
    fullName.charAt(0).toUpperCase() || 'S';

  /* =======================================================
     PARENT INITIAL
  ======================================================= */

  const parentInitial =
    (parent.name || 'P').charAt(0).toUpperCase();

  /* =======================================================
     STATUS VALUES
  ======================================================= */

  const applicationStatus =
    String(
      student.application_status ||
        'Pending'
    );

  const paymentStatus =
    String(
      student.payment_status ||
        'Pending'
    );

  const admissionStatus =
    String(
      student.admission_status ||
        'Not Admitted'
    );

  /* =======================================================
     NORMALIZE STATUS
  ======================================================= */

  const normalizedApplicationStatus =
    applicationStatus
      .trim()
      .toLowerCase();

  const normalizedPaymentStatus =
    paymentStatus
      .trim()
      .toLowerCase();

  const normalizedAdmissionStatus =
    admissionStatus
      .trim()
      .toLowerCase();

  /* =======================================================
     APPLICATION STATUS
  ======================================================= */

  const applicationApproved = [
    'approved',
    'accepted',
    'admitted',
  ].includes(
    normalizedApplicationStatus
  );

  /* =======================================================
     PAYMENT STATUS

     Your database currently shows:
       paid

     We therefore treat:
       paid
       approved
       completed
       complete

     as successful.
  ======================================================= */

  const paymentComplete = [
    'paid',
    'approved',
    'completed',
    'complete',
  ].includes(
    normalizedPaymentStatus
  );

  /* =======================================================
     ADMISSION STATUS
  ======================================================= */

  const admissionActive = [
    'active',
    'approved',
    'admitted',
  ].includes(
    normalizedAdmissionStatus
  );

  /* =======================================================
     APPLICATION PROGRESS
  ======================================================= */

  let progress = 33;

  if (paymentComplete) {
    progress = 66;
  }

  if (
    applicationApproved ||
    admissionActive
  ) {
    progress = 100;
  }

  /* =======================================================
     PARENT / GUARDIAN DISPLAY DATA
  ======================================================= */

  const parentDisplayName =
    student.guardian_name ||
    student.sponsor_name ||
    parent.name ||
    'Parent / Guardian';

  const parentRelationship =
    student.guardian_relationship ||
    student.sponsor_relationship ||
    student.relationship ||
    'Parent / Guardian';

  const parentPhone =
    student.guardian_mobile ||
    student.sponsor_mobile ||
    parent.phone ||
    '—';

  const parentEmail =
    student.guardian_email ||
    student.sponsor_email ||
    parent.email ||
    '—';

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-brand-cream">

      {/* =====================================================
          TOP BRAND BAR
      ====================================================== */}

      <div className="h-1.5 w-full bg-brand-gold" />

      <div className="flex min-h-screen">

        {/* =================================================
            SIDEBAR
        ================================================== */}

        <aside className="hidden w-72 flex-col bg-brand-dark text-white lg:flex">

          {/* =================================================
              BRAND
          ================================================== */}

          <div className="border-b border-white/10 p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white p-1">

                <img
                  src="/images/logo.jpg"
                  alt="Shifah Medical Training College"
                  className="h-full w-full object-contain"
                />

              </div>

              <div>

                <p className="text-sm font-bold">
                  SMTC
                </p>

                <p className="text-[10px] text-white/50">
                  Parent Portal
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              PARENT PROFILE
          ================================================== */}

          <div className="border-b border-white/10 p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-green text-sm font-bold ring-2 ring-brand-gold/60">
                {parentInitial}
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold">
                  {parent.name || 'Parent'}
                </p>

                <p className="truncate text-xs text-white/50">
                  Parent Account
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              LINKED STUDENT
          ================================================== */}

          <div className="border-b border-white/10 px-5 py-4">

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
              Linked Student
            </p>

            <div className="mt-3 flex items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-brand-gold">
                {studentInitial}
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold text-white">
                  {fullName || 'Student'}
                </p>

                <p className="truncate text-[11px] text-white/40">
                  {student.application_number || 'Application'}
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              NAVIGATION
          ================================================== */}

          <nav className="flex-1 px-4 py-6">

            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
              Parent Menu
            </p>

            <div className="space-y-1">

              <SidebarItem
                href="/parent/dashboard"
                icon={
                  <LayoutDashboard size={19} />
                }
                label="Dashboard"
                active
              />

              <SidebarItem
                href="/parent/dashboard/student"
                icon={
                  <UserRound size={19} />
                }
                label="Student Details"
              />

              <SidebarItem
                href="/parent/dashboard/academic"
                icon={
                  <BookOpen size={19} />
                }
                label="Academic Progress"
              />

              <SidebarItem
                href="/parent/dashboard/payment"
                icon={
                  <CreditCard size={19} />
                }
                label="Fees & Payments"
              />

              <SidebarItem
                href="/parent/dashboard/admission"
                icon={
                  <GraduationCap size={19} />
                }
                label="Admission"
              />

              <SidebarItem
                href="/parent/dashboard/documents"
                icon={
                  <FileText size={19} />
                }
                label="Documents"
              />

            </div>

            {/* =================================================
                SUPPORT
            ================================================== */}

            <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
              Support
            </p>

            <SidebarItem
              href="/contact"
              icon={
                <Phone size={19} />
              }
              label="Contact College"
            />

          </nav>

          {/* =================================================
              LOGOUT
          ================================================== */}

          <div className="border-t border-white/10 p-4">

            <form
              action="/api/parent/logout"
              method="POST"
            >

              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-red-500/10 hover:text-red-300"
              >

                <LogOut size={19} />

                <span>
                  Logout
                </span>

              </button>

            </form>

          </div>

        </aside>

        {/* =================================================
            MAIN CONTENT
        ================================================== */}

        <section className="flex-1">

          {/* =================================================
              HEADER
          ================================================== */}

          <header className="border-b border-slate-200 bg-white">

            <div className="flex items-center justify-between px-5 py-5 sm:px-8">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-green">
                  Parent Portal
                </p>

                <h1 className="mt-1 text-xl font-bold text-brand-dark sm:text-2xl">
                  Welcome Back
                  {parent.name
                    ? `, ${parent.name}`
                    : ''}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Monitor your student&apos;s
                  progress and college information.
                </p>

              </div>

              <div className="hidden items-center gap-3 sm:flex">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-white">
                  {parentInitial}
                </div>

              </div>

            </div>

          </header>

          {/* =================================================
              CONTENT
          ================================================== */}

          <div className="space-y-6 p-5 sm:p-8">

            {/* =================================================
                STUDENT HERO
            ================================================== */}

            <section className="overflow-hidden rounded-3xl bg-brand-green shadow-lg">

              <div className="relative p-6 sm:p-8">

                <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border-[35px] border-white/5" />

                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
                      Student Overview
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                      {fullName || 'Student'}
                    </h2>

                    <p className="mt-2 text-sm text-white/70">

                      Application No:{' '}

                      <span className="font-semibold text-white">
                        {student.application_number || '—'}
                      </span>

                    </p>

                    <p className="mt-1 text-sm text-white/70">

                      {student.course ||
                        'Course not specified'}

                      {student.intake
                        ? ` • ${student.intake}`
                        : ''}

                    </p>

                  </div>

                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-extrabold text-brand-green shadow-lg">
                    {studentInitial}
                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                STATUS CARDS
            ================================================== */}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatusCard
                icon={
                  <FileText size={21} />
                }
                title="Application"
                value={applicationStatus}
                success={applicationApproved}
              />

              <StatusCard
                icon={
                  <CreditCard size={21} />
                }
                title="Payment"
                value={paymentStatus}
                success={paymentComplete}
              />

              <StatusCard
                icon={
                  <GraduationCap size={21} />
                }
                title="Admission"
                value={admissionStatus}
                success={admissionActive}
              />

              <StatusCard
                icon={
                  <CalendarDays size={21} />
                }
                title="Intake"
                value={
                  student.intake ||
                  'Not specified'
                }
                success={true}
              />

            </section>

            {/* =================================================
                PROGRESS
            ================================================== */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-lg font-bold text-brand-dark">
                    Application Progress
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Track the progress of your
                    student&apos;s enrollment.
                  </p>

                </div>

                <span className="text-lg font-extrabold text-brand-green">
                  {progress}%
                </span>

              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full bg-brand-green transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">

                <ProgressStep
                  title="Application"
                  complete={true}
                  description="Application submitted"
                />

                <ProgressStep
                  title="Payment"
                  complete={paymentComplete}
                  description={
                    paymentComplete
                      ? 'Payment confirmed'
                      : 'Payment pending'
                  }
                />

                <ProgressStep
                  title="Admission"
                  complete={
                    applicationApproved ||
                    admissionActive
                  }
                  description={
                    admissionActive ||
                    applicationApproved
                      ? 'Admission confirmed'
                      : 'Awaiting admission'
                  }
                />

              </div>

            </section>

            {/* =================================================
                STUDENT + PARENT INFORMATION
            ================================================== */}

            <div className="grid gap-6 lg:grid-cols-2">

              {/* =================================================
                  STUDENT DETAILS
              ================================================== */}

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">

                    <UserRound
                      size={20}
                      className="text-brand-green"
                    />

                  </div>

                  <div>

                    <h2 className="font-bold text-brand-dark">
                      Student Details
                    </h2>

                    <p className="text-xs text-slate-500">
                      Basic student information
                    </p>

                  </div>

                </div>

                <InfoRow
                  label="Full Name"
                  value={
                    fullName || '—'
                  }
                />

                <InfoRow
                  label="Application Number"
                  value={
                    student.application_number ||
                    '—'
                  }
                />

                <InfoRow
                  label="Course"
                  value={
                    student.course ||
                    '—'
                  }
                />

                <InfoRow
                  label="Intake"
                  value={
                    student.intake ||
                    '—'
                  }
                />

                <InfoRow
                  label="Phone"
                  value={
                    student.mobile ||
                    '—'
                  }
                />

                <InfoRow
                  label="Email"
                  value={
                    student.email ||
                    '—'
                  }
                />

              </section>

              {/* =================================================
                  PARENT DETAILS
              ================================================== */}

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5 flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">

                    <Users
                      size={20}
                      className="text-brand-green"
                    />

                  </div>

                  <div>

                    <h2 className="font-bold text-brand-dark">
                      Parent / Guardian
                    </h2>

                    <p className="text-xs text-slate-500">
                      Registered contact information
                    </p>

                  </div>

                </div>

                <InfoRow
                  label="Name"
                  value={
                    parentDisplayName
                  }
                />

                <InfoRow
                  label="Relationship"
                  value={
                    parentRelationship
                  }
                />

                <InfoRow
                  label="Phone"
                  value={
                    parentPhone
                  }
                />

                <InfoRow
                  label="Email"
                  value={
                    parentEmail
                  }
                />

              </section>

            </div>

            {/* =================================================
                QUICK ACTIONS
            ================================================== */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-5">

                <h2 className="text-lg font-bold text-brand-dark">
                  Quick Access
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Quickly access important student
                  information.
                </p>

              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                <ActionLink
                  href="/parent/dashboard/student"
                  icon={
                    <UserRound size={20} />
                  }
                  title="Student Details"
                  description="View student information"
                />

                <ActionLink
                  href="/parent/dashboard/academic"
                  icon={
                    <BookOpen size={20} />
                  }
                  title="Academic Progress"
                  description="View academic performance"
                />

                <ActionLink
                  href="/parent/dashboard/payment"
                  icon={
                    <CreditCard size={20} />
                  }
                  title="Fees & Payments"
                  description="Check payment information"
                />

                <ActionLink
                  href="/parent/dashboard/admission"
                  icon={
                    <GraduationCap size={20} />
                  }
                  title="Admission"
                  description="View admission status"
                />

              </div>

            </section>

            {/* =================================================
                SECURITY NOTICE
            ================================================== */}

            <section className="rounded-3xl border border-brand-green/10 bg-brand-green/5 p-5">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10">

                  <ShieldCheck
                    size={20}
                    className="text-brand-green"
                  />

                </div>

                <div>

                  <p className="text-sm font-bold text-brand-dark">
                    Secure Parent Portal
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your parent account provides secure
                    access to information associated with
                    your linked student&apos;s Shifah Medical
                    Training College records.
                  </p>

                </div>

              </div>

            </section>

          </div>

        </section>

      </div>

    </main>
  );
}

/* =========================================================
   SIDEBAR ITEM
========================================================= */

function SidebarItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
        active
          ? 'bg-white/10 text-white shadow-sm'
          : 'text-white/60 hover:bg-white/5 hover:text-white',
      ].join(' ')}
    >
      {icon}

      <span>
        {label}
      </span>

    </Link>
  );
}

/* =========================================================
   STATUS CARD
========================================================= */

function StatusCard({
  icon,
  title,
  value,
  success,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  success: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
          {icon}
        </div>

        <StatusIndicator
          success={success}
        />

      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-brand-dark">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   STATUS INDICATOR
========================================================= */

function StatusIndicator({
  success,
}: {
  success: boolean;
}) {
  return success ? (
    <CheckCircle2
      size={18}
      className="text-emerald-600"
    />
  ) : (
    <Clock3
      size={18}
      className="text-amber-600"
    />
  );
}

/* =========================================================
   PROGRESS STEP
========================================================= */

function ProgressStep({
  title,
  description,
  complete,
}: {
  title: string;
  description: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-start gap-3">

      <div
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          complete
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-amber-100 text-amber-600',
        ].join(' ')}
      >

        {complete ? (
          <CheckCircle2 size={18} />
        ) : (
          <Clock3 size={18} />
        )}

      </div>

      <div>

        <p className="text-sm font-bold text-brand-dark">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0">

      <span className="text-xs font-medium text-slate-400">
        {label}
      </span>

      <span className="max-w-[65%] break-words text-right text-sm font-semibold text-brand-dark">
        {value}
      </span>

    </div>
  );
}

/* =========================================================
   ACTION LINK
========================================================= */

function ActionLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-brand-green/30 hover:shadow-md"
    >

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <p className="truncate text-sm font-bold text-brand-dark">
          {title}
        </p>

        <p className="mt-0.5 truncate text-xs text-slate-500">
          {description}
        </p>

      </div>

      <ChevronRight
        size={17}
        className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-green"
      />

    </Link>
  );
}