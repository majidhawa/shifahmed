
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  FileQuestion,
  GraduationCap,
  Pencil,
  Plus,
  Users,
  XCircle,
} from 'lucide-react';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';
import QuizDeleteButton from './QuizDeleteButton';

/* =========================================================
   TYPES
========================================================= */

type Quiz = {
  id: number;
  lessonId: number;
  title: string;
  description: string | null;
  instructions: string | null;

  totalMarks: number;
  timeLimitMinutes: number;
  attemptsAllowed: number;
  passingScore: number;

  status: string;

  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;

  availableFrom: string | null;
  availableUntil: string | null;
  createdAt: string | null;

  lesson: {
    id: number;
    title: string;
  };

  topic: {
    id: number;
    title: string;
  };

  unit: {
    id: number;
    code: string;
    name: string;
  };

  program: {
    id: number;
    name: string;
  };

  questionCount: number;
  attemptCount: number;
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date: string | null) {
  if (!date) return 'Not specified';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function formatShortDate(date: string | null) {
  if (!date) return '—';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

/* =========================================================
   STATUS
========================================================= */

function QuizStatus({
  status,
}: {
  status: string;
}) {
  const normalized = status?.toLowerCase();

  if (
    normalized === 'active' ||
    normalized === 'published'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active
      </span>
    );
  }

  if (
    normalized === 'draft' ||
    normalized === 'inactive'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
        <Clock3 className="h-3.5 w-3.5" />
        Draft
      </span>
    );
  }

  if (
    normalized === 'closed' ||
    normalized === 'expired'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        Closed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
      {status || 'Unknown'}
    </span>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function LecturerQuizzesPage() {
  /* =======================================================
     AUTH
  ======================================================= */

  const lecturer = await requireLecturer();

  if (!lecturer) {
    redirect('/lecturer/login');
  }

  /* =======================================================
     FETCH QUIZZES
  ======================================================= */

  let quizzes: Quiz[] = [];

  try {
    const result = await pool.query(
      `
        SELECT
          q.id,
          q.lesson_id,
          q.title,
          q.description,
          q.instructions,

          q.total_marks,
          q.time_limit_minutes,
          q.attempts_allowed,
          q.passing_score,

          q.status,

          q.shuffle_questions,
          q.shuffle_options,
          q.show_results,
          q.show_correct_answers,

          q.available_from,
          q.available_until,
          q.created_at,

          l.id AS lesson_id_ref,
          l.title AS lesson_title,

          t.id AS topic_id,
          t.title AS topic_title,

          u.id AS unit_id,
          u.code AS unit_code,
          u.name AS unit_name,

          p.id AS program_id,
          p.name AS program_name,

          COUNT(DISTINCT qq.id)::integer AS question_count,

          COUNT(DISTINCT qa.id)::integer AS attempt_count

        FROM lms_quizzes q

        INNER JOIN lms_lessons l
          ON l.id = q.lesson_id

        INNER JOIN lms_topics t
          ON t.id = l.topic_id

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_programs p
          ON p.id = u.program_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = p.id
          AND lp.lecturer_id = $1

        LEFT JOIN lms_quiz_questions qq
          ON qq.quiz_id = q.id

        LEFT JOIN lms_quiz_attempts qa
          ON qa.quiz_id = q.id

        GROUP BY
          q.id,
          q.lesson_id,
          q.title,
          q.description,
          q.instructions,

          q.total_marks,
          q.time_limit_minutes,
          q.attempts_allowed,
          q.passing_score,

          q.status,

          q.shuffle_questions,
          q.shuffle_options,
          q.show_results,
          q.show_correct_answers,

          q.available_from,
          q.available_until,
          q.created_at,

          l.id,
          l.title,

          t.id,
          t.title,

          u.id,
          u.code,
          u.name,

          p.id,
          p.name

        ORDER BY
          q.created_at DESC NULLS LAST,
          q.id DESC
      `,
      [lecturer.id]
    );

    quizzes = result.rows.map((row) => ({
      id: Number(row.id),
      lessonId: Number(row.lesson_id),

      title: String(row.title ?? ''),

      description:
        row.description ?? null,

      instructions:
        row.instructions ?? null,

      totalMarks:
        Number(row.total_marks) || 0,

      timeLimitMinutes:
        Number(row.time_limit_minutes) || 0,

      attemptsAllowed:
        Number(row.attempts_allowed) || 1,

      passingScore:
        Number(row.passing_score) || 0,

      status:
        row.status ?? 'draft',

      shuffleQuestions:
        Boolean(row.shuffle_questions),

      shuffleOptions:
        Boolean(row.shuffle_options),

      showResults:
        Boolean(row.show_results),

      showCorrectAnswers:
        Boolean(row.show_correct_answers),

      availableFrom:
        row.available_from ?? null,

      availableUntil:
        row.available_until ?? null,

      createdAt:
        row.created_at ?? null,

      lesson: {
        id: Number(row.lesson_id_ref),
        title: String(row.lesson_title ?? ''),
      },

      topic: {
        id: Number(row.topic_id),
        title: String(row.topic_title ?? ''),
      },

      unit: {
        id: Number(row.unit_id),
        code: String(row.unit_code ?? ''),
        name: String(row.unit_name ?? ''),
      },

      program: {
        id: Number(row.program_id),
        name: String(row.program_name ?? ''),
      },

      questionCount:
        Number(row.question_count) || 0,

      attemptCount:
        Number(row.attempt_count) || 0,
    }));
  } catch (error) {
    console.error(
      'GET LECTURER QUIZZES ERROR:',
      error
    );
  }

  /* =========================================================
     STATISTICS
  ========================================================= */

  const totalQuizzes = quizzes.length;

  const activeQuizzes = quizzes.filter(
    (quiz) => {
      const status = quiz.status?.toLowerCase();

      return (
        status === 'active' ||
        status === 'published'
      );
    }
  ).length;

  const draftQuizzes = quizzes.filter(
    (quiz) => {
      const status = quiz.status?.toLowerCase();

      return (
        status === 'draft' ||
        status === 'inactive'
      );
    }
  ).length;

  const totalQuestions = quizzes.reduce(
    (total, quiz) =>
      total + quiz.questionCount,
    0
  );

  const totalAttempts = quizzes.reduce(
    (total, quiz) =>
      total + quiz.attemptCount,
    0
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="overflow-hidden rounded-3xl bg-brand-green shadow-soft">

          <div className="relative p-6 sm:p-8">

            <div className="relative z-10">

              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">

                <ClipboardList className="h-3.5 w-3.5" />

                Lecturer Assessment Centre

              </span>

              <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                <div>

                  <h1 className="text-2xl font-bold text-white sm:text-3xl">
                    Quizzes & Exams
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                    Create, manage and monitor online quizzes
                    and examinations for your students.
                  </p>

                </div>

                <Link
                  href="/lecturer/dashboard/quizzes/create"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-gold px-5 py-3 text-sm font-bold text-brand-dark transition hover:brightness-95"
                >
                  <Plus className="h-4 w-4" />
                  Create Quiz / Exam
                </Link>

              </div>

            </div>

            <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border-[45px] border-brand-gold/10" />

            <div className="pointer-events-none absolute -bottom-32 right-20 h-60 w-60 rounded-full border-[35px] border-white/5" />

          </div>

        </section>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">

          {/* TOTAL */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Assessments
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {totalQuizzes}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">

                <ClipboardList className="h-5 w-5 text-brand-green" />

              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Total quizzes & exams
            </p>

          </div>

          {/* ACTIVE */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Active
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {activeQuizzes}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">

                <CheckCircle2 className="h-5 w-5 text-green-600" />

              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Available to students
            </p>

          </div>

          {/* DRAFT */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Drafts
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {draftQuizzes}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50">

                <Clock3 className="h-5 w-5 text-amber-600" />

              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Still being prepared
            </p>

          </div>

          {/* QUESTIONS */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Questions
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {totalQuestions}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">

                <FileQuestion className="h-5 w-5 text-blue-600" />

              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Across all assessments
            </p>

          </div>

          {/* ATTEMPTS */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Attempts
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {totalAttempts}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50">

                <Users className="h-5 w-5 text-purple-600" />

              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Student attempts
            </p>

          </div>

        </section>

        {/* =================================================
            QUIZZES
        ================================================= */}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-soft">

          {/* SECTION HEADER */}

          <div className="border-b border-slate-100 p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  My Quizzes & Exams
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage assessments assigned to your
                  programs and lessons.
                </p>

              </div>

              <Link
                href="/lecturer/dashboard/quizzes/create"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark"
              >
                <Plus className="h-4 w-4" />
                New Assessment
              </Link>

            </div>

          </div>

          {/* =================================================
              EMPTY
          ================================================= */}

          {quizzes.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-green/10">

                <ClipboardList className="h-8 w-8 text-brand-green" />

              </div>

              <h3 className="mt-5 text-lg font-bold text-brand-dark">
                No quizzes or exams yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first online assessment and
                add questions for your students.
              </p>

              <Link
                href="/lecturer/dashboard/quizzes/create"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                <Plus className="h-4 w-4" />
                Create First Assessment
              </Link>

            </div>

          ) : (

            <>

              {/* =================================================
                  DESKTOP TABLE
              ================================================= */}

              <div className="hidden overflow-x-auto md:block">

                <table className="w-full text-left">

                  <thead className="border-b border-slate-100 bg-slate-50/70">

                    <tr>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Assessment
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Course Structure
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Questions
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Attempts
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Availability
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {quizzes.map((quiz) => (

                      <tr
                        key={quiz.id}
                        className="transition hover:bg-slate-50/70"
                      >

                        {/* ASSESSMENT */}

                        <td className="px-6 py-5">

                          <div className="min-w-[240px]">

                            <div className="flex items-start gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10">

                                <ClipboardList className="h-5 w-5 text-brand-green" />

                              </div>

                              <div>

                                <p className="font-bold text-brand-dark">
                                  {quiz.title}
                                </p>

                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">

                                  <span>
                                    {quiz.totalMarks} marks
                                  </span>

                                  <span>•</span>

                                  <span>
                                    {quiz.timeLimitMinutes > 0
                                      ? `${quiz.timeLimitMinutes} min`
                                      : 'No time limit'}
                                  </span>

                                </div>

                              </div>

                            </div>

                          </div>

                        </td>

                        {/* COURSE */}

                        <td className="px-6 py-5">

                          <div className="min-w-[220px]">

                            <p className="text-sm font-bold text-brand-dark">
                              {quiz.program.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {quiz.unit.code} · {quiz.unit.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {quiz.topic.title} · {quiz.lesson.title}
                            </p>

                          </div>

                        </td>

                        {/* QUESTIONS */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-2">

                            <FileQuestion className="h-4 w-4 text-slate-400" />

                            <span className="text-sm font-bold text-brand-dark">
                              {quiz.questionCount}
                            </span>

                          </div>

                        </td>

                        {/* ATTEMPTS */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-2">

                            <Users className="h-4 w-4 text-slate-400" />

                            <span className="text-sm font-bold text-brand-dark">
                              {quiz.attemptCount}
                            </span>

                          </div>

                        </td>

                        {/* AVAILABILITY */}

                        <td className="px-6 py-5">

                          <div className="min-w-[150px]">

                            {quiz.availableFrom ? (

                              <p className="text-xs font-semibold text-slate-600">
                                From {formatShortDate(quiz.availableFrom)}
                              </p>

                            ) : (

                              <p className="text-xs text-slate-400">
                                Immediately
                              </p>

                            )}

                            {quiz.availableUntil && (

                              <p className="mt-1 text-xs text-slate-400">
                                Until {formatShortDate(quiz.availableUntil)}
                              </p>

                            )}

                          </div>

                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">

                          <QuizStatus
                            status={quiz.status}
                          />

                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-5">

                          <div className="flex items-center justify-end gap-2">

                            {/* MANAGE */}

                            <Link
                              href={`/lecturer/dashboard/quizzes/${quiz.id}`}
                              title="Manage assessment"
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-green px-3 text-xs font-bold text-white transition hover:bg-brand-dark"
                            >
                              <Eye className="h-4 w-4" />
                              Manage
                            </Link>

                            {/* EDIT */}

                            <Link
                              href={`/lecturer/dashboard/quizzes/${quiz.id}/edit`}
                              title="Edit assessment"
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Link>

                            {/* DELETE */}

                            <QuizDeleteButton
                              quizId={quiz.id}
                              quizTitle={quiz.title}
                            />

                          </div>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

              {/* =================================================
                  MOBILE
              ================================================= */}

              <div className="space-y-4 p-4 md:hidden">

                {quizzes.map((quiz) => (

                  <div
                    key={quiz.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
                  >

                    {/* HEADER */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex min-w-0 items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10">

                          <ClipboardList className="h-5 w-5 text-brand-green" />

                        </div>

                        <div className="min-w-0">

                          <p className="text-sm font-bold text-brand-dark">
                            {quiz.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {quiz.program.name}
                          </p>

                        </div>

                      </div>

                      <QuizStatus
                        status={quiz.status}
                      />

                    </div>

                    {/* STRUCTURE */}

                    <div className="mt-5 space-y-2">

                      <div className="flex items-center gap-2 text-xs text-slate-500">

                        <BookOpen className="h-3.5 w-3.5 shrink-0" />

                        <span>
                          {quiz.unit.code} · {quiz.unit.name}
                        </span>

                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">

                        <GraduationCap className="h-3.5 w-3.5 shrink-0" />

                        <span>
                          {quiz.topic.title} · {quiz.lesson.title}
                        </span>

                      </div>

                    </div>

                    {/* STATS */}

                    <div className="mt-5 grid grid-cols-3 gap-3">

                      <div className="rounded-xl bg-white p-3">

                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Questions
                        </p>

                        <p className="mt-1 text-sm font-bold text-brand-dark">
                          {quiz.questionCount}
                        </p>

                      </div>

                      <div className="rounded-xl bg-white p-3">

                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Marks
                        </p>

                        <p className="mt-1 text-sm font-bold text-brand-dark">
                          {quiz.totalMarks}
                        </p>

                      </div>

                      <div className="rounded-xl bg-white p-3">

                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Attempts
                        </p>

                        <p className="mt-1 text-sm font-bold text-brand-dark">
                          {quiz.attemptCount}
                        </p>

                      </div>

                    </div>

                    {/* AVAILABILITY */}

                    <div className="mt-4 rounded-xl bg-white p-3">

                      <div className="flex items-center gap-2">

                        <CalendarDays className="h-4 w-4 text-slate-400" />

                        <div>

                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Availability
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-600">

                            {quiz.availableFrom
                              ? formatDate(quiz.availableFrom)
                              : 'Available immediately'}

                          </p>

                          {quiz.availableUntil && (

                            <p className="mt-1 text-xs text-slate-400">
                              Until {formatDate(quiz.availableUntil)}
                            </p>

                          )}

                        </div>

                      </div>

                    </div>

                    {/* MOBILE ACTIONS */}

                    <div className="mt-4 grid grid-cols-3 gap-2">

                      <Link
                        href={`/lecturer/dashboard/quizzes/${quiz.id}`}
                        className="inline-flex items-center justify-center gap-1 rounded-xl bg-brand-green px-2 py-3 text-xs font-bold text-white transition hover:bg-brand-dark"
                      >
                        <Eye className="h-4 w-4" />
                        Manage
                      </Link>

                      <Link
                        href={`/lecturer/dashboard/quizzes/${quiz.id}/edit`}
                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2 py-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>

                      <QuizDeleteButton
                        quizId={quiz.id}
                        quizTitle={quiz.title}
                        mobile
                      />

                    </div>

                  </div>

                ))}

              </div>

            </>

          )}

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="mt-8 rounded-3xl bg-brand-green p-7 shadow-soft">

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
            SMTC Lecturer Portal
          </p>

          <h2 className="mt-2 text-xl font-bold text-white">
            Create. Assess. Measure student progress.
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
            Build structured online assessments, manage
            student attempts and monitor performance from
            one place.
          </p>

        </div>

      </div>

    </main>
  );
}

