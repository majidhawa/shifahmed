import { redirect } from 'next/navigation';
import Link from 'next/link';

import {
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  CalendarCheck,
  Megaphone,
  ClipboardList,
  Users,
  PlusCircle,
  BarChart3,
  Bell,
} from 'lucide-react';

import { requireLecturer } from '@/lib/lecturer-auth';

/* =========================================================
   LECTURER DASHBOARD
   Shifah Medical Training College LMS

   IMPORTANT:
   This page must NEVER be statically cached.

   After logout, if the user presses the browser Back button,
   Next.js must perform a fresh server-side authentication check.
========================================================= */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/*
 * Prevent browser/proxy caching of this protected page.
 */
export const fetchCache = 'force-no-store';

/* =========================================================
   LECTURER DASHBOARD
========================================================= */

export default async function LecturerDashboardPage() {

  /* ========================================================
     GET CURRENT LECTURER
  ======================================================== */

  const lecturer = await requireLecturer();

  /* ========================================================
     PROTECT DASHBOARD
  ======================================================== */

  if (!lecturer) {
    redirect('/lecturer/login');
  }

  return (
    <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
            Lecturer Portal
          </p>

          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">
                Welcome, {lecturer.name}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage your courses, lessons, learning materials,
                assignments, quizzes, attendance and student grades
                from one central location.
              </p>

            </div>

            {/* ==================================================
                ACCOUNT STATUS
            ================================================== */}

            <div className="flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2">

              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

              <span className="text-xs font-bold text-green-700">
                Account Active
              </span>

            </div>

          </div>

        </div>

        {/* ==================================================
            LECTURER INFORMATION
        ================================================== */}

        <div className="mb-8 overflow-hidden rounded-3xl bg-brand-green shadow-soft">

          <div className="relative p-6 sm:p-8">

            <div className="relative z-10">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
                Shifah Medical Training College
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white">
                Lecturer Workspace
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                Welcome to your teaching workspace. Everything you
                need to manage your assigned courses and students is
                available from the lecturer portal.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">

                <Link
                  href="/lecturer/courses"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-green transition hover:bg-brand-gold hover:text-brand-dark"
                >
                  <BookOpen className="h-4 w-4" />
                  My Courses
                </Link>

                <Link
                  href="/lecturer/profile"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  <Users className="h-4 w-4" />
                  My Profile
                </Link>

              </div>

            </div>

            {/* ==================================================
                DECORATIVE CIRCLES
            ================================================== */}

            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[40px] border-brand-gold/10" />

            <div className="pointer-events-none absolute -bottom-28 right-20 h-56 w-56 rounded-full border-[30px] border-white/5" />

          </div>

        </div>

        {/* ==================================================
            QUICK STATISTICS
        ================================================== */}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {/* ==================================================
              MY COURSES
          ================================================== */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  My Courses
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  —
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">
                <BookOpen className="h-6 w-6 text-brand-green" />
              </div>

            </div>

            <p className="mt-5 text-xs text-slate-400">
              Courses assigned to you
            </p>

          </div>

          {/* ==================================================
              MY STUDENTS
          ================================================== */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  My Students
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  —
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/15">
                <GraduationCap className="h-6 w-6 text-brand-gold" />
              </div>

            </div>

            <p className="mt-5 text-xs text-slate-400">
              Students in your assigned courses
            </p>

          </div>

          {/* ==================================================
              ASSIGNMENTS
          ================================================== */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Assignments
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  —
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">
                <ClipboardCheck className="h-6 w-6 text-brand-green" />
              </div>

            </div>

            <p className="mt-5 text-xs text-slate-400">
              Assignments you've created
            </p>

          </div>

          {/* ==================================================
              QUIZZES & EXAMS
          ================================================== */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Quizzes & Exams
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  —
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/15">
                <FileText className="h-6 w-6 text-brand-gold" />
              </div>

            </div>

            <p className="mt-5 text-xs text-slate-400">
              Assessments you've created
            </p>

          </div>

        </div>

        {/* ==================================================
            TEACHING MANAGEMENT
        ================================================== */}

        <div className="mt-8">

          <div className="mb-5">

            <h2 className="text-lg font-bold text-brand-dark">
              Teaching Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your teaching activities and course content.
            </p>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {/* COURSES */}

            <Link
              href="/lecturer/courses"
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand-green/30 hover:shadow-lg"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">
                <BookOpen className="h-6 w-6 text-brand-green" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-brand-dark">
                My Courses
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                View and manage the courses assigned to you.
              </p>

              <span className="mt-4 inline-flex text-sm font-bold text-brand-green group-hover:text-brand-gold">
                Open Courses →
              </span>

            </Link>

            {/* LESSONS */}

            <Link
              href="/lecturer/lessons"
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand-green/30 hover:shadow-lg"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/15">
                <ClipboardList className="h-6 w-6 text-brand-gold" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-brand-dark">
                Lessons
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create and organize lessons for your courses.
              </p>

              <span className="mt-4 inline-flex text-sm font-bold text-brand-green group-hover:text-brand-gold">
                Manage Lessons →
              </span>

            </Link>

            {/* LEARNING MATERIALS */}

            <Link
              href="/lecturer/materials"
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand-green/30 hover:shadow-lg"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">
                <FileText className="h-6 w-6 text-brand-green" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-brand-dark">
                Learning Materials
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Upload notes, PDFs, videos and other course materials.
              </p>

              <span className="mt-4 inline-flex text-sm font-bold text-brand-green group-hover:text-brand-gold">
                Manage Materials →
              </span>

            </Link>

            {/* ASSIGNMENTS */}

            <Link
              href="/lecturer/assignments"
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand-green/30 hover:shadow-lg"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/15">
                <ClipboardCheck className="h-6 w-6 text-brand-gold" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-brand-dark">
                Assignments
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create assignments and review student submissions.
              </p>

              <span className="mt-4 inline-flex text-sm font-bold text-brand-green group-hover:text-brand-gold">
                Manage Assignments →
              </span>

            </Link>

            {/* QUIZZES */}

            <Link
              href="/lecturer/quizzes"
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand-green/30 hover:shadow-lg"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">
                <BarChart3 className="h-6 w-6 text-brand-green" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-brand-dark">
                Quizzes & Exams
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create quizzes, exams and manage assessment questions.
              </p>

              <span className="mt-4 inline-flex text-sm font-bold text-brand-green group-hover:text-brand-gold">
                Manage Assessments →
              </span>

            </Link>

            {/* ATTENDANCE */}

            <Link
              href="/lecturer/attendance"
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand-green/30 hover:shadow-lg"
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/15">
                <CalendarCheck className="h-6 w-6 text-brand-gold" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-brand-dark">
                Attendance
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Record and monitor attendance for your students.
              </p>

              <span className="mt-4 inline-flex text-sm font-bold text-brand-green group-hover:text-brand-gold">
                Take Attendance →
              </span>

            </Link>

          </div>

        </div>

        {/* ==================================================
            QUICK ACTIONS
        ================================================== */}

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

          <div>

            <h2 className="text-lg font-bold text-brand-dark">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Frequently used lecturer functions.
            </p>

          </div>

          <div className="mt-5 flex flex-wrap gap-3">

            <Link
              href="/lecturer/materials/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              <PlusCircle className="h-4 w-4" />
              Upload Material
            </Link>

            <Link
              href="/lecturer/lessons/new"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
            >
              <BookOpen className="h-4 w-4" />
              Create Lesson
            </Link>

            <Link
              href="/lecturer/assignments/new"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
            >
              <ClipboardCheck className="h-4 w-4" />
              Create Assignment
            </Link>

            <Link
              href="/lecturer/quizzes/new"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
            >
              <FileText className="h-4 w-4" />
              Create Quiz
            </Link>

            <Link
              href="/lecturer/attendance"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
            >
              <CalendarCheck className="h-4 w-4" />
              Take Attendance
            </Link>

          </div>

        </div>

        {/* ==================================================
            COMMUNICATION
        ================================================== */}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          {/* ANNOUNCEMENTS */}

          <Link
            href="/lecturer/announcements"
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:border-brand-green/30 hover:shadow-lg"
          >

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">
                <Megaphone className="h-6 w-6 text-brand-green" />
              </div>

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  Announcements
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Post important announcements for your students.
                </p>

              </div>

            </div>

            <span className="mt-5 inline-flex text-sm font-bold text-brand-green group-hover:text-brand-gold">
              Manage Announcements →
            </span>

          </Link>

          {/* NOTIFICATIONS */}

          <Link
            href="/lecturer/notifications"
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:border-brand-green/30 hover:shadow-lg"
          >

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/15">
                <Bell className="h-6 w-6 text-brand-gold" />
              </div>

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  Notifications
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  View updates and important LMS notifications.
                </p>

              </div>

            </div>

            <span className="mt-5 inline-flex text-sm font-bold text-brand-green group-hover:text-brand-gold">
              View Notifications →
            </span>

          </Link>

        </div>

        {/* ==================================================
            ACCOUNT INFORMATION
        ================================================== */}

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">
                Lecturer Account
              </p>

              <h2 className="mt-1 text-lg font-bold text-brand-dark">
                {lecturer.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {lecturer.email}
              </p>

              {lecturer.phone && (
                <p className="mt-1 text-sm text-slate-500">
                  {lecturer.phone}
                </p>
              )}

            </div>

            <Link
              href="/lecturer/profile"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
            >
              <Users className="h-4 w-4" />
              Manage Profile
            </Link>

          </div>

        </div>

        {/* ==================================================
            FOOTER MESSAGE
        ================================================== */}

        <div className="mt-8 overflow-hidden rounded-3xl bg-brand-green shadow-soft">

          <div className="relative p-7 sm:p-8">

            <div className="relative z-10 max-w-2xl">

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
                SMTC Lecturer Portal
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white">
                Health through innovation and research
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/70">
                Empowering lecturers to deliver quality education,
                manage learning resources and support student success.
              </p>

            </div>

            {/* Decorative circles */}

            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[40px] border-brand-gold/10" />

            <div className="pointer-events-none absolute -bottom-28 right-20 h-56 w-56 rounded-full border-[30px] border-white/5" />

          </div>

        </div>

      </div>

    </main>
  );
}