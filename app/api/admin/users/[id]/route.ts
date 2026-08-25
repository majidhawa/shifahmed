import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

/* =========================================================
   TYPES
========================================================= */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UserRole =
  | 'lecturer'
  | 'parent';

type UserStatus =
  | 'active'
  | 'inactive';

/* =========================================================
   HELPERS
========================================================= */

function normalizeRole(
  role: unknown
): UserRole | null {
  const value = String(role || '')
    .trim()
    .toLowerCase();

  if (
    value === 'lecturer' ||
    value === 'parent'
  ) {
    return value;
  }

  return null;
}

function normalizeStatus(
  status: unknown
): UserStatus | null {
  const value = String(status || '')
    .trim()
    .toLowerCase();

  if (
    value === 'active' ||
    value === 'inactive'
  ) {
    return value;
  }

  return null;
}

function cleanString(
  value: unknown
): string {
  return String(value || '').trim();
}

/* =========================================================
   GET SINGLE USER
   GET /api/admin/users/[id]
========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
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
       GET USER ID
    ===================================================== */

    const { id: idParam } =
      await context.params;

    const id = Number(idParam);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid user ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GET USER
    ===================================================== */

    const result =
      await pool.query(
        `
          SELECT
            id,
            name,
            email,
            phone,
            role,
            active,
            created_at,
            updated_at

          FROM users

          WHERE id = $1

          AND role IN (
            'lecturer',
            'parent'
          )

          LIMIT 1
        `,
        [id]
      );

    /* =====================================================
       USER NOT FOUND
    ===================================================== */

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

    /* =====================================================
       RESPONSE
    ===================================================== */

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
  context: RouteContext
) {
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
       GET USER ID
    ===================================================== */

    const { id: idParam } =
      await context.params;

    const id = Number(idParam);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid user ID.',
        },
        { status: 400 }
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
       CHECK USER EXISTS
    ===================================================== */

    const existingResult =
      await pool.query(
        `
          SELECT
            id,
            name,
            email,
            role,
            active

          FROM users

          WHERE id = $1

          AND role IN (
            'lecturer',
            'parent'
          )

          LIMIT 1
        `,
        [id]
      );

    if (
      existingResult.rows.length === 0
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
       GET VALUES
    ===================================================== */

    const name =
      body?.name !== undefined
        ? cleanString(body.name)
        : undefined;

    const email =
      body?.email !== undefined
        ? cleanString(body.email).toLowerCase()
        : undefined;

    const phone =
      body?.phone !== undefined
        ? cleanString(body.phone)
        : undefined;

    const password =
      body?.password !== undefined
        ? cleanString(body.password)
        : undefined;

    const role =
      body?.role !== undefined
        ? normalizeRole(body.role)
        : undefined;

    const status =
      body?.status !== undefined
        ? normalizeStatus(body.status)
        : undefined;

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      name !== undefined &&
      !name
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name cannot be empty.',
        },
        { status: 400 }
      );
    }

    if (
      email !== undefined &&
      !email
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email cannot be empty.',
        },
        { status: 400 }
      );
    }

    if (
      password !== undefined &&
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
      role !== undefined &&
      !role
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid role. Use lecturer or parent.',
        },
        { status: 400 }
      );
    }

    if (
      status !== undefined &&
      !status
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid status. Use active or inactive.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK DUPLICATE EMAIL IN USERS
    ===================================================== */

    if (email) {
      const duplicate =
        await pool.query(
          `
            SELECT id

            FROM users

            WHERE LOWER(email) = LOWER($1)

            AND id <> $2

            LIMIT 1
          `,
          [email, id]
        );

      if (
        duplicate.rows.length > 0
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

      /* ===================================================
         CHECK EMAIL IN ADMIN_USERS
      =================================================== */

      const adminDuplicate =
        await pool.query(
          `
            SELECT id

            FROM admin_users

            WHERE LOWER(email) = LOWER($1)

            LIMIT 1
          `,
          [email]
        );

      if (
        adminDuplicate.rows.length > 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              'This email address is already registered as an administrator.',
          },
          { status: 409 }
        );
      }
    }

    /* =====================================================
       BUILD UPDATE QUERY
    ===================================================== */

    const fields: string[] = [];
    const values: unknown[] = [];

    let parameterIndex = 1;

    /* =====================================================
       NAME
    ===================================================== */

    if (
      name !== undefined
    ) {
      fields.push(
        `name = $${parameterIndex}`
      );

      values.push(name);

      parameterIndex++;
    }

    /* =====================================================
       EMAIL
    ===================================================== */

    if (
      email !== undefined
    ) {
      fields.push(
        `email = $${parameterIndex}`
      );

      values.push(email);

      parameterIndex++;
    }

    /* =====================================================
       PHONE
    ===================================================== */

    if (
      phone !== undefined
    ) {
      fields.push(
        `phone = $${parameterIndex}`
      );

      values.push(
        phone || null
      );

      parameterIndex++;
    }

    /* =====================================================
       ROLE
    ===================================================== */

    if (
      role !== undefined
    ) {
      fields.push(
        `role = $${parameterIndex}`
      );

      values.push(role);

      parameterIndex++;
    }

    /* =====================================================
       STATUS
    ===================================================== */

    if (
      status !== undefined
    ) {
      fields.push(
        `active = $${parameterIndex}`
      );

      values.push(
        status === 'active'
      );

      parameterIndex++;
    }

    /* =====================================================
       PASSWORD
    ===================================================== */

    if (
      password !== undefined &&
      password
    ) {
      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      fields.push(
        `password_hash = $${parameterIndex}`
      );

      values.push(passwordHash);

      parameterIndex++;
    }

    /* =====================================================
       UPDATED AT
    ===================================================== */

    fields.push(
      `updated_at = NOW()`
    );

    /* =====================================================
       NOTHING TO UPDATE
    ===================================================== */

    if (
      fields.length === 1 &&
      fields[0] ===
        'updated_at = NOW()'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'No changes were provided.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       ADD USER ID
    ===================================================== */

    values.push(id);

    /* =====================================================
       UPDATE USER
    ===================================================== */

    const result =
      await pool.query(
        `
          UPDATE users

          SET
            ${fields.join(', ')}

          WHERE id = $${parameterIndex}

          AND role IN (
            'lecturer',
            'parent'
          )

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
        values
      );

    if (
      result.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'User could not be updated.',
        },
        { status: 500 }
      );
    }

    const user =
      result.rows[0];

    /* =====================================================
       LOG
    ===================================================== */

    console.log(
      `Admin ${admin.email} updated user #${id}`
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,
      message:
        'User updated successfully.',
      user,
    });
  } catch (error: any) {
    console.error(
      'UPDATE ADMIN USER ERROR:',
      error
    );

    if (
      error?.code === '23505'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A user with this email already exists.',
        },
        { status: 409 }
      );
    }

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
  }
}

/* =========================================================
   DELETE USER
   DELETE /api/admin/users/[id]
========================================================= */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
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
       GET USER ID
    ===================================================== */

    const { id: idParam } =
      await context.params;

    const id = Number(idParam);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid user ID.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK USER EXISTS
    ===================================================== */

    const existingResult =
      await pool.query(
        `
          SELECT
            id,
            name,
            email,
            role

          FROM users

          WHERE id = $1

          AND role IN (
            'lecturer',
            'parent'
          )

          LIMIT 1
        `,
        [id]
      );

    if (
      existingResult.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found.',
        },
        { status: 404 }
      );
    }

    const user =
      existingResult.rows[0];

    /* =====================================================
       DELETE USER
    ===================================================== */

    await pool.query(
      `
        DELETE FROM users

        WHERE id = $1

        AND role IN (
          'lecturer',
          'parent'
        )
      `,
      [id]
    );

    /* =====================================================
       LOG
    ===================================================== */

    console.log(
      `Admin ${admin.email} deleted user #${id} (${user.email})`
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,
      message:
        'User deleted successfully.',
    });
  } catch (error) {
    console.error(
      'DELETE ADMIN USER ERROR:',
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