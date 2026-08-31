import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  GraduationCap,
  Mail,
  MessageSquare,
  Phone,
  User,
} from 'lucide-react';

import { requireLecturer } from '@/lib/lecturer-auth';
import pool from '@/lib/db';

import SubmissionGradingForm from './SubmissionGradingForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/* =========================================================
   TYPES
========================================================= */

type PageProps = {
  params: Promise<{
    id: string;
    submissionId: string;
  }>;
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

type Question = {
  id: number;
  question_number: number;
  question: string;
  marks: number;
  answer: Answer | null;
};

type SubmissionData = {
  assignment: {
    id: number;
    title: string;
    description: string | null;
    due_date: string | null;
    status: string;
    total_marks: number;
    lesson_title: string;
    topic_title: string;
    unit_title: string;
    program_name: string;
  };

  submission: {
    id: number;
    assignment_id: number;
    application_id: number;

    submission_text: string | null;

    file_name: string | null;
    file_url: string | null;
    file_size: number | null;
    mime_type: string | null;

    status: string;
    submitted_at: string | null;

    total_marks: number | null;
    marks_awarded: number | null;

    lecturer_feedback: string | null;
    graded_at: string | null;
    graded_by: number | null;

    student: {
      application_id: number;
      name: string;
      email: string | null;
      phone: string | null;
      application_number: string | null;
    };
  };

  questions: Question[];
};

/* =========================================================
   HELPERS
========================================================= */

function toNullableString(
  value: unknown
): string | null {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return null;
  }

  return String(value);
}

function getStudentName(
  application: Record<string, unknown>
): string {
  const fullName =
    application.full_name ??
    application.fullName ??
    application.name ??
    application.student_name ??
    application.studentName;

  if (
    fullName !== null &&
    fullName !== undefined &&
    String(fullName).trim()
  ) {
    return String(fullName).trim();
  }

  const firstName =
    application.first_name ??
    application.firstname ??
    application.firstName ??
    '';

  const lastName =
    application.last_name ??
    application.lastname ??
    application.lastName ??
    '';

  const combined =
    `${String(firstName).trim()} ${String(
      lastName
    ).trim()}`.trim();

  return combined || 'Student';
}

/* =========================================================
   GET SUBMISSION
========================================================= */

async function getSubmission(
  assignmentId: string,
  submissionId: string,
  lecturerId: number
): Promise<SubmissionData | null> {
  const parsedAssignmentId = Number(
    assignmentId
  );

  const parsedSubmissionId = Number(
    submissionId
  );

  if (
    !Number.isInteger(parsedAssignmentId) ||
    !Number.isInteger(parsedSubmissionId) ||
    !Number.isInteger(lecturerId)
  ) {
    return null;
  }

  /* =======================================================
     ASSIGNMENT + SUBMISSION + LECTURER ACCESS
  ======================================================= */

  const result = await pool.query(
    `
      SELECT
        a.id,
        a.lesson_id,
        a.title,
        a.description,
        a.due_date,
        a.status,
        a.total_marks,

        l.title AS lesson_title,
        t.title AS topic_title,
        u.title AS unit_title,
        p.name AS program_name,

        s.id AS submission_id,
        s.assignment_id AS submission_assignment_id,
        s.application_id,
        s.submission_text,
        s.file_name,
        s.file_url,
        s.file_size,
        s.mime_type,
        s.status AS submission_status,
        s.submitted_at,
        s.total_marks AS submission_total_marks,
        s.marks_awarded,
        s.lecturer_feedback,
        s.graded_at,
        s.graded_by

      FROM lms_assignments a

      INNER JOIN lms_lessons l
        ON l.id = a.lesson_id

      INNER JOIN lms_topics t
        ON t.id = l.topic_id

      INNER JOIN lms_units u
        ON u.id = t.unit_id

      INNER JOIN lms_programs p
        ON p.id = u.program_id

      INNER JOIN lms_lecturer_programs lp
        ON lp.program_id = p.id

      INNER JOIN lms_assignment_submissions s
        ON s.assignment_id = a.id

      WHERE a.id = $1
        AND s.id = $2
        AND lp.lecturer_id = $3

      LIMIT 1
    `,
    [
      parsedAssignmentId,
      parsedSubmissionId,
      lecturerId,
    ]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  /* =======================================================
     APPLICATION / STUDENT
  ======================================================= */

  const applicationResult =
    await pool.query(
      `
        SELECT
          to_jsonb(a) AS application
        FROM applications a
        WHERE a.id = $1
        LIMIT 1
      `,
      [row.application_id]
    );

  const application =
    (applicationResult.rows[0]?.application ??
      {}) as Record<string, unknown>;

  const studentName =
    getStudentName(application);

  const studentEmail =
    application.email ??
    application.email_address ??
    application.emailAddress ??
    null;

  const studentPhone =
    application.phone ??
    application.phone_number ??
    application.phoneNumber ??
    application.mobile ??
    null;

  const applicationNumber =
    application.application_number ??
    application.application_no ??
    application.applicationNumber ??
    null;

  /* =======================================================
     QUESTIONS
  ======================================================= */

  const questionsResult =
    await pool.query(
      `
        SELECT
          id,
          question_number,
          question,
          marks

        FROM lms_assignment_questions

        WHERE assignment_id = $1

        ORDER BY
          question_number ASC,
          id ASC
      `,
      [parsedAssignmentId]
    );

  /* =======================================================
     ANSWERS
  ======================================================= */

  const answersResult =
    await pool.query(
      `
        SELECT
          id,
          submission_id,
          question_id,
          answer_text,
          file_name,
          file_url,
          file_size,
          mime_type,
          marks_awarded,
          lecturer_feedback,
          graded_at

        FROM lms_assignment_answers

        WHERE submission_id = $1

        ORDER BY
          question_id ASC,
          id ASC
      `,
      [parsedSubmissionId]
    );

  const answersByQuestion =
    new Map<number, Answer>();

  for (const answer of answersResult.rows) {
    answersByQuestion.set(
      Number(answer.question_id),
      {
        id: Number(answer.id),

        submission_id: Number(
          answer.submission_id
        ),

        question_id: Number(
          answer.question_id
        ),

        answer_text:
          answer.answer_text ?? null,

        file_name:
          answer.file_name ?? null,

        file_url:
          answer.file_url ?? null,

        file_size:
          answer.file_size !== null &&
          answer.file_size !== undefined
            ? Number(answer.file_size)
            : null,

        mime_type:
          answer.mime_type ?? null,

        marks_awarded:
          answer.marks_awarded !== null &&
          answer.marks_awarded !== undefined
            ? Number(answer.marks_awarded)
            : null,

        lecturer_feedback:
          answer.lecturer_feedback ?? null,

        graded_at:
          answer.graded_at ?? null,
      }
    );
  }

  /* =======================================================
     BUILD QUESTIONS
  ======================================================= */

  const questions: Question[] =
    questionsResult.rows.map(
      (question) => ({
        id: Number(question.id),

        question_number: Number(
          question.question_number
        ),

        question: String(
          question.question ?? ''
        ),

        marks: Number(
          question.marks ?? 0
        ),

        answer:
          answersByQuestion.get(
            Number(question.id)
          ) ?? null,
      })
    );

  /* =======================================================
     FINAL DATA
  ======================================================= */

  return {
    assignment: {
      id: Number(row.id),

      title: String(
        row.title ?? ''
      ),

      description:
        row.description ?? null,

      due_date:
        row.due_date ?? null,

      status: String(
        row.status ?? 'draft'
      ),

      total_marks: Number(
        row.total_marks ?? 0
      ),

      lesson_title: String(
        row.lesson_title ?? ''
      ),

      topic_title: String(
        row.topic_title ?? ''
      ),

      unit_title: String(
        row.unit_title ?? ''
      ),

      program_name: String(
        row.program_name ?? ''
      ),
    },

    submission: {
      id: Number(
        row.submission_id
      ),

      assignment_id: Number(
        row.submission_assignment_id ??
          row.id
      ),

      application_id: Number(
        row.application_id
      ),

      submission_text:
        row.submission_text ?? null,

      file_name:
        row.file_name ?? null,

      file_url:
        row.file_url ?? null,

      file_size:
        row.file_size !== null &&
        row.file_size !== undefined
          ? Number(row.file_size)
          : null,

      mime_type:
        row.mime_type ?? null,

      status: String(
        row.submission_status ??
          'submitted'
      ),

      submitted_at:
        row.submitted_at ?? null,

      total_marks:
        row.submission_total_marks !==
          null &&
        row.submission_total_marks !==
          undefined
          ? Number(
              row.submission_total_marks
            )
          : null,

      marks_awarded:
        row.marks_awarded !== null &&
        row.marks_awarded !== undefined
          ? Number(row.marks_awarded)
          : null,

      lecturer_feedback:
        row.lecturer_feedback ?? null,

      graded_at:
        row.graded_at ?? null,

      graded_by:
        row.graded_by !== null &&
        row.graded_by !== undefined
          ? Number(row.graded_by)
          : null,

      student: {
        application_id: Number(
          row.application_id
        ),

        name: studentName,

        email: toNullableString(
          studentEmail
        ),

        phone: toNullableString(
          studentPhone
        ),

        application_number:
          toNullableString(
            applicationNumber
          ),
      },
    },

    questions,
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function AssignmentSubmissionPage({
  params,
}: PageProps) {
  /* =======================================================
     AUTHENTICATION
  ======================================================= */

  const lecturer =
    await requireLecturer();

  if (!lecturer) {
    redirect('/lecturer/login');
  }

  /* =======================================================
     PARAMS
  ======================================================= */

  const {
    id,
    submissionId,
  } = await params;

  /* =======================================================
     LOAD SUBMISSION
  ======================================================= */

  const data =
    await getSubmission(
      id,
      submissionId,
      Number(lecturer.id)
    );

  if (!data) {
    notFound();
  }

  const {
    assignment,
    submission,
    questions,
  } = data;

  /* =======================================================
     SCORE
  ======================================================= */

  const awardedMarks =
    submission.marks_awarded ?? 0;

  const totalMarks =
    assignment.total_marks ?? 0;

  const percentage =
    totalMarks > 0
      ? Math.min(
          100,
          Math.round(
            (awardedMarks /
              totalMarks) *
              100
          )
        )
      : 0;

  const isGraded =
    submission.status
      .toLowerCase()
      .trim() === 'graded';

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* =================================================
            BACK
        ================================================= */}

        <Link
          href={`/lecturer/dashboard/assignments/${assignment.id}/submissions`}
          className="inline-flex items-center gap-2 text-sm font-bold text-brand-green transition hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Submissions
        </Link>

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">
                  {assignment.program_name}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    isGraded
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {submission.status}
                </span>

              </div>

              <h1 className="mt-4 break-words text-2xl font-bold text-brand-dark sm:text-3xl">
                {assignment.title}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Review this student&apos;s
                submission, award marks for
                each question, and provide
                feedback.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">

                <span>
                  {assignment.unit_title}
                </span>

                <span>•</span>

                <span>
                  {assignment.topic_title}
                </span>

                <span>•</span>

                <span>
                  {assignment.lesson_title}
                </span>

              </div>

            </div>

            {/* SCORE */}

            <div className="shrink-0 rounded-2xl bg-brand-green p-5 text-white">

              <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                Current Score
              </p>

              <p className="mt-1 text-3xl font-bold">
                {awardedMarks}

                <span className="text-lg text-white/60">
                  /{totalMarks}
                </span>
              </p>

              <p className="mt-1 text-xs font-semibold text-white/70">
                {percentage}%
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            STUDENT INFORMATION
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">
              <GraduationCap className="h-6 w-6 text-brand-green" />
            </div>

            <div>

              <h2 className="text-lg font-bold text-brand-dark">
                Student Information
              </h2>

              <p className="text-sm text-slate-500">
                Details of the student who
                submitted this assignment.
              </p>

            </div>

          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* STUDENT */}

            <div className="rounded-2xl bg-slate-50 p-4">

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">

                <User className="h-4 w-4" />

                Student

              </div>

              <p className="mt-2 font-bold text-brand-dark">
                {submission.student.name}
              </p>

            </div>

            {/* EMAIL */}

            <div className="rounded-2xl bg-slate-50 p-4">

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">

                <Mail className="h-4 w-4" />

                Email

              </div>

              <p className="mt-2 break-all text-sm font-medium text-slate-700">
                {submission.student.email ||
                  'Not provided'}
              </p>

            </div>

            {/* PHONE */}

            <div className="rounded-2xl bg-slate-50 p-4">

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">

                <Phone className="h-4 w-4" />

                Phone

              </div>

              <p className="mt-2 text-sm font-medium text-slate-700">
                {submission.student.phone ||
                  'Not provided'}
              </p>

            </div>

            {/* APPLICATION */}

            <div className="rounded-2xl bg-slate-50 p-4">

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">

                <ClipboardCheck className="h-4 w-4" />

                Application

              </div>

              <p className="mt-2 text-sm font-bold text-brand-dark">
                {submission.student
                  .application_number ||
                  `#${submission.application_id}`}
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            SUBMISSION
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/15">
              <BookOpen className="h-6 w-6 text-brand-gold" />
            </div>

            <div>

              <h2 className="text-lg font-bold text-brand-dark">
                Student Submission
              </h2>

              <p className="text-sm text-slate-500">
                Review the work submitted by
                the student.
              </p>

            </div>

          </div>

          {/* SUBMISSION DATE */}

          {submission.submitted_at && (
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">

              <Calendar className="h-4 w-4" />

              <span>
                Submitted{' '}
                {new Date(
                  submission.submitted_at
                ).toLocaleString('en-KE')}
              </span>

            </div>
          )}

          {/* SUBMISSION TEXT */}

          {submission.submission_text && (
            <div className="mt-6">

              <h3 className="text-sm font-bold text-brand-dark">
                Submission Text
              </h3>

              <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {submission.submission_text}
              </div>

            </div>
          )}

          {/* SUBMISSION FILE */}

          {submission.file_url && (
            <div className="mt-6">

              <a
                href={submission.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
              >

                <Download className="h-4 w-4" />

                {submission.file_name ||
                  'View Submitted File'}

              </a>

              {submission.file_size !==
                null && (
                <p className="mt-2 text-xs text-slate-400">
                  File size:{' '}
                  {(
                    submission.file_size /
                    1024 /
                    1024
                  ).toFixed(2)}{' '}
                  MB
                </p>
              )}

            </div>
          )}

          {/* EMPTY SUBMISSION */}

          {!submission.submission_text &&
            !submission.file_url && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No submission content or
                file was attached.
              </div>
            )}

        </section>

        {/* =================================================
            QUESTIONS
        ================================================= */}

        <section className="mt-6">

          <div className="mb-5">

            <h2 className="text-xl font-bold text-brand-dark">
              Assignment Questions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review each answer before
              awarding marks.
            </p>

          </div>

          {questions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-soft">

              <ClipboardCheck className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-bold text-brand-dark">
                No questions found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                This assignment does not
                currently contain any
                questions.
              </p>

            </div>
          ) : (
            <div className="space-y-5">

              {questions.map(
                (question) => (
                  <div
                    key={question.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"
                  >

                    {/* QUESTION HEADER */}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="flex min-w-0 gap-4">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-sm font-bold text-brand-green">
                          {
                            question.question_number
                          }
                        </div>

                        <div className="min-w-0">

                          <p className="text-base font-bold leading-7 text-brand-dark">
                            {question.question}
                          </p>

                          <p className="mt-2 text-xs font-bold text-slate-400">
                            Maximum:{' '}
                            {question.marks}{' '}
                            {question.marks ===
                            1
                              ? 'mark'
                              : 'marks'}
                          </p>

                        </div>

                      </div>

                      <div className="shrink-0 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
                        Awarded:{' '}
                        {question.answer
                          ?.marks_awarded ??
                          0}
                        /{question.marks}
                      </div>

                    </div>

                    {/* ANSWER */}

                    <div className="mt-6">

                      <h3 className="flex items-center gap-2 text-sm font-bold text-brand-dark">

                        <MessageSquare className="h-4 w-4 text-brand-green" />

                        Student Answer

                      </h3>

                      {question.answer
                        ?.answer_text ? (
                        <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                          {
                            question
                              .answer
                              .answer_text
                          }
                        </div>
                      ) : (
                        <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-400">
                          No written answer
                          provided.
                        </div>
                      )}

                    </div>

                    {/* ANSWER FILE */}

                    {question.answer
                      ?.file_url && (
                      <div className="mt-4">

                        <a
                          href={
                            question.answer
                              .file_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-brand-dark transition hover:border-brand-green hover:text-brand-green"
                        >

                          <FileText className="h-4 w-4" />

                          {question.answer
                            .file_name ||
                            'View Answer File'}

                        </a>

                      </div>
                    )}

                    {/* EXISTING FEEDBACK */}

                    {question.answer
                      ?.lecturer_feedback && (
                      <div className="mt-4 rounded-2xl border border-brand-green/10 bg-brand-green/5 p-4">

                        <p className="text-xs font-bold uppercase tracking-wider text-brand-green">
                          Existing Feedback
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {
                            question
                              .answer
                              .lecturer_feedback
                          }
                        </p>

                      </div>
                    )}

                  </div>
                )
              )}

            </div>
          )}

        </section>

        {/* =================================================
            GRADING NOTICE
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-brand-green/20 bg-brand-green/5 p-6">

          <div className="flex gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green/10">

              <CheckCircle2 className="h-5 w-5 text-brand-green" />

            </div>

            <div>

              <h2 className="font-bold text-brand-dark">
                Grading
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Award marks for each question
                and provide feedback where
                necessary. The system will
                calculate the final score
                automatically.
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            ACTUAL GRADING FORM
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/15">

              <ClipboardCheck className="h-6 w-6 text-brand-gold" />

            </div>

            <div>

              <h2 className="text-lg font-bold text-brand-dark">
                Grade Submission
              </h2>

              <p className="text-sm text-slate-500">
                Enter marks and lecturer
                feedback for this submission.
              </p>

            </div>

          </div>

          {/* =================================================
              IMPORTANT:
              SubmissionGradingForm currently accepts ONLY
              assignmentId and submissionId.
          ================================================= */}

          <SubmissionGradingForm
            assignmentId={assignment.id}
            submissionId={submission.id}
          />

        </section>

      </div>

    </main>
  );
}