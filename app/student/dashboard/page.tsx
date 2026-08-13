
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import pool from '@/lib/db';
import {
  getStudentSession,
} from '@/lib/student-auth';

import {
  LayoutDashboard,
  FileText,
  CreditCard,
  GraduationCap,
  FolderOpen,
  User,
  Bell,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Phone,
  CalendarDays,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';

/* =========================================================
   STUDENT DASHBOARD
========================================================= */

export default async function StudentDashboardPage() {

  /* =======================================================
     CHECK STUDENT SESSION
  ======================================================= */

  const session =
    await getStudentSession();

  if (!session) {
    redirect('/student/login');
  }

  /* =======================================================
     GET APPLICATION
  ======================================================= */

  const result = await pool.query(
    `
      SELECT
        id,
        application_number,

        surname,
        middle_name,
        first_name,

        date_of_birth,
        gender,
        nationality,
        country,
        id_passport_number,
        marital_status,

        postal_address,
        postal_code,
        town,
        county,
        mobile,
        email,

        kcse_index,
        kcse_year,
        kcse_mean_grade,

        previous_institution,
        highest_qualification,

        course,
        intake,

        sponsor_type,
        sponsor_name,
        sponsor_relationship,
        sponsor_mobile,
        sponsor_email,

        guardian_name,
        guardian_relationship,
        guardian_mobile,
        guardian_email,

        id_document,
        kcse_certificate,
        passport_photo,

        application_fee,
        payment_status,
        application_status,

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
     APPLICATION NO LONGER EXISTS
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

  const firstName =
    student.first_name || 'Student';

  /* =======================================================
     STATUS
  ======================================================= */

  const applicationStatus =
    student.application_status ||
    'Pending';

  const paymentStatus =
    student.payment_status ||
    'Pending';

  const normalizedApplicationStatus =
    String(applicationStatus).toLowerCase();

  const normalizedPaymentStatus =
    String(paymentStatus).toLowerCase();

  const paymentComplete =
    normalizedPaymentStatus === 'paid';

  const applicationApproved =
    [
      'approved',
      'accepted',
      'admitted',
    ].includes(
      normalizedApplicationStatus
    );

  /* =======================================================
     PROGRESS
  ======================================================= */

  let progress = 33;

  if (paymentComplete) {
    progress = 66;
  }

  if (applicationApproved) {
    progress = 100;
  }

  /* =======================================================
     INITIAL
  ======================================================= */

  const studentInitial =
    fullName
      .charAt(0)
      .toUpperCase() || 'S';

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
     DOCUMENT COUNT
  ======================================================= */

  const documents = [
    student.id_document,
    student.kcse_certificate,
    student.passport_photo,
  ];

  const submittedDocuments =
    documents.filter(Boolean).length;

  /* =======================================================
     STATUS STYLE
  ======================================================= */

  function statusStyle(status: string) {

    const value =
      status.toLowerCase();

    if (
      value === 'paid' ||
      value === 'approved' ||
      value === 'accepted' ||
      value === 'admitted'
    ) {
      return {
        wrapper:
          'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot:
          'bg-emerald-500',
      };
    }

    if (
      value === 'rejected' ||
      value === 'declined' ||
      value === 'failed'
    ) {
      return {
        wrapper:
          'bg-red-50 text-red-700 border-red-200',
        dot:
          'bg-red-500',
      };
    }

    return {
      wrapper:
        'bg-amber-50 text-amber-700 border-amber-200',
      dot:
        'bg-amber-500',
    };
  }

  const applicationStyle =
    statusStyle(
      String(applicationStatus)
    );

  const paymentStyle =
    statusStyle(
      String(paymentStatus)
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f7f9f8]">

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-[#0c1f1a] text-white lg:flex">

        {/* =================================================
            BRAND / COLLEGE LOGO
        ================================================= */}

        <div className="flex h-20 items-center border-b border-white/10 px-5">

          <Link
            href="/student/dashboard"
            className="flex items-center gap-3"
          >

            {/* COLLEGE LOGO */}

            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-white/20">

              <Image
                src="/images/logo.jpg"
                alt="Shifah Medical Training College"
                fill
                priority
                sizes="48px"
                className="object-contain p-1"
              />

            </div>

            {/* BRAND TEXT */}

            <div className="min-w-0">

              <p className="truncate text-sm font-bold tracking-wide">
                SHIFAH MTC
              </p>

              <p className="truncate text-xs text-white/50">
                Student Portal
              </p>

            </div>

          </Link>

        </div>

        {/* =================================================
            STUDENT PROFILE
        ================================================= */}

        <div className="border-b border-white/10 p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0f4f3f] text-sm font-bold ring-2 ring-[#d7a93b]/60">

              {studentInitial}

            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold">
                {fullName}
              </p>

              <p className="truncate text-xs text-white/50">
                Applicant
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="flex-1 px-4 py-6">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
            Main Menu
          </p>

          

            <SidebarItem
              href="/student/dashboard"
              icon={
                <LayoutDashboard
                  size={19}
                />
              }
              label="Dashboard"
              active
            />

            <SidebarItem
              href="/student/dashboard/application"
              icon={
                <FileText
                  size={19}
                />
              }
              label="My Application"
            />

            <SidebarItem
              href="/student/dashboard/payment"
              icon={
                <CreditCard
                  size={19}
                />
              }
              label="Payment & Receipt"
            />

            <SidebarItem
              href="/student/dashboard/admission"
              icon={
                <GraduationCap
                  size={19}
                />
              }
              label="Admission"
            />

            <SidebarItem
              href="/student/dashboard/documents"
              icon={
                <FolderOpen
                  size={19}
                />
              }
              label="My Documents"
            />



          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
            Support
          </p>

          <SidebarItem
            href="/student/dashboard/contact"
            icon={
              <Phone
                size={19}
              />
            }
            label="Contact Admissions"
          />

        </nav>

        {/* =================================================
            LOGOUT
        ================================================= */}

       <div className="border-t border-white/10 p-4">

  <form
    action="/api/student/logout"
    method="POST"
  >

    <button
      type="submit"
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-red-500/10 hover:text-red-300"
    >

      <LogOut
        size={19}
      />

      Logout

    </button>

  </form>



        </div>

      </aside>

      {/* ===================================================
          MAIN
      =================================================== */}

      <div className="lg:pl-72">

        {/* =================================================
            TOP HEADER
        ================================================= */}

        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">

          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">

            {/* PAGE TITLE */}

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0f4f3f]">
                Student Portal
              </p>

              <h1 className="mt-1 text-xl font-bold text-[#0c1f1a]">
                Dashboard
              </h1>

            </div>

            {/* RIGHT SIDE */}

            <div className="flex items-center gap-4">

              <button
                type="button"
                className="relative rounded-xl p-2.5 text-gray-500 transition hover:bg-gray-100 hover:text-[#0f4f3f]"
                aria-label="Notifications"
              >

                <Bell
                  size={20}
                />

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#d7a93b]" />

              </button>

              <div className="hidden h-8 w-px bg-gray-200 sm:block" />

              <div className="hidden text-right sm:block">

                <p className="text-sm font-semibold text-[#0c1f1a]">
                  {firstName}
                </p>

                <p className="text-xs text-gray-500">
                  {student.application_number}
                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f4f3f] text-sm font-bold text-white">
                {studentInitial}
              </div>

            </div>

          </div>

        </header>

        {/* =================================================
            CONTENT
        ================================================= */}

        <main className="px-4 py-6 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-7xl">

            {/* =================================================
                WELCOME BANNER
            ================================================= */}

            <section className="relative overflow-hidden rounded-2xl bg-[#0f4f3f] p-6 shadow-lg sm:p-8">

              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/5" />

              <div className="absolute -bottom-28 right-20 h-64 w-64 rounded-full bg-[#d7a93b]/10" />

              <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">

                <div>

                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80">

                    <ShieldCheck
                      size={14}
                    />

                    Applicant Portal

                  </div>

                  <h2 className="text-2xl font-bold text-white sm:text-3xl">
                    Welcome, {firstName}
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                    Manage your application,
                    monitor your payment,
                    check your admission status
                    and access your student
                    documents from one place.
                  </p>

                </div>

                <div className="shrink-0 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">

                  <p className="text-xs uppercase tracking-wider text-white/50">
                    Application Number
                  </p>

                  <p className="mt-2 font-mono text-sm font-bold text-white">
                    {student.application_number}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-white/60">

                    <CalendarDays
                      size={14}
                    />

                    Applied {applicationDate}

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

              <StatusCard
                title="Application Status"
                value={applicationStatus}
                icon={
                  <FileText
                    size={21}
                  />
                }
                style={applicationStyle}
              />

              <StatusCard
                title="Payment Status"
                value={paymentStatus}
                icon={
                  <CreditCard
                    size={21}
                  />
                }
                style={paymentStyle}
              />

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">

                    <BookOpen
                      size={21}
                    />

                  </div>

                  <span className="text-xs font-medium text-gray-400">
                    COURSE
                  </span>

                </div>

                <p className="mt-5 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Selected Course
                </p>

                <p className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-[#0c1f1a]">
                  {student.course}
                </p>

              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

                <div className="flex items-center justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">

                    <FolderOpen
                      size={21}
                    />

                  </div>

                  <span className="text-xs font-medium text-gray-400">
                    DOCUMENTS
                  </span>

                </div>

                <p className="mt-5 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Submitted
                </p>

                <p className="mt-1 text-2xl font-bold text-[#0c1f1a]">

                  {submittedDocuments}

                  <span className="ml-1 text-sm font-medium text-gray-400">
                    / 3
                  </span>

                </p>

              </div>

            </section>

            {/* =================================================
                MAIN GRID
            ================================================= */}

            <section className="mt-6 grid gap-6 xl:grid-cols-3">

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">

                <div className="flex items-start justify-between">

                  <div>

                    <h3 className="font-bold text-[#0c1f1a]">
                      Application Progress
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Track your application journey.
                    </p>

                  </div>

                  <span className="text-lg font-bold text-[#0f4f3f]">
                    {progress}%
                  </span>

                </div>

                <div className="mt-6">

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">

                    <div
                      className="h-full rounded-full bg-[#0f4f3f] transition-all"
                      style={{
                        width: `${progress}%`,
                      }}
                    />

                  </div>

                </div>

                <div className="mt-7 grid gap-6 md:grid-cols-3">

                  <ProgressStep
                    number="01"
                    title="Application Submitted"
                    description="Your application has been received."
                    complete
                  />

                  <ProgressStep
                    number="02"
                    title="Application Fee"
                    description={
                      paymentComplete
                        ? 'Payment verified successfully.'
                        : 'Payment awaiting verification.'
                    }
                    complete={
                      paymentComplete
                    }
                  />

                  <ProgressStep
                    number="03"
                    title="Admission Decision"
                    description={
                      applicationApproved
                        ? 'You have been admitted.'
                        : 'Awaiting admission decision.'
                    }
                    complete={
                      applicationApproved
                    }
                  />

                </div>

              </div>

              {/* =================================================
                  INTAKE CARD
              ================================================= */}

              <div className="rounded-2xl bg-[#0c1f1a] p-6 text-white shadow-lg">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#d7a93b]">

                  <GraduationCap
                    size={22}
                  />

                </div>

                <p className="mt-7 text-xs font-medium uppercase tracking-wider text-white/40">
                  Selected Intake
                </p>

                <h3 className="mt-2 text-xl font-bold">
                  {student.intake}
                </h3>

                <div className="mt-6 border-t border-white/10 pt-5">

                  <p className="text-xs text-white/40">
                    Course
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white/90">
                    {student.course}
                  </p>

                </div>

                <div className="mt-5 border-t border-white/10 pt-5">

                  <p className="text-xs text-white/40">
                    Application Fee
                  </p>

                  <p className="mt-1 text-lg font-bold text-[#d7a93b]">
                    KSh{' '}
                    {Number(
                      student.application_fee || 0
                    ).toLocaleString()}
                  </p>

                </div>

              </div>

            </section>

            {/* =================================================
                LOWER GRID
            ================================================= */}

            <section className="mt-6 grid gap-6 lg:grid-cols-2">

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="font-bold text-[#0c1f1a]">
                      Application Information
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Your submitted details.
                    </p>

                  </div>

                  <Link
                    href="/student/dashboard/application"
                    className="flex items-center gap-1 text-xs font-semibold text-[#0f4f3f] hover:text-[#d7a93b]"
                  >
                    View All

                    <ChevronRight
                      size={15}
                    />

                  </Link>

                </div>

                <div className="mt-6 divide-y divide-gray-100">

                  <DetailRow
                    label="Full Name"
                    value={fullName}
                  />

                  <DetailRow
                    label="Application Number"
                    value={student.application_number}
                  />

                  <DetailRow
                    label="Mobile Number"
                    value={student.mobile}
                  />

                  <DetailRow
                    label="Email Address"
                    value={student.email}
                  />

                  <DetailRow
                    label="County"
                    value={student.county || '—'}
                  />

                </div>

              </div>

              {/* =================================================
                  QUICK ACTIONS
              ================================================= */}

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

                <div>

                  <h3 className="font-bold text-[#0c1f1a]">
                    Quick Actions
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Quickly access important portal features.
                  </p>

                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">

                  <ActionLink
                    href="/student/dashboard/application"
                    icon={
                      <FileText
                        size={19}
                      />
                    }
                    title="My Application"
                    description="View submitted details"
                  />

                  <ActionLink
                    href="/student/dashboard/payment"
                    icon={
                      <CreditCard
                        size={19}
                      />
                    }
                    title="Payment & Receipt"
                    description="Check payment status"
                  />

                  <ActionLink
                    href="/student/dashboard/admission"
                    icon={
                      <GraduationCap
                        size={19}
                      />
                    }
                    title="Admission"
                    description="Check admission status"
                  />

                  <ActionLink
                    href="/student/dashboard/documents"
                    icon={
                      <FolderOpen
                        size={19}
                      />
                    }
                    title="Documents"
                    description="View submitted documents"
                  />

                </div>

              </div>

            </section>

            {/* =================================================
                CONTACT / SUPPORT
            ================================================= */}

            <section className="mt-6 rounded-2xl border border-[#d7a93b]/20 bg-[#fffdf5] p-6">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d7a93b]/15 text-[#a67d13]">

                    <Phone
                      size={20}
                    />

                  </div>

                  <div>

                    <h3 className="font-bold text-[#0c1f1a]">
                      Need help with your application?
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      Contact the admissions office if you need assistance with your application or admission process.
                    </p>

                  </div>

                </div>

                <Link
                  href="/student/dashboard/contact"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0f4f3f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c3f32]"
                >
                  Contact Admissions

                  <ChevronRight
                    size={17}
                  />

                </Link>

              </div>

            </section>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="py-8 text-center">

              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} Shifah Medical Training College.
                All rights reserved.
              </p>

              <p className="mt-1 text-[11px] text-gray-400">
                Student Portal • Secure Applicant Access
              </p>

            </div>

          </div>

        </main>

      </div>

    </div>
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
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 rounded-xl
        px-3.5 py-3 text-sm font-medium
        transition
        ${
          active
            ? 'bg-[#d7a93b] text-[#0c1f1a] shadow-sm'
            : 'text-white/65 hover:bg-white/10 hover:text-white'
        }
      `}
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
  title,
  value,
  icon,
  style,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  style: {
    wrapper: string;
    dot: string;
  };
}) {

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">
          {icon}
        </div>

        <span
          className={`
            inline-flex items-center gap-2
            rounded-full border px-2.5 py-1
            text-xs font-semibold
            ${style.wrapper}
          `}
        >

          <span
            className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
          />

          {value}

        </span>

      </div>

      <p className="mt-5 text-xs font-medium uppercase tracking-wider text-gray-400">
        {title}
      </p>

      <div className="mt-2 flex items-center gap-2">

        {value.toLowerCase() === 'paid' && (
          <CheckCircle2
            size={16}
            className="text-emerald-600"
          />
        )}

        {value.toLowerCase() === 'pending' && (
          <Clock3
            size={16}
            className="text-amber-600"
          />
        )}

        <p className="text-sm font-bold text-[#0c1f1a]">
          {value}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   PROGRESS STEP
========================================================= */

function ProgressStep({
  number,
  title,
  description,
  complete,
}: {
  number: string;
  title: string;
  description: string;
  complete: boolean;
}) {

  return (
    <div className="flex gap-3">

      <div
        className={`
          flex h-9 w-9 shrink-0 items-center
          justify-center rounded-full text-xs
          font-bold
          ${
            complete
              ? 'bg-[#0f4f3f] text-white'
              : 'bg-gray-100 text-gray-400'
          }
        `}
      >

        {complete ? (
          <CheckCircle2
            size={17}
          />
        ) : (
          number
        )}

      </div>

      <div>

        <p
          className={`
            text-sm font-semibold
            ${
              complete
                ? 'text-[#0c1f1a]'
                : 'text-gray-400'
            }
          `}
        >
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-400">
          {description}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {

  return (
    <div className="flex items-center justify-between gap-4 py-3">

      <p className="shrink-0 text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="max-w-[60%] break-all text-right text-sm font-semibold text-gray-800">
        {value || '—'}
      </p>

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
  icon: React.ReactNode;
  title: string;
  description: string;
}) {

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:border-[#0f4f3f]/20 hover:bg-[#0f4f3f]/5"
    >

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f] transition group-hover:bg-[#0f4f3f] group-hover:text-white">

        {icon}

      </div>

      <div className="min-w-0 flex-1">

        <p className="text-sm font-semibold text-[#0c1f1a]">
          {title}
        </p>

        <p className="mt-0.5 truncate text-xs text-gray-500">
          {description}
        </p>

      </div>

      <ChevronRight
        size={16}
        className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#0f4f3f]"
      />

    </Link>
  );
}

