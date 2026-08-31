
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  ArrowLeft,
  BookOpen,
  Save,
  Loader2,
  AlertCircle,
  Layers3,
} from 'lucide-react';

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

export default function CreateLessonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const topicId = searchParams.get('topic_id');
  const unitId = searchParams.get('unit_id');

  const [topic, setTopic] = useState<Topic | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orderNumber, setOrderNumber] = useState(1);
  const [status, setStatus] = useState('active');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* =========================================================
     LOAD TOPIC + UNIT
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
           GET EXISTING LESSONS TO DETERMINE ORDER
        ===================================================== */

        const lessonsResponse = await fetch(
          `/api/lecturer/lessons?topic_id=${loadedTopic.id}`,
          {
            credentials: 'include',
            cache: 'no-store',
          }
        );

        if (lessonsResponse.ok) {
          const lessonsData =
            await lessonsResponse.json();

          if (
            lessonsData.success &&
            Array.isArray(lessonsData.lessons)
          ) {
            const nextOrder =
              lessonsData.lessons.length + 1;

            setOrderNumber(nextOrder);
          }
        }
      } catch (err) {
        console.error('LOAD CREATE LESSON ERROR:', err);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load lesson form.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [topicId, unitId]);

  /* =========================================================
     CREATE LESSON
  ========================================================= */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!topicId) {
      setError('A valid topic is required.');
      return;
    }

    if (!title.trim()) {
      setError('Lesson title is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(
        '/api/lecturer/lessons',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic_id: Number(topicId),
            title: title.trim(),
            description: description.trim() || null,
            order_number: Number(orderNumber),
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to create lesson.'
        );
      }

      setSuccess('Lesson created successfully.');

      /* =====================================================
         GET NEW LESSON ID
      ===================================================== */

      const newLessonId =
        data.lesson?.id ||
        data.id ||
        data.lesson_id;

      if (!newLessonId) {
        throw new Error(
          'Lesson was created, but no lesson ID was returned by the server.'
        );
      }

      /* =====================================================
         REDIRECT TO LESSON DETAILS
      ===================================================== */

      setTimeout(() => {
        router.push(
          `/lecturer/dashboard/lessons/${newLessonId}`
        );
      }, 500);
    } catch (err) {
      console.error('CREATE LESSON ERROR:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create lesson.'
      );
    } finally {
      setSaving(false);
    }
  };

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

          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>

              <div>

                <h1 className="text-lg font-bold text-red-700">
                  Unable to Create Lesson
                </h1>

                <p className="mt-1 text-sm text-red-600">
                  A valid topic is required.
                </p>

              </div>

            </div>

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
        <div className="mx-auto max-w-5xl">

          <div className="flex min-h-[500px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10">
                <Loader2 className="h-7 w-7 animate-spin text-brand-green" />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading lesson form...
              </p>

            </div>

          </div>

        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN
  ========================================================= */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* =====================================================
           BACK
        ===================================================== */}

        <Link
          href={`/lecturer/dashboard/lessons?topic_id=${topicId}&unit_id=${unit?.id || unitId || topic?.unit_id}`}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-green/5 hover:text-brand-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lessons
        </Link>

        {/* =====================================================
           HEADER
        ===================================================== */}

        <div className="mb-6">

          <div className="mb-3 flex flex-wrap items-center gap-2">

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
            Add New Lesson
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Create a new lesson under the selected topic.
          </p>

        </div>

        {/* =====================================================
           TOPIC INFORMATION
        ===================================================== */}

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">
              <Layers3 className="h-6 w-6 text-brand-green" />
            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Topic
              </p>

              <h2 className="mt-1 text-base font-bold text-brand-dark">
                {topic?.title}
              </h2>

              {unit && (
                <p className="mt-1 text-xs text-slate-500">
                  {unit.code} — {unit.name}
                </p>
              )}

            </div>

          </div>

        </div>

        {/* =====================================================
           ERROR
        ===================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">

            <div className="flex items-start gap-3">

              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <p className="text-sm font-medium text-red-700">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* =====================================================
           SUCCESS
        ===================================================== */}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4">

            <p className="text-sm font-bold text-green-700">
              {success}
            </p>

          </div>
        )}

        {/* =====================================================
           FORM
        ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft"
        >

          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">

            <h2 className="font-bold text-brand-dark">
              Lesson Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Enter the basic information for this lesson.
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
                <span className="ml-1 text-red-500">*</span>
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
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
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
                  setDescription(event.target.value)
                }
                placeholder="Enter a short description of this lesson"
                rows={5}
                disabled={saving}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Give students a brief overview of what this
                lesson covers.
              </p>

            </div>

            {/* =================================================
               ORDER + STATUS
            ================================================= */}

            <div className="grid gap-5 sm:grid-cols-2">

              <div>

                <label
                  htmlFor="order_number"
                  className="mb-2 block text-sm font-bold text-brand-dark"
                >
                  Lesson Order
                </label>

                <input
                  id="order_number"
                  type="number"
                  min="1"
                  value={orderNumber}
                  onChange={(event) =>
                    setOrderNumber(
                      Number(event.target.value)
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Determines the position of the lesson
                  within the topic.
                </p>

              </div>

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
                    setStatus(event.target.value)
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>

                <p className="mt-1.5 text-xs text-slate-400">
                  Inactive lessons can remain hidden from
                  students.
                </p>

              </div>

            </div>

          </div>

          {/* ===================================================
              FORM FOOTER
          =================================================== */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">

            <Link
              href={`/lecturer/dashboard/lessons?topic_id=${topicId}&unit_id=${unit?.id || unitId || topic?.unit_id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >

              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Lesson
                </>
              )}

            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

