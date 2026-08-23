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
  Target,
  Pencil,
  Trash2,
  FileText,
  Video,
  ClipboardList,
  HelpCircle,
  X,
} from 'lucide-react';

type Lesson = {
  id: number;
  topic_id: number;
  title: string;
  description: string | null;
  order_number: number;
  status: string;
  created_at: string;
  updated_at: string;

  topic_name: string;
  unit_id: number;
  unit_name: string;
  unit_code: string | null;

  program_id: number;
  program_name: string;
  program_code: string | null;
};

type Objective = {
  id: number;
  lesson_id: number;
  objective: string;
  order_number: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function LessonManagementPage() {
  const params = useParams();

  const id = params?.id;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);

  const [loading, setLoading] = useState(true);
  const [objectivesLoading, setObjectivesLoading] =
    useState(true);

  const [showObjectiveModal, setShowObjectiveModal] =
    useState(false);

  const [savingObjective, setSavingObjective] =
    useState(false);

  const [objectiveText, setObjectiveText] =
    useState('');

  /* =========================================================
     LOAD LESSON
  ========================================================= */

  async function loadLesson() {
    if (!id) return;

    try {
      const response = await fetch(
        `/api/lms/lessons/${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to load lesson.'
        );
      }

      setLesson(data.lesson);
    } catch (error) {
      console.error(error);
      alert('Failed to load lesson.');
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     LOAD OBJECTIVES
  ========================================================= */

  async function loadObjectives() {
    if (!id) return;

    try {
      setObjectivesLoading(true);

      const response = await fetch(
        `/api/lms/lessons/${id}/objectives`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to load learning objectives.'
        );
      }

      setObjectives(data.objectives || []);
    } catch (error) {
      console.error(error);
      alert(
        'Failed to load learning objectives.'
      );
    } finally {
      setObjectivesLoading(false);
    }
  }

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    if (id) {
      loadLesson();
      loadObjectives();
    }
  }, [id]);

  /* =========================================================
     CREATE OBJECTIVE
  ========================================================= */

  async function handleCreateObjective(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!id) return;

    if (!objectiveText.trim()) {
      alert(
        'Please enter a learning objective.'
      );
      return;
    }

    try {
      setSavingObjective(true);

      const response = await fetch(
        `/api/lms/lessons/${id}/objectives`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            objective: objectiveText,
            order_number:
              objectives.length + 1,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to create learning objective.'
        );
      }

      setObjectives((current) => [
        ...current,
        data.objective,
      ]);

      setObjectiveText('');
      setShowObjectiveModal(false);
    } catch (error: any) {
      console.error(error);

      alert(
        error?.message ||
          'Failed to create learning objective.'
      );
    } finally {
      setSavingObjective(false);
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
            Loading lesson...
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     LESSON NOT FOUND
  ========================================================= */

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <BookOpen
            size={40}
            className="mx-auto mb-4 text-slate-300"
          />

          <h2 className="text-lg font-bold text-slate-900">
            Lesson not found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            The lesson you're looking for does not exist.
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
          href={`/admin/dashboard/lms/programs/${lesson.program_id}`}
          className="transition hover:text-brand-green"
        >
          {lesson.program_name}
        </Link>

        <ChevronRight size={14} />

        <Link
          href={`/admin/dashboard/lms/units/${lesson.unit_id}`}
          className="transition hover:text-brand-green"
        >
          {lesson.unit_name}
        </Link>

        <ChevronRight size={14} />

        <span className="text-slate-700">
          {lesson.title}
        </span>

      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

        <div className="flex items-start gap-4">

          <Link
            href={`/admin/dashboard/lms/units/${lesson.unit_id}`}
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
                  lesson.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {lesson.status}
              </span>

            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              {lesson.title}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {lesson.program_name} →{' '}
              {lesson.unit_name} →{' '}
              {lesson.topic_name}
            </p>

          </div>

        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Pencil size={17} />
          Edit Lesson
        </button>

      </div>

      {/* =====================================================
          LESSON DESCRIPTION
      ===================================================== */}

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Lesson Overview
        </h2>

        <p className="text-sm leading-7 text-slate-600">
          {lesson.description ||
            'No lesson description has been added yet.'}
        </p>

      </div>

      {/* =====================================================
          CONTENT TYPES
      ===================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <FileText size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Documents
              </p>

              <p className="text-xl font-bold text-slate-900">
                0
              </p>
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Video size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Videos
              </p>

              <p className="text-xl font-bold text-slate-900">
                0
              </p>
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <ClipboardList size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Assignments
              </p>

              <p className="text-xl font-bold text-slate-900">
                0
              </p>
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <HelpCircle size={22} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Quizzes
              </p>

              <p className="text-xl font-bold text-slate-900">
                0
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          LEARNING OBJECTIVES
      ===================================================== */}

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-3">

            <div className="rounded-xl bg-brand-green/10 p-3 text-brand-green">
              <Target size={22} />
            </div>

            <div>

              <h2 className="text-lg font-bold text-slate-900">
                Learning Objectives
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                What students should know or be able to do after completing this lesson.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              setShowObjectiveModal(true)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus size={17} />
            Add Objective
          </button>

        </div>

        {objectivesLoading ? (

          <div className="flex min-h-[150px] items-center justify-center">

            <div className="flex items-center gap-3 text-sm text-slate-500">

              <Loader2
                size={19}
                className="animate-spin"
              />

              Loading objectives...

            </div>

          </div>

        ) : objectives.length === 0 ? (

          <div className="p-10 text-center">

            <Target
              size={38}
              className="mx-auto mb-3 text-slate-300"
            />

            <h3 className="font-semibold text-slate-800">
              No learning objectives yet
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Add objectives to define what students should learn.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {objectives.map(
              (objective, index) => (

                <div
                  key={objective.id}
                  className="flex items-start gap-4 p-5"
                >

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-sm font-bold text-brand-green">
                    {index + 1}
                  </div>

                  <p className="pt-1 text-sm leading-6 text-slate-700">
                    {objective.objective}
                  </p>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* =====================================================
          COMING CONTENT
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-bold text-slate-900">
          Learning Content
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Add PDFs, videos, assignments and quizzes to this lesson.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

          <button
            type="button"
            className="rounded-xl border border-dashed border-slate-300 p-5 text-left transition hover:border-brand-green hover:bg-brand-green/5"
          >
            <FileText
              size={24}
              className="mb-3 text-red-500"
            />

            <h3 className="font-semibold text-slate-800">
              Documents
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Upload lesson PDFs and notes.
            </p>
          </button>

          <button
            type="button"
            className="rounded-xl border border-dashed border-slate-300 p-5 text-left transition hover:border-brand-green hover:bg-brand-green/5"
          >
            <Video
              size={24}
              className="mb-3 text-blue-500"
            />

            <h3 className="font-semibold text-slate-800">
              Videos
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Add instructional videos.
            </p>
          </button>

          <button
            type="button"
            className="rounded-xl border border-dashed border-slate-300 p-5 text-left transition hover:border-brand-green hover:bg-brand-green/5"
          >
            <ClipboardList
              size={24}
              className="mb-3 text-amber-500"
            />

            <h3 className="font-semibold text-slate-800">
              Assignments
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Create student assignments.
            </p>
          </button>

          <button
            type="button"
            className="rounded-xl border border-dashed border-slate-300 p-5 text-left transition hover:border-brand-green hover:bg-brand-green/5"
          >
            <HelpCircle
              size={24}
              className="mb-3 text-purple-500"
            />

            <h3 className="font-semibold text-slate-800">
              Quizzes
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Build quizzes and assessments.
            </p>
          </button>

        </div>

      </div>

      {/* =====================================================
          ADD OBJECTIVE MODAL
      ===================================================== */}

      {showObjectiveModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  Add Learning Objective
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Define what students should achieve after this lesson.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowObjectiveModal(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleCreateObjective}
              className="space-y-5 p-6"
            >

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Learning Objective *
                </label>

                <textarea
                  value={objectiveText}
                  onChange={(e) =>
                    setObjectiveText(
                      e.target.value
                    )
                  }
                  rows={5}
                  placeholder="e.g. Explain the importance of effective communication in emergency care."
                  required
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() => {
                    setShowObjectiveModal(false);
                    setObjectiveText('');
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingObjective}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {savingObjective && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {savingObjective
                    ? 'Saving...'
                    : 'Create Objective'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}