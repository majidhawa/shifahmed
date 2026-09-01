import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================================================
   CONSTANTS
========================================================= */

const ALLOWED_CLASS_TYPES = [
  'lecture',
  'practical',
  'tutorial',
  'exam',
  'meeting',
  'other',
] as const;

const ALLOWED_STATUSES = [
  'scheduled',
  'completed',
  'cancelled',
] as const;

/* =========================================================
   TYPES
========================================================= */

type AdminAuth = {
  id?: number | string;
  email?: string;
  user?: {
    id?: number | string;
    email?: string;
  };
};

type TimetableBody = {
  program_id?: unknown;
  unit_id?: unknown;
  lecturer_id?: unknown;
  day_of_week?: unknown;
  start_time?: unknown;
  end_time?: unknown;
  title?: unknown;
  description?: unknown;
  room?: unknown;
  class_type?: unknown;
  status?: unknown;
  start_date?: unknown;
  end_date?: unknown;
};

/* =========================================================
   HELPERS
========================================================= */

function cleanString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function nullableString(value: unknown): string | null {
  const cleaned = cleanString(value);

  return cleaned || null;
}

function nullableNumber(value: unknown): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }

  return number;
}

function validDate(value: unknown): boolean {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return false;
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  return !Number.isNaN(date.getTime());
}

function validTime(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    value
  );
}

function validDay(value: unknown): boolean {
  const day = Number(value);

  return (
    Number.isInteger(day) &&
    day >= 1 &&
    day <= 5
  );
}

/* =========================================================
   AUTHENTICATION
========================================================= */

function authenticateAdmin() {
  try {
    const admin = requireAdmin() as AdminAuth | null;

    if (!admin) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            message: 'Unauthorized.',
          },
          { status: 401 }
        ),
      };
    }

    return {
      success: true,
      admin,
    };
  } catch (error) {
    console.error(
      'ADMIN TIMETABLE AUTH ERROR:',
      error
    );

    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      ),
    };
  }
}

/* =========================================================
   NORMALIZE TIMETABLE BODY
========================================================= */

function normalizeBody(
  body: TimetableBody
) {
  return {
    programId: nullableNumber(
      body.program_id
    ),

    unitId: nullableNumber(
      body.unit_id
    ),

    lecturerId: nullableNumber(
      body.lecturer_id
    ),

    dayOfWeek: Number(
      body.day_of_week
    ),

    startTime: cleanString(
      body.start_time
    ),

    endTime: cleanString(
      body.end_time
    ),

    title: cleanString(
      body.title
    ),

    description: nullableString(
      body.description
    ),

    room: nullableString(
      body.room
    ),

    classType:
      cleanString(
        body.class_type
      ) || 'lecture',

    status:
      cleanString(
        body.status
      ) || 'scheduled',

    startDate:
      nullableString(
        body.start_date
      ),

    endDate:
      nullableString(
        body.end_date
      ),
  };
}

/* =========================================================
   VALIDATE BODY
========================================================= */

function validateTimetableBody(
  values: ReturnType<typeof normalizeBody>
) {
  if (!values.programId) {
    return 'Please select a program.';
  }

  if (!values.lecturerId) {
    return 'Please select a lecturer.';
  }

  if (!validDay(values.dayOfWeek)) {
    return 'Invalid day. Only Monday to Friday are allowed.';
  }

  if (!validTime(values.startTime)) {
    return 'Please provide a valid start time.';
  }

  if (!validTime(values.endTime)) {
    return 'Please provide a valid end time.';
  }

  if (
    values.endTime <=
    values.startTime
  ) {
    return 'End time must be later than start time.';
  }

  if (!values.title) {
    return 'Class title is required.';
  }

  if (
    !ALLOWED_CLASS_TYPES.includes(
      values.classType as (typeof ALLOWED_CLASS_TYPES)[number]
    )
  ) {
    return 'Invalid class type.';
  }

  if (
    !ALLOWED_STATUSES.includes(
      values.status as (typeof ALLOWED_STATUSES)[number]
    )
  ) {
    return 'Invalid timetable status.';
  }

  if (
    values.startDate &&
    !validDate(values.startDate)
  ) {
    return 'Invalid start date.';
  }

  if (
    values.endDate &&
    !validDate(values.endDate)
  ) {
    return 'Invalid end date.';
  }

  if (
    values.startDate &&
    values.endDate &&
    values.endDate <
      values.startDate
  ) {
    return 'End date cannot be earlier than start date.';
  }

  return null;
}

/* =========================================================
   VERIFY LECTURER

   IMPORTANT:
   users table contains:

   id
   name
   email
   phone
   password_hash
   role
   active
   created_at
   updated_at

   There are NO:
   first_name
   middle_name
   last_name
   status
========================================================= */

async function verifyLecturer(
  lecturerId: number
) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        email,
        phone,
        role,
        active

      FROM users

      WHERE
        id = $1
        AND role = 'lecturer'
        AND active = true

      LIMIT 1
    `,
    [lecturerId]
  );

  return result.rows[0] || null;
}

/* =========================================================
   VERIFY PROGRAM
========================================================= */

async function verifyProgram(
  programId: number
) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        code

      FROM lms_programs

      WHERE id = $1

      LIMIT 1
    `,
    [programId]
  );

  return result.rows[0] || null;
}

/* =========================================================
   VERIFY UNIT
========================================================= */

async function verifyUnit(
  unitId: number,
  programId: number
) {
  const result = await pool.query(
    `
      SELECT
        id,
        program_id,
        name,
        code

      FROM lms_units

      WHERE
        id = $1
        AND program_id = $2

      LIMIT 1
    `,
    [
      unitId,
      programId,
    ]
  );

  return result.rows[0] || null;
}

/* =========================================================
   GET
   /api/admin/timetable

   Query parameters:

   start_date
   end_date
   lecturer_id
   program_id
   unit_id
   status
   class_type
   search
========================================================= */

export async function GET(
  request: Request
) {
  try {
    const auth =
      authenticateAdmin();

    if (!auth.success) {
      return auth.response;
    }

    const url =
      new URL(request.url);

    const startDate =
      url.searchParams.get(
        'start_date'
      );

    const endDate =
      url.searchParams.get(
        'end_date'
      );

    const lecturerId =
      nullableNumber(
        url.searchParams.get(
          'lecturer_id'
        )
      );

    const programId =
      nullableNumber(
        url.searchParams.get(
          'program_id'
        )
      );

    const unitId =
      nullableNumber(
        url.searchParams.get(
          'unit_id'
        )
      );

    const status =
      cleanString(
        url.searchParams.get(
          'status'
        )
      );

    const classType =
      cleanString(
        url.searchParams.get(
          'class_type'
        )
      );

    const search =
      cleanString(
        url.searchParams.get(
          'search'
        )
      );

    /* =====================================================
       BUILD CONDITIONS
    ===================================================== */

    const conditions: string[] = [
      't.day_of_week BETWEEN 1 AND 5',
    ];

    const values: unknown[] = [];

    let parameterIndex = 1;

    /* DATE RANGE */

    if (
      startDate &&
      validDate(startDate)
    ) {
      conditions.push(`
        (
          t.start_date IS NULL
          OR t.end_date IS NULL
          OR t.end_date >= $${parameterIndex}::date
        )
      `);

      values.push(startDate);
      parameterIndex++;
    }

    if (
      endDate &&
      validDate(endDate)
    ) {
      conditions.push(`
        (
          t.start_date IS NULL
          OR t.start_date <= $${parameterIndex}::date
        )
      `);

      values.push(endDate);
      parameterIndex++;
    }

    /* LECTURER */

    if (lecturerId) {
      conditions.push(
        `t.lecturer_id = $${parameterIndex}`
      );

      values.push(lecturerId);
      parameterIndex++;
    }

    /* PROGRAM */

    if (programId) {
      conditions.push(
        `t.program_id = $${parameterIndex}`
      );

      values.push(programId);
      parameterIndex++;
    }

    /* UNIT */

    if (unitId) {
      conditions.push(
        `t.unit_id = $${parameterIndex}`
      );

      values.push(unitId);
      parameterIndex++;
    }

    /* STATUS */

    if (
      status &&
      ALLOWED_STATUSES.includes(
        status as (typeof ALLOWED_STATUSES)[number]
      )
    ) {
      conditions.push(
        `t.status = $${parameterIndex}`
      );

      values.push(status);
      parameterIndex++;
    }

    /* CLASS TYPE */

    if (
      classType &&
      ALLOWED_CLASS_TYPES.includes(
        classType as (typeof ALLOWED_CLASS_TYPES)[number]
      )
    ) {
      conditions.push(
        `t.class_type = $${parameterIndex}`
      );

      values.push(classType);
      parameterIndex++;
    }

    /* SEARCH */

    if (search) {
      conditions.push(`
        (
          t.title ILIKE $${parameterIndex}
          OR COALESCE(t.room, '') ILIKE $${parameterIndex}
          OR p.name ILIKE $${parameterIndex}
          OR p.code ILIKE $${parameterIndex}
          OR COALESCE(u.name, '') ILIKE $${parameterIndex}
          OR COALESCE(u.code, '') ILIKE $${parameterIndex}
          OR l.name ILIKE $${parameterIndex}
          OR l.email ILIKE $${parameterIndex}
          OR COALESCE(l.phone, '') ILIKE $${parameterIndex}
        )
      `);

      values.push(
        `%${search}%`
      );

      parameterIndex++;
    }

    /* =====================================================
       GET TIMETABLE
    ===================================================== */

    const timetableResult =
      await pool.query(
        `
          SELECT
            t.id,
            t.program_id,
            t.unit_id,
            t.lecturer_id,
            t.day_of_week,
            t.start_time,
            t.end_time,
            t.title,
            t.description,
            t.room,
            t.class_type,
            t.status,
            t.start_date,
            t.end_date,
            t.created_by,
            t.created_at,
            t.updated_at,

            p.name AS program_name,
            p.code AS program_code,

            u.name AS unit_name,
            u.code AS unit_code,

            l.name AS lecturer_name,
            l.email AS lecturer_email,
            l.phone AS lecturer_phone,
            l.active AS lecturer_active

          FROM lms_timetable t

          INNER JOIN lms_programs p
            ON p.id = t.program_id

          LEFT JOIN lms_units u
            ON u.id = t.unit_id

          INNER JOIN users l
            ON l.id = t.lecturer_id

          WHERE ${conditions.join(
            ' AND '
          )}

          ORDER BY
            t.day_of_week ASC,
            t.start_time ASC,
            t.end_time ASC,
            t.id ASC
        `,
        values
      );

    /* =====================================================
       GET LECTURERS

       Uses users.name and users.active.
    ===================================================== */

    const lecturersResult =
      await pool.query(
        `
          SELECT
            id,
            name,
            email,
            phone,
            role,
            active

          FROM users

          WHERE
            role = 'lecturer'

          ORDER BY
            name ASC,
            id ASC
        `
      );

    /* =====================================================
       GET PROGRAMS
    ===================================================== */

    const programsResult =
      await pool.query(
        `
          SELECT
            id,
            name,
            code

          FROM lms_programs

          ORDER BY
            name ASC
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
            u.program_id,
            u.name,
            u.code,

            p.name AS program_name,
            p.code AS program_code

          FROM lms_units u

          INNER JOIN lms_programs p
            ON p.id = u.program_id

          ORDER BY
            p.name ASC,
            u.name ASC
        `
      );

    /* =====================================================
       STATISTICS

       Statistics respect the same filters as the timetable
       where applicable.
    ===================================================== */

    const statisticsResult =
      await pool.query(
        `
          SELECT
            COUNT(*)::int AS total_classes,

            COUNT(*) FILTER (
              WHERE status = 'scheduled'
            )::int AS scheduled_classes,

            COUNT(*) FILTER (
              WHERE status = 'completed'
            )::int AS completed_classes,

            COUNT(*) FILTER (
              WHERE status = 'cancelled'
            )::int AS cancelled_classes,

            COUNT(
              DISTINCT lecturer_id
            )::int AS lecturers_count,

            COUNT(
              DISTINCT program_id
            )::int AS programs_count,

            COUNT(
              DISTINCT room
            ) FILTER (
              WHERE room IS NOT NULL
            )::int AS rooms_count,

            COALESCE(
              SUM(
                EXTRACT(
                  EPOCH FROM (
                    end_time - start_time
                  )
                ) / 3600
              ) FILTER (
                WHERE status <> 'cancelled'
              ),
              0
            )::numeric(10,2) AS total_hours

          FROM lms_timetable

          WHERE
            day_of_week BETWEEN 1 AND 5
        `
      );

    return NextResponse.json(
      {
        success: true,

        timetable:
          timetableResult.rows,

        lecturers:
          lecturersResult.rows,

        programs:
          programsResult.rows,

        units:
          unitsResult.rows,

        statistics:
          statisticsResult.rows[0] || {
            total_classes: 0,
            scheduled_classes: 0,
            completed_classes: 0,
            cancelled_classes: 0,
            lecturers_count: 0,
            programs_count: 0,
            rooms_count: 0,
            total_hours: 0,
          },
      },
      {
        status: 200,

        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error(
      'GET ADMIN TIMETABLE ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load timetable.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   /api/admin/timetable

   ADMIN CREATES TIMETABLE
========================================================= */

export async function POST(
  request: Request
) {
  try {
    const auth =
      authenticateAdmin();

    if (!auth.success) {
      return auth.response;
    }

    const admin =
      auth.admin;

    let body: TimetableBody;

    try {
      body =
        await request.json();
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

    const values =
      normalizeBody(body);

    const validationError =
      validateTimetableBody(
        values
      );

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message:
            validationError,
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY LECTURER
    ===================================================== */

    const lecturer =
      await verifyLecturer(
        values.lecturerId!
      );

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Selected lecturer was not found or is not an active lecturer.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY PROGRAM
    ===================================================== */

    const program =
      await verifyProgram(
        values.programId!
      );

    if (!program) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Selected program was not found.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY UNIT
    ===================================================== */

    if (values.unitId) {
      const unit =
        await verifyUnit(
          values.unitId,
          values.programId!
        );

      if (!unit) {
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
       CONFLICT CHECK
    ===================================================== */

    const conflictResult =
      await pool.query(
        `
          SELECT
            id,
            title,
            start_time,
            end_time,
            day_of_week,
            room

          FROM lms_timetable

          WHERE
            lecturer_id = $1

            AND day_of_week = $2

            AND status <> 'cancelled'

            AND start_time < $4::time
            AND end_time > $3::time

            AND (
              start_date IS NULL
              OR end_date IS NULL
              OR $5::date IS NULL
              OR end_date >= $5::date
            )

            AND (
              end_date IS NULL
              OR start_date IS NULL
              OR $6::date IS NULL
              OR start_date <= $6::date
            )

          LIMIT 1
        `,
        [
          values.lecturerId,
          values.dayOfWeek,
          values.startTime,
          values.endTime,
          values.startDate,
          values.endDate,
        ]
      );

    if (
      conflictResult.rows.length > 0
    ) {
      const conflict =
        conflictResult.rows[0];

      return NextResponse.json(
        {
          success: false,
          message:
            `Lecturer schedule conflict: "${conflict.title}" ` +
            `already occupies ${String(
              conflict.start_time
            ).slice(0, 5)}–${String(
              conflict.end_time
            ).slice(0, 5)} on this day.`,
          conflict,
        },
        { status: 409 }
      );
    }

    /* =====================================================
       ROOM CONFLICT
    ===================================================== */

    if (values.room) {
      const roomConflict =
        await pool.query(
          `
            SELECT
              id,
              title,
              lecturer_id,
              start_time,
              end_time,
              day_of_week

            FROM lms_timetable

            WHERE
              LOWER(TRIM(room)) =
              LOWER(TRIM($1))

              AND day_of_week = $2

              AND status <> 'cancelled'

              AND start_time < $4::time
              AND end_time > $3::time

              AND (
                start_date IS NULL
                OR end_date IS NULL
                OR $5::date IS NULL
                OR end_date >= $5::date
              )

              AND (
                end_date IS NULL
                OR start_date IS NULL
                OR $6::date IS NULL
                OR start_date <= $6::date
              )

            LIMIT 1
          `,
          [
            values.room,
            values.dayOfWeek,
            values.startTime,
            values.endTime,
            values.startDate,
            values.endDate,
          ]
        );

      if (
        roomConflict.rows.length > 0
      ) {
        const conflict =
          roomConflict.rows[0];

        return NextResponse.json(
          {
            success: false,
            message:
              `Room conflict: "${conflict.title}" ` +
              `already occupies room ${values.room} during this time.`,
            conflict,
          },
          { status: 409 }
        );
      }
    }

    /* =====================================================
       CREATE
    ===================================================== */

    const result =
      await pool.query(
        `
          INSERT INTO lms_timetable (
            program_id,
            unit_id,
            lecturer_id,
            day_of_week,
            start_time,
            end_time,
            title,
            description,
            room,
            class_type,
            status,
            start_date,
            end_date,
            created_by
          )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14
          )

          RETURNING *
        `,
        [
          values.programId,
          values.unitId,
          values.lecturerId,
          values.dayOfWeek,
          values.startTime,
          values.endTime,
          values.title,
          values.description,
          values.room,
          values.classType,
          values.status,
          values.startDate,
          values.endDate,

          nullableNumber(
            admin?.id ??
              admin?.user?.id
          ),
        ]
      );

    return NextResponse.json(
      {
        success: true,
        message:
          'Timetable entry created successfully.',
        timetable:
          result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      'CREATE ADMIN TIMETABLE ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to create timetable entry.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH
   /api/admin/timetable?id=123
========================================================= */

export async function PATCH(
  request: Request
) {
  try {
    const auth =
      authenticateAdmin();

    if (!auth.success) {
      return auth.response;
    }

    const url =
      new URL(request.url);

    const timetableId =
      nullableNumber(
        url.searchParams.get(
          'id'
        )
      );

    if (!timetableId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A timetable entry ID is required.',
        },
        { status: 400 }
      );
    }

    let body: TimetableBody;

    try {
      body =
        await request.json();
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

    const values =
      normalizeBody(body);

    const validationError =
      validateTimetableBody(
        values
      );

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message:
            validationError,
        },
        { status: 400 }
      );
    }

    /* =====================================================
       EXISTING ENTRY
    ===================================================== */

    const existing =
      await pool.query(
        `
          SELECT
            id

          FROM lms_timetable

          WHERE id = $1

          LIMIT 1
        `,
        [timetableId]
      );

    if (
      existing.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Timetable entry not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       VERIFY LECTURER
    ===================================================== */

    const lecturer =
      await verifyLecturer(
        values.lecturerId!
      );

    if (!lecturer) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Selected lecturer was not found or is not an active lecturer.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY PROGRAM
    ===================================================== */

    const program =
      await verifyProgram(
        values.programId!
      );

    if (!program) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Selected program was not found.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY UNIT
    ===================================================== */

    if (values.unitId) {
      const unit =
        await verifyUnit(
          values.unitId,
          values.programId!
        );

      if (!unit) {
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
       LECTURER CONFLICT
    ===================================================== */

    const conflictResult =
      await pool.query(
        `
          SELECT
            id,
            title,
            start_time,
            end_time,
            day_of_week,
            room

          FROM lms_timetable

          WHERE
            lecturer_id = $1

            AND id <> $2

            AND day_of_week = $3

            AND status <> 'cancelled'

            AND start_time < $5::time
            AND end_time > $4::time

            AND (
              start_date IS NULL
              OR end_date IS NULL
              OR $6::date IS NULL
              OR end_date >= $6::date
            )

            AND (
              end_date IS NULL
              OR start_date IS NULL
              OR $7::date IS NULL
              OR start_date <= $7::date
            )

          LIMIT 1
        `,
        [
          values.lecturerId,
          timetableId,
          values.dayOfWeek,
          values.startTime,
          values.endTime,
          values.startDate,
          values.endDate,
        ]
      );

    if (
      conflictResult.rows.length > 0
    ) {
      const conflict =
        conflictResult.rows[0];

      return NextResponse.json(
        {
          success: false,
          message:
            `Lecturer schedule conflict: "${conflict.title}" ` +
            `already occupies ${String(
              conflict.start_time
            ).slice(0, 5)}–${String(
              conflict.end_time
            ).slice(0, 5)} on this day.`,
          conflict,
        },
        { status: 409 }
      );
    }

    /* =====================================================
       ROOM CONFLICT
    ===================================================== */

    if (values.room) {
      const roomConflict =
        await pool.query(
          `
            SELECT
              id,
              title,
              lecturer_id,
              start_time,
              end_time,
              day_of_week

            FROM lms_timetable

            WHERE
              id <> $1

              AND LOWER(TRIM(room)) =
                  LOWER(TRIM($2))

              AND day_of_week = $3

              AND status <> 'cancelled'

              AND start_time < $5::time
              AND end_time > $4::time

              AND (
                start_date IS NULL
                OR end_date IS NULL
                OR $6::date IS NULL
                OR end_date >= $6::date
              )

              AND (
                end_date IS NULL
                OR start_date IS NULL
                OR $7::date IS NULL
                OR start_date <= $7::date
              )

            LIMIT 1
          `,
          [
            timetableId,
            values.room,
            values.dayOfWeek,
            values.startTime,
            values.endTime,
            values.startDate,
            values.endDate,
          ]
        );

      if (
        roomConflict.rows.length > 0
      ) {
        const conflict =
          roomConflict.rows[0];

        return NextResponse.json(
          {
            success: false,
            message:
              `Room conflict: "${conflict.title}" ` +
              `already occupies room ${values.room} during this time.`,
            conflict,
          },
          { status: 409 }
        );
      }
    }

    /* =====================================================
       UPDATE
    ===================================================== */

    const result =
      await pool.query(
        `
          UPDATE lms_timetable

          SET
            program_id = $1,
            unit_id = $2,
            lecturer_id = $3,
            day_of_week = $4,
            start_time = $5,
            end_time = $6,
            title = $7,
            description = $8,
            room = $9,
            class_type = $10,
            status = $11,
            start_date = $12,
            end_date = $13,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $14

          RETURNING *
        `,
        [
          values.programId,
          values.unitId,
          values.lecturerId,
          values.dayOfWeek,
          values.startTime,
          values.endTime,
          values.title,
          values.description,
          values.room,
          values.classType,
          values.status,
          values.startDate,
          values.endDate,
          timetableId,
        ]
      );

    return NextResponse.json(
      {
        success: true,
        message:
          'Timetable entry updated successfully.',
        timetable:
          result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'UPDATE ADMIN TIMETABLE ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update timetable entry.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
   /api/admin/timetable?id=123
========================================================= */

export async function DELETE(
  request: Request
) {
  try {
    const auth =
      authenticateAdmin();

    if (!auth.success) {
      return auth.response;
    }

    const url =
      new URL(request.url);

    const timetableId =
      nullableNumber(
        url.searchParams.get(
          'id'
        )
      );

    if (!timetableId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'A timetable entry ID is required.',
        },
        { status: 400 }
      );
    }

    const result =
      await pool.query(
        `
          DELETE FROM lms_timetable

          WHERE id = $1

          RETURNING id
        `,
        [timetableId]
      );

    if (
      result.rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Timetable entry not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Timetable entry deleted successfully.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'DELETE ADMIN TIMETABLE ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to delete timetable entry.',
      },
      { status: 500 }
    );
  }
}

