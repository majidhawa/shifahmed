import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/* =========================================================
   GET TOPICS
   GET /api/lms/topics?unit_id=1
========================================================= */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const unitId = searchParams.get('unit_id');

    if (!unitId) {
      return NextResponse.json(
        {
          success: false,
          message: 'unit_id is required.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          t.id,
          t.unit_id,
          t.title,
          t.description,
          t.order_number,
          t.status,
          t.created_at,
          t.updated_at,

          COUNT(l.id)::int AS lesson_count

        FROM lms_topics t

        LEFT JOIN lms_lessons l
          ON l.topic_id = t.id
          AND l.status = 'active'

        WHERE t.unit_id = $1

        GROUP BY
          t.id,
          t.unit_id,
          t.title,
          t.description,
          t.order_number,
          t.status,
          t.created_at,
          t.updated_at

        ORDER BY
          t.order_number ASC,
          t.created_at ASC
      `,
      [Number(unitId)]
    );

    return NextResponse.json({
      success: true,
      topics: result.rows,
    });

  } catch (error: any) {

    console.error(
      'LMS topics GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to load topics.',
        error: error?.message,
        code: error?.code,
      },
      { status: 500 }
    );
  }
}


/* =========================================================
   CREATE TOPIC
   POST /api/lms/topics
========================================================= */

export async function POST(request: Request) {
  try {

    const body = await request.json();

    const unitId = Number(body.unit_id);

    const title = String(
      body.title || ''
    ).trim();

    const description = String(
      body.description || ''
    ).trim();

    const orderNumber = Number(
      body.order_number || 1
    );

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!unitId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unit ID is required.',
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Topic title is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CREATE TOPIC
    ===================================================== */

    const result = await pool.query(
      `
        INSERT INTO lms_topics
        (
          unit_id,
          title,
          description,
          order_number
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4
        )

        RETURNING
          id,
          unit_id,
          title,
          description,
          order_number,
          status,
          created_at,
          updated_at
      `,
      [
        unitId,
        title,
        description || null,
        orderNumber,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Topic created successfully.',

        topic: {
          ...result.rows[0],
          lesson_count: 0,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {

    console.error(
      'LMS topic POST error:',
      error
    );

    /* =====================================================
       DUPLICATE TOPIC
    ===================================================== */

    if (error?.code === '23505') {
      return NextResponse.json(
        {
          success: false,
          message:
            'A topic with this title already exists in this unit.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create topic.',
        error: error?.message,
        code: error?.code,
      },
      { status: 500 }
    );
  }
}