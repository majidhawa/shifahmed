import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL =
  process.env.SUPABASE_URL?.trim();

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY?.trim();

const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET?.trim() ||
  'lms-documents';

/* =========================================================
   VALIDATE CONFIGURATION
========================================================= */

if (!SUPABASE_URL) {
  throw new Error(
    'SUPABASE_URL is missing from environment variables.'
  );
}

if (!SUPABASE_SECRET_KEY) {
  throw new Error(
    'SUPABASE_SECRET_KEY is missing from environment variables.'
  );
}

/* =========================================================
   SUPABASE CLIENT
========================================================= */

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_FILE_SIZE =
  20 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.txt',
  '.html',
  '.rtf',
  '.odt',
];

/* =========================================================
   POST

   Upload document to Supabase Storage.

   IMPORTANT:
   This endpoint ONLY uploads the physical file.

   It does NOT create the Neon database record.

   The database record is created separately by:

   /api/lecturer/lesson-documents
========================================================= */

export async function POST(
  request: Request
) {
  let uploadedStoragePath:
    | string
    | null = null;

  try {
    /* =====================================================
       READ FORM DATA
    ===================================================== */

    const formData =
      await request.formData();

    const file =
      formData.get('file');

    const lessonIdValue =
      formData.get('lesson_id');

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
            'Valid lesson_id is required.',
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
            'Please select a document to upload.',
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
            'The selected document is empty.',
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
            'Document size cannot exceed 20 MB.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       ORIGINAL FILE NAME
    ===================================================== */

    const originalFileName =
      file.name ||
      'document';

    /* =====================================================
       VALIDATE EXTENSION
    ===================================================== */

    const lowerFileName =
      originalFileName.toLowerCase();

    const extension =
      lowerFileName.includes('.')
        ? lowerFileName.substring(
            lowerFileName.lastIndexOf('.')
          )
        : '';

    if (
      !ALLOWED_EXTENSIONS.includes(
        extension
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unsupported document type. Please upload a PDF, Word, PowerPoint, TXT, HTML, RTF or ODT document.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       DETERMINE MIME TYPE
    ===================================================== */

    const mimeType =
      file.type ||
      'application/octet-stream';

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
        )
        .replace(
          /^-|-$/g,
          ''
        );

    /* =====================================================
       UNIQUE FILE NAME
    ===================================================== */

    const uniqueFileName =
      `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

    /* =====================================================
       STORAGE PATH

       lms-documents
       └── lessons
           └── {lessonId}
               └── file
    ===================================================== */

    uploadedStoragePath =
      `lessons/${lessonId}/${uniqueFileName}`;

    /* =====================================================
       CONVERT FILE

       Uint8Array is used because it works reliably
       with Supabase Storage from a Node.js route.
    ===================================================== */

    const arrayBuffer =
      await file.arrayBuffer();

    const fileBuffer =
      new Uint8Array(
        arrayBuffer
      );

    /* =====================================================
       UPLOAD TO SUPABASE
    ===================================================== */

    const {
      data: uploadData,
      error: uploadError,
    } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(
          uploadedStoragePath,
          fileBuffer,
          {
            contentType:
              mimeType,

            cacheControl:
              '3600',

            upsert:
              false,
          }
        );

    /* =====================================================
       CHECK SUPABASE ERROR
    ===================================================== */

    if (uploadError) {
      console.error(
        'SUPABASE DOCUMENT UPLOAD ERROR:',
        uploadError
      );

      uploadedStoragePath =
        null;

      return NextResponse.json(
        {
          success: false,
          message:
            uploadError.message ||
            'Failed to upload document to Supabase Storage.',
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
       VALIDATE URL
    ===================================================== */

    if (!fileUrl) {
      console.error(
        'SUPABASE PUBLIC URL GENERATION FAILED'
      );

      /* -----------------------------------------------
         CLEAN UP UPLOADED FILE
      ----------------------------------------------- */

      if (
        uploadedStoragePath
      ) {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([
            uploadedStoragePath,
          ]);
      }

      uploadedStoragePath =
        null;

      return NextResponse.json(
        {
          success: false,
          message:
            'Failed to generate document URL.',
        },
        { status: 500 }
      );
    }

    /* =====================================================
       SUCCESS

       IMPORTANT:
       Do NOT insert into Neon here.

       The frontend will now send the returned
       information to:

       /api/lecturer/lesson-documents
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          'Document uploaded successfully.',

        file: {
          file_name:
            originalFileName,

          file_url:
            fileUrl,

          file_size:
            file.size,

          mime_type:
            mimeType,

          path:
            uploadedStoragePath,

          bucket:
            STORAGE_BUCKET,
        },

        storage: {
          bucket:
            STORAGE_BUCKET,

          path:
            uploadedStoragePath,

          fullPath:
            uploadData?.path ||
            uploadedStoragePath,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(
      'LESSON DOCUMENT UPLOAD ERROR:',
      error
    );

    /* =====================================================
       CLEAN UP IF SOMETHING FAILED AFTER UPLOAD
    ===================================================== */

    if (
      uploadedStoragePath
    ) {
      try {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([
            uploadedStoragePath,
          ]);
      } catch (cleanupError) {
        console.error(
          'SUPABASE CLEANUP ERROR:',
          cleanupError
        );
      }
    }

    /* =====================================================
       ERROR RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : 'Failed to upload document.',
      },
      { status: 500 }
    );
  }
}