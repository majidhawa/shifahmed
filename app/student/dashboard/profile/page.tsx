
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
  Phone,
  LogOut,
  ChevronRight,
  UserRound,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  IdCard,
  Users,
  AlertCircle,
} from 'lucide-react';

/* =========================================================
   MY PROFILE PAGE
========================================================= */

export default async function StudentProfilePage() {

  /* =======================================================
     CHECK SESSION
  ======================================================= */

  const session = await getStudentSession();

  if (!session) {
    redirect('/student/login');
  }

  /* =======================================================
     GET AUTHENTICATED STUDENT APPLICATION
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

        application_status,
        payment_status,
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
  ].includes(
    applicationStatusLower
  );

  const isPaid =
    paymentStatusLower === 'paid';

  /* =======================================================
     STATUS CLASSES
  ======================================================= */

  let applicationStatusClass =
    'border-amber-200 bg-amber-50 text-amber-700';

  if (isApproved) {
    applicationStatusClass =
      'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (
    [
      'rejected',
      'declined',
    ].includes(
      applicationStatusLower
    )
  ) {
    applicationStatusClass =
      'border-red-200 bg-red-50 text-red-700';
  }

  const paymentStatusClass = isPaid
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f7f9f8]">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-[#0c1f1a] text-white lg:flex">

        {/* =================================================
            OFFICIAL LOGO / BRAND
        ================================================= */}

        <div className="flex h-20 items-center border-b border-white/10 px-5">

          <Link
            href="/student/dashboard"
            className="flex items-center gap-3"
          >

            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-white/20">

              <Image
                src="/images/logo.jpg"
                alt="Shifah Medical Training College Logo"
                width={48}
                height={48}
                className="h-full w-full object-contain"
                priority
              />

            </div>

            <div>

              <p className="text-sm font-bold tracking-wide text-white">
                SHIFAH MTC
              </p>

              <p className="text-xs text-white/50">
                Student Portal
              </p>

            </div>

          </Link>

        </div>

        {/* =================================================
            PROFILE
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
              active
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

              <LogOut size={19} />

              Logout

            </button>

          </form>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="lg:pl-72">

        {/* =================================================
            TOP HEADER
        ================================================= */}

        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">

          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">

            {/* MOBILE / TABLET BRAND */}

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:hidden">

                <Image
                  src="/images/logo.jpg"
                  alt="Shifah Medical Training College Logo"
                  width={44}
                  height={44}
                  className="h-full w-full object-contain"
                />

              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0f4f3f]">
                  Student Portal
                </p>

                <h1 className="mt-1 text-xl font-bold text-[#0c1f1a]">
                  My Profile
                </h1>

              </div>

            </div>

            {/* STUDENT HEADER */}

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

            {/* =================================================
                BACK
            ================================================= */}

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

              <p className="text-sm font-semibold text-[#0f4f3f]">
                Account Information
              </p>

              <h2 className="mt-1 text-2xl font-bold text-[#0c1f1a] sm:text-3xl">
                My Profile
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                View the personal and contact information associated
                with your student application.
              </p>

            </div>

            {/* =================================================
                PROFILE SUMMARY
            ================================================= */}

            <section className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

              <div className="bg-[#0c1f1a] px-6 py-8 sm:px-8">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-4">

                    {/* OFFICIAL LOGO */}

                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-4 ring-white/10">

                      <Image
                        src="/images/logo.jpg"
                        alt="Shifah Medical Training College Logo"
                        width={64}
                        height={64}
                        className="h-full w-full object-contain"
                      />

                    </div>

                    <div>

                      <h3 className="text-xl font-bold text-white">
                        {fullName || 'Student'}
                      </h3>

                      <p className="mt-1 text-sm text-white/50">
                        Student Applicant
                      </p>

                    </div>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">

                      <span className="h-1.5 w-1.5 rounded-full bg-[#d7a93b]" />

                      {student.application_number}

                    </span>

                  </div>

                </div>

              </div>

              <div className="grid divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

                <ProfileSummary
                  label="Application Status"
                  value={applicationStatus}
                  className={applicationStatusClass}
                />

                <ProfileSummary
                  label="Payment Status"
                  value={paymentStatus}
                  className={paymentStatusClass}
                />

                <ProfileSummary
                  label="Application Date"
                  value={applicationDate}
                />

              </div>

            </section>

            {/* =================================================
                PERSONAL INFORMATION
            ================================================= */}

            <ProfileSection
              title="Personal Information"
              description="Your personal identification details."
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
                          'en-KE',
                          {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }
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
                  label="Marital Status"
                  value={student.marital_status}
                />

              </InfoGrid>

            </ProfileSection>

            {/* =================================================
                IDENTIFICATION
            ================================================= */}

            <ProfileSection
              title="Identification"
              description="Identification information submitted with your application."
              icon={
                <IdCard size={20} />
              }
            >

              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-5">

                <div className="flex items-start gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f4f3f]/10 text-[#0f4f3f]">

                    <IdCard size={19} />

                  </div>

                  <div>

                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      ID / Passport Number
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-800">
                      {student.id_passport_number || '—'}
                    </p>

                  </div>

                </div>

              </div>

            </ProfileSection>

            {/* =================================================
                CONTACT INFORMATION
            ================================================= */}

            <ProfileSection
              title="Contact Information"
              description="Your current communication and residential details."
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

            </ProfileSection>

            {/* =================================================
                COURSE INFORMATION
            ================================================= */}

            <ProfileSection
              title="Programme Information"
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

            </ProfileSection>

            {/* =================================================
                SPONSOR INFORMATION
            ================================================= */}

            <ProfileSection
              title="Sponsor Information"
              description="Sponsor details submitted during your application."
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
                  value={student.sponsor_relationship}
                />

                <InfoItem
                  label="Mobile Number"
                  value={student.sponsor_mobile}
                />

                <InfoItem
                  label="Email Address"
                  value={student.sponsor_email}
                />

              </InfoGrid>

            </ProfileSection>

            {/* =================================================
                GUARDIAN INFORMATION
            ================================================= */}

            <ProfileSection
              title="Parent / Guardian"
              description="Parent or guardian information associated with your application."
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
                  value={student.guardian_relationship}
                />

                <InfoItem
                  label="Mobile Number"
                  value={student.guardian_mobile}
                />

                <InfoItem
                  label="Email Address"
                  value={student.guardian_email}
                />

              </InfoGrid>

            </ProfileSection>

            {/* =================================================
                SECURITY / RECORD NOTICE
            ================================================= */}

            <section className="mt-6 rounded-2xl border border-[#0f4f3f]/10 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">

                  <ShieldCheck size={21} />

                </div>

                <div>

                  <h3 className="font-bold text-[#0c1f1a]">
                    Secure Student Record
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Your profile information is retrieved from your
                    authenticated student application. Only information
                    belonging to your authenticated application is
                    displayed here.
                  </p>

                </div>

              </div>

              <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">

                <InfoItem
                  label="Application Number"
                  value={student.application_number}
                  highlight
                />

                <InfoItem
                  label="Application Date"
                  value={applicationDate}
                />

              </div>

            </section>

            {/* =================================================
                CORRECTION NOTICE
            ================================================= */}

            <div className="mt-6 rounded-2xl border border-[#d7a93b]/20 bg-[#fffdf5] p-5">

              <div className="flex gap-3">

                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-[#a67d13]"
                />

                <div>

                  <p className="text-sm font-semibold text-[#0c1f1a]">
                    Need to update your information?
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Your profile details form part of your official
                    admission record. If any information is incorrect,
                    please contact the admissions office for assistance
                    rather than creating another application.
                  </p>

                  <Link
                    href="/student/dashboard/contact"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0f4f3f] transition hover:text-[#a67d13]"
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

              <div className="mb-4 flex justify-center">

                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

                  <Image
                    src="/images/logo.jpg"
                    alt="Shifah Medical Training College Logo"
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                  />

                </div>

              </div>

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
   PROFILE SUMMARY
========================================================= */

function ProfileSummary({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="p-5 sm:p-6">

      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
        {label}
      </p>

      <span
        className={`
          mt-2 inline-flex rounded-full border
          px-3 py-1 text-xs font-semibold
          ${
            className ||
            'border-gray-200 bg-gray-50 text-gray-700'
          }
        `}
      >
        {value}
      </span>

    </div>
  );
}

/* =========================================================
   PROFILE SECTION
========================================================= */

function ProfileSection({
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
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
  value: string | null | undefined;
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

