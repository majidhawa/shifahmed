import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================================================
   TYPES
========================================================= */

const ALLOWED_TYPES = [
  'general',
  'announcement',
  'assignment',
  'quiz',
  'lesson',
  'timetable',
  'student',
  'grade',
  'system',
] as const;

type NotificationType = (typeof ALLOWED_TYPES)[number];

/* =========================================================
   HELPERS
========================================================= */

/**
 * Get the currently authenticated lecturer ID.
 *
 * Different versions of requireLecturer() may expose the
 * authenticated user differently, so we support the common
 * structures used throughout the lecturer portal.
 */
async function authenticateLecturer() {
  const auth = await requireLecturer();

  const lecturerId =
    (auth as any)?.id ??
    (auth as any)?.user?.id ??
    (auth as any)?.lecturer?.id;

  if (!lecturerId) {
    throw new Error('Lecturer ID could not be determined.');
  }

  return {
    auth,
    lecturerId: Number(lecturerId),
  };
}

/**
 * Normalize notification type.
 */
function normalizeType(value: unknown): NotificationType {
  const type = String(value ?? 'general')
    .trim()
    .toLowerCase();

  if (
    ALLOWED_TYPES.includes(
      type as NotificationType
    )
  ) {
    return type as NotificationType;
  }

  return 'general';
}

/**
 * Convert a potentially empty value to null.
 */
function nullableString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const valueString = String(value).trim();

  return valueString.length > 0 ? valueString : null;
}

/**
 * Validate a positive numeric ID.
 */
function parsePositiveId(value: unknown): number | null {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

/* =========================================================
   GET /api/lecturer/notifications
========================================================= */

export async function GET(request: Request) {
  try {
    const { lecturerId } = await authenticateLecturer();

    if (!Number.isInteger(lecturerId) || lecturerId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid lecturer account.',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const type = nullableString(searchParams.get('type'));
    const unreadOnly =
      searchParams.get('unread') === 'true';
    const search = nullableString(searchParams.get('search'));

    const limitRaw = Number(
      searchParams.get('limit') ?? 50
    );

    const limit =
      Number.isInteger(limitRaw) &&
      limitRaw > 0 &&
      limitRaw <= 100
        ? limitRaw
        : 50;

    const values: any[] = [lecturerId];

    const conditions: string[] = [
      'n.lecturer_id = $1',
    ];

    /* -------------------------------------------------------
       FILTER BY TYPE
    ------------------------------------------------------- */

    if (type && type !== 'all') {
      const normalizedType = normalizeType(type);

      values.push(normalizedType);

      conditions.push(
        `n.type = $${values.length}`
      );
    }

    /* -------------------------------------------------------
       FILTER UNREAD
    ------------------------------------------------------- */

    if (unreadOnly) {
      conditions.push('n.is_read = FALSE');
    }

    /* -------------------------------------------------------
       SEARCH
    ------------------------------------------------------- */

    if (search) {
      values.push(`%${search}%`);

      conditions.push(`
        (
          n.title ILIKE $${values.length}
          OR n.message ILIKE $${values.length}
          OR n.type ILIKE $${values.length}
        )
      `);
    }

    /* -------------------------------------------------------
       LIMIT
    ------------------------------------------------------- */

    values.push(limit);

    const result = await pool.query(
      `
      SELECT
        n.id,
        n.lecturer_id,
        n.title,
        n.message,
        n.type,
        n.link,
        n.is_read,
        n.created_by,
        n.created_at,
        n.read_at,

        creator.name AS created_by_name,
        creator.email AS created_by_email

      FROM lms_lecturer_notifications n

      LEFT JOIN users creator
        ON creator.id = n.created_by

      WHERE ${conditions.join(' AND ')}

      ORDER BY n.created_at DESC

      LIMIT $${values.length}
      `,
      values
    );

    /* -------------------------------------------------------
       UNREAD COUNT
    ------------------------------------------------------- */

    const unreadResult = await pool.query(
      `
      SELECT COUNT(*)::int AS count

      FROM lms_lecturer_notifications

      WHERE lecturer_id = $1
        AND is_read = FALSE
      `,
      [lecturerId]
    );

    /* -------------------------------------------------------
       TOTAL COUNT
    ------------------------------------------------------- */

    const totalResult = await pool.query(
      `
      SELECT COUNT(*)::int AS count

      FROM lms_lecturer_notifications

      WHERE lecturer_id = $1
      `,
      [lecturerId]
    );

    return NextResponse.json({
      success: true,
      notifications: result.rows,
      unreadCount: unreadResult.rows[0]?.count ?? 0,
      totalCount: totalResult.rows[0]?.count ?? 0,
    });
  } catch (error) {
    console.error(
      'Lecturer Notifications GET error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load notifications.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST /api/lecturer/notifications

   Creates a notification for a lecturer.

   This endpoint is primarily intended for trusted internal
   LMS functionality. Later, the admin notification system
   can use a dedicated admin endpoint to send notifications
   to lecturers.
========================================================= */

export async function POST(request: Request) {
  try {
    const { lecturerId: authenticatedLecturerId } =
      await authenticateLecturer();

    if (
      !Number.isInteger(authenticatedLecturerId) ||
      authenticatedLecturerId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid lecturer account.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const requestedLecturerId = parsePositiveId(
      body.lecturer_id ??
        body.lecturerId
    );

    /*
     * For security, a lecturer cannot create a notification
     * for another lecturer through this endpoint.
     *
     * If no lecturer_id is provided, the notification belongs
     * to the currently authenticated lecturer.
     */
    const lecturerId =
      requestedLecturerId ?? authenticatedLecturerId;

    if (lecturerId !== authenticatedLecturerId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to create a notification for another lecturer.',
        },
        { status: 403 }
      );
    }

    const title = String(body.title ?? '').trim();
    const message = String(body.message ?? '').trim();

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Notification title is required.',
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Notification message is required.',
        },
        { status: 400 }
      );
    }

    if (title.length > 255) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Notification title cannot exceed 255 characters.',
        },
        { status: 400 }
      );
    }

    const type = normalizeType(body.type);

    const link = nullableString(
      body.link
    );

    /* -------------------------------------------------------
       VERIFY LECTURER EXISTS
    ------------------------------------------------------- */

    const lecturerResult = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        role,
        active

      FROM users

      WHERE id = $1
        AND role = 'lecturer'
        AND active = TRUE

      LIMIT 1
      `,
      [lecturerId]
    );

    if (lecturerResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Lecturer account was not found.',
        },
        { status: 404 }
      );
    }

    /* -------------------------------------------------------
       CREATE NOTIFICATION
    ------------------------------------------------------- */

    const result = await pool.query(
      `
      INSERT INTO lms_lecturer_notifications (
        lecturer_id,
        title,
        message,
        type,
        link,
        is_read,
        created_by,
        created_at
      )

      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        FALSE,
        $1,
        CURRENT_TIMESTAMP
      )

      RETURNING
        id,
        lecturer_id,
        title,
        message,
        type,
        link,
        is_read,
        created_by,
        created_at,
        read_at
      `,
      [
        lecturerId,
        title,
        message,
        type,
        link,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Notification created successfully.',
        notification: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'Lecturer Notifications POST error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to create notification.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH /api/lecturer/notifications

   Supported operations:

   1. Mark one notification as read
      { id: 1, is_read: true }

   2. Mark one notification as unread
      { id: 1, is_read: false }

   3. Mark one notification as read
      { id: 1, markRead: true }

   4. Mark all notifications as read
      { markAllRead: true }
========================================================= */

export async function PATCH(request: Request) {
  try {
    const { lecturerId } =
      await authenticateLecturer();

    if (
      !Number.isInteger(lecturerId) ||
      lecturerId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid lecturer account.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    /* =====================================================
       MARK ALL READ
    ===================================================== */

    if (body.markAllRead === true) {
      const result = await pool.query(
        `
        UPDATE lms_lecturer_notifications

        SET
          is_read = TRUE,
          read_at = COALESCE(
            read_at,
            CURRENT_TIMESTAMP
          )

        WHERE lecturer_id = $1
          AND is_read = FALSE

        RETURNING id
        `,
        [lecturerId]
      );

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read.',
        updatedCount: result.rowCount ?? 0,
      });
    }

    /* =====================================================
       SINGLE NOTIFICATION
    ===================================================== */

    const notificationId = parsePositiveId(
      body.id ??
        body.notification_id ??
        body.notificationId
    );

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Notification ID is required.',
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       DETERMINE READ STATE
    ------------------------------------------------------- */

    let isRead = true;

    if (typeof body.is_read === 'boolean') {
      isRead = body.is_read;
    } else if (typeof body.isRead === 'boolean') {
      isRead = body.isRead;
    } else if (body.markUnread === true) {
      isRead = false;
    } else if (body.markRead === false) {
      isRead = false;
    }

    /* -------------------------------------------------------
       UPDATE OWN NOTIFICATION ONLY
    ------------------------------------------------------- */

    const result = await pool.query(
      `
      UPDATE lms_lecturer_notifications

      SET
        is_read = $1,
        read_at = CASE
          WHEN $1 = TRUE
            THEN COALESCE(
              read_at,
              CURRENT_TIMESTAMP
            )
          ELSE NULL
        END

      WHERE id = $2
        AND lecturer_id = $3

      RETURNING
        id,
        lecturer_id,
        title,
        message,
        type,
        link,
        is_read,
        created_by,
        created_at,
        read_at
      `,
      [
        isRead,
        notificationId,
        lecturerId,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Notification not found or you are not authorized to modify it.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isRead
        ? 'Notification marked as read.'
        : 'Notification marked as unread.',
      notification: result.rows[0],
    });
  } catch (error) {
    console.error(
      'Lecturer Notifications PATCH error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to update notification.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE /api/lecturer/notifications

   Deletes only notifications belonging to the currently
   authenticated lecturer.

   Example:
   DELETE /api/lecturer/notifications?id=15

   Or request body:
   { "id": 15 }
========================================================= */

export async function DELETE(request: Request) {
  try {
    const { lecturerId } =
      await authenticateLecturer();

    if (
      !Number.isInteger(lecturerId) ||
      lecturerId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid lecturer account.',
        },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    let notificationId = parsePositiveId(
      searchParams.get('id')
    );

    /*
     * Also support JSON body for clients that prefer
     * sending DELETE requests with a request body.
     */
    if (!notificationId) {
      try {
        const body = await request.json();

        notificationId = parsePositiveId(
          body.id ??
            body.notification_id ??
            body.notificationId
        );
      } catch {
        // No JSON body — continue with query parameter.
      }
    }

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Notification ID is required.',
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------
       DELETE ONLY THE LECTURER'S OWN NOTIFICATION
    ------------------------------------------------------- */

    const result = await pool.query(
      `
      DELETE FROM lms_lecturer_notifications

      WHERE id = $1
        AND lecturer_id = $2

      RETURNING id
      `,
      [
        notificationId,
        lecturerId,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Notification not found or you are not authorized to delete it.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully.',
      id: notificationId,
    });
  } catch (error) {
    console.error(
      'Lecturer Notifications DELETE error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to delete notification.',
      },
      { status: 500 }
    );
  }
}