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
   NORMALIZE PROGRAM IDS
========================================================= */

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

    if (search) {
      conditions.push(`
        (
          u.name ILIKE $${parameterIndex}
          OR u.email ILIKE $${parameterIndex}
          OR u.phone ILIKE $${parameterIndex}
        )
      `);

      values.push(`%${search}%`);
      parameterIndex++;
    }

    if (role) {
      conditions.push(
        `u.role = $${parameterIndex}`
      );

      values.push(
        normalizeRole(role)
      );

      parameterIndex++;
    }

    if (status) {
      conditions.push(
        `u.active = $${parameterIndex}`
      );

      values.push(
        normalizeStatus(status) ===
          'active'
      );

      parameterIndex++;
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    /* =====================================================
       GET USERS + ASSIGNED PROGRAMS
    ===================================================== */

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

        ${whereClause}

        GROUP BY
          u.id,
          u.name,
          u.email,
          u.phone,
          u.role,
          u.active,
          u.created_at,
          u.updated_at

        ORDER BY
          u.created_at DESC
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
  const client =
    await pool.connect();

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
       COURSE ASSIGNMENT VALIDATION
    ===================================================== */

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
       CHECK EMAIL IN USERS
    ===================================================== */

    const existingUser =
      await client.query(
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
       CHECK ADMIN USERS
    ===================================================== */

    const existingAdmin =
      await client.query(
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
       VALIDATE PROGRAMS EXIST
    ===================================================== */

    if (
      role === 'lecturer' &&
      programIds.length > 0
    ) {
      const programsResult =
        await client.query(
          `
          SELECT id
          FROM lms_programs
          WHERE id = ANY($1::integer[])
          `,
          [programIds]
        );

      if (
        programsResult.rows.length !==
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
       HASH PASSWORD
    ===================================================== */

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    const active =
      status === 'active';

    /* =====================================================
       TRANSACTION
    ===================================================== */

    await client.query('BEGIN');

    /* =====================================================
       CREATE USER
    ===================================================== */

    const userResult =
      await client.query(
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
      userResult.rows[0];

    /* =====================================================
       ASSIGN COURSES
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
            user.id,
            programId,
          ]
        );
      }
    }

    await client.query('COMMIT');

    /* =====================================================
       LOG
    ===================================================== */

    console.log(
      `Admin ${admin.email} created LMS user #${user.id} (${user.email}) with role ${user.role} and ${programIds.length} course assignment(s).`
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          'User created successfully.',
        user: {
          ...user,
          program_ids:
            programIds,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback errors.
    }

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
  } finally {
    client.release();
  }
}