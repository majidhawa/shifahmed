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
   CONSTANTS
========================================================= */

const MAX_VIDEO_SIZE =
  500 * 1024 * 1024; // 500 MB

/* =========================================================
   TYPES
========================================================= */

type SourceType =
  | 'upload'
  | 'external';

type VideoStatus =
  | 'draft'
  | 'active'
  | 'closed';

/* =========================================================
   SUPABASE PUBLIC URL
========================================================= */

function getSupabaseStorageUrl(
  filePath: string
): string {
  if (!SUPABASE_URL) {
    throw new Error(
      'SUPABASE_URL is not configured.'
    );
  }

  return (
    `${SUPABASE_URL}` +
    `/storage/v1/object/public/` +
    `${VIDEO_BUCKET}/` +
    `${filePath}`
  );
}

/* =========================================================
   DELETE SUPABASE FILE
========================================================= */

async function deleteSupabaseFile(
  filePath: string
): Promise<void> {
  if (
    !SUPABASE_URL ||
    !SUPABASE_SECRET_KEY
  ) {
    return;
  }

  try {
    const response =
      await fetch(
        `${SUPABASE_URL}/storage/v1/object/${VIDEO_BUCKET}/${filePath}`,
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
        'Supabase video cleanup failed:',
        errorText
      );
    }
  } catch (error) {
    console.error(
      'Supabase video cleanup error:',
      error
    );
  }
}

/* =========================================================
   GET VIDEOS

   GET /api/lms/videos?lesson_id=1

   IMPORTANT:
   Admin needs to see draft, active and closed videos.
========================================================= */

export async function GET(
  request: Request
) {
  try {
    /* =====================================================
       GET LESSON ID
    ===================================================== */

    const { searchParams } =
      new URL(request.url);

    const lessonIdValue =
      searchParams.get('lesson_id');

    if (!lessonIdValue) {
      return NextResponse.json(
        {
          success: false,
          message:
            'lesson_id is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE LESSON ID
    ===================================================== */

    const lessonId =
      Number(lessonIdValue);

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid lesson_id.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       LOAD VIDEOS
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
          WHERE lesson_id = $1
          ORDER BY
            order_number ASC,
            created_at ASC
        `,
        [lessonId]
      );

    /* =====================================================
       RETURN
    ===================================================== */

    return NextResponse.json({
      success: true,
      videos: result.rows,
    });

  } catch (error: any) {
    console.error(
      'LMS videos GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load videos.',
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
   CREATE VIDEO

   POST /api/lms/videos

   SUPPORTS:

   1. Uploaded video

      source_type = upload
      file = video file

   2. External video

      source_type = external
      video_url = external URL

   FORM DATA:

      lesson_id
      title
      description
      source_type
      video_url
      thumbnail_url
      duration_seconds
      status
      file
========================================================= */

export async function POST(
  request: Request
) {
  let uploadedStoragePath:
    | string
    | null = null;

  try {
    /* =====================================================
       CHECK SUPABASE CONFIGURATION
    ===================================================== */

    if (!SUPABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          message:
            'SUPABASE_URL is not configured.',
        },
        { status: 500 }
      );
    }

    if (!SUPABASE_SECRET_KEY) {
      return NextResponse.json(
        {
          success: false,
          message:
            'SUPABASE_SECRET_KEY is not configured.',
        },
        { status: 500 }
      );
    }

    /* =====================================================
       READ FORM DATA
    ===================================================== */

    const formData =
      await request.formData();

    /* =====================================================
       GET VALUES
    ===================================================== */

    const lessonIdValue =
      formData.get('lesson_id');

    const titleValue =
      formData.get('title');

    const descriptionValue =
      formData.get('description');

    const sourceTypeValue =
      formData.get('source_type');

    const videoUrlValue =
      formData.get('video_url');

    const thumbnailUrlValue =
      formData.get('thumbnail_url');

    const durationValue =
      formData.get('duration_seconds');

    const statusValue =
      formData.get('status');

    const fileValue =
      formData.get('file');

    /* =====================================================
       NORMALIZE VALUES
    ===================================================== */

    const lessonId =
      Number(lessonIdValue);

    const title =
      String(
        titleValue || ''
      ).trim();

    const description =
      String(
        descriptionValue || ''
      ).trim();

    const sourceType =
      String(
        sourceTypeValue || ''
      )
        .trim()
        .toLowerCase() as SourceType;

    const externalVideoUrl =
      String(
        videoUrlValue || ''
      ).trim();

    const thumbnailUrlRaw =
      String(
        thumbnailUrlValue || ''
      ).trim();

    const durationSecondsRaw =
      String(
        durationValue || ''
      ).trim();

    const statusRaw =
      String(
        statusValue || ''
      )
        .trim()
        .toLowerCase();

    /* =====================================================
       STATUS

       Default = draft
    ===================================================== */

    let status: VideoStatus =
      'draft';

    if (
      statusRaw === 'active' ||
      statusRaw === 'closed' ||
      statusRaw === 'draft'
    ) {
      status =
        statusRaw as VideoStatus;
    }

    /* =====================================================
       VALIDATE LESSON ID
    ===================================================== */

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0
    ) {
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

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Video title is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE SOURCE TYPE
    ===================================================== */

    if (
      sourceType !== 'upload' &&
      sourceType !== 'external'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Video source must be either upload or external.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK LESSON EXISTS
    ===================================================== */

    const lessonCheck =
      await pool.query(
        `
          SELECT
            id
          FROM lms_lessons
          WHERE id = $1
          LIMIT 1
        `,
        [lessonId]
      );

    if (
      lessonCheck.rows.length === 0
    ) {
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
       VARIABLES
    ===================================================== */

    let videoUrl:
      | string
      | null = null;

    let videoFileName:
      | string
      | null = null;

    let videoFileUrl:
      | string
      | null = null;

    let durationSeconds:
      | number
      | null = null;

    let thumbnailUrl:
      | string
      | null = null;

    /* =====================================================
       THUMBNAIL URL
    ===================================================== */

    if (thumbnailUrlRaw) {
      try {
        const parsedThumbnail =
          new URL(
            thumbnailUrlRaw
          );

        if (
          parsedThumbnail.protocol !==
            'http:' &&
          parsedThumbnail.protocol !==
            'https:'
        ) {
          throw new Error();
        }

        thumbnailUrl =
          parsedThumbnail.toString();

      } catch {
        return NextResponse.json(
          {
            success: false,
            message:
              'Please provide a valid thumbnail URL.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       DURATION
    ===================================================== */

    if (durationSecondsRaw) {
      const parsedDuration =
        Number(
          durationSecondsRaw
        );

      if (
        !Number.isInteger(
          parsedDuration
        ) ||
        parsedDuration < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Duration must be a valid positive number of seconds.',
          },
          { status: 400 }
        );
      }

      durationSeconds =
        parsedDuration;
    }

    /* =====================================================
       EXTERNAL VIDEO
    ===================================================== */

    if (
      sourceType === 'external'
    ) {
      /* ---------------------------------------------------
         URL REQUIRED
      --------------------------------------------------- */

      if (!externalVideoUrl) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Video URL is required.',
          },
          { status: 400 }
        );
      }

      /* ---------------------------------------------------
         VALIDATE URL
      --------------------------------------------------- */

      try {
        const parsedUrl =
          new URL(
            externalVideoUrl
          );

        if (
          parsedUrl.protocol !==
            'http:' &&
          parsedUrl.protocol !==
            'https:'
        ) {
          throw new Error(
            'Invalid protocol'
          );
        }

        videoUrl =
          parsedUrl.toString();

      } catch {
        return NextResponse.json(
          {
            success: false,
            message:
              'Please provide a valid video URL.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       UPLOADED VIDEO
    ===================================================== */

    if (
      sourceType === 'upload'
    ) {
      /* ---------------------------------------------------
         FILE REQUIRED
      --------------------------------------------------- */

      if (
        !fileValue ||
        !(fileValue instanceof File)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Please select a video file.',
          },
          { status: 400 }
        );
      }

      const file =
        fileValue;

      /* ---------------------------------------------------
         VALIDATE MIME TYPE
      --------------------------------------------------- */

      if (
        !file.type ||
        !file.type.startsWith(
          'video/'
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Only video files are allowed.',
          },
          { status: 400 }
        );
      }

      /* ---------------------------------------------------
         VALIDATE FILE SIZE
      --------------------------------------------------- */

      if (file.size <= 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              'The selected video file is empty.',
          },
          { status: 400 }
        );
      }

      if (
        file.size >
        MAX_VIDEO_SIZE
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Video file is too large. Maximum size is 500 MB.',
          },
          { status: 400 }
        );
      }

      /* ---------------------------------------------------
         FILE NAME
      --------------------------------------------------- */

      videoFileName =
        file.name;

      /* ---------------------------------------------------
         GET EXTENSION
      --------------------------------------------------- */

      const lastDot =
        file.name.lastIndexOf(
          '.'
        );

      const extension =
        lastDot >= 0
          ? file.name
              .substring(
                lastDot + 1
              )
              .toLowerCase()
          : 'mp4';

      /* ---------------------------------------------------
         UNIQUE FILE NAME
      --------------------------------------------------- */

      const uniqueFileName =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;

      /* ---------------------------------------------------
         STORAGE PATH
      --------------------------------------------------- */

      uploadedStoragePath =
        `lessons/${lessonId}/${uniqueFileName}`;

      /* ---------------------------------------------------
         READ FILE
      --------------------------------------------------- */

      const fileArrayBuffer =
        await file.arrayBuffer();

      /* ---------------------------------------------------
         SUPABASE UPLOAD URL
      --------------------------------------------------- */

      const uploadUrl =
        `${SUPABASE_URL}` +
        `/storage/v1/object/` +
        `${VIDEO_BUCKET}/` +
        `${uploadedStoragePath}`;

      /* ---------------------------------------------------
         UPLOAD TO SUPABASE
      --------------------------------------------------- */

      const uploadResponse =
        await fetch(
          uploadUrl,
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${SUPABASE_SECRET_KEY}`,

              apikey:
                SUPABASE_SECRET_KEY,

              'Content-Type':
                file.type ||
                'application/octet-stream',

              'x-upsert':
                'false',
            },

            body:
              fileArrayBuffer,
          }
        );

      /* ---------------------------------------------------
         CHECK UPLOAD
      --------------------------------------------------- */

      if (
        !uploadResponse.ok
      ) {
        const uploadError =
          await uploadResponse.text();

        console.error(
          'Supabase video upload error:',
          uploadError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              'Failed to upload video to Supabase Storage.',
            error:
              uploadError,
          },
          { status: 500 }
        );
      }

      /* ---------------------------------------------------
         CREATE PUBLIC URL
      --------------------------------------------------- */

      videoFileUrl =
        getSupabaseStorageUrl(
          uploadedStoragePath
        );

      /*
       * For uploaded videos we also put
       * the storage URL into video_url.
       *
       * This makes viewing easier on the
       * admin side.
       */

      videoUrl =
        videoFileUrl;
    }

    /* =====================================================
       DETERMINE NEXT ORDER NUMBER
    ===================================================== */

    const orderResult =
      await pool.query(
        `
          SELECT
            COALESCE(
              MAX(order_number),
              0
            ) + 1 AS next_order
          FROM lms_lesson_videos
          WHERE lesson_id = $1
        `,
        [lessonId]
      );

    const orderNumber =
      Number(
        orderResult.rows[0]
          ?.next_order || 1
      );

    /* =====================================================
       INSERT VIDEO
    ===================================================== */

    try {
      const result =
        await pool.query(
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
            title,
            description || null,
            videoUrl,
            thumbnailUrl,
            durationSeconds,
            orderNumber,
            status,
            videoFileName,
            videoFileUrl,
            sourceType,
          ]
        );

      /* ===================================================
         SUCCESS
      =================================================== */

      return NextResponse.json(
        {
          success: true,
          message:
            'Video created successfully.',
          video:
            result.rows[0],
        },
        { status: 201 }
      );

    } catch (databaseError: any) {

      console.error(
        'LMS video database insert error:',
        databaseError
      );

      /* ---------------------------------------------------
         CLEAN UP SUPABASE FILE
         IF DATABASE INSERT FAILS
      --------------------------------------------------- */

      if (
        uploadedStoragePath
      ) {
        await deleteSupabaseFile(
          uploadedStoragePath
        );
      }

      throw databaseError;
    }

  } catch (error: any) {

    console.error(
      'LMS videos POST error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create video.',
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
