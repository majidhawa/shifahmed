import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers3,
  PlayCircle,
  Sparkles,
  Users,
} from 'lucide-react';

import pool from '@/lib/db';
import { getStudentSession } from '@/lib/student-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================================================
   STUDENT MY COURSES
   /student/dashboard/courses

   DATABASE RELATIONSHIP

   applications
        ↓
   lms_enrollments
        ↓
   lms_programs
        ↓
   lms_units
        ↓
   lms_topics
        ↓
   lms_lessons

   lms_unit_enrollments connects individual units to
   a student's LMS enrollment.
========================================================= */

interface Course {
  enrollment_id: number;
  program_id: number;

  program_name: string;
  program_code: string | null;
  program_description: string | null;
  duration: string | null;
  level: string | null;
  program_status: string;

  student_number: string | null;
  year_of_study: number | null;
  enrollment_status: string;

  enrolled_at: string;

  total_units: number;
  assigned_units: number;
  total_topics: number;
  total_lessons: number;
}

interface StudentInfo {
  name: string;
  applicationNumber: string | null;
  admissionNumber: string | null;
}

/* =========================================================
   PAGE
========================================================= */

export default async function StudentCoursesPage() {
  /* =======================================================
     AUTHENTICATION
  ======================================================= */

  const session = await getStudentSession();

  if (!session) {
    redirect('/student/login');
  }

  /*
   * The student session is expected to identify the student
   * through applicationId, which is already used throughout
   * the Student Portal.
   */
  const applicationId = Number(session.applicationId);

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    redirect('/student/login');
  }

  /* =======================================================
     GET STUDENT + ADMISSION INFORMATION
  ======================================================= */

  let student: StudentInfo = {
    name: 'Student',
    applicationNumber: null,
    admissionNumber: null,
  };

  try {
    const studentResult = await pool.query(
      `
        SELECT
          a.application_id,
          a.application_number,
          a.student_name,

          ad.admission_number

        FROM applications a

        LEFT JOIN admissions ad
          ON ad.application_id = a.application_id

        WHERE a.application_id = $1

        LIMIT 1
      `,
      [applicationId]
    );

    if (studentResult.rows.length > 0) {
      const row = studentResult.rows[0];

      student = {
        name: row.student_name || 'Student',
        applicationNumber:
          row.application_number || null,
        admissionNumber:
          row.admission_number || null,
      };
    }
  } catch (error) {
    console.error(
      'STUDENT COURSES - STUDENT INFORMATION ERROR:',
      error
    );
  }

  /* =======================================================
     GET ENROLLED PROGRAMS

     A student is connected to an LMS program through:

     lms_enrollments.application_id
              ↓
     lms_enrollments.program_id
              ↓
     lms_programs.id
  ======================================================= */

  let courses: Course[] = [];

  try {
    const coursesResult = await pool.query(
      `
        SELECT
          e.id AS enrollment_id,
          e.program_id,

          p.name AS program_name,
          p.code AS program_code,
          p.description AS program_description,
          p.duration,
          p.level,
          p.status AS program_status,

          e.student_number,
          e.year_of_study,
          e.enrollment_status,
          e.enrolled_at,

          COUNT(DISTINCT u.id)::int AS total_units,

          COUNT(
            DISTINCT CASE
              WHEN ue.id IS NOT NULL
               AND ue.status NOT IN ('cancelled', 'dropped')
              THEN u.id
            END
          )::int AS assigned_units,

          COUNT(DISTINCT t.id)::int AS total_topics,

          COUNT(DISTINCT l.id)::int AS total_lessons

        FROM lms_enrollments e

        INNER JOIN lms_programs p
          ON p.id = e.program_id

        LEFT JOIN lms_units u
          ON u.program_id = p.id

        LEFT JOIN lms_unit_enrollments ue
          ON ue.enrollment_id = e.id
         AND ue.unit_id = u.id

        LEFT JOIN lms_topics t
          ON t.unit_id = u.id

        LEFT JOIN lms_lessons l
          ON l.topic_id = t.id

        WHERE e.application_id = $1

        GROUP BY
          e.id,
          e.program_id,
          p.id,
          p.name,
          p.code,
          p.description,
          p.duration,
          p.level,
          p.status,
          e.student_number,
          e.year_of_study,
          e.enrollment_status,
          e.enrolled_at

        ORDER BY
          e.enrolled_at DESC,
          p.name ASC
      `,
      [applicationId]
    );

    courses = coursesResult.rows.map((row) => ({
      enrollment_id: Number(row.enrollment_id),
      program_id: Number(row.program_id),

      program_name: row.program_name,
      program_code: row.program_code || null,
      program_description:
        row.program_description || null,
      duration: row.duration || null,
      level: row.level || null,
      program_status: row.program_status,

      student_number: row.student_number || null,
      year_of_study:
        row.year_of_study !== null
          ? Number(row.year_of_study)
          : null,
      enrollment_status:
        row.enrollment_status,

      enrolled_at: row.enrolled_at,

      total_units: Number(row.total_units || 0),
      assigned_units: Number(row.assigned_units || 0),
      total_topics: Number(row.total_topics || 0),
      total_lessons: Number(row.total_lessons || 0),
    }));
  } catch (error) {
    console.error(
      'STUDENT COURSES - COURSES QUERY ERROR:',
      error
    );
  }

  /* =======================================================
     SUMMARY STATISTICS
  ======================================================= */

  const totalCourses = courses.length;

  const totalUnits = courses.reduce(
    (total, course) =>
      total + course.total_units,
    0
  );

  const totalAssignedUnits = courses.reduce(
    (total, course) =>
      total + course.assigned_units,
    0
  );

  const totalLessons = courses.reduce(
    (total, course) =>
      total + course.total_lessons,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
                <GraduationCap className="h-4 w-4" />

                <span>Student LMS</span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                My Courses
              </h1>

              <p className="mt-1 text-sm text-slate-500 sm:text-base">
                Welcome back, {student.name}. Continue your
                academic journey at Shifah Medical Training
                College.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Admission Number
                </p>

                <p className="text-sm font-bold text-slate-900">
                  {student.admissionNumber ||
                    student.applicationNumber ||
                    'Not available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* =================================================
            WELCOME BANNER
        ================================================= */}

        <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 shadow-lg">
          <div className="relative p-6 sm:p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />

            <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-yellow-400/5" />

            <div className="relative max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />

                Your Learning Journey
              </div>

              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Learn. Practice. Excel.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100/80 sm:text-base">
                Access your enrolled programs, explore units
                and lessons, complete assignments and quizzes,
                and track your academic progress from one
                place.
              </p>

              {student.admissionNumber && (
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                  <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-emerald-50">
                    Admission:{' '}
                    <strong>
                      {student.admissionNumber}
                    </strong>
                  </span>

                  {student.applicationNumber && (
                    <span className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-emerald-50">
                      Application:{' '}
                      <strong>
                        {student.applicationNumber}
                      </strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<GraduationCap className="h-5 w-5" />}
            label="My Courses"
            value={totalCourses}
            description="Enrolled programs"
          />

          <StatCard
            icon={<Layers3 className="h-5 w-5" />}
            label="Total Units"
            value={totalUnits}
            description={`${totalAssignedUnits} assigned to you`}
          />

          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            label="Lessons"
            value={totalLessons}
            description="Available learning content"
          />

          <StatCard
            icon={<Clock3 className="h-5 w-5" />}
            label="Learning Status"
            value={
              totalCourses > 0
                ? 'Active'
                : 'Pending'
            }
            description={
              totalCourses > 0
                ? 'Ready to learn'
                : 'Awaiting enrollment'
            }
          />
        </section>

        {/* =================================================
            COURSE SECTION
        ================================================= */}

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Your Enrolled Courses
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Programs currently connected to your LMS
                enrollment.
              </p>
            </div>

            {totalCourses > 0 && (
              <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">
                {totalCourses}{' '}
                {totalCourses === 1
                  ? 'Course'
                  : 'Courses'}
              </span>
            )}
          </div>

          {courses.length === 0 ? (
            <EmptyCourses />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {courses.map((course) => (
                <CourseCard
                  key={course.enrollment_id}
                  course={course}
                />
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            QUICK ACCESS
        ================================================= */}

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Quick Access
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Jump directly to your academic tools.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLink
              href="/student/dashboard/units"
              icon={<Layers3 className="h-5 w-5" />}
              title="Units & Lessons"
              description="Explore your learning content"
            />

            <QuickLink
              href="/student/dashboard/assignments"
              icon={<BookOpen className="h-5 w-5" />}
              title="Assignments"
              description="View and submit assignments"
            />

            <QuickLink
              href="/student/dashboard/quizzes"
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Quizzes"
              description="Test your knowledge"
            />

            <QuickLink
              href="/student/dashboard/progress"
              icon={<Sparkles className="h-5 w-5" />}
              title="Learning Progress"
              description="Track your academic progress"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>

        <span className="text-2xl font-bold text-slate-900">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-800">
        {label}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   COURSE CARD
========================================================= */

function CourseCard({
  course,
}: {
  course: Course;
}) {
  const status = course.enrollment_status
    ? course.enrollment_status
        .charAt(0)
        .toUpperCase() +
      course.enrollment_status.slice(1)
    : 'Active';

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      {/* Course header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-6">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-yellow-300 ring-1 ring-white/10">
            <GraduationCap className="h-7 w-7" />
          </div>

          <span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-300/20">
            {status}
          </span>
        </div>

        <div className="relative mt-5">
          {course.program_code && (
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-yellow-300">
              {course.program_code}
            </p>
          )}

          <h3 className="text-xl font-bold leading-snug text-white">
            {course.program_name}
          </h3>

          {course.level && (
            <p className="mt-2 text-sm text-emerald-100/75">
              {course.level}
              {course.duration
                ? ` • ${course.duration}`
                : ''}
            </p>
          )}
        </div>
      </div>

      {/* Course body */}
      <div className="p-6">
        {course.program_description && (
          <p className="line-clamp-3 text-sm leading-6 text-slate-600">
            {course.program_description}
          </p>
        )}

        {/* Academic information */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CourseMetric
            icon={<Layers3 className="h-4 w-4" />}
            value={course.total_units}
            label="Units"
          />

          <CourseMetric
            icon={<BookOpen className="h-4 w-4" />}
            value={course.total_topics}
            label="Topics"
          />

          <CourseMetric
            icon={<PlayCircle className="h-4 w-4" />}
            value={course.total_lessons}
            label="Lessons"
          />

          <CourseMetric
            icon={<Users className="h-4 w-4" />}
            value={course.assigned_units}
            label="Assigned"
          />
        </div>

        {/* Year of study */}
        {course.year_of_study !== null && (
          <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-500">
              Year of Study
            </span>

            <span className="text-sm font-bold text-slate-900">
              Year {course.year_of_study}
            </span>
          </div>
        )}

        {/* Progress notice */}
        <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <div>
              <p className="text-sm font-semibold text-amber-900">
                Ready to start learning
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800/80">
                Your course content is available below.
                Detailed lesson completion tracking will be
                shown in Learning Progress once the progress
                tracking module is enabled.
              </p>
            </div>
          </div>
        </div>

        {/* Continue button */}
        <div className="mt-6">
          <Link
            href={`/student/dashboard/units?program_id=${course.program_id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            <BookOpen className="h-4 w-4" />

            Continue Learning

            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   COURSE METRIC
========================================================= */

function CourseMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
        {icon}
      </div>

      <p className="mt-2 text-lg font-bold text-slate-900">
        {value}
      </p>

      <p className="text-[11px] font-medium text-slate-500">
        {label}
      </p>
    </div>
  );
}

/* =========================================================
   QUICK LINK
========================================================= */

function QuickLink({
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
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>

        <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </Link>
  );
}

/* =========================================================
   EMPTY COURSES
========================================================= */

function EmptyCourses() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <GraduationCap className="h-8 w-8" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">
        No LMS course enrolled yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Your student account is authenticated, but no
        active LMS enrollment was found for this
        application. Once your enrollment is created, your
        course will appear here automatically.
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
        <Clock3 className="h-4 w-4" />

        Awaiting LMS enrollment
      </div>
    </div>
  );
}