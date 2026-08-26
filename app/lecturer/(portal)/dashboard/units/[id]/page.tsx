
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Layers3,
  Loader2,
  AlertCircle,
  ChevronRight,
  Circle,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Topic = {
  id: number;
  unit_id: number;

  title: string;
  description: string | null;

  order_number: number;
  status: string;

  created_at: string;
  updated_at: string;
};

type Unit = {
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

  course: {
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    duration: string | null;
    level: string | null;
    status: string;
  };

  topics: Topic[];
  topic_count: number;
};

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

    return Number.isFinite(number)
      ? number
      : null;
  }

  return null;
}

/* =========================================================
   PAGE
========================================================= */

export default function LecturerUnitPage() {
  const params = useParams();

  const id =
    Array.isArray(params?.id)
      ? params.id[0]
      : params?.id;

  const [unit, setUnit] =
    useState<Unit | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /* =======================================================
     LOAD UNIT
  ======================================================= */

  async function loadUnit() {
    try {
      setLoading(true);
      setError('');

      if (!id) {
        throw new Error(
          'Unit ID is missing.'
        );
      }

      const response =
        await fetch(
          `/api/lecturer/units/${id}`,
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Cache-Control':
                'no-cache',
            },
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Unable to load unit.'
        );
      }

      const raw =
        data.unit;

      if (!raw) {
        throw new Error(
          'Unit data was not returned.'
        );
      }

      const normalized: Unit = {
        id:
          safeNumber(raw.id) ?? 0,

        program_id:
          safeNumber(
            raw.program_id
          ) ?? 0,

        code:
          raw.code ?? null,

        name:
          safeString(
            raw.name
          ) ||
          'Unnamed Unit',

        description:
          raw.description ??
          null,

        credit_hours:
          safeNumber(
            raw.credit_hours
          ),

        year_of_study:
          safeNumber(
            raw.year_of_study
          ),

        term_number:
          safeNumber(
            raw.term_number
          ),

        status:
          safeString(
            raw.status
          ) || 'active',

        created_at:
          safeString(
            raw.created_at
          ),

        updated_at:
          safeString(
            raw.updated_at
          ),

        course: {
          id:
            safeNumber(
              raw.course?.id
            ) ?? 0,

          name:
            safeString(
              raw.course?.name
            ) ||
            'Unnamed Course',

          code:
            raw.course?.code ??
            null,

          description:
            raw.course
              ?.description ??
            null,

          duration:
            raw.course
              ?.duration ??
            null,

          level:
            raw.course?.level ??
            null,

          status:
            safeString(
              raw.course?.status
            ) || 'active',
        },

        topics:
          Array.isArray(
            raw.topics
          )
            ? raw.topics
                .map(
                  (
                    topic: any
                  ): Topic | null => {
                    if (!topic) {
                      return null;
                    }

                    const topicId =
                      safeNumber(
                        topic.id
                      );

                    if (
                      topicId ===
                      null
                    ) {
                      return null;
                    }

                    return {
                      id: topicId,

                      unit_id:
                        safeNumber(
                          topic.unit_id
                        ) ?? 0,

                      title:
                        safeString(
                          topic.title
                        ) ||
                        'Untitled Topic',

                      description:
                        topic.description ??
                        null,

                      order_number:
                        safeNumber(
                          topic.order_number
                        ) ?? 0,

                      status:
                        safeString(
                          topic.status
                        ) ||
                        'active',

                      created_at:
                        safeString(
                          topic.created_at
                        ),

                      updated_at:
                        safeString(
                          topic.updated_at
                        ),
                    };
                  }
                )
                .filter(
  (topic: Topic | null): topic is Topic =>
    topic !== null
)
            : [],

        topic_count:
          safeNumber(
            raw.topic_count
          ) ??
          (Array.isArray(
            raw.topics
          )
            ? raw.topics.length
            : 0),
      };

      setUnit(normalized);

    } catch (error) {
      console.error(
        'LOAD LECTURER UNIT ERROR:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load unit.'
      );

      setUnit(null);

    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadUnit();
  }, [id]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="text-center">

          <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-green" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading unit...
          </p>

        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !unit) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-3xl">

          <div className="rounded-3xl border border-red-200 bg-red-50 p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100">

                <AlertCircle className="h-5 w-5 text-red-600" />

              </div>

              <div>

                <h1 className="font-bold text-red-800">
                  Unable to load unit
                </h1>

                <p className="mt-1 text-sm text-red-700">
                  {error ||
                    'The requested unit could not be found.'}
                </p>

              </div>

            </div>

            <div className="mt-5 flex flex-wrap gap-3">

              <button
                type="button"
                onClick={loadUnit}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Try Again
              </button>

              <Link
                href="/lecturer/dashboard/units"
                className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50"
              >
                Back to Units
              </Link>

            </div>

          </div>

        </div>

      </div>
    );
  }

  const activeTopics =
    unit.topics.filter(
      (topic) =>
        safeString(
          topic.status
        ).toLowerCase() ===
        'active'
    ).length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* =================================================
            BACK
        ================================================= */}

        <Link
          href="/lecturer/dashboard/units"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-brand-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course Units
        </Link>

        {/* =================================================
            HERO
        ================================================= */}

        <div className="overflow-hidden rounded-3xl bg-brand-dark shadow-soft">

          <div className="p-6 sm:p-8 lg:p-10">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

              <div className="min-w-0">

                <div className="mb-4 flex flex-wrap items-center gap-2">

                  <span className="rounded-full bg-brand-gold/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-gold">
                    {safeString(
                      unit.course.name
                    )}
                  </span>

                  {unit.course.code && (
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white/70">
                      {safeString(
                        unit.course.code
                      )}
                    </span>
                  )}

                </div>

                <div className="flex items-start gap-4">

                  <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 sm:flex">

                    <Layers3 className="h-7 w-7 text-brand-gold" />

                  </div>

                  <div className="min-w-0">

                    <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                      {safeString(
                        unit.name
                      )}
                    </h1>

                    {unit.code && (
                      <p className="mt-2 text-sm font-semibold text-brand-gold">
                        {safeString(
                          unit.code
                        )}
                      </p>
                    )}

                  </div>

                </div>

                {unit.description && (
                  <p className="mt-5 max-w-3xl text-sm leading-7 text-white/60">
                    {safeString(
                      unit.description
                    )}
                  </p>
                )}

              </div>

              {/* STATUS */}

              <div className="shrink-0">

                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
                    safeString(
                      unit.status
                    ).toLowerCase() ===
                    'active'
                      ? 'bg-green-400/10 text-green-300'
                      : 'bg-red-400/10 text-red-300'
                  }`}
                >

                  <span className="h-2 w-2 rounded-full bg-current" />

                  {safeString(
                    unit.status
                  ) || 'Unknown'}

                </span>

              </div>

            </div>

          </div>

          {/* COURSE BAR */}

          <div className="border-t border-white/10 bg-white/5 px-6 py-4 sm:px-8">

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/60">

              {unit.credit_hours !==
                null && (
                <span className="inline-flex items-center gap-2">

                  <Clock3 className="h-4 w-4 text-brand-gold" />

                  {unit.credit_hours}{' '}
                  credit{' '}
                  {unit.credit_hours ===
                  1
                    ? 'hour'
                    : 'hours'}

                </span>
              )}

              {unit.year_of_study !==
                null && (
                <span>
                  Year{' '}
                  {unit.year_of_study}
                </span>
              )}

              {unit.term_number !==
                null && (
                <span>
                  Term{' '}
                  {unit.term_number}
                </span>
              )}

              <span className="inline-flex items-center gap-2">

                <FileText className="h-4 w-4 text-brand-gold" />

                {unit.topic_count}{' '}
                {unit.topic_count ===
                1
                  ? 'Topic'
                  : 'Topics'}

              </span>

            </div>

          </div>

        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <BookOpen className="h-5 w-5 text-brand-green" />
              </div>

              <div>

                <p className="text-xs text-slate-500">
                  Course
                </p>

                <p className="mt-1 text-sm font-bold text-brand-dark">
                  {safeString(
                    unit.course.name
                  )}
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>

              <div>

                <p className="text-xs text-slate-500">
                  Total Topics
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {unit.topic_count}
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

              <div>

                <p className="text-xs text-slate-500">
                  Active Topics
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {activeTopics}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            TOPICS
        ================================================= */}

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">

          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <Layers3 className="h-5 w-5 text-brand-green" />

                  <h2 className="font-bold text-brand-dark">
                    Unit Topics
                  </h2>

                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Topics contained within this
                  unit.
                </p>

              </div>

              <div className="rounded-xl bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green">
                {unit.topic_count}{' '}
                {unit.topic_count ===
                1
                  ? 'Topic'
                  : 'Topics'}
              </div>

            </div>

          </div>

          {unit.topics.length ===
          0 ? (

            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50">

                <FileText className="h-8 w-8 text-slate-300" />

              </div>

              <h3 className="mt-5 font-bold text-brand-dark">
                No topics yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                No topics have been added to
                this unit yet.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {unit.topics
                .slice()
                .sort(
                  (
                    a,
                    b
                  ) =>
                    (a.order_number ??
                      0) -
                    (b.order_number ??
                      0)
                )
                .map(
                  (
                    topic,
                    index
                  ) => (

                    <div
                      key={
                        topic.id
                      }
                      className="group px-5 py-5 transition hover:bg-slate-50 sm:px-6"
                    >

                      <div className="flex items-start gap-4">

                        {/* NUMBER */}

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-sm font-bold text-brand-green">

                          {index + 1}

                        </div>

                        {/* CONTENT */}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="text-sm font-bold text-brand-dark sm:text-base">
                              {safeString(
                                topic.title
                              ) ||
                                'Untitled Topic'}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                safeString(
                                  topic.status
                                ).toLowerCase() ===
                                'active'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {safeString(
                                topic.status
                              ) ||
                                'Unknown'}
                            </span>

                          </div>

                          {topic.description && (
                            <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-500">
                              {safeString(
                                topic.description
                              )}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-400">

                            <span className="inline-flex items-center gap-1.5">

                              <Circle className="h-3 w-3" />

                              Topic{' '}
                              {
                                topic.order_number
                              }

                            </span>

                          </div>

                        </div>

                        {/* ARROW */}

                        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-green" />

                      </div>

                    </div>

                  )
                )}

            </div>

          )}

        </div>

        {/* =================================================
            COURSE INFORMATION
        ================================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">
                <GraduationCap className="h-5 w-5 text-brand-green" />
              </div>

              <div>

                <h2 className="font-bold text-brand-dark">
                  Course Information
                </h2>

                <p className="text-xs text-slate-500">
                  The course this unit belongs
                  to.
                </p>

              </div>

            </div>

            <div className="mt-5 space-y-4">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Course Name
                </p>

                <p className="mt-1 text-sm font-bold text-brand-dark">
                  {safeString(
                    unit.course.name
                  )}
                </p>

              </div>

              {unit.course.code && (
                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Course Code
                  </p>

                  <p className="mt-1 text-sm font-bold text-brand-dark">
                    {safeString(
                      unit.course.code
                    )}
                  </p>

                </div>
              )}

              {unit.course.level && (
                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Level
                  </p>

                  <p className="mt-1 text-sm font-bold text-brand-dark">
                    {safeString(
                      unit.course.level
                    )}
                  </p>

                </div>
              )}

              {unit.course.duration && (
                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Duration
                  </p>

                  <p className="mt-1 text-sm font-bold text-brand-dark">
                    {safeString(
                      unit.course.duration
                    )}
                  </p>

                </div>
              )}

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>

              <div>

                <h2 className="font-bold text-brand-dark">
                  Unit Information
                </h2>

                <p className="text-xs text-slate-500">
                  Academic details for this
                  unit.
                </p>

              </div>

            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <div className="rounded-2xl bg-slate-50 p-4">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Credit Hours
                </p>

                <p className="mt-1 text-lg font-bold text-brand-dark">
                  {unit.credit_hours ??
                    '—'}
                </p>

              </div>

              <div className="rounded-2xl bg-slate-50 p-4">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Year
                </p>

                <p className="mt-1 text-lg font-bold text-brand-dark">
                  {unit.year_of_study ??
                    '—'}
                </p>

              </div>

              <div className="rounded-2xl bg-slate-50 p-4">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Term
                </p>

                <p className="mt-1 text-lg font-bold text-brand-dark">
                  {unit.term_number ??
                    '—'}
                </p>

              </div>

              <div className="rounded-2xl bg-slate-50 p-4">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Topics
                </p>

                <p className="mt-1 text-lg font-bold text-brand-dark">
                  {unit.topic_count}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

