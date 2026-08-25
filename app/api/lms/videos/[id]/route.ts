import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL =
  process.env.SUPABASE_URL?.trim();

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY?.trim();

const VIDEO_BUCKET = 'lms-videos';

/* =========================================================
   TYPES
========================================================= */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   DELETE SUPABASE FILE
========================================================= */

async function deleteSupabaseFile(
  fileUrl: string | null
): Promise<void> {
  if (
    !fileUrl ||
    !SUPABASE_URL ||
    !SUPABASE_SECRET_KEY
  ) {
    return;
  }

  try {
    /*
     * Only attempt deletion if this is a Supabase
     * Storage URL.
     */

    if (
      !fileUrl.startsWith(
        `${SUPABASE_URL}/storage/v1/object/`
      )
    ) {
      return;
    }

    /*
     * Extract the storage path.
     *
     * Example:
     *
     * https://project.supabase.co/storage/v1/object/public/lms-videos/lessons/1/video.mp4
     *
     * becomes:
     *
     * lessons/1/video.mp4
     */

    const publicPrefix =
      `${SUPABASE_URL}/storage/v1/object/public/${VIDEO_BUCKET}/`;

    const authenticatedPrefix =
      `${SUPABASE_URL}/storage/v1/object/${VIDEO_BUCKET}/`;

    let filePath: string | null = null;

    if (
      fileUrl.startsWith(publicPrefix)
    ) {
      filePath =
        fileUrl.substring(
          publicPrefix.length
        );
    } else if (
      fileUrl.startsWith(
        authenticatedPrefix
      )
    ) {
      filePath =
        fileUrl.substring(
          authenticatedPrefix.length
        );
    }

    if (!filePath) {
      console.warn(
        'Could not determine Supabase video storage path:',
        fileUrl
      );

      return;
    }

    /*
     * Decode URL encoded characters.
     */

    filePath = decodeURIComponent(
      filePath
    );

    /*
     * Delete from Supabase Storage.
     */

    const deleteUrl =
      `${SUPABASE_URL}/storage/v1/object/` +
      `${VIDEO_BUCKET}/` +
      filePath;

    const response =
      await fetch(
        deleteUrl,
        {
          method: 'DELETE',

          headers: {
            Authorization:
              `Bearer ${SUPABASE_SECRET_KEY}`,

            apikey:
              SUPABASE_SECRET_KEY,
          },
        }
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        'Supabase video deletion failed:',
        errorText
      );

      /*
       * Do not throw here.
       *
       * The database record can still be deleted.
       */
    } else {
      console.log(
        'Supabase video deleted successfully:',
        filePath
      );
    }

  } catch (error) {
    console.error(
      'Supabase video deletion error:',
      error
    );

    /*
     * Do not prevent database deletion if
     * Storage cleanup fails.
     */
  }
}

/* =========================================================
   GET SINGLE VIDEO

   GET /api/lms/videos/[id]
========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    /* =====================================================
       GET ID
    ===================================================== */

    const { id } =
      await context.params;

    const videoId =
      Number(id);

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
          message:
            'Invalid video ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       LOAD VIDEO
    ===================================================== */

    const result =
      await pool.query(
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

    if (
      result.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Video not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json({
      success: true,
      video:
        result.rows[0],
    });

  } catch (error: any) {
    console.error(
      'LMS video GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load video.',
        error:
          error?.message ||
          null,
        code:
          error?.code ||
          null,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE VIDEO

   DELETE /api/lms/videos/[id]

   Deletes:

   1. Database record
   2. Uploaded Supabase Storage file

   External URL videos only have the database
   record deleted.
========================================================= */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    /* =====================================================
       GET ID
    ===================================================== */

    const { id } =
      await context.params;

    const videoId =
      Number(id);

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
          message:
            'Invalid video ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       FIND VIDEO

       IMPORTANT:
       The correct table is:

       lms_lesson_videos

       NOT:

       lms_videos
    ===================================================== */

    const videoResult =
      await pool.query(
        `
          SELECT
            id,
            lesson_id,
            title,
            video_url,
            video_file_url,
            video_file_name,
            source_type
          FROM lms_lesson_videos
          WHERE id = $1
          LIMIT 1
        `,
        [videoId]
      );

    /* =====================================================
       VIDEO NOT FOUND
    ===================================================== */

    if (
      videoResult.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Video not found.',
        },
        { status: 404 }
      );
    }

    const video =
      videoResult.rows[0];

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
       DELETE SUPABASE FILE
       
       Only uploaded videos have a file in
       Supabase Storage.

       External YouTube/Vimeo URLs are not
       deleted from their external service.
    ===================================================== */

    if (
      video.source_type === 'upload' &&
      video.video_file_url
    ) {
      await deleteSupabaseFile(
        video.video_file_url
      );
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json({
      success: true,
      message:
        'Video deleted successfully.',
      video_id:
        videoId,
    });

  } catch (error: any) {
    console.error(
      'DELETE /api/lms/videos/[id] error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to delete video.',
        error:
          error?.message ||
          'Unknown error.',
        code:
          error?.code ||
          null,
      },
      { status: 500 }
    );
  }
}