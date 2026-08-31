import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileQuestion,
  ListChecks,
  Plus,
  Trash2,
} from 'lucide-react';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

/* =========================================================
   TYPES
========================================================= */

type QuizQuestion = {
  id: number;
  quizId: number;
  questionText: string;
  questionType: string;
  marks: number;
  questionOrder: number;
  explanation: string | null;
  optionsJson: unknown;
  correctAnswer: string | null;
  createdAt: string | null;
  updatedAt: string | null;

  options: QuizOption[];
};

type QuizOption = {
  id: number;
  questionId: number;
  optionText: string;
  isCorrect: boolean;
  optionOrder: number;
};

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
};

/* =========================================================
   HELPERS
========================================================= */

function formatQuestionType(type: string) {
  const normalized = type?.toLowerCase();

  switch (normalized) {
    case 'mcq':
    case 'multiple_choice':
    case 'multiple-choice':
      return 'Multiple Choice';

    case 'true_false':
    case 'true-false':
    case 'boolean':
      return 'True / False';

    case 'short_answer':
    case 'short-answer':
      return 'Short Answer';

    case 'essay':
    case 'long_answer':
    case 'long-answer':
      return 'Essay';

    default:
      return type || 'Question';
  }
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

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
      {status || 'Draft'}
    </span>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function QuizQuestionsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  /* =======================================================
     AUTHENTICATION
  ======================================================= */

  const lecturer = await requireLecturer();

  if (!lecturer) {
    redirect('/lecturer/login');
  }

  /* =======================================================
     PARAMS
  ======================================================= */

  const { id } = await params;

  const quizId = Number(id);

  if (!Number.isInteger(quizId) || quizId <= 0) {
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
    const quizResult = await pool.query(
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

          l.id AS lesson_id_ref,
          l.title AS lesson_title,

          t.id AS topic_id,
          t.title AS topic_title,

          u.id AS unit_id,
          u.code AS unit_code,
          u.name AS unit_name,

          p.id AS program_id,
          p.name AS program_name

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

        WHERE
          q.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [quizId, lecturer.id]
    );

    if (quizResult.rows.length === 0) {
      notFound();
    }

    const row = quizResult.rows[0];

    quiz = {
      id: Number(row.id),
      lessonId: Number(row.lesson_id),

      title: row.title,

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

      lesson: {
        id: Number(row.lesson_id_ref),
        title: row.lesson_title,
      },

      topic: {
        id: Number(row.topic_id),
        title: row.topic_title,
      },

      unit: {
        id: Number(row.unit_id),
        code: row.unit_code,
        name: row.unit_name,
      },

      program: {
        id: Number(row.program_id),
        name: row.program_name,
      },
    };
  } catch (error) {
    console.error(
      'GET QUIZ ERROR:',
      error
    );

    notFound();
  }

  if (!quiz) {
    notFound();
  }

  /* =======================================================
     GET QUESTIONS + OPTIONS
     
     RELATIONSHIP:

     lms_quizzes
       ↓ quiz_id
     lms_quiz_questions
       ↓ question_id
     lms_quiz_options
  ======================================================= */

  let questions: QuizQuestion[] = [];

  try {
    const questionsResult = await pool.query(
      `
        SELECT
          qq.id,
          qq.quiz_id,
          qq.question_text,
          qq.question_type,
          qq.marks,
          qq.question_order,
          qq.explanation,
          qq.options,
          qq.correct_answer,
          qq.created_at,
          qq.updated_at,

          COALESCE(
            json_agg(
              json_build_object(
                'id', qo.id,
                'questionId', qo.question_id,
                'optionText', qo.option_text,
                'isCorrect', qo.is_correct,
                'optionOrder', qo.option_order
              )
              ORDER BY qo.option_order ASC, qo.id ASC
            ) FILTER (WHERE qo.id IS NOT NULL),
            '[]'::json
          ) AS question_options

        FROM lms_quiz_questions qq

        LEFT JOIN lms_quiz_options qo
          ON qo.question_id = qq.id

        WHERE qq.quiz_id = $1

        GROUP BY
          qq.id,
          qq.quiz_id,
          qq.question_text,
          qq.question_type,
          qq.marks,
          qq.question_order,
          qq.explanation,
          qq.options,
          qq.correct_answer,
          qq.created_at,
          qq.updated_at

        ORDER BY
          qq.question_order ASC,
          qq.id ASC
      `,
      [quizId]
    );

    questions = questionsResult.rows.map(
      (row) => ({
        id: Number(row.id),

        quizId: Number(row.quiz_id),

        questionText:
          row.question_text,

        questionType:
          row.question_type ?? 'multiple_choice',

        marks:
          Number(row.marks) || 0,

        questionOrder:
          Number(row.question_order) || 0,

        explanation:
          row.explanation ?? null,

        optionsJson:
          row.options ?? null,

        correctAnswer:
          row.correct_answer ?? null,

        createdAt:
          row.created_at ?? null,

        updatedAt:
          row.updated_at ?? null,

        options: Array.isArray(
          row.question_options
        )
          ? row.question_options.map(
              (option: any) => ({
                id: Number(option.id),

                questionId:
                  Number(option.questionId),

                optionText:
                  option.optionText,

                isCorrect:
                  Boolean(option.isCorrect),

                optionOrder:
                  Number(option.optionOrder) || 0,
              })
            )
          : [],
      })
    );
  } catch (error) {
    console.error(
      'GET QUIZ QUESTIONS ERROR:',
      error
    );
  }

  /* =======================================================
     STATISTICS
  ======================================================= */

  const questionCount =
    questions.length;

  const totalQuestionMarks =
    questions.reduce(
      (total, question) =>
        total + question.marks,
      0
    );

  const multipleChoiceCount =
    questions.filter((question) => {
      const type =
        question.questionType?.toLowerCase();

      return (
        type === 'mcq' ||
        type === 'multiple_choice' ||
        type === 'multiple-choice'
      );
    }).length;

  const writtenCount =
    questions.filter((question) => {
      const type =
        question.questionType?.toLowerCase();

      return (
        type === 'essay' ||
        type === 'short_answer' ||
        type === 'short-answer' ||
        type === 'long_answer' ||
        type === 'long-answer'
      );
    }).length;

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            BACK NAVIGATION
        ================================================== */}

        <div className="mb-5">

          <Link
            href="/lecturer/dashboard/quizzes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quizzes & Exams
          </Link>

        </div>

        {/* ==================================================
            QUIZ HEADER
        ================================================== */}

        <section className="overflow-hidden rounded-3xl bg-brand-green shadow-soft">

          <div className="relative p-6 sm:p-8">

            <div className="relative z-10">

              <div className="flex flex-wrap items-center gap-2">

                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Assessment Questions
                </span>

                <QuizStatus
                  status={quiz.status}
                />

              </div>

              <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                <div>

                  <h1 className="text-2xl font-bold text-white sm:text-3xl">
                    {quiz.title}
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
                    Add, organize and manage the questions
                    students will answer in this assessment.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">

                    <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80">
                      {quiz.program.name}
                    </span>

                    <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80">
                      {quiz.unit.code}
                    </span>

                    <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80">
                      {quiz.topic.title}
                    </span>

                    <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80">
                      {quiz.lesson.title}
                    </span>

                  </div>

                </div>

                <Link
                  href={`/lecturer/dashboard/quizzes/${quiz.id}/questions/create`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-gold px-5 py-3 text-sm font-bold text-brand-dark transition hover:brightness-95"
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </Link>

              </div>

            </div>

            <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border-[45px] border-brand-gold/10" />

            <div className="pointer-events-none absolute -bottom-32 right-20 h-60 w-60 rounded-full border-[35px] border-white/5" />

          </div>

        </section>

        {/* ==================================================
            QUIZ DETAILS
        ================================================== */}

        <section className="mt-6 grid gap-5 lg:grid-cols-2">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <BookOpen className="h-5 w-5 text-brand-green" />
              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Lesson
                </p>

                <p className="mt-1 text-sm font-bold text-brand-dark">
                  {quiz.lesson.title}
                </p>

              </div>

            </div>

            {quiz.description && (
              <p className="mt-5 text-sm leading-6 text-slate-500">
                {quiz.description}
              </p>
            )}

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gold/20">
                <ListChecks className="h-5 w-5 text-brand-dark" />
              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Assessment Settings
                </p>

                <p className="mt-1 text-sm font-bold text-brand-dark">
                  {quiz.totalMarks} marks
                  {quiz.timeLimitMinutes > 0
                    ? ` · ${quiz.timeLimitMinutes} minutes`
                    : ' · No time limit'}
                </p>

              </div>

            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">

              <div className="rounded-xl bg-slate-50 p-3">

                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Attempts
                </p>

                <p className="mt-1 text-sm font-bold text-brand-dark">
                  {quiz.attemptsAllowed}
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-3">

                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Pass Mark
                </p>

                <p className="mt-1 text-sm font-bold text-brand-dark">
  {Math.min(Math.max(quiz.passingScore, 0), 100)}%
</p>

              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Questions
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {questionCount}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <FileQuestion className="h-5 w-5 text-brand-green" />
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Questions in this assessment
            </p>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Question Marks
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {totalQuestionMarks}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gold/20">
                <ListChecks className="h-5 w-5 text-brand-dark" />
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Sum of question marks
            </p>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Objective
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {multipleChoiceCount}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Multiple choice questions
            </p>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Written
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {writtenCount}
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50">
                <FileQuestion className="h-5 w-5 text-purple-600" />
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Written answer questions
            </p>

          </div>

        </section>

        {/* ==================================================
            QUESTIONS
        ================================================== */}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-soft">

          <div className="border-b border-slate-100 p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  Questions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Questions are displayed in their configured order.
                </p>

              </div>

              <Link
                href={`/lecturer/dashboard/quizzes/${quiz.id}/questions/create`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </Link>

            </div>

          </div>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {questions.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-green/10">

                <FileQuestion className="h-8 w-8 text-brand-green" />

              </div>

              <h3 className="mt-5 text-lg font-bold text-brand-dark">
                No questions yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                This assessment does not have any questions.
                Add questions so students can take the quiz or exam.
              </p>

              <Link
                href={`/lecturer/dashboard/quizzes/${quiz.id}/questions/create`}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                <Plus className="h-4 w-4" />
                Add First Question
              </Link>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {questions.map(
                (question, index) => (

                  <article
                    key={question.id}
                    className="p-6 transition hover:bg-slate-50/50"
                  >

                    {/* QUESTION HEADER */}

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                      <div className="flex min-w-0 gap-4">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-sm font-bold text-brand-green">
                          {question.questionOrder ||
                            index + 1}
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                              {formatQuestionType(
                                question.questionType
                              )}
                            </span>

                            <span className="rounded-full bg-brand-gold/15 px-2.5 py-1 text-[10px] font-bold text-brand-dark">
                              {question.marks}{' '}
                              {question.marks === 1
                                ? 'mark'
                                : 'marks'}
                            </span>

                          </div>

                          <h3 className="mt-3 text-base font-bold leading-6 text-brand-dark">
                            {question.questionText}
                          </h3>

                        </div>

                      </div>

                      <div className="flex shrink-0 items-center gap-2">

                        <Link
                          href={`/lecturer/dashboard/quizzes/${quiz.id}/questions/${question.id}/edit`}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-brand-green hover:text-brand-green"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </Link>

                      </div>

                    </div>

                    {/* OPTIONS */}

                    {question.options.length > 0 && (

                      <div className="mt-5 ml-0 lg:ml-14">

                        <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Answer Options
                        </p>

                        <div className="grid gap-2 sm:grid-cols-2">

                          {question.options.map(
                            (option) => (

                              <div
                                key={option.id}
                                className={`flex items-start gap-3 rounded-xl border p-3 ${
                                  option.isCorrect
                                    ? 'border-green-200 bg-green-50'
                                    : 'border-slate-100 bg-slate-50'
                                }`}
                              >

                                <div
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                    option.isCorrect
                                      ? 'bg-green-600 text-white'
                                      : 'bg-white text-slate-500'
                                  }`}
                                >
                                  {String.fromCharCode(
                                    65 +
                                      Math.max(
                                        0,
                                        option.optionOrder - 1
                                      )
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">

                                  <p
                                    className={`text-sm ${
                                      option.isCorrect
                                        ? 'font-bold text-green-800'
                                        : 'font-medium text-slate-600'
                                    }`}
                                  >
                                    {option.optionText}
                                  </p>

                                  {option.isCorrect && (
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-green-600">
                                      Correct answer
                                    </p>
                                  )}

                                </div>

                              </div>

                            )
                          )}

                        </div>

                      </div>

                    )}

                    {/* CORRECT ANSWER FOR WRITTEN QUESTIONS */}

                    {question.options.length === 0 &&
                      question.correctAnswer && (

                        <div className="mt-5 ml-0 rounded-xl border border-green-100 bg-green-50 p-4 lg:ml-14">

                          <p className="text-[10px] font-bold uppercase tracking-wide text-green-600">
                            Correct Answer
                          </p>

                          <p className="mt-1 text-sm font-semibold text-green-800">
                            {question.correctAnswer}
                          </p>

                        </div>

                    )}

                    {/* EXPLANATION */}

                    {question.explanation && (

                      <div className="mt-5 ml-0 rounded-xl border border-blue-100 bg-blue-50 p-4 lg:ml-14">

                        <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                          Explanation
                        </p>

                        <p className="mt-1 text-sm leading-6 text-blue-900">
                          {question.explanation}
                        </p>

                      </div>

                    )}

                  </article>

                )
              )}

            </div>

          )}

        </section>

        {/* ==================================================
            TOTAL MARK WARNING
        ================================================== */}

        {questions.length > 0 &&
          totalQuestionMarks !==
            quiz.totalMarks && (

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">

              <div className="flex items-start gap-3">

                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <ClipboardList className="h-4 w-4 text-amber-700" />
                </div>

                <div>

                  <p className="text-sm font-bold text-amber-900">
                    Marks do not match
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    The quiz is configured for{' '}
                    <strong>
                      {quiz.totalMarks}
                    </strong>{' '}
                    marks, but the questions currently
                    total{' '}
                    <strong>
                      {totalQuestionMarks}
                    </strong>{' '}
                    marks.
                  </p>

                </div>

              </div>

            </div>

        )}

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="mt-8 rounded-3xl bg-brand-green p-7 shadow-soft">

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
            SMTC Lecturer Portal
          </p>

          <h2 className="mt-2 text-xl font-bold text-white">
            Build effective assessments.
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
            Add objective and written questions, configure
            answer options and explanations, and keep the
            assessment marks aligned with the quiz settings.
          </p>

        </div>

      </div>

    </main>
  );
}

