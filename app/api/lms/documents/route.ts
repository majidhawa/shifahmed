import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/* =========================================================
   SUPABASE STORAGE CONFIGURATION
========================================================= */

const SUPABASE_URL =
  process.env.SUPABASE_URL?.trim();

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY?.trim();

const STORAGE_BUCKET = 'lms-documents';

/* =========================================================
   SUPABASE CLIENT
========================================================= */

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error(
    'Supabase environment variables are missing.'
  );
}

const supabase =
  SUPABASE_URL && SUPABASE_SECRET_KEY
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SECRET_KEY
      )
    : null;

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_FILE_SIZE =
  20 * 1024 * 1024; // 20 MB

/* =========================================================
   GET DOCUMENTS

   GET /api/lms/documents?lesson_id=1
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

    /* =====================================================
       VALIDATE LESSON ID EXISTS
    ===================================================== */

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
       CONVERT LESSON ID
    ===================================================== */

    const lessonId =
      Number(lessonIdValue);

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
            'Invalid lesson_id.',
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
       GET DOCUMENTS
    ===================================================== */

    const result =
      await pool.query(
        `
          SELECT
            id,
            lesson_id,
            title,
            description,
            file_name,
            file_url,
            file_size,
            mime_type,
            status,
            created_at,
            updated_at
          FROM lms_lesson_documents
          WHERE lesson_id = $1
            AND status = 'active'
          ORDER BY
            created_at ASC,
            id ASC
        `,
        [lessonId]
      );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json({
      success: true,
      documents: result.rows,
    });

  } catch (error: any) {

    console.error(
      'LMS documents GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load documents.',
        error:
          error?.message || null,
        code:
          error?.code || null,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE DOCUMENT

   POST /api/lms/documents

   FormData:

   lesson_id
   title
   description
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

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Supabase storage is not configured.',
        },
        { status: 500 }
      );
    }

    /* =====================================================
       READ FORM DATA
    ===================================================== */

    const formData =
      await request.formData();

    const lessonIdValue =
      formData.get('lesson_id');

    const titleValue =
      formData.get('title');

    const descriptionValue =
      formData.get('description');

    const file =
      formData.get('file');

    /* =====================================================
       CONVERT VALUES
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
            'Document title is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE FILE
    ===================================================== */

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please upload a PDF file.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE PDF
    ===================================================== */

    const originalFileName =
      file.name ||
      'document.pdf';

    const extension =
      originalFileName
        .split('.')
        .pop()
        ?.toLowerCase();

    const isPdf =
      file.type ===
        'application/pdf' ||
      extension === 'pdf';

    if (!isPdf) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Only PDF files are allowed.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE FILE SIZE
    ===================================================== */

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The selected PDF file is empty.',
        },
        { status: 400 }
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'PDF file must not exceed 20 MB.',
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
       CLEAN FILE NAME
    ===================================================== */

    const safeFileName =
      originalFileName
        .replace(
          /[^a-zA-Z0-9._-]/g,
          '-'
        )
        .replace(
          /-+/g,
          '-'
        );

    /* =====================================================
       CREATE UNIQUE FILE NAME
    ===================================================== */

    const uniqueFileName =
      `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

    /* =====================================================
       STORAGE PATH

       lms-documents
       └── lessons
           └── {lessonId}
               └── file.pdf
    ===================================================== */

    uploadedStoragePath =
      `lessons/${lessonId}/${uniqueFileName}`;

    /* =====================================================
       CONVERT FILE

       Uint8Array works reliably with Supabase upload.
    ===================================================== */

    const arrayBuffer =
      await file.arrayBuffer();

    const fileBuffer =
      new Uint8Array(
        arrayBuffer
      );

    /* =====================================================
       UPLOAD TO SUPABASE STORAGE
    ===================================================== */

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(
          uploadedStoragePath,
          fileBuffer,
          {
            contentType:
              'application/pdf',

            cacheControl:
              '3600',

            upsert:
              false,
          }
        );

    /* =====================================================
       CHECK UPLOAD ERROR
    ===================================================== */

    if (uploadError) {

      console.error(
        'Supabase PDF upload error:',
        uploadError
      );

      uploadedStoragePath =
        null;

      return NextResponse.json(
        {
          success: false,
          message:
            'Failed to upload PDF to Supabase Storage.',
          error:
            uploadError.message,
        },
        { status: 500 }
      );
    }

    /* =====================================================
       GET PUBLIC URL
    ===================================================== */

    const {
      data: publicUrlData,
    } =
      supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(
          uploadedStoragePath
        );

    const fileUrl =
      publicUrlData?.publicUrl;

    /* =====================================================
       VALIDATE PUBLIC URL
    ===================================================== */

    if (!fileUrl) {

      console.error(
        'Failed to generate Supabase public URL.'
      );

      /* -----------------------------------------------
         DELETE UPLOADED FILE
      ----------------------------------------------- */

      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([
          uploadedStoragePath,
        ]);

      uploadedStoragePath =
        null;

      return NextResponse.json(
        {
          success: false,
          message:
            'Failed to generate PDF URL.',
        },
        { status: 500 }
      );
    }

    /* =====================================================
       INSERT DATABASE RECORD
    ===================================================== */

    let result;

    try {

      result =
        await pool.query(
          `
            INSERT INTO lms_lesson_documents
            (
              lesson_id,
              title,
              description,
              file_name,
              file_url,
              file_size,
              mime_type,
              status
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
              $8
            )
            RETURNING
              id,
              lesson_id,
              title,
              description,
              file_name,
              file_url,
              file_size,
              mime_type,
              status,
              created_at,
              updated_at
          `,
          [
            lessonId,
            title,
            description ||
              null,
            originalFileName,
            fileUrl,
            file.size,
            'application/pdf',
            'active',
          ]
        );

    } catch (
      databaseError: any
    ) {

      console.error(
        'LMS document database insert error:',
        databaseError
      );

      /* -----------------------------------------------
         DATABASE FAILED

         Remove file from Supabase so we don't
         leave orphaned files.
      ----------------------------------------------- */

      if (
        uploadedStoragePath
      ) {

        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([
            uploadedStoragePath,
          ]);

        uploadedStoragePath =
          null;
      }

      throw databaseError;
    }

    /* =====================================================
       RETURN SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          'Document uploaded successfully.',
        document:
          result.rows[0],
      },
      { status: 201 }
    );

  } catch (error: any) {

    console.error(
      'LMS documents POST error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to upload document.',
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