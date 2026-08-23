import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   GET LESSONS
   GET /api/lms/lessons?topic_id=1
========================================================= */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const topicId = searchParams.get('topic_id');

    if (!topicId) {
      return NextResponse.json(
        {
          success: false,
          message: 'topic_id is required.',
        },
        { status: 400 }
      );
    }

    const numericTopicId = Number(topicId);

    if (!Number.isInteger(numericTopicId) || numericTopicId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid topic_id.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          l.id,
          l.topic_id,
          l.title,
          l.description,
          l.content,
          l.order_number,
          l.status,
          l.created_at,
          l.updated_at
        FROM lms_lessons l
        WHERE l.topic_id = $1
        ORDER BY
          l.order_number ASC,
          l.created_at ASC
      `,
      [numericTopicId]
    );

    return NextResponse.json({
      success: true,
      lessons: result.rows,
    });
  } catch (error: any) {
    console.error(
      'LMS lessons GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load lessons.',
        error: error?.message,
        code: error?.code,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE LESSON
   POST /api/lms/lessons
========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const topicId = Number(body.topic_id);

    const title = String(
      body.title || ''
    ).trim();

    const description = String(
      body.description || ''
    ).trim();

    const content = String(
      body.content || ''
    ).trim();

    const orderNumber =
      body.order_number === undefined ||
      body.order_number === ''
        ? 1
        : Number(body.order_number);

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !Number.isInteger(topicId) ||
      topicId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid topic ID is required.',
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson title is required.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(orderNumber) ||
      orderNumber < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order number must be a positive integer.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CREATE LESSON
    ===================================================== */

    const result = await pool.query(
      `
        INSERT INTO lms_lessons
        (
          topic_id,
          title,
          description,
          content,
          order_number
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        RETURNING
          id,
          topic_id,
          title,
          description,
          content,
          order_number,
          status,
          created_at,
          updated_at
      `,
      [
        topicId,
        title,
        description || null,
        content || null,
        orderNumber,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Lesson created successfully.',
        lesson: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      'LMS lesson POST error:',
      error
    );

    /* =====================================================
       DUPLICATE LESSON
    ===================================================== */

    if (error?.code === '23505') {
      return NextResponse.json(
        {
          success: false,
          message:
            'A lesson with this title already exists in this topic.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create lesson.',
        error: error?.message,
        code: error?.code,
      },
      { status: 500 }
    );
  }
}