import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

type AssignmentStatus = 'draft' | 'active' | 'closed';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   GET SINGLE ASSIGNMENT
========================================================= */

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const assignmentId = Number(id);

    if (!Number.isInteger(assignmentId)) {
      return NextResponse.json(
        { error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    const result = await pool.query(
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
      WHERE id = $1
      LIMIT 1
      `,
      [assignmentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      assignment: result.rows[0],
    });
  } catch (error) {
    console.error('Get assignment error:', error);

    return NextResponse.json(
      { error: 'Failed to get assignment' },
      { status: 500 }
    );
  }
}

/* =========================================================
   UPDATE ASSIGNMENT
========================================================= */

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const assignmentId = Number(id);

    if (!Number.isInteger(assignmentId)) {
      return NextResponse.json(
        { error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      lesson_id,
      title,
      description,
      due_date,
      total_marks,
      status,
    } = body;

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!lesson_id) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Assignment title is required' },
        { status: 400 }
      );
    }

    if (
      total_marks === undefined ||
      total_marks === null ||
      Number(total_marks) < 0
    ) {
      return NextResponse.json(
        { error: 'Valid total marks are required' },
        { status: 400 }
      );
    }

    const validStatuses: AssignmentStatus[] = [
      'draft',
      'active',
      'closed',
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid assignment status' },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       CHECK ASSIGNMENT EXISTS
    ------------------------------------------------------- */

    const assignmentResult = await pool.query(
      `
      SELECT id
      FROM lms_assignments
      WHERE id = $1
      LIMIT 1
      `,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    /* -------------------------------------------------------
       CHECK LESSON EXISTS
    ------------------------------------------------------- */

    const lessonResult = await pool.query(
      `
      SELECT id
      FROM lms_lessons
      WHERE id = $1
      LIMIT 1
      `,
      [lesson_id]
    );

    if (lessonResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    /* -------------------------------------------------------
       UPDATE
    ------------------------------------------------------- */

    const result = await pool.query(
      `
      UPDATE lms_assignments
      SET
        lesson_id = $1,
        title = $2,
        description = $3,
        due_date = $4,
        total_marks = $5,
        status = $6,
        updated_at = NOW()
      WHERE id = $7
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
        lesson_id,
        title.trim(),
        description?.trim() || null,
        due_date || null,
        Number(total_marks),
        status,
        assignmentId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment: result.rows[0],
    });
  } catch (error) {
    console.error('Update assignment error:', error);

    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE ASSIGNMENT
========================================================= */

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const assignmentId = Number(id);

    if (!Number.isInteger(assignmentId)) {
      return NextResponse.json(
        { error: 'Invalid assignment ID' },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       CHECK ASSIGNMENT EXISTS
    ------------------------------------------------------- */

    const assignmentResult = await pool.query(
      `
      SELECT id
      FROM lms_assignments
      WHERE id = $1
      LIMIT 1
      `,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    /* -------------------------------------------------------
       DELETE
    ------------------------------------------------------- */

    await pool.query(
      `
      DELETE FROM lms_assignments
      WHERE id = $1
      `,
      [assignmentId]
    );

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    console.error('Delete assignment error:', error);

    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}