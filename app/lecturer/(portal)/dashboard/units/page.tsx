
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Layers3,
  Loader2,
  Search,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type LecturerUnit = {
  id: number;
  program_id: number;

  code: string | null;
  name: string;
  description: string | null;

  credit_hours: number | null;
  year_of_study: number | null;
  term_number: number | null;

  status: string;

  created_at: string;
  updated_at: string;

  course_id: number;
  course_name: string;
  course_code: string | null;

  topic_count: number;
};

type CourseGroup = {
  id: number;
  name: string;
  code: string | null;
  units: LecturerUnit[];
};

/* =========================================================
   HELPERS
========================================================= */

function safeString(
  value: unknown
): string {
  return typeof value === 'string'
    ? value
    : value == null
    ? ''
    : String(value);
}

function safeNumber(
  value: unknown
): number | null {
  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === 'string' &&
    value.trim() !== ''
  ) {
    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}

/* =========================================================
   PAGE
========================================================= */

export default function LecturerUnitsPage() {
  const [units, setUnits] =
    useState<LecturerUnit[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [selectedCourseId, setSelectedCourseId] =
    useState<number | 'all'>('all');

  const [expandedCourses, setExpandedCourses] =
    useState<Set<number>>(new Set());

  /* =======================================================
     LOAD UNITS
  ======================================================= */

 async function loadUnits() {
  try {
    setLoading(true);
    setError('');

    const response = await fetch('/api/lecturer/units', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || 'Unable to load course units.'
      );
    }

    const apiUnits: Record<string, unknown>[] =
      Array.isArray(data.units) ? data.units : [];

    /*
     * Normalize API response.
     * Invalid records are converted to null.
     */

    const normalizedUnits: LecturerUnit[] = [];

    for (const rawUnit of apiUnits) {
      if (!rawUnit) {
        continue;
      }

      const id = safeNumber(rawUnit.id);

      const courseId = safeNumber(
        rawUnit.course_id ?? rawUnit.program_id
      );

      /*
       * Ignore malformed records.
       */

      if (id === null || courseId === null) {
        continue;
      }

      const unitName =
        safeString(
          rawUnit.name ??
            rawUnit.unit_name
        ) || 'Unnamed Unit';

      const courseName =
        safeString(
          rawUnit.course_name ??
            rawUnit.program_name
        ) || 'Unnamed Course';

      const unit: LecturerUnit = {
        id,

        program_id:
          safeNumber(
            rawUnit.program_id
          ) ?? courseId,

        code:
          rawUnit.code != null
            ? safeString(rawUnit.code)
            : null,

        name: unitName,

        description:
          rawUnit.description != null
            ? safeString(rawUnit.description)
            : null,

        credit_hours:
          safeNumber(
            rawUnit.credit_hours
          ),

        year_of_study:
          safeNumber(
            rawUnit.year_of_study
          ),

        term_number:
          safeNumber(
            rawUnit.term_number
          ),

        status:
          safeString(
            rawUnit.status
          ) || 'active',

        created_at:
          safeString(
            rawUnit.created_at
          ),

        updated_at:
          safeString(
            rawUnit.updated_at
          ),

        course_id: courseId,

        course_name: courseName,

        course_code:
          rawUnit.course_code != null
            ? safeString(
                rawUnit.course_code
              )
            : rawUnit.program_code != null
            ? safeString(
                rawUnit.program_code
              )
            : null,

        topic_count:
          safeNumber(
            rawUnit.topic_count
          ) ?? 0,
      };

      normalizedUnits.push(unit);
    }

    setUnits(normalizedUnits);

    /*
     * Automatically expand the first course.
     */

    if (normalizedUnits.length > 0) {
      const firstCourseId =
        normalizedUnits[0].course_id;

      setExpandedCourses(
        new Set([firstCourseId])
      );
    } else {
      setExpandedCourses(new Set());
    }
  } catch (error) {
    console.error(
      'LOAD LECTURER UNITS ERROR:',
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : 'Unable to load course units.'
    );

    setUnits([]);
    setExpandedCourses(new Set());
  } finally {
    setLoading(false);
  }
}
  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadUnits();
  }, []);

  /* =======================================================
     GROUP UNITS BY COURSE
  ======================================================= */

  const courses = useMemo<CourseGroup[]>(
    () => {
      const map =
        new Map<
          number,
          CourseGroup
        >();

      units.forEach(
        (unit) => {
          const courseId =
            unit.course_id;

          /*
           * Never allow undefined course
           * names into localeCompare().
           */

          const courseName =
            safeString(
              unit.course_name
            ) ||
            'Unnamed Course';

          const courseCode =
            unit.course_code
              ? safeString(
                  unit.course_code
                )
              : null;

          if (!map.has(courseId)) {
            map.set(
              courseId,
              {
                id: courseId,
                name: courseName,
                code: courseCode,
                units: [],
              }
            );
          }

          map
            .get(courseId)!
            .units.push(unit);
        }
      );

      return Array.from(
        map.values()
      ).sort(
        (a, b) =>
          safeString(
            a.name
          ).localeCompare(
            safeString(
              b.name
            )
          )
      );
    },
    [units]
  );

  /* =======================================================
     FILTER COURSES
  ======================================================= */

  const filteredCourses =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return courses
        .filter((course) => {
          if (
            selectedCourseId !==
              'all' &&
            course.id !==
              selectedCourseId
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const courseMatches =
            safeString(
              course.name
            )
              .toLowerCase()
              .includes(query) ||
            safeString(
              course.code
            )
              .toLowerCase()
              .includes(query);

          const unitMatches =
            course.units.some(
              (unit) =>
                safeString(
                  unit.name
                )
                  .toLowerCase()
                  .includes(query) ||
                safeString(
                  unit.code
                )
                  .toLowerCase()
                  .includes(query) ||
                safeString(
                  unit.description
                )
                  .toLowerCase()
                  .includes(query)
            );

          return (
            courseMatches ||
            unitMatches
          );
        })
        .map((course) => {
          if (!query) {
            return course;
          }

          /*
           * When searching, only display
           * matching units where possible.
           */

          const courseMatches =
            safeString(
              course.name
            )
              .toLowerCase()
              .includes(query) ||
            safeString(
              course.code
            )
              .toLowerCase()
              .includes(query);

          if (courseMatches) {
            return course;
          }

          return {
            ...course,
            units:
              course.units.filter(
                (unit) =>
                  safeString(
                    unit.name
                  )
                    .toLowerCase()
                    .includes(query) ||
                  safeString(
                    unit.code
                  )
                    .toLowerCase()
                    .includes(query) ||
                  safeString(
                    unit.description
                  )
                    .toLowerCase()
                    .includes(query)
              ),
          };
        });
    }, [
      courses,
      search,
      selectedCourseId,
    ]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const totalUnits =
    units.length;

  const totalCourses =
    courses.length;

  const totalTopics =
    units.reduce(
      (total, unit) =>
        total +
        (unit.topic_count || 0),
      0
    );

  const activeUnits =
    units.filter(
      (unit) =>
        safeString(
          unit.status
        ).toLowerCase() ===
        'active'
    ).length;

  /* =======================================================
     TOGGLE COURSE
  ======================================================= */

  function toggleCourse(
    courseId: number
  ) {
    setExpandedCourses(
      (current) => {
        const next =
          new Set(current);

        if (
          next.has(courseId)
        ) {
          next.delete(courseId);
        } else {
          next.add(courseId);
        }

        return next;
      }
    );
  }

  /* =======================================================
     EXPAND ALL
  ======================================================= */

  function expandAll() {
    setExpandedCourses(
      new Set(
        courses.map(
          (course) =>
            course.id
        )
      )
    );
  }

  /* =======================================================
     COLLAPSE ALL
  ======================================================= */

  function collapseAll() {
    setExpandedCourses(
      new Set()
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Teaching
            </p>

            <h1 className="mt-1 text-2xl font-bold text-brand-dark sm:text-3xl">
              Course Units
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage the units belonging to
              the courses assigned to you.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={expandAll}
              disabled={
                courses.length === 0
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-brand-green/30 hover:bg-brand-green/5 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-50"
            >
              Expand All
            </button>

            <button
              type="button"
              onClick={collapseAll}
              disabled={
                courses.length === 0
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-brand-green/30 hover:bg-brand-green/5 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-50"
            >
              Collapse All
            </button>

          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">

            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-bold">
                Unable to load course units
              </p>

              <p className="mt-1">
                {error}
              </p>

              <button
                type="button"
                onClick={loadUnits}
                className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700"
              >
                Try Again
              </button>
            </div>

          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* COURSES */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <BookOpen className="h-5 w-5 text-brand-green" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  My Courses
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {totalCourses}
                </p>
              </div>

            </div>
          </div>

          {/* UNITS */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
                <Layers3 className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Total Units
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {totalUnits}
                </p>
              </div>

            </div>
          </div>

          {/* TOPICS */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Topics
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {totalTopics}
                </p>
              </div>

            </div>
          </div>

          {/* ACTIVE */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
                <GraduationCap className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Active Units
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {activeUnits}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">

          <div className="grid gap-4 md:grid-cols-[1fr_280px]">

            {/* SEARCH */}

            <div className="relative">

              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search courses, units or unit codes..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
              />

            </div>

            {/* COURSE FILTER */}

            <div className="relative">

              <select
                value={
                  selectedCourseId
                }
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setSelectedCourseId(
                    value === 'all'
                      ? 'all'
                      : Number(value)
                  );
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
              >

                <option value="all">
                  All My Courses
                </option>

                {courses.map(
                  (course) => (
                    <option
                      key={
                        course.id
                      }
                      value={
                        course.id
                      }
                    >
                      {safeString(
                        course.name
                      )}
                      {course.code
                        ? ` (${course.code})`
                        : ''}
                    </option>
                  )
                )}

              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            </div>

          </div>

          {(search ||
            selectedCourseId !==
              'all') && (
            <div className="mt-3 flex items-center justify-between">

              <p className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-bold text-brand-dark">
                  {
                    filteredCourses.length
                  }
                </span>{' '}
                course
                {filteredCourses.length ===
                1
                  ? ''
                  : 's'}
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCourseId(
                    'all'
                  );
                }}
                className="text-xs font-bold text-brand-green hover:text-brand-dark"
              >
                Clear Filters
              </button>

            </div>
          )}

        </div>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">

          {/* HEADER */}

          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-bold text-brand-dark">
                  My Course Units
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Units are grouped under their
                  assigned courses.
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-xl bg-brand-green/5 px-3 py-2 sm:flex">

                <Layers3 className="h-4 w-4 text-brand-green" />

                <span className="text-xs font-bold text-brand-green">
                  {totalUnits}{' '}
                  {totalUnits === 1
                    ? 'Unit'
                    : 'Units'}
                </span>

              </div>

            </div>

          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">

              <div className="text-center">

                <Loader2 className="mx-auto h-9 w-9 animate-spin text-brand-green" />

                <p className="mt-3 text-sm font-medium text-slate-500">
                  Loading your course units...
                </p>

              </div>

            </div>
          ) : filteredCourses.length ===
            0 ? (

            /* EMPTY */

            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50">

                <Layers3 className="h-8 w-8 text-slate-300" />

              </div>

              <h3 className="mt-5 text-base font-bold text-brand-dark">
                {units.length === 0
                  ? 'No course units found'
                  : 'No matching units'}
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {units.length === 0
                  ? 'There are currently no units available for the courses assigned to your lecturer account.'
                  : 'Try changing your search or course filter.'}
              </p>

              {(search ||
                selectedCourseId !==
                  'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedCourseId(
                      'all'
                    );
                  }}
                  className="mt-5 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
                >
                  Clear Filters
                </button>
              )}

            </div>
          ) : (

            /* COURSE GROUPS */

            <div className="divide-y divide-slate-100">

              {filteredCourses.map(
                (course) => {
                  const expanded =
                    expandedCourses.has(
                      course.id
                    );

                  return (
                    <div
                      key={
                        course.id
                      }
                    >

                      {/* COURSE HEADER */}

                      <button
                        type="button"
                        onClick={() =>
                          toggleCourse(
                            course.id
                          )
                        }
                        className="group flex w-full items-center gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-6"
                      >

                        {/* ICON */}

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">

                          <BookOpen className="h-5 w-5 text-brand-green" />

                        </div>

                        {/* COURSE DETAILS */}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="truncate text-sm font-bold text-brand-dark sm:text-base">
                              {safeString(
                                course.name
                              ) ||
                                'Unnamed Course'}
                            </h3>

                            {course.code && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                {safeString(
                                  course.code
                                )}
                              </span>
                            )}

                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {course.units.length}{' '}
                            {course.units.length ===
                            1
                              ? 'unit'
                              : 'units'}
                          </p>

                        </div>

                        {/* CHEVRON */}

                        <div className="shrink-0">

                          {expanded ? (
                            <ChevronDown className="h-5 w-5 text-brand-green" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:text-brand-green" />
                          )}

                        </div>

                      </button>

                      {/* UNITS */}

                      {expanded && (
                        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-6">

                          <div className="space-y-3">

                            {course.units
                              .sort(
                                (
                                  a,
                                  b
                                ) =>
                                  safeString(
                                    a.name
                                  ).localeCompare(
                                    safeString(
                                      b.name
                                    )
                                  )
                              )
                              .map(
                                (
                                  unit
                                ) => (
                                  <Link
                                    key={
                                      unit.id
                                    }
                                    href={`/lecturer/dashboard/units/${unit.id}`}
                                    className="group block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-green/30 hover:shadow-sm"
                                  >

                                    <div className="flex items-start gap-4">

                                      {/* UNIT ICON */}

                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">

                                        <Layers3 className="h-4 w-4 text-blue-600" />

                                      </div>

                                      {/* UNIT */}

                                      <div className="min-w-0 flex-1">

                                        <div className="flex flex-wrap items-center gap-2">

                                          <h4 className="text-sm font-bold text-brand-dark transition group-hover:text-brand-green">
                                            {safeString(
                                              unit.name
                                            ) ||
                                              'Unnamed Unit'}
                                          </h4>

                                          {unit.code && (
                                            <span className="rounded-full bg-brand-green/5 px-2 py-0.5 text-[10px] font-bold text-brand-green">
                                              {safeString(
                                                unit.code
                                              )}
                                            </span>
                                          )}

                                        </div>

                                        {unit.description && (
                                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                            {safeString(
                                              unit.description
                                            )}
                                          </p>
                                        )}

                                        {/* UNIT META */}

                                        <div className="mt-3 flex flex-wrap items-center gap-2">

                                          {unit.credit_hours !==
                                            null && (
                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                                              <Clock3 className="h-3 w-3" />
                                              {
                                                unit.credit_hours
                                              }{' '}
                                              credit{' '}
                                              {unit.credit_hours ===
                                              1
                                                ? 'hour'
                                                : 'hours'}
                                            </span>
                                          )}

                                          {unit.year_of_study !==
                                            null && (
                                            <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                                              Year{' '}
                                              {
                                                unit.year_of_study
                                              }
                                            </span>
                                          )}

                                          {unit.term_number !==
                                            null && (
                                            <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                                              Term{' '}
                                              {
                                                unit.term_number
                                              }
                                            </span>
                                          )}

                                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1.5 text-[10px] font-semibold text-purple-600">
                                            <FileText className="h-3 w-3" />
                                            {
                                              unit.topic_count
                                            }{' '}
                                            {unit.topic_count ===
                                            1
                                              ? 'topic'
                                              : 'topics'}
                                          </span>

                                          <span
                                            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${
                                              safeString(
                                                unit.status
                                              ).toLowerCase() ===
                                              'active'
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-red-50 text-red-700'
                                            }`}
                                          >
                                            {safeString(
                                              unit.status
                                            ) ||
                                              'Unknown'}
                                          </span>

                                        </div>

                                      </div>

                                      {/* ARROW */}

                                      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-green" />

                                    </div>

                                  </Link>
                                )
                              )}

                          </div>

                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

        {/* =================================================
            FOOTER INFORMATION
        ================================================= */}

        {!loading &&
          !error &&
          units.length > 0 && (
            <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 shadow-soft sm:flex-row sm:items-center sm:justify-between">

              <p>
                Showing{' '}
                <span className="font-bold text-brand-dark">
                  {filteredCourses.length}
                </span>{' '}
                of{' '}
                <span className="font-bold text-brand-dark">
                  {totalCourses}
                </span>{' '}
                assigned course
                {totalCourses === 1
                  ? ''
                  : 's'}.
              </p>

              <p>
                {totalUnits}{' '}
                total unit
                {totalUnits === 1
                  ? ''
                  : 's'}{' '}
                • {totalTopics}{' '}
                topic
                {totalTopics === 1
                  ? ''
                  : 's'}
              </p>

            </div>
          )}

      </div>
    </div>
  );
}

