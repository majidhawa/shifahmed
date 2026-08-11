
import { redirect } from 'next/navigation';
import Link from 'next/link';

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
  Phone,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Clock3,
  AlertCircle,
  UserRound,
  MapPin,
  BookOpen,
  Users,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

/* =========================================================
   MY APPLICATION PAGE
========================================================= */

export default async function StudentApplicationPage() {
  /* =======================================================
     CHECK SESSION
  ======================================================= */

  const session = await getStudentSession();

  if (!session) {
    redirect('/student/login');
  }

  /* =======================================================
     GET STUDENT APPLICATION
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

        english_grade,
        kiswahili_grade,
        biology_grade,
        chemistry_grade,
        physics_grade,
        mathematics_grade,

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
     APPLICATION NOT FOUND
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

  const studentInitial =
    fullName.charAt(0).toUpperCase() || 'S';

  /* =======================================================
     APPLICATION DATE
  ======================================================= */

  const applicationDate = student.created_at
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
     STATUS
  ======================================================= */

  const applicationStatus =
    student.application_status || 'Pending';

  const paymentStatus =
    student.payment_status || 'Pending';

  const applicationStatusLower =
    String(applicationStatus).toLowerCase();

  const paymentStatusLower =
    String(paymentStatus).toLowerCase();

  const isApproved = [
    'approved',
    'accepted',
    'admitted',
  ].includes(applicationStatusLower);

  const isRejected = [
    'rejected',
    'declined',
  ].includes(applicationStatusLower);

  const isPaid =
    paymentStatusLower === 'paid';

  /* =======================================================
     STATUS COLORS
  ======================================================= */

  let applicationStatusClass =
    'bg-amber-50 text-amber-700 border-amber-200';

  if (isApproved) {
    applicationStatusClass =
      'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  if (isRejected) {
    applicationStatusClass =
      'bg-red-50 text-red-700 border-red-200';
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f7f9f8]">

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-[#0c1f1a] text-white lg:flex">

        {/* BRAND WITH COLLEGE LOGO */}

        <div className="flex h-20 items-center border-b border-white/10 px-6">

          <Link
            href="/student/dashboard"
            className="flex items-center gap-3"
          >

            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-white/20">

              <img
                src="/images/logo.jpg"
                alt="Shifah Medical Training College"
                className="h-full w-full object-contain p-1"
              />

            </div>

            <div>

              <p className="text-sm font-bold tracking-wide">
                SHIFAH MTC
              </p>

              <p className="text-xs text-white/50">
                Student Portal
              </p>

            </div>

          </Link>

        </div>

        {/* PROFILE */}

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

        {/* NAVIGATION */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
            Main Menu
          </p>

          <div className="space-y-1">

            <SidebarItem
              href="/student/dashboard"
              icon={
                <LayoutDashboard size={19} />
              }
              label="Dashboard"
            />

            <SidebarItem
              href="/student/dashboard/application"
              icon={
                <FileText size={19} />
              }
              label="My Application"
              active
            />

            <SidebarItem
              href="/student/dashboard/payment"
              icon={
                <CreditCard size={19} />
              }
              label="Payment & Receipt"
            />

            <SidebarItem
              href="/student/dashboard/admission"
              icon={
                <GraduationCap size={19} />
              }
              label="Admission"
            />

            <SidebarItem
              href="/student/dashboard/documents"
              icon={
                <FolderOpen size={19} />
              }
              label="My Documents"
            />

            <SidebarItem
              href="/student/dashboard/profile"
              icon={
                <User size={19} />
              }
              label="My Profile"
            />

          </div>

          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
            Support
          </p>

          <SidebarItem
            href="/student/dashboard/contact"
            icon={
              <Phone size={19} />
            }
            label="Contact Admissions"
          />

        </nav>

        {/* LOGOUT */}

        <div className="border-t border-white/10 p-4">

          <form
            action="/api/student/logout"
            method="POST"
          >

            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-red-500/10 hover:text-red-300"
            >

              <LogOut size={19} />

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

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0f4f3f]">
                Student Portal
              </p>

              <h1 className="mt-1 text-xl font-bold text-[#0c1f1a]">
                My Application
              </h1>

            </div>

            <div className="flex items-center gap-3">

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

            {/* BACK */}

            <Link
              href="/student/dashboard"
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#0f4f3f]"
            >

              <ArrowLeft size={17} />

              Back to Dashboard

            </Link>

            {/* =================================================
                PAGE INTRO
            ================================================= */}

            <div className="mb-6">

              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

                <div>

                  <p className="text-sm font-semibold text-[#0f4f3f]">
                    Application Details
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-[#0c1f1a] sm:text-3xl">
                    My Application
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    View the information you submitted during your application.
                  </p>

                </div>

                <div className="flex items-center gap-3">

                  <span className="text-xs text-gray-400">
                    Application No.
                  </span>

                  <span className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-xs font-bold text-gray-700">
                    {student.application_number}
                  </span>

                </div>

              </div>

            </div>

            {/* =================================================
                STATUS BANNER
            ================================================= */}

            <section className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

              <div className="grid md:grid-cols-2">

                <div className="p-6 sm:p-7">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">

                      {isApproved ? (
                        <CheckCircle2 size={22} />
                      ) : isRejected ? (
                        <AlertCircle size={22} />
                      ) : (
                        <Clock3 size={22} />
                      )}

                    </div>

                    <div>

                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        Application Status
                      </p>

                      <span
                        className={`mt-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${applicationStatusClass}`}
                      >

                        <span className="h-1.5 w-1.5 rounded-full bg-current" />

                        {applicationStatus}

                      </span>

                    </div>

                  </div>

                </div>

                <div className="border-t bg-[#fafcfb] p-6 md:border-l md:border-t-0 sm:p-7">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d7a93b]/15 text-[#a67d13]">

                      <CreditCard size={22} />

                    </div>

                    <div>

                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        Application Fee
                      </p>

                      <div className="mt-1 flex items-center gap-3">

                        <p className="text-lg font-bold text-[#0c1f1a]">
                          KSh{' '}
                          {Number(
                            student.application_fee || 0
                          ).toLocaleString()}
                        </p>

                        <span
                          className={`
                            rounded-full border px-2.5 py-1 text-xs font-semibold
                            ${
                              isPaid
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-amber-200 bg-amber-50 text-amber-700'
                            }
                          `}
                        >
                          {paymentStatus}
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                PERSONAL INFORMATION
            ================================================= */}

            <ApplicationSection
              title="Personal Information"
              description="Your personal details as submitted in the application."
              icon={
                <UserRound size={20} />
              }
            >

              <InfoGrid>

                <InfoItem
                  label="First Name"
                  value={student.first_name}
                />

                <InfoItem
                  label="Middle Name"
                  value={student.middle_name}
                />

                <InfoItem
                  label="Surname"
                  value={student.surname}
                />

                <InfoItem
                  label="Date of Birth"
                  value={
                    student.date_of_birth
                      ? new Date(
                          student.date_of_birth
                        ).toLocaleDateString(
                          'en-KE'
                        )
                      : '—'
                  }
                />

                <InfoItem
                  label="Gender"
                  value={student.gender}
                />

                <InfoItem
                  label="Nationality"
                  value={student.nationality}
                />

                <InfoItem
                  label="Country"
                  value={student.country}
                />

                <InfoItem
                  label="ID / Passport Number"
                  value={
                    student.id_passport_number
                  }
                />

                <InfoItem
                  label="Marital Status"
                  value={student.marital_status}
                />

              </InfoGrid>

            </ApplicationSection>

            {/* =================================================
                CONTACT INFORMATION
            ================================================= */}

            <ApplicationSection
              title="Contact Information"
              description="Your contact and residential information."
              icon={
                <MapPin size={20} />
              }
            >

              <InfoGrid>

                <InfoItem
                  label="Mobile Number"
                  value={student.mobile}
                />

                <InfoItem
                  label="Email Address"
                  value={student.email}
                />

                <InfoItem
                  label="County"
                  value={student.county}
                />

                <InfoItem
                  label="Town"
                  value={student.town}
                />

                <InfoItem
                  label="Postal Address"
                  value={student.postal_address}
                />

                <InfoItem
                  label="Postal Code"
                  value={student.postal_code}
                />

              </InfoGrid>

            </ApplicationSection>

            {/* =================================================
                ACADEMIC INFORMATION
            ================================================= */}

            <ApplicationSection
              title="Academic Information"
              description="Academic qualifications and KCSE information provided in your application."
              icon={
                <BookOpen size={20} />
              }
            >

              <InfoGrid>

                <InfoItem
                  label="KCSE Index Number"
                  value={student.kcse_index}
                />

                <InfoItem
                  label="KCSE Year"
                  value={student.kcse_year}
                />

                <InfoItem
                  label="KCSE Mean Grade"
                  value={student.kcse_mean_grade}
                  highlight
                />

                <InfoItem
                  label="Previous Institution"
                  value={
                    student.previous_institution
                  }
                />

                <InfoItem
                  label="Highest Qualification"
                  value={
                    student.highest_qualification
                  }
                />

              </InfoGrid>

              <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100">

                <table className="w-full min-w-[650px] text-left text-sm">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="px-4 py-3 font-semibold text-gray-500">
                        Subject
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-500">
                        Grade
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    <GradeRow
                      subject="English"
                      grade={student.english_grade}
                    />

                    <GradeRow
                      subject="Kiswahili"
                      grade={student.kiswahili_grade}
                    />

                    <GradeRow
                      subject="Biology"
                      grade={student.biology_grade}
                    />

                    <GradeRow
                      subject="Chemistry"
                      grade={student.chemistry_grade}
                    />

                    <GradeRow
                      subject="Physics"
                      grade={student.physics_grade}
                    />

                    <GradeRow
                      subject="Mathematics"
                      grade={student.mathematics_grade}
                    />

                  </tbody>

                </table>

              </div>

            </ApplicationSection>

            {/* =================================================
                COURSE INFORMATION
            ================================================= */}

            <ApplicationSection
              title="Course & Intake"
              description="Your selected programme and intake."
              icon={
                <GraduationCap size={20} />
              }
            >

              <div className="grid gap-5 md:grid-cols-2">

                <InfoItem
                  label="Selected Course"
                  value={student.course}
                  highlight
                />

                <InfoItem
                  label="Selected Intake"
                  value={student.intake}
                  highlight
                />

              </div>

            </ApplicationSection>

            {/* =================================================
                SPONSOR INFORMATION
            ================================================= */}

            <ApplicationSection
              title="Sponsor Information"
              description="Sponsor information provided in your application."
              icon={
                <Users size={20} />
              }
            >

              <InfoGrid>

                <InfoItem
                  label="Sponsor Type"
                  value={student.sponsor_type}
                />

                <InfoItem
                  label="Sponsor Name"
                  value={student.sponsor_name}
                />

                <InfoItem
                  label="Relationship"
                  value={
                    student.sponsor_relationship
                  }
                />

                <InfoItem
                  label="Mobile Number"
                  value={
                    student.sponsor_mobile
                  }
                />

                <InfoItem
                  label="Email Address"
                  value={
                    student.sponsor_email
                  }
                />

              </InfoGrid>

            </ApplicationSection>

            {/* =================================================
                GUARDIAN INFORMATION
            ================================================= */}

            <ApplicationSection
              title="Parent / Guardian Information"
              description="Parent or guardian information provided in your application."
              icon={
                <User size={20} />
              }
            >

              <InfoGrid>

                <InfoItem
                  label="Name"
                  value={student.guardian_name}
                />

                <InfoItem
                  label="Relationship"
                  value={
                    student.guardian_relationship
                  }
                />

                <InfoItem
                  label="Mobile Number"
                  value={
                    student.guardian_mobile
                  }
                />

                <InfoItem
                  label="Email Address"
                  value={
                    student.guardian_email
                  }
                />

              </InfoGrid>

            </ApplicationSection>

            {/* =================================================
                APPLICATION RECORD
            ================================================= */}

            <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">

                  <ShieldCheck size={21} />

                </div>

                <div>

                  <h3 className="font-bold text-[#0c1f1a]">
                    Application Record
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    This information represents the application submitted to Shifah Medical Training College.
                  </p>

                </div>

              </div>

              <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">

                <InfoItem
                  label="Application Number"
                  value={
                    student.application_number
                  }
                />

                <InfoItem
                  label="Date Submitted"
                  value={applicationDate}
                />

                <InfoItem
                  label="Application Status"
                  value={applicationStatus}
                  highlight
                />

              </div>

            </section>

            {/* =================================================
                NOTICE
            ================================================= */}

            <div className="mt-6 rounded-2xl border border-[#d7a93b]/20 bg-[#fffdf5] p-5">

              <div className="flex gap-3">

                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-[#a67d13]"
                />

                <div>

                  <p className="text-sm font-semibold text-[#0c1f1a]">
                    Need to correct something?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Your application information is an official admission record. If you notice an error, please contact the admissions office rather than submitting another application.
                  </p>

                  <Link
                    href="/student/dashboard/contact"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0f4f3f] hover:text-[#a67d13]"
                  >
                    Contact Admissions

                    <ChevronRight size={16} />

                  </Link>

                </div>

              </div>

            </div>

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
   APPLICATION SECTION
========================================================= */

function ApplicationSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">

      <div className="flex items-start gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">
          {icon}
        </div>

        <div>

          <h3 className="font-bold text-[#0c1f1a]">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            {description}
          </p>

        </div>

      </div>

      <div className="mt-6">
        {children}
      </div>

    </section>
  );
}

/* =========================================================
   INFO GRID
========================================================= */

function InfoGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p
        className={`
          mt-1.5 break-words text-sm font-semibold
          ${
            highlight
              ? 'text-[#0f4f3f]'
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
   GRADE ROW
========================================================= */

function GradeRow({
  subject,
  grade,
}: {
  subject: string;
  grade: string | null | undefined;
}) {
  return (
    <tr>

      <td className="px-4 py-3 font-medium text-gray-700">
        {subject}
      </td>

      <td className="px-4 py-3">

        <span className="inline-flex min-w-10 items-center justify-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
          {grade || '—'}
        </span>

      </td>

    </tr>
  );
}

