'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

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
};

type TimetableEntry = {
  id: number;
  program_id: number;
  unit_id: number | null;
  lecturer_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  title: string;
  description: string | null;
  room: string | null;
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
  start_date: string | null;
  end_date: string | null;
  created_at?: string;
  updated_at?: string;

  program_name?: string;
  program_code?: string | null;
  unit_name?: string;
  unit_code?: string | null;
};

type Statistics = {
  total_classes: number;
  scheduled_classes: number;
  completed_classes: number;
  cancelled_classes: number;
  programs_count: number;
  total_hours: number | string;
};

type TimetableForm = {
  program_id: string;
  unit_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  title: string;
  description: string;
  room: string;
  class_type: TimetableEntry['class_type'];
  status: TimetableEntry['status'];
  start_date: string;
  end_date: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const DAYS = [
  {
    value: 1,
    short: 'MON',
    name: 'Monday',
  },
  {
    value: 2,
    short: 'TUE',
    name: 'Tuesday',
  },
  {
    value: 3,
    short: 'WED',
    name: 'Wednesday',
  },
  {
    value: 4,
    short: 'THU',
    name: 'Thursday',
  },
  {
    value: 5,
    short: 'FRI',
    name: 'Friday',
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
] as const;

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
] as const;

/* =========================================================
   DEFAULT FORM
========================================================= */

const DEFAULT_FORM: TimetableForm = {
  program_id: '',
  unit_id: '',
  day_of_week: '1',
  start_time: '08:00',
  end_time: '10:00',
  title: '',
  description: '',
  room: '',
  class_type: 'lecture',
  status: 'scheduled',
  start_date: '',
  end_date: '',
};

/* =========================================================
   DATE HELPERS
========================================================= */

function getMonday(date: Date): Date {
  const copy = new Date(date);

  copy.setHours(
    0,
    0,
    0,
    0
  );

  const day = copy.getDay();

  const diff =
    day === 0
      ? -6
      : 1 - day;

  copy.setDate(
    copy.getDate() + diff
  );

  return copy;
}

function addDays(
  date: Date,
  amount: number
): Date {
  const copy = new Date(date);

  copy.setDate(
    copy.getDate() + amount
  );

  return copy;
}

function formatISODate(
  date: Date
): string {
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

function formatDateRange(
  start: Date,
  end: Date
): string {
  const sameYear =
    start.getFullYear() ===
    end.getFullYear();

  const startText =
    start.toLocaleDateString(
      'en-KE',
      {
        day: 'numeric',
        month: 'short',
        year: sameYear
          ? undefined
          : 'numeric',
      }
    );

  const endText =
    end.toLocaleDateString(
      'en-KE',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    );

  return `${startText} – ${endText}`;
}

function formatTime(
  value: string
): string {
  if (!value) {
    return '';
  }

  const [hourText, minute] =
    value.slice(0, 5).split(':');

  const hour =
    Number(hourText);

  const suffix =
    hour >= 12
      ? 'PM'
      : 'AM';

  const displayHour =
    hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}

function formatDuration(
  start: string,
  end: string
): string {
  if (!start || !end) {
    return '';
  }

  const [startHour, startMinute] =
    start
      .slice(0, 5)
      .split(':')
      .map(Number);

  const [endHour, endMinute] =
    end
      .slice(0, 5)
      .split(':')
      .map(Number);

  const startMinutes =
    startHour * 60 +
    startMinute;

  const endMinutes =
    endHour * 60 +
    endMinute;

  const total =
    endMinutes -
    startMinutes;

  if (total <= 0) {
    return '';
  }

  const hours =
    Math.floor(
      total / 60
    );

  const minutes =
    total % 60;

  if (hours && minutes) {
    return `${hours}h ${minutes}m`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

function getClassTypeLabel(
  type: TimetableEntry['class_type']
): string {
  return (
    CLASS_TYPES.find(
      (item) =>
        item.value === type
    )?.label || 'Other'
  );
}

function getDayName(
  day: number
): string {
  return (
    DAYS.find(
      (item) =>
        item.value === day
    )?.name || ''
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function LecturerTimetablePage() {
  const [weekStart, setWeekStart] =
    useState<Date>(() =>
      getMonday(
        new Date()
      )
    );

  const [timetable, setTimetable] =
    useState<TimetableEntry[]>([]);

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
      programs_count: 0,
      total_hours: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [showModal, setShowModal] =
    useState(false);

  const [selectedEntry, setSelectedEntry] =
    useState<TimetableEntry | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [showDetails, setShowDetails] =
    useState<TimetableEntry | null>(null);

  const [form, setForm] =
    useState<TimetableForm>(
      DEFAULT_FORM
    );

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

  const currentWeekStart =
    useMemo(
      () =>
        getMonday(
          new Date()
        ),
      []
    );

  const isCurrentWeek =
    formatISODate(
      currentWeekStart
    ) === weekStartISO;

  const loadTimetable =
    useCallback(
      async (
        silent = false
      ) => {
        try {
          if (silent) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError('');

          const response =
            await fetch(
              `/api/lecturer/timetable?start_date=${encodeURIComponent(
                weekStartISO
              )}&end_date=${encodeURIComponent(
                weekEndISO
              )}`,
              {
                credentials:
                  'include',
                cache:
                  'no-store',
              }
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                'Unable to load timetable.'
            );
          }

          setTimetable(
            Array.isArray(
              data.timetable
            )
              ? data.timetable
              : []
          );

          setPrograms(
            Array.isArray(
              data.programs
            )
              ? data.programs
              : []
          );

          setUnits(
            Array.isArray(
              data.units
            )
              ? data.units
              : []
          );

          setStatistics(
            data.statistics || {
              total_classes: 0,
              scheduled_classes: 0,
              completed_classes: 0,
              cancelled_classes: 0,
              programs_count: 0,
              total_hours: 0,
            }
          );
        } catch (err) {
          console.error(
            'LOAD TIMETABLE ERROR:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load timetable.'
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        weekStartISO,
        weekEndISO,
      ]
    );

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

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

  const previousWeek =
    () => {
      setWeekStart(
        (current) =>
          addDays(
            current,
            -7
          )
      );
    };

  const nextWeek =
    () => {
      setWeekStart(
        (current) =>
          addDays(
            current,
            7
          )
      );
    };

  const goToToday =
    () => {
      setWeekStart(
        getMonday(
          new Date()
        )
      );
    };

  const updateForm =
    <K extends keyof TimetableForm>(
      field: K,
      value: TimetableForm[K]
    ) => {
      setForm(
        (current) => ({
          ...current,
          [field]: value,
        })
      );
    };

  const openCreateModal =
    (
      day: number = 1
    ) => {
      setSelectedEntry(null);

      setForm({
        ...DEFAULT_FORM,
        day_of_week:
          String(day),
      });

      setError('');
      setSuccess('');

      setShowModal(true);
    };

  const openEditModal =
    (
      entry: TimetableEntry
    ) => {
      setSelectedEntry(
        entry
      );

      setForm({
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
          entry.start_time.slice(
            0,
            5
          ),
        end_time:
          entry.end_time.slice(
            0,
            5
          ),
        title:
          entry.title,
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
            ? entry.start_date.slice(
                0,
                10
              )
            : '',
        end_date:
          entry.end_date
            ? entry.end_date.slice(
                0,
                10
              )
            : '',
      });

      setError('');
      setSuccess('');

      setShowModal(true);
    };

  const closeModal =
    () => {
      if (saving) {
        return;
      }

      setShowModal(false);
      setSelectedEntry(null);
      setForm(
        DEFAULT_FORM
      );
    };

  const availableUnits =
    useMemo(() => {
      if (
        !form.program_id
      ) {
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

  const handleProgramChange =
    (
      value: string
    ) => {
      setForm(
        (current) => ({
          ...current,
          program_id: value,
          unit_id: '',
        })
      );
    };

  const handleSave =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      setError('');
      setSuccess('');

      if (
        !form.program_id
      ) {
        setError(
          'Please select a program.'
        );
        return;
      }

      if (
        !form.title.trim()
      ) {
        setError(
          'Please enter a class title.'
        );
        return;
      }

      if (
        form.end_time <=
        form.start_time
      ) {
        setError(
          'End time must be later than start time.'
        );
        return;
      }

      if (
        form.start_date &&
        form.end_date &&
        form.end_date <
          form.start_date
      ) {
        setError(
          'End date cannot be earlier than start date.'
        );
        return;
      }

      try {
        setSaving(true);

        const method =
          selectedEntry
            ? 'PATCH'
            : 'POST';

        const endpoint =
          selectedEntry
            ? `/api/lecturer/timetable?id=${selectedEntry.id}`
            : '/api/lecturer/timetable';

        const response =
          await fetch(
            endpoint,
            {
              method,
              credentials:
                'include',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
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
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Unable to save timetable entry.'
          );
        }

        setShowModal(false);
        setSelectedEntry(null);
        setForm(
          DEFAULT_FORM
        );

        setSuccess(
          selectedEntry
            ? 'Timetable entry updated successfully.'
            : 'Timetable entry created successfully.'
        );

        await loadTimetable(
          true
        );
      } catch (err) {
        console.error(
          'SAVE TIMETABLE ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to save timetable entry.'
        );
      } finally {
        setSaving(false);
      }
    };

  const handleDelete =
    async (
      entry: TimetableEntry
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${entry.title}" from the timetable?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          entry.id
        );

        setError('');
        setSuccess('');

        const response =
          await fetch(
            `/api/lecturer/timetable?id=${entry.id}`,
            {
              method:
                'DELETE',
              credentials:
                'include',
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Unable to delete timetable entry.'
          );
        }

        setSuccess(
          'Timetable entry deleted successfully.'
        );

        if (
          showDetails?.id ===
          entry.id
        ) {
          setShowDetails(
            null
          );
        }

        await loadTimetable(
          true
        );
      } catch (err) {
        console.error(
          'DELETE TIMETABLE ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to delete timetable entry.'
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  const entriesByDay =
    useMemo(() => {
      const grouped:
        Record<
          number,
          TimetableEntry[]
        > = {
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
      };

      timetable.forEach(
        (entry) => {
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
      );

      Object.values(
        grouped
      ).forEach(
        (entries) => {
          entries.sort(
            (a, b) =>
              a.start_time.localeCompare(
                b.start_time
              )
          );
        }
      );

      return grouped;
    }, [
      timetable,
    ]);

  const todayDay =
    new Date().getDay();

  const todaysEntries =
    todayDay >= 1 &&
    todayDay <= 5
      ? entriesByDay[
          todayDay
        ] || []
      : [];

  const upcomingEntry =
    useMemo(() => {
      const now =
        new Date();

      const currentDay =
        now.getDay();

      const currentMinutes =
        now.getHours() *
          60 +
        now.getMinutes();

      const candidates =
        timetable
          .filter(
            (entry) =>
              entry.status !==
                'cancelled' &&
              entry.status !==
                'completed'
          )
          .map(
            (entry) => {
              const [
                hour,
                minute,
              ] =
                entry.start_time
                  .slice(
                    0,
                    5
                  )
                  .split(':')
                  .map(
                    Number
                  );

              return {
                entry,
                day:
                  entry.day_of_week,
                minutes:
                  hour *
                    60 +
                  minute,
              };
            }
          )
          .sort(
            (
              a,
              b
            ) => {
              if (
                a.day !==
                b.day
              ) {
                return (
                  a.day -
                  b.day
                );
              }

              return (
                a.minutes -
                b.minutes
              );
            }
          );

      const sameDay =
        candidates.find(
          (item) =>
            item.day ===
              currentDay &&
            item.minutes >=
              currentMinutes
        );

      if (
        sameDay
      ) {
        return sameDay.entry;
      }

      return (
        candidates.find(
          (item) =>
            item.day >
            currentDay
        )?.entry ||
        null
      );
    }, [
      timetable,
    ]);

  /* =======================================================
     BRAND GREEN CLASS STYLES
  ======================================================= */

  const getClassStyle =
    (
      type: TimetableEntry['class_type']
    ) => {
      switch (
        type
      ) {
        case 'practical':
          return {
            card:
              'border-green-200 bg-green-50/80 hover:bg-green-50',
            accent:
              'bg-green-600',
            icon:
              'text-green-700',
          };

        case 'tutorial':
          return {
            card:
              'border-brand-green/20 bg-brand-green/5 hover:bg-brand-green/10',
            accent:
              'bg-brand-green',
            icon:
              'text-brand-green',
          };

        case 'exam':
          return {
            card:
              'border-green-300 bg-green-100/70 hover:bg-green-100',
            accent:
              'bg-green-700',
            icon:
              'text-green-800',
          };

        case 'meeting':
          return {
            card:
              'border-lime-200 bg-lime-50/80 hover:bg-lime-50',
            accent:
              'bg-lime-600',
            icon:
              'text-lime-700',
          };

        case 'other':
          return {
            card:
              'border-green-100 bg-green-50/60 hover:bg-green-50',
            accent:
              'bg-green-500',
            icon:
              'text-green-700',
          };

        default:
          return {
            card:
              'border-brand-green/20 bg-brand-green/5 hover:bg-brand-green/10',
            accent:
              'bg-brand-green',
            icon:
              'text-brand-green',
          };
      }
    };

  if (
    loading
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green/10">
            <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
          </div>

          <h2 className="mt-5 text-lg font-bold text-slate-900">
            Loading timetable
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Preparing your teaching schedule...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1700px] space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

        {/* HEADER */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-green to-green-800 p-6 shadow-xl sm:p-8">

          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-green-300/10 blur-3xl" />

          <div className="relative">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="max-w-2xl">

                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-green-50 backdrop-blur">
                  <CalendarDays className="h-4 w-4" />
                  Monday – Friday
                </div>

                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                  My Teaching Timetable
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-green-50/80 sm:text-base">
                  Manage your weekly teaching schedule,
                  classes, practical sessions, exams and
                  academic activities from one place.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  openCreateModal()
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-brand-dark shadow-lg transition hover:-translate-y-0.5 hover:bg-green-50 active:translate-y-0"
              >
                <Plus className="h-5 w-5" />
                Add Class
              </button>

            </div>

            <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={
                    previousWeek
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Previous week"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={
                    nextWeek
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Next week"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={
                    goToToday
                  }
                  disabled={
                    isCurrentWeek
                  }
                  className="ml-1 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-dark transition hover:bg-green-50 disabled:cursor-default disabled:opacity-50"
                >
                  Today
                </button>

              </div>

              <div className="text-center sm:text-right">

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-100">
                  Teaching Week
                </p>

                <p className="mt-1 text-sm font-bold text-white sm:text-base">
                  {formatDateRange(
                    weekStart,
                    weekEnd
                  )}
                </p>

              </div>

            </div>

          </div>
        </section>

        {/* ALERTS */}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-0.5">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              className="rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3.5 text-sm text-green-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />

            <p className="font-semibold">
              {success}
            </p>
          </div>
        )}

        {/* STATISTICS */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">

          <StatCard
            icon={
              <CalendarDays className="h-5 w-5" />
            }
            label="Classes"
            value={
              statistics.total_classes
            }
            description="This week"
          />

          <StatCard
            icon={
              <Clock3 className="h-5 w-5" />
            }
            label="Teaching Hours"
            value={Number(
              statistics.total_hours || 0
            ).toFixed(1)}
            description="Total scheduled"
          />

          <StatCard
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
            label="Scheduled"
            value={
              statistics.scheduled_classes
            }
            description="Upcoming"
          />

          <StatCard
            icon={
              <GraduationCap className="h-5 w-5" />
            }
            label="Programs"
            value={
              statistics.programs_count
            }
            description="Across timetable"
          />

          <StatCard
            icon={
              <Users className="h-5 w-5" />
            }
            label="Completed"
            value={
              statistics.completed_classes
            }
            description="Finished classes"
          />

        </section>

        {/* TODAY / NEXT CLASS */}

        <section className="grid gap-4 lg:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-green">
                  Today
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {new Date().toLocaleDateString(
                    'en-KE',
                    {
                      weekday:
                        'long',
                      day: 'numeric',
                      month: 'long',
                    }
                  )}
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                <CalendarDays className="h-5 w-5" />
              </div>

            </div>

            {todaysEntries.length === 0 ? (
              <div className="mt-5 rounded-xl bg-slate-50 px-4 py-5 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No classes scheduled today
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Enjoy the available time for preparation,
                  marking or academic planning.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {todaysEntries
                  .slice(0, 3)
                  .map(
                    (
                      entry
                    ) => (
                      <button
                        key={
                          entry.id
                        }
                        type="button"
                        onClick={() =>
                          setShowDetails(
                            entry
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-xl border border-green-100 bg-green-50/50 p-3 text-left transition hover:border-brand-green/30 hover:bg-brand-green/5"
                      >
                        <div className="rounded-lg bg-brand-green/10 px-2.5 py-2 text-xs font-bold text-brand-green">
                          {formatTime(
                            entry.start_time
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {entry.title}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {entry.program_name ||
                              'Program'}
                          </p>
                        </div>

                        <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400" />
                      </button>
                    )
                  )}
              </div>
            )}

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-green">
                  Next Class
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Coming up
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                <Clock3 className="h-5 w-5" />
              </div>

            </div>

            {upcomingEntry ? (
              <button
                type="button"
                onClick={() =>
                  setShowDetails(
                    upcomingEntry
                  )
                }
                className="mt-4 w-full rounded-xl border border-green-100 bg-green-50/60 p-4 text-left transition hover:border-brand-green/30 hover:bg-green-50"
              >
                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <p className="text-xs font-bold uppercase tracking-wider text-brand-green">
                      {getDayName(
                        upcomingEntry.day_of_week
                      )}
                    </p>

                    <h3 className="mt-1 truncate text-base font-bold text-slate-900">
                      {upcomingEntry.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      {upcomingEntry.program_name ||
                        'Program'}
                    </p>

                  </div>

                  <div className="shrink-0 rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                    <p className="text-sm font-black text-brand-green">
                      {formatTime(
                        upcomingEntry.start_time
                      )}
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {formatDuration(
                        upcomingEntry.start_time,
                        upcomingEntry.end_time
                      )}
                    </p>
                  </div>

                </div>
              </button>
            ) : (
              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-5 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No upcoming classes
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Your schedule is currently clear.
                </p>
              </div>
            )}

          </div>

        </section>

        {/* TIMETABLE */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Weekly Schedule
                  </h2>

                  <p className="text-xs text-slate-500">
                    Monday through Friday
                  </p>
                </div>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                loadTimetable(
                  true
                )
              }
              disabled={
                refreshing
              }
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-green-200 hover:bg-green-50 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? 'animate-spin'
                    : ''
                }`}
              />
              Refresh
            </button>

          </div>

          {/* DESKTOP */}

          <div className="hidden overflow-x-auto lg:block">

            <div className="min-w-[1100px]">

              <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50">

                {DAYS.map(
                  (
                    day
                  ) => {
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
                        new Date()
                      );

                    return (
                      <div
                        key={
                          day.value
                        }
                        className={`border-r border-slate-200 px-4 py-4 last:border-r-0 ${
                          isToday
                            ? 'bg-green-50'
                            : ''
                        }`}
                      >

                        <div className="flex items-center justify-between">

                          <div>
                            <p
                              className={`text-xs font-black tracking-[0.16em] ${
                                isToday
                                  ? 'text-brand-green'
                                  : 'text-slate-500'
                              }`}
                            >
                              {
                                day.short
                              }
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {date.toLocaleDateString(
                                'en-KE',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                }
                              )}
                            </p>
                          </div>

                          {isToday && (
                            <span className="rounded-full bg-brand-green px-2 py-1 text-[10px] font-bold text-white">
                              TODAY
                            </span>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

              <div className="grid grid-cols-5">

                {DAYS.map(
                  (
                    day
                  ) => {
                    const entries =
                      entriesByDay[
                        day.value
                      ] || [];

                    return (
                      <div
                        key={
                          day.value
                        }
                        className="min-h-[520px] border-r border-slate-200 p-3 last:border-r-0"
                      >

                        {entries.length ===
                        0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              openCreateModal(
                                day.value
                              )
                            }
                            className="flex min-h-[480px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center transition hover:border-brand-green/30 hover:bg-green-50/50"
                          >
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                              <Plus className="h-5 w-5" />
                            </div>

                            <p className="mt-3 text-xs font-semibold text-slate-500">
                              No classes
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                              Click to add
                            </p>
                          </button>
                        ) : (
                          <div className="space-y-3">

                            {entries.map(
                              (
                                entry
                              ) => {
                                const style =
                                  getClassStyle(
                                    entry.class_type
                                  );

                                return (
                                  <div
                                    key={
                                      entry.id
                                    }
                                    className={`group relative overflow-hidden rounded-2xl border p-3.5 transition ${style.card}`}
                                  >

                                    <div
                                      className={`absolute bottom-0 left-0 top-0 w-1 ${style.accent}`}
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowDetails(
                                          entry
                                        )
                                      }
                                      className="block w-full pl-1 text-left"
                                    >

                                      <div className="flex items-start justify-between gap-2">

                                        <span className="rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                          {getClassTypeLabel(
                                            entry.class_type
                                          )}
                                        </span>

                                        <span
                                          className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                                            entry.status ===
                                            'completed'
                                              ? 'bg-green-100 text-green-700'
                                              : entry.status ===
                                                'cancelled'
                                              ? 'bg-red-100 text-red-700'
                                              : 'bg-white/80 text-slate-600'
                                          }`}
                                        >
                                          {entry.status}
                                        </span>

                                      </div>

                                      <h3 className="mt-3 line-clamp-2 text-sm font-black leading-5 text-slate-900">
                                        {entry.title}
                                      </h3>

                                      {entry.unit_name && (
                                        <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-600">
                                          {entry.unit_code
                                            ? `${entry.unit_code} · `
                                            : ''}
                                          {
                                            entry.unit_name
                                          }
                                        </p>
                                      )}

                                      <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                        <Clock3 className="h-3.5 w-3.5 text-brand-green" />

                                        {formatTime(
                                          entry.start_time
                                        )}

                                        <span className="font-normal text-slate-400">
                                          →
                                        </span>

                                        {formatTime(
                                          entry.end_time
                                        )}
                                      </div>

                                      {entry.room && (
                                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                                          <MapPin className="h-3.5 w-3.5 text-brand-green" />
                                          <span className="truncate">
                                            {
                                              entry.room
                                            }
                                          </span>
                                        </div>
                                      )}

                                    </button>

                                    <div className="mt-3 flex items-center gap-1 border-t border-black/5 pt-2">

                                      <button
                                        type="button"
                                        onClick={() =>
                                          openEditModal(
                                            entry
                                          )
                                        }
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-white/70 hover:text-brand-green"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                        Edit
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDelete(
                                            entry
                                          )
                                        }
                                        disabled={
                                          deletingId ===
                                          entry.id
                                        }
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                      >
                                        {deletingId ===
                                        entry.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                        Delete
                                      </button>

                                    </div>

                                  </div>
                                );
                              }
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                openCreateModal(
                                  day.value
                                )
                              }
                              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2.5 text-xs font-semibold text-slate-400 transition hover:border-brand-green/30 hover:bg-green-50 hover:text-brand-green"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add class
                            </button>

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </div>

          {/* MOBILE */}

          <div className="divide-y divide-slate-100 lg:hidden">

            {DAYS.map(
              (
                day
              ) => {
                const entries =
                  entriesByDay[
                    day.value
                  ] || [];

                const date =
                  addDays(
                    weekStart,
                    day.value -
                      1
                  );

                return (
                  <div
                    key={
                      day.value
                    }
                    className="p-4 sm:p-5"
                  >

                    <div className="mb-3 flex items-center justify-between">

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-green">
                          {
                            day.name
                          }
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-slate-500">
                          {date.toLocaleDateString(
                            'en-KE',
                            {
                              day: 'numeric',
                              month: 'long',
                            }
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openCreateModal(
                            day.value
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green/10 px-3 py-2 text-xs font-bold text-brand-green transition hover:bg-brand-green/20"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>

                    </div>

                    {entries.length ===
                    0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                        <p className="text-xs font-semibold text-slate-500">
                          No classes scheduled
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">

                        {entries.map(
                          (
                            entry
                          ) => {
                            const style =
                              getClassStyle(
                                entry.class_type
                              );

                            return (
                              <div
                                key={
                                  entry.id
                                }
                                className={`relative overflow-hidden rounded-2xl border p-4 ${style.card}`}
                              >

                                <div
                                  className={`absolute bottom-0 left-0 top-0 w-1 ${style.accent}`}
                                />

                                <div className="pl-1">

                                  <div className="flex items-start justify-between gap-3">

                                    <div className="min-w-0">

                                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                        {getClassTypeLabel(
                                          entry.class_type
                                        )}
                                      </p>

                                      <h3 className="mt-1 text-base font-black text-slate-900">
                                        {entry.title}
                                      </h3>

                                    </div>

                                    <span
                                      className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${
                                        entry.status ===
                                        'completed'
                                          ? 'bg-green-100 text-green-700'
                                          : entry.status ===
                                            'cancelled'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-white/80 text-slate-600'
                                      }`}
                                    >
                                      {
                                        entry.status
                                      }
                                    </span>

                                  </div>

                                  {entry.program_name && (
                                    <p className="mt-2 text-sm font-semibold text-slate-600">
                                      {
                                        entry.program_name
                                      }
                                    </p>
                                  )}

                                  {entry.unit_name && (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {entry.unit_code
                                        ? `${entry.unit_code} · `
                                        : ''}
                                      {
                                        entry.unit_name
                                      }
                                    </p>
                                  )}

                                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">

                                    <span className="inline-flex items-center gap-1.5">
                                      <Clock3 className="h-3.5 w-3.5 text-brand-green" />

                                      {formatTime(
                                        entry.start_time
                                      )}
                                      {' – '}
                                      {formatTime(
                                        entry.end_time
                                      )}
                                    </span>

                                    {entry.room && (
                                      <span className="inline-flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-brand-green" />

                                        {
                                          entry.room
                                        }
                                      </span>
                                    )}

                                  </div>

                                  <div className="mt-4 flex gap-2">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowDetails(
                                          entry
                                        )
                                      }
                                      className="flex-1 rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-white"
                                    >
                                      View Details
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openEditModal(
                                          entry
                                        )
                                      }
                                      className="rounded-xl bg-white/80 px-3 py-2 text-slate-600 transition hover:bg-white hover:text-brand-green"
                                      aria-label="Edit class"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDelete(
                                          entry
                                        )
                                      }
                                      disabled={
                                        deletingId ===
                                        entry.id
                                      }
                                      className="rounded-xl bg-white/80 px-3 py-2 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                                      aria-label="Delete class"
                                    >
                                      {deletingId ===
                                      entry.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </button>

                                  </div>

                                </div>

                              </div>
                            );
                          }
                        )}

                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* LEGEND */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Timetable Legend
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Classes are automatically grouped by activity type.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              {CLASS_TYPES.map(
                (
                  type
                ) => {
                  const style =
                    getClassStyle(
                      type.value as TimetableEntry['class_type']
                    );

                  return (
                    <span
                      key={
                        type.value
                      }
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${style.card}`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${style.accent}`}
                      />

                      {
                        type.label
                      }
                    </span>
                  );
                }
              )}

            </div>

          </div>

        </section>

      </div>

      {/* CREATE / EDIT MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">

          <div className="my-8 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="bg-gradient-to-r from-brand-dark to-brand-green px-5 py-5 sm:px-7">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-green-100">
                    <CalendarDays className="h-4 w-4" />
                    Lecturer Timetable
                  </div>

                  <h2 className="text-xl font-black text-white">
                    {selectedEntry
                      ? 'Edit Class'
                      : 'Add Class'}
                  </h2>

                  <p className="mt-1 text-sm text-green-50/75">
                    Schedule a Monday–Friday teaching activity.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>

              </div>

            </div>

            <form
              onSubmit={
                handleSave
              }
              className="max-h-[75vh] overflow-y-auto p-5 sm:p-7"
            >

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <p>
                    {error}
                  </p>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">

                <Field
                  label="Program"
                  required
                >
                  <div className="relative">
                    <select
                      value={
                        form.program_id
                      }
                      onChange={(
                        event
                      ) =>
                        handleProgramChange(
                          event.target.value
                        )
                      }
                      className="field-input appearance-none pr-10"
                      required
                    >
                      <option value="">
                        Select program
                      </option>

                      {programs.map(
                        (
                          program
                        ) => (
                          <option
                            key={
                              program.id
                            }
                            value={
                              program.id
                            }
                          >
                            {program.code
                              ? `${program.code} — `
                              : ''}
                            {
                              program.name
                            }
                          </option>
                        )
                      )}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>

                <Field
                  label="Unit"
                >
                  <div className="relative">
                    <select
                      value={
                        form.unit_id
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          'unit_id',
                          event.target.value
                        )
                      }
                      disabled={
                        !form.program_id ||
                        availableUnits.length ===
                          0
                      }
                      className="field-input appearance-none pr-10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {form.program_id
                          ? availableUnits.length
                            ? 'Select unit'
                            : 'No units available'
                          : 'Select a program first'}
                      </option>

                      {availableUnits.map(
                        (
                          unit
                        ) => (
                          <option
                            key={
                              unit.id
                            }
                            value={
                              unit.id
                            }
                          >
                            {unit.code
                              ? `${unit.code} — `
                              : ''}
                            {
                              unit.name
                            }
                          </option>
                        )
                      )}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>

                <Field
                  label="Day"
                  required
                >
                  <div className="relative">
                    <select
                      value={
                        form.day_of_week
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          'day_of_week',
                          event.target.value
                        )
                      }
                      className="field-input appearance-none pr-10"
                      required
                    >
                      {DAYS.map(
                        (
                          day
                        ) => (
                          <option
                            key={
                              day.value
                            }
                            value={
                              day.value
                            }
                          >
                            {
                              day.name
                            }
                          </option>
                        )
                      )}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>

                <Field
                  label="Class Type"
                  required
                >
                  <div className="relative">
                    <select
                      value={
                        form.class_type
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          'class_type',
                          event.target
                            .value as TimetableEntry['class_type']
                        )
                      }
                      className="field-input appearance-none pr-10"
                      required
                    >
                      {CLASS_TYPES.map(
                        (
                          type
                        ) => (
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

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>

                <Field
                  label="Start Time"
                  required
                >
                  <input
                    type="time"
                    value={
                      form.start_time
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        'start_time',
                        event.target.value
                      )
                    }
                    className="field-input"
                    required
                  />
                </Field>

                <Field
                  label="End Time"
                  required
                >
                  <input
                    type="time"
                    value={
                      form.end_time
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        'end_time',
                        event.target.value
                      )
                    }
                    className="field-input"
                    required
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field
                    label="Class Title"
                    required
                  >
                    <input
                      type="text"
                      value={
                        form.title
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          'title',
                          event.target.value
                        )
                      }
                      placeholder="e.g. Emergency Trauma Management"
                      className="field-input"
                      required
                      maxLength={
                        255
                      }
                    />
                  </Field>
                </div>

                <Field
                  label="Room / Venue"
                >
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      value={
                        form.room
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          'room',
                          event.target.value
                        )
                      }
                      placeholder="e.g. Lab 2 / Room 104"
                      className="field-input pl-10"
                      maxLength={
                        100
                      }
                    />
                  </div>
                </Field>

                <Field
                  label="Status"
                  required
                >
                  <div className="relative">
                    <select
                      value={
                        form.status
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          'status',
                          event.target
                            .value as TimetableEntry['status']
                        )
                      }
                      className="field-input appearance-none pr-10"
                      required
                    >
                      {STATUSES.map(
                        (
                          status
                        ) => (
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

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>

                <div className="md:col-span-2">
                  <Field
                    label="Description"
                  >
                    <textarea
                      value={
                        form.description
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          'description',
                          event.target.value
                        )
                      }
                      placeholder="Add any notes about this class..."
                      rows={
                        3
                      }
                      className="field-input resize-none"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">

                  <div className="rounded-2xl border border-green-100 bg-green-50/50 p-4">

                    <div className="mb-4">

                      <p className="text-sm font-bold text-slate-900">
                        Recurring Schedule
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Optional. Use dates when this weekly
                        class should only run during a specific
                        teaching period. Leave both blank for an
                        ongoing timetable entry.
                      </p>

                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">

                      <Field
                        label="Start Date"
                      >
                        <input
                          type="date"
                          value={
                            form.start_date
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              'start_date',
                              event.target.value
                            )
                          }
                          className="field-input"
                        />
                      </Field>

                      <Field
                        label="End Date"
                      >
                        <input
                          type="date"
                          value={
                            form.end_date
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              'end_date',
                              event.target.value
                            )
                          }
                          className="field-input"
                        />
                      </Field>

                    </div>

                  </div>

                </div>

              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-700/20 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {selectedEntry
                        ? 'Update Class'
                        : 'Save Class'}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* DETAILS MODAL */}

      {showDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="bg-gradient-to-br from-brand-dark to-brand-green p-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-green-50">
                    {getClassTypeLabel(
                      showDetails.class_type
                    )}
                  </span>

                  <h2 className="mt-3 text-2xl font-black text-white">
                    {
                      showDetails.title
                    }
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDetails(
                      null
                    )
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>

              </div>

            </div>

            <div className="space-y-5 p-6">

              <DetailRow
                icon={
                  <Clock3 className="h-5 w-5" />
                }
                label="Time"
                value={`${formatTime(
                  showDetails.start_time
                )} – ${formatTime(
                  showDetails.end_time
                )} (${formatDuration(
                  showDetails.start_time,
                  showDetails.end_time
                )})`}
              />

              <DetailRow
                icon={
                  <CalendarDays className="h-5 w-5" />
                }
                label="Day"
                value={
                  getDayName(
                    showDetails.day_of_week
                  )
                }
              />

              <DetailRow
                icon={
                  <GraduationCap className="h-5 w-5" />
                }
                label="Program"
                value={
                  showDetails.program_name ||
                  'Not specified'
                }
              />

              {showDetails.unit_name && (
                <DetailRow
                  icon={
                    <Users className="h-5 w-5" />
                  }
                  label="Unit"
                  value={`${showDetails.unit_code
                    ? `${showDetails.unit_code} — `
                    : ''}${showDetails.unit_name}`}
                />
              )}

              {showDetails.room && (
                <DetailRow
                  icon={
                    <MapPin className="h-5 w-5" />
                  }
                  label="Venue"
                  value={
                    showDetails.room
                  }
                />
              )}

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">

                <span className="text-sm font-semibold text-slate-500">
                  Status
                </span>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    showDetails.status ===
                    'completed'
                      ? 'bg-green-100 text-green-700'
                      : showDetails.status ===
                        'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-brand-green'
                  }`}
                >
                  {
                    showDetails.status
                  }
                </span>

              </div>

              {showDetails.description && (
                <div className="rounded-xl border border-slate-100 bg-white p-4">

                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                    Notes
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {
                      showDetails.description
                    }
                  </p>

                </div>
              )}

              {(showDetails.start_date ||
                showDetails.end_date) && (
                <div className="rounded-xl border border-green-100 bg-green-50 p-4">

                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-green">
                    Teaching Period
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {showDetails.start_date
                      ? new Date(
                          `${showDetails.start_date.slice(
                            0,
                            10
                          )}T00:00:00`
                        ).toLocaleDateString(
                          'en-KE',
                          {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }
                        )
                      : 'Start date not specified'}

                    {' – '}

                    {showDetails.end_date
                      ? new Date(
                          `${showDetails.end_date.slice(
                            0,
                            10
                          )}T00:00:00`
                        ).toLocaleDateString(
                          'en-KE',
                          {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }
                        )
                      : 'Ongoing'}
                  </p>

                </div>
              )}

              <div className="flex gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() => {
                    openEditModal(
                      showDetails
                    );
                    setShowDetails(
                      null
                    );
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDelete(
                      showDetails
                    )
                  }
                  disabled={
                    deletingId ===
                    showDetails.id
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId ===
                  showDetails.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">

      <div className="flex items-start justify-between gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
          {icon}
        </div>

      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 text-sm font-semibold text-slate-800">
          {value}
        </p>

      </div>

    </div>
  );
}

