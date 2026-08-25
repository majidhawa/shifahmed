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

const STORAGE_BUCKET =
  'lms-documents';

/* =========================================================
   SUPABASE CLIENT
========================================================= */

const supabase =
  SUPABASE_URL &&
  SUPABASE_SECRET_KEY
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SECRET_KEY
      )
    : null;

/* =========================================================
   GET DOCUMENT

   GET /api/lms/documents/[id]/view
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
       CHECK SUPABASE
    ===================================================== */

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Supabase is not configured.',
        },
        { status: 500 }
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
      !Number.isInteger(
        documentId
      ) ||
      documentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid document ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GET DOCUMENT FROM NEON
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

    if (
      result.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Document not found.',
        },
        { status: 404 }
      );
    }

    const document =
      result.rows[0];

    /* =====================================================
       CHECK STATUS
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
        { status: 404 }
      );
    }

    /* =====================================================
       GET STORAGE PATH
    ===================================================== */

    let storagePath: string | null =
      null;

    /*
      Expected URL:

      https://PROJECT.supabase.co/storage/v1/object/public/
      lms-documents/lessons/1/file.pdf
    */

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

        const marker =
          `/storage/v1/object/public/${STORAGE_BUCKET}/`;

        const index =
          pathname.indexOf(
            marker
          );

        if (index !== -1) {

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
          'Could not parse document URL:',
          error
        );
      }
    }

    /* =====================================================
       FALLBACK STORAGE PATH
    ===================================================== */

    /*
      If parsing the URL fails, reconstruct the
      expected path from the database fields.

      Files uploaded by our API are stored as:

      lessons/{lesson_id}/{file_name}
    */

    if (!storagePath) {

      storagePath =
        `lessons/${document.lesson_id}/${document.file_name}`;
    }

    console.log(
      'Opening LMS document:',
      {
        documentId,
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
       HANDLE STORAGE ERROR
    ===================================================== */

    if (
      downloadError ||
      !fileData
    ) {

      console.error(
        'Supabase document download error:',
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
            null,
        },
        { status: 404 }
      );
    }

    /* =====================================================
       DETERMINE CONTENT TYPE
    ===================================================== */

    const contentType =
      document.mime_type ||
      'application/pdf';

    /* =====================================================
       RETURN FILE
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
              document.file_name
            )}"`,

          'Cache-Control':
            'private, max-age=3600',
        },
      }
    );

  } catch (error: any) {

    console.error(
      'LMS document view error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to open document.',
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