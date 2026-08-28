
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type LecturerUnit = {
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

  course_id: number;
  course_name: string;
  course_code: string | null;

  topic_count: number;
};

type AssignedCourse = {
  id: number;
  name: string;
  code: string | null;
};

type CourseGroup = AssignedCourse & {
  units: LecturerUnit[];
};

type UnitForm = {
  program_id: string;
  code: string;
  name: string;
  description: string;
  credit_hours: string;
  year_of_study: string;
  term_number: string;
  status: string;
};

/* =========================================================
   HELPERS
========================================================= */

function safeString(value: unknown): string {
  return typeof value === 'string'
    ? value
    : value == null
    ? ''
    : String(value);
}

function safeNumber(value: unknown): number | null {
  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === 'string' &&
    value.trim() !== ''
  ) {
    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}

/* =========================================================
   DEFAULT FORM
========================================================= */

function createEmptyUnitForm(
  courseId?: number
): UnitForm {
  return {
    program_id:
      courseId != null
        ? String(courseId)
        : '',
    code: '',
    name: '',
    description: '',
    credit_hours: '0',
    year_of_study: '1',
    term_number: '1',
    status: 'active',
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function LecturerUnitsPage() {
  /* =======================================================
     DATA
  ======================================================= */

  const [units, setUnits] =
    useState<LecturerUnit[]>([]);

  const [assignedCourses, setAssignedCourses] =
    useState<AssignedCourse[]>([]);

  /* =======================================================
     UI STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [selectedCourseId, setSelectedCourseId] =
    useState<number | 'all'>('all');

  const [expandedCourses, setExpandedCourses] =
    useState<Set<number>>(new Set());

  /* =======================================================
     ADD / EDIT MODAL
  ======================================================= */

  const [showUnitModal, setShowUnitModal] =
    useState(false);

  const [editingUnit, setEditingUnit] =
    useState<LecturerUnit | null>(null);

  const [savingUnit, setSavingUnit] =
    useState(false);

  const [formError, setFormError] =
    useState('');

  const [formSuccess, setFormSuccess] =
    useState('');

  const [unitForm, setUnitForm] =
    useState<UnitForm>(
      createEmptyUnitForm()
    );

  /* =======================================================
     DELETE STATE
  ======================================================= */

  const [deletingUnitId, setDeletingUnitId] =
    useState<number | null>(null);

  const [deleteError, setDeleteError] =
    useState('');

  const [deleteSuccess, setDeleteSuccess] =
    useState('');

  const [unitToDelete, setUnitToDelete] =
    useState<LecturerUnit | null>(null);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  async function loadUnits() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        '/api/lecturer/units',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );

      const data: unknown =
        await response.json();

      if (
        !response.ok ||
        typeof data !== 'object' ||
        data === null
      ) {
        throw new Error(
          'Unable to load course units.'
        );
      }

      const responseData =
        data as {
          success?: boolean;
          message?: string;
          courses?: unknown;
          units?: unknown;
        };

      if (
        !responseData.success
      ) {
        throw new Error(
          responseData.message ||
            'Unable to load course units.'
        );
      }

      /* =================================================
         COURSES
      ================================================= */

      const apiCourses =
        Array.isArray(
          responseData.courses
        )
          ? responseData.courses
          : [];

      const normalizedCourses: AssignedCourse[] =
        [];

      for (
        const rawCourse of apiCourses
      ) {
        if (
          typeof rawCourse !==
            'object' ||
          rawCourse === null
        ) {
          continue;
        }

        const course =
          rawCourse as Record<
            string,
            unknown
          >;

        const id =
          safeNumber(
            course.id
          );

        if (id === null) {
          continue;
        }

        normalizedCourses.push({
          id,

          name:
            safeString(
              course.name
            ) ||
            'Unnamed Course',

          code:
            course.code != null
              ? safeString(
                  course.code
                )
              : null,
        });
      }

      normalizedCourses.sort(
        (
          a: AssignedCourse,
          b: AssignedCourse
        ) =>
          safeString(
            a.name
          ).localeCompare(
            safeString(
              b.name
            )
          )
      );

      setAssignedCourses(
        normalizedCourses
      );

      /* =================================================
         UNITS
      ================================================= */

      const apiUnits =
        Array.isArray(
          responseData.units
        )
          ? responseData.units
          : [];

      const normalizedUnits: LecturerUnit[] =
        [];

      for (
        const rawUnit of apiUnits
      ) {
        if (
          typeof rawUnit !==
            'object' ||
          rawUnit === null
        ) {
          continue;
        }

        const unitData =
          rawUnit as Record<
            string,
            unknown
          >;

        const id =
          safeNumber(
            unitData.id
          );

        const courseId =
          safeNumber(
            unitData.course_id ??
              unitData.program_id
          );

        if (
          id === null ||
          courseId === null
        ) {
          continue;
        }

        normalizedUnits.push({
          id,

          program_id:
            safeNumber(
              unitData.program_id
            ) ?? courseId,

          code:
            unitData.code != null
              ? safeString(
                  unitData.code
                )
              : null,

          name:
            safeString(
              unitData.name ??
                unitData.unit_name
            ) ||
            'Unnamed Unit',

          description:
            unitData.description != null
              ? safeString(
                  unitData.description
                )
              : null,

          credit_hours:
            safeNumber(
              unitData.credit_hours
            ),

          year_of_study:
            safeNumber(
              unitData.year_of_study
            ),

          term_number:
            safeNumber(
              unitData.term_number
            ),

          status:
            safeString(
              unitData.status
            ) || 'active',

          created_at:
            safeString(
              unitData.created_at
            ),

          updated_at:
            safeString(
              unitData.updated_at
            ),

          course_id:
            courseId,

          course_name:
            safeString(
              unitData.course_name ??
                unitData.program_name
            ) ||
            'Unnamed Course',

          course_code:
            unitData.course_code != null
              ? safeString(
                  unitData.course_code
                )
              : unitData.program_code != null
              ? safeString(
                  unitData.program_code
                )
              : null,

          topic_count:
            safeNumber(
              unitData.topic_count
            ) ?? 0,
        });
      }

      setUnits(
        normalizedUnits
      );

      if (
        normalizedCourses.length >
        0
      ) {
        setExpandedCourses(
          (
            current: Set<number>
          ) => {
            const next =
              new Set(current);

            if (
              next.size === 0
            ) {
              next.add(
                normalizedCourses[0].id
              );
            }

            return next;
          }
        );
      }
    } catch (error) {
      console.error(
        'LOAD LECTURER UNITS ERROR:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load course units.'
      );

      setUnits([]);
      setAssignedCourses([]);
      setExpandedCourses(
        new Set()
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadUnits();
  }, []);

  /* =======================================================
     GROUP COURSES
  ======================================================= */

  const courses =
    useMemo<CourseGroup[]>(
      () => {
        return assignedCourses.map(
          (
            course: AssignedCourse
          ) => {
            const courseUnits =
              units
                .filter(
                  (
                    unit: LecturerUnit
                  ) =>
                    unit.course_id ===
                    course.id
                )
                .sort(
                  (
                    a: LecturerUnit,
                    b: LecturerUnit
                  ) => {
                    const yearA =
                      a.year_of_study ??
                      999;

                    const yearB =
                      b.year_of_study ??
                      999;

                    if (
                      yearA !==
                      yearB
                    ) {
                      return (
                        yearA -
                        yearB
                      );
                    }

                    const termA =
                      a.term_number ??
                      999;

                    const termB =
                      b.term_number ??
                      999;

                    if (
                      termA !==
                      termB
                    ) {
                      return (
                        termA -
                        termB
                      );
                    }

                    return safeString(
                      a.name
                    ).localeCompare(
                      safeString(
                        b.name
                      )
                    );
                  }
                );

            return {
              id: course.id,
              name: course.name,
              code: course.code,
              units: courseUnits,
            };
          }
        );
      },
      [
        assignedCourses,
        units,
      ]
    );

  /* =======================================================
     FILTER COURSES
  ======================================================= */

  const filteredCourses =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return courses
          .filter(
            (
              course: CourseGroup
            ) => {
              if (
                selectedCourseId !==
                  'all' &&
                course.id !==
                  selectedCourseId
              ) {
                return false;
              }

              if (!query) {
                return true;
              }

              const courseMatches =
                safeString(
                  course.name
                )
                  .toLowerCase()
                  .includes(query) ||
                safeString(
                  course.code
                )
                  .toLowerCase()
                  .includes(query);

              const unitMatches =
                course.units.some(
                  (
                    unit: LecturerUnit
                  ) =>
                    safeString(
                      unit.name
                    )
                      .toLowerCase()
                      .includes(query) ||
                    safeString(
                      unit.code
                    )
                      .toLowerCase()
                      .includes(query) ||
                    safeString(
                      unit.description
                    )
                      .toLowerCase()
                      .includes(query)
                );

              return (
                courseMatches ||
                unitMatches
              );
            }
          )
          .map(
            (
              course: CourseGroup
            ) => {
              if (!query) {
                return course;
              }

              const courseMatches =
                safeString(
                  course.name
                )
                  .toLowerCase()
                  .includes(query) ||
                safeString(
                  course.code
                )
                  .toLowerCase()
                  .includes(query);

              if (
                courseMatches
              ) {
                return course;
              }

              return {
                ...course,

                units:
                  course.units.filter(
                    (
                      unit: LecturerUnit
                    ) =>
                      safeString(
                        unit.name
                      )
                        .toLowerCase()
                        .includes(query) ||
                      safeString(
                        unit.code
                      )
                        .toLowerCase()
                        .includes(query) ||
                      safeString(
                        unit.description
                      )
                        .toLowerCase()
                        .includes(query)
                  ),
              };
            }
          );
      },
      [
        courses,
        search,
        selectedCourseId,
      ]
    );

  /* =======================================================
     STATISTICS
  ======================================================= */

  const totalUnits =
    units.length;

  const totalCourses =
    assignedCourses.length;

  const totalTopics =
    units.reduce(
      (
        total: number,
        unit: LecturerUnit
      ) =>
        total +
        (unit.topic_count ||
          0),
      0
    );

  const activeUnits =
    units.filter(
      (
        unit: LecturerUnit
      ) =>
        safeString(
          unit.status
        ).toLowerCase() ===
        'active'
    ).length;

  /* =======================================================
     COURSE TOGGLE
  ======================================================= */

  function toggleCourse(
    courseId: number
  ) {
    setExpandedCourses(
      (
        current: Set<number>
      ) => {
        const next =
          new Set(current);

        if (
          next.has(courseId)
        ) {
          next.delete(
            courseId
          );
        } else {
          next.add(
            courseId
          );
        }

        return next;
      }
    );
  }

  function expandAll() {
    setExpandedCourses(
      new Set(
        courses.map(
          (
            course: CourseGroup
          ) =>
            course.id
        )
      )
    );
  }

  function collapseAll() {
    setExpandedCourses(
      new Set()
    );
  }

  /* =======================================================
     OPEN ADD MODAL
  ======================================================= */

  function openAddUnitModal(
    courseId?: number
  ) {
    setEditingUnit(null);

    setFormError('');
    setFormSuccess('');

    setUnitForm(
      createEmptyUnitForm(
        courseId
      )
    );

    setShowUnitModal(true);
  }

  /* =======================================================
     OPEN EDIT MODAL
  ======================================================= */

  function openEditUnitModal(
    unit: LecturerUnit
  ) {
    setEditingUnit(unit);

    setFormError('');
    setFormSuccess('');

    setUnitForm({
      program_id:
        String(
          unit.course_id
        ),

      code:
        unit.code || '',

      name:
        unit.name || '',

      description:
        unit.description || '',

      credit_hours:
        unit.credit_hours !==
        null
          ? String(
              unit.credit_hours
            )
          : '0',

      year_of_study:
        unit.year_of_study !==
        null
          ? String(
              unit.year_of_study
            )
          : '1',

      term_number:
        unit.term_number !==
        null
          ? String(
              unit.term_number
            )
          : '1',

      status:
        unit.status || 'active',
    });

    setShowUnitModal(true);
  }

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  function closeUnitModal() {
    if (savingUnit) {
      return;
    }

    setShowUnitModal(
      false
    );

    setEditingUnit(null);
    setFormError('');
    setFormSuccess('');
  }

  /* =======================================================
     SAVE UNIT
  ======================================================= */

  async function handleSaveUnit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError('');
    setFormSuccess('');

    const programId =
      Number(
        unitForm.program_id
      );

    const creditHours =
      Number(
        unitForm.credit_hours
      );

    const yearOfStudy =
      Number(
        unitForm.year_of_study
      );

    const termNumber =
      Number(
        unitForm.term_number
      );

    const unitName =
      unitForm.name.trim();

    const unitCode =
      unitForm.code.trim();

    if (
      !Number.isInteger(
        programId
      ) ||
      programId <= 0
    ) {
      setFormError(
        'Please select a course.'
      );
      return;
    }

    if (!unitName) {
      setFormError(
        'Unit name is required.'
      );
      return;
    }

    if (
      !Number.isInteger(
        creditHours
      ) ||
      creditHours < 0
    ) {
      setFormError(
        'Credit hours must be a valid non-negative number.'
      );
      return;
    }

    if (
      !Number.isInteger(
        yearOfStudy
      ) ||
      yearOfStudy < 1
    ) {
      setFormError(
        'Year of study must be at least 1.'
      );
      return;
    }

    if (
      !Number.isInteger(
        termNumber
      ) ||
      termNumber < 1
    ) {
      setFormError(
        'Term number must be at least 1.'
      );
      return;
    }

    try {
      setSavingUnit(true);

      const isEditing =
        editingUnit !== null;

      const response =
        await fetch(
          '/api/lecturer/units',
          {
            method:
              isEditing
                ? 'PUT'
                : 'POST',

            credentials:
              'include',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              ...(isEditing
                ? {
                    id:
                      editingUnit.id,
                  }
                : {}),

              program_id:
                programId,

              code:
                unitCode ||
                null,

              name:
                unitName,

              description:
                unitForm.description.trim() ||
                null,

              credit_hours:
                creditHours,

              year_of_study:
                yearOfStudy,

              term_number:
                termNumber,

              status:
                unitForm.status,
            }),
          }
        );

      const data: unknown =
        await response.json();

      if (
        typeof data !== 'object' ||
        data === null
      ) {
        throw new Error(
          isEditing
            ? 'Unable to update course unit.'
            : 'Unable to create course unit.'
        );
      }

      const responseData =
        data as {
          success?: boolean;
          message?: string;
        };

      if (
        !response.ok ||
        !responseData.success
      ) {
        throw new Error(
          responseData.message ||
            (isEditing
              ? 'Unable to update course unit.'
              : 'Unable to create course unit.')
        );
      }

      setFormSuccess(
        isEditing
          ? 'Course unit updated successfully.'
          : 'Course unit created successfully.'
      );

      await loadUnits();

      setExpandedCourses(
        (
          current: Set<number>
        ) => {
          const next =
            new Set(current);

          next.add(
            programId
          );

          return next;
        }
      );

      setTimeout(
        () => {
          setShowUnitModal(
            false
          );

          setEditingUnit(null);
          setFormSuccess('');
        },
        700
      );
    } catch (error) {
      console.error(
        'SAVE LECTURER UNIT ERROR:',
        error
      );

      setFormError(
        error instanceof Error
          ? error.message
          : editingUnit
          ? 'Unable to update course unit.'
          : 'Unable to create course unit.'
      );
    } finally {
      setSavingUnit(false);
    }
  }

  /* =======================================================
     OPEN DELETE CONFIRMATION
  ======================================================= */

  function openDeleteModal(
    unit: LecturerUnit
  ) {
    setDeleteError('');
    setDeleteSuccess('');
    setUnitToDelete(unit);
  }

  /* =======================================================
     CLOSE DELETE MODAL
  ======================================================= */

  function closeDeleteModal() {
    if (
      deletingUnitId !==
      null
    ) {
      return;
    }

    setUnitToDelete(null);
    setDeleteError('');
  }

  /* =======================================================
     DELETE UNIT
  ======================================================= */

  async function handleDeleteUnit() {
    if (!unitToDelete) {
      return;
    }

    try {
      setDeletingUnitId(
        unitToDelete.id
      );

      setDeleteError('');

      const response =
        await fetch(
          '/api/lecturer/units',
          {
            method: 'DELETE',

            credentials:
              'include',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              id:
                unitToDelete.id,
            }),
          }
        );

      const data: unknown =
        await response.json();

      if (
        typeof data !== 'object' ||
        data === null
      ) {
        throw new Error(
          'Unable to delete course unit.'
        );
      }

      const responseData =
        data as {
          success?: boolean;
          message?: string;
        };

      if (
        !response.ok ||
        !responseData.success
      ) {
        throw new Error(
          responseData.message ||
            'Unable to delete course unit.'
        );
      }

      setDeleteSuccess(
        'Course unit deleted successfully.'
      );

      await loadUnits();

      setTimeout(
        () => {
          setUnitToDelete(null);
          setDeleteSuccess('');
        },
        700
      );
    } catch (error) {
      console.error(
        'DELETE LECTURER UNIT ERROR:',
        error
      );

      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Unable to delete course unit.'
      );
    } finally {
      setDeletingUnitId(
        null
      );
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Teaching
            </p>

            <h1 className="mt-1 text-2xl font-bold text-brand-dark sm:text-3xl">
              Course Units
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage the units belonging to
              the courses assigned to you.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                openAddUnitModal()
              }
              disabled={
                assignedCourses.length ===
                0
              }
              className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Unit
            </button>

            <button
              type="button"
              onClick={
                expandAll
              }
              disabled={
                courses.length ===
                0
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-brand-green/30 hover:bg-brand-green/5 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-50"
            >
              Expand All
            </button>

            <button
              type="button"
              onClick={
                collapseAll
              }
              disabled={
                courses.length ===
                0
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-brand-green/30 hover:bg-brand-green/5 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-50"
            >
              Collapse All
            </button>

          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">

            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-bold">
                Unable to load course units
              </p>

              <p className="mt-1">
                {error}
              </p>

              <button
                type="button"
                onClick={
                  loadUnits
                }
                className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700"
              >
                Try Again
              </button>
            </div>

          </div>
        )}

        {/* =================================================
            NO COURSES
        ================================================= */}

        {!loading &&
          !error &&
          assignedCourses.length ===
            0 && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">

              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-bold">
                  No courses assigned
                </p>

                <p className="mt-1">
                  Your lecturer account currently
                  has no courses assigned to it.
                  Contact the administrator if
                  this is unexpected.
                </p>
              </div>

            </div>
          )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <BookOpen className="h-5 w-5 text-brand-green" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  My Courses
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {totalCourses}
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
                <Layers3 className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Total Units
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {totalUnits}
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Topics
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {totalTopics}
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
                <GraduationCap className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Active Units
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {activeUnits}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">

          <div className="grid gap-4 md:grid-cols-[1fr_280px]">

            <div className="relative">

              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(
                  event: React.ChangeEvent<HTMLInputElement>
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search courses, units or unit codes..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
              />

            </div>

            <div className="relative">

              <select
                value={
                  selectedCourseId
                }
                onChange={(
                  event: React.ChangeEvent<HTMLSelectElement>
                ) => {
                  const value =
                    event.target
                      .value;

                  setSelectedCourseId(
                    value ===
                      'all'
                      ? 'all'
                      : Number(
                          value
                        )
                  );
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
              >

                <option value="all">
                  All My Courses
                </option>

                {assignedCourses.map(
                  (
                    course: AssignedCourse
                  ) => (
                    <option
                      key={
                        course.id
                      }
                      value={
                        course.id
                      }
                    >
                      {course.name}
                      {course.code
                        ? ` (${course.code})`
                        : ''}
                    </option>
                  )
                )}

              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            </div>

          </div>

          {(search ||
            selectedCourseId !==
              'all') && (
            <div className="mt-3 flex items-center justify-between">

              <p className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-bold text-brand-dark">
                  {
                    filteredCourses.length
                  }
                </span>{' '}
                course
                {
                  filteredCourses.length ===
                  1
                    ? ''
                    : 's'
                }
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCourseId(
                    'all'
                  );
                }}
                className="text-xs font-bold text-brand-green hover:text-brand-dark"
              >
                Clear Filters
              </button>

            </div>
          )}

        </div>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">

          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="font-bold text-brand-dark">
                  My Course Units
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Units are grouped under their
                  assigned courses.
                </p>
              </div>

              <div className="flex items-center gap-2">

                <div className="flex items-center gap-2 rounded-xl bg-brand-green/5 px-3 py-2">

                  <Layers3 className="h-4 w-4 text-brand-green" />

                  <span className="text-xs font-bold text-brand-green">
                    {totalUnits}{' '}
                    {totalUnits === 1
                      ? 'Unit'
                      : 'Units'}
                  </span>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    openAddUnitModal()
                  }
                  disabled={
                    assignedCourses.length ===
                    0
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 sm:hidden"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>

              </div>

            </div>

          </div>

          {loading ? (

            <div className="flex min-h-[350px] items-center justify-center">

              <div className="text-center">

                <Loader2 className="mx-auto h-9 w-9 animate-spin text-brand-green" />

                <p className="mt-3 text-sm font-medium text-slate-500">
                  Loading your course units...
                </p>

              </div>

            </div>

          ) : filteredCourses.length ===
            0 ? (

            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50">

                <Layers3 className="h-8 w-8 text-slate-300" />

              </div>

              <h3 className="mt-5 text-base font-bold text-brand-dark">
                {assignedCourses.length ===
                0
                  ? 'No courses assigned'
                  : units.length ===
                    0
                  ? 'No course units found'
                  : 'No matching units'}
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {assignedCourses.length ===
                0
                  ? 'There are currently no courses assigned to your lecturer account.'
                  : units.length ===
                    0
                  ? 'You have assigned courses, but no units have been created yet. Click Add Unit to create the first unit.'
                  : 'Try changing your search or course filter.'}
              </p>

              {assignedCourses.length >
                0 &&
                !search &&
                selectedCourseId ===
                  'all' && (
                  <button
                    type="button"
                    onClick={() =>
                      openAddUnitModal()
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Unit
                  </button>
                )}

              {(search ||
                selectedCourseId !==
                  'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedCourseId(
                      'all'
                    );
                  }}
                  className="mt-5 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
                >
                  Clear Filters
                </button>
              )}

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {filteredCourses.map(
                (
                  course: CourseGroup
                ) => {
                  const expanded =
                    expandedCourses.has(
                      course.id
                    );

                  return (
                    <div
                      key={
                        course.id
                      }
                    >

                      {/* COURSE HEADER */}

                      <div className="group flex w-full items-center gap-4 px-5 py-5 transition hover:bg-slate-50 sm:px-6">

                        <button
                          type="button"
                          onClick={() =>
                            toggleCourse(
                              course.id
                            )
                          }
                          className="flex min-w-0 flex-1 items-center gap-4 text-left"
                        >

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">

                            <BookOpen className="h-5 w-5 text-brand-green" />

                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="truncate text-sm font-bold text-brand-dark sm:text-base">
                                {
                                  safeString(
                                    course.name
                                  ) ||
                                  'Unnamed Course'
                                }
                              </h3>

                              {course.code && (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                  {
                                    safeString(
                                      course.code
                                    )
                                  }
                                </span>
                              )}

                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                course.units
                                  .length
                              }{' '}
                              {course.units
                                .length ===
                              1
                                ? 'unit'
                                : 'units'}
                            </p>

                          </div>

                          <div className="shrink-0">

                            {expanded ? (
                              <ChevronDown className="h-5 w-5 text-brand-green" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:text-brand-green" />
                            )}

                          </div>

                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openAddUnitModal(
                              course.id
                            )
                          }
                          className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-brand-green/20 bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green transition hover:bg-brand-green hover:text-white sm:inline-flex"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Unit
                        </button>

                      </div>

                      {/* UNITS */}

                      {expanded && (
                        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-6">

                          {course.units
                            .length ===
                          0 ? (

                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">

                              <Layers3 className="mx-auto h-7 w-7 text-slate-300" />

                              <p className="mt-3 text-sm font-bold text-brand-dark">
                                No units in this course yet
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Start building the course curriculum by adding a unit.
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  openAddUnitModal(
                                    course.id
                                  )
                                }
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark"
                              >
                                <Plus className="h-4 w-4" />
                                Add Unit
                              </button>

                            </div>

                          ) : (

                            <div className="space-y-3">

                              {course.units.map(
                                (
                                  unit: LecturerUnit
                                ) => (

                                  <div
                                    key={
                                      unit.id
                                    }
                                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-green/30 hover:shadow-sm"
                                  >

                                    <div className="flex items-start gap-4">

                                      {/* UNIT ICON */}

                                      <Link
                                        href={`/lecturer/dashboard/units/${unit.id}`}
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50"
                                        aria-label={`Open ${unit.name}`}
                                      >
                                        <Layers3 className="h-4 w-4 text-blue-600" />
                                      </Link>

                                      {/* UNIT */}

                                      <Link
                                        href={`/lecturer/dashboard/units/${unit.id}`}
                                        className="min-w-0 flex-1"
                                      >

                                        <div className="flex flex-wrap items-center gap-2">

                                          <h4 className="text-sm font-bold text-brand-dark transition hover:text-brand-green">
                                            {
                                              safeString(
                                                unit.name
                                              ) ||
                                              'Unnamed Unit'
                                            }
                                          </h4>

                                          {unit.code && (
                                            <span className="rounded-full bg-brand-green/5 px-2 py-0.5 text-[10px] font-bold text-brand-green">
                                              {
                                                safeString(
                                                  unit.code
                                                )
                                              }
                                            </span>
                                          )}

                                        </div>

                                        {unit.description && (
                                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                            {
                                              safeString(
                                                unit.description
                                              )
                                            }
                                          </p>
                                        )}

                                        <div className="mt-3 flex flex-wrap items-center gap-2">

                                          {unit.credit_hours !==
                                            null && (
                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                                              <Clock3 className="h-3 w-3" />

                                              {
                                                unit.credit_hours
                                              }{' '}
                                              credit{' '}
                                              {unit.credit_hours ===
                                              1
                                                ? 'hour'
                                                : 'hours'}
                                            </span>
                                          )}

                                          {unit.year_of_study !==
                                            null && (
                                            <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                                              Year{' '}
                                              {
                                                unit.year_of_study
                                              }
                                            </span>
                                          )}

                                          {unit.term_number !==
                                            null && (
                                            <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                                              Term{' '}
                                              {
                                                unit.term_number
                                              }
                                            </span>
                                          )}

                                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1.5 text-[10px] font-semibold text-purple-600">
                                            <FileText className="h-3 w-3" />

                                            {
                                              unit.topic_count
                                            }{' '}
                                            {unit.topic_count ===
                                            1
                                              ? 'topic'
                                              : 'topics'}
                                          </span>

                                          <span
                                            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${
                                              safeString(
                                                unit.status
                                              ).toLowerCase() ===
                                              'active'
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-red-50 text-red-700'
                                            }`}
                                          >
                                            {
                                              safeString(
                                                unit.status
                                              ) ||
                                              'Unknown'
                                            }
                                          </span>

                                        </div>

                                      </Link>

                                      {/* ACTIONS */}

                                      <div className="flex shrink-0 items-start gap-1">

                                        <button
                                          type="button"
                                          onClick={() =>
                                            openEditUnitModal(
                                              unit
                                            )
                                          }
                                          className="rounded-xl p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                          title="Edit unit"
                                          aria-label={`Edit ${unit.name}`}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            openDeleteModal(
                                              unit
                                            )
                                          }
                                          className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                          title="Delete unit"
                                          aria-label={`Delete ${unit.name}`}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>

                                        <Link
                                          href={`/lecturer/dashboard/units/${unit.id}`}
                                          className="rounded-xl p-2 text-slate-300 transition hover:bg-brand-green/5 hover:text-brand-green"
                                          title="Open unit"
                                          aria-label={`Open ${unit.name}`}
                                        >
                                          <ChevronRight className="h-5 w-5" />
                                        </Link>

                                      </div>

                                    </div>

                                  </div>

                                )
                              )}

                            </div>

                          )}

                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        {!loading &&
          !error &&
          assignedCourses.length >
            0 && (
            <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 shadow-soft sm:flex-row sm:items-center sm:justify-between">

              <p>
                Showing{' '}
                <span className="font-bold text-brand-dark">
                  {
                    filteredCourses.length
                  }
                </span>{' '}
                of{' '}
                <span className="font-bold text-brand-dark">
                  {
                    totalCourses
                  }
                </span>{' '}
                assigned course
                {
                  totalCourses ===
                  1
                    ? ''
                    : 's'
                }.
              </p>

              <p>
                {totalUnits}{' '}
                total unit
                {
                  totalUnits ===
                  1
                    ? ''
                    : 's'
                }{' '}
                •{' '}
                {totalTopics}{' '}
                topic
                {
                  totalTopics ===
                  1
                    ? ''
                    : 's'
                }
              </p>

            </div>
          )}

      </div>

      {/* =====================================================
          ADD / EDIT UNIT MODAL
      ===================================================== */}

      {showUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">

          <div
            className="fixed inset-0"
            onClick={
              closeUnitModal
            }
          />

          <div className="relative z-10 my-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-6">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">

                  {editingUnit ? (
                    <Pencil className="h-5 w-5 text-brand-green" />
                  ) : (
                    <Layers3 className="h-5 w-5 text-brand-green" />
                  )}

                </div>

                <div>

                  <h2 className="text-lg font-bold text-brand-dark">
                    {editingUnit
                      ? 'Edit Course Unit'
                      : 'Add Course Unit'}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {editingUnit
                      ? 'Update the details of this course unit.'
                      : 'Create a new unit under one of your assigned courses.'}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  closeUnitModal
                }
                disabled={
                  savingUnit
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSaveUnit
              }
            >

              <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">

                {formError && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                      <p className="font-bold">
                        Unable to save unit
                      </p>

                      <p className="mt-0.5">
                        {formError}
                      </p>
                    </div>

                  </div>
                )}

                {formSuccess && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                      <p className="font-bold">
                        Success
                      </p>

                      <p className="mt-0.5">
                        {formSuccess}
                      </p>
                    </div>

                  </div>
                )}

                <div className="space-y-5">

                  {/* COURSE */}

                  <div>

                    <label
                      htmlFor="unit-course"
                      className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      Course
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <select
                      id="unit-course"
                      value={
                        unitForm.program_id
                      }
                      onChange={(
                        event: React.ChangeEvent<HTMLSelectElement>
                      ) =>
                        setUnitForm(
                          (
                            current: UnitForm
                          ) => ({
                            ...current,
                            program_id:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      disabled={
                        savingUnit
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      <option value="">
                        Select a course
                      </option>

                      {assignedCourses.map(
                        (
                          course: AssignedCourse
                        ) => (
                          <option
                            key={
                              course.id
                            }
                            value={
                              course.id
                            }
                          >
                            {course.name}
                            {course.code
                              ? ` (${course.code})`
                              : ''}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* CODE / NAME */}

                  <div className="grid gap-5 sm:grid-cols-2">

                    <div>

                      <label
                        htmlFor="unit-code"
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                      >
                        Unit Code
                      </label>

                      <input
                        id="unit-code"
                        type="text"
                        value={
                          unitForm.code
                        }
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          setUnitForm(
                            (
                              current: UnitForm
                            ) => ({
                              ...current,
                              code: event
                                .target
                                .value,
                            })
                          )
                        }
                        placeholder="e.g. EMT 102"
                        disabled={
                          savingUnit
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                    </div>

                    <div>

                      <label
                        htmlFor="unit-name"
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                      >
                        Unit Name
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        id="unit-name"
                        type="text"
                        value={
                          unitForm.name
                        }
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          setUnitForm(
                            (
                              current: UnitForm
                            ) => ({
                              ...current,
                              name: event
                                .target
                                .value,
                            })
                          )
                        }
                        placeholder="e.g. Anatomy and Physiology"
                        disabled={
                          savingUnit
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                    </div>

                  </div>

                  {/* DESCRIPTION */}

                  <div>

                    <label
                      htmlFor="unit-description"
                      className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      Description
                    </label>

                    <textarea
                      id="unit-description"
                      rows={4}
                      value={
                        unitForm.description
                      }
                      onChange={(
                        event: React.ChangeEvent<HTMLTextAreaElement>
                      ) =>
                        setUnitForm(
                          (
                            current: UnitForm
                          ) => ({
                            ...current,
                            description:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Briefly describe what this unit covers..."
                      disabled={
                        savingUnit
                      }
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                  </div>

                  {/* CREDIT / YEAR / TERM */}

                  <div className="grid gap-5 sm:grid-cols-3">

                    <div>

                      <label
                        htmlFor="credit-hours"
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                      >
                        Credit Hours
                      </label>

                      <input
                        id="credit-hours"
                        type="number"
                        min="0"
                        step="1"
                        value={
                          unitForm.credit_hours
                        }
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          setUnitForm(
                            (
                              current: UnitForm
                            ) => ({
                              ...current,
                              credit_hours:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        disabled={
                          savingUnit
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                    </div>

                    <div>

                      <label
                        htmlFor="year-of-study"
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                      >
                        Year of Study
                      </label>

                      <input
                        id="year-of-study"
                        type="number"
                        min="1"
                        step="1"
                        value={
                          unitForm.year_of_study
                        }
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          setUnitForm(
                            (
                              current: UnitForm
                            ) => ({
                              ...current,
                              year_of_study:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        disabled={
                          savingUnit
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                    </div>

                    <div>

                      <label
                        htmlFor="term-number"
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                      >
                        Term
                      </label>

                      <input
                        id="term-number"
                        type="number"
                        min="1"
                        step="1"
                        value={
                          unitForm.term_number
                        }
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          setUnitForm(
                            (
                              current: UnitForm
                            ) => ({
                              ...current,
                              term_number:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        disabled={
                          savingUnit
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                    </div>

                  </div>

                  {/* STATUS */}

                  <div>

                    <label
                      htmlFor="unit-status"
                      className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      Status
                    </label>

                    <select
                      id="unit-status"
                      value={
                        unitForm.status
                      }
                      onChange={(
                        event: React.ChangeEvent<HTMLSelectElement>
                      ) =>
                        setUnitForm(
                          (
                            current: UnitForm
                          ) => ({
                            ...current,
                            status:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      disabled={
                        savingUnit
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      <option value="active">
                        Active
                      </option>

                      <option value="inactive">
                        Inactive
                      </option>

                    </select>

                  </div>

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">

                <button
                  type="button"
                  onClick={
                    closeUnitModal
                  }
                  disabled={
                    savingUnit
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    savingUnit
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {savingUnit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      {editingUnit
                        ? 'Updating Unit...'
                        : 'Creating Unit...'}
                    </>
                  ) : (
                    <>
                      {editingUnit ? (
                        <Pencil className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}

                      {editingUnit
                        ? 'Update Unit'
                        : 'Create Unit'}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ===================================================== */}

      {unitToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div
            className="fixed inset-0"
            onClick={
              closeDeleteModal
            }
          />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">

            <div className="p-6">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">

                <Trash2 className="h-5 w-5 text-red-600" />

              </div>

              <h2 className="mt-5 text-lg font-bold text-brand-dark">
                Delete Course Unit?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                You are about to delete{' '}
                <span className="font-bold text-brand-dark">
                  {unitToDelete.name}
                </span>
                .

                <br />

                This action cannot be
                undone.
              </p>

              {unitToDelete.topic_count >
                0 && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">

                  <p className="font-bold">
                    This unit contains{' '}
                    {
                      unitToDelete.topic_count
                    }{' '}
                    {unitToDelete.topic_count ===
                    1
                      ? 'topic'
                      : 'topics'}
                    .
                  </p>

                  <p className="mt-1">
                    Depending on your database
                    rules, deletion may be
                    prevented if the unit has
                    related curriculum content.
                  </p>

                </div>
              )}

              {deleteError && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  <div>
                    <p className="font-bold">
                      Unable to delete unit
                    </p>

                    <p className="mt-0.5">
                      {deleteError}
                    </p>
                  </div>

                </div>
              )}

              {deleteSuccess && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                  <p className="font-bold">
                    {deleteSuccess}
                  </p>

                </div>
              )}

            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  deletingUnitId !==
                  null
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleDeleteUnit
                }
                disabled={
                  deletingUnitId !==
                  null
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {deletingUnitId !==
                null ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Unit
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
