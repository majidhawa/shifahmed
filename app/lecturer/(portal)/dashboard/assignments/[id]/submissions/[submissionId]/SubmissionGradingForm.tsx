'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Save,
  User,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Question = {
  id: number;
  assignment_id: number;
  question_number: number;
  question: string;
  marks: number;
};

type Answer = {
  id: number;
  submission_id: number;
  question_id: number;
  answer_text: string | null;
  file_name: string | null;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  marks_awarded: number | null;
  lecturer_feedback: string | null;
  graded_at: string | null;
};

type Requirement = {
  id: number;
  assignment_id: number;
  requirement: string;
  requirement_number: number;
};

type Submission = {
  submission_id: number;
  assignment_id: number;
  application_id: number;

  submission_text: string | null;

  file_name: string | null;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;

  submission_status: string;
  submitted_at: string | null;

  total_marks: number | null;
  marks_awarded: number | null;

  lecturer_feedback: string | null;
  graded_at: string | null;
  graded_by: number | null;

  assignment_title: string;
  assignment_description: string | null;
  due_date: string | null;
  assignment_status: string;
  assignment_total_marks: number;

  lesson_id: number;
  lesson_title: string;

  topic_id: number;
  topic_title: string;

  unit_id: number;
  unit_title: string;

  program_id: number;
  program_name: string;

  application: Record<string, unknown> | null;

  questions: Question[];
  answers: Answer[];
  requirements: Requirement[];
};

type Props = {
  assignmentId: number;
  submissionId: number;
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  value: string | null | undefined
) {
  if (!value) return 'Not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getApplicationValue(
  application: Record<string, unknown> | null,
  possibleKeys: string[]
): string | null {
  if (!application) return null;

  for (const key of possibleKeys) {
    const value = application[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ''
    ) {
      return String(value);
    }
  }

  return null;
}

function formatFileSize(
  size: number | null
) {
  if (!size || size <= 0) {
    return '';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function SubmissionGradingForm({
  assignmentId,
  submissionId,
}: Props) {
  /* =======================================================
     STATE
  ======================================================= */

  const [submission, setSubmission] =
    useState<Submission | null>(null);

  const [marks, setMarks] = useState<
    Record<number, string>
  >({});

  const [feedback, setFeedback] = useState<
    Record<number, string>
  >({});

  const [overallFeedback, setOverallFeedback] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  /* =======================================================
     LOAD SUBMISSION
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadSubmission() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/lecturer/assignments/${assignmentId}/submissions/${submissionId}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              'Unable to load this submission.'
          );
        }

        if (cancelled) return;

        const loaded: Submission =
          data.submission;

        setSubmission(loaded);

        /* ===============================================
           PRE-FILL MARKS
        =============================================== */

        const initialMarks: Record<
          number,
          string
        > = {};

        /* ===============================================
           PRE-FILL FEEDBACK
        =============================================== */

        const initialFeedback: Record<
          number,
          string
        > = {};

        for (const answer of loaded.answers || []) {
          initialMarks[answer.question_id] =
            answer.marks_awarded === null ||
            answer.marks_awarded === undefined
              ? ''
              : String(answer.marks_awarded);

          initialFeedback[answer.question_id] =
            answer.lecturer_feedback || '';
        }

        setMarks(initialMarks);
        setFeedback(initialFeedback);

        setOverallFeedback(
          loaded.lecturer_feedback || ''
        );
      } catch (err) {
        if (cancelled) return;

        console.error(
          'LOAD SUBMISSION ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load submission.'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSubmission();

    return () => {
      cancelled = true;
    };
  }, [assignmentId, submissionId]);

  /* =======================================================
     ANSWER LOOKUP
  ======================================================= */

  const answerByQuestion = useMemo(() => {
    const map = new Map<number, Answer>();

    for (
      const answer of submission?.answers || []
    ) {
      map.set(
        answer.question_id,
        answer
      );
    }

    return map;
  }, [submission]);

  /* =======================================================
     TOTAL AWARDED
  ======================================================= */

  const totalAwarded = useMemo(() => {
    if (!submission) return 0;

    return submission.questions.reduce(
      (total, question) => {
        const value = Number(
          marks[question.id]
        );

        if (!Number.isFinite(value)) {
          return total;
        }

        return (
          total +
          Math.max(0, value)
        );
      },
      0
    );
  }, [submission, marks]);

  /* =======================================================
     MAXIMUM MARKS
  ======================================================= */

  const maximumMarks = useMemo(() => {
    if (!submission) return 0;

    /*
     * Calculate from the actual questions.
     *
     * This is preferable to relying on a separately
     * supplied totalMarks prop because it guarantees
     * that the grading form reflects the actual
     * questions belonging to this assignment.
     */

    const questionTotal =
      submission.questions.reduce(
        (total, question) =>
          total +
          Number(question.marks || 0),
        0
      );

    /*
     * If questions exist, use their actual total.
     *
     * Otherwise fall back to the assignment total.
     */

    if (questionTotal > 0) {
      return questionTotal;
    }

    return Number(
      submission.assignment_total_marks || 0
    );
  }, [submission]);

  /* =======================================================
     PERCENTAGE
  ======================================================= */

  const percentage = useMemo(() => {
    if (!maximumMarks) return 0;

    return Math.min(
      100,
      Math.round(
        (totalAwarded /
          maximumMarks) *
          100
      )
    );
  }, [totalAwarded, maximumMarks]);

  /* =======================================================
     MARK CHANGE
  ======================================================= */

  function handleMarksChange(
    question: Question,
    value: string
  ) {
    if (value === '') {
      setMarks((previous) => ({
        ...previous,
        [question.id]: '',
      }));

      setSuccess(null);

      return;
    }

    const numericValue =
      Number(value);

    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      return;
    }

    const safeValue =
      Math.max(
        0,
        Math.min(
          question.marks,
          Math.floor(numericValue)
        )
      );

    setMarks((previous) => ({
      ...previous,
      [question.id]:
        String(safeValue),
    }));

    setSuccess(null);
  }

  /* =======================================================
     SAVE GRADE
  ======================================================= */

  async function handleSave() {
    if (!submission) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      /* ===============================================
         VALIDATE MARKS
      =============================================== */

      for (const question of submission.questions) {
        const raw =
          marks[question.id];

        if (
          raw !== undefined &&
          raw !== ''
        ) {
          const value =
            Number(raw);

          if (
            !Number.isFinite(value) ||
            value < 0 ||
            value > question.marks
          ) {
            setError(
              `Marks for Question ${question.question_number} must be between 0 and ${question.marks}.`
            );

            setSaving(false);

            return;
          }
        }
      }

      /* ===============================================
         PREPARE ANSWERS
      =============================================== */

      const answers =
        submission.questions
          .map((question) => {
            const answer =
              answerByQuestion.get(
                question.id
              );

            return {
              answerId:
                answer?.id,

              questionId:
                question.id,

              marksAwarded:
                marks[question.id] === ''
                  ? null
                  : Number(
                      marks[
                        question.id
                      ] || 0
                    ),

              lecturerFeedback:
                feedback[
                  question.id
                ] || '',
            };
          })
          .filter(
            (answer) =>
              answer.answerId !==
              undefined
          );

      /* ===============================================
         SAVE
      =============================================== */

      const response =
        await fetch(
          `/api/lecturer/assignments/${assignmentId}/submissions/${submissionId}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              answers,

              lecturerFeedback:
                overallFeedback,

              status: 'graded',
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
            'Unable to save grade.'
        );
      }

      /* ===============================================
         UPDATE LOCAL STATE
      =============================================== */

      setSubmission(
        (previous) =>
          previous
            ? {
                ...previous,

                marks_awarded:
                  data.marksAwarded,

                lecturer_feedback:
                  overallFeedback,

                submission_status:
                  data.status,

                graded_at:
                  new Date().toISOString(),
              }
            : previous
      );

      setSuccess(
        'Grade saved successfully.'
      );
    } catch (err) {
      console.error(
        'SAVE GRADE ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save grade.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-soft">
        <div className="flex flex-col items-center justify-center text-center">

          <Loader2 className="h-8 w-8 animate-spin text-brand-green" />

          <p className="mt-4 text-sm font-semibold text-brand-dark">
            Loading submission...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Please wait while we retrieve
            the student&apos;s work.
          </p>

        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error && !submission) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8">

        <div className="flex items-start gap-4">

          <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />

          <div>

            <h2 className="font-bold text-red-800">
              Unable to load submission
            </h2>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

          </div>

        </div>

      </div>
    );
  }

  if (!submission) {
    return null;
  }

  /* =======================================================
     STUDENT INFORMATION
  ======================================================= */

  const applicationNumber =
    getApplicationValue(
      submission.application,
      [
        'application_number',
        'applicationNumber',
        'application_no',
        'applicationNo',
      ]
    );

  const studentName =
    getApplicationValue(
      submission.application,
      [
        'full_name',
        'fullName',
        'name',
        'student_name',
        'studentName',
      ]
    ) || 'Student';

  const studentEmail =
    getApplicationValue(
      submission.application,
      [
        'email',
        'email_address',
      ]
    );

  const studentPhone =
    getApplicationValue(
      submission.application,
      [
        'phone',
        'phone_number',
        'phoneNumber',
        'mobile',
      ]
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">

      {/* ===================================================
          ERROR / SUCCESS
      =================================================== */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">

          <div className="flex items-start gap-3">

            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

          </div>

        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">

          <div className="flex items-center gap-3">

            <CheckCircle2 className="h-5 w-5 text-green-600" />

            <p className="text-sm font-semibold text-green-700">
              {success}
            </p>

          </div>

        </div>
      )}

      {/* ===================================================
          STUDENT
      =================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">
            <User className="h-7 w-7 text-brand-green" />
          </div>

          <div className="flex-1">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">
              Student
            </p>

            <h2 className="mt-1 text-xl font-bold text-brand-dark">
              {studentName}
            </h2>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">

              {applicationNumber && (
                <span>
                  Application No:{' '}
                  <strong className="text-slate-700">
                    {applicationNumber}
                  </strong>
                </span>
              )}

              {studentEmail && (
                <span>
                  {studentEmail}
                </span>
              )}

              {studentPhone && (
                <span>
                  {studentPhone}
                </span>
              )}

            </div>

          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
              submission.submission_status
                .toLowerCase() ===
              'graded'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {submission.submission_status}
          </span>

        </div>

      </section>

      {/* ===================================================
          ASSIGNMENT
      =================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">
              Assignment
            </p>

            <h2 className="mt-1 text-xl font-bold text-brand-dark">
              {submission.assignment_title}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {submission.program_name}
              {' → '}
              {submission.unit_title}
              {' → '}
              {submission.topic_title}
              {' → '}
              {submission.lesson_title}
            </p>

          </div>

          <div className="text-left sm:text-right">

            <p className="text-xs font-semibold uppercase text-slate-400">
              Due Date
            </p>

            <p className="mt-1 text-sm font-bold text-brand-dark">
              {formatDate(
                submission.due_date
              )}
            </p>

          </div>

        </div>

        {submission.assignment_description && (
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">

            <p className="text-sm leading-6 text-slate-600">
              {submission.assignment_description}
            </p>

          </div>
        )}

      </section>

      {/* ===================================================
          SUBMISSION
      =================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

        <div className="flex items-center justify-between gap-4">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">
              Student Submission
            </p>

            <h2 className="mt-1 text-lg font-bold text-brand-dark">
              Submitted Work
            </h2>

          </div>

          {submission.submitted_at && (
            <p className="text-xs text-slate-400">
              Submitted{' '}
              {formatDate(
                submission.submitted_at
              )}
            </p>
          )}

        </div>

        {submission.submission_text && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {submission.submission_text}
            </p>

          </div>
        )}

        {submission.file_url && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/10">
                <FileText className="h-5 w-5 text-brand-green" />
              </div>

              <div>

                <p className="text-sm font-bold text-brand-dark">
                  {submission.file_name ||
                    'Submitted file'}
                </p>

                {submission.file_size && (
                  <p className="text-xs text-slate-400">
                    {formatFileSize(
                      Number(
                        submission.file_size
                      )
                    )}
                  </p>
                )}

              </div>

            </div>

            <a
              href={submission.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              <Download className="h-4 w-4" />
              Open File
            </a>

          </div>
        )}

        {!submission.submission_text &&
          !submission.file_url && (
            <div className="mt-5 rounded-2xl bg-amber-50 p-4">

              <p className="text-sm text-amber-700">
                No submission content or file
                was attached.
              </p>

            </div>
          )}

      </section>

      {/* ===================================================
          REQUIREMENTS
      =================================================== */}

      {submission.requirements.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">
            Student Requirements
          </p>

          <h2 className="mt-1 text-lg font-bold text-brand-dark">
            Assignment Requirements
          </h2>

          <div className="mt-5 space-y-3">

            {submission.requirements.map(
              (requirement) => (
                <div
                  key={requirement.id}
                  className="flex gap-3 rounded-xl bg-slate-50 p-4"
                >

                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white">
                    {
                      requirement.requirement_number
                    }
                  </span>

                  <p className="text-sm leading-6 text-slate-600">
                    {
                      requirement.requirement
                    }
                  </p>

                </div>
              )
            )}

          </div>

        </section>
      )}

      {/* ===================================================
          QUESTIONS
      =================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">
              Assessment
            </p>

            <h2 className="mt-1 text-xl font-bold text-brand-dark">
              Questions & Grading
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review each answer and award marks.
            </p>

          </div>

          <div className="rounded-2xl bg-brand-green/10 px-4 py-3">

            <p className="text-xs font-semibold text-slate-500">
              Current Score
            </p>

            <p className="mt-1 text-lg font-bold text-brand-green">
              {totalAwarded} / {maximumMarks}
            </p>

          </div>

        </div>

        <div className="mt-6 space-y-6">

          {submission.questions.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">

              <p className="text-sm font-semibold text-slate-600">
                No questions were found
                for this assignment.
              </p>

            </div>
          ) : (
            submission.questions.map(
              (question) => {
                const answer =
                  answerByQuestion.get(
                    question.id
                  );

                return (
                  <article
                    key={question.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >

                    {/* QUESTION HEADER */}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                      <div className="flex gap-3">

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green text-sm font-bold text-white">
                          {
                            question.question_number
                          }
                        </span>

                        <div>

                          <p className="text-sm font-semibold leading-6 text-brand-dark">
                            {
                              question.question
                            }
                          </p>

                        </div>

                      </div>

                      <span className="w-fit rounded-full bg-brand-gold/15 px-3 py-1.5 text-xs font-bold text-brand-dark">
                        {question.marks}{' '}
                        {question.marks ===
                        1
                          ? 'mark'
                          : 'marks'}
                      </span>

                    </div>

                    {/* STUDENT ANSWER */}

                    <div className="mt-5">

                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Student Answer
                      </p>

                      {answer?.answer_text ? (
                        <div className="rounded-2xl bg-slate-50 p-4">

                          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                            {
                              answer.answer_text
                            }
                          </p>

                        </div>
                      ) : (
                        <div className="rounded-2xl bg-amber-50 p-4">

                          <p className="text-sm text-amber-700">
                            No written
                            answer was
                            provided.
                          </p>

                        </div>
                      )}

                    </div>

                    {/* ANSWER FILE */}

                    {answer?.file_url && (
                      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">

                        <div className="flex items-center gap-3">

                          <FileText className="h-5 w-5 text-brand-green" />

                          <span className="text-sm font-semibold text-slate-700">
                            {
                              answer.file_name ||
                              'Answer file'
                            }
                          </span>

                        </div>

                        <a
                          href={
                            answer.file_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-brand-green hover:text-brand-dark"
                        >
                          Open
                        </a>

                      </div>
                    )}

                    {/* GRADING */}

                    <div className="mt-5 grid gap-5 lg:grid-cols-[180px_1fr]">

                      <div>

                        <label
                          htmlFor={`marks-${question.id}`}
                          className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                          Marks Awarded
                        </label>

                        <div className="flex items-center gap-2">

                          <input
                            id={`marks-${question.id}`}
                            type="number"
                            min="0"
                            max={
                              question.marks
                            }
                            step="1"
                            value={
                              marks[
                                question.id
                              ] ?? ''
                            }
                            onChange={(
                              event
                            ) =>
                              handleMarksChange(
                                question,
                                event
                                  .target
                                  .value
                              )
                            }
                            className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-sm font-bold text-brand-dark outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                          />

                          <span className="text-sm font-semibold text-slate-400">
                            /{' '}
                            {
                              question.marks
                            }
                          </span>

                        </div>

                      </div>

                      <div>

                        <label
                          htmlFor={`feedback-${question.id}`}
                          className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                          Lecturer Feedback
                        </label>

                        <textarea
                          id={`feedback-${question.id}`}
                          rows={3}
                          value={
                            feedback[
                              question.id
                            ] ?? ''
                          }
                          onChange={(
                            event
                          ) => {
                            setFeedback(
                              (
                                previous
                              ) => ({
                                ...previous,
                                [question.id]:
                                  event
                                    .target
                                    .value,
                              })
                            );

                            setSuccess(
                              null
                            );
                          }}
                          placeholder="Provide feedback for this answer..."
                          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                        />

                      </div>

                    </div>

                  </article>
                );
              }
            )
          )}

        </div>

      </section>

      {/* ===================================================
          GRADE SUMMARY
      =================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

        <div className="grid gap-5 sm:grid-cols-3">

          <div className="rounded-2xl bg-slate-50 p-5">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Marks Awarded
            </p>

            <p className="mt-2 text-3xl font-bold text-brand-dark">
              {totalAwarded}
            </p>

          </div>

          <div className="rounded-2xl bg-slate-50 p-5">

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Maximum Marks
            </p>

            <p className="mt-2 text-3xl font-bold text-brand-dark">
              {maximumMarks}
            </p>

          </div>

          <div className="rounded-2xl bg-brand-green/10 p-5">

            <p className="text-xs font-bold uppercase tracking-wide text-brand-green">
              Percentage
            </p>

            <p className="mt-2 text-3xl font-bold text-brand-green">
              {percentage}%
            </p>

          </div>

        </div>

        {/* PROGRESS */}

        <div className="mt-6">

          <div className="mb-2 flex items-center justify-between">

            <span className="text-xs font-semibold text-slate-500">
              Overall Performance
            </span>

            <span className="text-xs font-bold text-brand-dark">
              {percentage}%
            </span>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">

            <div
              className="h-full rounded-full bg-brand-green transition-all duration-300"
              style={{
                width: `${percentage}%`,
              }}
            />

          </div>

        </div>

        {/* OVERALL FEEDBACK */}

        <div className="mt-6">

          <label
            htmlFor="overall-feedback"
            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
          >
            Overall Lecturer Feedback
          </label>

          <textarea
            id="overall-feedback"
            rows={5}
            value={overallFeedback}
            onChange={(event) => {
              setOverallFeedback(
                event.target.value
              );

              setSuccess(null);
            }}
            placeholder="Write overall feedback for the student..."
            className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
          />

        </div>

        {/* SAVE */}

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">

          <div>

            {submission.graded_at && (
              <p className="text-xs text-slate-400">
                Last graded:{' '}
                {formatDate(
                  submission.graded_at
                )}
              </p>
            )}

          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >

            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Grade...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Grade
              </>
            )}

          </button>

        </div>

      </section>

    </div>
  );
}