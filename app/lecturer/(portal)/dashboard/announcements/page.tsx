'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Edit3,
  Eye,
  FileText,
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
  id: number | string;
  name: string;
  description?: string | null;
};

type Unit = {
  id: number | string;
  name: string;
  program_id: number | string;
  program_name?: string | null;
};

type Announcement = {
  id: number | string;
  title: string;
  message: string;
  created_by: number | string;
  created_by_role: 'admin' | 'lecturer';
  program_id?: number | string | null;
  unit_id?: number | string | null;
  audience: AnnouncementAudience;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  publish_at: string;
  expires_at?: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  program_name?: string | null;
  unit_name?: string | null;
  creator_name?: string | null;
};

type AnnouncementForm = {
  title: string;
  message: string;
  program_id: string;
  unit_id: string;
  audience: AnnouncementAudience;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  publish_at: string;
  expires_at: string;
  is_pinned: boolean;
};

/* =========================================================
   DEFAULT FORM
========================================================= */

const emptyForm: AnnouncementForm = {
  title: '',
  message: '',
  program_id: '',
  unit_id: '',
  audience: 'students',
  priority: 'normal',
  status: 'published',
  publish_at: '',
  expires_at: '',
  is_pinned: false,
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value?: string | null) {
  if (!value) return '—';

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

function formatDateTime(value?: string | null) {
  if (!value) return '—';

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

function getPriorityClasses(
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

function getStatusClasses(
  status: AnnouncementStatus
) {
  switch (status) {
    case 'published':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';

    case 'draft':
      return 'bg-amber-50 text-amber-700 border-amber-200';

    case 'archived':
      return 'bg-slate-100 text-slate-600 border-slate-200';

    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

function getAudienceLabel(
  audience: AnnouncementAudience
) {
  switch (audience) {
    case 'students':
      return 'Students';

    case 'lecturers':
      return 'Lecturers';

    case 'parents':
      return 'Parents';

    case 'all':
      return 'Everyone';

    default:
      return audience;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function LecturerAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<
    Announcement[]
  >([]);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'all' | AnnouncementStatus>('all');

  const [programFilter, setProgramFilter] =
    useState<string>('all');

  const [showModal, setShowModal] = useState(false);

  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  const [viewingAnnouncement, setViewingAnnouncement] =
    useState<Announcement | null>(null);

  const [form, setForm] =
    useState<AnnouncementForm>(emptyForm);

  /* =====================================================
     LOAD DATA
  ===================================================== */

  async function loadAnnouncements() {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      if (programFilter !== 'all') {
        params.set('program_id', programFilter);
      }

      const response = await fetch(
        `/api/lecturer/announcements?${params.toString()}`,
        {
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to load announcements.'
        );
      }

      setAnnouncements(data.announcements || []);
      setPrograms(data.programs || []);
      setUnits(data.units || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load announcements.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, [statusFilter, programFilter]);

  /* =====================================================
     SEARCH DEBOUNCE
  ===================================================== */

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAnnouncements();
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  /* =====================================================
     FILTERED UNITS FOR FORM
  ===================================================== */

  const formUnits = useMemo(() => {
    if (!form.program_id) {
      return units;
    }

    return units.filter(
      (unit) =>
        String(unit.program_id) ===
        String(form.program_id)
    );
  }, [units, form.program_id]);

  /* =====================================================
     STATISTICS
  ===================================================== */

  const statistics = useMemo(() => {
    const total = announcements.length;

    const published = announcements.filter(
      (item) => item.status === 'published'
    ).length;

    const drafts = announcements.filter(
      (item) => item.status === 'draft'
    ).length;

    const urgent = announcements.filter(
      (item) =>
        item.priority === 'urgent' ||
        item.priority === 'high'
    ).length;

    const pinned = announcements.filter(
      (item) => item.is_pinned
    ).length;

    return {
      total,
      published,
      drafts,
      urgent,
      pinned,
    };
  }, [announcements]);

  /* =====================================================
     OPEN CREATE
  ===================================================== */

  function openCreateModal() {
    setEditingAnnouncement(null);

    setForm({
      ...emptyForm,
      publish_at: '',
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  }

  /* =====================================================
     OPEN EDIT
  ===================================================== */

  function openEditModal(
    announcement: Announcement
  ) {
    setEditingAnnouncement(announcement);

    setForm({
      title: announcement.title,
      message: announcement.message,
      program_id: announcement.program_id
        ? String(announcement.program_id)
        : '',
      unit_id: announcement.unit_id
        ? String(announcement.unit_id)
        : '',
      audience: announcement.audience,
      priority: announcement.priority,
      status: announcement.status,
      publish_at: announcement.publish_at
        ? new Date(announcement.publish_at)
            .toISOString()
            .slice(0, 16)
        : '',
      expires_at: announcement.expires_at
        ? new Date(announcement.expires_at)
            .toISOString()
            .slice(0, 16)
        : '',
      is_pinned: announcement.is_pinned,
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  }

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingAnnouncement(null);
    setForm(emptyForm);
  }

  /* =====================================================
     UPDATE FORM
  ===================================================== */

  function updateForm(
    field: keyof AnnouncementForm,
    value:
      | string
      | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === 'program_id') {
      setForm((current) => ({
        ...current,
        program_id: String(value),
        unit_id: '',
      }));
    }
  }

  /* =====================================================
     SAVE
  ===================================================== */

  async function saveAnnouncement() {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!form.title.trim()) {
        setError(
          'Please enter an announcement title.'
        );
        return;
      }

      if (!form.message.trim()) {
        setError(
          'Please enter an announcement message.'
        );
        return;
      }

      if (
        form.expires_at &&
        form.publish_at &&
        new Date(form.expires_at) <=
          new Date(form.publish_at)
      ) {
        setError(
          'Expiry date must be after the publish date.'
        );
        return;
      }

      const payload = {
        ...(editingAnnouncement
          ? { id: editingAnnouncement.id }
          : {}),
        title: form.title.trim(),
        message: form.message.trim(),
        program_id: form.program_id
          ? Number(form.program_id)
          : null,
        unit_id: form.unit_id
          ? Number(form.unit_id)
          : null,
        audience: form.audience,
        priority: form.priority,
        status: form.status,
        publish_at: form.publish_at || null,
        expires_at: form.expires_at || null,
        is_pinned: form.is_pinned,
      };

      const response = await fetch(
        '/api/lecturer/announcements',
        {
          method: editingAnnouncement
            ? 'PUT'
            : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to save announcement.'
        );
      }

      setSuccess(
        editingAnnouncement
          ? 'Announcement updated successfully.'
          : 'Announcement created successfully.'
      );

      setShowModal(false);
      setEditingAnnouncement(null);
      setForm(emptyForm);

      await loadAnnouncements();

      setTimeout(() => {
        setSuccess('');
      }, 4000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save announcement.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function deleteAnnouncement(
    announcement: Announcement
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${announcement.title}"?`
    );

    if (!confirmed) return;

    try {
      setError('');

      const response = await fetch(
        `/api/lecturer/announcements?id=${announcement.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to delete announcement.'
        );
      }

      setSuccess(
        'Announcement deleted successfully.'
      );

      await loadAnnouncements();

      setTimeout(() => {
        setSuccess('');
      }, 4000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete announcement.'
      );
    }
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
                <Megaphone className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Announcements
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Communicate important updates with
                  students and your academic community.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* SUCCESS */}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <Check className="h-5 w-5 shrink-0" />

            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess('')}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ERROR */}

        {error && !showModal && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError('')}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard
            label="Total"
            value={statistics.total}
            icon={<Bell className="h-5 w-5" />}
          />

          <StatCard
            label="Published"
            value={statistics.published}
            icon={<Send className="h-5 w-5" />}
          />

          <StatCard
            label="Drafts"
            value={statistics.drafts}
            icon={<FileText className="h-5 w-5" />}
          />

          <StatCard
            label="High Priority"
            value={statistics.urgent}
            icon={<AlertCircle className="h-5 w-5" />}
          />

          <StatCard
            label="Pinned"
            value={statistics.pinned}
            icon={<Pin className="h-5 w-5" />}
          />
        </div>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px_auto]">
            {/* SEARCH */}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search announcements..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/10"
              />
            </div>

            {/* STATUS */}

            <SelectField
              value={statusFilter}
              onChange={(value) =>
                setStatusFilter(
                  value as
                    | 'all'
                    | AnnouncementStatus
                )
              }
              options={[
                {
                  value: 'all',
                  label: 'All Status',
                },
                {
                  value: 'published',
                  label: 'Published',
                },
                {
                  value: 'draft',
                  label: 'Drafts',
                },
                {
                  value: 'archived',
                  label: 'Archived',
                },
              ]}
            />

            {/* PROGRAM */}

            <SelectField
              value={programFilter}
              onChange={setProgramFilter}
              options={[
                {
                  value: 'all',
                  label: 'All Programs',
                },
                ...programs.map((program) => ({
                  value: String(program.id),
                  label: program.name,
                })),
              ]}
            />

            {/* REFRESH */}

            <button
              type="button"
              onClick={loadAnnouncements}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading ? 'animate-spin' : ''
                }`}
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>
              Showing announcements available to your
              lecturer account.
            </span>
          </div>
        </div>

        {/* =================================================
            ANNOUNCEMENTS
        ================================================= */}

        <div className="mt-6">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2 className="h-7 w-7 animate-spin text-brand-green" />

                <span className="text-sm">
                  Loading announcements...
                </span>
              </div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Megaphone className="h-8 w-8" />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-900">
                No announcements found
              </h2>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                There are no announcements matching
                your current filters. Create your first
                announcement to communicate with your
                students.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Create Announcement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onView={() =>
                    setViewingAnnouncement(
                      announcement
                    )
                  }
                  onEdit={() =>
                    openEditModal(announcement)
                  }
                  onDelete={() =>
                    deleteAnnouncement(
                      announcement
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ===================================================
          CREATE / EDIT MODAL
      =================================================== */}

      {showModal && (
        <AnnouncementModal
          form={form}
          setForm={updateForm}
          programs={programs}
          units={formUnits}
          editing={!!editingAnnouncement}
          saving={saving}
          error={error}
          onClose={closeModal}
          onSave={saveAnnouncement}
        />
      )}

      {/* ===================================================
          VIEW MODAL
      =================================================== */}

      {viewingAnnouncement && (
        <ViewAnnouncementModal
          announcement={viewingAnnouncement}
          onClose={() =>
            setViewingAnnouncement(null)
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
          {icon}
        </div>

        <span className="text-2xl font-bold text-slate-900">
          {value}
        </span>
      </div>

      <p className="mt-3 text-xs font-medium text-slate-500">
        {label}
      </p>
    </div>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-sm text-slate-700 outline-none transition focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/10"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
  const isOwn =
    announcement.created_by_role === 'lecturer';

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {announcement.is_pinned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                  <Pin className="h-3 w-3" />
                  Pinned
                </span>
              )}

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getPriorityClasses(
                  announcement.priority
                )}`}
              >
                {announcement.priority}
              </span>

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                  announcement.status
                )}`}
              >
                {announcement.status}
              </span>

              {announcement.created_by_role ===
                'admin' && (
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  Admin
                </span>
              )}
            </div>

            <h2 className="mt-3 text-lg font-bold text-slate-900">
              {announcement.title}
            </h2>

            <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600">
              {announcement.message}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
              {announcement.program_name && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {announcement.program_name}
                </span>
              )}

              {announcement.unit_name && (
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {announcement.unit_name}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5" />
                {getAudienceLabel(
                  announcement.audience
                )}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDateTime(
                  announcement.publish_at
                )}
              </span>
            </div>

            {announcement.expires_at && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                Expires{' '}
                {formatDate(
                  announcement.expires_at
                )}
              </div>
            )}

            {announcement.creator_name && (
              <p className="mt-3 text-xs text-slate-400">
                Created by{' '}
                <span className="font-medium text-slate-500">
                  {announcement.creator_name}
                </span>
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:flex-col">
            <button
              type="button"
              onClick={onView}
              title="View announcement"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Eye className="h-4 w-4" />
            </button>

            {isOwn && (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  title="Edit announcement"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-brand-green"
                >
                  <Edit3 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={onDelete}
                  title="Delete announcement"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   ANNOUNCEMENT MODAL
========================================================= */

function AnnouncementModal({
  form,
  setForm,
  programs,
  units,
  editing,
  saving,
  error,
  onClose,
  onSave,
}: {
  form: AnnouncementForm;
  setForm: (
    field: keyof AnnouncementForm,
    value: string | boolean
  ) => void;
  programs: Program[];
  units: Unit[];
  editing: boolean;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editing
                ? 'Edit Announcement'
                : 'Create Announcement'}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Share an important update with your
              academic community.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}

        <div className="overflow-y-auto p-5 sm:p-6">
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <span>{error}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* TITLE */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Title
              </label>

              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm(
                    'title',
                    e.target.value
                  )
                }
                placeholder="e.g. Practical Session Tomorrow"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />
            </div>

            {/* MESSAGE */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Message
              </label>

              <textarea
                value={form.message}
                onChange={(e) =>
                  setForm(
                    'message',
                    e.target.value
                  )
                }
                rows={6}
                placeholder="Write your announcement here..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />
            </div>

            {/* TARGETING */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Targeting
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Choose which program or unit should
                  receive the announcement.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* PROGRAM */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Program
                  </label>

                  <SelectField
                    value={form.program_id}
                    onChange={(value) =>
                      setForm(
                        'program_id',
                        value
                      )
                    }
                    options={[
                      {
                        value: '',
                        label:
                          'All assigned programs',
                      },
                      ...programs.map(
                        (program) => ({
                          value: String(
                            program.id
                          ),
                          label: program.name,
                        })
                      ),
                    ]}
                  />
                </div>

                {/* UNIT */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Unit
                  </label>

                  <SelectField
                    value={form.unit_id}
                    onChange={(value) =>
                      setForm(
                        'unit_id',
                        value
                      )
                    }
                    options={[
                      {
                        value: '',
                        label:
                          form.program_id
                            ? 'All units in program'
                            : 'All units',
                      },
                      ...units.map(
                        (unit) => ({
                          value: String(
                            unit.id
                          ),
                          label: unit.program_name
                            ? `${unit.program_name} — ${unit.name}`
                            : unit.name,
                        })
                      ),
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* AUDIENCE / PRIORITY */}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Audience
                </label>

                <SelectField
                  value={form.audience}
                  onChange={(value) =>
                    setForm(
                      'audience',
                      value
                    )
                  }
                  options={[
                    {
                      value: 'students',
                      label: 'Students',
                    },
                    {
                      value: 'lecturers',
                      label: 'Lecturers',
                    },
                    {
                      value: 'parents',
                      label: 'Parents',
                    },
                    {
                      value: 'all',
                      label: 'Everyone',
                    },
                  ]}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Priority
                </label>

                <SelectField
                  value={form.priority}
                  onChange={(value) =>
                    setForm(
                      'priority',
                      value
                    )
                  }
                  options={[
                    {
                      value: 'low',
                      label: 'Low',
                    },
                    {
                      value: 'normal',
                      label: 'Normal',
                    },
                    {
                      value: 'high',
                      label: 'High',
                    },
                    {
                      value: 'urgent',
                      label: 'Urgent',
                    },
                  ]}
                />
              </div>
            </div>

            {/* STATUS */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Status
              </label>

              <SelectField
                value={form.status}
                onChange={(value) =>
                  setForm(
                    'status',
                    value
                  )
                }
                options={[
                  {
                    value: 'published',
                    label: 'Publish',
                  },
                  {
                    value: 'draft',
                    label: 'Save as Draft',
                  },
                  {
                    value: 'archived',
                    label: 'Archived',
                  },
                ]}
              />
            </div>

            {/* DATES */}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Publish Date
                </label>

                <input
                  type="datetime-local"
                  value={form.publish_at}
                  onChange={(e) =>
                    setForm(
                      'publish_at',
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Expiry Date
                </label>

                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm(
                      'expires_at',
                      e.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />
              </div>
            </div>

            {/* PIN */}

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={form.is_pinned}
                onChange={(e) =>
                  setForm(
                    'is_pinned',
                    e.target.checked
                  )
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green"
              />

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Pin this announcement
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Keep this announcement at the top of
                  the announcements list.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-green px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {form.status === 'published' ? (
                  <Send className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}

                {editing
                  ? 'Save Changes'
                  : form.status === 'published'
                    ? 'Publish Announcement'
                    : 'Save Announcement'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   VIEW MODAL
========================================================= */

function ViewAnnouncementModal({
  announcement,
  onClose,
}: {
  announcement: Announcement;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-slate-200 p-5 sm:p-6">
          <div className="pr-4">
            <div className="flex flex-wrap gap-2">
              {announcement.is_pinned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                  <Pin className="h-3 w-3" />
                  Pinned
                </span>
              )}

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getPriorityClasses(
                  announcement.priority
                )}`}
              >
                {announcement.priority}
              </span>

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                  announcement.status
                )}`}
              >
                {announcement.status}
              </span>
            </div>

            <h2 className="mt-3 text-xl font-bold text-slate-900">
              {announcement.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}

        <div className="max-h-[65vh] overflow-y-auto p-5 sm:p-6">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {announcement.message}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoItem
              icon={<Users className="h-4 w-4" />}
              label="Audience"
              value={getAudienceLabel(
                announcement.audience
              )}
            />

            <InfoItem
              icon={<Clock className="h-4 w-4" />}
              label="Published"
              value={formatDateTime(
                announcement.publish_at
              )}
            />

            <InfoItem
              icon={<FileText className="h-4 w-4" />}
              label="Program"
              value={
                announcement.program_name ||
                'All Programs'
              }
            />

            <InfoItem
              icon={<FileText className="h-4 w-4" />}
              label="Unit"
              value={
                announcement.unit_name ||
                'All Units'
              }
            />

            {announcement.expires_at && (
              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Expires"
                value={formatDateTime(
                  announcement.expires_at
                )}
              />
            )}

            <InfoItem
              icon={<Bell className="h-4 w-4" />}
              label="Created By"
              value={
                announcement.creator_name ||
                (announcement.created_by_role ===
                'admin'
                  ? 'Administrator'
                  : 'Lecturer')
              }
            />
          </div>
        </div>

        {/* FOOTER */}

        <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        {icon}
        {label}
      </div>

      <p className="mt-1.5 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}