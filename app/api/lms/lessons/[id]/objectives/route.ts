import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   GET LEARNING OBJECTIVES
   GET /api/lms/lessons/[id]/objectives
========================================================= */

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = Number(params.id);

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson ID is required.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          id,
          lesson_id,
          objective,
          order_number,
          status,
          created_at,
          updated_at
        FROM lms_learning_objectives
        WHERE lesson_id = $1
        ORDER BY order_number ASC, created_at ASC
      `,
      [lessonId]
    );

    return NextResponse.json({
      success: true,
      objectives: result.rows,
    });
  } catch (error: any) {
    console.error(
      'Learning objectives GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load learning objectives.',
        error: error?.message,
        code: error?.code,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE LEARNING OBJECTIVE
   POST /api/lms/lessons/[id]/objectives
========================================================= */

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = Number(params.id);

    const body = await request.json();

    const objective = String(
      body.objective || ''
    ).trim();

    const orderNumber = Number(
      body.order_number || 1
    );

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson ID is required.',
        },
        { status: 400 }
      );
    }

    if (!objective) {
      return NextResponse.json(
        {
          success: false,
          message: 'Learning objective is required.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        INSERT INTO lms_learning_objectives
        (
          lesson_id,
          objective,
          order_number
        )
        VALUES
        (
          $1,
          $2,
          $3
        )
        RETURNING
          id,
          lesson_id,
          objective,
          order_number,
          status,
          created_at,
          updated_at
      `,
      [
        lessonId,
        objective,
        orderNumber,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Learning objective created successfully.',
        objective: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      'Learning objective POST error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create learning objective.',
        error: error?.message,
        code: error?.code,
      },
      { status: 500 }
    );
  }
}