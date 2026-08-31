import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

/* =========================================================
   GET /api/lecturer/lesson-videos/[id]

   GET SINGLE VIDEO
========================================================= */

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    const videoId = Number(id);

    /* =====================================================
       VALIDATE VIDEO ID
    ===================================================== */

    if (
      !Number.isInteger(videoId) ||
      videoId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid video ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GET VIDEO
    ===================================================== */

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
        WHERE id = $1
        LIMIT 1
      `,
      [videoId]
    );

    /* =====================================================
       NOT FOUND
    ===================================================== */

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Video not found.',
        },
        { status: 404 }
      );
    }

    const video = result.rows[0];

    /* =====================================================
       NORMALIZE VIDEO DATA
       
       For uploaded videos:
       video_file_url is the actual uploaded file.
       
       For URL videos:
       video_url is the actual source URL.
    ===================================================== */

    const normalizedVideo = {
      id: video.id,

      lesson_id: video.lesson_id,

      title: video.title ?? '',

      description:
        video.description ?? '',

      video_url:
        video.video_url ?? '',

      thumbnail_url:
        video.thumbnail_url ?? '',

      duration_seconds:
        video.duration_seconds ?? null,

      order_number:
        video.order_number ?? 1,

      status:
        video.status ?? 'active',

      created_at:
        video.created_at,

      updated_at:
        video.updated_at,

      video_file_name:
        video.video_file_name ?? '',

      video_file_url:
        video.video_file_url ?? '',

      source_type:
        video.source_type === 'upload'
          ? 'upload'
          : 'url',
    };

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        video: normalizedVideo,
      },
      { status: 200 }
    );

  } catch (error: unknown) {

    console.error(
      'GET LECTURER VIDEO ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to load video.',
      },
      { status: 500 }
    );
  }
}


/* =========================================================
   PUT /api/lecturer/lesson-videos/[id]

   UPDATE VIDEO
========================================================= */

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {

    const { id } = await context.params;

    const videoId = Number(id);

    /* =====================================================
       VALIDATE ID
    ===================================================== */

    if (
      !Number.isInteger(videoId) ||
      videoId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid video ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK EXISTING VIDEO
    ===================================================== */

    const existingResult =
      await pool.query(
        `
          SELECT
            id,
            lesson_id,
            source_type,
            video_url,
            video_file_name,
            video_file_url
          FROM lms_lesson_videos
          WHERE id = $1
          LIMIT 1
        `,
        [videoId]
      );

    if (
      existingResult.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Video not found.',
        },
        { status: 404 }
      );
    }

    const existingVideo =
      existingResult.rows[0];

    /* =====================================================
       READ JSON
    ===================================================== */

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid JSON request body.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALUES
    ===================================================== */

    const cleanTitle =
      typeof body.title === 'string'
        ? body.title.trim()
        : '';

    const cleanDescription =
      typeof body.description === 'string'
        ? body.description.trim()
        : '';

    const cleanVideoUrl =
      typeof body.video_url === 'string'
        ? body.video_url.trim()
        : '';

    const cleanThumbnailUrl =
      typeof body.thumbnail_url === 'string'
        ? body.thumbnail_url.trim()
        : '';

    const cleanVideoFileName =
      typeof body.video_file_name === 'string'
        ? body.video_file_name.trim()
        : '';

    const cleanVideoFileUrl =
      typeof body.video_file_url === 'string'
        ? body.video_file_url.trim()
        : '';

    /* =====================================================
       TITLE
    ===================================================== */

    if (!cleanTitle) {
      return NextResponse.json(
        {
          success: false,
          message: 'Video title is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       SOURCE TYPE
    ===================================================== */

    const requestedSource =
      typeof body.source_type === 'string'
        ? body.source_type
            .trim()
            .toLowerCase()
        : existingVideo.source_type;

    const sourceType =
      requestedSource === 'upload'
        ? 'upload'
        : 'url';

    /* =====================================================
       DETERMINE VIDEO URL
    ===================================================== */

    let finalVideoUrl = '';

    let finalVideoFileName:
      | string
      | null = null;

    let finalVideoFileUrl:
      | string
      | null = null;

    if (sourceType === 'upload') {

      /*
       * If the edit page sends a new uploaded
       * video URL, use it.
       */

      if (cleanVideoFileUrl) {

        finalVideoUrl =
          cleanVideoFileUrl;

        finalVideoFileUrl =
          cleanVideoFileUrl;

        finalVideoFileName =
          cleanVideoFileName || null;

      } else {

        /*
         * No new upload.
         *
         * Keep the existing uploaded video.
         */

        finalVideoUrl =
          existingVideo.video_file_url ||
          existingVideo.video_url ||
          '';

        finalVideoFileUrl =
          existingVideo.video_file_url ||
          null;

        finalVideoFileName =
          existingVideo.video_file_name ||
          null;
      }

    } else {

      /*
       * URL source
       */

      finalVideoUrl =
        cleanVideoUrl;

      finalVideoFileUrl = null;

      finalVideoFileName = null;
    }

    /* =====================================================
       VALIDATE VIDEO URL
    ===================================================== */

    if (!finalVideoUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            sourceType === 'upload'
              ? 'Uploaded video file is required.'
              : 'Video URL is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       DURATION
    ===================================================== */

    let finalDuration:
      | number
      | null = null;

    if (
      body.duration_seconds !== null &&
      body.duration_seconds !== undefined &&
      body.duration_seconds !== ''
    ) {

      const duration =
        Number(body.duration_seconds);

      if (
        !Number.isFinite(duration) ||
        duration < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Invalid video duration.',
          },
          { status: 400 }
        );
      }

      finalDuration =
        Math.trunc(duration);
    }

    /* =====================================================
       ORDER NUMBER
    ===================================================== */

    let finalOrder = 1;

    if (
      body.order_number !== null &&
      body.order_number !== undefined &&
      body.order_number !== ''
    ) {

      const order =
        Number(body.order_number);

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

    /* =====================================================
       STATUS
    ===================================================== */

    const requestedStatus =
      typeof body.status === 'string'
        ? body.status.trim().toLowerCase()
        : 'active';

    const finalStatus =
      requestedStatus === 'inactive'
        ? 'inactive'
        : 'active';

    /* =====================================================
       UPDATE DATABASE
    ===================================================== */

    const result =
      await pool.query(
        `
          UPDATE lms_lesson_videos
          SET
            title = $1,
            description = $2,
            video_url = $3,
            thumbnail_url = $4,
            duration_seconds = $5,
            order_number = $6,
            status = $7,
            video_file_name = $8,
            video_file_url = $9,
            source_type = $10,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $11

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
          cleanTitle,

          cleanDescription || null,

          finalVideoUrl,

          cleanThumbnailUrl || null,

          finalDuration,

          finalOrder,

          finalStatus,

          finalVideoFileName,

          finalVideoFileUrl,

          sourceType,

          videoId,
        ]
      );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          'Video updated successfully.',
        video: result.rows[0],
      },
      { status: 200 }
    );

  } catch (error: unknown) {

    console.error(
      'UPDATE LECTURER VIDEO ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update video.',
      },
      { status: 500 }
    );
  }
}


/* =========================================================
   DELETE /api/lecturer/lesson-videos/[id]

   DELETE VIDEO
========================================================= */

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {

    const { id } = await context.params;

    const videoId = Number(id);

    /* =====================================================
       VALIDATE ID
    ===================================================== */

    if (
      !Number.isInteger(videoId) ||
      videoId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid video ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK VIDEO
    ===================================================== */

    const existingVideo =
      await pool.query(
        `
          SELECT
            id,
            lesson_id,
            title,
            source_type,
            video_file_name,
            video_file_url
          FROM lms_lesson_videos
          WHERE id = $1
          LIMIT 1
        `,
        [videoId]
      );

    if (
      existingVideo.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Video not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       DELETE DATABASE RECORD
    ===================================================== */

    await pool.query(
      `
        DELETE FROM lms_lesson_videos
        WHERE id = $1
      `,
      [videoId]
    );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          'Video deleted successfully.',
        video_id: videoId,
      },
      { status: 200 }
    );

  } catch (error: unknown) {

    console.error(
      'DELETE LECTURER VIDEO ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete video.',
      },
      { status: 500 }
    );
  }
}