import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

/* =========================================================
   GET VIDEOS FOR A LESSON

   GET /api/lecturer/lesson-videos?lesson_id=1
========================================================= */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const lessonIdValue = searchParams.get('lesson_id');

    if (!lessonIdValue) {
      return NextResponse.json(
        {
          success: false,
          message: 'lesson_id is required.',
        },
        { status: 400 }
      );
    }

    const lessonId = Number(lessonIdValue);

    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid lesson_id.',
        },
        { status: 400 }
      );
    }

    const lessonCheck = await pool.query(
      `
        SELECT id
        FROM lms_lessons
        WHERE id = $1
        LIMIT 1
      `,
      [lessonId]
    );

    if (lessonCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson not found.',
        },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          id,
          lesson_id,
          title,
          description,
          video_url,
          thumbnail_url,
          duration_seconds,
          order_number,
          status,
          created_at,
          updated_at,
          video_file_name,
          video_file_url,
          source_type
        FROM lms_lesson_videos
        WHERE lesson_id = $1
        ORDER BY
          order_number ASC,
          created_at ASC,
          id ASC
      `,
      [lessonId]
    );

    return NextResponse.json(
      {
        success: true,
        videos: result.rows,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(
      'LECTURER LESSON VIDEOS GET ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to load lesson videos.',
      },
      { status: 500 }
    );
  }
}


/* =========================================================
   CREATE VIDEO

   POST /api/lecturer/lesson-videos
========================================================= */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      lesson_id,
      title,
      description,
      video_url,
      thumbnail_url,
      duration_seconds,
      order_number,
      status,
      video_file_name,
      video_file_url,
      source_type,
    } = body;

    const lessonId = Number(lesson_id);

    const cleanTitle =
      typeof title === 'string'
        ? title.trim()
        : '';

    const cleanDescription =
      typeof description === 'string'
        ? description.trim()
        : '';

    const cleanVideoUrl =
      typeof video_url === 'string'
        ? video_url.trim()
        : '';

    const cleanThumbnailUrl =
      typeof thumbnail_url === 'string'
        ? thumbnail_url.trim()
        : '';

    const cleanVideoFileName =
      typeof video_file_name === 'string'
        ? video_file_name.trim()
        : '';

    const cleanVideoFileUrl =
      typeof video_file_url === 'string'
        ? video_file_url.trim()
        : '';

    const cleanSourceType =
      typeof source_type === 'string'
        ? source_type.trim().toLowerCase()
        : 'url';

    const cleanStatus =
      typeof status === 'string'
        ? status.trim().toLowerCase()
        : 'active';

    if (!Number.isInteger(lessonId) || lessonId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid lesson_id is required.',
        },
        { status: 400 }
      );
    }

    if (!cleanTitle) {
      return NextResponse.json(
        {
          success: false,
          message: 'Video title is required.',
        },
        { status: 400 }
      );
    }

    const allowedSources = [
      'url',
      'upload',
    ];

    const finalSourceType =
      allowedSources.includes(cleanSourceType)
        ? cleanSourceType
        : 'url';

    /*
     * For URL videos, video_url is required.
     * For uploaded videos, video_file_url is required.
     */

    if (
      finalSourceType === 'url' &&
      !cleanVideoUrl
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Video URL is required.',
        },
        { status: 400 }
      );
    }

    if (
      finalSourceType === 'upload' &&
      !cleanVideoFileUrl
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Uploaded video file URL is required.',
        },
        { status: 400 }
      );
    }

    const finalVideoUrl =
      finalSourceType === 'url'
        ? cleanVideoUrl
        : cleanVideoFileUrl;

    let finalDuration: number | null = null;

    if (
      duration_seconds !== null &&
      duration_seconds !== undefined &&
      duration_seconds !== ''
    ) {
      const duration = Number(duration_seconds);

      if (
        !Number.isFinite(duration) ||
        duration < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid video duration.',
          },
          { status: 400 }
        );
      }

      finalDuration = Math.trunc(duration);
    }

    let finalOrder = 1;

    if (
      order_number !== null &&
      order_number !== undefined &&
      order_number !== ''
    ) {
      const order = Number(order_number);

      if (
        !Number.isInteger(order) ||
        order <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Order number must be a positive integer.',
          },
          { status: 400 }
        );
      }

      finalOrder = order;
    }

    const validStatuses = [
      'active',
      'inactive',
    ];

    const finalStatus =
      validStatuses.includes(cleanStatus)
        ? cleanStatus
        : 'active';

    const lessonCheck = await pool.query(
      `
        SELECT id
        FROM lms_lessons
        WHERE id = $1
        LIMIT 1
      `,
      [lessonId]
    );

    if (lessonCheck.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson not found.',
        },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `
        INSERT INTO lms_lesson_videos
        (
          lesson_id,
          title,
          description,
          video_url,
          thumbnail_url,
          duration_seconds,
          order_number,
          status,
          video_file_name,
          video_file_url,
          source_type
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11
        )
        RETURNING
          id,
          lesson_id,
          title,
          description,
          video_url,
          thumbnail_url,
          duration_seconds,
          order_number,
          status,
          created_at,
          updated_at,
          video_file_name,
          video_file_url,
          source_type
      `,
      [
        lessonId,
        cleanTitle,
        cleanDescription || null,
        finalVideoUrl,
        cleanThumbnailUrl || null,
        finalDuration,
        finalOrder,
        finalStatus,
        cleanVideoFileName || null,
        cleanVideoFileUrl || null,
        finalSourceType,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Video created successfully.',
        video: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error(
      'LECTURER LESSON VIDEOS POST ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create video.',
      },
      { status: 500 }
    );
  }
}