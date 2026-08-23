'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Loader2,
  ChevronRight,
  X,
  FileText,
  ClipboardList,
  HelpCircle,
} from 'lucide-react';

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
  program_name: string;
  program_code: string | null;
};

type Topic = {
  id: number;
  unit_id: number;
  title: string;
  description: string | null;
  order_number: number;
  status: string;
  created_at: string;
  updated_at: string;
  lesson_count: number;
};

export default function UnitManagementPage() {
  const params = useParams();

  const id = params?.id;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    order_number: '',
  });

  /* =========================================================
     LOAD UNIT
  ========================================================= */

  async function loadUnit() {
    if (!id) return;

    try {
      const response = await fetch(
        `/api/lms/units/${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to load unit.'
        );
      }

      setUnit(data.unit);

    } catch (error) {
      console.error(error);
      alert('Failed to load unit.');
    }
  }

  /* =========================================================
     LOAD TOPICS
  ========================================================= */

  async function loadTopics() {
    if (!id) return;

    try {
      const response = await fetch(
        `/api/lms/topics?unit_id=${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to load topics.'
        );
      }

      setTopics(data.topics || []);

    } catch (error) {
      console.error(error);
      alert('Failed to load topics.');
    }
  }

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  async function loadData() {
    try {
      setLoading(true);

      await Promise.all([
        loadUnit(),
        loadTopics(),
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
     CREATE TOPIC
  ========================================================= */

  async function handleCreateTopic(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!id) return;

    if (!form.title.trim()) {
      alert('Topic title is required.');
      return;
    }

    try {
      setSaving(true);

      const orderNumber =
        form.order_number.trim() !== ''
          ? Number(form.order_number)
          : topics.length + 1;

      const response = await fetch(
        '/api/lms/topics',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            unit_id: Number(id),
            title: form.title.trim(),
            description:
              form.description.trim(),
            order_number: orderNumber,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            'Failed to create topic.'
        );
      }

      /* Add the newly created topic immediately */

      setTopics((current) => [
        ...current,
        {
          ...data.topic,
          lesson_count:
            Number(data.topic.lesson_count || 0),
        },
      ]);

      /* Reset form */

      setForm({
        title: '',
        description: '',
        order_number: '',
      });

      /* Close modal */

      setShowModal(false);

    } catch (error: any) {
      console.error(
        'Create topic error:',
        error
      );

      alert(
        error?.message ||
          'Failed to create topic.'
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

            Loading unit...

          </div>

        </div>

      </div>
    );
  }

  /* =========================================================
     UNIT NOT FOUND
  ========================================================= */

  if (!unit) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">

        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

          <BookOpen
            size={40}
            className="mx-auto mb-4 text-slate-300"
          />

          <h2 className="text-lg font-bold text-slate-900">
            Unit not found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            The unit you're looking for does not exist.
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
          href={`/admin/dashboard/lms/programs/${unit.program_id}`}
          className="transition hover:text-brand-green"
        >
          {unit.program_name}
        </Link>

        <ChevronRight size={14} />

        <span className="text-slate-700">
          {unit.name}
        </span>

      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

        <div className="flex items-start gap-4">

          <Link
            href={`/admin/dashboard/lms/programs/${unit.program_id}`}
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
                  unit.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {unit.status}
              </span>

            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              {unit.name}
            </h1>

            {unit.code && (
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-brand-green">
                {unit.code}
              </p>
            )}

            <p className="mt-2 text-sm text-slate-500">
              {unit.program_name}
            </p>

          </div>

        </div>

        {/* =====================================================
            ADD TOPIC BUTTON
        ===================================================== */}

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <Plus size={18} />
          Add Topic
        </button>

      </div>

      {/* =====================================================
          UNIT INFORMATION
      ===================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Year
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            Year {unit.year_of_study || 1}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Term
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            Term {unit.term_number || 1}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Credit Hours
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {unit.credit_hours || 0}
          </p>

        </div>

      </div>

      {/* =====================================================
          DESCRIPTION
      ===================================================== */}

      {unit.description && (

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-3 text-lg font-bold text-slate-900">
            Unit Overview
          </h2>

          <p className="text-sm leading-7 text-slate-600">
            {unit.description}
          </p>

        </div>

      )}

      {/* =====================================================
          CONTENT STATISTICS
      ===================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Topics
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {topics.length}
              </p>
            </div>

            <div className="rounded-xl bg-brand-green/10 p-3 text-brand-green">
              <BookOpen size={22} />
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Materials
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                0
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FileText size={22} />
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Assignments
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                0
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <ClipboardList size={22} />
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Quizzes
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                0
              </p>
            </div>

            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <HelpCircle size={22} />
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          TOPICS
      ===================================================== */}

      <div>

        <div className="mb-5 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Topics
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Organize the lessons and learning content for this unit.
            </p>
          </div>

        </div>

        {topics.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

            <BookOpen
              size={42}
              className="mx-auto mb-4 text-slate-300"
            />

            <h3 className="text-lg font-semibold text-slate-800">
              No topics yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Start building this unit by adding your first topic.
            </p>

            {/* =================================================
                ADD FIRST TOPIC BUTTON
            ================================================= */}

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus size={18} />
              Add First Topic
            </button>

          </div>

        ) : (

          <div className="space-y-4">

            {topics.map((topic) => (

              <div
                key={topic.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div className="flex items-start gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-sm font-bold text-brand-green">
                      {topic.order_number}
                    </div>

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="text-base font-bold text-slate-900">
                          {topic.title}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            topic.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {topic.status}
                        </span>

                      </div>

                      {topic.description && (
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {topic.description}
                        </p>
                      )}

                      <div className="mt-3">

                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">

                          <FileText size={14} />

                          {topic.lesson_count || 0}

                          {topic.lesson_count === 1
                            ? ' Lesson'
                            : ' Lessons'}

                        </span>

                      </div>

                    </div>

                  </div>

                  {/* MANAGE TOPIC */}

                  <Link
                    href={`/admin/dashboard/lms/topics/${topic.id}`}
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
          ADD TOPIC MODAL
      ===================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  Add Topic
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Add a topic to {unit.name}.
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
              onSubmit={handleCreateTopic}
              className="space-y-5 p-6"
            >

              {/* TOPIC NUMBER */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Topic Number
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
                  placeholder={`Automatically uses ${topics.length + 1}`}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

              {/* TOPIC TITLE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Topic Name *
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
                  rows={4}
                  placeholder="Brief description of this topic..."
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
                    : 'Create Topic'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}