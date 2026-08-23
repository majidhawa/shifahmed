'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Search,
  GraduationCap,
  Users,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';

type Program = {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  duration: string | null;
  level: string | null;
  status: string;
  created_at: string;
  unit_count: number;
};

export default function LMSPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    duration: '',
    level: '',
  });

  /* =========================================================
     LOAD PROGRAMS
  ========================================================= */

  async function loadPrograms() {
    try {
      setLoading(true);

      const response = await fetch('/api/lms/programs');

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to load programs.'
        );
      }

      setPrograms(data.programs || []);
    } catch (error) {
      console.error(error);
      alert('Failed to load LMS programs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrograms();
  }, []);

  /* =========================================================
     CREATE PROGRAM
  ========================================================= */

  async function handleCreateProgram(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert('Program name is required.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/api/lms/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to create program.'
        );
      }

      setPrograms((current) => [
        ...current,
        {
          ...data.program,
          unit_count: 0,
        },
      ]);

      setForm({
        name: '',
        code: '',
        description: '',
        duration: '',
        level: '',
      });

      setShowModal(false);
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to create program.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     FILTER PROGRAMS
  ========================================================= */

  const filteredPrograms = programs.filter((program) => {
    const value = search.toLowerCase();

    return (
      program.name
        ?.toLowerCase()
        .includes(value) ||
      program.code
        ?.toLowerCase()
        .includes(value) ||
      program.level
        ?.toLowerCase()
        .includes(value)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <span>Admin</span>
            <ChevronRight size={14} />
            <span>LMS</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Learning Management System
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage academic programs, units and learning
            activities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <Plus size={18} />
          Add Program
        </button>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Total Programs
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {programs.length}
              </p>
            </div>

            <div className="rounded-xl bg-brand-green/10 p-3 text-brand-green">
              <GraduationCap size={22} />
            </div>

          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Active Programs
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {
                  programs.filter(
                    (program) =>
                      program.status === 'active'
                  ).length
                }
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <BookOpen size={22} />
            </div>

          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Total Units
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {programs.reduce(
                  (total, program) =>
                    total + Number(program.unit_count || 0),
                  0
                )}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Users size={22} />
            </div>

          </div>
        </div>

      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="relative max-w-md">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search programs..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
          />

        </div>

      </div>

      {/* =====================================================
          PROGRAMS
      ===================================================== */}

      {loading ? (

        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">

          <div className="flex items-center gap-3 text-sm text-slate-500">

            <Loader2
              size={20}
              className="animate-spin"
            />

            Loading programs...

          </div>

        </div>

      ) : filteredPrograms.length === 0 ? (

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

          <BookOpen
            size={40}
            className="mx-auto mb-4 text-slate-300"
          />

          <h3 className="font-semibold text-slate-800">
            No programs found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Try another search or create a new program.
          </p>

        </div>

      ) : (

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          {filteredPrograms.map((program) => (

            <div
              key={program.id}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              {/* PROGRAM ICON */}

              <div className="mb-5 flex items-start justify-between">

                <div className="rounded-xl bg-brand-green/10 p-3 text-brand-green">
                  <GraduationCap size={24} />
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    program.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {program.status}
                </span>

              </div>

              {/* PROGRAM */}

              <h2 className="text-lg font-bold text-slate-900">
                {program.name}
              </h2>

              {program.code && (
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-green">
                  {program.code}
                </p>
              )}

              {program.description && (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                  {program.description}
                </p>
              )}

              {/* META */}

              <div className="mt-5 grid grid-cols-2 gap-3">

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    Duration
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {program.duration || '—'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    Level
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {program.level || '—'}
                  </p>
                </div>

              </div>

              {/* FOOTER */}

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                <span className="text-sm text-slate-500">
                  <strong className="text-slate-800">
                    {program.unit_count}
                  </strong>{' '}
                  {program.unit_count === 1
                    ? 'Unit'
                    : 'Units'}
                </span>

                <Link
                  href={`/admin/dashboard/lms/programs/${program.id}`}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-brand-green transition hover:bg-brand-green/10"
                >
                  Manage
                  <ChevronRight size={16} />
                </Link>

              </div>

            </div>

          ))}

        </div>

      )}

      {/* =====================================================
          ADD PROGRAM MODAL
      ===================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Add Program
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Create an academic program for the LMS.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleCreateProgram}
              className="space-y-5 p-6"
            >

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Program Name *
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Diploma in Paramedicine"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Program Code
                  </label>

                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        code: e.target.value,
                      })
                    }
                    placeholder="e.g. PARAMEDIC"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Level
                  </label>

                  <input
                    type="text"
                    value={form.level}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        level: e.target.value,
                      })
                    }
                    placeholder="e.g. Level 6"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />
                </div>

              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Duration
                </label>

                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duration: e.target.value,
                    })
                  }
                  placeholder="e.g. 2 Years"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Brief description of the program..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? 'Creating...'
                    : 'Create Program'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}