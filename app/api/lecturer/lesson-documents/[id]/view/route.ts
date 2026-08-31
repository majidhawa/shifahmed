
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import pool from '@/lib/db';

export const runtime = 'nodejs';

/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL =
  process.env.SUPABASE_URL?.trim();

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY?.trim();

/*
 * IMPORTANT:
 * This must match the bucket used by the working
 * Admin document upload/view system.
 */
const STORAGE_BUCKET = 'lms-documents';

/* =========================================================
   SUPABASE CLIENT
========================================================= */

const supabase =
  SUPABASE_URL && SUPABASE_SECRET_KEY
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SECRET_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null;

/* =========================================================
   GET DOCUMENT

   GET /api/lecturer/lesson-documents/[id]/view
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
    /* =====================================================
       CHECK SUPABASE CONFIGURATION
    ===================================================== */

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Supabase Storage is not configured.',
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       GET DOCUMENT ID
    ===================================================== */

    const { id } =
      await context.params;

    const documentId =
      Number(id);

    if (
      !Number.isInteger(documentId) ||
      documentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid document ID.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       GET DOCUMENT FROM DATABASE
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
          WHERE id = $1
          LIMIT 1
        `,
        [documentId]
      );

    /* =====================================================
       DOCUMENT NOT FOUND
    ===================================================== */

    if (
      result.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Document not found.',
        },
        {
          status: 404,
        }
      );
    }

    const document =
      result.rows[0];

    /* =====================================================
       CHECK DOCUMENT STATUS
    ===================================================== */

    if (
      document.status !== 'active'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This document is no longer available.',
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       GET STORAGE PATH
    ===================================================== */

    let storagePath:
      | string
      | null = null;

    /*
     * Our uploaded files use this structure:
     *
     * lms-documents/
     * └── lessons/
     *     └── {lessonId}/
     *         └── unique-file-name.pdf
     */

    /* =====================================================
       FIRST OPTION:
       EXTRACT PATH FROM FILE URL
    ===================================================== */

    if (
      document.file_url
    ) {
      try {
        const parsedUrl =
          new URL(
            document.file_url
          );

        const pathname =
          parsedUrl.pathname;

        /*
         * Expected:
         *
         * /storage/v1/object/public/
         * lms-documents/
         * lessons/1/file.pdf
         */

        const marker =
          `/storage/v1/object/public/${STORAGE_BUCKET}/`;

        const index =
          pathname.indexOf(
            marker
          );

        if (
          index !== -1
        ) {
          storagePath =
            decodeURIComponent(
              pathname.substring(
                index +
                  marker.length
              )
            );
        }
      } catch (error) {
        console.error(
          'LECTURER DOCUMENT URL PARSE ERROR:',
          error
        );
      }
    }

    /* =====================================================
       FALLBACK PATH
    ===================================================== */

    /*
     * IMPORTANT:
     *
     * Do not reconstruct the path unless necessary.
     * The file_url is preferred because uploaded files
     * contain a unique filename.
     */

    if (
      !storagePath &&
      document.file_name
    ) {
      storagePath =
        `lessons/${document.lesson_id}/${document.file_name}`;
    }

    /* =====================================================
       VALIDATE STORAGE PATH
    ===================================================== */

    if (!storagePath) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Document storage path could not be determined.',
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       LOG STORAGE INFORMATION
    ===================================================== */

    console.log(
      'LECTURER DOCUMENT VIEW:',
      {
        documentId,
        lessonId:
          document.lesson_id,
        bucket:
          STORAGE_BUCKET,
        storagePath,
      }
    );

    /* =====================================================
       DOWNLOAD FROM SUPABASE
    ===================================================== */

    const {
      data: fileData,
      error: downloadError,
    } =
      await supabase.storage
        .from(
          STORAGE_BUCKET
        )
        .download(
          storagePath
        );

    /* =====================================================
       HANDLE DOWNLOAD ERROR
    ===================================================== */

    if (
      downloadError ||
      !fileData
    ) {
      console.error(
        'LECTURER SUPABASE DOCUMENT DOWNLOAD ERROR:',
        downloadError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Document could not be retrieved from Supabase Storage.',
          bucket:
            STORAGE_BUCKET,
          storagePath,
          error:
            downloadError?.message ||
            'Unknown Storage error.',
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       DETERMINE MIME TYPE
    ===================================================== */

    const contentType =
      document.mime_type ||
      'application/pdf';

    /* =====================================================
       RETURN DOCUMENT TO BROWSER
    ===================================================== */

    return new NextResponse(
      fileData,
      {
        status: 200,

        headers: {
          'Content-Type':
            contentType,

          'Content-Disposition':
            `inline; filename="${encodeURIComponent(
              document.file_name ||
                'document'
            )}"`,

          'Cache-Control':
            'private, max-age=3600',
        },
      }
    );

  } catch (error: unknown) {
    console.error(
      'LECTURER DOCUMENT VIEW ERROR:',
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to open document.';

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      }
    );
  }
}

