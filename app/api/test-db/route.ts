import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT NOW() AS current_time'
    );

    return NextResponse.json({
      success: true,
      message: 'PostgreSQL connection is working.',
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error('DATABASE TEST ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Database connection failed.',
      },
      { status: 500 }
    );
  }
}