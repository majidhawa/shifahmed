import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

type UserRole =
  | 'lecturer'
  | 'parent';

type UserStatus =
  | 'active'
  | 'inactive';

/* =========================================================
   HELPERS
========================================================= */

function cleanString(
  value: unknown
): string {
  return String(value || '').trim();
}

function normalizeRole(
  value: unknown
): UserRole | null {
  const role =
    cleanString(value).toLowerCase();

  if (
    role === 'lecturer' ||
    role === 'parent'
  ) {
    return role;
  }

  return null;
}

function normalizeStatus(
  value: unknown
): UserStatus | null {
  const status =
    cleanString(value).toLowerCase();

  if (
    status === 'active' ||
    status === 'inactive'
  ) {
    return status;
  }

  return null;
}

function normalizeProgramIds(
  value: unknown
): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = value
    .map((item) => Number(item))
    .filter(
      (id) =>
        Number.isInteger(id) &&
        id > 0
    );

  return [...new Set(ids)];
}

/* =========================================================
   GET SINGLE USER
   GET /api/admin/users/[id]
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

    const { id } =
      await context.params;

    const userId =
      Number(id);

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid user ID.',
        },
        { status: 400 }
      );
    }

    const result =
      await pool.query(
        `
        SELECT
          u.id,
          u.name,
          u.email,
          u.phone,
          u.role,
          u.active,
          u.created_at,
          u.updated_at,

          COALESCE(
            ARRAY_AGG(
              DISTINCT lp.program_id
            ) FILTER (
              WHERE lp.program_id IS NOT NULL
            ),
            '{}'
          ) AS program_ids,

          COALESCE(
            JSON_AGG(
              DISTINCT JSONB_BUILD_OBJECT(
                'id', p.id,
                'name', p.name,
                'code', p.code
              )
            ) FILTER (
              WHERE p.id IS NOT NULL
            ),
            '[]'
          ) AS programs

        FROM users u

        LEFT JOIN lms_lecturer_programs lp
          ON lp.lecturer_id = u.id

        LEFT JOIN lms_programs p
          ON p.id = lp.program_id

        WHERE u.id = $1

        GROUP BY
          u.id
        `,
        [userId]
      );

    if (
      result.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error(
      'GET ADMIN USER ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load user.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   UPDATE USER
   PATCH /api/admin/users/[id]
========================================================= */

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const client =
    await pool.connect();

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

    const { id } =
      await context.params;

    const userId =
      Number(id);

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid user ID.',
        },
        { status: 400 }
      );
    }

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid request body.',
        },
        { status: 400 }
      );
    }

    const name =
      cleanString(body?.name);

    const email =
      cleanString(body?.email)
        .toLowerCase();

    const phone =
      cleanString(body?.phone);

    const password =
      cleanString(body?.password);

    const role =
      normalizeRole(body?.role);

    const status =
      normalizeStatus(
        body?.status || 'active'
      );

    const programIds =
      normalizeProgramIds(
        body?.programIds
      );

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Name is required.',
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Email address is required.',
        },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Role must be lecturer or parent.',
        },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Status must be active or inactive.',
        },
        { status: 400 }
      );
    }

    if (
      password &&
      password.length < 8
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password must be at least 8 characters.',
        },
        { status: 400 }
      );
    }

    if (
      role === 'parent' &&
      programIds.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Courses can only be assigned to lecturers.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK USER EXISTS
    ===================================================== */

    const existing =
      await client.query(
        `
        SELECT
          id,
          role
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [userId]
      );

    if (
      existing.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       CHECK EMAIL
    ===================================================== */

    const duplicateEmail =
      await client.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER($1)
          AND id <> $2
        LIMIT 1
        `,
        [
          email,
          userId,
        ]
      );

    if (
      duplicateEmail.rows.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Another user already uses this email address.',
        },
        { status: 409 }
      );
    }

    /* =====================================================
       VALIDATE PROGRAMS
    ===================================================== */

    if (
      role === 'lecturer' &&
      programIds.length > 0
    ) {
      const programs =
        await client.query(
          `
          SELECT id
          FROM lms_programs
          WHERE id = ANY($1::integer[])
          `,
          [programIds]
        );

      if (
        programs.rows.length !==
        programIds.length
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'One or more selected courses do not exist.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       START TRANSACTION
    ===================================================== */

    await client.query('BEGIN');

    /* =====================================================
       UPDATE WITHOUT PASSWORD
    ===================================================== */

    let userResult;

    if (password) {
      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      userResult =
        await client.query(
          `
          UPDATE users

          SET
            name = $1,
            email = $2,
            phone = $3,
            password_hash = $4,
            role = $5,
            active = $6,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $7

          RETURNING
            id,
            name,
            email,
            phone,
            role,
            active,
            created_at,
            updated_at
          `,
          [
            name,
            email,
            phone || null,
            passwordHash,
            role,
            status === 'active',
            userId,
          ]
        );
    } else {
      userResult =
        await client.query(
          `
          UPDATE users

          SET
            name = $1,
            email = $2,
            phone = $3,
            role = $4,
            active = $5,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $6

          RETURNING
            id,
            name,
            email,
            phone,
            role,
            active,
            created_at,
            updated_at
          `,
          [
            name,
            email,
            phone || null,
            role,
            status === 'active',
            userId,
          ]
        );
    }

    /* =====================================================
       REMOVE OLD COURSE ASSIGNMENTS
    ===================================================== */

    await client.query(
      `
      DELETE FROM lms_lecturer_programs
      WHERE lecturer_id = $1
      `,
      [userId]
    );

    /* =====================================================
       INSERT NEW COURSE ASSIGNMENTS
    ===================================================== */

    if (
      role === 'lecturer' &&
      programIds.length > 0
    ) {
      for (const programId of programIds) {
        await client.query(
          `
          INSERT INTO lms_lecturer_programs (
            lecturer_id,
            program_id
          )

          VALUES (
            $1,
            $2
          )

          ON CONFLICT (
            lecturer_id,
            program_id
          )
          DO NOTHING
          `,
          [
            userId,
            programId,
          ]
        );
      }
    }

    await client.query('COMMIT');

    const user =
      userResult.rows[0];

    console.log(
      `Admin ${admin.email} updated LMS user #${userId} with ${programIds.length} course assignment(s).`
    );

    return NextResponse.json({
      success: true,
      message:
        'User updated successfully.',
      user: {
        ...user,
        program_ids:
          programIds,
      },
    });
  } catch (error: any) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback errors.
    }

    console.error(
      'UPDATE LMS USER ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update user.',
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/* =========================================================
   DELETE USER
   DELETE /api/admin/users/[id]
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

    const { id } =
      await context.params;

    const userId =
      Number(id);

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid user ID.',
        },
        { status: 400 }
      );
    }

    const result =
      await pool.query(
        `
        DELETE FROM users
        WHERE id = $1
        RETURNING
          id,
          name,
          email,
          role
        `,
        [userId]
      );

    if (
      result.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found.',
        },
        { status: 404 }
      );
    }

    console.log(
      `Admin ${admin.email} deleted LMS user #${userId}.`
    );

    return NextResponse.json({
      success: true,
      message:
        'User deleted successfully.',
      user: result.rows[0],
    });
  } catch (error) {
    console.error(
      'DELETE LMS USER ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to delete user.',
      },
      { status: 500 }
    );
  }
}