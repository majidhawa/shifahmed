import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

/* =========================================================
   GET LEARNING OBJECTIVES

   GET /api/lms/learning-objectives?lesson_id=1
========================================================= */

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const lessonIdValue =
      searchParams.get('lesson_id');

    /* =====================================================
       VALIDATE LESSON ID
    ===================================================== */

    if (!lessonIdValue) {
      return NextResponse.json(
        {
          success: false,
          message: 'lesson_id is required.',
        },
        { status: 400 }
      );
    }

    const lessonId =
      Number(lessonIdValue);

    if (
      !Number.isInteger(lessonId) ||
      lessonId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid lesson_id.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       LOAD OBJECTIVES
    ===================================================== */

    const result =
      await pool.query(
        `
          SELECT
            id,
            lesson_id,
            objective,
            order_number,
            status,
            created_at,
            updated_at
          FROM lms_learning_objectives
          WHERE lesson_id = $1
          ORDER BY
            order_number ASC,
            id ASC
        `,
        [lessonId]
      );

    return NextResponse.json({
      success: true,
      objectives: result.rows,
    });

  } catch (error: any) {
    console.error(
      'GET learning objectives error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to load learning objectives.',
        error:
          error?.message || null,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE LEARNING OBJECTIVE

   POST /api/lms/learning-objectives

   Body:

   {
     "lesson_id": 1,
     "objective": "Explain effective patient communication"
   }
========================================================= */

export async function POST(request: Request) {
  try {
    const body =
      await request.json();

    const lessonId =
      Number(body?.lesson_id);

    const objective =
      String(
        body?.objective || ''
      ).trim();

    const status =
      String(
        body?.status || 'active'
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
       VALIDATE OBJECTIVE
    ===================================================== */

    if (!objective) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Learning objective is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE STATUS
    ===================================================== */

    const allowedStatuses = [
      'draft',
      'active',
      'closed',
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid status. Use draft, active or closed.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK LESSON EXISTS
    ===================================================== */

    const lessonResult =
      await pool.query(
        `
          SELECT id
          FROM lms_lessons
          WHERE id = $1
          LIMIT 1
        `,
        [lessonId]
      );

    if (
      lessonResult.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lesson not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       GET NEXT ORDER NUMBER
    ===================================================== */

    const orderResult =
      await pool.query(
        `
          SELECT
            COALESCE(
              MAX(order_number),
              0
            ) + 1 AS next_order
          FROM lms_learning_objectives
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
       CREATE OBJECTIVE
    ===================================================== */

    const result =
      await pool.query(
        `
          INSERT INTO lms_learning_objectives
          (
            lesson_id,
            objective,
            order_number,
            status
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4
          )
          RETURNING
            id,
            lesson_id,
            objective,
            order_number,
            status,
            created_at,
            updated_at
        `,
        [
          lessonId,
          objective,
          orderNumber,
          status,
        ]
      );

    return NextResponse.json(
      {
        success: true,
        message:
          'Learning objective created successfully.',
        objective:
          result.rows[0],
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error(
      'POST learning objective error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to create learning objective.',
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
   UPDATE LEARNING OBJECTIVE

   PUT /api/lms/learning-objectives

   Body:

   {
     "id": 1,
     "objective": "Updated objective",
     "status": "active"
   }
========================================================= */

export async function PUT(request: Request) {
  try {
    const body =
      await request.json();

    const objectiveId =
      Number(body?.id);

    const objective =
      String(
        body?.objective || ''
      ).trim();

    const status =
      String(
        body?.status || 'active'
      ).trim();

    /* =====================================================
       VALIDATE ID
    ===================================================== */

    if (
      !Number.isInteger(
        objectiveId
      ) ||
      objectiveId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid objective id is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE OBJECTIVE
    ===================================================== */

    if (!objective) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Learning objective is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDATE STATUS
    ===================================================== */

    const allowedStatuses = [
      'draft',
      'active',
      'closed',
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid status.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK OBJECTIVE EXISTS
    ===================================================== */

    const existing =
      await pool.query(
        `
          SELECT id
          FROM lms_learning_objectives
          WHERE id = $1
          LIMIT 1
        `,
        [objectiveId]
      );

    if (
      existing.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Learning objective not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       UPDATE
    ===================================================== */

    const result =
      await pool.query(
        `
          UPDATE lms_learning_objectives
          SET
            objective = $1,
            status = $2,
            updated_at = NOW()
          WHERE id = $3
          RETURNING
            id,
            lesson_id,
            objective,
            order_number,
            status,
            created_at,
            updated_at
        `,
        [
          objective,
          status,
          objectiveId,
        ]
      );

    return NextResponse.json({
      success: true,
      message:
        'Learning objective updated successfully.',
      objective:
        result.rows[0],
    });

  } catch (error: any) {
    console.error(
      'PUT learning objective error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to update learning objective.',
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
   DELETE LEARNING OBJECTIVE

   DELETE /api/lms/learning-objectives?id=1
========================================================= */

export async function DELETE(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const idValue =
      searchParams.get('id');

    const objectiveId =
      Number(idValue);

    /* =====================================================
       VALIDATE ID
    ===================================================== */

    if (
      !Number.isInteger(
        objectiveId
      ) ||
      objectiveId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Valid objective id is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GET OBJECTIVE
    ===================================================== */

    const existing =
      await pool.query(
        `
          SELECT
            id,
            lesson_id
          FROM lms_learning_objectives
          WHERE id = $1
          LIMIT 1
        `,
        [objectiveId]
      );

    if (
      existing.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Learning objective not found.',
        },
        { status: 404 }
      );
    }

    const lessonId =
      existing.rows[0].lesson_id;

    /* =====================================================
       DELETE
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
    ===================================================== */

    const remaining =
      await pool.query(
        `
          SELECT id
          FROM lms_learning_objectives
          WHERE lesson_id = $1
          ORDER BY
            order_number ASC,
            id ASC
        `,
        [lessonId]
      );

    /* =====================================================
       UPDATE ORDER NUMBERS
    ===================================================== */

    for (
      let index = 0;
      index < remaining.rows.length;
      index++
    ) {
      await pool.query(
        `
          UPDATE lms_learning_objectives
          SET
            order_number = $1,
            updated_at = NOW()
          WHERE id = $2
        `,
        [
          index + 1,
          remaining.rows[index].id,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Learning objective deleted successfully.',
    });

  } catch (error: any) {
    console.error(
      'DELETE learning objective error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to delete learning objective.',
        error:
          error?.message || null,
        code:
          error?.code || null,
      },
      { status: 500 }
    );
  }
}