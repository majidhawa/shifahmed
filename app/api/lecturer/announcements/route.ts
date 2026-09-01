import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';

type AnnouncementStatus = 'draft' | 'published' | 'archived';
type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';
type AnnouncementAudience =
  | 'students'
  | 'lecturers'
  | 'parents'
  | 'all';

/* =========================================================
   HELPERS
========================================================= */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred.';
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    Number.isNaN(Number(value))
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function getLecturerId(lecturer: any): number | null {
  const id =
    lecturer?.id ??
    lecturer?.user_id ??
    lecturer?.userId;

  const parsed = Number(id);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function isValidAudience(value: unknown): value is AnnouncementAudience {
  return (
    value === 'students' ||
    value === 'lecturers' ||
    value === 'parents' ||
    value === 'all'
  );
}

function isValidPriority(value: unknown): value is AnnouncementPriority {
  return (
    value === 'low' ||
    value === 'normal' ||
    value === 'high' ||
    value === 'urgent'
  );
}

function isValidStatus(value: unknown): value is AnnouncementStatus {
  return (
    value === 'draft' ||
    value === 'published' ||
    value === 'archived'
  );
}

/* =========================================================
   GET /api/lecturer/announcements

   Returns:
   - Lecturer's own announcements
   - Admin announcements intended for lecturers/all
   - Assigned programs
   - Assigned units
========================================================= */

export async function GET(request: NextRequest) {
  try {
    /*
     * requireLecturer() does not receive the request in your
     * current lecturer authentication implementation.
     */
    const lecturer = await requireLecturer();

    const lecturerId = getLecturerId(lecturer);

    if (!lecturerId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to determine lecturer ID.',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const status = cleanString(searchParams.get('status'));
    const search = cleanString(searchParams.get('search'));
    const programId = nullableNumber(searchParams.get('program_id'));

    /* =====================================================
       BUILD FILTERS
    ===================================================== */

    const conditions: string[] = [
      `
      (
        (
          a.created_by = $1
          AND a.created_by_role = 'lecturer'
        )
        OR
        (
          a.created_by_role = 'admin'
          AND a.audience IN ('lecturers', 'all')
        )
      )
      `,
    ];

    const values: any[] = [lecturerId];

    let parameterIndex = 2;

    if (status && isValidStatus(status)) {
      conditions.push(`a.status = $${parameterIndex}`);
      values.push(status);
      parameterIndex++;
    }

    if (search) {
      conditions.push(`
        (
          a.title ILIKE $${parameterIndex}
          OR a.message ILIKE $${parameterIndex}
        )
      `);

      values.push(`%${search}%`);
      parameterIndex++;
    }

    if (programId !== null) {
      conditions.push(`a.program_id = $${parameterIndex}`);
      values.push(programId);
      parameterIndex++;
    }

    const whereClause = conditions.join(' AND ');

    /* =====================================================
       ANNOUNCEMENTS
    ===================================================== */

    const announcementsResult = await pool.query(
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

      WHERE ${whereClause}

      ORDER BY
        a.is_pinned DESC,
        a.created_at DESC
      `,
      values
    );

    /* =====================================================
       ASSIGNED PROGRAMS
    ===================================================== */

    const programsResult = await pool.query(
      `
      SELECT DISTINCT
        p.id,
        p.name
      FROM lms_lecturer_programs lp
      INNER JOIN lms_programs p
        ON p.id = lp.program_id
      WHERE lp.lecturer_id = $1
      ORDER BY p.name ASC
      `,
      [lecturerId]
    );

    /* =====================================================
       ASSIGNED UNITS
    ===================================================== */

    const unitsResult = await pool.query(
      `
      SELECT DISTINCT
        u.id,
        u.name,
        u.program_id,
        p.name AS program_name
      FROM lms_units u
      INNER JOIN lms_lecturer_programs lp
        ON lp.program_id = u.program_id
      INNER JOIN lms_programs p
        ON p.id = u.program_id
      WHERE lp.lecturer_id = $1
      ORDER BY
        p.name ASC,
        u.name ASC
      `,
      [lecturerId]
    );

    return NextResponse.json({
      success: true,
      announcements: announcementsResult.rows,
      programs: programsResult.rows,
      units: unitsResult.rows,
    });
  } catch (error) {
    console.error(
      'GET /api/lecturer/announcements error:',
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
   POST /api/lecturer/announcements

   Creates a lecturer announcement
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();

    const lecturerId = getLecturerId(lecturer);

    if (!lecturerId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to determine lecturer ID.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const title = cleanString(body.title);
    const message = cleanString(body.message);

    const audience: AnnouncementAudience =
      isValidAudience(body.audience)
        ? body.audience
        : 'students';

    const priority: AnnouncementPriority =
      isValidPriority(body.priority)
        ? body.priority
        : 'normal';

    const status: AnnouncementStatus =
      isValidStatus(body.status)
        ? body.status
        : 'draft';

    const programId = nullableNumber(body.program_id);
    const unitId = nullableNumber(body.unit_id);

    const publishAt =
      cleanString(body.publish_at) || null;

    const expiresAt =
      cleanString(body.expires_at) || null;

    const isPinned = Boolean(body.is_pinned);

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Announcement title is required.',
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Announcement message is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY PROGRAM ASSIGNMENT
    ===================================================== */

    if (programId !== null) {
      const programCheck = await pool.query(
        `
        SELECT 1
        FROM lms_lecturer_programs
        WHERE lecturer_id = $1
          AND program_id = $2
        LIMIT 1
        `,
        [lecturerId, programId]
      );

      if (programCheck.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              'You are not authorized to create an announcement for this program.',
          },
          { status: 403 }
        );
      }
    }

    /* =====================================================
       VERIFY UNIT ASSIGNMENT
    ===================================================== */

    if (unitId !== null) {
      const unitCheck = await pool.query(
        `
        SELECT
          u.id,
          u.program_id
        FROM lms_units u
        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id
        WHERE u.id = $1
          AND lp.lecturer_id = $2
        LIMIT 1
        `,
        [unitId, lecturerId]
      );

      if (unitCheck.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              'You are not authorized to create an announcement for this unit.',
          },
          { status: 403 }
        );
      }

      /*
       * If both program and unit are selected,
       * make sure they belong together.
       */
      if (
        programId !== null &&
        Number(unitCheck.rows[0].program_id) !== Number(programId)
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
       CREATE ANNOUNCEMENT
    ===================================================== */

    const result = await pool.query(
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
        'lecturer',
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
        lecturerId,
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
        message: 'Announcement created successfully.',
        announcement: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'POST /api/lecturer/announcements error:',
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
   PUT /api/lecturer/announcements

   Updates lecturer's own announcement
========================================================= */

export async function PUT(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();

    const lecturerId = getLecturerId(lecturer);

    if (!lecturerId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to determine lecturer ID.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = nullableNumber(body.id);

    if (id === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'Announcement ID is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY OWNERSHIP
    ===================================================== */

    const ownershipCheck = await pool.query(
      `
      SELECT id
      FROM lms_announcements
      WHERE id = $1
        AND created_by = $2
        AND created_by_role = 'lecturer'
      LIMIT 1
      `,
      [id, lecturerId]
    );

    if (ownershipCheck.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to edit this announcement.',
        },
        { status: 403 }
      );
    }

    const title = cleanString(body.title);
    const message = cleanString(body.message);

    const audience: AnnouncementAudience =
      isValidAudience(body.audience)
        ? body.audience
        : 'students';

    const priority: AnnouncementPriority =
      isValidPriority(body.priority)
        ? body.priority
        : 'normal';

    const status: AnnouncementStatus =
      isValidStatus(body.status)
        ? body.status
        : 'draft';

    const programId = nullableNumber(body.program_id);
    const unitId = nullableNumber(body.unit_id);

    const publishAt =
      cleanString(body.publish_at) || null;

    const expiresAt =
      cleanString(body.expires_at) || null;

    const isPinned = Boolean(body.is_pinned);

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Announcement title is required.',
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Announcement message is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY PROGRAM
    ===================================================== */

    if (programId !== null) {
      const programCheck = await pool.query(
        `
        SELECT 1
        FROM lms_lecturer_programs
        WHERE lecturer_id = $1
          AND program_id = $2
        LIMIT 1
        `,
        [lecturerId, programId]
      );

      if (programCheck.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              'You are not authorized to use this program.',
          },
          { status: 403 }
        );
      }
    }

    /* =====================================================
       VERIFY UNIT
    ===================================================== */

    if (unitId !== null) {
      const unitCheck = await pool.query(
        `
        SELECT
          u.id,
          u.program_id
        FROM lms_units u
        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id
        WHERE u.id = $1
          AND lp.lecturer_id = $2
        LIMIT 1
        `,
        [unitId, lecturerId]
      );

      if (unitCheck.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              'You are not authorized to use this unit.',
          },
          { status: 403 }
        );
      }

      if (
        programId !== null &&
        Number(unitCheck.rows[0].program_id) !== Number(programId)
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

    const result = await pool.query(
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
        publish_at = COALESCE($8::timestamptz, publish_at),
        expires_at = $9::timestamptz,
        is_pinned = $10,
        updated_at = NOW()
      WHERE id = $11
        AND created_by = $12
        AND created_by_role = 'lecturer'

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
        lecturerId,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Announcement could not be updated.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Announcement updated successfully.',
      announcement: result.rows[0],
    });
  } catch (error) {
    console.error(
      'PUT /api/lecturer/announcements error:',
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
   DELETE /api/lecturer/announcements?id=123

   Deletes lecturer's own announcement
========================================================= */

export async function DELETE(request: NextRequest) {
  try {
    const lecturer = await requireLecturer();

    const lecturerId = getLecturerId(lecturer);

    if (!lecturerId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to determine lecturer ID.',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const id = nullableNumber(searchParams.get('id'));

    if (id === null) {
      return NextResponse.json(
        {
          success: false,
          message: 'Announcement ID is required.',
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      DELETE FROM lms_announcements
      WHERE id = $1
        AND created_by = $2
        AND created_by_role = 'lecturer'
      RETURNING id
      `,
      [id, lecturerId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Announcement not found or you are not authorized to delete it.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully.',
      id,
    });
  } catch (error) {
    console.error(
      'DELETE /api/lecturer/announcements error:',
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