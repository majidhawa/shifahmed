'use client';

import Link from 'next/link';

import {
  useEffect,
  useState,
} from 'react';

import {
  BookOpen,
  GraduationCap,
  Clock3,
  Layers3,
  ArrowRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  BookMarked,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Lecturer = {
  id: number;
  name: string;
  email: string;
};

type Course = {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  duration: string | null;
  level: string | null;
  status: string | null;
  assigned_at: string;
  assignment_updated_at: string;
};

/* =========================================================
   PAGE
========================================================= */

export default function LecturerCoursesPage() {
  /* =====================================================
     STATE
  ===================================================== */

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [lecturer, setLecturer] =
    useState<Lecturer | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /* =====================================================
     LOAD COURSES
  ===================================================== */

  async function loadCourses() {
    try {
      setLoading(true);
      setError('');

      const response =
        await fetch(
          '/api/lecturer/courses',
          {
            method: 'GET',
            cache: 'no-store',
            credentials: 'include',
          }
        );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          window.location.href =
            '/lecturer/login';

          return;
        }

        throw new Error(
          data.message ||
            'Unable to load your courses.'
        );
      }

      setLecturer(
        data.lecturer || null
      );

      setCourses(
        Array.isArray(data.courses)
          ? data.courses
          : []
      );
    } catch (error) {
      console.error(
        'LOAD LECTURER COURSES ERROR:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load your courses.'
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadCourses();
  }, []);

  /* =====================================================
     HELPERS
  ===================================================== */

  function formatDate(
    value: string
  ) {
    if (!value) {
      return '—';
    }

    try {
      return new Intl.DateTimeFormat(
        'en-KE',
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }
      ).format(new Date(value));
    } catch {
      return '—';
    }
  }

  function getInitials(
    name: string
  ) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0).toUpperCase()
      )
      .join('');
  }

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalCourses =
    courses.length;

  const activeCourses =
    courses.filter(
      (course) =>
        String(course.status || '')
          .toLowerCase() === 'active'
    ).length;

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Teaching
            </p>

            <h1 className="mt-1 text-2xl font-bold text-brand-dark sm:text-3xl">
              My Courses
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage the courses assigned to you
              by the college administration.
            </p>

          </div>

          <button
            type="button"
            onClick={loadCourses}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-brand-green shadow-sm transition hover:border-brand-green/30 hover:bg-brand-green/5 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Refresh

          </button>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">

            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-bold text-red-700">
                Unable to load courses
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={loadCourses}
                className="mt-3 text-xs font-bold text-red-700 underline underline-offset-2"
              >
                Try again
              </button>
            </div>

          </div>
        )}

        {/* =================================================
            LECTURER WELCOME
        ================================================= */}

        {!loading &&
          lecturer && (
            <div className="mb-6 overflow-hidden rounded-3xl bg-brand-dark shadow-soft">

              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-bold text-brand-green shadow-lg">
                    {getInitials(
                      lecturer.name
                    )}
                  </div>

                  <div>

                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">
                      Lecturer Account
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">
                      Welcome, {lecturer.name}
                    </h2>

                    <p className="mt-1 text-sm text-white/50">
                      {lecturer.email}
                    </p>

                  </div>

                </div>

                <div className="flex items-center gap-3">

                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">

                    <p className="text-2xl font-bold text-white">
                      {totalCourses}
                    </p>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                      Assigned Courses
                    </p>

                  </div>

                </div>

              </div>

            </div>
          )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        {!loading &&
          !error &&
          courses.length > 0 && (
            <div className="mb-6 grid gap-4 sm:grid-cols-2">

              {/* TOTAL */}

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                    <BookOpen className="h-5 w-5 text-brand-green" />
                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Assigned Courses
                    </p>

                    <p className="mt-1 text-2xl font-bold text-brand-dark">
                      {totalCourses}
                    </p>

                  </div>

                </div>

              </div>

              {/* ACTIVE */}

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Active Courses
                    </p>

                    <p className="mt-1 text-2xl font-bold text-brand-dark">
                      {activeCourses}
                    </p>

                  </div>

                </div>

              </div>

            </div>
          )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-soft">

            <div className="text-center">

              <Loader2 className="mx-auto h-9 w-9 animate-spin text-brand-green" />

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading your courses...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Checking your course assignments.
              </p>

            </div>

          </div>
        )}

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {!loading &&
          !error &&
          courses.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-soft">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-green/10">

                <BookMarked className="h-8 w-8 text-brand-green" />

              </div>

              <h2 className="mt-5 text-lg font-bold text-brand-dark">
                No Courses Assigned
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                You currently do not have any
                courses assigned to your lecturer
                account.
              </p>

              <div className="mx-auto mt-5 max-w-md rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">

                <p className="text-xs leading-5 text-amber-700">
                  Please contact the LMS
                  administrator if you believe
                  you should have courses assigned
                  to you.
                </p>

              </div>

            </div>
          )}

        {/* =================================================
            COURSE GRID
        ================================================= */}

        {!loading &&
          !error &&
          courses.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

              {courses.map(
                (course) => {

                  const isActive =
                    String(
                      course.status || ''
                    ).toLowerCase() ===
                    'active';

                  return (
                    <div
                      key={course.id}
                      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >

                      {/* ===================================
                          COURSE TOP
                      ==================================== */}

                      <div className="relative overflow-hidden bg-brand-dark px-6 py-7">

                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-green/20" />

                        <div className="absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-brand-gold/10" />

                        <div className="relative">

                          <div className="mb-5 flex items-start justify-between gap-4">

                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">

                              <GraduationCap className="h-6 w-6 text-brand-gold" />

                            </div>

                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                isActive
                                  ? 'bg-green-400/15 text-green-300'
                                  : 'bg-white/10 text-white/50'
                              }`}
                            >
                              {course.status ||
                                'Assigned'}
                            </span>

                          </div>

                          <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-gold">
                            {course.code ||
                              'COURSE'}
                          </p>

                          <h2 className="mt-2 min-h-[56px] text-xl font-bold leading-7 text-white">
                            {course.name}
                          </h2>

                        </div>

                      </div>

                      {/* ===================================
                          COURSE BODY
                      ==================================== */}

                      <div className="flex flex-1 flex-col p-6">

                        {course.description ? (
                          <p className="line-clamp-3 text-sm leading-6 text-slate-500">
                            {course.description}
                          </p>
                        ) : (
                          <p className="text-sm italic leading-6 text-slate-400">
                            No course description has
                            been provided.
                          </p>
                        )}

                        {/* COURSE DETAILS */}

                        <div className="mt-6 grid grid-cols-2 gap-3">

                          {/* LEVEL */}

                          <div className="rounded-2xl bg-slate-50 p-3">

                            <div className="flex items-center gap-2">

                              <Layers3 className="h-4 w-4 text-brand-green" />

                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Level
                              </span>

                            </div>

                            <p className="mt-2 truncate text-sm font-bold text-brand-dark">
                              {course.level ||
                                '—'}
                            </p>

                          </div>

                          {/* DURATION */}

                          <div className="rounded-2xl bg-slate-50 p-3">

                            <div className="flex items-center gap-2">

                              <Clock3 className="h-4 w-4 text-brand-green" />

                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Duration
                              </span>

                            </div>

                            <p className="mt-2 truncate text-sm font-bold text-brand-dark">
                              {course.duration ||
                                '—'}
                            </p>

                          </div>

                        </div>

                        {/* ASSIGNED DATE */}

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

                          <span className="text-xs text-slate-400">
                            Assigned
                          </span>

                          <span className="text-xs font-semibold text-slate-600">
                            {formatDate(
                              course.assigned_at
                            )}
                          </span>

                        </div>

                        {/* OPEN COURSE */}

                        <Link
                          href={`/lecturer/courses/${course.id}`}
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
                        >

                          Open Course

                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />

                        </Link>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

      </div>
    </div>
  );
}