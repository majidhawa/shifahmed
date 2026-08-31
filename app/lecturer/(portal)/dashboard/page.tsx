import { redirect } from 'next/navigation';
import Link from 'next/link';

import {
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ClipboardList,
  Users,
  PlusCircle,
  BarChart3,
  Video,
  Layers3,
  ListTree,
  BookMarked,
} from 'lucide-react';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/* =========================================================
   TYPES
========================================================= */

type DashboardStats = {
  courses: number;
  students: number;
  units: number;
  topics: number;
  lessons: number;
  materials: number;
  videos: number;
  assignments: number;
  quizzes: number;
};

/* =========================================================
   GET DASHBOARD STATISTICS
========================================================= */

async function getDashboardStats(
  lecturerId: number
): Promise<DashboardStats> {
  /*
   * Lecturer
   *    ↓
   * lms_lecturer_programs
   *    ↓
   * lms_programs
   *    ↓
   * lms_units
   *    ↓
   * lms_topics
   *    ↓
   * lms_lessons
   *
   * All lecturer statistics are therefore restricted
   * to programs assigned to the authenticated lecturer.
   */

  const result = await pool.query(
    `
      WITH lecturer_programs AS (

        SELECT DISTINCT
          lp.program_id

        FROM lms_lecturer_programs lp

        INNER JOIN lms_programs p
          ON p.id = lp.program_id

        WHERE lp.lecturer_id = $1

      ),

      lecturer_units AS (

        SELECT DISTINCT
          u.id

        FROM lms_units u

        INNER JOIN lecturer_programs lp
          ON lp.program_id = u.program_id

      ),

      lecturer_topics AS (

        SELECT DISTINCT
          t.id

        FROM lms_topics t

        INNER JOIN lecturer_units u
          ON u.id = t.unit_id

      ),

      lecturer_lessons AS (

        SELECT DISTINCT
          l.id

        FROM lms_lessons l

        INNER JOIN lecturer_topics t
          ON t.id = l.topic_id

      )

      SELECT

        /* =================================================
           COURSES
        ================================================= */

        (
          SELECT COUNT(*)::int
          FROM lecturer_programs
        ) AS courses,


        /* =================================================
           STUDENTS

           lms_enrollments contains:

           application_id
           program_id

           It does NOT contain student_id.

           Therefore application_id is used to identify
           unique enrolled students/applications.
        ================================================= */

        (
          SELECT COUNT(DISTINCT e.application_id)::int

          FROM lms_enrollments e

          INNER JOIN lecturer_programs lp
            ON lp.program_id = e.program_id

        ) AS students,


        /* =================================================
           UNITS
        ================================================= */

        (
          SELECT COUNT(*)::int
          FROM lecturer_units
        ) AS units,


        /* =================================================
           TOPICS
        ================================================= */

        (
          SELECT COUNT(*)::int
          FROM lecturer_topics
        ) AS topics,


        /* =================================================
           LESSONS
        ================================================= */

        (
          SELECT COUNT(*)::int
          FROM lecturer_lessons
        ) AS lessons,


        /* =================================================
           LEARNING MATERIALS

           Correct table:

           lms_lesson_documents
        ================================================= */

        (
          SELECT COUNT(*)::int

          FROM lms_lesson_documents d

          INNER JOIN lecturer_lessons ll
            ON ll.id = d.lesson_id

        ) AS materials,


        /* =================================================
           VIDEOS
        ================================================= */

        (
          SELECT COUNT(*)::int

          FROM lms_lesson_videos v

          INNER JOIN lecturer_lessons ll
            ON ll.id = v.lesson_id

        ) AS videos,


        /* =================================================
           ASSIGNMENTS
        ================================================= */

        (
          SELECT COUNT(*)::int

          FROM lms_assignments a

          INNER JOIN lecturer_lessons ll
            ON ll.id = a.lesson_id

        ) AS assignments,


        /* =================================================
           QUIZZES
        ================================================= */

        (
          SELECT COUNT(*)::int

          FROM lms_quizzes q

          INNER JOIN lecturer_lessons ll
            ON ll.id = q.lesson_id

        ) AS quizzes

    `,
    [lecturerId]
  );

  const row = result.rows[0];

  return {
    courses: Number(row.courses || 0),
    students: Number(row.students || 0),
    units: Number(row.units || 0),
    topics: Number(row.topics || 0),
    lessons: Number(row.lessons || 0),
    materials: Number(row.materials || 0),
    videos: Number(row.videos || 0),
    assignments: Number(row.assignments || 0),
    quizzes: Number(row.quizzes || 0),
  };
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconBackground,
  iconColor,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  iconBackground: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between gap-4">

        <div className="min-w-0">

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-brand-dark">
            {value}
          </p>

        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBackground}`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>

      </div>

      <p className="mt-5 text-xs leading-5 text-slate-400">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   MANAGEMENT CARD
========================================================= */

function ManagementCard({
  href,
  title,
  description,
  action,
  icon: Icon,
  iconBackground,
  iconColor,
}: {
  href: string;
  title: string;
  description: string;
  action: string;
  icon: React.ElementType;
  iconBackground: string;
  iconColor: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:border-brand-green/30 hover:shadow-lg"
    >

      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBackground}`}
      >
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-brand-dark">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <span className="mt-4 inline-flex text-sm font-bold text-brand-green transition group-hover:text-brand-gold">
        {action} →
      </span>

    </Link>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function LecturerDashboardPage() {

  /* =======================================================
     AUTHENTICATE LECTURER
  ======================================================= */

  const lecturer = await requireLecturer();

  if (!lecturer) {
    redirect('/lecturer/login');
  }

  /* =======================================================
     GET REAL DATABASE STATISTICS
  ======================================================= */

  const stats = await getDashboardStats(
    Number(lecturer.id)
  );

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
                Lecturer Portal
              </p>

              <h1 className="mt-1 text-2xl font-bold text-brand-dark sm:text-3xl">
                Welcome, {lecturer.name}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage your assigned courses, curriculum, lessons,
                learning materials, videos and assessments from one
                central workspace.
              </p>

            </div>

            <div className="flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2">

              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

              <span className="text-xs font-bold text-green-700">
                Account Active
              </span>

            </div>

          </div>

        </div>

        {/* ==================================================
            WELCOME BANNER
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
                Everything you need to manage your assigned courses,
                curriculum, lessons and learning resources is available
                here.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">

                <Link
                  href="/lecturer/dashboard/courses"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-green transition hover:bg-brand-gold hover:text-brand-dark"
                >
                  <BookOpen className="h-4 w-4" />
                  My Courses
                </Link>

                <Link
                  href="/lecturer/dashboard/profile"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  <Users className="h-4 w-4" />
                  My Profile
                </Link>

              </div>

            </div>

            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[40px] border-brand-gold/10" />

            <div className="pointer-events-none absolute -bottom-28 right-20 h-56 w-56 rounded-full border-[30px] border-white/5" />

          </div>

        </div>

        {/* ==================================================
            MAIN STATISTICS
        ================================================== */}

        <section>

          <div className="mb-5">

            <h2 className="text-lg font-bold text-brand-dark">
              Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Real-time statistics from your assigned courses.
            </p>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="My Courses"
              value={stats.courses}
              description="Programs assigned to you"
              icon={BookOpen}
              iconBackground="bg-brand-green/10"
              iconColor="text-brand-green"
            />

            <StatCard
              title="My Students"
              value={stats.students}
              description="Enrolled students in your assigned programs"
              icon={GraduationCap}
              iconBackground="bg-brand-gold/15"
              iconColor="text-brand-gold"
            />

            <StatCard
              title="Assignments"
              value={stats.assignments}
              description="Assignments attached to your lessons"
              icon={ClipboardCheck}
              iconBackground="bg-brand-green/10"
              iconColor="text-brand-green"
            />

            <StatCard
              title="Quizzes & Exams"
              value={stats.quizzes}
              description="Quizzes attached to your lessons"
              icon={BarChart3}
              iconBackground="bg-brand-gold/15"
              iconColor="text-brand-gold"
            />

          </div>

        </section>

        {/* ==================================================
            CURRICULUM STATISTICS
        ================================================== */}

        <section className="mt-6">

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">

            <StatCard
              title="Units"
              value={stats.units}
              description="Units in your assigned programs"
              icon={Layers3}
              iconBackground="bg-brand-green/10"
              iconColor="text-brand-green"
            />

            <StatCard
              title="Topics"
              value={stats.topics}
              description="Topics inside your assigned units"
              icon={ListTree}
              iconBackground="bg-brand-gold/15"
              iconColor="text-brand-gold"
            />

            <StatCard
              title="Lessons"
              value={stats.lessons}
              description="Lessons inside your assigned courses"
              icon={BookMarked}
              iconBackground="bg-brand-green/10"
              iconColor="text-brand-green"
            />

            <StatCard
              title="Materials"
              value={stats.materials}
              description="Learning documents attached to lessons"
              icon={FileText}
              iconBackground="bg-brand-gold/15"
              iconColor="text-brand-gold"
            />

            <StatCard
              title="Videos"
              value={stats.videos}
              description="Videos attached to lessons"
              icon={Video}
              iconBackground="bg-brand-green/10"
              iconColor="text-brand-green"
            />

          </div>

        </section>

        {/* ==================================================
            TEACHING MANAGEMENT
        ================================================== */}

        <section className="mt-10">

          <div className="mb-5">

            <h2 className="text-lg font-bold text-brand-dark">
              Teaching Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Access and manage your teaching resources.
            </p>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {/* COURSES */}

            <ManagementCard
              href="/lecturer/dashboard/courses"
              title="My Courses"
              description="View the programs assigned to you and access their curriculum."
              action="Open Courses"
              icon={BookOpen}
              iconBackground="bg-brand-green/10"
              iconColor="text-brand-green"
            />

            {/* UNITS */}

            <ManagementCard
              href="/lecturer/dashboard/units"
              title="Course Units"
              description="View and manage units belonging to your assigned programs."
              action="Manage Units"
              icon={Layers3}
              iconBackground="bg-brand-gold/15"
              iconColor="text-brand-gold"
            />

            {/* TOPICS */}

            <ManagementCard
              href="/lecturer/dashboard/topics"
              title="Topics"
              description="Manage topics under the units assigned to your courses."
              action="Manage Topics"
              icon={ListTree}
              iconBackground="bg-brand-green/10"
              iconColor="text-brand-green"
            />

            {/* LESSONS */}

            <ManagementCard
              href="/lecturer/dashboard/lessons"
              title="Lessons"
              description="Create, edit and organize lessons under your course topics."
              action="Manage Lessons"
              icon={ClipboardList}
              iconBackground="bg-brand-gold/15"
              iconColor="text-brand-gold"
            />

            {/* MATERIALS */}

            <ManagementCard
              href="/lecturer/dashboard/lessons"
              title="Learning Materials"
              description="Open a lesson to upload and manage PDFs, notes and other documents."
              action="Open Lessons"
              icon={FileText}
              iconBackground="bg-brand-green/10"
              iconColor="text-brand-green"
            />

            {/* VIDEOS */}

            <ManagementCard
              href="/lecturer/dashboard/lessons"
              title="Lesson Videos"
              description="Open a lesson to add and manage uploaded or external videos."
              action="Open Lessons"
              icon={Video}
              iconBackground="bg-brand-gold/15"
              iconColor="text-brand-gold"
            />

            {/* ASSIGNMENTS */}

            <ManagementCard
              href="/lecturer/dashboard/assignments"
              title="Assignments"
              description="Create assignments and manage questions and marks for your lessons."
              action="Manage Assignments"
              icon={ClipboardCheck}
              iconBackground="bg-brand-green/10"
              iconColor="text-brand-green"
            />

            {/* QUIZZES */}

            <ManagementCard
              href="/lecturer/dashboard/quizzes"
              title="Quizzes & Exams"
              description="Create quizzes, manage questions and configure assessments."
              action="Manage Assessments"
              icon={BarChart3}
              iconBackground="bg-brand-gold/15"
              iconColor="text-brand-gold"
            />

          </div>

        </section>

        {/* ==================================================
            QUICK ACTIONS
        ================================================== */}

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

          <h2 className="text-lg font-bold text-brand-dark">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Frequently used lecturer functions.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">

            <Link
              href="/lecturer/dashboard/lessons"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              <PlusCircle className="h-4 w-4" />
              Manage Lessons
            </Link>

            <Link
              href="/lecturer/dashboard/lessons"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
            >
              <FileText className="h-4 w-4" />
              Add Material
            </Link>

            <Link
              href="/lecturer/dashboard/lessons"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
            >
              <Video className="h-4 w-4" />
              Add Video
            </Link>

            <Link
              href="/lecturer/dashboard/assignments"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
            >
              <ClipboardCheck className="h-4 w-4" />
              Create Assignment
            </Link>

            <Link
              href="/lecturer/dashboard/quizzes"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
            >
              <BarChart3 className="h-4 w-4" />
              Create Quiz
            </Link>

          </div>

        </section>

        {/* ==================================================
            CONTENT SUMMARY
        ================================================== */}

        <section className="mt-8">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">
                  Your Teaching Content
                </p>

                <h2 className="mt-1 text-lg font-bold text-brand-dark">
                  Curriculum at a glance
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Your lecturer account currently has access to{' '}
                  <span className="font-bold text-brand-dark">
                    {stats.courses}
                  </span>{' '}
                  course{stats.courses === 1 ? '' : 's'}, containing{' '}
                  <span className="font-bold text-brand-dark">
                    {stats.units}
                  </span>{' '}
                  unit{stats.units === 1 ? '' : 's'},{' '}
                  <span className="font-bold text-brand-dark">
                    {stats.topics}
                  </span>{' '}
                  topic{stats.topics === 1 ? '' : 's'} and{' '}
                  <span className="font-bold text-brand-dark">
                    {stats.lessons}
                  </span>{' '}
                  lesson{stats.lessons === 1 ? '' : 's'}.
                </p>

              </div>

              <Link
                href="/lecturer/dashboard/courses"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                <BookOpen className="h-4 w-4" />
                View Curriculum
              </Link>

            </div>

          </div>

        </section>

        {/* ==================================================
            ACCOUNT
        ================================================== */}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

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
              href="/lecturer/dashboard/profile"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
            >
              <Users className="h-4 w-4" />
              Manage Profile
            </Link>

          </div>

        </section>

        {/* ==================================================
            FOOTER
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

            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[40px] border-brand-gold/10" />

            <div className="pointer-events-none absolute -bottom-28 right-20 h-56 w-56 rounded-full border-[30px] border-white/5" />

          </div>

        </div>

      </div>

    </main>
  );
}