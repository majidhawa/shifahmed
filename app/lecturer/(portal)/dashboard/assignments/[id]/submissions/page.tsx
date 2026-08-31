
import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  Users,
  AlertCircle,
  Eye,
  ClipboardList,
} from 'lucide-react';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

/* =========================================================
   TYPES
========================================================= */

type Question = {
  id: number;
  assignment_id: number;
  question_text: string;
  marks: number;
  question_order: number;
};

type Submission = {
  id: number;
  status: string;
  submittedAt: string | null;
  marksAwarded: number | null;
  totalMarks: number | null;
  feedback: string | null;
  gradedAt: string | null;
};

type Student = {
  applicationId: number;
  studentNumber: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  submission: Submission | null;
};

type Assignment = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  totalMarks: number;

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
    title: string;
  };

  program: {
    id: number;
    name: string;
  };
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
    return '—';
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
   STATUS BADGE
========================================================= */

function SubmissionStatus({
  submission,
}: {
  submission: Submission | null;
}) {
  if (!submission) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
        <Clock3 className="h-3.5 w-3.5" />
        Not Submitted
      </span>
    );
  }

  switch (submission.status) {
    case 'graded':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Graded
        </span>
      );

    case 'late':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
          <AlertCircle className="h-3.5 w-3.5" />
          Late
        </span>
      );

    case 'returned':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          <FileCheck2 className="h-3.5 w-3.5" />
          Returned
        </span>
      );

    case 'draft':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
          Draft
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          <FileCheck2 className="h-3.5 w-3.5" />
          Submitted
        </span>
      );
  }
}

/* =========================================================
   PAGE
========================================================= */

export default async function AssignmentSubmissionsPage({
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
     GET ASSIGNMENT ID
  ======================================================= */

  const { id } = await params;

  const assignmentId = Number(id);

  if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
    redirect('/lecturer/dashboard/assignments');
  }

  /* =======================================================
     GET ASSIGNMENT
     
     DATABASE STRUCTURE:

     lms_assignments
        ↓ lesson_id
     lms_lessons
        ↓ topic_id
     lms_topics
        ↓ unit_id
     lms_units
        ↓ program_id
     lms_programs

     Lecturer access is checked through:
     lms_lecturer_programs
  ======================================================= */

  let assignmentResult;

  try {
    assignmentResult = await pool.query(
      `
        SELECT
          a.id,
          a.title,
          a.description,
          a.due_date,
          a.status,
          a.total_marks,

          l.id AS lesson_id,
          l.title AS lesson_title,

          t.id AS topic_id,
          t.title AS topic_title,

          u.id AS unit_id,
          u.name AS unit_title,

          p.id AS program_id,
          p.name AS program_name

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

        WHERE a.id = $1
          AND lp.lecturer_id = $2

        LIMIT 1
      `,
      [assignmentId, lecturer.id]
    );
  } catch (error) {
    console.error(
      'GET ASSIGNMENT FOR SUBMISSIONS PAGE ERROR:',
      error
    );

    redirect('/lecturer/dashboard/assignments');
  }

  if (assignmentResult.rows.length === 0) {
    redirect('/lecturer/dashboard/assignments');
  }

  const assignmentRow = assignmentResult.rows[0];

  /* =======================================================
     FORMAT ASSIGNMENT
  ======================================================= */

  const assignment: Assignment = {
    id: Number(assignmentRow.id),

    title: assignmentRow.title,

    description: assignmentRow.description,

    dueDate: assignmentRow.due_date,

    status: assignmentRow.status,

    totalMarks: Number(assignmentRow.total_marks) || 0,

    lesson: {
      id: Number(assignmentRow.lesson_id),
      title: assignmentRow.lesson_title,
    },

    topic: {
      id: Number(assignmentRow.topic_id),
      title: assignmentRow.topic_title,
    },

    unit: {
      id: Number(assignmentRow.unit_id),
      title: assignmentRow.unit_title,
    },

    program: {
      id: Number(assignmentRow.program_id),
      name: assignmentRow.program_name,
    },
  };

  /* =======================================================
     GET QUESTIONS
     
     CONFIRMED DATABASE COLUMNS:

     id
     assignment_id
     question_number
     question
     marks
     created_at
     updated_at
  ======================================================= */

  let questions: Question[] = [];

  try {
    const questionsResult = await pool.query(
      `
        SELECT
          id,
          assignment_id,
          question,
          marks,
          question_number

        FROM lms_assignment_questions

        WHERE assignment_id = $1

        ORDER BY
          question_number ASC,
          id ASC
      `,
      [assignmentId]
    );

    questions = questionsResult.rows.map((question) => ({
      id: Number(question.id),

      assignment_id: Number(
        question.assignment_id
      ),

      question_text: question.question,

      marks: Number(question.marks) || 0,

      question_order:
        Number(question.question_number) || 0,
    }));
  } catch (error) {
    console.error(
      'GET ASSIGNMENT QUESTIONS ERROR:',
      error
    );
  }

  /* =======================================================
     GET ENROLLED STUDENTS + SUBMISSIONS

     CONFIRMED APPLICATION COLUMNS:

     first_name
     middle_name
     surname
     email
     mobile

     CONFIRMED ENROLLMENT COLUMNS:

     application_id
     program_id
     student_number

     CONFIRMED SUBMISSION COLUMNS:

     id
     assignment_id
     application_id
     status
     submitted_at
     total_marks
     marks_awarded
     lecturer_feedback
     graded_at
  ======================================================= */

  let students: Student[] = [];

  try {
    const studentsResult = await pool.query(
      `
        SELECT

          e.application_id,

          e.student_number,

          app.first_name,
          app.middle_name,
          app.surname,
          app.email,
          app.mobile,

          s.id AS submission_id,
          s.status AS submission_status,
          s.submitted_at,
          s.marks_awarded,
          s.total_marks AS submission_total_marks,
          s.lecturer_feedback,
          s.graded_at

        FROM lms_enrollments e

        INNER JOIN applications app
          ON app.id = e.application_id

        LEFT JOIN lms_assignment_submissions s
          ON s.assignment_id = $1
         AND s.application_id = e.application_id

        WHERE e.program_id = $2

        ORDER BY
          app.first_name ASC,
          app.surname ASC
      `,
      [
        assignmentId,
        assignment.program.id,
      ]
    );

    students = studentsResult.rows.map(
      (student) => ({
        applicationId: Number(
          student.application_id
        ),

        studentNumber:
          student.student_number,

        name: [
          student.first_name,
          student.middle_name,
          student.surname,
        ]
          .filter(Boolean)
          .join(' '),

        email: student.email,

        phone: student.mobile,

        submission:
          student.submission_id !== null
            ? {
                id: Number(
                  student.submission_id
                ),

                status:
                  student.submission_status,

                submittedAt:
                  student.submitted_at,

                marksAwarded:
                  student.marks_awarded !== null
                    ? Number(
                        student.marks_awarded
                      )
                    : null,

                totalMarks:
                  student.submission_total_marks !==
                  null
                    ? Number(
                        student.submission_total_marks
                      )
                    : null,

                feedback:
                  student.lecturer_feedback,

                gradedAt:
                  student.graded_at,
              }
            : null,
      })
    );
  } catch (error) {
    console.error(
      'GET STUDENTS AND SUBMISSIONS ERROR:',
      error
    );

    redirect('/lecturer/dashboard/assignments');
  }

  /* =======================================================
     STATISTICS
  ======================================================= */

  const totalStudents = students.length;

  const submitted = students.filter(
    (student) =>
      student.submission !== null
  ).length;

  const graded = students.filter(
    (student) =>
      student.submission?.status === 'graded'
  ).length;

  const pending = submitted - graded;

  const notSubmitted =
    totalStudents - submitted;

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            BACK BUTTON
        ================================================== */}

        <div className="mb-6">
          <Link
            href="/lecturer/dashboard/assignments"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assignments
          </Link>
        </div>

        {/* ==================================================
            HEADER
        ================================================== */}

        <section className="overflow-hidden rounded-3xl bg-brand-green shadow-soft">
          <div className="relative p-6 sm:p-8">

            <div className="relative z-10">

              <div className="flex flex-wrap items-center gap-2">

                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Assignment Submissions
                </span>

                <span className="rounded-full bg-brand-gold/20 px-3 py-1.5 text-xs font-bold text-brand-gold">
                  {assignment.status}
                </span>

              </div>

              <h1 className="mt-4 max-w-4xl text-2xl font-bold text-white sm:text-3xl">
                {assignment.title}
              </h1>

              {assignment.description && (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
                  {assignment.description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">

                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand-gold" />
                  {assignment.program.name}
                </div>

                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-brand-gold" />
                  {assignment.lesson.title}
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-brand-gold" />
                  Due {formatDate(assignment.dueDate)}
                </div>

              </div>

            </div>

            <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border-[45px] border-brand-gold/10" />

            <div className="pointer-events-none absolute -bottom-32 right-20 h-60 w-60 rounded-full border-[35px] border-white/5" />

          </div>
        </section>

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">

          {/* TOTAL */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Students
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {totalStudents}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <Users className="h-5 w-5 text-brand-green" />
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Enrolled students
            </p>
          </div>

          {/* SUBMITTED */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Submitted
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {submitted}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
                <FileCheck2 className="h-5 w-5 text-blue-600" />
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Work received
            </p>
          </div>

          {/* GRADED */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Graded
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {graded}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Completed marking
            </p>
          </div>

          {/* PENDING */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Pending
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {pending}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50">
                <Clock3 className="h-5 w-5 text-amber-600" />
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Awaiting marking
            </p>
          </div>

          {/* NOT SUBMITTED */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Missing
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {notSubmitted}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Not submitted
            </p>
          </div>

        </section>

        {/* ==================================================
            ASSIGNMENT INFORMATION
        ================================================== */}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

            <div>
              <h2 className="text-lg font-bold text-brand-dark">
                Assignment Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review the assignment structure before
                marking student submissions.
              </p>
            </div>

            <div className="rounded-2xl bg-brand-cream px-5 py-3">

              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Total Marks
              </p>

              <p className="mt-1 text-xl font-bold text-brand-dark">
                {assignment.totalMarks}
              </p>

            </div>

          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Program
              </p>

              <p className="mt-2 text-sm font-semibold text-brand-dark">
                {assignment.program.name}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Unit
              </p>

              <p className="mt-2 text-sm font-semibold text-brand-dark">
                {assignment.unit.title}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Topic
              </p>

              <p className="mt-2 text-sm font-semibold text-brand-dark">
                {assignment.topic.title}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Lesson
              </p>

              <p className="mt-2 text-sm font-semibold text-brand-dark">
                {assignment.lesson.title}
              </p>
            </div>

          </div>

        </section>

        {/* ==================================================
            QUESTIONS
        ================================================== */}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

          <div>
            <h2 className="text-lg font-bold text-brand-dark">
              Assignment Questions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {questions.length} question
              {questions.length === 1 ? '' : 's'}
              {' · '}
              {assignment.totalMarks} total marks
            </p>
          </div>

          <div className="mt-6 space-y-4">

            {questions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">

                <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  No questions have been added.
                </p>

              </div>
            ) : (
              questions.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
                >

                  <div className="flex items-start gap-4">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green text-sm font-bold text-white">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                        <p className="text-sm font-semibold leading-6 text-brand-dark">
                          {question.question_text}
                        </p>

                        <span className="shrink-0 rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-bold text-brand-gold">
                          {question.marks} marks
                        </span>

                      </div>

                    </div>

                  </div>

                </div>
              ))
            )}

          </div>

        </section>

        {/* ==================================================
            STUDENT SUBMISSIONS
        ================================================== */}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-soft">

          <div className="border-b border-slate-100 p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-lg font-bold text-brand-dark">
                  Student Submissions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review, mark and provide feedback on student work.
                </p>
              </div>

              <div className="rounded-xl bg-brand-cream px-4 py-2">

                <span className="text-sm font-bold text-brand-dark">
                  {submitted}
                </span>

                <span className="ml-1 text-xs text-slate-500">
                  of {totalStudents} submitted
                </span>

              </div>

            </div>

          </div>

          {/* =================================================
              DESKTOP TABLE
          ================================================= */}

          <div className="hidden overflow-x-auto md:block">

            <table className="w-full text-left">

              <thead className="border-b border-slate-100 bg-slate-50/70">

                <tr>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Student
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Submitted
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Result
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {students.length === 0 ? (
                  <tr>

                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center"
                    >

                      <Users className="mx-auto h-8 w-8 text-slate-300" />

                      <p className="mt-3 text-sm font-semibold text-slate-500">
                        No enrolled students found.
                      </p>

                    </td>

                  </tr>
                ) : (
                  students.map((student) => (
                    <tr
                      key={student.applicationId}
                      className="transition hover:bg-slate-50/70"
                    >

                      {/* STUDENT */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-sm font-bold text-brand-green">
                            {student.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-bold text-brand-dark">
                              {student.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {student.studentNumber ||
                                `Application #${student.applicationId}`}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-5">

                        <SubmissionStatus
                          submission={student.submission}
                        />

                      </td>

                      {/* DATE */}

                      <td className="px-6 py-5">

                        <p className="text-sm font-medium text-slate-600">
                          {formatShortDate(
                            student.submission?.submittedAt ||
                              null
                          )}
                        </p>

                      </td>

                      {/* RESULT */}

                      <td className="px-6 py-5">

                        {student.submission ? (
                          student.submission.marksAwarded !==
                          null ? (
                            <span className="text-sm font-bold text-brand-dark">
                              {student.submission.marksAwarded}/
                              {student.submission.totalMarks ??
                                assignment.totalMarks}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              Awaiting marking
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">
                            —
                          </span>
                        )}

                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-5 text-right">

                        {student.submission ? (
                          <Link
                            href={`/lecturer/dashboard/assignments/${assignment.id}/submissions/${student.submission.id}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark"
                          >

                            <Eye className="h-4 w-4" />

                            {student.submission.status === 'graded'
                              ? 'View Grade'
                              : 'Mark Submission'}

                          </Link>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">
                            No submission
                          </span>
                        )}

                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

          {/* =================================================
              MOBILE CARDS
          ================================================= */}

          <div className="space-y-4 p-4 md:hidden">

            {students.length === 0 ? (
              <div className="px-4 py-10 text-center">

                <Users className="mx-auto h-8 w-8 text-slate-300" />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  No enrolled students found.
                </p>

              </div>
            ) : (
              students.map((student) => (
                <div
                  key={student.applicationId}
                  className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-sm font-bold text-brand-green">
                        {student.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-bold text-brand-dark">
                          {student.name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {student.studentNumber ||
                            `Application #${student.applicationId}`}
                        </p>

                      </div>

                    </div>

                    <SubmissionStatus
                      submission={student.submission}
                    />

                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <div className="rounded-xl bg-white p-3">

                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Submitted
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        {formatShortDate(
                          student.submission?.submittedAt ||
                            null
                        )}
                      </p>

                    </div>

                    <div className="rounded-xl bg-white p-3">

                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Result
                      </p>

                      <p className="mt-1 text-xs font-bold text-brand-dark">

                        {student.submission?.marksAwarded !==
                          null &&
                        student.submission?.marksAwarded !==
                          undefined
                          ? `${student.submission.marksAwarded}/${student.submission.totalMarks ?? assignment.totalMarks}`
                          : 'Not graded'}

                      </p>

                    </div>

                  </div>

                  <div className="mt-4">

                    {student.submission ? (
                      <Link
                        href={`/lecturer/dashboard/assignments/${assignment.id}/submissions/${student.submission.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-xs font-bold text-white transition hover:bg-brand-dark"
                      >

                        <Eye className="h-4 w-4" />

                        {student.submission.status === 'graded'
                          ? 'View Grade'
                          : 'Mark Submission'}

                      </Link>
                    ) : (
                      <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-xs font-semibold text-slate-400">
                        No submission received
                      </div>
                    )}

                  </div>

                </div>
              ))
            )}

          </div>

        </section>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="mt-8 rounded-3xl bg-brand-green p-7 shadow-soft">

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
            SMTC Lecturer Portal
          </p>

          <h2 className="mt-2 text-xl font-bold text-white">
            Review. Assess. Support student success.
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
            Review student submissions carefully, provide
            constructive feedback and record accurate marks.
          </p>

        </div>

      </div>
    </main>
  );
}

