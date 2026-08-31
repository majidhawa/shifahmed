
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  AlertCircle,
  ListChecks,
  ClipboardList,
  Users,
  ExternalLink,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Lesson = {
  lesson_id: number;
  lesson_title: string;

  topic_id: number;
  topic_title: string;

  unit_id: number;
  unit_name: string;

  program_id: number;
  program_name: string;
  program_code: string | null;
};

type Question = {
  id?: number;
  question_number?: number;
  question: string;
  marks: number;
};

type Requirement = {
  id?: number;
  requirement_number?: number;
  requirement: string;
};

type Assignment = {
  id: number;
  lesson_id: number;

  title: string;
  description: string | null;

  due_date: string | null;

  status: string;

  total_marks: number;

  created_at: string;
  updated_at: string;

  lesson_title: string;

  topic_id: number;
  topic_title: string;

  unit_id: number;
  unit_name: string;

  program_id: number;
  program_name: string;
  program_code: string | null;

  questions: Question[];
  requirements: Requirement[];
};

type FormData = {
  lesson_id: string;
  title: string;
  description: string;
  due_date: string;
  status: string;

  questions: Question[];

  requirements: Requirement[];
};

/* =========================================================
   EMPTY FORM
========================================================= */

const emptyForm: FormData = {
  lesson_id: '',
  title: '',
  description: '',
  due_date: '',
  status: 'active',

  questions: [
    {
      question: '',
      marks: 10,
    },
  ],

  requirements: [
    {
      requirement: '',
    },
  ],
};

/* =========================================================
   PAGE
========================================================= */

export default function LecturerAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');

  const [courseFilter, setCourseFilter] = useState('');

  const [statusFilter, setStatusFilter] = useState('');

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<FormData>(emptyForm);

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadAssignments() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        '/api/lecturer/assignments',
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to load assignments.'
        );
      }

      setAssignments(
        Array.isArray(data.assignments)
          ? data.assignments
          : []
      );

      setLessons(
        Array.isArray(data.lessons)
          ? data.lessons
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load assignments.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  /* =========================================================
     COURSES
  ========================================================= */

  const courses = useMemo(() => {
    const map = new Map<
      number,
      {
        id: number;
        name: string;
        code: string | null;
      }
    >();

    lessons.forEach((lesson) => {
      if (!map.has(lesson.program_id)) {
        map.set(
          lesson.program_id,
          {
            id: lesson.program_id,
            name: lesson.program_name,
            code: lesson.program_code,
          }
        );
      }
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        a.name.localeCompare(b.name)
    );
  }, [lessons]);

  /* =========================================================
     FILTERED ASSIGNMENTS
  ========================================================= */

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const matchesSearch =
        !query ||
        String(assignment.title || '')
          .toLowerCase()
          .includes(query) ||
        String(assignment.lesson_title || '')
          .toLowerCase()
          .includes(query) ||
        String(assignment.topic_title || '')
          .toLowerCase()
          .includes(query) ||
        String(assignment.unit_name || '')
          .toLowerCase()
          .includes(query) ||
        String(assignment.program_name || '')
          .toLowerCase()
          .includes(query);

      const matchesCourse =
        !courseFilter ||
        String(assignment.program_id) === courseFilter;

      const matchesStatus =
        !statusFilter ||
        String(assignment.status || '').toLowerCase() ===
          statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesCourse &&
        matchesStatus
      );
    });
  }, [
    assignments,
    search,
    courseFilter,
    statusFilter,
  ]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const activeCount = assignments.filter(
    (item) =>
      String(item.status || '').toLowerCase() === 'active'
  ).length;

  const inactiveCount = assignments.filter(
    (item) =>
      String(item.status || '').toLowerCase() !== 'active'
  ).length;

  const totalMarks = assignments.reduce(
    (sum, item) =>
      sum + Number(item.total_marks || 0),
    0
  );

  /* =========================================================
     OPEN CREATE
  ========================================================= */

  function openCreate() {
    setEditingId(null);

    setForm({
      ...emptyForm,

      questions: [
        {
          question: '',
          marks: 10,
        },
      ],

      requirements: [
        {
          requirement: '',
        },
      ],
    });

    setError('');
    setSuccess('');
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /* =========================================================
     OPEN EDIT
  ========================================================= */

  function openEdit(
    assignment: Assignment
  ) {
    setEditingId(assignment.id);

    setForm({
      lesson_id: String(
        assignment.lesson_id
      ),

      title: assignment.title || '',

      description:
        assignment.description || '',

      due_date: assignment.due_date
        ? new Date(
            assignment.due_date
          )
            .toISOString()
            .slice(0, 16)
        : '',

      status:
        assignment.status || 'active',

      questions:
        Array.isArray(assignment.questions) &&
        assignment.questions.length > 0
          ? assignment.questions.map(
              (question) => ({
                id: question.id,
                question:
                  question.question || '',
                marks: Number(
                  question.marks || 0
                ),
              })
            )
          : [
              {
                question: '',
                marks: 10,
              },
            ],

      requirements:
        Array.isArray(
          assignment.requirements
        ) &&
        assignment.requirements.length > 0
          ? assignment.requirements.map(
              (requirement) => ({
                id:
                  requirement.id,
                requirement:
                  requirement.requirement || '',
              })
            )
          : [
              {
                requirement: '',
              },
            ],
    });

    setError('');
    setSuccess('');
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /* =========================================================
     FORM FIELD
  ========================================================= */

  function updateForm(
    field: keyof FormData,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* =========================================================
     QUESTIONS
  ========================================================= */

  function addQuestion() {
    setForm((previous) => ({
      ...previous,

      questions: [
        ...previous.questions,
        {
          question: '',
          marks: 10,
        },
      ],
    }));
  }

  function removeQuestion(
    index: number
  ) {
    setForm((previous) => ({
      ...previous,

      questions:
        previous.questions.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
    }));
  }

  function updateQuestion(
    index: number,
    field: 'question' | 'marks',
    value: string
  ) {
    setForm((previous) => ({
      ...previous,

      questions:
        previous.questions.map(
          (question, itemIndex) =>
            itemIndex === index
              ? {
                  ...question,

                  [field]:
                    field === 'marks'
                      ? Number(value)
                      : value,
                }
              : question
        ),
    }));
  }

  /* =========================================================
     REQUIREMENTS
  ========================================================= */

  function addRequirement() {
    setForm((previous) => ({
      ...previous,

      requirements: [
        ...previous.requirements,
        {
          requirement: '',
        },
      ],
    }));
  }

  function removeRequirement(
    index: number
  ) {
    setForm((previous) => ({
      ...previous,

      requirements:
        previous.requirements.filter(
          (_, itemIndex) =>
            itemIndex !== index
        ),
    }));
  }

  function updateRequirement(
    index: number,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,

      requirements:
        previous.requirements.map(
          (requirement, itemIndex) =>
            itemIndex === index
              ? {
                  ...requirement,
                  requirement: value,
                }
              : requirement
        ),
    }));
  }

  /* =========================================================
     TOTAL MARKS
  ========================================================= */

  const formTotalMarks =
    form.questions.reduce(
      (sum, question) =>
        sum +
        Number(question.marks || 0),
      0
    );

  /* =========================================================
     SAVE ASSIGNMENT
  ========================================================= */

  async function saveAssignment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!form.lesson_id) {
        throw new Error(
          'Please select a lesson.'
        );
      }

      if (!form.title.trim()) {
        throw new Error(
          'Please enter an assignment title.'
        );
      }

      if (
        form.questions.some(
          (question) =>
            !question.question.trim()
        )
      ) {
        throw new Error(
          'Please complete all assignment questions.'
        );
      }

      if (
        form.questions.some(
          (question) =>
            Number(question.marks) < 0
        )
      ) {
        throw new Error(
          'Question marks cannot be negative.'
        );
      }

      const url = editingId
        ? `/api/lecturer/assignments/${editingId}`
        : '/api/lecturer/assignments';

      const method = editingId
        ? 'PUT'
        : 'POST';

      const response = await fetch(
        url,
        {
          method,

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            lesson_id:
              Number(form.lesson_id),

            title:
              form.title.trim(),

            description:
              form.description.trim(),

            due_date:
              form.due_date || null,

            status:
              form.status,

            questions:
              form.questions,

            requirements:
              form.requirements.filter(
                (item) =>
                  item.requirement.trim()
              ),
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
            'Unable to save assignment.'
        );
      }

      setSuccess(
        editingId
          ? 'Assignment updated successfully.'
          : 'Assignment created successfully.'
      );

      setShowForm(false);
      setEditingId(null);

      await loadAssignments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save assignment.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE
  ========================================================= */

  async function deleteAssignment(
    id: number
  ) {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this assignment? This will also delete its questions and requirements.'
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError('');
      setSuccess('');

      const response = await fetch(
        `/api/lecturer/assignments/${id}`,
        {
          method: 'DELETE',
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
            'Unable to delete assignment.'
        );
      }

      setSuccess(
        'Assignment deleted successfully.'
      );

      if (expandedId === id) {
        setExpandedId(null);
      }

      await loadAssignments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete assignment.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return 'No due date';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleString(
      'en-KE',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    );
  }

  /* =========================================================
     STATUS CLASS
  ========================================================= */

  function getStatusClass(
    status: string
  ) {
    const normalized =
      String(status || '')
        .toLowerCase()
        .trim();

    if (normalized === 'active') {
      return 'bg-green-50 text-green-700';
    }

    if (normalized === 'draft') {
      return 'bg-amber-50 text-amber-700';
    }

    return 'bg-slate-100 text-slate-500';
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <Link
              href="/lecturer/dashboard"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-green"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Lecturer Portal
            </p>

            <h1 className="mt-1 text-3xl font-bold text-brand-dark">
              Assignments
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Create, manage, organize and grade
              assignments for lessons in your
              assigned courses.
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={loadAssignments}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-brand-dark shadow-sm transition hover:border-brand-green hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading
                    ? 'animate-spin'
                    : ''
                }`}
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
            >
              <Plus className="h-4 w-4" />
              Create Assignment
            </button>

          </div>

        </div>

        {/* ==================================================
            ALERTS
        ================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <span>{error}</span>

          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">

            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <span>{success}</span>

          </div>
        )}

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Total Assignments
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {assignments.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">
                <ClipboardCheck className="h-6 w-6 text-brand-green" />
              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Active
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {activeCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Inactive / Draft
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {inactiveCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <Clock className="h-6 w-6 text-slate-500" />
              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Total Marks
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {totalMarks}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/15">
                <ListChecks className="h-6 w-6 text-brand-gold" />
              </div>

            </div>

          </div>

        </div>

        {/* ==================================================
            CREATE / EDIT FORM
        ================================================== */}

        {showForm && (
          <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">

            <div className="border-b border-slate-100 bg-slate-50 p-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">
                    Assignment Management
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-brand-dark">
                    {editingId
                      ? 'Edit Assignment'
                      : 'Create New Assignment'}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Add the assignment details,
                    questions and student
                    requirements.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
                  aria-label="Close form"
                >
                  <X className="h-5 w-5" />
                </button>

              </div>

            </div>

            <form
              onSubmit={saveAssignment}
              className="p-6"
            >

              {/* ==================================================
                  BASIC INFORMATION
              ================================================== */}

              <div className="grid gap-5 lg:grid-cols-2">

                <div className="lg:col-span-2">

                  <label className="mb-2 block text-sm font-bold text-brand-dark">
                    Lesson *
                  </label>

                  <select
                    value={form.lesson_id}
                    onChange={(event) =>
                      updateForm(
                        'lesson_id',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                    required
                  >

                    <option value="">
                      Select lesson
                    </option>

                    {courses.map((course) => {

                      const courseLessons =
                        lessons.filter(
                          (lesson) =>
                            lesson.program_id ===
                            course.id
                        );

                      return (
                        <optgroup
                          key={course.id}
                          label={`${course.name}${
                            course.code
                              ? ` (${course.code})`
                              : ''
                          }`}
                        >

                          {courseLessons.map(
                            (lesson) => (
                              <option
                                key={
                                  lesson.lesson_id
                                }
                                value={
                                  lesson.lesson_id
                                }
                              >
                                {lesson.unit_name}
                                {' → '}
                                {lesson.topic_title}
                                {' → '}
                                {lesson.lesson_title}
                              </option>
                            )
                          )}

                        </optgroup>
                      );
                    })}

                  </select>

                </div>

                <div className="lg:col-span-2">

                  <label className="mb-2 block text-sm font-bold text-brand-dark">
                    Assignment Title *
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      updateForm(
                        'title',
                        event.target.value
                      )
                    }
                    placeholder="e.g. EMT Patient Assessment Assignment"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                    required
                  />

                </div>

                <div className="lg:col-span-2">

                  <label className="mb-2 block text-sm font-bold text-brand-dark">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm(
                        'description',
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Explain what students are expected to do..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-bold text-brand-dark">
                    Due Date
                  </label>

                  <input
                    type="datetime-local"
                    value={form.due_date}
                    onChange={(event) =>
                      updateForm(
                        'due_date',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-bold text-brand-dark">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateForm(
                        'status',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  >

                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                    <option value="draft">
                      Draft
                    </option>

                  </select>

                </div>

              </div>

              {/* ==================================================
                  QUESTIONS
              ================================================== */}

              <div className="mt-8 rounded-2xl border border-slate-200 p-5">

                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <div className="flex items-center gap-2">

                      <ClipboardList className="h-5 w-5 text-brand-green" />

                      <h3 className="font-bold text-brand-dark">
                        Assignment Questions
                      </h3>

                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Add the questions students
                      must answer.
                    </p>

                  </div>

                  <div className="flex items-center gap-3">

                    <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">
                      Total: {formTotalMarks} marks
                    </span>

                    <button
                      type="button"
                      onClick={addQuestion}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-dark"
                    >
                      <Plus className="h-4 w-4" />
                      Add Question
                    </button>

                  </div>

                </div>

                <div className="space-y-4">

                  {form.questions.map(
                    (question, index) => (
                      <div
                        key={
                          question.id ??
                          `question-${index}`
                        }
                        className="rounded-2xl bg-slate-50 p-4"
                      >

                        <div className="mb-3 flex items-center justify-between">

                          <span className="text-sm font-bold text-brand-dark">
                            Question {index + 1}
                          </span>

                          {form.questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeQuestion(
                                  index
                                )
                              }
                              className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          )}

                        </div>

                        <div className="grid gap-4 lg:grid-cols-[1fr_140px]">

                          <textarea
                            value={
                              question.question
                            }
                            onChange={(event) =>
                              updateQuestion(
                                index,
                                'question',
                                event.target.value
                              )
                            }
                            rows={3}
                            placeholder="Enter the assignment question..."
                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                            required
                          />

                          <div>

                            <label className="mb-2 block text-xs font-bold text-slate-500">
                              Marks
                            </label>

                            <input
                              type="number"
                              min="0"
                              value={
                                question.marks
                              }
                              onChange={(event) =>
                                updateQuestion(
                                  index,
                                  'marks',
                                  event.target.value
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                            />

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* ==================================================
                  REQUIREMENTS
              ================================================== */}

              <div className="mt-6 rounded-2xl border border-slate-200 p-5">

                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <div className="flex items-center gap-2">

                      <FileText className="h-5 w-5 text-brand-gold" />

                      <h3 className="font-bold text-brand-dark">
                        Student Requirements
                      </h3>

                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Add instructions or
                      requirements students
                      should follow.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={addRequirement}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
                  >
                    <Plus className="h-4 w-4" />
                    Add Requirement
                  </button>

                </div>

                <div className="space-y-3">

                  {form.requirements.map(
                    (
                      requirement,
                      index
                    ) => (
                      <div
                        key={
                          requirement.id ??
                          `requirement-${index}`
                        }
                        className="flex gap-3"
                      >

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10 text-sm font-bold text-brand-gold">
                          {index + 1}
                        </div>

                        <input
                          type="text"
                          value={
                            requirement.requirement
                          }
                          onChange={(event) =>
                            updateRequirement(
                              index,
                              event.target.value
                            )
                          }
                          placeholder="e.g. Submit your work as a PDF document."
                          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                        />

                        {form.requirements.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeRequirement(
                                index
                              )
                            }
                            className="rounded-xl px-3 text-red-500 transition hover:bg-red-50"
                            aria-label="Remove requirement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* ==================================================
                  FORM ACTIONS
              ================================================== */}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />

                      {editingId
                        ? 'Update Assignment'
                        : 'Create Assignment'}
                    </>
                  )}

                </button>

              </div>

            </form>

          </section>
        )}

        {/* ==================================================
            FILTERS
        ================================================== */}

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

          <div className="grid gap-4 lg:grid-cols-[1fr_240px_180px]">

            <div className="relative">

              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search assignments, lessons, topics..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />

            </div>

            <select
              value={courseFilter}
              onChange={(event) =>
                setCourseFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
            >

              <option value="">
                All Courses
              </option>

              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.name}
                </option>
              ))}

            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
            >

              <option value="">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="draft">
                Draft
              </option>

            </select>

          </div>

        </section>

        {/* ==================================================
            ASSIGNMENTS
        ================================================== */}

        {loading ? (

          <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-soft">

            <div className="text-center">

              <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-green" />

              <p className="mt-3 text-sm font-medium text-slate-500">
                Loading assignments...
              </p>

            </div>

          </div>

        ) : filteredAssignments.length === 0 ? (

          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-soft">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green/10">
              <ClipboardCheck className="h-8 w-8 text-brand-green" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-brand-dark">
              No assignments found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You haven't created any assignments
              matching the current filters.
            </p>

            <button
              type="button"
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              <Plus className="h-4 w-4" />
              Create Your First Assignment
            </button>

          </div>

        ) : (

          <div className="space-y-5">

            {filteredAssignments.map(
              (assignment) => {

                const expanded =
                  expandedId ===
                  assignment.id;

                const questionCount =
                  Array.isArray(
                    assignment.questions
                  )
                    ? assignment.questions.length
                    : 0;

                const requirementCount =
                  Array.isArray(
                    assignment.requirements
                  )
                    ? assignment.requirements.length
                    : 0;

                return (

                  <article
                    key={assignment.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft"
                  >

                    {/* ==================================================
                        ASSIGNMENT HEADER
                    ================================================== */}

                    <div className="p-6">

                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">
                              {assignment.program_code ||
                                assignment.program_name}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                                assignment.status
                              )}`}
                            >
                              {assignment.status ||
                                'Unknown'}
                            </span>

                          </div>

                          <h2 className="mt-3 text-xl font-bold text-brand-dark">
                            {assignment.title}
                          </h2>

                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {assignment.description ||
                              'No description provided.'}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">

                            <span className="inline-flex items-center gap-1.5">
                              <BookOpen className="h-4 w-4 text-brand-green" />
                              {assignment.unit_name}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <FileText className="h-4 w-4 text-brand-gold" />
                              {assignment.topic_title}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <ClipboardList className="h-4 w-4 text-brand-green" />
                              {assignment.lesson_title}
                            </span>

                          </div>

                        </div>

                        {/* ==================================================
                            ACTIONS
                        ================================================== */}

                        <div className="flex shrink-0 flex-wrap items-center gap-2">

                          {/* SUBMISSIONS */}

                          <Link
                            href={`/lecturer/dashboard/assignments/${assignment.id}/submissions`}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark"
                          >
                            <Users className="h-4 w-4" />
                            Submissions
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                assignment
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              deleteAssignment(
                                assignment.id
                              )
                            }
                            disabled={
                              deletingId ===
                              assignment.id
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-4 py-2.5 text-xs font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                          >

                            {deletingId ===
                            assignment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}

                            Delete

                          </button>

                        </div>

                      </div>

                      {/* ==================================================
                          META
                      ================================================== */}

                      <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">

                        {/* MARKS */}

                        <div className="rounded-2xl bg-slate-50 p-4">

                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                            <ListChecks className="h-4 w-4" />
                            Marks
                          </div>

                          <p className="mt-2 text-lg font-bold text-brand-dark">
                            {Number(
                              assignment.total_marks ||
                                0
                            )}
                          </p>

                        </div>

                        {/* QUESTIONS */}

                        <div className="rounded-2xl bg-slate-50 p-4">

                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                            <ClipboardList className="h-4 w-4" />
                            Questions
                          </div>

                          <p className="mt-2 text-lg font-bold text-brand-dark">
                            {questionCount}
                          </p>

                        </div>

                        {/* DUE DATE */}

                        <div className="rounded-2xl bg-slate-50 p-4">

                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                            <Calendar className="h-4 w-4" />
                            Due Date
                          </div>

                          <p className="mt-2 text-sm font-bold text-brand-dark">
                            {formatDate(
                              assignment.due_date
                            )}
                          </p>

                        </div>

                        {/* SUBMISSIONS */}

                        <Link
                          href={`/lecturer/dashboard/assignments/${assignment.id}/submissions`}
                          className="group rounded-2xl bg-brand-green/5 p-4 transition hover:bg-brand-green/10"
                        >

                          <div className="flex items-center justify-between">

                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-green">
                              <Users className="h-4 w-4" />
                              Submissions
                            </div>

                            <ExternalLink className="h-3.5 w-3.5 text-brand-green opacity-60 transition group-hover:opacity-100" />

                          </div>

                          <p className="mt-2 text-sm font-bold text-brand-dark">
                            View Student Submissions
                          </p>

                        </Link>

                      </div>

                      {/* ==================================================
                          DETAILS BUTTON
                      ================================================== */}

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(
                            expanded
                              ? null
                              : assignment.id
                          )
                        }
                        className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-green transition hover:text-brand-gold"
                      >

                        {expanded
                          ? 'Hide Assignment Details'
                          : 'View Assignment Details'}

                        <ChevronDown
                          className={`h-4 w-4 transition ${
                            expanded
                              ? 'rotate-180'
                              : ''
                          }`}
                        />

                      </button>

                    </div>

                    {/* ==================================================
                        DETAILS
                    ================================================== */}

                    {expanded && (

                      <div className="border-t border-slate-100 bg-slate-50 p-6">

                        <div className="grid gap-6 lg:grid-cols-2">

                          {/* ==================================================
                              QUESTIONS
                          ================================================== */}

                          <div>

                            <h3 className="mb-4 flex items-center gap-2 font-bold text-brand-dark">

                              <ClipboardList className="h-5 w-5 text-brand-green" />

                              Questions

                              <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs text-brand-green">
                                {questionCount}
                              </span>

                            </h3>

                            <div className="space-y-3">

                              {questionCount === 0 ? (

                                <div className="rounded-2xl bg-white p-5 text-sm text-slate-500">
                                  No questions have
                                  been added.
                                </div>

                              ) : (

                                assignment.questions.map(
                                  (
                                    question,
                                    index
                                  ) => (

                                    <div
                                      key={
                                        question.id ??
                                        `detail-question-${index}`
                                      }
                                      className="rounded-2xl bg-white p-4"
                                    >

                                      <div className="flex gap-3">

                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-green/10 text-xs font-bold text-brand-green">
                                          {index + 1}
                                        </span>

                                        <div className="min-w-0 flex-1">

                                          <p className="text-sm leading-6 text-brand-dark">
                                            {
                                              question.question
                                            }
                                          </p>

                                          <p className="mt-2 text-xs font-bold text-brand-gold">
                                            {Number(
                                              question.marks ||
                                                0
                                            )}{' '}
                                            marks
                                          </p>

                                        </div>

                                      </div>

                                    </div>

                                  )
                                )

                              )}

                            </div>

                          </div>

                          {/* ==================================================
                              REQUIREMENTS
                          ================================================== */}

                          <div>

                            <h3 className="mb-4 flex items-center gap-2 font-bold text-brand-dark">

                              <FileText className="h-5 w-5 text-brand-gold" />

                              Requirements

                              <span className="rounded-full bg-brand-gold/10 px-2 py-0.5 text-xs text-brand-gold">
                                {requirementCount}
                              </span>

                            </h3>

                            <div className="space-y-3">

                              {requirementCount === 0 ? (

                                <div className="rounded-2xl bg-white p-5 text-sm text-slate-500">
                                  No requirements have
                                  been added.
                                </div>

                              ) : (

                                assignment.requirements.map(
                                  (
                                    requirement,
                                    index
                                  ) => (

                                    <div
                                      key={
                                        requirement.id ??
                                        `detail-requirement-${index}`
                                      }
                                      className="rounded-2xl bg-white p-4"
                                    >

                                      <div className="flex gap-3">

                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-xs font-bold text-brand-gold">
                                          {index + 1}
                                        </span>

                                        <p className="text-sm leading-6 text-brand-dark">
                                          {
                                            requirement.requirement
                                          }
                                        </p>

                                      </div>

                                    </div>

                                  )
                                )

                              )}

                            </div>

                          </div>

                        </div>

                        {/* ==================================================
                            SUBMISSIONS SECTION
                        ================================================== */}

                        <div className="mt-6 rounded-3xl border border-brand-green/10 bg-white p-6">

                          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-start gap-4">

                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">

                                <Users className="h-6 w-6 text-brand-green" />

                              </div>

                              <div>

                                <h3 className="text-lg font-bold text-brand-dark">
                                  Student Submissions
                                </h3>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                  View students who have
                                  submitted this assignment,
                                  review their answers and
                                  grade their work.
                                </p>

                              </div>

                            </div>

                            <Link
                              href={`/lecturer/dashboard/assignments/${assignment.id}/submissions`}
                              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
                            >

                              <Users className="h-4 w-4" />

                              View Submissions

                              <ExternalLink className="h-4 w-4" />

                            </Link>

                          </div>

                        </div>

                      </div>

                    )}

                  </article>

                );
              }
            )}

          </div>

        )}

      </div>

    </main>
  );
}

