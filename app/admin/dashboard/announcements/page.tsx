'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit3,
  Eye,
  Filter,
  Loader2,
  Megaphone,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Users,
  X,
  Archive,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  UserRound,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type AnnouncementStatus =
  | 'draft'
  | 'published'
  | 'archived';

type AnnouncementPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

type AnnouncementAudience =
  | 'students'
  | 'lecturers'
  | 'parents'
  | 'all';

type Program = {
  id: number;
  name: string;
};

type Unit = {
  id: number;
  name: string;
  program_id: number | null;
  program_name: string | null;
};

type Announcement = {
  id: number;
  title: string;
  message: string;

  created_by: number;
  created_by_role: string;

  program_id: number | null;
  unit_id: number | null;

  program_name: string | null;
  unit_name: string | null;

  audience: AnnouncementAudience;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;

  publish_at: string;
  expires_at: string | null;

  is_pinned: boolean;
  is_active: boolean;

  creator_name: string | null;
  creator_email: string | null;

  created_at: string;
  updated_at: string;
};

type Statistics = {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  urgent: number;
  pinned: number;
  student_announcements: number;
  lecturer_announcements: number;
  parent_announcements: number;
  all_announcements: number;
};

/* =========================================================
   DEFAULT FORM
========================================================= */

const emptyForm = {
  id: null as number | null,
  title: '',
  message: '',
  audience: 'all' as AnnouncementAudience,
  priority: 'normal' as AnnouncementPriority,
  status: 'draft' as AnnouncementStatus,
  program_id: '',
  unit_id: '',
  publish_at: '',
  expires_at: '',
  is_pinned: false,
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function priorityClasses(
  priority: AnnouncementPriority
) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-50 text-red-700 border-red-200';

    case 'high':
      return 'bg-orange-50 text-orange-700 border-orange-200';

    case 'low':
      return 'bg-slate-50 text-slate-600 border-slate-200';

    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
}

function statusClasses(
  status: AnnouncementStatus
) {
  switch (status) {
    case 'published':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';

    case 'archived':
      return 'bg-slate-100 text-slate-600 border-slate-200';

    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}

function audienceLabel(
  audience: AnnouncementAudience
) {
  switch (audience) {
    case 'students':
      return 'Students';

    case 'lecturers':
      return 'Lecturers';

    case 'parents':
      return 'Parents';

    default:
      return 'Everyone';
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>([]);

  const [programs, setPrograms] =
    useState<Program[]>([]);

  const [units, setUnits] =
    useState<Unit[]>([]);

  const [statistics, setStatistics] =
    useState<Statistics>({
      total: 0,
      published: 0,
      drafts: 0,
      archived: 0,
      urgent: 0,
      pinned: 0,
      student_announcements: 0,
      lecturer_announcements: 0,
      parent_announcements: 0,
      all_announcements: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('');

  const [audienceFilter, setAudienceFilter] =
    useState('');

  const [priorityFilter, setPriorityFilter] =
    useState('');

  const [programFilter, setProgramFilter] =
    useState('');

  const [showFilters, setShowFilters] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  const [form, setForm] =
    useState(emptyForm);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadAnnouncements =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const params =
          new URLSearchParams();

        if (search.trim()) {
          params.set(
            'search',
            search.trim()
          );
        }

        if (statusFilter) {
          params.set(
            'status',
            statusFilter
          );
        }

        if (audienceFilter) {
          params.set(
            'audience',
            audienceFilter
          );
        }

        if (priorityFilter) {
          params.set(
            'priority',
            priorityFilter
          );
        }

        if (programFilter) {
          params.set(
            'program_id',
            programFilter
          );
        }

        const response = await fetch(
          `/api/admin/announcements?${params.toString()}`,
          {
            cache: 'no-store',
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              'Unable to load announcements.'
          );
        }

        setAnnouncements(
          result.announcements || []
        );

        setPrograms(
          result.programs || []
        );

        setUnits(
          result.units || []
        );

        setStatistics(
          result.statistics || {}
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load announcements.'
        );
      } finally {
        setLoading(false);
      }
    }, [
      search,
      statusFilter,
      audienceFilter,
      priorityFilter,
      programFilter,
    ]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  /* =======================================================
     CLEAR MESSAGES
  ======================================================= */

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer =
      setTimeout(() => {
        setSuccess('');
      }, 4000);

    return () => clearTimeout(timer);
  }, [success]);

  /* =======================================================
     FILTERED UNITS
  ======================================================= */

  const availableUnits =
    useMemo(() => {
      if (!form.program_id) {
        return units;
      }

      return units.filter(
        (unit) =>
          String(unit.program_id) ===
          String(form.program_id)
      );
    }, [
      units,
      form.program_id,
    ]);

  /* =======================================================
     OPEN CREATE
  ======================================================= */

  function openCreate() {
    setForm({
      ...emptyForm,
      publish_at: '',
    });

    setSelectedAnnouncement(null);
    setShowModal(true);
    setError('');
  }

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  function openEdit(
    announcement: Announcement
  ) {
    setForm({
      id: announcement.id,
      title: announcement.title,
      message: announcement.message,
      audience: announcement.audience,
      priority: announcement.priority,
      status: announcement.status,
      program_id:
        announcement.program_id
          ? String(
              announcement.program_id
            )
          : '',
      unit_id:
        announcement.unit_id
          ? String(
              announcement.unit_id
            )
          : '',
      publish_at:
        announcement.publish_at
          ? new Date(
              announcement.publish_at
            )
              .toISOString()
              .slice(0, 16)
          : '',
      expires_at:
        announcement.expires_at
          ? new Date(
              announcement.expires_at
            )
              .toISOString()
              .slice(0, 16)
          : '',
      is_pinned:
        announcement.is_pinned,
    });

    setSelectedAnnouncement(
      announcement
    );

    setShowModal(true);
    setError('');
  }

  /* =======================================================
     VIEW
  ======================================================= */

  function openView(
    announcement: Announcement
  ) {
    setSelectedAnnouncement(
      announcement
    );

    setShowViewModal(true);
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function saveAnnouncement(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        id: form.id,
        title: form.title,
        message: form.message,
        audience: form.audience,
        priority: form.priority,
        status: form.status,
        program_id:
          form.program_id
            ? Number(form.program_id)
            : null,
        unit_id:
          form.unit_id
            ? Number(form.unit_id)
            : null,
        publish_at:
          form.publish_at || null,
        expires_at:
          form.expires_at || null,
        is_pinned:
          form.is_pinned,
      };

      const response = await fetch(
        '/api/admin/announcements',
        {
          method: form.id
            ? 'PUT'
            : 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            'Unable to save announcement.'
        );
      }

      setShowModal(false);

      setForm(emptyForm);

      setSuccess(
        form.id
          ? 'Announcement updated successfully.'
          : 'Announcement created successfully.'
      );

      await loadAnnouncements();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save announcement.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deleteAnnouncement() {
    if (!deleteId) {
      return;
    }

    try {
      setDeleting(true);
      setError('');

      const response = await fetch(
        `/api/admin/announcements?id=${deleteId}`,
        {
          method: 'DELETE',
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            'Unable to delete announcement.'
        );
      }

      setDeleteId(null);

      setSuccess(
        'Announcement deleted successfully.'
      );

      await loadAnnouncements();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete announcement.'
      );
    } finally {
      setDeleting(false);
    }
  }

  /* =======================================================
     RESET FILTERS
  ======================================================= */

  function resetFilters() {
    setSearch('');
    setStatusFilter('');
    setAudienceFilter('');
    setPriorityFilter('');
    setProgramFilter('');
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">
                <Megaphone className="h-7 w-7 text-brand-green" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    Announcements
                  </h1>

                  <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">
                    Admin
                  </span>
                </div>

                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Create, publish and manage
                  announcements across the
                  Shifah Medical Training College
                  LMS.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadAnnouncements}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
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

              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-green/90"
              >
                <Plus className="h-4 w-4" />

                New Announcement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-bold">
                Something went wrong
              </p>

              <p className="mt-1">
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
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />

            <span className="font-semibold">
              {success}
            </span>
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={
              <Bell className="h-5 w-5" />
            }
            label="Total"
            value={statistics.total}
            description="All announcements"
          />

          <StatCard
            icon={
              <Send className="h-5 w-5" />
            }
            label="Published"
            value={statistics.published}
            description="Currently published"
          />

          <StatCard
            icon={
              <Clock className="h-5 w-5" />
            }
            label="Drafts"
            value={statistics.drafts}
            description="Awaiting publication"
          />

          <StatCard
            icon={
              <Pin className="h-5 w-5" />
            }
            label="Pinned"
            value={statistics.pinned}
            description="Pinned announcements"
          />
        </div>

        {/* =================================================
            SEARCH / FILTER
        ================================================= */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search announcements..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/10"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  !showFilters
                )
              }
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${
                showFilters
                  ? 'border-brand-green bg-brand-green/5 text-brand-green'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="h-4 w-4" />

              Filters

              <ChevronDown
                className={`h-4 w-4 transition ${
                  showFilters
                    ? 'rotate-180'
                    : ''
                }`}
              />
            </button>

            {(search ||
              statusFilter ||
              audienceFilter ||
              priorityFilter ||
              programFilter) && (
              <button
                type="button"
                onClick={resetFilters}
                className="h-11 rounded-xl px-4 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect
                label="Status"
                value={statusFilter}
                onChange={
                  setStatusFilter
                }
                options={[
                  ['', 'All statuses'],
                  [
                    'published',
                    'Published',
                  ],
                  ['draft', 'Drafts'],
                  [
                    'archived',
                    'Archived',
                  ],
                ]}
              />

              <FilterSelect
                label="Audience"
                value={audienceFilter}
                onChange={
                  setAudienceFilter
                }
                options={[
                  ['', 'All audiences'],
                  [
                    'all',
                    'Everyone',
                  ],
                  [
                    'students',
                    'Students',
                  ],
                  [
                    'lecturers',
                    'Lecturers',
                  ],
                  [
                    'parents',
                    'Parents',
                  ],
                ]}
              />

              <FilterSelect
                label="Priority"
                value={priorityFilter}
                onChange={
                  setPriorityFilter
                }
                options={[
                  ['', 'All priorities'],
                  ['urgent', 'Urgent'],
                  ['high', 'High'],
                  [
                    'normal',
                    'Normal',
                  ],
                  ['low', 'Low'],
                ]}
              />

              <FilterSelect
                label="Program"
                value={programFilter}
                onChange={
                  setProgramFilter
                }
                options={[
                  [
                    '',
                    'All programs',
                  ],
                  ...programs.map(
                    (program) => [
                      String(
                        program.id
                      ),
                      program.name,
                    ] as [
                      string,
                      string
                    ]
                  ),
                ]}
              />
            </div>
          )}
        </div>

        {/* =================================================
            ANNOUNCEMENTS
        ================================================= */}

        <div className="mt-6">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-green" />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Loading announcements...
                </p>
              </div>
            </div>
          ) : announcements.length ===
            0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Megaphone className="h-8 w-8 text-slate-400" />
              </div>

              <h3 className="mt-5 text-lg font-black text-slate-900">
                No announcements found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Create your first LMS
                announcement or adjust your
                search and filters.
              </p>

              <button
                type="button"
                onClick={openCreate}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-2.5 text-sm font-bold text-white"
              >
                <Plus className="h-4 w-4" />

                Create Announcement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(
                (announcement) => (
                  <AnnouncementCard
                    key={
                      announcement.id
                    }
                    announcement={
                      announcement
                    }
                    onView={() =>
                      openView(
                        announcement
                      )
                    }
                    onEdit={() =>
                      openEdit(
                        announcement
                      )
                    }
                    onDelete={() =>
                      setDeleteId(
                        announcement.id
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </main>

      {/* ===================================================
          CREATE / EDIT MODAL
      =================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {form.id
                    ? 'Edit Announcement'
                    : 'Create Announcement'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Send an important message to
                  users of the LMS.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={saveAnnouncement}
              className="space-y-6 p-6"
            >
              {/* TITLE */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Announcement Title
                </label>

                <input
                  required
                  maxLength={255}
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title:
                        event.target
                          .value,
                    })
                  }
                  placeholder="e.g. Important Academic Notice"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />
              </div>

              {/* MESSAGE */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Message
                </label>

                <textarea
                  required
                  rows={7}
                  value={form.message}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      message:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Write your announcement..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />
              </div>

              {/* AUDIENCE / PRIORITY */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormSelect
                  label="Audience"
                  value={form.audience}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      audience:
                        value as AnnouncementAudience,
                    })
                  }
                  options={[
                    [
                      'all',
                      'Everyone',
                    ],
                    [
                      'students',
                      'Students',
                    ],
                    [
                      'lecturers',
                      'Lecturers',
                    ],
                    [
                      'parents',
                      'Parents',
                    ],
                  ]}
                />

                <FormSelect
                  label="Priority"
                  value={form.priority}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      priority:
                        value as AnnouncementPriority,
                    })
                  }
                  options={[
                    [
                      'low',
                      'Low',
                    ],
                    [
                      'normal',
                      'Normal',
                    ],
                    [
                      'high',
                      'High',
                    ],
                    [
                      'urgent',
                      'Urgent',
                    ],
                  ]}
                />
              </div>

              {/* PROGRAM / UNIT */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormSelect
                  label="Program"
                  value={
                    form.program_id
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      program_id:
                        value,
                      unit_id: '',
                    })
                  }
                  options={[
                    [
                      '',
                      'All programs',
                    ],
                    ...programs.map(
                      (program) => [
                        String(
                          program.id
                        ),
                        program.name,
                      ] as [
                        string,
                        string
                      ]
                    ),
                  ]}
                />

                <FormSelect
                  label="Unit"
                  value={form.unit_id}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      unit_id:
                        value,
                    })
                  }
                  options={[
                    [
                      '',
                      'All units',
                    ],
                    ...availableUnits.map(
                      (unit) => [
                        String(
                          unit.id
                        ),
                        unit.name,
                      ] as [
                        string,
                        string
                      ]
                    ),
                  ]}
                />
              </div>

              {/* SCHEDULE */}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand-green" />

                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Publication Schedule
                    </h3>

                    <p className="text-xs text-slate-500">
                      Leave publication date empty
                      to publish immediately when
                      status is published.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-600">
                      Publish At
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        form.publish_at
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          publish_at:
                            event
                              .target
                              .value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-green"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-600">
                      Expires At
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        form.expires_at
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          expires_at:
                            event
                              .target
                              .value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-green"
                    />
                  </div>
                </div>
              </div>

              {/* STATUS */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Status
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      [
                        'draft',
                        'Draft',
                      ],
                      [
                        'published',
                        'Published',
                      ],
                      [
                        'archived',
                        'Archived',
                      ],
                    ] as [
                      AnnouncementStatus,
                      string
                    ][]
                  ).map(
                    ([
                      value,
                      label,
                    ]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            status:
                              value,
                          })
                        }
                        className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                          form.status ===
                          value
                            ? 'border-brand-green bg-brand-green/10 text-brand-green'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* PIN */}

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <input
                  type="checkbox"
                  checked={
                    form.is_pinned
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      is_pinned:
                        event
                          .target
                          .checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green"
                />

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Pin this announcement
                  </p>

                  <p className="text-xs text-slate-500">
                    Pinned announcements appear
                    above other announcements.
                  </p>
                </div>
              </label>

              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  {saving
                    ? 'Saving...'
                    : form.id
                    ? 'Save Changes'
                    : 'Create Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          VIEW MODAL
      =================================================== */}

      {showViewModal &&
        selectedAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b p-6">
                <div className="pr-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses(
                        selectedAnnouncement.status
                      )}`}
                    >
                      {
                        selectedAnnouncement.status
                      }
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${priorityClasses(
                        selectedAnnouncement.priority
                      )}`}
                    >
                      {
                        selectedAnnouncement.priority
                      }
                    </span>

                    {selectedAnnouncement.is_pinned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                        <Pin className="h-3 w-3" />

                        Pinned
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-2xl font-black text-slate-900">
                    {
                      selectedAnnouncement.title
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                  {
                    selectedAnnouncement.message
                  }
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoItem
                    icon={
                      <Users className="h-4 w-4" />
                    }
                    label="Audience"
                    value={audienceLabel(
                      selectedAnnouncement.audience
                    )}
                  />

                  <InfoItem
                    icon={
                      <UserRound className="h-4 w-4" />
                    }
                    label="Created By"
                    value={
                      selectedAnnouncement.creator_name ||
                      'Administrator'
                    }
                  />

                  <InfoItem
                    icon={
                      <GraduationCap className="h-4 w-4" />
                    }
                    label="Program"
                    value={
                      selectedAnnouncement.program_name ||
                      'All programs'
                    }
                  />

                  <InfoItem
                    icon={
                      <BookOpen className="h-4 w-4" />
                    }
                    label="Unit"
                    value={
                      selectedAnnouncement.unit_name ||
                      'All units'
                    }
                  />

                  <InfoItem
                    icon={
                      <Calendar className="h-4 w-4" />
                    }
                    label="Published"
                    value={formatDateTime(
                      selectedAnnouncement.publish_at
                    )}
                  />

                  <InfoItem
                    icon={
                      <Clock className="h-4 w-4" />
                    }
                    label="Expires"
                    value={formatDateTime(
                      selectedAnnouncement.expires_at
                    )}
                  />
                </div>

                <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewModal(
                        false
                      );

                      openEdit(
                        selectedAnnouncement
                      );
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Edit3 className="h-4 w-4" />

                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowViewModal(
                        false
                      );

                      setDeleteId(
                        selectedAnnouncement.id
                      );
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />

                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ===================================================
          DELETE CONFIRMATION
      =================================================== */}

      {deleteId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              Delete announcement?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This action cannot be undone. The
              announcement will be permanently
              removed from the LMS.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setDeleteId(null)
                }
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  deleteAnnouncement
                }
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {deleting
                  ? 'Deleting...'
                  : 'Delete Announcement'}
              </button>
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
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
          {icon}
        </div>

        <span className="text-2xl font-black text-slate-900">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-black text-slate-800">
        {label}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: [
    string,
    string
  ][];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-brand-green"
      >
        {options.map(
          ([optionValue, label]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

/* =========================================================
   FORM SELECT
========================================================= */

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: [
    string,
    string
  ][];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
      >
        {options.map(
          ([optionValue, label]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

/* =========================================================
   ANNOUNCEMENT CARD
========================================================= */

function AnnouncementCard({
  announcement,
  onView,
  onEdit,
  onDelete,
}: {
  announcement: Announcement;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses(
                  announcement.status
                )}`}
              >
                {announcement.status}
              </span>

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${priorityClasses(
                  announcement.priority
                )}`}
              >
                {announcement.priority}
              </span>

              {announcement.is_pinned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                  <Pin className="h-3 w-3" />

                  Pinned
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onView}
              className="mt-3 text-left"
            >
              <h2 className="text-lg font-black text-slate-900 transition group-hover:text-brand-green">
                {announcement.title}
              </h2>
            </button>

            <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {announcement.message}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <MetaPill
                icon={
                  <Users className="h-3.5 w-3.5" />
                }
                text={audienceLabel(
                  announcement.audience
                )}
              />

              <MetaPill
                icon={
                  <GraduationCap className="h-3.5 w-3.5" />
                }
                text={
                  announcement.program_name ||
                  'All programs'
                }
              />

              {announcement.unit_name && (
                <MetaPill
                  icon={
                    <BookOpen className="h-3.5 w-3.5" />
                  }
                  text={
                    announcement.unit_name
                  }
                />
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onView}
              title="View"
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              <Eye className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onEdit}
              title="Edit"
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-brand-green"
            >
              <Edit3 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onDelete}
              title="Delete"
              className="rounded-xl border border-red-100 p-2.5 text-red-500 transition hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5" />

              {announcement.creator_name ||
                'Administrator'}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />

              {formatDate(
                announcement.created_at
              )}
            </span>
          </div>

          <span
            className={
              announcement.is_active
                ? 'font-bold text-emerald-600'
                : 'text-slate-400'
            }
          >
            {announcement.is_active
              ? 'Currently active'
              : announcement.status ===
                'published'
              ? 'Not currently active'
              : 'Not published'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   META PILL
========================================================= */

function MetaPill({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
      {icon}

      <span className="truncate">
        {text}
      </span>
    </span>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        {icon}

        {label}
      </div>

      <p className="mt-2 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}