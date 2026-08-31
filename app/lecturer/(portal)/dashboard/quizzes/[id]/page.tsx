import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  FileQuestion,
  GraduationCap,
  ListChecks,
  Settings2,
  Users,
  XCircle,
} from 'lucide-react';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

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

  /*
   * IMPORTANT:
   * passingScore is stored as a PERCENTAGE (0 - 100).
   *
   * Example:
   * total_marks   = 20
   * passing_score = 60
   *
   * Means the student needs 60% to pass.
   */
  passingScore: number;

  timeLimitMinutes: number;
  attemptsAllowed: number;

  status: string;

  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;

  availableFrom: string | null;
  availableUntil: string | null;

  createdAt: string | null;
  updatedAt: string | null;

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
  if (!date) {
    return 'Not specified';
  }

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
  if (!date) {
    return 'Not specified';
  }

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
   PASSING SCORE
========================================================= */

/*
 * passing_score is stored directly as a percentage.
 *
 * Examples:
 *
 * 60    -> 60%
 * 70    -> 70%
 * 80    -> 80%
 *
 * We deliberately DO NOT do:
 *
 * (passingScore / totalMarks) * 100
 *
 * because passingScore is already a percentage.
 */

function normalizePassingPercentage(
  value: number
) {
  const percentage = Number(value);

  if (!Number.isFinite(percentage)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, percentage)
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function QuizStatus({
  status,
}: {
  status: string;
}) {
  const normalized =
    status?.toLowerCase();

  if (
    normalized === 'active' ||
    normalized === 'published'
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
        <CheckCircle2 className="h-4 w-4" />
        Active
      </span>
    );
  }

  if (
    normalized === 'closed' ||
    normalized === 'expired'
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
        <XCircle className="h-4 w-4" />
        Closed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
      <Clock3 className="h-4 w-4" />
      Draft
    </span>
  );
}

/* =========================================================
   BOOLEAN SETTING
========================================================= */

function SettingValue({
  enabled,
}: {
  enabled: boolean;
}) {
  return enabled ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Enabled
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
      <XCircle className="h-3.5 w-3.5" />
      Disabled
    </span>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function LecturerQuizManagementPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  /* =======================================================
     AUTHENTICATION
  ======================================================= */

  const lecturer =
    await requireLecturer();

  if (!lecturer) {
    redirect('/lecturer/login');
  }

  /* =======================================================
     PARAMETER
  ======================================================= */

  const { id } = await params;

  const quizId = Number(id);

  if (
    !Number.isInteger(quizId) ||
    quizId <= 0
  ) {
    notFound();
  }

  /* =======================================================
     GET QUIZ
     
     RELATIONSHIP:

     lms_quizzes
       ↓ lesson_id
     lms_lessons
       ↓ topic_id
     lms_topics
       ↓ unit_id
     lms_units
       ↓ program_id
     lms_programs

     Lecturer authorization:

     lms_lecturer_programs
       ↓ program_id
     lms_programs
  ======================================================= */

  let quiz: Quiz | null = null;

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
          q.updated_at,

          l.id AS lesson_id_ref,
          l.title AS lesson_title,

          t.id AS topic_id,
          t.title AS topic_title,

          u.id AS unit_id,
          u.code AS unit_code,
          u.name AS unit_name,

          p.id AS program_id,
          p.name AS program_name,

          COUNT(DISTINCT qq.id)::integer
            AS question_count,

          COUNT(DISTINCT qa.id)::integer
            AS attempt_count

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

        LEFT JOIN lms_quiz_questions qq
          ON qq.quiz_id = q.id

        LEFT JOIN lms_quiz_attempts qa
          ON qa.quiz_id = q.id

        WHERE
          q.id = $1
          AND lp.lecturer_id = $2

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
          q.updated_at,

          l.id,
          l.title,

          t.id,
          t.title,

          u.id,
          u.code,
          u.name,

          p.id,
          p.name

        LIMIT 1
      `,
      [quizId, lecturer.id]
    );

    if (result.rows.length === 0) {
      notFound();
    }

    const row =
      result.rows[0];

    quiz = {
      id: Number(row.id),

      lessonId:
        Number(row.lesson_id),

      title:
        row.title ?? 'Untitled Assessment',

      description:
        row.description ?? null,

      instructions:
        row.instructions ?? null,

      totalMarks:
        Number(row.total_marks) || 0,

      /*
       * passing_score is a percentage.
       *
       * Do NOT convert it using total_marks.
       */
      passingScore:
        Number(row.passing_score) || 0,

      timeLimitMinutes:
        Number(
          row.time_limit_minutes
        ) || 0,

      attemptsAllowed:
        Number(
          row.attempts_allowed
        ) || 1,

      status:
        row.status ?? 'draft',

      shuffleQuestions:
        Boolean(
          row.shuffle_questions
        ),

      shuffleOptions:
        Boolean(
          row.shuffle_options
        ),

      showResults:
        Boolean(
          row.show_results
        ),

      showCorrectAnswers:
        Boolean(
          row.show_correct_answers
        ),

      availableFrom:
        row.available_from ?? null,

      availableUntil:
        row.available_until ?? null,

      createdAt:
        row.created_at ?? null,

      updatedAt:
        row.updated_at ?? null,

      lesson: {
        id: Number(
          row.lesson_id_ref
        ),
        title:
          row.lesson_title,
      },

      topic: {
        id: Number(
          row.topic_id
        ),
        title:
          row.topic_title,
      },

      unit: {
        id: Number(
          row.unit_id
        ),
        code:
          row.unit_code,
        name:
          row.unit_name,
      },

      program: {
        id: Number(
          row.program_id
        ),
        name:
          row.program_name,
      },

      questionCount:
        Number(
          row.question_count
        ) || 0,

      attemptCount:
        Number(
          row.attempt_count
        ) || 0,
    };
  } catch (error) {
    console.error(
      'GET LECTURER QUIZ MANAGEMENT ERROR:',
      error
    );

    throw error;
  }

  if (!quiz) {
    notFound();
  }

  /* =======================================================
     DERIVED VALUES
  ======================================================= */

  /*
   * IMPORTANT:
   *
   * passingScore is ALREADY a percentage.
   *
   * Therefore:
   *
   * passing_score = 60
   *
   * displays:
   *
   * 60%
   *
   * NOT:
   *
   * (60 / total_marks) * 100
   */

  const passingPercentage =
    normalizePassingPercentage(
      quiz.passingScore
    );

  const status =
    quiz.status?.toLowerCase();

  const isActive =
    status === 'active' ||
    status === 'published';

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            BACK
        ================================================== */}

        <Link
          href="/lecturer/dashboard/quizzes"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-brand-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Quizzes & Exams
        </Link>

        {/* ==================================================
            HEADER
        ================================================== */}

        <section className="mt-5 overflow-hidden rounded-3xl bg-brand-green shadow-soft">

          <div className="relative p-6 sm:p-8">

            <div className="relative z-10">

              <div className="flex flex-wrap items-center gap-3">

                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Lecturer Assessment Centre
                </span>

                <QuizStatus
                  status={quiz.status}
                />

              </div>

              <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                <div className="max-w-3xl">

                  <h1 className="text-2xl font-bold text-white sm:text-3xl">
                    {quiz.title}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/70">

                    <span className="font-semibold text-white/90">
                      {quiz.program.name}
                    </span>

                    <ChevronRight className="h-4 w-4" />

                    <span>
                      {quiz.unit.code}
                    </span>

                    <ChevronRight className="h-4 w-4" />

                    <span>
                      {quiz.topic.title}
                    </span>

                    <ChevronRight className="h-4 w-4" />

                    <span>
                      {quiz.lesson.title}
                    </span>

                  </div>

                </div>

                <Link
                  href={`/lecturer/dashboard/quizzes/${quiz.id}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-gold px-5 py-3 text-sm font-bold text-brand-dark transition hover:brightness-95"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Assessment
                </Link>

              </div>

            </div>

            <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border-[45px] border-brand-gold/10" />

            <div className="pointer-events-none absolute -bottom-28 right-28 h-56 w-56 rounded-full border-[35px] border-white/5" />

          </div>

        </section>

        {/* ==================================================
            QUICK STATS
        ================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* QUESTIONS */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Questions
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {quiz.questionCount}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
                <FileQuestion className="h-5 w-5 text-blue-600" />
              </div>

            </div>

            <p className="mt-2 text-xs text-slate-400">
              Questions in this assessment
            </p>

          </div>

          {/* TOTAL MARKS */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Total Marks
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {quiz.totalMarks}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <ListChecks className="h-5 w-5 text-brand-green" />
              </div>

            </div>

            <p className="mt-2 text-xs text-slate-400">
              Maximum obtainable marks
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
                  {quiz.attemptCount}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50">
                <Users className="h-5 w-5 text-purple-600" />
              </div>

            </div>

            <p className="mt-2 text-xs text-slate-400">
              Student attempts
            </p>

          </div>

          {/* PASS MARK */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Pass Mark
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {passingPercentage}%
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

            </div>

            <p className="mt-2 text-xs text-slate-400">
              Minimum percentage required to pass
            </p>

          </div>

        </section>

        {/* ==================================================
            MAIN GRID
        ================================================== */}

        <section className="mt-6 grid gap-6 lg:grid-cols-3">

          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <div className="space-y-6 lg:col-span-2">

            {/* ASSESSMENT DETAILS */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">
                  <BookOpen className="h-5 w-5 text-brand-green" />
                </div>

                <div>

                  <h2 className="text-base font-bold text-brand-dark">
                    Assessment Details
                  </h2>

                  <p className="text-xs text-slate-400">
                    Information presented to students
                  </p>

                </div>

              </div>

              {quiz.description ? (

                <div className="mt-6 rounded-2xl bg-slate-50 p-5">

                  <p className="text-sm leading-7 text-slate-600">
                    {quiz.description}
                  </p>

                </div>

              ) : (

                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-400">
                  No description has been added.
                </div>

              )}

              {quiz.instructions && (

                <div className="mt-4">

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Instructions
                  </p>

                  <div className="mt-2 rounded-2xl bg-slate-50 p-5">

                    <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                      {quiz.instructions}
                    </p>

                  </div>

                </div>

              )}

            </div>

            {/* QUESTION MANAGEMENT */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <FileQuestion className="h-5 w-5 text-blue-600" />
                  </div>

                  <div>

                    <h2 className="text-base font-bold text-brand-dark">
                      Question Bank
                    </h2>

                    <p className="text-xs text-slate-400">
                      Build and manage assessment questions
                    </p>

                  </div>

                </div>

                <Link
                  href={`/lecturer/dashboard/quizzes/${quiz.id}/questions`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark"
                >
                  <ListChecks className="h-4 w-4" />
                  Manage Questions
                </Link>

              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Questions
                  </p>

                  <p className="mt-2 text-2xl font-bold text-brand-dark">
                    {quiz.questionCount}
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Total Marks
                  </p>

                  <p className="mt-2 text-2xl font-bold text-brand-dark">
                    {quiz.totalMarks}
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Pass Mark
                  </p>

                  <p className="mt-2 text-2xl font-bold text-brand-dark">
                    {passingPercentage}%
                  </p>

                </div>

              </div>

            </div>

            {/* STUDENT ATTEMPTS */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>

                  <div>

                    <h2 className="text-base font-bold text-brand-dark">
                      Student Attempts
                    </h2>

                    <p className="text-xs text-slate-400">
                      Monitor student submissions and performance
                    </p>

                  </div>

                </div>

                <Link
                  href={`/lecturer/dashboard/quizzes/${quiz.id}/attempts`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-brand-dark transition hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" />
                  View Attempts
                </Link>

              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <p className="text-sm font-bold text-brand-dark">
                      {quiz.attemptCount} student attempt
                      {quiz.attemptCount === 1
                        ? ''
                        : 's'}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      View scores, percentages and submission details.
                    </p>

                  </div>

                  <Users className="h-6 w-6 shrink-0 text-slate-300" />

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <div className="space-y-6">

            {/* SETTINGS */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">
                  <Settings2 className="h-5 w-5 text-brand-green" />
                </div>

                <div>

                  <h2 className="text-base font-bold text-brand-dark">
                    Assessment Settings
                  </h2>

                  <p className="text-xs text-slate-400">
                    Current configuration
                  </p>

                </div>

              </div>

              <div className="mt-6 divide-y divide-slate-100">

                {/* TIME LIMIT */}

                <div className="flex items-center justify-between gap-4 py-4">

                  <div>

                    <p className="text-sm font-semibold text-brand-dark">
                      Time Limit
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Duration allowed
                    </p>

                  </div>

                  <span className="text-sm font-bold text-brand-dark">
                    {quiz.timeLimitMinutes > 0
                      ? `${quiz.timeLimitMinutes} min`
                      : 'Unlimited'}
                  </span>

                </div>

                {/* ATTEMPTS */}

                <div className="flex items-center justify-between gap-4 py-4">

                  <div>

                    <p className="text-sm font-semibold text-brand-dark">
                      Attempts
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Attempts allowed
                    </p>

                  </div>

                  <span className="text-sm font-bold text-brand-dark">
                    {quiz.attemptsAllowed}
                  </span>

                </div>

                {/* PASSING SCORE */}

                <div className="flex items-center justify-between gap-4 py-4">

                  <div>

                    <p className="text-sm font-semibold text-brand-dark">
                      Passing Score
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Minimum percentage required
                    </p>

                  </div>

                  <span className="text-sm font-bold text-brand-dark">
                    {passingPercentage}%
                  </span>

                </div>

                {/* SHUFFLE QUESTIONS */}

                <div className="py-4">

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <p className="text-sm font-semibold text-brand-dark">
                        Shuffle Questions
                      </p>

                    </div>

                    <SettingValue
                      enabled={
                        quiz.shuffleQuestions
                      }
                    />

                  </div>

                </div>

                {/* SHUFFLE OPTIONS */}

                <div className="py-4">

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <p className="text-sm font-semibold text-brand-dark">
                        Shuffle Options
                      </p>

                    </div>

                    <SettingValue
                      enabled={
                        quiz.shuffleOptions
                      }
                    />

                  </div>

                </div>

                {/* SHOW RESULTS */}

                <div className="py-4">

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <p className="text-sm font-semibold text-brand-dark">
                        Show Results
                      </p>

                    </div>

                    <SettingValue
                      enabled={
                        quiz.showResults
                      }
                    />

                  </div>

                </div>

                {/* SHOW CORRECT ANSWERS */}

                <div className="py-4">

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <p className="text-sm font-semibold text-brand-dark">
                        Show Correct Answers
                      </p>

                    </div>

                    <SettingValue
                      enabled={
                        quiz.showCorrectAnswers
                      }
                    />

                  </div>

                </div>

              </div>

              <Link
                href={`/lecturer/dashboard/quizzes/${quiz.id}/edit`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-brand-dark transition hover:bg-slate-50"
              >
                <Edit3 className="h-4 w-4" />
                Edit Settings
              </Link>

            </div>

            {/* AVAILABILITY */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <CalendarDays className="h-5 w-5 text-amber-600" />
                </div>

                <div>

                  <h2 className="text-base font-bold text-brand-dark">
                    Availability
                  </h2>

                  <p className="text-xs text-slate-400">
                    When students can access it
                  </p>

                </div>

              </div>

              <div className="mt-6 space-y-4">

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Available From
                  </p>

                  <p className="mt-2 text-sm font-semibold text-brand-dark">
                    {quiz.availableFrom
                      ? formatDate(
                          quiz.availableFrom
                        )
                      : 'Immediately'}
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Available Until
                  </p>

                  <p className="mt-2 text-sm font-semibold text-brand-dark">
                    {quiz.availableUntil
                      ? formatDate(
                          quiz.availableUntil
                        )
                      : 'No closing date'}
                  </p>

                </div>

              </div>

            </div>

            {/* COURSE LOCATION */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>

                <div>

                  <h2 className="text-base font-bold text-brand-dark">
                    Course Location
                  </h2>

                  <p className="text-xs text-slate-400">
                    Assessment curriculum placement
                  </p>

                </div>

              </div>

              <div className="mt-6 space-y-3">

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Program
                  </p>

                  <p className="mt-1 text-sm font-bold text-brand-dark">
                    {quiz.program.name}
                  </p>

                </div>

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Unit
                  </p>

                  <p className="mt-1 text-sm font-semibold text-brand-dark">
                    {quiz.unit.code} · {quiz.unit.name}
                  </p>

                </div>

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Topic
                  </p>

                  <p className="mt-1 text-sm font-semibold text-brand-dark">
                    {quiz.topic.title}
                  </p>

                </div>

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Lesson
                  </p>

                  <p className="mt-1 text-sm font-semibold text-brand-dark">
                    {quiz.lesson.title}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="mt-8 rounded-3xl bg-brand-green p-7 shadow-soft">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
                SMTC Lecturer Portal
              </p>

              <h2 className="mt-2 text-xl font-bold text-white">
                {isActive
                  ? 'Assessment is available to students.'
                  : 'Assessment is being prepared.'}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                Manage questions, assessment settings and
                student attempts from this assessment centre.
              </p>

            </div>

            <Link
              href={`/lecturer/dashboard/quizzes/${quiz.id}/questions`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 py-3 text-sm font-bold text-brand-dark transition hover:brightness-95"
            >
              <FileQuestion className="h-4 w-4" />
              Manage Questions
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}

