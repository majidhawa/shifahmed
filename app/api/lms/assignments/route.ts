import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

type AssignmentStatus =
  | 'draft'
  | 'active'
  | 'closed';

/* =========================================================
   GET ASSIGNMENTS
   GET /api/lms/assignments?lesson_id=1
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    await requireAdmin();

    const { searchParams } =
      new URL(request.url);

    const lessonId = Number(
      searchParams.get('lesson_id')
    );

    if (!Number.isInteger(lessonId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid lesson_id is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK LESSON
    ===================================================== */

    const lessonResult =
      await pool.query(
        `
        SELECT id
        FROM lms_lessons
        WHERE id = $1
        LIMIT 1
        `,
        [lessonId]
      );

    if (lessonResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       GET ASSIGNMENTS
    ===================================================== */

    const result =
      await pool.query(
        `
        SELECT
          id,
          lesson_id,
          title,
          description,
          due_date,
          total_marks,
          status,
          created_at,
          updated_at

        FROM lms_assignments

        WHERE lesson_id = $1

        ORDER BY
          created_at DESC,
          id DESC
        `,
        [lessonId]
      );

    return NextResponse.json({
      success: true,
      assignments: result.rows,
    });

  } catch (error: any) {
    console.error(
      'GET assignments error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          'Failed to load assignments.',
      },
      { status: 500 }
    );
  }
}


/* =========================================================
   CREATE ASSIGNMENT
   POST /api/lms/assignments
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    await requireAdmin();

    const body =
      await request.json();

    const {
      lesson_id,
      title,
      description,
      due_date,
      total_marks,
      status = 'draft',
    } = body;

    /* =====================================================
       VALIDATE LESSON
    ===================================================== */

    const lessonId =
      Number(lesson_id);

    if (!Number.isInteger(lessonId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid lesson_id is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE TITLE
    ===================================================== */

    if (
      !title ||
      !String(title).trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Assignment title is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE MARKS
    ===================================================== */

    const totalMarks =
      Number(total_marks);

    if (
      !Number.isFinite(totalMarks) ||
      totalMarks < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid total marks are required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE STATUS
    ===================================================== */

    const validStatuses: AssignmentStatus[] = [
      'draft',
      'active',
      'closed',
    ];

    if (
      !validStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid assignment status.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK LESSON EXISTS
    ===================================================== */

    const lessonResult =
      await pool.query(
        `
        SELECT id
        FROM lms_lessons
        WHERE id = $1
        LIMIT 1
        `,
        [lessonId]
      );

    if (lessonResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Lesson not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       CREATE ASSIGNMENT
    ===================================================== */

    const result =
      await pool.query(
        `
        INSERT INTO lms_assignments (
          lesson_id,
          title,
          description,
          due_date,
          total_marks,
          status
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )

        RETURNING
          id,
          lesson_id,
          title,
          description,
          due_date,
          total_marks,
          status,
          created_at,
          updated_at
        `,
        [
          lessonId,

          String(title).trim(),

          description
            ? String(description).trim()
            : null,

          due_date || null,

          totalMarks,

          status,
        ]
      );

    return NextResponse.json(
      {
        success: true,
        message:
          'Assignment created successfully.',
        assignment:
          result.rows[0],
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error(
      'POST assignment error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          'Failed to create assignment.',
      },
      { status: 500 }
    );
  }
}