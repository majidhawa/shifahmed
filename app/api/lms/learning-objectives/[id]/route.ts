import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

/* =========================================================
   DELETE LEARNING OBJECTIVE

   DELETE /api/lms/learning-objectives/[id]
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
    /* =====================================================
       GET OBJECTIVE ID
    ===================================================== */

    const { id } = await context.params;

    const objectiveId = Number(id);

    /* =====================================================
       VALIDATE ID
    ===================================================== */

    if (
      !Number.isInteger(objectiveId) ||
      objectiveId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid learning objective ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK OBJECTIVE EXISTS
    ===================================================== */

    const existingResult = await pool.query(
      `
        SELECT
          id,
          lesson_id,
          objective,
          order_number
        FROM lms_learning_objectives
        WHERE id = $1
        LIMIT 1
      `,
      [objectiveId]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Learning objective not found.',
        },
        { status: 404 }
      );
    }

    const existingObjective =
      existingResult.rows[0];

    /* =====================================================
       DELETE OBJECTIVE
    ===================================================== */

    await pool.query(
      `
        DELETE FROM lms_learning_objectives
        WHERE id = $1
      `,
      [objectiveId]
    );

    /* =====================================================
       REORDER REMAINING OBJECTIVES

       Example:

       Before:
       1. Objective A
       2. Objective B
       3. Objective C

       Delete Objective B

       After:
       1. Objective A
       2. Objective C

       This keeps the order numbers clean.
    ===================================================== */

    await pool.query(
      `
        WITH ordered_objectives AS (
          SELECT
            id,
            ROW_NUMBER() OVER (
              ORDER BY
                order_number ASC,
                created_at ASC,
                id ASC
            ) AS new_order
          FROM lms_learning_objectives
          WHERE lesson_id = $1
        )
        UPDATE lms_learning_objectives AS lo
        SET
          order_number = oo.new_order,
          updated_at = NOW()
        FROM ordered_objectives AS oo
        WHERE lo.id = oo.id
      `,
      [existingObjective.lesson_id]
    );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json({
      success: true,
      message: 'Learning objective deleted successfully.',
      deletedObjective: existingObjective,
    });

  } catch (error: any) {
    console.error(
      'DELETE /api/lms/learning-objectives/[id] error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete learning objective.',
        error:
          error?.message ||
          'Unknown database error.',
        code:
          error?.code ||
          null,
      },
      { status: 500 }
    );
  }
}