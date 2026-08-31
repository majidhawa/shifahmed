import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  ArrowLeft,
  ClipboardList,
} from 'lucide-react';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

import QuizCreateForm from './QuizCreateForm';

/* =========================================================
   TYPES
========================================================= */

type Program = {
  id: number;
  name: string;
};

type Unit = {
  id: number;
  programId: number;
  code: string;
  name: string;
};

type Topic = {
  id: number;
  unitId: number;
  title: string;
};

type Lesson = {
  id: number;
  topicId: number;
  title: string;
};

type QuizCreatePageData = {
  programs: Program[];
  units: Unit[];
  topics: Topic[];
  lessons: Lesson[];
};

/* =========================================================
   GET PAGE DATA
========================================================= */

async function getPageData(
  lecturerId: number
): Promise<QuizCreatePageData> {
  /* =======================================================
     PROGRAMS
     
     Only programs assigned to the lecturer.
  ======================================================= */

  const programsResult =
    await pool.query(
      `
        SELECT DISTINCT
          p.id,
          p.name

        FROM lms_programs p

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = p.id

        WHERE lp.lecturer_id = $1

        ORDER BY p.name ASC
      `,
      [lecturerId]
    );

  /* =======================================================
     UNITS
  ======================================================= */

  const unitsResult =
    await pool.query(
      `
        SELECT
          u.id,
          u.program_id,
          u.code,
          u.name

        FROM lms_units u

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id =
             u.program_id

        WHERE lp.lecturer_id = $1

        ORDER BY
          u.program_id ASC,
          u.code ASC,
          u.name ASC
      `,
      [lecturerId]
    );

  /* =======================================================
     TOPICS
  ======================================================= */

  const topicsResult =
    await pool.query(
      `
        SELECT
          t.id,
          t.unit_id,
          t.title

        FROM lms_topics t

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id =
             u.program_id

        WHERE lp.lecturer_id = $1

        ORDER BY
          t.unit_id ASC,
          t.title ASC
      `,
      [lecturerId]
    );

  /* =======================================================
     LESSONS
  ======================================================= */

  const lessonsResult =
    await pool.query(
      `
        SELECT
          l.id,
          l.topic_id,
          l.title

        FROM lms_lessons l

        INNER JOIN lms_topics t
          ON t.id = l.topic_id

        INNER JOIN lms_units u
          ON u.id = t.unit_id

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id =
             u.program_id

        WHERE lp.lecturer_id = $1

        ORDER BY
          l.topic_id ASC,
          l.title ASC
      `,
      [lecturerId]
    );

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    programs:
      programsResult.rows.map(
        (row) => ({
          id: Number(row.id),
          name: row.name,
        })
      ),

    units:
      unitsResult.rows.map(
        (row) => ({
          id: Number(row.id),
          programId:
            Number(row.program_id),
          code: row.code,
          name: row.name,
        })
      ),

    topics:
      topicsResult.rows.map(
        (row) => ({
          id: Number(row.id),
          unitId:
            Number(row.unit_id),
          title: row.title,
        })
      ),

    lessons:
      lessonsResult.rows.map(
        (row) => ({
          id: Number(row.id),
          topicId:
            Number(row.topic_id),
          title: row.title,
        })
      ),
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function CreateQuizPage() {
  /* =======================================================
     AUTHENTICATION
  ======================================================= */

  const lecturer =
    await requireLecturer();

  if (!lecturer) {
    redirect('/lecturer/login');
  }

  /* =======================================================
     LOAD DATA
  ======================================================= */

  let data:
    QuizCreatePageData;

  try {
    data =
      await getPageData(
        Number(lecturer.id)
      );
  } catch (error) {
    console.error(
      'CREATE QUIZ PAGE DATA ERROR:',
      error
    );

    data = {
      programs: [],
      units: [],
      topics: [],
      lessons: [],
    };
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-brand-cream px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-5xl">

        {/* ==================================================
            BACK
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
            HEADER
        ================================================== */}

        <section className="overflow-hidden rounded-3xl bg-brand-green shadow-soft">

          <div className="relative p-6 sm:p-8">

            <div className="relative z-10">

              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">

                <ClipboardList className="h-4 w-4" />

                Create Assessment

              </div>

              <h1 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
                Create Quiz or Exam
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                Create an assessment for one of your assigned
                lessons. Select the program, unit, topic and
                lesson in order, then configure the assessment
                settings.
              </p>

            </div>

            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[45px] border-brand-gold/10" />

            <div className="pointer-events-none absolute -bottom-32 right-24 h-60 w-60 rounded-full border-[35px] border-white/5" />

          </div>

        </section>

        {/* ==================================================
            FORM
        ================================================== */}

        <QuizCreateForm
          programs={data.programs}
          units={data.units}
          topics={data.topics}
          lessons={data.lessons}
        />

      </div>

    </main>
  );
}