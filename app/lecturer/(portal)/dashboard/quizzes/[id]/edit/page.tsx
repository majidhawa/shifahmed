'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  Save,
  Shuffle,
  Eye,
  EyeOff,
  ListChecks,
} from 'lucide-react';

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

  /* =======================================================
     ASSESSMENT OPTIONS
  ======================================================= */

  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;

  lesson?: {
    id: number;
    title: string;
  };

  topic?: {
    id: number;
    title: string;
  };

  unit?: {
    id: number;
    code: string;
    name: string;
  };

  program?: {
    id: number;
    name: string;
  };
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  quiz?: Quiz;
};

/* =========================================================
   PAGE
========================================================= */

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();

  const quizId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  /* =======================================================
     STATE
  ======================================================= */

  const [quiz, setQuiz] = useState<Quiz | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');

  const [totalMarks, setTotalMarks] = useState('1');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('0');
  const [attemptsAllowed, setAttemptsAllowed] = useState('1');
  const [passingScore, setPassingScore] = useState('50');

  const [status, setStatus] = useState('draft');

  /* =======================================================
     ASSESSMENT OPTIONS
  ======================================================= */

  const [shuffleQuestions, setShuffleQuestions] =
    useState(false);

  const [shuffleOptions, setShuffleOptions] =
    useState(false);

  const [showResults, setShowResults] =
    useState(true);

  const [showCorrectAnswers, setShowCorrectAnswers] =
    useState(false);

  /* =======================================================
     UI STATE
  ======================================================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* =======================================================
     LOAD QUIZ
  ======================================================= */

  useEffect(() => {
    if (!quizId) {
      setError('Invalid quiz ID.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadQuiz() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `/api/lecturer/quizzes/${quizId}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        const data: ApiResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success ||
          !data.quiz
        ) {
          throw new Error(
            data.message ||
              'Failed to load assessment.'
          );
        }

        if (cancelled) {
          return;
        }

        const loadedQuiz = data.quiz;

        setQuiz(loadedQuiz);

        /* =================================================
           BASIC INFORMATION
        ================================================= */

        setTitle(
          loadedQuiz.title || ''
        );

        setDescription(
          loadedQuiz.description || ''
        );

        setInstructions(
          loadedQuiz.instructions || ''
        );

        /* =================================================
           SCORING
        ================================================= */

        setTotalMarks(
          String(
            loadedQuiz.totalMarks ?? 1
          )
        );

        setTimeLimitMinutes(
          String(
            loadedQuiz.timeLimitMinutes ?? 0
          )
        );

        setAttemptsAllowed(
          String(
            loadedQuiz.attemptsAllowed ?? 1
          )
        );

        setPassingScore(
          String(
            loadedQuiz.passingScore ?? 50
          )
        );

        /* =================================================
           STATUS
        ================================================= */

        setStatus(
          loadedQuiz.status || 'draft'
        );

        /* =================================================
           ASSESSMENT OPTIONS
        ================================================= */

        setShuffleQuestions(
          Boolean(
            loadedQuiz.shuffleQuestions
          )
        );

        setShuffleOptions(
          Boolean(
            loadedQuiz.shuffleOptions
          )
        );

        setShowResults(
          loadedQuiz.showResults ??
            true
        );

        setShowCorrectAnswers(
          Boolean(
            loadedQuiz.showCorrectAnswers
          )
        );

      } catch (err) {
        console.error(
          'LOAD QUIZ ERROR:',
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load assessment.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadQuiz();

    return () => {
      cancelled = true;
    };
  }, [quizId]);

  /* =========================================================
     SAVE
  ========================================================= */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError(
        'Assessment title is required.'
      );
      return;
    }

    const marks = Number(totalMarks);
    const time = Number(timeLimitMinutes);
    const attempts = Number(attemptsAllowed);
    const passing = Number(passingScore);

    if (
      !Number.isFinite(marks) ||
      marks < 1
    ) {
      setError(
        'Total marks must be at least 1.'
      );
      return;
    }

    if (
      !Number.isFinite(time) ||
      time < 0
    ) {
      setError(
        'Time limit cannot be negative.'
      );
      return;
    }

    if (
      !Number.isFinite(attempts) ||
      attempts < 1
    ) {
      setError(
        'At least one attempt must be allowed.'
      );
      return;
    }

    if (
      !Number.isFinite(passing) ||
      passing < 0 ||
      passing > 100
    ) {
      setError(
        'Passing score must be between 0 and 100.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/lecturer/quizzes/${quizId}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            /* =============================================
               BASIC
            ============================================= */

            title: cleanTitle,

            description:
              description.trim() || null,

            instructions:
              instructions.trim() || null,

            /* =============================================
               SCORING
            ============================================= */

            totalMarks:
              Math.floor(marks),

            timeLimitMinutes:
              Math.floor(time),

            attemptsAllowed:
              Math.floor(attempts),

            passingScore:
              passing,

            /* =============================================
               STATUS
            ============================================= */

            status,

            /* =============================================
               ASSESSMENT OPTIONS
            ============================================= */

            shuffleQuestions,

            shuffleOptions,

            showResults,

            showCorrectAnswers,
          }),
        }
      );

      const data: ApiResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Failed to update assessment.'
        );
      }

      setSuccess(
        'Assessment updated successfully.'
      );

      /* =================================================
         REDIRECT
      ================================================= */

      setTimeout(() => {
        router.push(
          `/lecturer/dashboard/quizzes/${quizId}`
        );

        router.refresh();
      }, 800);

    } catch (err) {
      console.error(
        'UPDATE QUIZ ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update assessment.'
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
      <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-5xl">

          <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-soft">

            <div className="text-center">

              <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-green" />

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading assessment...
              </p>

            </div>

          </div>

        </div>

      </main>
    );
  }

  /* =========================================================
     ERROR / NOT FOUND
  ========================================================= */

  if (!quiz) {
    return (
      <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-5xl">

          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-soft">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">

              <ClipboardList className="h-7 w-7 text-red-600" />

            </div>

            <h1 className="mt-5 text-xl font-bold text-brand-dark">
              Assessment not found
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error ||
                'The assessment could not be loaded.'}
            </p>

            <Link
              href="/lecturer/dashboard/quizzes"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Assessments
            </Link>

          </div>

        </div>

      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-5xl">

        {/* =================================================
            BACK
        ================================================= */}

        <Link
          href={`/lecturer/dashboard/quizzes/${quiz.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-brand-green transition hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessment
        </Link>

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="mt-5 overflow-hidden rounded-3xl bg-brand-green shadow-soft">

          <div className="relative p-6 sm:p-8">

            <div className="relative z-10">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">

                  <ClipboardList className="h-6 w-6 text-brand-gold" />

                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">
                    Lecturer Assessment Centre
                  </p>

                  <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                    Edit Assessment
                  </h1>

                </div>

              </div>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">
                Update the assessment details, scoring,
                timing, student attempt settings and
                assessment behaviour.
              </p>

            </div>

            <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border-[45px] border-brand-gold/10" />

          </div>

        </section>

        {/* =================================================
            COURSE STRUCTURE
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-7">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">

              <BookOpen className="h-5 w-5 text-brand-green" />

            </div>

            <div className="min-w-0">

              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Course Structure
              </p>

              <h2 className="mt-1 text-lg font-bold text-brand-dark">
                {quiz.program?.name ||
                  'Program'}
              </h2>

              <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm text-slate-500">

                {quiz.unit && (
                  <span>
                    {quiz.unit.code} ·{' '}
                    {quiz.unit.name}
                  </span>
                )}

                {quiz.topic && (
                  <>
                    <span>•</span>

                    <span>
                      {quiz.topic.title}
                    </span>
                  </>
                )}

                {quiz.lesson && (
                  <>
                    <span>•</span>

                    <span>
                      {quiz.lesson.title}
                    </span>
                  </>
                )}

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6"
        >

          {/* =================================================
              BASIC INFORMATION
          ================================================= */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-7">

            <div className="border-b border-slate-100 pb-5">

              <h2 className="text-lg font-bold text-brand-dark">
                Assessment Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update the title and instructions
                students will see.
              </p>

            </div>

            <div className="mt-6 space-y-5">

              {/* TITLE */}

              <div>

                <label
                  htmlFor="title"
                  className="text-sm font-bold text-brand-dark"
                >
                  Assessment Title
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  maxLength={255}
                  placeholder="e.g. EMT Introduction Quiz"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

                <p className="mt-1 text-xs text-slate-400">
                  {title.length}/255 characters
                </p>

              </div>

              {/* DESCRIPTION */}

              <div>

                <label
                  htmlFor="description"
                  className="text-sm font-bold text-brand-dark"
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
                  rows={4}
                  placeholder="Briefly describe this assessment..."
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

              {/* INSTRUCTIONS */}

              <div>

                <label
                  htmlFor="instructions"
                  className="text-sm font-bold text-brand-dark"
                >
                  Student Instructions
                </label>

                <textarea
                  id="instructions"
                  value={instructions}
                  onChange={(event) =>
                    setInstructions(
                      event.target.value
                    )
                  }
                  rows={5}
                  placeholder="Enter instructions students should follow..."
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

            </div>

          </section>

          {/* =================================================
              SCORING
          ================================================= */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-7">

            <div className="border-b border-slate-100 pb-5">

              <h2 className="text-lg font-bold text-brand-dark">
                Scoring & Attempts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configure how the assessment is scored
                and how many times students can attempt it.
              </p>

            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">

              {/* TOTAL MARKS */}

              <div>

                <label
                  htmlFor="totalMarks"
                  className="text-sm font-bold text-brand-dark"
                >
                  Total Marks
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="totalMarks"
                  type="number"
                  min="1"
                  step="1"
                  value={totalMarks}
                  onChange={(event) =>
                    setTotalMarks(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-brand-dark outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

              {/* TIME */}

              <div>

                <label
                  htmlFor="timeLimitMinutes"
                  className="flex items-center gap-2 text-sm font-bold text-brand-dark"
                >

                  <Clock3 className="h-4 w-4 text-slate-400" />

                  Time Limit

                </label>

                <div className="relative mt-2">

                  <input
                    id="timeLimitMinutes"
                    type="number"
                    min="0"
                    step="1"
                    value={timeLimitMinutes}
                    onChange={(event) =>
                      setTimeLimitMinutes(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-20 text-sm font-semibold text-brand-dark outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    minutes
                  </span>

                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Set 0 for no time limit.
                </p>

              </div>

              {/* ATTEMPTS */}

              <div>

                <label
                  htmlFor="attemptsAllowed"
                  className="text-sm font-bold text-brand-dark"
                >
                  Attempts Allowed
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="attemptsAllowed"
                  type="number"
                  min="1"
                  step="1"
                  value={attemptsAllowed}
                  onChange={(event) =>
                    setAttemptsAllowed(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-brand-dark outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Number of attempts each student
                  is allowed.
                </p>

              </div>

              {/* PASSING SCORE */}

              <div>

                <label
                  htmlFor="passingScore"
                  className="text-sm font-bold text-brand-dark"
                >
                  Passing Score
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative mt-2">

                  <input
                    id="passingScore"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={passingScore}
                    onChange={(event) =>
                      setPassingScore(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm font-semibold text-brand-dark outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>

                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Percentage required to pass.
                </p>

              </div>

            </div>

          </section>

          {/* =================================================
              ASSESSMENT BEHAVIOUR
          ================================================= */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-7">

            <div className="border-b border-slate-100 pb-5">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">

                  <Shuffle className="h-5 w-5 text-brand-green" />

                </div>

                <div>

                  <h2 className="text-lg font-bold text-brand-dark">
                    Assessment Behaviour
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Control how questions and answer
                    options are presented to students and
                    what results they can see after
                    submitting the assessment.
                  </p>

                </div>

              </div>

            </div>

            <div className="mt-6 space-y-3">

              {/* =================================================
                  SHUFFLE QUESTIONS
              ================================================= */}

              <SettingToggle
                icon={
                  <Shuffle className="h-5 w-5" />
                }
                title="Shuffle Questions"
                description="Present questions in a different order for each student attempt."
                enabled={shuffleQuestions}
                onChange={setShuffleQuestions}
              />

              {/* =================================================
                  SHUFFLE OPTIONS
              ================================================= */}

              <SettingToggle
                icon={
                  <ListChecks className="h-5 w-5" />
                }
                title="Shuffle Options"
                description="Randomize the order of answer choices for each question."
                enabled={shuffleOptions}
                onChange={setShuffleOptions}
              />

              {/* =================================================
                  SHOW RESULTS
              ================================================= */}

              <SettingToggle
                icon={
                  showResults ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )
                }
                title="Show Results"
                description="Allow students to see their assessment results after submission."
                enabled={showResults}
                onChange={setShowResults}
              />

              {/* =================================================
                  SHOW CORRECT ANSWERS
              ================================================= */}

              <SettingToggle
                icon={
                  showCorrectAnswers ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )
                }
                title="Show Correct Answers"
                description="Allow students to see the correct answers after completing the assessment."
                enabled={showCorrectAnswers}
                onChange={setShowCorrectAnswers}
              />

            </div>

            {/* =================================================
                INFORMATION
            ================================================= */}

            <div className="mt-5 rounded-2xl border border-brand-green/10 bg-brand-green/5 p-4">

              <p className="text-xs leading-5 text-slate-600">

                <span className="font-bold text-brand-green">
                  Tip:
                </span>{' '}

                Showing correct answers is recommended
                only when you want students to review
                their mistakes immediately after the
                assessment.

              </p>

            </div>

          </section>

          {/* =================================================
              STATUS
          ================================================= */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-7">

            <div className="border-b border-slate-100 pb-5">

              <h2 className="text-lg font-bold text-brand-dark">
                Assessment Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Control whether students can access
                this assessment.
              </p>

            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              {/* DRAFT */}

              <label
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  status === 'draft'
                    ? 'border-brand-green bg-brand-green/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >

                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={
                    status === 'draft'
                  }
                  onChange={() =>
                    setStatus('draft')
                  }
                  className="sr-only"
                />

                <div className="flex items-start gap-3">

                  <Clock3
                    className={`mt-0.5 h-5 w-5 ${
                      status === 'draft'
                        ? 'text-brand-green'
                        : 'text-slate-400'
                    }`}
                  />

                  <div>

                    <p className="text-sm font-bold text-brand-dark">
                      Draft
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Assessment is being prepared
                      and is not available to students.
                    </p>

                  </div>

                </div>

              </label>

              {/* ACTIVE */}

              <label
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  status === 'active'
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >

                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={
                    status === 'active'
                  }
                  onChange={() =>
                    setStatus('active')
                  }
                  className="sr-only"
                />

                <div className="flex items-start gap-3">

                  <CheckCircle2
                    className={`mt-0.5 h-5 w-5 ${
                      status === 'active'
                        ? 'text-green-600'
                        : 'text-slate-400'
                    }`}
                  />

                  <div>

                    <p className="text-sm font-bold text-brand-dark">
                      Active
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Assessment is available for
                      students to take.
                    </p>

                  </div>

                </div>

              </label>

            </div>

          </section>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">

              <p className="text-sm font-semibold text-red-700">
                {error}
              </p>

            </div>

          )}

          {/* =================================================
              SUCCESS
          ================================================= */}

          {success && (

            <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">

              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />

              <p className="text-sm font-semibold text-green-700">
                {success}
              </p>

            </div>

          )}

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

            <Link
              href={`/lecturer/dashboard/quizzes/${quiz.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

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
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}

            </button>

          </div>

        </form>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="mt-8 rounded-3xl bg-brand-green p-7 shadow-soft">

          <div className="flex items-start gap-4">

            <GraduationCapIcon />

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
                SMTC Lecturer Portal
              </p>

              <h2 className="mt-2 text-xl font-bold text-white">
                Keep your assessments clear and effective.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                Update your assessment settings before
                publishing it to students.
              </p>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

/* =========================================================
   REUSABLE SETTING TOGGLE
========================================================= */

function SettingToggle({
  icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-5 rounded-2xl border p-4 transition ${
        enabled
          ? 'border-brand-green/20 bg-brand-green/5'
          : 'border-slate-200 bg-white'
      }`}
    >

      <div className="flex min-w-0 items-start gap-4">

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            enabled
              ? 'bg-brand-green/10 text-brand-green'
              : 'bg-slate-100 text-slate-400'
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-sm font-bold text-brand-dark">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>

        </div>

      </div>

      {/* =================================================
          SWITCH
      ================================================= */}

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        onClick={() =>
          onChange(!enabled)
        }
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled
            ? 'bg-brand-green'
            : 'bg-slate-300'
        }`}
      >

        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            enabled
              ? 'left-6'
              : 'left-1'
          }`}
        />

      </button>

    </div>
  );
}

/* =========================================================
   SMALL FOOTER ICON
========================================================= */

function GraduationCapIcon() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
      <span className="text-lg">🎓</span>
    </div>
  );
}