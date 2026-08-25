import { NextResponse } from 'next/server';
import pool from '@/lib/db';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   DELETE DOCUMENT
========================================================= */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const documentId = Number(id);

    if (
      !Number.isInteger(documentId) ||
      documentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid document ID.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        UPDATE lms_lesson_documents
        SET
          status = 'deleted',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `,
      [documentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Document not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully.',
    });

  } catch (error: any) {
    console.error(
      'LMS document DELETE error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete document.',
        error: error?.message,
        code: error?.code,
      },
      { status: 500 }
    );
  }
}