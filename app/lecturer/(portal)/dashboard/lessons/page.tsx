
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  ArrowLeft,
  BookOpen,
  Plus,
  Loader2,
  FileText,
  Video,
  ClipboardList,
  HelpCircle,
  GraduationCap,
  Layers3,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
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
};

type Lesson = {
  id: number;
  topic_id: number;
  title: string;
  description?: string | null;
  order_number?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

type Unit = {
  id: number;
  name: string;
  code: string;
  program_id: number;
  course_name?: string;
  course_code?: string;
};

/* =========================================================
   PAGE
========================================================= */

export default function LessonsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const topicId = searchParams.get('topic_id');
  const unitId = searchParams.get('unit_id');

  const [topic, setTopic] = useState<Topic | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* =========================================================
     LOAD TOPIC + UNIT + LESSONS
  ========================================================= */

  useEffect(() => {
    if (!topicId) {
      setError('No topic was selected.');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        /* =====================================================
           GET TOPIC
        ===================================================== */

        const topicResponse = await fetch(
          `/api/lecturer/topics/${topicId}`,
          {
            credentials: 'include',
            cache: 'no-store',
          }
        );

        const topicData = await topicResponse.json();

        if (!topicResponse.ok || !topicData.success) {
          throw new Error(
            topicData.message || 'Unable to load topic.'
          );
        }

        const loadedTopic: Topic = topicData.topic;

        setTopic(loadedTopic);

        /* =====================================================
           GET UNIT
        ===================================================== */

        const selectedUnitId =
          unitId || String(loadedTopic.unit_id);

        const unitResponse = await fetch(
          `/api/lecturer/units/${selectedUnitId}`,
          {
            credentials: 'include',
            cache: 'no-store',
          }
        );

        const unitData = await unitResponse.json();

        if (unitResponse.ok && unitData.success) {
          setUnit(unitData.unit);
        }

        /* =====================================================
           GET LESSONS
        ===================================================== */

        const lessonsResponse = await fetch(
          `/api/lecturer/lessons?topic_id=${loadedTopic.id}`,
          {
            credentials: 'include',
            cache: 'no-store',
          }
        );

        const lessonsData = await lessonsResponse.json();

        if (!lessonsResponse.ok || !lessonsData.success) {
          throw new Error(
            lessonsData.message || 'Unable to load lessons.'
          );
        }

        setLessons(
          Array.isArray(lessonsData.lessons)
            ? lessonsData.lessons
            : []
        );
      } catch (err) {
        console.error('LOAD LESSONS ERROR:', err);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load lessons.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [topicId, unitId]);

  /* =========================================================
     NO TOPIC
  ========================================================= */

  if (!topicId) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">

          <Link
            href="/lecturer/dashboard/units"
            className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-green/5 hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Units
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-green/10">
              <BookOpen className="h-8 w-8 text-brand-green" />
            </div>

            <h1 className="mt-5 text-xl font-bold text-brand-dark">
              No Topic Selected
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Please select a topic first.
            </p>

          </div>

        </div>
      </div>
    );
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          <div className="flex min-h-[500px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10">
                <Loader2 className="h-7 w-7 animate-spin text-brand-green" />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading lessons...
              </p>

            </div>

          </div>

        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          <button
            type="button"
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-green/5 hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>

              <div>

                <h1 className="text-lg font-bold text-red-700">
                  Unable to Load Lessons
                </h1>

                <p className="mt-1 text-sm leading-6 text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
                >
                  Try Again
                </button>

              </div>

            </div>

          </div>

        </div>
      </div>
    );
  }

  /* =========================================================
     STATISTICS
  ========================================================= */

  const totalLessons = lessons.length;

  const activeLessons = lessons.filter(
    (lesson) => lesson.status === 'active'
  ).length;

  const topicOrder = topic?.order_number || 1;

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-8">

          <button
            type="button"
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-green/5 hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Topics
          </button>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div className="min-w-0">

              <div className="mb-2 flex flex-wrap items-center gap-2">

                <div className="inline-flex items-center gap-2 rounded-xl bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green">
                  <BookOpen className="h-4 w-4" />
                  {unit?.course_name || 'Lecturer Course'}
                </div>

                {unit?.course_code && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {unit.course_code}
                  </span>
                )}

              </div>

              <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">
                {topic?.title}
              </h1>

              {topic?.description && (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {topic.description}
                </p>
              )}

              {unit && (
                <div className="mt-3 flex flex-wrap items-center gap-2">

                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-500">
                    <Layers3 className="h-3 w-3" />
                    {unit.code}
                  </span>

                  <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                    {unit.name}
                  </span>

                  <span
                    className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${
                      topic?.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {topic?.status || 'active'}
                  </span>

                </div>
              )}

            </div>

            {/* =================================================
                ADD LESSON
            ================================================= */}

            <Link
              href={`/lecturer/dashboard/lessons/create?topic_id=${topicId}&unit_id=${unit?.id || topic?.unit_id}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
            >
              <Plus className="h-4 w-4" />
              Add Lesson
            </Link>

          </div>

        </div>

        {/* ===================================================
            STATISTICS
        =================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <BookOpen className="h-5 w-5 text-brand-green" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Total Lessons
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {totalLessons}
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
                <p className="text-sm text-slate-500">
                  Active Lessons
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {activeLessons}
                </p>
              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <GraduationCap className="h-5 w-5 text-brand-green" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Topic Order
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {topicOrder}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            LESSONS
        =================================================== */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">

          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="font-bold text-brand-dark">
                  Lessons
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Manage the lessons under this topic.
                </p>
              </div>

              <Link
                href={`/lecturer/dashboard/lessons/create?topic_id=${topicId}&unit_id=${unit?.id || topic?.unit_id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-dark"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Lesson
              </Link>

            </div>

          </div>

          {lessons.length === 0 ? (

            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 py-16 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-green/10">
                <BookOpen className="h-8 w-8 text-brand-green" />
              </div>

              <h3 className="mt-5 text-base font-bold text-brand-dark">
                No lessons yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                This topic does not have any lessons yet.
                Start building the topic by adding your
                first lesson.
              </p>

              <Link
                href={`/lecturer/dashboard/lessons/create?topic_id=${topicId}&unit_id=${unit?.id || topic?.unit_id}`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                <Plus className="h-4 w-4" />
                Create First Lesson
              </Link>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {lessons.map((lesson, index) => (

                <div
                  key={lesson.id}
                  className="p-5 transition hover:bg-slate-50/70 sm:p-6"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                    <div className="flex min-w-0 gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10 text-sm font-bold text-brand-green">
                        {lesson.order_number || index + 1}
                      </div>

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-sm font-bold text-brand-dark sm:text-base">
                            {lesson.title}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                              lesson.status === 'inactive'
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-green-50 text-green-700'
                            }`}
                          >
                            {lesson.status || 'active'}
                          </span>

                        </div>

                        {lesson.description && (
                          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                            {lesson.description}
                          </p>
                        )}

                      </div>

                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">

                      {/* IMPORTANT:
                          This goes to /lessons/[id]
                      */}

                      <Link
                        href={`/lecturer/dashboard/lessons/${lesson.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-brand-green/30 hover:bg-brand-green/5 hover:text-brand-green"
                      >
                        Open
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>

                      <Link
                        href={`/lecturer/dashboard/lessons/${lesson.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-brand-green/20 bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green transition hover:bg-brand-green hover:text-white"
                      >
                        Edit
                      </Link>

                    </div>

                  </div>

                  <div className="mt-4 ml-0 flex flex-wrap gap-2 sm:ml-[3.75rem]">

                    <Link
                      href={`/lecturer/dashboard/lessons/${lesson.id}/materials`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green transition hover:bg-brand-green/10"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Materials
                    </Link>

                    <Link
                      href={`/lecturer/dashboard/lessons/${lesson.id}/videos`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green transition hover:bg-brand-green/10"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Videos
                    </Link>

                    <Link
                      href={`/lecturer/dashboard/lessons/${lesson.id}/assignments`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green transition hover:bg-brand-green/10"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      Assignments
                    </Link>

                    <Link
                      href={`/lecturer/dashboard/lessons/${lesson.id}/quiz`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green transition hover:bg-brand-green/10"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      Quiz
                    </Link>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>
    </div>
  );
}

