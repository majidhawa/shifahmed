import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireLecturer } from '@/lib/lecturer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================================================
   TYPES
========================================================= */

type LecturerAuth = {
  id?: number | string;
  user?: {
    id?: number | string;
  };
  lecturer?: {
    id?: number | string;
  };
};

/* =========================================================
   HELPERS
========================================================= */

function getLecturerId(auth: LecturerAuth | null | undefined): number | null {
  const possibleId =
    auth?.id ??
    auth?.user?.id ??
    auth?.lecturer?.id;

  if (
    possibleId === undefined ||
    possibleId === null ||
    possibleId === ''
  ) {
    return null;
  }

  const lecturerId = Number(possibleId);

  if (!Number.isInteger(lecturerId) || lecturerId <= 0) {
    return null;
  }

  return lecturerId;
}

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
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

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
   AUTHENTICATION
========================================================= */

async function authenticateLecturer() {
  try {
    const auth = (await requireLecturer()) as LecturerAuth;

    const lecturerId = getLecturerId(auth);

    if (!lecturerId) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            message: 'Unable to identify the logged-in lecturer.',
          },
          { status: 401 }
        ),
      };
    }

    return {
      success: true,
      lecturerId,
    };
  } catch (error) {
    console.error(
      'LECTURER TIMETABLE AUTH ERROR:',
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
   GET
   /api/lecturer/timetable

   Query parameters:

   start_date
   end_date
   program_id
   status
========================================================= */

export async function GET(request: Request) {
  try {
    const auth = await authenticateLecturer();

    if (!auth.success) {
      return auth.response;
    }

    const lecturerId = auth.lecturerId;

    const url = new URL(request.url);

    const startDate =
      url.searchParams.get('start_date');

    const endDate =
      url.searchParams.get('end_date');

    const programIdParam =
      url.searchParams.get('program_id');

    const statusParam =
      url.searchParams.get('status');

    const programId =
      nullableNumber(programIdParam);

    /* =====================================================
       BUILD FILTERS
    ===================================================== */

    const conditions: string[] = [
      't.lecturer_id = $1',
      't.day_of_week BETWEEN 1 AND 5',
    ];

    const values: unknown[] = [lecturerId];

    let parameterIndex = 2;

    /* -----------------------------------------------------
       DATE FILTER
    ----------------------------------------------------- */

    if (startDate && validDate(startDate)) {
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

    if (endDate && validDate(endDate)) {
      conditions.push(`
        (
          t.start_date IS NULL
          OR t.start_date <= $${parameterIndex}::date
        )
      `);

      values.push(endDate);
      parameterIndex++;
    }

    /* -----------------------------------------------------
       PROGRAM FILTER
    ----------------------------------------------------- */

    if (programId) {
      conditions.push(
        `t.program_id = $${parameterIndex}`
      );

      values.push(programId);
      parameterIndex++;
    }

    /* -----------------------------------------------------
       STATUS FILTER
    ----------------------------------------------------- */

    if (
      statusParam &&
      ALLOWED_STATUSES.includes(
        statusParam as (typeof ALLOWED_STATUSES)[number]
      )
    ) {
      conditions.push(
        `t.status = $${parameterIndex}`
      );

      values.push(statusParam);
      parameterIndex++;
    }

    /* =====================================================
       QUERY TIMETABLE
    ===================================================== */

    const result = await pool.query(
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
          u.code AS unit_code

        FROM lms_timetable t

        INNER JOIN lms_programs p
          ON p.id = t.program_id

        LEFT JOIN lms_units u
          ON u.id = t.unit_id

        WHERE ${conditions.join(' AND ')}

        ORDER BY
          t.day_of_week ASC,
          t.start_time ASC,
          t.end_time ASC,
          t.id ASC
      `,
      values
    );

    /* =====================================================
       GET LECTURER PROGRAMS

       These are the programs the lecturer is allowed
       to use when creating timetable entries.
    ===================================================== */

    const programsResult = await pool.query(
      `
        SELECT
          p.id,
          p.name,
          p.code

        FROM lms_lecturer_programs lp

        INNER JOIN lms_programs p
          ON p.id = lp.program_id

        WHERE lp.lecturer_id = $1

        ORDER BY p.name ASC
      `,
      [lecturerId]
    );

    /* =====================================================
       GET UNITS FOR LECTURER PROGRAMS
    ===================================================== */

    const unitsResult = await pool.query(
      `
        SELECT
          u.id,
          u.program_id,
          u.name,
          u.code

        FROM lms_units u

        INNER JOIN lms_lecturer_programs lp
          ON lp.program_id = u.program_id

        WHERE lp.lecturer_id = $1

        ORDER BY
          u.program_id ASC,
          u.name ASC
      `,
      [lecturerId]
    );

    /* =====================================================
       STATISTICS
    ===================================================== */

    const statisticsConditions = [
      't.lecturer_id = $1',
      't.day_of_week BETWEEN 1 AND 5',
    ];

    const statisticsValues: unknown[] = [
      lecturerId,
    ];

    let statisticsParameter = 2;

    if (startDate && validDate(startDate)) {
      statisticsConditions.push(`
        (
          t.start_date IS NULL
          OR t.end_date IS NULL
          OR t.end_date >= $${statisticsParameter}::date
        )
      `);

      statisticsValues.push(startDate);
      statisticsParameter++;
    }

    if (endDate && validDate(endDate)) {
      statisticsConditions.push(`
        (
          t.start_date IS NULL
          OR t.start_date <= $${statisticsParameter}::date
        )
      `);

      statisticsValues.push(endDate);
      statisticsParameter++;
    }

    const statisticsResult = await pool.query(
      `
        SELECT
          COUNT(*)::int AS total_classes,

          COUNT(*) FILTER (
            WHERE t.status = 'scheduled'
          )::int AS scheduled_classes,

          COUNT(*) FILTER (
            WHERE t.status = 'completed'
          )::int AS completed_classes,

          COUNT(*) FILTER (
            WHERE t.status = 'cancelled'
          )::int AS cancelled_classes,

          COUNT(
            DISTINCT t.program_id
          )::int AS programs_count,

          COALESCE(
            SUM(
              EXTRACT(
                EPOCH FROM (
                  t.end_time - t.start_time
                )
              ) / 3600
            ) FILTER (
              WHERE t.status <> 'cancelled'
            ),
            0
          )::numeric(10,2) AS total_hours

        FROM lms_timetable t

        WHERE ${statisticsConditions.join(' AND ')}
      `,
      statisticsValues
    );

    return NextResponse.json(
      {
        success: true,

        timetable: result.rows,

        programs: programsResult.rows,

        units: unitsResult.rows,

        statistics:
          statisticsResult.rows[0] || {
            total_classes: 0,
            scheduled_classes: 0,
            completed_classes: 0,
            cancelled_classes: 0,
            programs_count: 0,
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
      'GET LECTURER TIMETABLE ERROR:',
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
   /api/lecturer/timetable

   Creates a timetable entry.
========================================================= */

export async function POST(request: Request) {
  try {
    const auth = await authenticateLecturer();

    if (!auth.success) {
      return auth.response;
    }

    const lecturerId = auth.lecturerId;

    /* =====================================================
       READ BODY
    ===================================================== */

    let body: Record<string, unknown>;

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
       READ VALUES
    ===================================================== */

    const programId =
      nullableNumber(body.program_id);

    const unitId =
      nullableNumber(body.unit_id);

    const dayOfWeek =
      Number(body.day_of_week);

    const startTime =
      cleanString(body.start_time);

    const endTime =
      cleanString(body.end_time);

    const title =
      cleanString(body.title);

    const description =
      nullableString(body.description);

    const room =
      nullableString(body.room);

    const classType =
      cleanString(body.class_type) ||
      'lecture';

    const status =
      cleanString(body.status) ||
      'scheduled';

    const startDate =
      nullableString(body.start_date);

    const endDate =
      nullableString(body.end_date);

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!programId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please select a program.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 1 ||
      dayOfWeek > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid day. The lecturer timetable only supports Monday to Friday.',
        },
        { status: 400 }
      );
    }

    if (!validTime(startTime)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a valid start time.',
        },
        { status: 400 }
      );
    }

    if (!validTime(endTime)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a valid end time.',
        },
        { status: 400 }
      );
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        {
          success: false,
          message:
            'End time must be later than start time.',
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Class title is required.',
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_CLASS_TYPES.includes(
        classType as (typeof ALLOWED_CLASS_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid class type.',
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_STATUSES.includes(
        status as (typeof ALLOWED_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid timetable status.',
        },
        { status: 400 }
      );
    }

    if (startDate && !validDate(startDate)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid start date.',
        },
        { status: 400 }
      );
    }

    if (endDate && !validDate(endDate)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid end date.',
        },
        { status: 400 }
      );
    }

    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'End date cannot be earlier than start date.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY PROGRAM ASSIGNMENT
    ===================================================== */

    const programAccess =
      await pool.query(
        `
          SELECT
            p.id,
            p.name,
            p.code

          FROM lms_lecturer_programs lp

          INNER JOIN lms_programs p
            ON p.id = lp.program_id

          WHERE
            lp.lecturer_id = $1
            AND lp.program_id = $2

          LIMIT 1
        `,
        [lecturerId, programId]
      );

    if (programAccess.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to schedule classes for this program.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       VERIFY UNIT

       If a unit is supplied, it must belong to the
       selected program and one of the lecturer's programs.
    ===================================================== */

    if (unitId) {
      const unitAccess =
        await pool.query(
          `
            SELECT id

            FROM lms_units

            WHERE
              id = $1
              AND program_id = $2

            LIMIT 1
          `,
          [unitId, programId]
        );

      if (unitAccess.rows.length === 0) {
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
       CHECK SCHEDULE CONFLICT

       A lecturer cannot have overlapping classes on
       the same day.

       Date ranges are also respected where supplied.
    ===================================================== */

    const conflictResult =
      await pool.query(
        `
          SELECT
            id,
            title,
            start_time,
            end_time,
            day_of_week

          FROM lms_timetable

          WHERE
            lecturer_id = $1
            AND day_of_week = $2

            AND status <> 'cancelled'

            AND start_time < $4::time
            AND end_time > $3::time

            AND (
              start_date IS NULL
              OR $5::date IS NULL
              OR end_date IS NULL
              OR end_date >= $5::date
            )

            AND (
              end_date IS NULL
              OR $6::date IS NULL
              OR start_date IS NULL
              OR start_date <= $6::date
            )

          LIMIT 1
        `,
        [
          lecturerId,
          dayOfWeek,
          startTime,
          endTime,
          startDate,
          endDate,
        ]
      );

    if (conflictResult.rows.length > 0) {
      const conflict =
        conflictResult.rows[0];

      return NextResponse.json(
        {
          success: false,
          message:
            `Schedule conflict: "${conflict.title}" ` +
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
       CREATE
    ===================================================== */

    const result = await pool.query(
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
          $3
        )

        RETURNING *
      `,
      [
        programId,
        unitId,
        lecturerId,
        dayOfWeek,
        startTime,
        endTime,
        title,
        description,
        room,
        classType,
        status,
        startDate,
        endDate,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message:
          'Timetable entry created successfully.',
        timetable: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      'CREATE LECTURER TIMETABLE ERROR:',
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
   /api/lecturer/timetable?id=123

   Updates a timetable entry.
========================================================= */

export async function PATCH(request: Request) {
  try {
    const auth = await authenticateLecturer();

    if (!auth.success) {
      return auth.response;
    }

    const lecturerId = auth.lecturerId;

    const url = new URL(request.url);

    const timetableId =
      nullableNumber(
        url.searchParams.get('id')
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

    /* =====================================================
       READ BODY
    ===================================================== */

    let body: Record<string, unknown>;

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

    const programId =
      nullableNumber(body.program_id);

    const unitId =
      nullableNumber(body.unit_id);

    const dayOfWeek =
      Number(body.day_of_week);

    const startTime =
      cleanString(body.start_time);

    const endTime =
      cleanString(body.end_time);

    const title =
      cleanString(body.title);

    const description =
      nullableString(body.description);

    const room =
      nullableString(body.room);

    const classType =
      cleanString(body.class_type) ||
      'lecture';

    const status =
      cleanString(body.status) ||
      'scheduled';

    const startDate =
      nullableString(body.start_date);

    const endDate =
      nullableString(body.end_date);

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (!programId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please select a program.',
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 1 ||
      dayOfWeek > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid day. Only Monday to Friday are allowed.',
        },
        { status: 400 }
      );
    }

    if (!validTime(startTime)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a valid start time.',
        },
        { status: 400 }
      );
    }

    if (!validTime(endTime)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please provide a valid end time.',
        },
        { status: 400 }
      );
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        {
          success: false,
          message:
            'End time must be later than start time.',
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Class title is required.',
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_CLASS_TYPES.includes(
        classType as (typeof ALLOWED_CLASS_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid class type.',
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_STATUSES.includes(
        status as (typeof ALLOWED_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid timetable status.',
        },
        { status: 400 }
      );
    }

    if (startDate && !validDate(startDate)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid start date.',
        },
        { status: 400 }
      );
    }

    if (endDate && !validDate(endDate)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid end date.',
        },
        { status: 400 }
      );
    }

    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'End date cannot be earlier than start date.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY EXISTING ENTRY BELONGS TO LECTURER
    ===================================================== */

    const existing =
      await pool.query(
        `
          SELECT *
          FROM lms_timetable

          WHERE
            id = $1
            AND lecturer_id = $2

          LIMIT 1
        `,
        [timetableId, lecturerId]
      );

    if (existing.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Timetable entry not found or you are not authorized to edit it.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       VERIFY PROGRAM
    ===================================================== */

    const programAccess =
      await pool.query(
        `
          SELECT id
          FROM lms_lecturer_programs

          WHERE
            lecturer_id = $1
            AND program_id = $2

          LIMIT 1
        `,
        [lecturerId, programId]
      );

    if (programAccess.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You are not authorized to use this program.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       VERIFY UNIT
    ===================================================== */

    if (unitId) {
      const unitAccess =
        await pool.query(
          `
            SELECT id
            FROM lms_units

            WHERE
              id = $1
              AND program_id = $2

            LIMIT 1
          `,
          [unitId, programId]
        );

      if (unitAccess.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              'The selected unit does not belong to this program.',
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       CONFLICT CHECK

       Exclude the current timetable entry.
    ===================================================== */

    const conflictResult =
      await pool.query(
        `
          SELECT
            id,
            title,
            start_time,
            end_time,
            day_of_week

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
              OR $6::date IS NULL
              OR end_date IS NULL
              OR end_date >= $6::date
            )

            AND (
              end_date IS NULL
              OR $7::date IS NULL
              OR start_date IS NULL
              OR start_date <= $7::date
            )

          LIMIT 1
        `,
        [
          lecturerId,
          timetableId,
          dayOfWeek,
          startTime,
          endTime,
          startDate,
          endDate,
        ]
      );

    if (conflictResult.rows.length > 0) {
      const conflict =
        conflictResult.rows[0];

      return NextResponse.json(
        {
          success: false,
          message:
            `Schedule conflict: "${conflict.title}" ` +
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
       UPDATE
    ===================================================== */

    const result =
      await pool.query(
        `
          UPDATE lms_timetable

          SET
            program_id = $1,
            unit_id = $2,
            day_of_week = $3,
            start_time = $4,
            end_time = $5,
            title = $6,
            description = $7,
            room = $8,
            class_type = $9,
            status = $10,
            start_date = $11,
            end_date = $12,
            updated_at = CURRENT_TIMESTAMP

          WHERE
            id = $13
            AND lecturer_id = $14

          RETURNING *
        `,
        [
          programId,
          unitId,
          dayOfWeek,
          startTime,
          endTime,
          title,
          description,
          room,
          classType,
          status,
          startDate,
          endDate,
          timetableId,
          lecturerId,
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
      'UPDATE LECTURER TIMETABLE ERROR:',
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
   /api/lecturer/timetable?id=123
========================================================= */

export async function DELETE(request: Request) {
  try {
    const auth = await authenticateLecturer();

    if (!auth.success) {
      return auth.response;
    }

    const lecturerId = auth.lecturerId;

    const url = new URL(request.url);

    const timetableId =
      nullableNumber(
        url.searchParams.get('id')
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

    /* =====================================================
       DELETE ONLY OWN ENTRY
    ===================================================== */

    const result =
      await pool.query(
        `
          DELETE FROM lms_timetable

          WHERE
            id = $1
            AND lecturer_id = $2

          RETURNING id
        `,
        [
          timetableId,
          lecturerId,
        ]
      );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Timetable entry not found or you are not authorized to delete it.',
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
      'DELETE LECTURER TIMETABLE ERROR:',
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