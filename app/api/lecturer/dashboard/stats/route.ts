import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   GET /api/lecturer/dashboard/stats

   Returns real statistics for the currently authenticated
   lecturer.

   DATABASE RELATIONSHIP

   users
      ↓
   lms_lecturer_programs
      ↓
   lms_programs
      ↓
   lms_units
      ↓
   lms_topics
      ↓
   lms_lessons
      ↓
   ┌───────────────┬──────────────┬──────────────┐
   ↓               ↓              ↓              ↓
   documents      videos       assignments     quizzes

   Students:
   lms_enrollments
        ↓
   program_id

   IMPORTANT:
   - No hard-coded lecturer ID
   - No nonexistent tables
   - No global curriculum counts
   - Everything is scoped to the authenticated lecturer
========================================================= */

export async function GET() {
  try {
    /* =====================================================
       GET AUTHENTICATED LECTURER
    ===================================================== */

    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const lecturerId = Number(lecturer.id);

    if (!Number.isInteger(lecturerId) || lecturerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid lecturer account.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       VERIFY LECTURER ACCOUNT
    ===================================================== */

    const lecturerResult = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          phone,
          role,
          active
        FROM users
        WHERE id = $1
          AND role = 'lecturer'
          AND active = TRUE
        LIMIT 1
      `,
      [lecturerId]
    );

    if (lecturerResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Lecturer account was not found or is inactive.',
        },
        { status: 401 }
      );
    }

    const currentLecturer = lecturerResult.rows[0];

    /* =====================================================
       GET DASHBOARD STATISTICS

       Everything is calculated from the lecturer's
       assigned programs.
    ===================================================== */

    const result = await pool.query(
      `
        WITH lecturer_programs AS (

          SELECT DISTINCT
            lp.program_id

          FROM lms_lecturer_programs lp

          INNER JOIN lms_programs p
            ON p.id = lp.program_id

          WHERE lp.lecturer_id = $1

        ),

        lecturer_units AS (

          SELECT DISTINCT
            u.id

          FROM lms_units u

          INNER JOIN lecturer_programs lp
            ON lp.program_id = u.program_id

        ),

        lecturer_topics AS (

          SELECT DISTINCT
            t.id

          FROM lms_topics t

          INNER JOIN lecturer_units u
            ON u.id = t.unit_id

        ),

        lecturer_lessons AS (

          SELECT DISTINCT
            l.id

          FROM lms_lessons l

          INNER JOIN lecturer_topics t
            ON t.id = l.topic_id

        )

        SELECT

          /* =================================================
             COURSES
          ================================================= */

          (
            SELECT COUNT(*)::int
            FROM lecturer_programs
          ) AS courses,


          /* =================================================
             UNITS
          ================================================= */

          (
            SELECT COUNT(*)::int
            FROM lecturer_units
          ) AS units,


          /* =================================================
             TOPICS
          ================================================= */

          (
            SELECT COUNT(*)::int
            FROM lecturer_topics
          ) AS topics,


          /* =================================================
             LESSONS
          ================================================= */

          (
            SELECT COUNT(*)::int
            FROM lecturer_lessons
          ) AS lessons,


          /* =================================================
             LEARNING MATERIALS

             Correct table:
             lms_lesson_documents
          ================================================= */

          (
            SELECT COUNT(*)::int

            FROM lms_lesson_documents d

            INNER JOIN lecturer_lessons ll
              ON ll.id = d.lesson_id

          ) AS materials,


          /* =================================================
             VIDEOS
          ================================================= */

          (
            SELECT COUNT(*)::int

            FROM lms_lesson_videos v

            INNER JOIN lecturer_lessons ll
              ON ll.id = v.lesson_id

          ) AS videos,


          /* =================================================
             ASSIGNMENTS
          ================================================= */

          (
            SELECT COUNT(*)::int

            FROM lms_assignments a

            INNER JOIN lecturer_lessons ll
              ON ll.id = a.lesson_id

          ) AS assignments,


          /* =================================================
             QUIZZES
          ================================================= */

          (
            SELECT COUNT(*)::int

            FROM lms_quizzes q

            INNER JOIN lecturer_lessons ll
              ON ll.id = q.lesson_id

          ) AS quizzes,


          /* =================================================
             STUDENTS

             lms_enrollments does NOT contain student_id.

             Confirmed columns include:
             application_id
             program_id

             Therefore we count unique applications.
          ================================================= */

          (
            SELECT COUNT(DISTINCT e.application_id)::int

            FROM lms_enrollments e

            INNER JOIN lecturer_programs lp
              ON lp.program_id = e.program_id

          ) AS students

      `,
      [lecturerId]
    );

    const row = result.rows[0];

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        lecturer: {
          id: currentLecturer.id,
          name: currentLecturer.name,
          email: currentLecturer.email,
          phone: currentLecturer.phone,
          role: currentLecturer.role,
        },

        stats: {
          courses: Number(row.courses || 0),
          students: Number(row.students || 0),
          units: Number(row.units || 0),
          topics: Number(row.topics || 0),
          lessons: Number(row.lessons || 0),
          materials: Number(row.materials || 0),
          videos: Number(row.videos || 0),
          assignments: Number(row.assignments || 0),
          quizzes: Number(row.quizzes || 0),

          /*
           * These tables were not included in the confirmed
           * database schema supplied so far.
           */
          attendance: 0,
          announcements: 0,
          notifications: 0,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(
      'GET LECTURER DASHBOARD STATS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load lecturer dashboard statistics.',
      },
      { status: 500 }
    );
  }
}