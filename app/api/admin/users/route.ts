import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

/* =========================================================
   TYPES
========================================================= */

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
   GET USERS
   GET /api/admin/users
========================================================= */

export async function GET(
  request: Request
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
       QUERY PARAMETERS
    ===================================================== */

    const { searchParams } =
      new URL(request.url);

    const search =
      cleanString(
        searchParams.get('search')
      );

    const role =
      searchParams.get('role');

    const status =
      searchParams.get('status');

    /* =====================================================
       VALIDATE ROLE
    ===================================================== */

    if (role) {
      const normalizedRole =
        normalizeRole(role);

      if (!normalizedRole) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Invalid role. Use lecturer or parent.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       VALIDATE STATUS
    ===================================================== */

    if (status) {
      const normalizedStatus =
        normalizeStatus(status);

      if (!normalizedStatus) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Invalid user status.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       BUILD QUERY
    ===================================================== */

    const conditions: string[] = [];
    const values: unknown[] = [];

    let parameterIndex = 1;

    /* =====================================================
       SEARCH
    ===================================================== */

    if (search) {
      conditions.push(`
        (
          name ILIKE $${parameterIndex}
          OR email ILIKE $${parameterIndex}
          OR phone ILIKE $${parameterIndex}
        )
      `);

      values.push(`%${search}%`);

      parameterIndex++;
    }

    /* =====================================================
       ROLE FILTER
    ===================================================== */

    if (role) {
      conditions.push(
        `role = $${parameterIndex}`
      );

      values.push(
        normalizeRole(role)
      );

      parameterIndex++;
    }

    /* =====================================================
       STATUS FILTER
    ===================================================== */

    if (status) {
      conditions.push(
        `active = $${parameterIndex}`
      );

      values.push(
        normalizeStatus(status) === 'active'
      );

      parameterIndex++;
    }

    /* =====================================================
       WHERE CLAUSE
    ===================================================== */

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    /* =====================================================
       GET USERS
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

          ${whereClause}

          ORDER BY created_at DESC
        `,
        values
      );

    /* =====================================================
       STATISTICS
    ===================================================== */

    const statisticsResult =
      await pool.query(`
        SELECT
          COUNT(*)::int AS total,

          COUNT(*) FILTER (
            WHERE role = 'lecturer'
          )::int AS lecturers,

          COUNT(*) FILTER (
            WHERE role = 'parent'
          )::int AS parents,

          COUNT(*) FILTER (
            WHERE active = true
          )::int AS active,

          COUNT(*) FILTER (
            WHERE active = false
          )::int AS inactive

        FROM users

        WHERE role IN (
          'lecturer',
          'parent'
        )
      `);

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      users: result.rows,

      statistics:
        statisticsResult.rows[0] || {
          total: 0,
          lecturers: 0,
          parents: 0,
          active: 0,
          inactive: 0,
        },
    });
  } catch (error) {
    console.error(
      'GET ADMIN USERS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load users.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE USER
   POST /api/admin/users
========================================================= */

export async function POST(
  request: Request
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
       READ BODY
    ===================================================== */

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

    /* =====================================================
       VALUES
    ===================================================== */

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

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password is required.',
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password must be at least 8 characters.',
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

    /* =====================================================
       CHECK EMAIL IN USERS
    ===================================================== */

    const existingUser =
      await pool.query(
        `
          SELECT id
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
        `,
        [email]
      );

    if (
      existingUser.rows.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A user with this email address already exists.',
        },
        { status: 409 }
      );
    }

    /* =====================================================
       CHECK EMAIL IN ADMIN_USERS
       Prevent same email being used for both systems.
    ===================================================== */

    const existingAdmin =
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
      existingAdmin.rows.length > 0
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

    /* =====================================================
       HASH PASSWORD
    ===================================================== */

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    /* =====================================================
       ACTIVE STATUS
    ===================================================== */

    const active =
      status === 'active';

    /* =====================================================
       CREATE USER
    ===================================================== */

    const result =
      await pool.query(
        `
          INSERT INTO users (
            name,
            email,
            phone,
            password_hash,
            role,
            active
          )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
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
        [
          name,
          email,
          phone || null,
          passwordHash,
          role,
          active,
        ]
      );

    const user =
      result.rows[0];

    /* =====================================================
       LOG
    ===================================================== */

    console.log(
      `Admin ${admin.email} created LMS user #${user.id} (${user.email}) with role ${user.role}`
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          'User created successfully.',
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      'CREATE LMS USER ERROR:',
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
            : 'Unable to create user.',
      },
      { status: 500 }
    );
  }
}