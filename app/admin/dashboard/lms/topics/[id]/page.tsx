'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  GraduationCap,
  Loader2,
  ChevronRight,
  FileText,
  X,
} from 'lucide-react';

type Topic = {
  id: number;
  unit_id: number;
  title: string;
  description: string | null;
  order_number: number;
  status: string;
  created_at: string;
  updated_at: string;

  unit_name: string;
  unit_code: string | null;

  program_id: number;
  program_name: string;
  program_code: string | null;
};

type Lesson = {
  id: number;
  topic_id: number;
  title: string;
  description: string | null;
  content: string | null;
  order_number: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function TopicManagementPage() {
  const params = useParams();

  const id = params?.id;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    content: '',
    order_number: '1',
  });

  /* =========================================================
     LOAD TOPIC
  ========================================================= */

  async function loadTopic() {
    if (!id) return;

    try {
      const response = await fetch(
        `/api/lms/topics/${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to load topic.'
        );
      }

      setTopic(data.topic);
    } catch (error) {
      console.error(error);
      alert('Failed to load topic.');
    }
  }

  /* =========================================================
     LOAD LESSONS
  ========================================================= */

  async function loadLessons() {
    if (!id) return;

    try {
      const response = await fetch(
        `/api/lms/lessons?topic_id=${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to load lessons.'
        );
      }

      setLessons(data.lessons || []);
    } catch (error) {
      console.error(error);
      alert('Failed to load lessons.');
    }
  }

  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadData() {
    try {
      setLoading(true);

      await Promise.all([
        loadTopic(),
        loadLessons(),
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  /* =========================================================
     CREATE LESSON
  ========================================================= */

  async function handleCreateLesson(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!id) return;

    if (!form.title.trim()) {
      alert('Lesson title is required.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        '/api/lms/lessons',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic_id: Number(id),
            title: form.title,
            description: form.description,
            content: form.content,
            order_number:
              Number(form.order_number) || 1,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to create lesson.'
        );
      }

      setLessons((current) => [
        ...current,
        data.lesson,
      ]);

      setForm({
        title: '',
        description: '',
        content: '',
        order_number: String(
          lessons.length + 2
        ),
      });

      setShowModal(false);
    } catch (error: any) {
      console.error(error);

      alert(
        error?.message ||
          'Failed to create lesson.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">

        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">

          <div className="flex items-center gap-3 text-sm text-slate-500">

            <Loader2
              size={20}
              className="animate-spin"
            />

            Loading topic...

          </div>

        </div>

      </div>
    );
  }

  /* =========================================================
     TOPIC NOT FOUND
  ========================================================= */

  if (!topic) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">

        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

          <BookOpen
            size={40}
            className="mx-auto mb-4 text-slate-300"
          />

          <h2 className="text-lg font-bold text-slate-900">
            Topic not found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            The topic you're looking for does not exist.
          </p>

          <Link
            href="/admin/dashboard/lms"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white"
          >
            <ArrowLeft size={17} />
            Back to LMS
          </Link>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">

      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">

        <Link
          href="/admin/dashboard/lms"
          className="transition hover:text-brand-green"
        >
          LMS
        </Link>

        <ChevronRight size={14} />

        <Link
          href={`/admin/dashboard/lms/programs/${topic.program_id}`}
          className="transition hover:text-brand-green"
        >
          {topic.program_name}
        </Link>

        <ChevronRight size={14} />

        <Link
          href={`/admin/dashboard/lms/units/${topic.unit_id}`}
          className="transition hover:text-brand-green"
        >
          {topic.unit_name}
        </Link>

        <ChevronRight size={14} />

        <span className="text-slate-700">
          {topic.title}
        </span>

      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

        <div className="flex items-start gap-4">

          <Link
            href={`/admin/dashboard/lms/units/${topic.unit_id}`}
            className="mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>

            <div className="mb-3 flex items-center gap-3">

              <div className="rounded-xl bg-brand-green/10 p-3 text-brand-green">
                <BookOpen size={25} />
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  topic.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {topic.status}
              </span>

            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              {topic.title}
            </h1>

            {topic.unit_code && (
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-brand-green">
                {topic.unit_code}
              </p>
            )}

            <p className="mt-2 text-sm text-slate-500">
              {topic.unit_name} • {topic.program_name}
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <Plus size={18} />
          Add Lesson
        </button>

      </div>

      {/* =====================================================
          TOPIC INFORMATION
      ===================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Topic Order
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {topic.order_number}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Lessons
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {lessons.length}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Status
          </p>

          <p className="mt-2 text-lg font-bold capitalize text-slate-900">
            {topic.status}
          </p>

        </div>

      </div>

      {/* =====================================================
          DESCRIPTION
      ===================================================== */}

      {topic.description && (

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-3 text-lg font-bold text-slate-900">
            Topic Overview
          </h2>

          <p className="text-sm leading-7 text-slate-600">
            {topic.description}
          </p>

        </div>

      )}

      {/* =====================================================
          LESSONS
      ===================================================== */}

      <div>

        <div className="mb-5 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              Lessons
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage the learning content for this topic.
            </p>

          </div>

        </div>

        {lessons.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

            <FileText
              size={42}
              className="mx-auto mb-4 text-slate-300"
            />

            <h3 className="text-lg font-semibold text-slate-800">
              No lessons yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Start building this topic by adding your first lesson.
            </p>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus size={18} />
              Add First Lesson
            </button>

          </div>

        ) : (

          <div className="space-y-4">

           {lessons.map((lesson, index) => (

  <div
    key={lesson.id}
    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
  >

    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      <div className="flex items-start gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-sm font-bold text-brand-green">
          {index + 1}
        </div>

        <div>

          <div className="flex flex-wrap items-center gap-2">

            <h3 className="text-base font-bold text-slate-900">
              {lesson.title}
            </h3>

            <span
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                lesson.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {lesson.status}
            </span>

          </div>

          {lesson.description && (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {lesson.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">

            <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
              Lesson {lesson.order_number}
            </span>

          </div>

        </div>

      </div>

      {/* MANAGE LESSON */}

      <Link
        href={`/admin/dashboard/lms/lessons/${lesson.id}`}
        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-brand-green transition hover:bg-brand-green/10"
      >
        Manage
        <ChevronRight size={16} />
      </Link>

    </div>

  </div>

))}

          </div>

        )}

      </div>

      {/* =====================================================
          ADD LESSON MODAL
      ===================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  Add Lesson
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Add a lesson to {topic.title}.
                </p>

              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleCreateLesson}
              className="space-y-5 p-6"
            >

              {/* TITLE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Lesson Title *
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g. Introduction to Anatomy"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

              {/* ORDER */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Lesson Order
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.order_number}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      order_number: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Brief description of this lesson..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

              {/* CONTENT */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Initial Content
                </label>

                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      content: e.target.value,
                    })
                  }
                  rows={5}
                  placeholder="You can add the lesson content here..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? 'Creating...'
                    : 'Create Lesson'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}