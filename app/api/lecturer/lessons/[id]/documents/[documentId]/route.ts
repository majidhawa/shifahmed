import { NextResponse } from 'next/server';

import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

/* =========================================================
   VERIFY DOCUMENT ACCESS
========================================================= */

async function verifyDocumentAccess(
  lessonId: number,
  documentId: number,
  lecturerId: number
) {
  const result = await pool.query(
    `
      SELECT
        d.id,
        d.lesson_id,
        d.title,
        d.description,
        d.file_name,
        d.file_url,
        d.file_size,
        d.mime_type,
        d.status

      FROM lms_lesson_documents d

      INNER JOIN lms_lessons l
        ON l.id = d.lesson_id

      INNER JOIN lms_topics t
        ON t.id = l.topic_id

      INNER JOIN lms_units u
        ON u.id = t.unit_id

      INNER JOIN lms_lecturer_programs lp
        ON lp.program_id = u.program_id

      WHERE d.id = $1
        AND d.lesson_id = $2
        AND lp.lecturer_id = $3

      LIMIT 1
    `,
    [documentId, lessonId, lecturerId]
  );

  return result;
}

/* =========================================================
   GET SINGLE DOCUMENT
========================================================= */

export async function GET(
  request: Request,
  context: {
    params: {
      id: string;
      documentId: string;
    };
  }
) {
  try {
    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const lessonId = Number(context.params.id);
    const documentId = Number(
      context.params.documentId
    );

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0 ||
      !Number.isInteger(documentId) ||
      documentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid lesson and document ID are required.',
        },
        { status: 400 }
      );
    }

    const result =
      await verifyDocumentAccess(
        lessonId,
        documentId,
        lecturer.id
      );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Material not found or you are not authorized to access it.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        document: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'GET DOCUMENT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load material.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH DOCUMENT
========================================================= */

export async function PATCH(
  request: Request,
  context: {
    params: {
      id: string;
      documentId: string;
    };
  }
) {
  try {
    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const lessonId = Number(context.params.id);
    const documentId = Number(
      context.params.documentId
    );

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0 ||
      !Number.isInteger(documentId) ||
      documentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid lesson and document ID are required.',
        },
        { status: 400 }
      );
    }

    const existing =
      await verifyDocumentAccess(
        lessonId,
        documentId,
        lecturer.id
      );

    if (existing.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Material not found or you are not authorized to edit it.',
        },
        { status: 404 }
      );
    }

    let body: Record<string, unknown>;

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

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : '';

    const description =
      typeof body.description === 'string'
        ? body.description.trim()
        : '';

    const fileName =
      typeof body.file_name === 'string'
        ? body.file_name.trim()
        : '';

    const fileUrl =
      typeof body.file_url === 'string'
        ? body.file_url.trim()
        : '';

    const mimeType =
      typeof body.mime_type === 'string' &&
      body.mime_type.trim()
        ? body.mime_type.trim()
        : 'application/pdf';

    const fileSize =
      body.file_size === null ||
      body.file_size === undefined ||
      body.file_size === ''
        ? null
        : Number(body.file_size);

    const status =
      typeof body.status === 'string'
        ? body.status.trim().toLowerCase()
        : 'active';

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Material title is required.',
        },
        { status: 400 }
      );
    }

    if (!fileName) {
      return NextResponse.json(
        {
          success: false,
          message: 'File name is required.',
        },
        { status: 400 }
      );
    }

    if (!fileUrl) {
      return NextResponse.json(
        {
          success: false,
          message: 'File URL is required.',
        },
        { status: 400 }
      );
    }

    if (
      fileSize !== null &&
      (!Number.isInteger(fileSize) || fileSize < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size must be valid.',
        },
        { status: 400 }
      );
    }

    if (
      status !== 'active' &&
      status !== 'inactive'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Status must be either active or inactive.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        UPDATE lms_lesson_documents

        SET
          title = $1,
          description = NULLIF($2, ''),
          file_name = $3,
          file_url = $4,
          file_size = $5,
          mime_type = $6,
          status = $7,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $8
          AND lesson_id = $9

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
        title,
        description,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        status,
        documentId,
        lessonId,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Material updated successfully.',
        document: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'UPDATE DOCUMENT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update material.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE DOCUMENT
========================================================= */

export async function DELETE(
  request: Request,
  context: {
    params: {
      id: string;
      documentId: string;
    };
  }
) {
  try {
    const lecturer = await requireLecturer();

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const lessonId = Number(context.params.id);
    const documentId = Number(
      context.params.documentId
    );

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0 ||
      !Number.isInteger(documentId) ||
      documentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'A valid lesson and document ID are required.',
        },
        { status: 400 }
      );
    }

    const access =
      await verifyDocumentAccess(
        lessonId,
        documentId,
        lecturer.id
      );

    if (access.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Material not found or you are not authorized to delete it.',
        },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `
        DELETE FROM lms_lesson_documents

        WHERE id = $1
          AND lesson_id = $2

        RETURNING
          id,
          lesson_id,
          title,
          file_name
      `,
      [documentId, lessonId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Material not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Material deleted successfully.',
        document: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'DELETE DOCUMENT ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to delete material.',
      },
      { status: 500 }
    );
  }
}