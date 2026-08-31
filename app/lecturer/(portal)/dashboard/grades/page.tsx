'use client';

import {
  Award,
  BarChart3,
  BookOpen,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type GradeRecord = {
  id: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  programName: string;
  unitName: string;
  unitCode: string;
  assessmentName: string;
  assessmentType: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  status: string;
  submittedAt?: string | null;
};

type Summary = {
  totalStudents: number;
  totalAssessments: number;
  totalGraded: number;
  averageScore: number;
  passRate: number;
};

export default function GradesPage() {
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalStudents: 0,
    totalAssessments: 0,
    totalGraded: 0,
    averageScore: 0,
    passRate: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [assessmentFilter, setAssessmentFilter] =
    useState('all');

  const [page, setPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  /* =========================================================
     LOAD GRADES
  ========================================================= */

  useEffect(() => {
    loadGrades();
  }, []);

  async function loadGrades() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        '/api/lecturer/grades',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to load grades.'
        );
      }

      setGrades(
        Array.isArray(data.grades)
          ? data.grades
          : []
      );

      if (data.summary) {
        setSummary({
          totalStudents:
            Number(
              data.summary.totalStudents
            ) || 0,

          totalAssessments:
            Number(
              data.summary.totalAssessments
            ) || 0,

          totalGraded:
            Number(
              data.summary.totalGraded
            ) || 0,

          averageScore:
            Number(
              data.summary.averageScore
            ) || 0,

          passRate:
            Number(
              data.summary.passRate
            ) || 0,
        });
      }
    } catch (err: any) {
      console.error(
        'LOAD GRADES ERROR:',
        err
      );

      setError(
        err?.message ||
          'Failed to load grades.'
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     FILTER OPTIONS
  ========================================================= */

  const programs = useMemo(() => {
    return Array.from(
      new Set(
        grades
          .map(
            (grade) =>
              grade.programName
          )
          .filter(Boolean)
      )
    ).sort();
  }, [grades]);

  const units = useMemo(() => {
    return Array.from(
      new Set(
        grades
          .filter(
            (grade) =>
              programFilter === 'all' ||
              grade.programName ===
                programFilter
          )
          .map(
            (grade) =>
              `${grade.unitCode} - ${grade.unitName}`
          )
          .filter(Boolean)
      )
    ).sort();
  }, [grades, programFilter]);

  const assessmentTypes = useMemo(() => {
    return Array.from(
      new Set(
        grades
          .map(
            (grade) =>
              grade.assessmentType
          )
          .filter(Boolean)
      )
    ).sort();
  }, [grades]);

  /* =========================================================
     FILTER GRADES
  ========================================================= */

  const filteredGrades = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return grades.filter((grade) => {
      const matchesSearch =
        !query ||
        grade.studentName
          .toLowerCase()
          .includes(query) ||
        grade.admissionNumber
          .toLowerCase()
          .includes(query) ||
        grade.unitName
          .toLowerCase()
          .includes(query) ||
        grade.unitCode
          .toLowerCase()
          .includes(query) ||
        grade.assessmentName
          .toLowerCase()
          .includes(query);

      const matchesProgram =
        programFilter === 'all' ||
        grade.programName ===
          programFilter;

      const unitValue =
        `${grade.unitCode} - ${grade.unitName}`;

      const matchesUnit =
        unitFilter === 'all' ||
        unitValue === unitFilter;

      const matchesAssessment =
        assessmentFilter === 'all' ||
        grade.assessmentType ===
          assessmentFilter;

      return (
        matchesSearch &&
        matchesProgram &&
        matchesUnit &&
        matchesAssessment
      );
    });
  }, [
    grades,
    search,
    programFilter,
    unitFilter,
    assessmentFilter,
  ]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredGrades.length /
        ITEMS_PER_PAGE
    )
  );

  const paginatedGrades =
    filteredGrades.slice(
      (page - 1) *
        ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE
    );

  useEffect(() => {
    setPage(1);
  }, [
    search,
    programFilter,
    unitFilter,
    assessmentFilter,
  ]);

  /* =========================================================
     HELPERS
  ========================================================= */

  function getGradeBadge(grade: string) {
    const value =
      grade?.toUpperCase();

    if (
      ['A', 'A+', 'A-'].includes(value)
    ) {
      return 'bg-green-100 text-green-700';
    }

    if (
      ['B', 'B+', 'B-'].includes(value)
    ) {
      return 'bg-emerald-100 text-emerald-700';
    }

    if (
      ['C', 'C+', 'C-'].includes(value)
    ) {
      return 'bg-yellow-100 text-yellow-700';
    }

    if (
      ['D', 'D+', 'D-'].includes(value)
    ) {
      return 'bg-orange-100 text-orange-700';
    }

    return 'bg-red-100 text-red-700';
  }

  function getStatusBadge(status: string) {
    const value =
      status?.toLowerCase();

    if (
      value === 'passed' ||
      value === 'pass'
    ) {
      return 'bg-green-100 text-green-700';
    }

    if (
      value === 'failed' ||
      value === 'fail'
    ) {
      return 'bg-red-100 text-red-700';
    }

    return 'bg-slate-100 text-slate-600';
  }

  function formatPercentage(
    value: number
  ) {
    return `${Number(value || 0).toFixed(1)}%`;
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ===================================================
           HEADER
        =================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-brand-green ">
              <GraduationCap className="h-4 w-4" />
              Lecturer Portal
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Grades & Results
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              View, monitor and manage student
              grades and assessment results.
            </p>
          </div>

          <button
            type="button"
            onClick={loadGrades}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green  px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <TrendingUp className="h-4 w-4" />
            Refresh Results
          </button>
        </div>

        {/* ===================================================
           ERROR
        =================================================== */}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ===================================================
           STATISTICS
        =================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <StatCard
            title="Students"
            value={summary.totalStudents}
            icon={Users}
            description="Students with results"
          />

          <StatCard
            title="Assessments"
            value={summary.totalAssessments}
            icon={ClipboardList}
            description="Exams & quizzes"
          />

          <StatCard
            title="Graded"
            value={summary.totalGraded}
            icon={Award}
            description="Completed results"
          />

          <StatCard
            title="Average Score"
            value={formatPercentage(
              summary.averageScore
            )}
            icon={BarChart3}
            description="Overall average"
          />

          <StatCard
            title="Pass Rate"
            value={formatPercentage(
              summary.passRate
            )}
            icon={TrendingUp}
            description="Students passing"
          />

        </div>

        {/* ===================================================
           FILTERS
        =================================================== */}

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-5 flex items-center gap-2">
            <Search className="h-5 w-5 text-green-600" />

            <div>
              <h2 className="font-semibold text-slate-900">
                Find Results
              </h2>

              <p className="text-xs text-slate-500">
                Search and filter student results.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* SEARCH */}

            <div className="relative lg:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search student, unit..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* PROGRAM */}

            <SelectFilter
              value={programFilter}
              onChange={setProgramFilter}
              options={programs}
              placeholder="All Programs"
            />

            {/* UNIT */}

            <SelectFilter
              value={unitFilter}
              onChange={setUnitFilter}
              options={units}
              placeholder="All Units"
            />

            {/* ASSESSMENT */}

            <SelectFilter
              value={assessmentFilter}
              onChange={setAssessmentFilter}
              options={assessmentTypes}
              placeholder="All Assessment Types"
            />

          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">
              {filteredGrades.length} results
            </span>

            {(search ||
              programFilter !== 'all' ||
              unitFilter !== 'all' ||
              assessmentFilter !==
                'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setProgramFilter('all');
                  setUnitFilter('all');
                  setAssessmentFilter('all');
                }}
                className="rounded-full px-3 py-1 font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ===================================================
           RESULTS TABLE
        =================================================== */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Student Results
              </h2>

              <p className="text-sm text-slate-500">
                Assessment performance across your
                assigned programs.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
              <FileText className="h-4 w-4" />
              {filteredGrades.length} Records
            </div>

          </div>

          {loading ? (
            <LoadingState />
          ) : filteredGrades.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="overflow-x-auto">

                <table className="min-w-full">

                  <thead className="bg-slate-50">
                    <tr>

                      <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Student
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Program
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Unit
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Assessment
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Score
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                        %
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Grade
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {paginatedGrades.map(
                      (grade) => (
                        <tr
                          key={grade.id}
                          className="transition hover:bg-green-50/30"
                        >

                          {/* STUDENT */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                                {grade.studentName
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  'S'}
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {
                                    grade.studentName
                                  }
                                </p>

                                <p className="text-xs text-slate-500">
                                  {
                                    grade.admissionNumber
                                  }
                                </p>
                              </div>

                            </div>

                          </td>

                          {/* PROGRAM */}

                          <td className="px-5 py-4">
                            <span className="text-sm font-medium text-slate-700">
                              {
                                grade.programName
                              }
                            </span>
                          </td>

                          {/* UNIT */}

                          <td className="px-5 py-4">

                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {
                                  grade.unitCode
                                }
                              </p>

                              <p className="max-w-[220px] text-xs text-slate-500">
                                {
                                  grade.unitName
                                }
                              </p>
                            </div>

                          </td>

                          {/* ASSESSMENT */}

                          <td className="px-5 py-4">

                            <p className="text-sm font-semibold text-slate-800">
                              {
                                grade.assessmentName
                              }
                            </p>

                            <p className="text-xs capitalize text-slate-500">
                              {
                                grade.assessmentType
                              }
                            </p>

                          </td>

                          {/* SCORE */}

                          <td className="px-5 py-4 text-center">

                            <span className="text-sm font-bold text-slate-900">
                              {Number(
                                grade.score
                              ) || 0}
                            </span>

                            <span className="text-xs text-slate-400">
                              {' '}
                              /{' '}
                              {Number(
                                grade.totalMarks
                              ) || 0}
                            </span>

                          </td>

                          {/* PERCENTAGE */}

                          <td className="px-5 py-4 text-center">

                            <span className="font-semibold text-slate-800">
                              {formatPercentage(
                                grade.percentage
                              )}
                            </span>

                          </td>

                          {/* GRADE */}

                          <td className="px-5 py-4 text-center">

                            <span
                              className={`inline-flex min-w-10 items-center justify-center rounded-lg px-3 py-1 text-xs font-bold ${getGradeBadge(
                                grade.grade
                              )}`}
                            >
                              {
                                grade.grade
                              }
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4 text-center">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusBadge(
                                grade.status
                              )}`}
                            >
                              {
                                grade.status
                              }
                            </span>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* =================================================
                 PAGINATION
              ================================================= */}

              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-sm text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-slate-700">
                    {filteredGrades.length ===
                    0
                      ? 0
                      : (page - 1) *
                          ITEMS_PER_PAGE +
                        1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      page *
                        ITEMS_PER_PAGE,
                      filteredGrades.length
                    )}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-700">
                    {
                      filteredGrades.length
                    }
                  </span>{' '}
                  results
                </p>

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.max(
                            1,
                            current - 1
                          )
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white">
                    {page}
                  </span>

                  <button
                    type="button"
                    disabled={
                      page >= totalPages
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.min(
                            totalPages,
                            current + 1
                          )
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>

                </div>

              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
          <Icon className="h-5 w-5 text-green-600" />
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   SELECT FILTER
========================================================= */

function SelectFilter({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
      >
        <option value="all">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">

      <div className="text-center">

        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-green-600" />

        <p className="mt-4 text-sm font-medium text-slate-600">
          Loading grades...
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
        <GraduationCap className="h-8 w-8 text-green-600" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">
        No Results Found
      </h3>

      <p className="mt-2 max-w-md text-sm text-slate-500">
        There are currently no student grades
        matching your search or filters.
      </p>

    </div>
  );
}