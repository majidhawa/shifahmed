'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Filter,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
  BookOpen,
  Eye,
  CalendarCheck,
  XCircle,
  Building2,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Lecturer = {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
};

type Program = {
  id: number;
  name: string;
  code?: string | null;
};

type Unit = {
  id: number;
  program_id: number;
  name: string;
  code?: string | null;
  program_name?: string | null;
  program_code?: string | null;
};

type TimetableEntry = {
  id: number;

  program_id: number;
  unit_id?: number | null;
  lecturer_id: number;

  day_of_week: number;

  start_time: string;
  end_time: string;

  title: string;
  description?: string | null;
  room?: string | null;

  class_type:
    | 'lecture'
    | 'practical'
    | 'tutorial'
    | 'exam'
    | 'meeting'
    | 'other';

  status:
    | 'scheduled'
    | 'completed'
    | 'cancelled';

  start_date?: string | null;
  end_date?: string | null;

  created_by?: number | null;
  created_at?: string;
  updated_at?: string;

  program_name?: string | null;
  program_code?: string | null;

  unit_name?: string | null;
  unit_code?: string | null;

  lecturer_first_name?: string | null;
  lecturer_middle_name?: string | null;
  lecturer_last_name?: string | null;
  lecturer_email?: string | null;
  lecturer_phone?: string | null;
};

type Statistics = {
  total_classes: number;
  scheduled_classes: number;
  completed_classes: number;
  cancelled_classes: number;
  lecturers_count: number;
  programs_count: number;
  rooms_count: number;
  total_hours: number;
};

type ApiResponse = {
  success: boolean;
  message?: string;

  timetable?: TimetableEntry[];
  lecturers?: Lecturer[];
  programs?: Program[];
  units?: Unit[];

  statistics?: Statistics;
};

type TimetableForm = {
  lecturer_id: string;
  program_id: string;
  unit_id: string;

  day_of_week: string;

  start_time: string;
  end_time: string;

  title: string;
  description: string;

  room: string;

  class_type: string;
  status: string;

  start_date: string;
  end_date: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const DAYS = [
  {
    value: 1,
    label: 'Monday',
    short: 'Mon',
  },
  {
    value: 2,
    label: 'Tuesday',
    short: 'Tue',
  },
  {
    value: 3,
    label: 'Wednesday',
    short: 'Wed',
  },
  {
    value: 4,
    label: 'Thursday',
    short: 'Thu',
  },
  {
    value: 5,
    label: 'Friday',
    short: 'Fri',
  },
];

const CLASS_TYPES = [
  {
    value: 'lecture',
    label: 'Lecture',
  },
  {
    value: 'practical',
    label: 'Practical',
  },
  {
    value: 'tutorial',
    label: 'Tutorial',
  },
  {
    value: 'exam',
    label: 'Exam',
  },
  {
    value: 'meeting',
    label: 'Meeting',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

const STATUSES = [
  {
    value: 'scheduled',
    label: 'Scheduled',
  },
  {
    value: 'completed',
    label: 'Completed',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getMonday(
  date: Date
) {
  const result =
    new Date(date);

  const day =
    result.getDay();

  const diff =
    day === 0
      ? -6
      : 1 - day;

  result.setDate(
    result.getDate() + diff
  );

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;
}

function addDays(
  date: Date,
  amount: number
) {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() + amount
  );

  return result;
}

function formatISODate(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      date.getDate()
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(
  value: string
) {
  if (!value) {
    return '—';
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    'en-KE',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

function formatTime(
  value: string
) {
  if (!value) {
    return '';
  }

  return String(
    value
  ).slice(0, 5);
}

function formatDuration(
  start: string,
  end: string
) {
  const startParts =
    formatTime(start)
      .split(':')
      .map(Number);

  const endParts =
    formatTime(end)
      .split(':')
      .map(Number);

  if (
    startParts.length !== 2 ||
    endParts.length !== 2
  ) {
    return '';
  }

  const startMinutes =
    startParts[0] * 60 +
    startParts[1];

  const endMinutes =
    endParts[0] * 60 +
    endParts[1];

  const minutes =
    endMinutes -
    startMinutes;

  if (minutes <= 0) {
    return '';
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const remaining =
    minutes % 60;

  if (hours === 0) {
    return `${remaining} min`;
  }

  if (remaining === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remaining} min`;
}

function getDayName(
  day: number
) {
  return (
    DAYS.find(
      (item) =>
        item.value === day
    )?.label ||
    'Unknown'
  );
}

function getClassTypeLabel(
  value: string
) {
  return (
    CLASS_TYPES.find(
      (item) =>
        item.value === value
    )?.label ||
    value
  );
}

function getLecturerName(
  lecturer?: Lecturer
) {
  if (!lecturer) {
    return 'Unassigned';
  }

  return [
    lecturer.first_name,
    lecturer.middle_name,
    lecturer.last_name,
  ]
    .filter(Boolean)
    .join(' ');
}

function getEntryLecturerName(
  entry: TimetableEntry
) {
  return [
    entry.lecturer_first_name,
    entry.lecturer_middle_name,
    entry.lecturer_last_name,
  ]
    .filter(Boolean)
    .join(' ') || 'Unknown Lecturer';
}

/* =========================================================
   DEFAULT FORM
========================================================= */

const DEFAULT_FORM: TimetableForm = {
  lecturer_id: '',
  program_id: '',
  unit_id: '',

  day_of_week: '1',

  start_time: '08:00',
  end_time: '09:00',

  title: '',
  description: '',

  room: '',

  class_type: 'lecture',
  status: 'scheduled',

  start_date: '',
  end_date: '',
};

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/10 px-2.5 py-1 text-xs font-bold text-brand-green">
      <Clock3 className="h-3.5 w-3.5" />
      Scheduled
    </span>
  );
}

/* =========================================================
   CLASS TYPE STYLE
========================================================= */

function getClassStyle(
  type: string,
  status: string
) {
  if (status === 'cancelled') {
    return 'border-red-200 bg-red-50 text-red-800';
  }

  switch (type) {
    case 'practical':
      return 'border-brand-green/30 bg-brand-green/10 text-brand-dark';

    case 'tutorial':
      return 'border-brand-gold/30 bg-brand-gold/10 text-brand-dark';

    case 'exam':
      return 'border-purple-200 bg-purple-50 text-purple-800';

    case 'meeting':
      return 'border-slate-300 bg-slate-100 text-slate-800';

    default:
      return 'border-brand-green/20 bg-white text-brand-dark';
  }
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-black text-brand-dark">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/10">
          <Icon className="h-5 w-5 text-brand-green" />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminTimetablePage() {
  const [timetable, setTimetable] =
    useState<TimetableEntry[]>([]);

  const [lecturers, setLecturers] =
    useState<Lecturer[]>([]);

  const [programs, setPrograms] =
    useState<Program[]>([]);

  const [units, setUnits] =
    useState<Unit[]>([]);

  const [statistics, setStatistics] =
    useState<Statistics>({
      total_classes: 0,
      scheduled_classes: 0,
      completed_classes: 0,
      cancelled_classes: 0,
      lecturers_count: 0,
      programs_count: 0,
      rooms_count: 0,
      total_hours: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState<number | null>(null);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [weekStart, setWeekStart] =
    useState(
      getMonday(new Date())
    );

  const [search, setSearch] =
    useState('');

  const [lecturerFilter, setLecturerFilter] =
    useState('');

  const [programFilter, setProgramFilter] =
    useState('');

  const [unitFilter, setUnitFilter] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('');

  const [classTypeFilter, setClassTypeFilter] =
    useState('');

  const [showFilters, setShowFilters] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState<TimetableEntry | null>(
      null
    );

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<TimetableForm>(
      DEFAULT_FORM
    );

  /* =======================================================
     WEEK DATES
  ======================================================= */

  const weekEnd = useMemo(
    () =>
      addDays(
        weekStart,
        4
      ),
    [weekStart]
  );

  const weekStartISO =
    formatISODate(
      weekStart
    );

  const weekEndISO =
    formatISODate(
      weekEnd
    );

  /* =======================================================
     LOAD TIMETABLE
  ======================================================= */

  const loadTimetable =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError('');

          const params =
            new URLSearchParams();

          params.set(
            'start_date',
            weekStartISO
          );

          params.set(
            'end_date',
            weekEndISO
          );

          if (
            lecturerFilter
          ) {
            params.set(
              'lecturer_id',
              lecturerFilter
            );
          }

          if (
            programFilter
          ) {
            params.set(
              'program_id',
              programFilter
            );
          }

          if (unitFilter) {
            params.set(
              'unit_id',
              unitFilter
            );
          }

          if (statusFilter) {
            params.set(
              'status',
              statusFilter
            );
          }

          if (
            classTypeFilter
          ) {
            params.set(
              'class_type',
              classTypeFilter
            );
          }

          if (search.trim()) {
            params.set(
              'search',
              search.trim()
            );
          }

          const response =
            await fetch(
              `/api/admin/timetable?${params.toString()}`,
              {
                cache: 'no-store',
              }
            );

          const result: ApiResponse =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                'Unable to load timetable.'
            );
          }

          setTimetable(
            result.timetable ||
              []
          );

          setLecturers(
            result.lecturers ||
              []
          );

          setPrograms(
            result.programs ||
              []
          );

          setUnits(
            result.units ||
              []
          );

          setStatistics(
            result.statistics || {
              total_classes: 0,
              scheduled_classes: 0,
              completed_classes: 0,
              cancelled_classes: 0,
              lecturers_count: 0,
              programs_count: 0,
              rooms_count: 0,
              total_hours: 0,
            }
          );
        } catch (err) {
          console.error(err);

          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load timetable.'
          );
        } finally {
          setLoading(false);
        }
      },
      [
        weekStartISO,
        weekEndISO,
        lecturerFilter,
        programFilter,
        unitFilter,
        statusFilter,
        classTypeFilter,
        search,
      ]
    );

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  /* =======================================================
     CLEAR ALERTS
  ======================================================= */

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setSuccess('');
        },
        4000
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [success]);

  /* =======================================================
     FILTERED UNITS
  ======================================================= */

  const formUnits =
    useMemo(() => {
      if (!form.program_id) {
        return [];
      }

      return units.filter(
        (unit) =>
          String(
            unit.program_id
          ) ===
          form.program_id
      );
    }, [
      units,
      form.program_id,
    ]);

  const filterUnits =
    useMemo(() => {
      if (!programFilter) {
        return units;
      }

      return units.filter(
        (unit) =>
          String(
            unit.program_id
          ) ===
          programFilter
      );
    }, [
      units,
      programFilter,
    ]);

  /* =======================================================
     WEEK GROUPING
  ======================================================= */

  const entriesByDay =
    useMemo(() => {
      const grouped: Record<
        number,
        TimetableEntry[]
      > = {
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
      };

      for (
        const entry of timetable
      ) {
        if (
          grouped[
            entry.day_of_week
          ]
        ) {
          grouped[
            entry.day_of_week
          ].push(entry);
        }
      }

      return grouped;
    }, [timetable]);

  /* =======================================================
     TODAY
  ======================================================= */

  const today =
    new Date();

  const todayDay =
    today.getDay();

  const todayEntries =
    todayDay >= 1 &&
    todayDay <= 5
      ? entriesByDay[
          todayDay
        ] || []
      : [];

  /* =======================================================
     NAVIGATION
  ======================================================= */

  function previousWeek() {
    setWeekStart(
      addDays(
        weekStart,
        -7
      )
    );
  }

  function nextWeek() {
    setWeekStart(
      addDays(
        weekStart,
        7
      )
    );
  }

  function goToday() {
    setWeekStart(
      getMonday(
        new Date()
      )
    );
  }

  /* =======================================================
     OPEN CREATE MODAL
  ======================================================= */

  function openCreate(
    day = 1
  ) {
    setEditingId(null);

    setForm({
      ...DEFAULT_FORM,
      day_of_week:
        String(day),
    });

    setShowModal(true);
  }

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  function openEdit(
    entry: TimetableEntry
  ) {
    setEditingId(
      entry.id
    );

    setForm({
      lecturer_id:
        String(
          entry.lecturer_id
        ),

      program_id:
        String(
          entry.program_id
        ),

      unit_id:
        entry.unit_id
          ? String(
              entry.unit_id
            )
          : '',

      day_of_week:
        String(
          entry.day_of_week
        ),

      start_time:
        formatTime(
          entry.start_time
        ),

      end_time:
        formatTime(
          entry.end_time
        ),

      title:
        entry.title || '',

      description:
        entry.description ||
        '',

      room:
        entry.room || '',

      class_type:
        entry.class_type,

      status:
        entry.status,

      start_date:
        entry.start_date
          ? String(
              entry.start_date
            ).slice(0, 10)
          : '',

      end_date:
        entry.end_date
          ? String(
              entry.end_date
            ).slice(0, 10)
          : '',
    });

    setShowDetails(null);
    setShowModal(true);
  }

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingId(null);
    setForm(
      DEFAULT_FORM
    );
  }

  /* =======================================================
     FORM UPDATE
  ======================================================= */

  function updateForm(
    field: keyof TimetableForm,
    value: string
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,

        ...(field ===
          'program_id'
          ? {
              unit_id:
                '',
            }
          : {}),
      })
    );
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function handleSave(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        lecturer_id:
          Number(
            form.lecturer_id
          ),

        program_id:
          Number(
            form.program_id
          ),

        unit_id:
          form.unit_id
            ? Number(
                form.unit_id
              )
            : null,

        day_of_week:
          Number(
            form.day_of_week
          ),

        start_time:
          form.start_time,

        end_time:
          form.end_time,

        title:
          form.title.trim(),

        description:
          form.description.trim() ||
          null,

        room:
          form.room.trim() ||
          null,

        class_type:
          form.class_type,

        status:
          form.status,

        start_date:
          form.start_date ||
          null,

        end_date:
          form.end_date ||
          null,
      };

      const url =
        editingId
          ? `/api/admin/timetable?id=${editingId}`
          : '/api/admin/timetable';

      const response =
        await fetch(
          url,
          {
            method:
              editingId
                ? 'PATCH'
                : 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const result: ApiResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            'Unable to save timetable entry.'
        );
      }

      setSuccess(
        editingId
          ? 'Timetable entry updated successfully.'
          : 'Timetable entry created successfully.'
      );

      closeModal();

      await loadTimetable();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save timetable entry.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function handleDelete(
    id: number
  ) {
    const confirmed =
      window.confirm(
        'Are you sure you want to permanently delete this timetable entry?'
      );

    if (!confirmed) {
      return;
    }

    setDeleting(id);
    setError('');
    setSuccess('');

    try {
      const response =
        await fetch(
          `/api/admin/timetable?id=${id}`,
          {
            method: 'DELETE',
          }
        );

      const result: ApiResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            'Unable to delete timetable entry.'
        );
      }

      setShowDetails(
        null
      );

      setSuccess(
        'Timetable entry deleted successfully.'
      );

      await loadTimetable();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete timetable entry.'
      );
    } finally {
      setDeleting(null);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* =================================================
            HEADER
        ================================================== */}

        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-green to-brand-green p-6 text-white shadow-soft sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <CalendarDays className="h-6 w-6 text-brand-gold" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
                    Academic Administration
                  </p>

                  <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                    College Timetable
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">
                Manage the complete college timetable,
                assign classes to lecturers, coordinate
                rooms and monitor the weekly academic
                schedule from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                openCreate()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-brand-green shadow-lg transition hover:bg-brand-gold hover:text-brand-dark"
            >
              <Plus className="h-4 w-4" />
              Add Class
            </button>
          </div>
        </div>

        {/* =================================================
            ALERTS
        ================================================== */}

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="text-sm font-bold">
                Timetable error
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-brand-green/20 bg-brand-green/5 p-4 text-brand-green">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="text-sm font-bold">
              {success}
            </p>
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================== */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Classes"
            value={
              statistics.total_classes
            }
            icon={CalendarDays}
            description="Classes in the selected week"
          />

          <StatCard
            title="Lecturers"
            value={
              statistics.lecturers_count
            }
            icon={Users}
            description="Lecturers represented"
          />

          <StatCard
            title="Programs"
            value={
              statistics.programs_count
            }
            icon={GraduationCap}
            description="Programs on timetable"
          />

          <StatCard
            title="Teaching Hours"
            value={`${Number(
              statistics.total_hours || 0
            ).toFixed(1)}h`}
            icon={Clock3}
            description="Non-cancelled scheduled hours"
          />
        </div>

        {/* =================================================
            WEEK NAVIGATION
        ================================================== */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-green">
                Weekly Schedule
              </p>

              <h2 className="mt-1 text-lg font-black text-brand-dark">
                {weekStart.toLocaleDateString(
                  'en-KE',
                  {
                    day: '2-digit',
                    month: 'short',
                  }
                )}{' '}
                —{' '}
                {weekEnd.toLocaleDateString(
                  'en-KE',
                  {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }
                )}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={
                  previousWeek
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-brand-green hover:text-brand-green"
                title="Previous week"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={
                  goToday
                }
                className="rounded-xl border border-brand-green/20 bg-brand-green/5 px-4 py-2.5 text-sm font-bold text-brand-green transition hover:bg-brand-green hover:text-white"
              >
                Today
              </button>

              <button
                type="button"
                onClick={
                  nextWeek
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-brand-green hover:text-brand-green"
                title="Next week"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={
                  loadTimetable
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-brand-green hover:text-brand-green"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loading
                      ? 'animate-spin'
                      : ''
                  }`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            FILTERS
        ================================================== */}

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search class, lecturer, program, unit or room..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (current) =>
                    !current
                )
              }
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                showFilters
                  ? 'border-brand-green bg-brand-green text-white'
                  : 'border-slate-200 text-slate-600 hover:border-brand-green hover:text-brand-green'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="border-t border-slate-100 p-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {/* LECTURER */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Lecturer
                  </label>

                  <select
                    value={
                      lecturerFilter
                    }
                    onChange={(event) =>
                      setLecturerFilter(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-green"
                  >
                    <option value="">
                      All lecturers
                    </option>

                    {lecturers.map(
                      (lecturer) => (
                        <option
                          key={
                            lecturer.id
                          }
                          value={
                            lecturer.id
                          }
                        >
                          {getLecturerName(
                            lecturer
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* PROGRAM */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Program
                  </label>

                  <select
                    value={
                      programFilter
                    }
                    onChange={(event) => {
                      setProgramFilter(
                        event.target.value
                      );

                      setUnitFilter(
                        ''
                      );
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-green"
                  >
                    <option value="">
                      All programs
                    </option>

                    {programs.map(
                      (program) => (
                        <option
                          key={
                            program.id
                          }
                          value={
                            program.id
                          }
                        >
                          {program.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* UNIT */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Unit
                  </label>

                  <select
                    value={
                      unitFilter
                    }
                    onChange={(event) =>
                      setUnitFilter(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-green"
                  >
                    <option value="">
                      All units
                    </option>

                    {filterUnits.map(
                      (unit) => (
                        <option
                          key={
                            unit.id
                          }
                          value={
                            unit.id
                          }
                        >
                          {unit.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* STATUS */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </label>

                  <select
                    value={
                      statusFilter
                    }
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-green"
                  >
                    <option value="">
                      All statuses
                    </option>

                    {STATUSES.map(
                      (status) => (
                        <option
                          key={
                            status.value
                          }
                          value={
                            status.value
                          }
                        >
                          {status.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* CLASS TYPE */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Class Type
                  </label>

                  <select
                    value={
                      classTypeFilter
                    }
                    onChange={(event) =>
                      setClassTypeFilter(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-green"
                  >
                    <option value="">
                      All types
                    </option>

                    {CLASS_TYPES.map(
                      (type) => (
                        <option
                          key={
                            type.value
                          }
                          value={
                            type.value
                          }
                        >
                          {type.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setLecturerFilter('');
                    setProgramFilter('');
                    setUnitFilter('');
                    setStatusFilter('');
                    setClassTypeFilter('');
                  }}
                  className="text-sm font-bold text-slate-500 transition hover:text-brand-green"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =================================================
            TODAY / SUMMARY
        ================================================== */}

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-green">
                  Today
                </p>

                <h2 className="mt-1 text-lg font-black text-brand-dark">
                  {today.toLocaleDateString(
                    'en-KE',
                    {
                      weekday:
                        'long',
                      day: '2-digit',
                      month: 'long',
                    }
                  )}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/10">
                <CalendarCheck className="h-5 w-5 text-brand-green" />
              </div>
            </div>

            {todayEntries.length ===
            0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-5 text-center">
                <CalendarDays className="mx-auto h-7 w-7 text-slate-300" />

                <p className="mt-2 text-sm font-semibold text-slate-500">
                  No classes scheduled for today.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {todayEntries
                  .slice(0, 4)
                  .map(
                    (entry) => (
                      <button
                        type="button"
                        key={
                          entry.id
                        }
                        onClick={() =>
                          setShowDetails(
                            entry
                          )
                        }
                        className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${getClassStyle(
                          entry.class_type,
                          entry.status
                        )}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black">
                              {entry.title}
                            </p>

                            <p className="mt-1 text-xs opacity-70">
                              {formatTime(
                                entry.start_time
                              )}{' '}
                              —{' '}
                              {formatTime(
                                entry.end_time
                              )}
                            </p>
                          </div>

                          <Eye className="h-4 w-4 shrink-0 opacity-60" />
                        </div>

                        <p className="mt-3 text-xs font-semibold opacity-70">
                          {getEntryLecturerName(
                            entry
                          )}
                        </p>
                      </button>
                    )
                  )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-brand-green/10 bg-brand-green p-5 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">
              Timetable Overview
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">
                  Scheduled
                </span>

                <span className="text-lg font-black">
                  {
                    statistics.scheduled_classes
                  }
                </span>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">
                  Completed
                </span>

                <span className="text-lg font-black">
                  {
                    statistics.completed_classes
                  }
                </span>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">
                  Cancelled
                </span>

                <span className="text-lg font-black">
                  {
                    statistics.cancelled_classes
                  }
                </span>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">
                  Rooms Used
                </span>

                <span className="text-lg font-black">
                  {
                    statistics.rooms_count
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            LOADING
        ================================================== */}

        {loading ? (
          <div className="mt-6 flex min-h-[400px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-brand-green" />

              <p className="mt-3 text-sm font-bold text-slate-500">
                Loading timetable...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* =============================================
                DESKTOP WEEKLY TIMETABLE
            ============================================== */}

            <div className="mt-6 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="grid grid-cols-5 border-b border-slate-200">
                {DAYS.map(
                  (day) => {
                    const date =
                      addDays(
                        weekStart,
                        day.value -
                          1
                      );

                    const isToday =
                      formatISODate(
                        date
                      ) ===
                      formatISODate(
                        today
                      );

                    return (
                      <div
                        key={
                          day.value
                        }
                        className={`border-r border-slate-200 p-4 last:border-r-0 ${
                          isToday
                            ? 'bg-brand-green/5'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              {day.short}
                            </p>

                            <p
                              className={`mt-1 text-lg font-black ${
                                isToday
                                  ? 'text-brand-green'
                                  : 'text-brand-dark'
                              }`}
                            >
                              {date.getDate()}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openCreate(
                                day.value
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-brand-green hover:bg-brand-green hover:text-white"
                            title={`Add class on ${day.label}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="grid min-h-[500px] grid-cols-5">
                {DAYS.map(
                  (day) => (
                    <div
                      key={
                        day.value
                      }
                      className="border-r border-slate-200 p-3 last:border-r-0"
                    >
                      <div className="space-y-3">
                        {(
                          entriesByDay[
                            day.value
                          ] || []
                        ).length ===
                        0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
                            <CalendarDays className="mx-auto h-6 w-6 text-slate-200" />

                            <p className="mt-2 text-xs font-medium text-slate-400">
                              No classes
                            </p>
                          </div>
                        ) : (
                          (
                            entriesByDay[
                              day.value
                            ] || []
                          ).map(
                            (
                              entry
                            ) => (
                              <button
                                type="button"
                                key={
                                  entry.id
                                }
                                onClick={() =>
                                  setShowDetails(
                                    entry
                                  )
                                }
                                className={`group w-full rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${getClassStyle(
                                  entry.class_type,
                                  entry.status
                                )}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-black">
                                      {
                                        entry.title
                                      }
                                    </p>

                                    <p className="mt-1 text-xs font-bold opacity-70">
                                      {formatTime(
                                        entry.start_time
                                      )}{' '}
                                      —{' '}
                                      {formatTime(
                                        entry.end_time
                                      )}
                                    </p>
                                  </div>

                                  <Eye className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-60" />
                                </div>

                                <div className="mt-3 space-y-1.5 text-[11px] font-semibold opacity-75">
                                  <div className="flex items-center gap-1.5">
                                    <UserRound className="h-3 w-3 shrink-0" />

                                    <span className="truncate">
                                      {getEntryLecturerName(
                                        entry
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <GraduationCap className="h-3 w-3 shrink-0" />

                                    <span className="truncate">
                                      {entry.program_name ||
                                        'No program'}
                                    </span>
                                  </div>

                                  {entry.room && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-3 w-3 shrink-0" />

                                      <span className="truncate">
                                        {
                                          entry.room
                                        }
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-2">
                                  <span className="rounded-md bg-white/60 px-1.5 py-1 text-[10px] font-bold">
                                    {getClassTypeLabel(
                                      entry.class_type
                                    )}
                                  </span>

                                  <span className="text-[10px] font-bold opacity-60">
                                    {formatDuration(
                                      entry.start_time,
                                      entry.end_time
                                    )}
                                  </span>
                                </div>
                              </button>
                            )
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* =============================================
                MOBILE TIMETABLE
            ============================================== */}

            <div className="mt-6 space-y-4 lg:hidden">
              {DAYS.map(
                (day) => {
                  const date =
                    addDays(
                      weekStart,
                      day.value -
                        1
                    );

                  const dayEntries =
                    entriesByDay[
                      day.value
                    ] || [];

                  const isToday =
                    formatISODate(
                      date
                    ) ===
                    formatISODate(
                      today
                    );

                  return (
                    <div
                      key={
                        day.value
                      }
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                        isToday
                          ? 'border-brand-green/30'
                          : 'border-slate-200'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between p-4 ${
                          isToday
                            ? 'bg-brand-green/5'
                            : 'bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {day.label}
                          </p>

                          <p
                            className={`mt-1 text-lg font-black ${
                              isToday
                                ? 'text-brand-green'
                                : 'text-brand-dark'
                            }`}
                          >
                            {date.toLocaleDateString(
                              'en-KE',
                              {
                                day: '2-digit',
                                month: 'short',
                              }
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openCreate(
                              day.value
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-green px-3 py-2 text-xs font-bold text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </button>
                      </div>

                      <div className="space-y-3 p-4">
                        {dayEntries.length ===
                        0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
                            <CalendarDays className="mx-auto h-6 w-6 text-slate-200" />

                            <p className="mt-2 text-xs font-medium text-slate-400">
                              No classes scheduled
                            </p>
                          </div>
                        ) : (
                          dayEntries.map(
                            (
                              entry
                            ) => (
                              <button
                                type="button"
                                key={
                                  entry.id
                                }
                                onClick={() =>
                                  setShowDetails(
                                    entry
                                  )
                                }
                                className={`w-full rounded-xl border p-4 text-left ${getClassStyle(
                                  entry.class_type,
                                  entry.status
                                )}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-base font-black">
                                      {
                                        entry.title
                                      }
                                    </p>

                                    <p className="mt-1 text-xs font-bold opacity-70">
                                      {formatTime(
                                        entry.start_time
                                      )}{' '}
                                      —{' '}
                                      {formatTime(
                                        entry.end_time
                                      )}
                                    </p>
                                  </div>

                                  <StatusBadge
                                    status={
                                      entry.status
                                    }
                                  />
                                </div>

                                <div className="mt-4 grid gap-2 text-xs font-semibold opacity-75 sm:grid-cols-2">
                                  <div className="flex items-center gap-2">
                                    <UserRound className="h-3.5 w-3.5" />
                                    {
                                      getEntryLecturerName(
                                        entry
                                      )
                                    }
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    {
                                      entry.program_name
                                    }
                                  </div>

                                  {entry.room && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-3.5 w-3.5" />
                                      {
                                        entry.room
                                      }
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {formatDuration(
                                      entry.start_time,
                                      entry.end_time
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}

        {/* =================================================
            LEGEND
        ================================================== */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Class Types
            </p>

            {CLASS_TYPES.map(
              (type) => (
                <div
                  key={
                    type.value
                  }
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      type.value ===
                      'lecture'
                        ? 'bg-brand-green'
                        : type.value ===
                          'practical'
                        ? 'bg-brand-green/60'
                        : type.value ===
                          'tutorial'
                        ? 'bg-brand-gold'
                        : type.value ===
                          'exam'
                        ? 'bg-purple-500'
                        : type.value ===
                          'meeting'
                        ? 'bg-slate-500'
                        : 'bg-slate-300'
                    }`}
                  />

                  {
                    type.label
                  }
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ===================================================
          CREATE / EDIT MODAL
      ==================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between bg-brand-green px-5 py-4 text-white sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                  {editingId
                    ? 'Edit Timetable'
                    : 'New Timetable Entry'}
                </p>

                <h2 className="mt-1 text-lg font-black">
                  {editingId
                    ? 'Update Class'
                    : 'Schedule a Class'}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="rounded-xl p-2 transition hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSave
              }
              className="max-h-[calc(92vh-80px)] overflow-y-auto p-5 sm:p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                {/* LECTURER */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-brand-dark">
                    Lecturer
                  </label>

                  <select
                    required
                    value={
                      form.lecturer_id
                    }
                    onChange={(event) =>
                      updateForm(
                        'lecturer_id',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  >
                    <option value="">
                      Select lecturer
                    </option>

                    {lecturers.map(
                      (lecturer) => (
                        <option
                          key={
                            lecturer.id
                          }
                          value={
                            lecturer.id
                          }
                        >
                          {getLecturerName(
                            lecturer
                          )}
                          {lecturer.email
                            ? ` — ${lecturer.email}`
                            : ''}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* PROGRAM */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-brand-dark">
                    Program
                  </label>

                  <select
                    required
                    value={
                      form.program_id
                    }
                    onChange={(event) =>
                      updateForm(
                        'program_id',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  >
                    <option value="">
                      Select program
                    </option>

                    {programs.map(
                      (program) => (
                        <option
                          key={
                            program.id
                          }
                          value={
                            program.id
                          }
                        >
                          {program.name}
                          {program.code
                            ? ` (${program.code})`
                            : ''}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* UNIT */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-brand-dark">
                    Unit
                    <span className="ml-1 text-xs font-medium text-slate-400">
                      Optional
                    </span>
                  </label>

                  <select
                    value={
                      form.unit_id
                    }
                    onChange={(event) =>
                      updateForm(
                        'unit_id',
                        event.target.value
                      )
                    }
                    disabled={
                      !form.program_id
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:bg-slate-50 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  >
                    <option value="">
                      {form.program_id
                        ? 'Select unit'
                        : 'Select program first'}
                    </option>

                    {formUnits.map(
                      (unit) => (
                        <option
                          key={
                            unit.id
                          }
                          value={
                            unit.id
                          }
                        >
                          {unit.name}
                          {unit.code
                            ? ` (${unit.code})`
                            : ''}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* DAY */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-brand-dark">
                    Day
                  </label>

                  <select
                    required
                    value={
                      form.day_of_week
                    }
                    onChange={(event) =>
                      updateForm(
                        'day_of_week',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  >
                    {DAYS.map(
                      (day) => (
                        <option
                          key={
                            day.value
                          }
                          value={
                            day.value
                          }
                        >
                          {
                            day.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* START */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-brand-dark">
                    Start Time
                  </label>

                  <input
                    required
                    type="time"
                    value={
                      form.start_time
                    }
                    onChange={(event) =>
                      updateForm(
                        'start_time',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />
                </div>

                {/* END */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-brand-dark">
                    End Time
                  </label>

                  <input
                    required
                    type="time"
                    value={
                      form.end_time
                    }
                    onChange={(event) =>
                      updateForm(
                        'end_time',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />
                </div>

                {/* CLASS TYPE */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-brand-dark">
                    Class Type
                  </label>

                  <select
                    value={
                      form.class_type
                    }
                    onChange={(event) =>
                      updateForm(
                        'class_type',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  >
                    {CLASS_TYPES.map(
                      (type) => (
                        <option
                          key={
                            type.value
                          }
                          value={
                            type.value
                          }
                        >
                          {
                            type.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* STATUS */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-brand-dark">
                    Status
                  </label>

                  <select
                    value={
                      form.status
                    }
                    onChange={(event) =>
                      updateForm(
                        'status',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  >
                    {STATUSES.map(
                      (status) => (
                        <option
                          key={
                            status.value
                          }
                          value={
                            status.value
                          }
                        >
                          {
                            status.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* TITLE */}

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-bold text-brand-dark">
                    Class Title
                  </label>

                  <input
                    required
                    type="text"
                    value={
                      form.title
                    }
                    onChange={(event) =>
                      updateForm(
                        'title',
                        event.target.value
                      )
                    }
                    placeholder="e.g. Human Anatomy Lecture"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />
                </div>

                {/* ROOM */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-brand-dark">
                    Room / Venue
                  </label>

                  <input
                    type="text"
                    value={
                      form.room
                    }
                    onChange={(event) =>
                      updateForm(
                        'room',
                        event.target.value
                      )
                    }
                    placeholder="e.g. Room 4 / Skills Lab"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />
                </div>

                {/* START DATE */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-brand-dark">
                    Start Date
                    <span className="ml-1 text-xs font-medium text-slate-400">
                      Optional
                    </span>
                  </label>

                  <input
                    type="date"
                    value={
                      form.start_date
                    }
                    onChange={(event) =>
                      updateForm(
                        'start_date',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />
                </div>

                {/* END DATE */}

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-brand-dark">
                    End Date
                    <span className="ml-1 text-xs font-medium text-slate-400">
                      Optional
                    </span>
                  </label>

                  <input
                    type="date"
                    value={
                      form.end_date
                    }
                    onChange={(event) =>
                      updateForm(
                        'end_date',
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-bold text-brand-dark">
                    Description
                    <span className="ml-1 text-xs font-medium text-slate-400">
                      Optional
                    </span>
                  </label>

                  <textarea
                    rows={4}
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      updateForm(
                        'description',
                        event.target.value
                      )
                    }
                    placeholder="Add additional instructions or notes..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />
                </div>
              </div>

              {/* FORM FOOTER */}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    closeModal
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-6 py-3 text-sm font-black text-white shadow-lg shadow-brand-green/20 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {editingId
                        ? 'Update Class'
                        : 'Create Class'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          DETAILS MODAL
      ==================================================== */}

      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="bg-gradient-to-br from-brand-dark to-brand-green p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
                    Class Details
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {
                      showDetails.title
                    }
                  </h2>

                  <p className="mt-2 text-sm text-white/70">
                    {getDayName(
                      showDetails.day_of_week
                    )}{' '}
                    ·{' '}
                    {formatTime(
                      showDetails.start_time
                    )}{' '}
                    —{' '}
                    {formatTime(
                      showDetails.end_time
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDetails(
                      null
                    )
                  }
                  className="rounded-xl p-2 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* BODY */}

            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <UserRound className="h-3.5 w-3.5" />
                    Lecturer
                  </div>

                  <p className="mt-2 text-sm font-black text-brand-dark">
                    {getEntryLecturerName(
                      showDetails
                    )}
                  </p>

                  {showDetails.lecturer_email && (
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {
                        showDetails.lecturer_email
                      }
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Program
                  </div>

                  <p className="mt-2 text-sm font-black text-brand-dark">
                    {
                      showDetails.program_name
                    }
                  </p>

                  {showDetails.program_code && (
                    <p className="mt-1 text-xs text-slate-500">
                      {
                        showDetails.program_code
                      }
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <BookOpen className="h-3.5 w-3.5" />
                    Unit
                  </div>

                  <p className="mt-2 text-sm font-black text-brand-dark">
                    {showDetails.unit_name ||
                      'No specific unit'}
                  </p>

                  {showDetails.unit_code && (
                    <p className="mt-1 text-xs text-slate-500">
                      {
                        showDetails.unit_code
                      }
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Building2 className="h-3.5 w-3.5" />
                    Room
                  </div>

                  <p className="mt-2 text-sm font-black text-brand-dark">
                    {showDetails.room ||
                      'No room assigned'}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={
                    showDetails.status
                  }
                />

                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {getClassTypeLabel(
                    showDetails.class_type
                  )}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatDuration(
                    showDetails.start_time,
                    showDetails.end_time
                  )}
                </span>
              </div>

              {(showDetails.start_date ||
                showDetails.end_date) && (
                <div className="mt-5 rounded-xl border border-brand-green/10 bg-brand-green/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-green">
                    Active Date Range
                  </p>

                  <p className="mt-2 text-sm font-bold text-brand-dark">
                    {showDetails.start_date
                      ? formatDate(
                          String(
                            showDetails.start_date
                          ).slice(
                            0,
                            10
                          )
                        )
                      : 'No start date'}{' '}
                    —{' '}
                    {showDetails.end_date
                      ? formatDate(
                          String(
                            showDetails.end_date
                          ).slice(
                            0,
                            10
                          )
                        )
                      : 'No end date'}
                  </p>
                </div>
              )}

              {showDetails.description && (
                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Description
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {
                      showDetails.description
                    }
                  </p>
                </div>
              )}

              {/* ACTIONS */}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  disabled={
                    deleting ===
                    showDetails.id
                  }
                  onClick={() =>
                    handleDelete(
                      showDetails.id
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting ===
                  showDetails.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      setShowDetails(
                        null
                      )
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openEdit(
                        showDetails
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-black text-white transition hover:bg-brand-dark"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Class
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}