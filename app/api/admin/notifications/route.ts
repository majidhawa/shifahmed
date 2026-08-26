import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireAdmin();

    const result = await pool.query(`
      SELECT
        id,
        type,
        title,
        message,
        application_id,
        is_read,
        created_at
      FROM admin_notifications
      ORDER BY created_at DESC
      LIMIT 30
    `);

    const unreadResult = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM admin_notifications
      WHERE is_read = FALSE
    `);

    return NextResponse.json({
      success: true,
      notifications: result.rows,
      unreadCount: unreadResult.rows[0]?.count ?? 0,
    });
  } catch (error) {
    console.error('Notifications GET error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load notifications.',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    if (body.markAllRead) {
      await pool.query(`
        UPDATE admin_notifications
        SET is_read = TRUE
        WHERE is_read = FALSE
      `);

      return NextResponse.json({
        success: true,
      });
    }

    if (body.id) {
      await pool.query(
        `
        UPDATE admin_notifications
        SET is_read = TRUE
        WHERE id = $1
        `,
        [body.id]
      );

      return NextResponse.json({
        success: true,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Notification ID is required.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Notifications PATCH error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to update notification.',
      },
      { status: 500 }
    );
  }
}