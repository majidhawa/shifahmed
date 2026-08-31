'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  ArrowLeft,
  BookOpen,
  FileText,
  Video,
  ClipboardList,
  HelpCircle,
  Edit,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers3,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Lesson = {
  id: number;
  topic_id: number;
  title: string;
  description: string | null;
  order_number: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type Topic = {
  id: number;
  unit_id: number;
  title: string;
  description: string | null;
  order_number: number;
  status: string;
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

export default function LessonDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const lessonId = params.id as string;

  const topicIdFromUrl =
    searchParams.get('topic_id');

  const unitIdFromUrl =
    searchParams.get('unit_id');

  const [lesson, setLesson] =
    useState<Lesson | null>(null);

  const [topic, setTopic] =
    useState<Topic | null>(null);

  const [unit, setUnit] =
    useState<Unit | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /* =======================================================
     LOAD LESSON
  ======================================================= */

  useEffect(() => {
    if (!lessonId) {
      setError('No lesson was selected.');
      setLoading(false);
      return;
    }

    const loadLesson = async () => {
      try {
        setLoading(true);
        setError('');

        /* =================================================
           GET LESSON
        ================================================= */

        const lessonResponse =
          await fetch(
            `/api/lecturer/lessons/${lessonId}`,
            {
              credentials: 'include',
              cache: 'no-store',
            }
          );

        const lessonData =
          await lessonResponse.json();

        if (
          !lessonResponse.ok ||
          !lessonData.success
        ) {
          throw new Error(
            lessonData.message ||
              'Unable to load lesson.'
          );
        }

        const loadedLesson: Lesson =
          lessonData.lesson;

        setLesson(loadedLesson);

        /* =================================================
           GET TOPIC
        ================================================= */

        const topicId =
          topicIdFromUrl ||
          loadedLesson.topic_id.toString();

        const topicResponse =
          await fetch(
            `/api/lecturer/topics/${topicId}`,
            {
              credentials: 'include',
              cache: 'no-store',
            }
          );

        const topicData =
          await topicResponse.json();

        if (
          topicResponse.ok &&
          topicData.success
        ) {
          setTopic(topicData.topic);

          /* =============================================
             GET UNIT
          ============================================= */

          const unitId =
            unitIdFromUrl ||
            topicData.topic.unit_id.toString();

          const unitResponse =
            await fetch(
              `/api/lecturer/units/${unitId}`,
              {
                credentials: 'include',
                cache: 'no-store',
              }
            );

          const unitData =
            await unitResponse.json();

          if (
            unitResponse.ok &&
            unitData.success
          ) {
            setUnit(unitData.unit);
          }
        }
      } catch (err) {
        console.error(
          'LOAD LESSON ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load lesson.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [
    lessonId,
    topicIdFromUrl,
    unitIdFromUrl,
  ]);

  /* =======================================================
     LOADING
  ======================================================= */

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
                Loading lesson...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait while we load the lesson.
              </p>

            </div>

          </div>

        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !lesson) {
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
                  Unable to Load Lesson
                </h1>

                <p className="mt-1 text-sm leading-6 text-red-600">
                  {error ||
                    'The requested lesson could not be found.'}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    window.location.reload()
                  }
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

  /* =======================================================
     URL HELPERS
  ======================================================= */

  const topicId =
    topic?.id ||
    topicIdFromUrl ||
    lesson.topic_id;

  const unitId =
    unit?.id ||
    unitIdFromUrl ||
    '';

  const lessonsUrl =
    unitId
      ? `/lecturer/dashboard/lessons?topic_id=${topicId}&unit_id=${unitId}`
      : `/lecturer/dashboard/lessons?topic_id=${topicId}`;

  const editUrl =
    unitId
      ? `/lecturer/dashboard/lessons/${lesson.id}/edit?topic_id=${topicId}&unit_id=${unitId}`
      : `/lecturer/dashboard/lessons/${lesson.id}/edit?topic_id=${topicId}`;


const materialsUrl =
  '/lecturer/dashboard/materials';

const videosUrl =
  `/lecturer/dashboard/lessons/${lessonId}/videos`;

  const assignmentsUrl =
    unitId
      ? `/lecturer/dashboard/lessons/${lesson.id}/assignments?topic_id=${topicId}&unit_id=${unitId}`
      : `/lecturer/dashboard/lessons/${lesson.id}/assignments?topic_id=${topicId}`;

  const quizUrl =
    unitId
      ? `/lecturer/dashboard/lessons/${lesson.id}/quiz?topic_id=${topicId}&unit_id=${unitId}`
      : `/lecturer/dashboard/lessons/${lesson.id}/quiz?topic_id=${topicId}`;

  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* =================================================
            BREADCRUMB / BACK
        ================================================= */}

        <div className="mb-6">

          <Link
            href={lessonsUrl}
            className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-green/5 hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lessons
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">

            {unit && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {unit.course_name ||
                    'Course'}
                </span>

                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}

            {unit && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Layers3 className="h-3.5 w-3.5" />
                  {unit.code}
                </span>

                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}

            {topic && (
              <>
                <span>
                  {topic.title}
                </span>

                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}

            <span className="text-brand-green">
              {lesson.title}
            </span>

          </div>

        </div>

        {/* =================================================
            LESSON HEADER
        ================================================= */}

        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">

          <div className="p-6 sm:p-8">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

              <div className="min-w-0">

                <div className="mb-3 flex flex-wrap items-center gap-2">

                  <span className="inline-flex items-center gap-2 rounded-xl bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green">
                    <BookOpen className="h-4 w-4" />
                    Lesson {lesson.order_number}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
                      lesson.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {lesson.status ||
                      'active'}
                  </span>

                </div>

                <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">
                  {lesson.title}
                </h1>

                {lesson.description && (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                    {lesson.description}
                  </p>
                )}

                {topic && (
                  <div className="mt-5 flex flex-wrap gap-2">

                    <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                      Topic: {topic.title}
                    </span>

                    {unit && (
                      <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                        Unit: {unit.code} — {unit.name}
                      </span>
                    )}

                  </div>
                )}

              </div>

              <Link
                href={editUrl}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
              >
                <Edit className="h-4 w-4" />
                Edit Lesson
              </Link>

            </div>

          </div>

        </div>

        {/* =================================================
            LESSON STATUS
        ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <BookOpen className="h-5 w-5 text-brand-green" />
              </div>

              <div>

                <p className="text-xs font-semibold text-slate-500">
                  Lesson Number
                </p>

                <p className="mt-1 text-xl font-bold text-brand-dark">
                  {lesson.order_number}
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

                <p className="text-xs font-semibold text-slate-500">
                  Status
                </p>

                <p className="mt-1 text-xl font-bold capitalize text-brand-dark">
                  {lesson.status ||
                    'active'}
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>

              <div>

                <p className="text-xs font-semibold text-slate-500">
                  Topic
                </p>

                <p className="mt-1 truncate text-sm font-bold text-brand-dark">
                  {topic?.title ||
                    'Current Topic'}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            CONTENT MANAGEMENT
        ================================================= */}

        <div className="mb-6">

          <div className="mb-4">

            <h2 className="text-lg font-bold text-brand-dark">
              Lesson Content
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Manage all learning resources associated
              with this lesson.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* MATERIALS */}

            <Link
              href={materialsUrl}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-green/30 hover:shadow-md"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">
                  <FileText className="h-6 w-6 text-brand-green" />
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:text-brand-green" />

              </div>

              <h3 className="mt-5 text-sm font-bold text-brand-dark">
                Materials
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Add notes, PDFs, documents and other
                learning materials.
              </p>

              <div className="mt-4 text-xs font-bold text-brand-green">
                Manage Materials →
              </div>

            </Link>

            {/* VIDEOS */}

            <Link
              href={videosUrl}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                  <Video className="h-6 w-6 text-blue-600" />
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:text-blue-600" />

              </div>

              <h3 className="mt-5 text-sm font-bold text-brand-dark">
                Videos
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Add video lessons and external video
                resources.
              </p>

              <div className="mt-4 text-xs font-bold text-blue-600">
                Manage Videos →
              </div>

            </Link>

            {/* ASSIGNMENTS */}

            <Link
              href={assignmentsUrl}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50">
                  <ClipboardList className="h-6 w-6 text-purple-600" />
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:text-purple-600" />

              </div>

              <h3 className="mt-5 text-sm font-bold text-brand-dark">
                Assignments
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Create assignments, instructions,
                deadlines and marks.
              </p>

              <div className="mt-4 text-xs font-bold text-purple-600">
                Manage Assignments →
              </div>

            </Link>

            {/* QUIZ */}

            <Link
              href={quizUrl}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
                  <HelpCircle className="h-6 w-6 text-amber-600" />
                </div>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:text-amber-600" />

              </div>

              <h3 className="mt-5 text-sm font-bold text-brand-dark">
                Quiz
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Create quizzes, questions, options and
                correct answers.
              </p>

              <div className="mt-4 text-xs font-bold text-amber-600">
                Manage Quiz →
              </div>

            </Link>

          </div>

        </div>

        {/* =================================================
            QUICK NAVIGATION
        ================================================= */}

        <div className="rounded-3xl border border-slate-200 bg-white shadow-soft">

          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">

            <h2 className="text-sm font-bold text-brand-dark">
              Quick Navigation
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Continue managing this lesson or return to
              the previous level.
            </p>

          </div>

          <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">

            <Link
              href={lessonsUrl}
              className="flex items-center gap-3 px-5 py-4 text-xs font-bold text-slate-600 transition hover:bg-brand-green/5 hover:text-brand-green"
            >
              <ArrowLeft className="h-4 w-4" />
              All Lessons
            </Link>

            {topic && (
              <Link
                href={`/lecturer/dashboard/topics?unit_id=${unitId}`}
                className="flex items-center gap-3 px-5 py-4 text-xs font-bold text-slate-600 transition hover:bg-brand-green/5 hover:text-brand-green"
              >
                <BookOpen className="h-4 w-4" />
                Topic: {topic.title}
              </Link>
            )}

            {unit && (
              <Link
                href={`/lecturer/dashboard/units/${unit.id}`}
                className="flex items-center gap-3 px-5 py-4 text-xs font-bold text-slate-600 transition hover:bg-brand-green/5 hover:text-brand-green"
              >
                <Layers3 className="h-4 w-4" />
                Unit: {unit.code}
              </Link>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}