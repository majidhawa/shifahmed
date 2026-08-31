
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  ArrowLeft,
  BookOpen,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Layers3,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Lesson = {
  id: number;
  topic_id: number;
  title: string;
  description: string | null;
  content: string | null;
  order_number: number;
  status: string;
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

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const lessonId = params?.id;

  const topicIdFromUrl =
    searchParams.get('topic_id');

  const unitIdFromUrl =
    searchParams.get('unit_id');

  /* =====================================================
     STATE
  ===================================================== */

  const [lesson, setLesson] =
    useState<Lesson | null>(null);

  const [topic, setTopic] =
    useState<Topic | null>(null);

  const [unit, setUnit] =
    useState<Unit | null>(null);

  const [title, setTitle] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [content, setContent] =
    useState('');

  const [orderNumber, setOrderNumber] =
    useState('1');

  const [status, setStatus] =
    useState('active');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  /* =====================================================
     LOAD LESSON
  ===================================================== */

  useEffect(() => {
    if (!lessonId) {
      setError('No lesson was selected.');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        /* ===============================================
           GET LESSON
        =============================================== */

        const lessonResponse =
          await fetch(
            `/api/lecturer/lessons/${lessonId}`,
            {
              method: 'GET',
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

        /* ===============================================
           FILL FORM
        =============================================== */

        setTitle(
          loadedLesson.title || ''
        );

        setDescription(
          loadedLesson.description || ''
        );

        setContent(
          loadedLesson.content || ''
        );

        setOrderNumber(
          String(
            loadedLesson.order_number || 1
          )
        );

        setStatus(
          loadedLesson.status || 'active'
        );

        /* ===============================================
           GET TOPIC
        =============================================== */

        const topicResponse =
          await fetch(
            `/api/lecturer/topics/${loadedLesson.topic_id}`,
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
          const loadedTopic: Topic =
            topicData.topic;

          setTopic(loadedTopic);

          /* =============================================
             GET UNIT
          ============================================= */

          const unitResponse =
            await fetch(
              `/api/lecturer/units/${loadedTopic.unit_id}`,
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
          'LOAD EDIT LESSON ERROR:',
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

    loadData();
  }, [lessonId]);

  /* =====================================================
     UPDATE LESSON
  ===================================================== */

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!lesson) {
      setError('Lesson information is missing.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response =
        await fetch(
          `/api/lecturer/lessons/${lesson.id}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              topic_id:
                lesson.topic_id,
              title,
              description,
              content,
              order_number:
                Number(orderNumber),
              status,
            }),
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
            'Unable to update lesson.'
        );
      }

      setLesson(data.lesson);

      setSuccess(
        'Lesson updated successfully.'
      );

      /* ===============================================
         RETURN TO LESSON DETAILS
      =============================================== */

      setTimeout(() => {
        router.push(
          `/lecturer/dashboard/lessons/${lesson.id}`
        );
      }, 800);
    } catch (err) {
      console.error(
        'UPDATE LESSON ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update lesson.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE LESSON
  ===================================================== */

  const handleDelete = async () => {
    if (!lesson) return;

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError('');
      setSuccess('');

      const response =
        await fetch(
          `/api/lecturer/lessons/${lesson.id}`,
          {
            method: 'DELETE',
            credentials: 'include',
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
            'Unable to delete lesson.'
        );
      }

      router.push(
        `/lecturer/dashboard/lessons?topic_id=${
          lesson.topic_id
        }&unit_id=${
          unit?.id || unitIdFromUrl || ''
        }`
      );
    } catch (err) {
      console.error(
        'DELETE LESSON ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete lesson.'
      );
    } finally {
      setDeleting(false);
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">

          <div className="flex min-h-[500px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10">
                <Loader2 className="h-7 w-7 animate-spin text-brand-green" />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading lesson...
              </p>

            </div>

          </div>

        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error && !lesson) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">

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
                  {error}
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

  /* =====================================================
     MAIN
  ===================================================== */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* =================================================
           BACK
        ================================================= */}

        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-green/5 hover:text-brand-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lesson
        </button>

        {/* =================================================
           HEADER
        ================================================= */}

        <div className="mb-6">

          <div className="flex flex-wrap items-center gap-2">

            {unit?.course_name && (
              <span className="inline-flex items-center gap-2 rounded-xl bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green">
                <BookOpen className="h-4 w-4" />
                {unit.course_name}
              </span>
            )}

            {unit?.course_code && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {unit.course_code}
              </span>
            )}

          </div>

          <h1 className="mt-3 text-2xl font-bold text-brand-dark sm:text-3xl">
            Edit Lesson
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Update the lesson information and learning
            content.
          </p>

        </div>

        {/* =================================================
           ERROR MESSAGE
        ================================================= */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">

            <div className="flex items-start gap-3">

              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <p className="text-sm font-semibold text-red-700">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* =================================================
           SUCCESS MESSAGE
        ================================================= */}

        {success && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4">

            <div className="flex items-center gap-3">

              <CheckCircle2 className="h-5 w-5 text-green-600" />

              <p className="text-sm font-semibold text-green-700">
                {success}
              </p>

            </div>

          </div>
        )}

        {/* =================================================
           CONTEXT CARD
        ================================================= */}

        <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

          <div className="grid gap-4 sm:grid-cols-3">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Unit
              </p>

              <div className="mt-1 flex items-center gap-2">

                <Layers3 className="h-4 w-4 text-brand-green" />

                <p className="text-sm font-bold text-brand-dark">
                  {unit?.code || '—'}
                </p>

              </div>

              {unit?.name && (
                <p className="mt-1 text-xs text-slate-500">
                  {unit.name}
                </p>
              )}

            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Topic
              </p>

              <div className="mt-1 flex items-center gap-2">

                <BookOpen className="h-4 w-4 text-brand-green" />

                <p className="text-sm font-bold text-brand-dark">
                  {topic?.title || '—'}
                </p>

              </div>

            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Lesson ID
              </p>

              <p className="mt-1 text-sm font-bold text-brand-dark">
                #{lesson?.id}
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
           FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white shadow-soft"
        >

          {/* FORM HEADER */}

          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

            <h2 className="font-bold text-brand-dark">
              Lesson Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Edit the information below and save your
              changes.
            </p>

          </div>

          <div className="space-y-6 p-5 sm:p-6">

            {/* =================================================
               TITLE
            ================================================= */}

            <div>

              <label
                htmlFor="title"
                className="mb-2 block text-sm font-bold text-brand-dark"
              >
                Lesson Title
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Enter lesson title"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />

            </div>

            {/* =================================================
               DESCRIPTION
            ================================================= */}

            <div>

              <label
                htmlFor="description"
                className="mb-2 block text-sm font-bold text-brand-dark"
              >
                Description
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Enter a short description of this lesson"
                rows={4}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />

            </div>

            {/* =================================================
               CONTENT
            ================================================= */}

            <div>

              <label
                htmlFor="content"
                className="mb-2 block text-sm font-bold text-brand-dark"
              >
                Lesson Content
              </label>

              <textarea
                id="content"
                value={content}
                onChange={(event) =>
                  setContent(
                    event.target.value
                  )
                }
                placeholder="Enter the main lesson content..."
                rows={10}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />

              <p className="mt-2 text-xs text-slate-400">
                You can add detailed lesson notes and
                explanations here.
              </p>

            </div>

            {/* =================================================
               ORDER + STATUS
            ================================================= */}

            <div className="grid gap-5 sm:grid-cols-2">

              {/* ORDER */}

              <div>

                <label
                  htmlFor="orderNumber"
                  className="mb-2 block text-sm font-bold text-brand-dark"
                >
                  Lesson Order
                </label>

                <input
                  id="orderNumber"
                  type="number"
                  min="1"
                  step="1"
                  value={orderNumber}
                  onChange={(event) =>
                    setOrderNumber(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Determines the lesson's position under
                  the topic.
                </p>

              </div>

              {/* STATUS */}

              <div>

                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-bold text-brand-dark"
                >
                  Status
                </label>

                <select
                  id="status"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-brand-dark outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

                <p className="mt-2 text-xs text-slate-400">
                  Inactive lessons can remain available
                  for later editing.
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
             FORM FOOTER
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

            {/* DELETE */}

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Lesson
                </>
              )}

            </button>

            {/* ACTIONS */}

            <div className="flex flex-col gap-2 sm:flex-row">

              <Link
                href={`/lecturer/dashboard/lessons/${lesson?.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving || deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >

                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}

              </button>

            </div>

          </div>

        </form>

      </div>
    </div>
  );
}

