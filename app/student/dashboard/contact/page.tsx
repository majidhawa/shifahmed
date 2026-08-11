
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import pool from '@/lib/db';
import { getStudentSession } from '@/lib/student-auth';

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
  Mail,
  MapPin,
  MessageCircle,
  Clock3,
  ShieldCheck,
  ArrowLeft,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

/* =========================================================
   CONTACT ADMISSIONS PAGE
========================================================= */

export default async function StudentContactAdmissionsPage() {
  /* =======================================================
     CHECK SESSION
  ======================================================= */

  const session = await getStudentSession();

  if (!session) {
    redirect('/student/login');
  }

  /* =======================================================
     GET AUTHENTICATED STUDENT
  ======================================================= */

  const result = await pool.query(
    `
      SELECT
        id,
        application_number,
        first_name,
        middle_name,
        surname,
        mobile,
        email,
        course,
        intake,
        application_status,
        payment_status

      FROM applications

      WHERE id = $1
        AND application_number = $2

      LIMIT 1
    `,
    [session.applicationId, session.applicationNumber]
  );

  /* =======================================================
     APPLICATION NOT FOUND
  ======================================================= */

  if (result.rows.length === 0) {
    redirect('/student/login');
  }

  const student = result.rows[0];

  /* =======================================================
     STUDENT DETAILS
  ======================================================= */

  const fullName = [
    student.first_name,
    student.middle_name,
    student.surname,
  ]
    .filter(Boolean)
    .join(' ');

  const firstName = student.first_name || 'Student';

  const studentInitial =
    fullName.charAt(0).toUpperCase() || 'S';

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f8faf9]">

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

            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-white/10">

              <Image
                src="/images/logo.jpg"
                alt="Shifah Medical Training College"
                fill
                priority
                sizes="48px"
                className="object-contain p-1"
              />

            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-bold tracking-wide text-white">
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
                {fullName || 'Student'}
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

        <nav className="flex-1 overflow-y-auto px-4 py-6">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
            Main Menu
          </p>

          <div className="space-y-1">

            <SidebarItem
              href="/student/dashboard"
              icon={<LayoutDashboard size={19} />}
              label="Dashboard"
            />

            <SidebarItem
              href="/student/dashboard/application"
              icon={<FileText size={19} />}
              label="My Application"
            />

            <SidebarItem
              href="/student/dashboard/payment"
              icon={<CreditCard size={19} />}
              label="Payment & Receipt"
            />

            <SidebarItem
              href="/student/dashboard/admission"
              icon={<GraduationCap size={19} />}
              label="Admission"
            />

            <SidebarItem
              href="/student/dashboard/documents"
              icon={<FolderOpen size={19} />}
              label="My Documents"
            />

            <SidebarItem
              href="/student/dashboard/profile"
              icon={<User size={19} />}
              label="My Profile"
            />

          </div>

          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
            Support
          </p>

          <SidebarItem
            href="/student/dashboard/contact"
            icon={<Phone size={19} />}
            label="Contact Admissions"
            active
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

            <div className="flex items-center gap-3">

              {/* MOBILE LOGO */}

              <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 lg:hidden">

                <Image
                  src="/images/logo.jpg"
                  alt="Shifah Medical Training College"
                  fill
                  sizes="44px"
                  className="object-contain p-1"
                />

              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#0f4f3f]">
                  Student Portal
                </p>

                <h1 className="mt-1 text-xl font-bold text-[#0c1f1a]">
                  Contact Admissions
                </h1>

              </div>

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

          <div className="mx-auto max-w-6xl">

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
                INTRO
            ================================================= */}

            <div className="mb-8">

              <p className="text-sm font-semibold text-[#0f4f3f]">
                Student Support
              </p>

              <h2 className="mt-1 text-2xl font-bold text-[#0c1f1a] sm:text-3xl">
                Contact Admissions
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Need help with your application, payment, admission,
                documents, or any other student portal issue?
                Contact the admissions office using the information below.
              </p>

            </div>

            {/* =================================================
                APPLICATION REFERENCE
            ================================================= */}

            <section className="mb-6 overflow-hidden rounded-2xl bg-[#0c1f1a] p-6 text-white shadow-sm sm:p-7">

              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d7a93b] text-[#0c1f1a]">

                    <ShieldCheck size={21} />

                  </div>

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      Your Application Reference
                    </p>

                    <p className="mt-1 font-mono text-lg font-bold text-white">
                      {student.application_number}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/50">
                      Please provide this application number whenever
                      contacting admissions about your application.
                    </p>

                  </div>

                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">

                  <p className="text-xs text-white/40">
                    Applicant
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {fullName || 'Student'}
                  </p>

                </div>

              </div>

            </section>

            {/* =================================================
                CONTACT OPTIONS
            ================================================= */}

            <div className="grid gap-6 md:grid-cols-2">

              {/* PHONE */}

              <ContactCard
                icon={<Phone size={23} />}
                title="Call Admissions"
                description="Speak directly with the admissions office for assistance with your application."
              >

                <a
                  href="tel:+254142068933"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0f4f3f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c1f1a]"
                >

                  <Phone size={17} />

                  Call Admissions

                </a>

              </ContactCard>

              {/* EMAIL */}

              <ContactCard
                icon={<Mail size={23} />}
                title="Email Admissions"
                description="Send an email if your question requires documentation or a detailed response."
              >

                <a
                  href="mailto:admissions@shifahmedicalcollege.ac.ke"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0f4f3f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c1f1a]"
                >

                  <Mail size={17} />

                  Email Admissions

                </a>

              </ContactCard>

              {/* WHATSAPP */}

              <ContactCard
                icon={<MessageCircle size={23} />}
                title="WhatsApp Admissions"
                description="Use WhatsApp for quick questions and assistance regarding your application."
              >

                <a
                  href="https://wa.me/254142068933"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0f4f3f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c1f1a]"
                >

                  <MessageCircle size={17} />

                  Open WhatsApp

                  <ExternalLink size={15} />

                </a>

              </ContactCard>

              {/* LOCATION */}

              <ContactCard
                icon={<MapPin size={23} />}
                title="Visit the College"
                description="For in-person assistance, visit the college admissions office during working hours."
              >

                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0f4f3f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c1f1a]"
                >

                  <MapPin size={17} />

                  College Contact Page

                  <ExternalLink size={15} />

                </a>

              </ContactCard>

            </div>

            {/* =================================================
                OFFICE HOURS
            ================================================= */}

            <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d7a93b]/15 text-[#a67d13]">

                  <Clock3 size={21} />

                </div>

                <div>

                  <h3 className="font-bold text-[#0c1f1a]">
                    Admissions Office Hours
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Contact the admissions office during official
                    working hours for the fastest response.
                  </p>

                </div>

              </div>

              <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">

                <OfficeHour
                  day="Monday – Friday"
                  hours="8:00 AM – 5:00 PM"
                />

                <OfficeHour
                  day="Saturday"
                  hours="Closed"
                />

                <OfficeHour
                  day="Sunday"
                  hours="Closed"
                />

              </div>

            </section>

            {/* =================================================
                COMMON QUESTIONS
            ================================================= */}

            <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">

                  <HelpCircle size={21} />

                </div>

                <div>

                  <h3 className="font-bold text-[#0c1f1a]">
                    What can Admissions help you with?
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    You can contact admissions regarding any issue
                    related to your application.
                  </p>

                </div>

              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">

                <HelpItem>
                  Application status
                </HelpItem>

                <HelpItem>
                  Application information corrections
                </HelpItem>

                <HelpItem>
                  M-Pesa payment issues
                </HelpItem>

                <HelpItem>
                  Payment receipt
                </HelpItem>

                <HelpItem>
                  Admission letter
                </HelpItem>

                <HelpItem>
                  Required documents
                </HelpItem>

                <HelpItem>
                  Course and intake information
                </HelpItem>

                <HelpItem>
                  Registration and reporting information
                </HelpItem>

              </div>

            </section>

            {/* =================================================
                SECURITY NOTICE
            ================================================= */}

            <div className="mt-6 rounded-2xl border border-[#d7a93b]/20 bg-[#fffdf5] p-5">

              <div className="flex gap-3">

                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-[#a67d13]"
                />

                <div>

                  <p className="text-sm font-semibold text-[#0c1f1a]">
                    Keep your application number private
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    When contacting admissions, provide your application
                    number so staff can locate your record quickly.
                    Do not share your student portal password or login
                    credentials with anyone.
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="py-8 text-center">

              <div className="mb-4 flex justify-center">

                <div className="relative h-12 w-36">

                  <Image
                    src="/images/logo.jpg"
                    alt="Shifah Medical Training College"
                    fill
                    sizes="144px"
                    className="object-contain"
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
   CONTACT CARD
========================================================= */

function ContactCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-7">

      <div className="flex items-start gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">
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

      <div className="mt-5">
        {children}
      </div>

    </section>
  );
}

/* =========================================================
   OFFICE HOURS
========================================================= */

function OfficeHour({
  day,
  hours,
}: {
  day: string;
  hours: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">

      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {day}
      </p>

      <p className="mt-1 text-sm font-bold text-[#0c1f1a]">
        {hours}
      </p>

    </div>
  );
}

/* =========================================================
   HELP ITEM
========================================================= */

function HelpItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">

      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0f4f3f]/10 text-[#0f4f3f]">

        <ChevronRight size={14} />

      </span>

      <span className="text-sm font-medium text-gray-700">
        {children}
      </span>

    </div>
  );
}

