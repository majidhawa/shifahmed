import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

/* =========================================================
   TYPES
========================================================= */

type AnnouncementStatus =
  | 'draft'
  | 'published'
  | 'archived';

type AnnouncementPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

type AnnouncementAudience =
  | 'students'
  | 'lecturers'
  | 'parents'
  | 'all';

/* =========================================================
   HELPERS
========================================================= */

function cleanString(value: unknown): string {
  return String(value ?? '').trim();
}

function nullableNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function isValidStatus(
  value: unknown
): value is AnnouncementStatus {
  return (
    value === 'draft' ||
    value === 'published' ||
    value === 'archived'
  );
}

function isValidPriority(
  value: unknown
): value is AnnouncementPriority {
  return (
    value === 'low' ||
    value === 'normal' ||
    value === 'high' ||
    value === 'urgent'
  );
}

function isValidAudience(
  value: unknown
): value is AnnouncementAudience {
  return (
    value === 'students' ||
    value === 'lecturers' ||
    value === 'parents' ||
    value === 'all'
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred.';
}

/* =========================================================
   GET
   /api/admin/announcements

   Returns:
   - All announcements
   - Programs
   - Units
   - Statistics
========================================================= */

export async function GET(request: Request) {
  try {
    /* =====================================================
       ADMIN AUTHENTICATION
    ===================================================== */

    const admin = requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       QUERY PARAMETERS
    ===================================================== */

    const { searchParams } =
      new URL(request.url);

    const search = cleanString(
      searchParams.get('search')
    );

    const status = cleanString(
      searchParams.get('status')
    );

    const audience = cleanString(
      searchParams.get('audience')
    );

    const priority = cleanString(
      searchParams.get('priority')
    );

    const programId = nullableNumber(
      searchParams.get('program_id')
    );

    /* =====================================================
       BUILD FILTERS
    ===================================================== */

    const conditions: string[] = [];
    const values: unknown[] = [];

    let parameterIndex = 1;

    if (search) {
      conditions.push(`
        (
          a.title ILIKE $${parameterIndex}
          OR a.message ILIKE $${parameterIndex}
          OR COALESCE(creator.name, '') ILIKE $${parameterIndex}
          OR COALESCE(creator.email, '') ILIKE $${parameterIndex}
        )
      `);

      values.push(`%${search}%`);
      parameterIndex++;
    }

    if (status) {
      if (!isValidStatus(status)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid announcement status.',
          },
          { status: 400 }
        );
      }

      conditions.push(
        `a.status = $${parameterIndex}`
      );

      values.push(status);
      parameterIndex++;
    }

    if (audience) {
      if (!isValidAudience(audience)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid announcement audience.',
          },
          { status: 400 }
        );
      }

      conditions.push(
        `a.audience = $${parameterIndex}`
      );

      values.push(audience);
      parameterIndex++;
    }

    if (priority) {
      if (!isValidPriority(priority)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid announcement priority.',
          },
          { status: 400 }
        );
      }

      conditions.push(
        `a.priority = $${parameterIndex}`
      );

      values.push(priority);
      parameterIndex++;
    }

    if (programId !== null) {
      conditions.push(
        `a.program_id = $${parameterIndex}`
      );

      values.push(programId);
      parameterIndex++;
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    /* =====================================================
       GET ANNOUNCEMENTS
    ===================================================== */

    const announcementsResult =
      await pool.query(
        `
        SELECT
          a.id,
          a.title,
          a.message,

          a.created_by,
          a.created_by_role,

          a.program_id,
          a.unit_id,

          a.audience,
          a.priority,
          a.status,

          a.publish_at,
          a.expires_at,

          a.is_pinned,

          a.created_at,
          a.updated_at,

          p.name AS program_name,

          u.name AS unit_name,

          creator.name AS creator_name,
          creator.email AS creator_email,

          CASE
            WHEN a.status = 'published'
              AND a.publish_at <= NOW()
              AND (
                a.expires_at IS NULL
                OR a.expires_at > NOW()
              )
            THEN TRUE
            ELSE FALSE
          END AS is_active

        FROM lms_announcements a

        LEFT JOIN lms_programs p
          ON p.id = a.program_id

        LEFT JOIN lms_units u
          ON u.id = a.unit_id

        LEFT JOIN users creator
          ON creator.id = a.created_by

        ${whereClause}

        ORDER BY
          a.is_pinned DESC,
          a.created_at DESC
        `,
        values
      );

    /* =====================================================
       GET PROGRAMS
    ===================================================== */

    const programsResult =
      await pool.query(
        `
        SELECT
          id,
          name
        FROM lms_programs
        ORDER BY name ASC
        `
      );

    /* =====================================================
       GET UNITS
    ===================================================== */

    const unitsResult =
      await pool.query(
        `
        SELECT
          u.id,
          u.name,
          u.program_id,
          p.name AS program_name
        FROM lms_units u
        LEFT JOIN lms_programs p
          ON p.id = u.program_id
        ORDER BY
          p.name ASC,
          u.name ASC
        `
      );

    /* =====================================================
       STATISTICS
    ===================================================== */

    const statisticsResult =
      await pool.query(
        `
        SELECT
          COUNT(*)::int AS total,

          COUNT(*) FILTER (
            WHERE status = 'published'
          )::int AS published,

          COUNT(*) FILTER (
            WHERE status = 'draft'
          )::int AS drafts,

          COUNT(*) FILTER (
            WHERE status = 'archived'
          )::int AS archived,

          COUNT(*) FILTER (
            WHERE priority = 'urgent'
          )::int AS urgent,

          COUNT(*) FILTER (
            WHERE is_pinned = TRUE
          )::int AS pinned,

          COUNT(*) FILTER (
            WHERE audience = 'students'
          )::int AS student_announcements,

          COUNT(*) FILTER (
            WHERE audience = 'lecturers'
          )::int AS lecturer_announcements,

          COUNT(*) FILTER (
            WHERE audience = 'parents'
          )::int AS parent_announcements,

          COUNT(*) FILTER (
            WHERE audience = 'all'
          )::int AS all_announcements

        FROM lms_announcements
        `
      );

    return NextResponse.json({
      success: true,

      announcements:
        announcementsResult.rows,

      programs:
        programsResult.rows,

      units:
        unitsResult.rows,

      statistics:
        statisticsResult.rows[0] || {
          total: 0,
          published: 0,
          drafts: 0,
          archived: 0,
          urgent: 0,
          pinned: 0,
          student_announcements: 0,
          lecturer_announcements: 0,
          parent_announcements: 0,
          all_announcements: 0,
        },
    });
  } catch (error) {
    console.error(
      'GET /api/admin/announcements error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   /api/admin/announcements

   ADMIN CAN CREATE ANY ANNOUNCEMENT
========================================================= */

export async function POST(request: Request) {
  try {
    /* =====================================================
       ADMIN AUTHENTICATION
    ===================================================== */

    const admin = requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       GET ADMIN ID
    ===================================================== */

    const adminId = Number(
      (admin as any)?.id ??
      (admin as any)?.user_id ??
      (admin as any)?.userId
    );

    if (
      !Number.isInteger(adminId) ||
      adminId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unable to determine administrator ID.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       READ BODY
    ===================================================== */

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALUES
    ===================================================== */

    const title = cleanString(body?.title);

    const message = cleanString(
      body?.message
    );

    const audience: AnnouncementAudience =
      isValidAudience(body?.audience)
        ? body.audience
        : 'all';

    const priority: AnnouncementPriority =
      isValidPriority(body?.priority)
        ? body.priority
        : 'normal';

    const status: AnnouncementStatus =
      isValidStatus(body?.status)
        ? body.status
        : 'draft';

    const programId =
      nullableNumber(body?.program_id);

    const unitId =
      nullableNumber(body?.unit_id);

    const publishAt =
      cleanString(body?.publish_at) || null;

    const expiresAt =
      cleanString(body?.expires_at) || null;

    const isPinned =
      Boolean(body?.is_pinned);

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Announcement title is required.',
        },
        { status: 400 }
      );
    }

    if (title.length > 255) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Announcement title cannot exceed 255 characters.',
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Announcement message is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY PROGRAM
    ===================================================== */

    if (programId !== null) {
      const programCheck =
        await pool.query(
          `
          SELECT id
          FROM lms_programs
          WHERE id = $1
          LIMIT 1
          `,
          [programId]
        );

      if (programCheck.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Selected program was not found.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       VERIFY UNIT
    ===================================================== */

    if (unitId !== null) {
      const unitCheck =
        await pool.query(
          `
          SELECT
            id,
            program_id
          FROM lms_units
          WHERE id = $1
          LIMIT 1
          `,
          [unitId]
        );

      if (unitCheck.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Selected unit was not found.',
          },
          { status: 400 }
        );
      }

      if (
        programId !== null &&
        Number(
          unitCheck.rows[0].program_id
        ) !== Number(programId)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'The selected unit does not belong to the selected program.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       INSERT
    ===================================================== */

    const result =
      await pool.query(
        `
        INSERT INTO lms_announcements (
          title,
          message,
          created_by,
          created_by_role,
          program_id,
          unit_id,
          audience,
          priority,
          status,
          publish_at,
          expires_at,
          is_pinned
        )
        VALUES (
          $1,
          $2,
          $3,
          'admin',
          $4,
          $5,
          $6,
          $7,
          $8,
          COALESCE($9::timestamptz, NOW()),
          $10::timestamptz,
          $11
        )
        RETURNING
          id,
          title,
          message,
          created_by,
          created_by_role,
          program_id,
          unit_id,
          audience,
          priority,
          status,
          publish_at,
          expires_at,
          is_pinned,
          created_at,
          updated_at
        `,
        [
          title,
          message,
          adminId,
          programId,
          unitId,
          audience,
          priority,
          status,
          publishAt,
          expiresAt,
          isPinned,
        ]
      );

    return NextResponse.json(
      {
        success: true,
        message:
          'Announcement created successfully.',
        announcement: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'POST /api/admin/announcements error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT
   /api/admin/announcements

   ADMIN CAN EDIT ANY ANNOUNCEMENT
========================================================= */

export async function PUT(request: Request) {
  try {
    const admin = requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body.',
        },
        { status: 400 }
      );
    }

    const id = nullableNumber(body?.id);

    if (id === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Announcement ID is required.',
        },
        { status: 400 }
      );
    }

    const title =
      cleanString(body?.title);

    const message =
      cleanString(body?.message);

    const audience: AnnouncementAudience =
      isValidAudience(body?.audience)
        ? body.audience
        : 'all';

    const priority: AnnouncementPriority =
      isValidPriority(body?.priority)
        ? body.priority
        : 'normal';

    const status: AnnouncementStatus =
      isValidStatus(body?.status)
        ? body.status
        : 'draft';

    const programId =
      nullableNumber(body?.program_id);

    const unitId =
      nullableNumber(body?.unit_id);

    const publishAt =
      cleanString(body?.publish_at) || null;

    const expiresAt =
      cleanString(body?.expires_at) || null;

    const isPinned =
      Boolean(body?.is_pinned);

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Announcement title is required.',
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Announcement message is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY ANNOUNCEMENT EXISTS
    ===================================================== */

    const existing =
      await pool.query(
        `
        SELECT id
        FROM lms_announcements
        WHERE id = $1
        LIMIT 1
        `,
        [id]
      );

    if (existing.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Announcement not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       VERIFY PROGRAM
    ===================================================== */

    if (programId !== null) {
      const programCheck =
        await pool.query(
          `
          SELECT id
          FROM lms_programs
          WHERE id = $1
          LIMIT 1
          `,
          [programId]
        );

      if (programCheck.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Selected program was not found.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       VERIFY UNIT
    ===================================================== */

    if (unitId !== null) {
      const unitCheck =
        await pool.query(
          `
          SELECT
            id,
            program_id
          FROM lms_units
          WHERE id = $1
          LIMIT 1
          `,
          [unitId]
        );

      if (unitCheck.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Selected unit was not found.',
          },
          { status: 400 }
        );
      }

      if (
        programId !== null &&
        Number(
          unitCheck.rows[0].program_id
        ) !== Number(programId)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'The selected unit does not belong to the selected program.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       UPDATE
    ===================================================== */

    const result =
      await pool.query(
        `
        UPDATE lms_announcements
        SET
          title = $1,
          message = $2,
          program_id = $3,
          unit_id = $4,
          audience = $5,
          priority = $6,
          status = $7,
          publish_at =
            COALESCE(
              $8::timestamptz,
              publish_at
            ),
          expires_at =
            $9::timestamptz,
          is_pinned = $10,
          updated_at = NOW()

        WHERE id = $11

        RETURNING
          id,
          title,
          message,
          created_by,
          created_by_role,
          program_id,
          unit_id,
          audience,
          priority,
          status,
          publish_at,
          expires_at,
          is_pinned,
          created_at,
          updated_at
        `,
        [
          title,
          message,
          programId,
          unitId,
          audience,
          priority,
          status,
          publishAt,
          expiresAt,
          isPinned,
          id,
        ]
      );

    return NextResponse.json({
      success: true,
      message:
        'Announcement updated successfully.',
      announcement: result.rows[0],
    });
  } catch (error) {
    console.error(
      'PUT /api/admin/announcements error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
   /api/admin/announcements?id=123

   ADMIN CAN DELETE ANY ANNOUNCEMENT
========================================================= */

export async function DELETE(request: Request) {
  try {
    const admin = requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const id =
      nullableNumber(
        searchParams.get('id')
      );

    if (id === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Announcement ID is required.',
        },
        { status: 400 }
      );
    }

    const result =
      await pool.query(
        `
        DELETE FROM lms_announcements
        WHERE id = $1
        RETURNING id
        `,
        [id]
      );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Announcement not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Announcement deleted successfully.',
      id,
    });
  } catch (error) {
    console.error(
      'DELETE /api/admin/announcements error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}