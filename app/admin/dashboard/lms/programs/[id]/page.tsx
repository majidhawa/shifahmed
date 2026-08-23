'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  GraduationCap,
  Loader2,
  ChevronRight,
  X,
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

type Unit = {
  id: number;
  program_id: number;
  code: string | null;
  name: string;
  description: string | null;
  credit_hours: number | null;
  year_of_study: number | null;
  term_number: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function ProgramManagementPage() {
  const params = useParams();

  const id = params?.id;

  const [program, setProgram] = useState<Program | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    credit_hours: '',
    year_of_study: '1',
    term_number: '1',
  });

  /* =========================================================
     LOAD PROGRAM
  ========================================================= */

  async function loadProgram() {
    if (!id) return;

    try {
      const response = await fetch(
        `/api/lms/programs/${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to load program.'
        );
      }

      setProgram(data.program);
    } catch (error) {
      console.error(error);
      alert('Failed to load program.');
    }
  }

  /* =========================================================
     LOAD UNITS
  ========================================================= */

  async function loadUnits() {
    if (!id) return;

    try {
      const response = await fetch(
        `/api/lms/units?program_id=${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to load units.'
        );
      }

      setUnits(data.units || []);
    } catch (error) {
      console.error(error);
      alert('Failed to load units.');
    }
  }

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  async function loadData() {
    try {
      setLoading(true);

      await Promise.all([
        loadProgram(),
        loadUnits(),
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  /* =========================================================
     CREATE UNIT
  ========================================================= */

  async function handleCreateUnit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!id) return;

    if (!form.name.trim()) {
      alert('Unit name is required.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        '/api/lms/units',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            program_id: Number(id),
            name: form.name,
            code: form.code,
            description: form.description,
            credit_hours:
              form.credit_hours === ''
                ? 0
                : Number(form.credit_hours),
            year_of_study:
              Number(form.year_of_study),
            term_number:
              Number(form.term_number),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to create unit.'
        );
      }

      setUnits((current) => [
        ...current,
        data.unit,
      ]);

      setProgram((current) =>
        current
          ? {
              ...current,
              unit_count:
                Number(current.unit_count || 0) + 1,
            }
          : current
      );

      setForm({
        name: '',
        code: '',
        description: '',
        credit_hours: '',
        year_of_study: '1',
        term_number: '1',
      });

      setShowModal(false);
    } catch (error: any) {
      console.error(error);

      alert(
        error?.message ||
          'Failed to create unit.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">

        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">

          <div className="flex items-center gap-3 text-sm text-slate-500">

            <Loader2
              size={20}
              className="animate-spin"
            />

            Loading program...

          </div>

        </div>

      </div>
    );
  }

  /* =========================================================
     PROGRAM NOT FOUND
  ========================================================= */

  if (!program) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">

        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

          <BookOpen
            size={40}
            className="mx-auto mb-4 text-slate-300"
          />

          <h2 className="text-lg font-bold text-slate-900">
            Program not found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            The program you're looking for does not exist.
          </p>

          <Link
            href="/admin/dashboard/lms"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white"
          >
            <ArrowLeft size={17} />
            Back to Programs
          </Link>

        </div>

      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">

      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">

        <Link
          href="/admin/dashboard/lms"
          className="transition hover:text-brand-green"
        >
          LMS
        </Link>

        <ChevronRight size={14} />

        <span className="text-slate-700">
          {program.name}
        </span>

      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

        <div className="flex items-start gap-4">

          <Link
            href="/admin/dashboard/lms"
            className="mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>

            <div className="mb-3 flex items-center gap-3">

              <div className="rounded-xl bg-brand-green/10 p-3 text-brand-green">
                <GraduationCap size={25} />
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

            <h1 className="text-2xl font-bold text-slate-900">
              {program.name}
            </h1>

            {program.code && (
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-brand-green">
                {program.code}
              </p>
            )}

            {program.description && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                {program.description}
              </p>
            )}

          </div>

        </div>

        {/* HEADER ADD UNIT BUTTON */}

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <Plus size={18} />
          Add Unit
        </button>

      </div>

      {/* =====================================================
          PROGRAM INFORMATION
      ===================================================== */}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Program Level
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {program.level || '—'}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Duration
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {program.duration || '—'}
          </p>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-slate-500">
            Total Units
          </p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {units.length}
          </p>

        </div>

      </div>

      {/* =====================================================
          UNITS
      ===================================================== */}

      <div>

        <div className="mb-5 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              Units
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage the units that belong to this program.
            </p>

          </div>

          {units.length > 0 && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus size={17} />
              Add Unit
            </button>
          )}

        </div>

        {/* ===================================================
            NO UNITS
        =================================================== */}

        {units.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

            <BookOpen
              size={42}
              className="mx-auto mb-4 text-slate-300"
            />

            <h3 className="text-lg font-semibold text-slate-800">
              No units yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              This program doesn't have any units yet.
              Add the first unit to begin building the
              curriculum.
            </p>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus size={18} />
              Add First Unit
            </button>

          </div>

        ) : (

          /* =================================================
             UNIT LIST
          ================================================= */

          <div className="space-y-4">

            {units.map((unit, index) => (

              <div
                key={unit.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  {/* UNIT INFORMATION */}

                  <div className="flex items-start gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-sm font-bold text-brand-green">
                      {index + 1}
                    </div>

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="text-base font-bold text-slate-900">
                          {unit.name}
                        </h3>

                        {unit.code && (
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                            {unit.code}
                          </span>
                        )}

                      </div>

                      {unit.description && (
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {unit.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">

                        <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                          Year {unit.year_of_study || 1}
                        </span>

                        <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                          Term {unit.term_number || 1}
                        </span>

                        <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                          {unit.credit_hours || 0} Credit Hours
                        </span>

                        <span
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                            unit.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {unit.status}
                        </span>

                      </div>

                    </div>

                  </div>

                  {/* MANAGE UNIT */}

                  <Link
                    href={`/admin/dashboard/lms/units/${unit.id}`}
                    className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-brand-green transition hover:bg-brand-green/10"
                  >
                    Manage
                    <ChevronRight size={16} />
                  </Link>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* =====================================================
          ADD UNIT MODAL
      ===================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  Add Unit
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Add a unit to {program.name}.
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
              onSubmit={handleCreateUnit}
              className="space-y-5 p-6"
            >

              {/* UNIT NAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Unit Name *
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
                  placeholder="e.g. Anatomy & Physiology"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

              {/* UNIT CODE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Unit Code
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
                  placeholder="e.g. EMT 101"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

              {/* YEAR / TERM / CREDITS */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                {/* YEAR */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Year
                  </label>

                  <select
                    value={form.year_of_study}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        year_of_study: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  >

                    <option value="1">
                      Year 1
                    </option>

                    <option value="2">
                      Year 2
                    </option>

                    <option value="3">
                      Year 3
                    </option>

                    <option value="4">
                      Year 4
                    </option>

                  </select>

                </div>

                {/* TERM */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Term
                  </label>

                  <select
                    value={form.term_number}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        term_number: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  >

                    <option value="1">
                      Term 1
                    </option>

                    <option value="2">
                      Term 2
                    </option>

                    <option value="3">
                      Term 3
                    </option>

                  </select>

                </div>

                {/* CREDIT HOURS */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Credits
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.credit_hours}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        credit_hours: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                  />

                </div>

              </div>

              {/* DESCRIPTION */}

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
                  placeholder="Brief description of this unit..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                    : 'Create Unit'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}