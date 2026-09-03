import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  FileText,
  CreditCard,
  GraduationCap,
  FolderOpen,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Phone,
  CalendarDays,
  BookOpen,
  ShieldCheck,
  Award,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

import pool from '@/lib/db';
import { getStudentSession } from '@/lib/student-auth';

/* =========================================================
   PROTECTED STUDENT DASHBOARD

   IMPORTANT:
   - Student authentication is handled here.
   - StudentHeader is provided by:
       app/student/dashboard/layout.tsx
   - StudentSidebar is provided by:
       app/student/dashboard/layout.tsx
   - Do NOT render either component in this page.
========================================================= */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/* =========================================================
   PAGE
========================================================= */

export default async function StudentDashboardPage() {
  /* =======================================================
     CHECK STUDENT SESSION
  ======================================================= */

  const session = await getStudentSession();

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
     APPLICATION STATUS
  ======================================================= */

  const applicationStatus =
    student.application_status || 'Pending';

  const paymentStatus =
    student.payment_status || 'Pending';

  const normalizedApplicationStatus =
    String(applicationStatus)
      .trim()
      .toLowerCase();

  const normalizedPaymentStatus =
    String(paymentStatus)
      .trim()
      .toLowerCase();

  const paymentComplete =
    normalizedPaymentStatus === 'paid';

  const applicationApproved = [
    'approved',
    'accepted',
    'admitted',
  ].includes(normalizedApplicationStatus);

  /* =======================================================
     ADMISSION RECORD
  ======================================================= */

  let admission: {
    id: number;
    admission_number: string | null;
    application_number: string | null;
    course: string | null;
    intake: string | null;
    admission_status: string | null;
    admission_date: string | Date | null;
  } | null = null;

  if (applicationApproved) {
    const admissionResult = await pool.query(
      `
        SELECT
          id,
          admission_number,
          application_number,
          course,
          intake,
          admission_status,
          admission_date

        FROM admissions

        WHERE application_id = $1

        LIMIT 1
      `,
      [student.id]
    );

    if (admissionResult.rows.length > 0) {
      const row = admissionResult.rows[0];

      admission = {
        id: Number(row.id),

        admission_number:
          row.admission_number
            ? String(row.admission_number).trim()
            : null,

        application_number:
          row.application_number
            ? String(row.application_number).trim()
            : null,

        course:
          row.course
            ? String(row.course)
            : null,

        intake:
          row.intake
            ? String(row.intake)
            : null,

        admission_status:
          row.admission_status
            ? String(row.admission_status)
            : null,

        admission_date:
          row.admission_date || null,
      };
    }
  }

  /* =======================================================
     ADMISSION STATUS
  ======================================================= */

  const normalizedAdmissionStatus =
    String(admission?.admission_status || '')
      .trim()
      .toLowerCase();

  const hasActiveAdmission =
    Boolean(admission) &&
    normalizedAdmissionStatus === 'active';

  /* =======================================================
     OFFICIAL ADMISSION NUMBER
  ======================================================= */

  const admissionNumber =
    admission?.admission_number || null;

  /* =======================================================
     PORTAL ROLE
  ======================================================= */

  const portalRole =
    hasActiveAdmission
      ? 'Student'
      : 'Applicant';

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
      status.trim().toLowerCase();

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
    statusStyle(String(applicationStatus));

  const paymentStyle =
    statusStyle(String(paymentStatus));

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f7f9f8]">
      {/* =================================================
          DASHBOARD CONTENT

          Header and Sidebar are supplied by the shared
          student dashboard layout.
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

                  <ShieldCheck size={14} />

                  {hasActiveAdmission
                    ? 'Active Student Account'
                    : 'Applicant Portal'}

                </div>

                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  Welcome, {firstName}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">

                  {hasActiveAdmission
                    ? 'Welcome to your student portal. Access your courses, units, lessons, assignments, quizzes, results and learning progress from one place.'
                    : 'Manage your application, monitor your payment, check your admission status and access your student documents from one place.'}

                </p>

              </div>

              {/* =================================================
                  APPLICATION / ADMISSION NUMBERS
              ================================================= */}

              <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:min-w-[430px]">

                {/* APPLICATION NUMBER */}

                <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">

                  <p className="text-xs uppercase tracking-wider text-white/50">
                    Application Number
                  </p>

                  <p className="mt-2 break-all font-mono text-sm font-bold text-white">
                    {student.application_number}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-white/60">

                    <CalendarDays size={14} />

                    Applied {applicationDate}

                  </div>

                </div>

                {/* ADMISSION NUMBER */}

                <div className="rounded-2xl border border-[#d7a93b]/30 bg-[#d7a93b]/10 p-5 backdrop-blur">

                  <div className="flex items-center justify-between gap-2">

                    <p className="text-xs uppercase tracking-wider text-[#d7a93b]/80">
                      Admission Number
                    </p>

                    <Award
                      size={17}
                      className="text-[#d7a93b]"
                    />

                  </div>

                  <p className="mt-2 break-all font-mono text-sm font-bold text-[#d7a93b]">

                    {admissionNumber ||
                      'Not Yet Assigned'}

                  </p>

                  <p className="mt-3 text-xs text-white/50">

                    {hasActiveAdmission
                      ? 'Official admission record'
                      : applicationApproved
                      ? 'Awaiting admission record'
                      : 'Available after admission'}

                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              LMS NOTICE
          ================================================= */}

          {hasActiveAdmission && (
            <section className="mt-6 rounded-2xl border border-[#0f4f3f]/10 bg-white p-5 shadow-sm">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">

                    <BookOpen size={21} />

                  </div>

                  <div>

                    <h3 className="font-bold text-[#0c1f1a]">
                      Your Academic Portal is Ready
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      Access your courses, learning materials, assignments, quizzes and academic progress.
                    </p>

                  </div>

                </div>

                <Link
                  href="/student/dashboard/courses"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0f4f3f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c3f32]"
                >
                  Go to My Courses
                  <ChevronRight size={17} />
                </Link>

              </div>

            </section>
          )}

          {/* =================================================
              SUMMARY CARDS
          ================================================= */}

          <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <StatusCard
              title="Application Status"
              value={String(applicationStatus)}
              icon={<FileText size={21} />}
              style={applicationStyle}
            />

            <StatusCard
              title="Payment Status"
              value={String(paymentStatus)}
              icon={<CreditCard size={21} />}
              style={paymentStyle}
            />

            {/* ADMISSION */}

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d7a93b]/15 text-[#a67d13]">

                  <GraduationCap size={21} />

                </div>

                <span className="text-xs font-medium text-gray-400">
                  ADMISSION
                </span>

              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-wider text-gray-400">
                Admission Number
              </p>

              <p className="mt-1 break-all font-mono text-sm font-bold leading-6 text-[#0f4f3f]">

                {admissionNumber ||
                  'Not Yet Assigned'}

              </p>

              <p className="mt-2 text-xs text-gray-400">

                {hasActiveAdmission
                  ? 'Official admission number'
                  : applicationApproved
                  ? 'Awaiting admission record'
                  : 'Assigned after approval'}

              </p>

            </div>

            {/* DOCUMENTS */}

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">

                  <FolderOpen size={21} />

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

            {/* APPLICATION PROGRESS */}

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
                  complete={paymentComplete}
                />

                <ProgressStep
                  number="03"
                  title="Admission Decision"
                  description={
                    applicationApproved
                      ? hasActiveAdmission
                        ? `Admitted • ${
                            admissionNumber ||
                            'Admission number pending'
                          }`
                        : 'You have been admitted. Admission record pending.'
                      : 'Awaiting admission decision.'
                  }
                  complete={applicationApproved}
                />

              </div>

            </div>

            {/* =================================================
                SELECTED INTAKE
            ================================================= */}

            <div className="rounded-2xl bg-[#0c1f1a] p-6 text-white shadow-lg">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#d7a93b]">

                <GraduationCap size={22} />

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
                  Admission Number
                </p>

                <p className="mt-1 break-all font-mono text-sm font-bold text-[#d7a93b]">

                  {admissionNumber ||
                    'Not Yet Assigned'}

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

            {/* APPLICATION INFORMATION */}

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

              <div className="flex items-start justify-between">

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
                  <ChevronRight size={15} />
                </Link>

              </div>

              <div className="mt-6 divide-y divide-gray-100">

                <DetailRow
                  label="Full Name"
                  value={fullName}
                />

                <DetailRow
                  label="Application Number"
                  value={
                    student.application_number
                  }
                />

                <DetailRow
                  label="Admission Number"
                  value={
                    admissionNumber ||
                    'Not Yet Assigned'
                  }
                  highlight={Boolean(admissionNumber)}
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
                  value={
                    student.county || '—'
                  }
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
                  icon={<FileText size={19} />}
                  title="My Application"
                  description="View submitted details"
                />

                <ActionLink
                  href="/student/dashboard/payment"
                  icon={<CreditCard size={19} />}
                  title="Payment & Receipt"
                  description="Check payment status"
                />

                <ActionLink
                  href="/student/dashboard/admission"
                  icon={<GraduationCap size={19} />}
                  title="Admission"
                  description="Check admission status"
                />

                <ActionLink
                  href="/student/dashboard/documents"
                  icon={<FolderOpen size={19} />}
                  title="Documents"
                  description="View submitted documents"
                />

                {hasActiveAdmission && (
                  <ActionLink
                    href="/student/dashboard/courses"
                    icon={<BookOpen size={19} />}
                    title="My Courses"
                    description="Access your academic courses"
                  />
                )}

              </div>

            </div>

          </section>

          {/* =================================================
              ACADEMIC SHORTCUTS
          ================================================= */}

          {hasActiveAdmission && (
            <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">

                    <BookOpen size={21} />

                  </div>

                  <div>

                    <h3 className="font-bold text-[#0c1f1a]">
                      Academic Learning
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Continue your learning journey at Shifah MTC.
                    </p>

                  </div>

                </div>

                <div className="flex flex-wrap gap-2">

                  <Link
                    href="/student/dashboard/courses"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-[#0c1f1a] transition hover:border-[#0f4f3f] hover:bg-[#0f4f3f]/5"
                  >
                    <BookOpen size={16} />
                    Courses
                  </Link>

                  <Link
                    href="/student/dashboard/assignments"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-[#0c1f1a] transition hover:border-[#0f4f3f] hover:bg-[#0f4f3f]/5"
                  >
                    <ClipboardList size={16} />
                    Assignments
                  </Link>

                  <Link
                    href="/student/dashboard/results"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0f4f3f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3f32]"
                  >
                    <BarChart3 size={16} />
                    Results
                  </Link>

                </div>

              </div>

            </section>
          )}

          {/* =================================================
              CONTACT
          ================================================= */}

          <section className="mt-6 rounded-2xl border border-[#d7a93b]/20 bg-[#fffdf5] p-6">

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d7a93b]/15 text-[#a67d13]">

                  <Phone size={20} />

                </div>

                <div>

                  <h3 className="font-bold text-[#0c1f1a]">
                    Need help?
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Contact the admissions office if you need assistance with your application, admission or student portal.
                  </p>

                </div>

              </div>

              <Link
                href="/student/dashboard/contact"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0f4f3f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c3f32]"
              >
                Contact Admissions
                <ChevronRight size={17} />
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
              Student Portal • Secure {portalRole} Access
            </p>

          </div>

        </div>
      </main>
    </div>
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
  icon: ReactNode;
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
          <CheckCircle2 size={17} />
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
  highlight = false,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">

      <p className="shrink-0 text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p
        className={`
          max-w-[60%]
          break-all
          text-right
          text-sm
          font-semibold
          ${
            highlight
              ? 'font-mono text-[#0f4f3f]'
              : 'text-gray-800'
          }
        `}
      >
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
  icon: ReactNode;
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