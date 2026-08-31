
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  GraduationCap,
  Layers3,
  Loader2,
  AlertCircle,
  ChevronRight,
  Circle,
  Plus,
  Trash2,
  X,
  Save,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Topic = {
  id: number;
  unit_id: number;
  title: string;
  description: string | null;
  order_number: number;
  status: string;
  created_at: string;
  updated_at: string;
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

  course: {
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    duration: string | null;
    level: string | null;
    status: string;
  };

  topics: Topic[];
  topic_count: number;
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

type TopicForm = {
  title: string;
  description: string;
  order_number: string;
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

    return Number.isFinite(number)
      ? number
      : null;
  }

  return null;
}

/* =========================================================
   PAGE
========================================================= */

export default function LecturerUnitPage() {
  const params = useParams();
  const router = useRouter();

  const id =
    Array.isArray(params?.id)
      ? params.id[0]
      : params?.id;

  /* =======================================================
     DATA
  ======================================================= */

  const [unit, setUnit] =
    useState<Unit | null>(null);

  /* =======================================================
     PAGE STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [actionError, setActionError] =
    useState('');

  const [actionSuccess, setActionSuccess] =
    useState('');

  /* =======================================================
     UNIT MODAL STATE
  ======================================================= */

  const [showUnitModal, setShowUnitModal] =
    useState(false);

  const [savingUnit, setSavingUnit] =
    useState(false);

  const [deletingUnit, setDeletingUnit] =
    useState(false);

  const [showDeleteUnitModal, setShowDeleteUnitModal] =
    useState(false);

  const [unitForm, setUnitForm] =
    useState<UnitForm>({
      program_id: '',
      code: '',
      name: '',
      description: '',
      credit_hours: '0',
      year_of_study: '1',
      term_number: '1',
      status: 'active',
    });

  const [unitFormError, setUnitFormError] =
    useState('');

  /* =======================================================
     TOPIC MODAL STATE
  ======================================================= */

  const [showTopicModal, setShowTopicModal] =
    useState(false);

  const [editingTopic, setEditingTopic] =
    useState<Topic | null>(null);

  const [savingTopic, setSavingTopic] =
    useState(false);

  const [deletingTopicId, setDeletingTopicId] =
    useState<number | null>(null);

  const [topicToDelete, setTopicToDelete] =
    useState<Topic | null>(null);

  const [topicFormError, setTopicFormError] =
    useState('');

  const [topicForm, setTopicForm] =
    useState<TopicForm>({
      title: '',
      description: '',
      order_number: '1',
      status: 'active',
    });

  /* =======================================================
     LOAD UNIT
  ======================================================= */

  async function loadUnit() {
    try {
      setLoading(true);
      setError('');

      if (!id) {
        throw new Error(
          'Unit ID is missing.'
        );
      }

      const response = await fetch(
        `/api/lecturer/units/${id}`,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
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
            'Unable to load unit.'
        );
      }

      const raw = data.unit;

      if (!raw) {
        throw new Error(
          'Unit data was not returned.'
        );
      }

      const rawTopics: unknown[] =
        Array.isArray(raw.topics)
          ? raw.topics
          : [];

      const normalizedTopics: Topic[] =
        rawTopics
          .map(
            (
              rawTopic: unknown
            ): Topic | null => {
              if (
                !rawTopic ||
                typeof rawTopic !==
                  'object'
              ) {
                return null;
              }

              const topic =
                rawTopic as Record<
                  string,
                  unknown
                >;

              const topicId =
                safeNumber(
                  topic.id
                );

              if (
                topicId === null
              ) {
                return null;
              }

              return {
                id: topicId,

                unit_id:
                  safeNumber(
                    topic.unit_id
                  ) ?? 0,

                title:
                  safeString(
                    topic.title
                  ) ||
                  'Untitled Topic',

                description:
                  topic.description !=
                  null
                    ? safeString(
                        topic.description
                      )
                    : null,

                order_number:
                  safeNumber(
                    topic.order_number
                  ) ?? 0,

                status:
                  safeString(
                    topic.status
                  ) || 'active',

                created_at:
                  safeString(
                    topic.created_at
                  ),

                updated_at:
                  safeString(
                    topic.updated_at
                  ),
              };
            }
          )
          .filter(
            (
              topic: Topic | null
            ): topic is Topic =>
              topic !== null
          );

      const normalized: Unit = {
        id:
          safeNumber(raw.id) ?? 0,

        program_id:
          safeNumber(
            raw.program_id
          ) ?? 0,

        code:
          raw.code != null
            ? safeString(raw.code)
            : null,

        name:
          safeString(raw.name) ||
          'Unnamed Unit',

        description:
          raw.description != null
            ? safeString(
                raw.description
              )
            : null,

        credit_hours:
          safeNumber(
            raw.credit_hours
          ),

        year_of_study:
          safeNumber(
            raw.year_of_study
          ),

        term_number:
          safeNumber(
            raw.term_number
          ),

        status:
          safeString(
            raw.status
          ) || 'active',

        created_at:
          safeString(
            raw.created_at
          ),

        updated_at:
          safeString(
            raw.updated_at
          ),

        course: {
          id:
            safeNumber(
              raw.course?.id
            ) ?? 0,

          name:
            safeString(
              raw.course?.name
            ) ||
            'Unnamed Course',

          code:
            raw.course?.code != null
              ? safeString(
                  raw.course.code
                )
              : null,

          description:
            raw.course?.description !=
            null
              ? safeString(
                  raw.course.description
                )
              : null,

          duration:
            raw.course?.duration !=
            null
              ? safeString(
                  raw.course.duration
                )
              : null,

          level:
            raw.course?.level != null
              ? safeString(
                  raw.course.level
                )
              : null,

          status:
            safeString(
              raw.course?.status
            ) || 'active',
        },

        topics: normalizedTopics,

        topic_count:
          safeNumber(
            raw.topic_count
          ) ??
          normalizedTopics.length,
      };

      setUnit(normalized);
    } catch (error) {
      console.error(
        'LOAD LECTURER UNIT ERROR:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load unit.'
      );

      setUnit(null);
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadUnit();
  }, [id]);

  /* =======================================================
     SORTED TOPICS
  ======================================================= */

  const sortedTopics = useMemo<Topic[]>(
    () => {
      if (!unit) {
        return [];
      }

      return [...unit.topics].sort(
        (
          a: Topic,
          b: Topic
        ) => {
          const orderA =
            a.order_number ?? 999;

          const orderB =
            b.order_number ?? 999;

          if (
            orderA !== orderB
          ) {
            return (
              orderA - orderB
            );
          }

          return a.id - b.id;
        }
      );
    },
    [unit]
  );

  /* =======================================================
     TOPIC STATISTICS
  ======================================================= */

  const activeTopics =
    unit?.topics.filter(
      (
        topic: Topic
      ) =>
        safeString(
          topic.status
        ).toLowerCase() ===
        'active'
    ).length ?? 0;

  /* =======================================================
     ACTION HELPERS
  ======================================================= */

  function clearActionMessages() {
    setActionError('');
    setActionSuccess('');
  }

  /* =======================================================
     OPEN EDIT UNIT
  ======================================================= */

  function openEditUnit() {
    if (!unit) {
      return;
    }

    clearActionMessages();

    setUnitForm({
      program_id:
        String(unit.program_id),

      code:
        unit.code ?? '',

      name:
        unit.name,

      description:
        unit.description ?? '',

      credit_hours:
        String(
          unit.credit_hours ?? 0
        ),

      year_of_study:
        String(
          unit.year_of_study ?? 1
        ),

      term_number:
        String(
          unit.term_number ?? 1
        ),

      status:
        unit.status || 'active',
    });

    setUnitFormError('');
    setShowUnitModal(true);
  }

  /* =======================================================
     CLOSE EDIT UNIT
  ======================================================= */

  function closeUnitModal() {
    if (savingUnit) {
      return;
    }

    setShowUnitModal(false);
    setUnitFormError('');
  }

  /* =======================================================
     UPDATE UNIT
  ======================================================= */

  async function handleUpdateUnit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!unit) {
      return;
    }

    setUnitFormError('');
    clearActionMessages();

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

    const name =
      unitForm.name.trim();

    const code =
      unitForm.code.trim();

    const description =
      unitForm.description.trim();

    if (
      !Number.isInteger(
        programId
      ) ||
      programId <= 0
    ) {
      setUnitFormError(
        'A valid course is required.'
      );
      return;
    }

    if (!name) {
      setUnitFormError(
        'Unit name is required.'
      );
      return;
    }

    if (
      !Number.isFinite(
        creditHours
      ) ||
      creditHours < 0
    ) {
      setUnitFormError(
        'Credit hours must be a valid number.'
      );
      return;
    }

    if (
      !Number.isInteger(
        yearOfStudy
      ) ||
      yearOfStudy < 1
    ) {
      setUnitFormError(
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
      setUnitFormError(
        'Term number must be at least 1.'
      );
      return;
    }

    try {
      setSavingUnit(true);

      const response =
        await fetch(
          `/api/lecturer/units`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              id: unit.id,
              program_id:
                programId,
              code:
                code || null,
              name,
              description:
                description ||
                null,
              credit_hours:
                creditHours,
              year_of_study:
                yearOfStudy,
              term_number:
                termNumber,
              status:
                unitForm.status ||
                'active',
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
            'Unable to update unit.'
        );
      }

      setActionSuccess(
        'Course unit updated successfully.'
      );

      setShowUnitModal(false);

      await loadUnit();
    } catch (error) {
      console.error(
        'UPDATE UNIT ERROR:',
        error
      );

      setUnitFormError(
        error instanceof Error
          ? error.message
          : 'Unable to update unit.'
      );
    } finally {
      setSavingUnit(false);
    }
  }

  /* =======================================================
     DELETE UNIT
  ======================================================= */

  async function handleDeleteUnit() {
    if (!unit) {
      return;
    }

    try {
      setDeletingUnit(true);
      clearActionMessages();

      const response =
        await fetch(
          `/api/lecturer/units?id=${unit.id}`,
          {
            method: 'DELETE',
            credentials: 'include',
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
            'Unable to delete unit.'
        );
      }

      setShowDeleteUnitModal(false);

      router.push(
        '/lecturer/dashboard/units'
      );
    } catch (error) {
      console.error(
        'DELETE UNIT ERROR:',
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to delete unit.'
      );

      setShowDeleteUnitModal(false);
    } finally {
      setDeletingUnit(false);
    }
  }

  /* =======================================================
     OPEN ADD TOPIC
  ======================================================= */

  function openAddTopic() {
    clearActionMessages();

    const nextOrder =
      sortedTopics.length > 0
        ? Math.max(
            ...sortedTopics.map(
              (
                topic: Topic
              ) =>
                topic.order_number ||
                0
            )
          ) + 1
        : 1;

    setEditingTopic(null);

    setTopicForm({
      title: '',
      description: '',
      order_number:
        String(nextOrder),
      status: 'active',
    });

    setTopicFormError('');
    setShowTopicModal(true);
  }

  /* =======================================================
     OPEN EDIT TOPIC
  ======================================================= */

  function openEditTopic(
    topic: Topic
  ) {
    clearActionMessages();

    setEditingTopic(topic);

    setTopicForm({
      title:
        topic.title,

      description:
        topic.description ?? '',

      order_number:
        String(
          topic.order_number
        ),

      status:
        topic.status ||
        'active',
    });

    setTopicFormError('');
    setShowTopicModal(true);
  }

  /* =======================================================
     CLOSE TOPIC MODAL
  ======================================================= */

  function closeTopicModal() {
    if (savingTopic) {
      return;
    }

    setShowTopicModal(false);
    setEditingTopic(null);
    setTopicFormError('');
  }

  /* =======================================================
     SAVE TOPIC
  ======================================================= */

  async function handleSaveTopic(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!unit) {
      return;
    }

    setTopicFormError('');
    clearActionMessages();

    const title =
      topicForm.title.trim();

    const description =
      topicForm.description.trim();

    const orderNumber =
      Number(
        topicForm.order_number
      );

    if (!title) {
      setTopicFormError(
        'Topic title is required.'
      );
      return;
    }

    if (
      !Number.isInteger(
        orderNumber
      ) ||
      orderNumber < 1
    ) {
      setTopicFormError(
        'Topic order must be a positive whole number.'
      );
      return;
    }

    try {
      setSavingTopic(true);

      const isEditing =
        editingTopic !== null;

      const endpoint =
        isEditing
          ? `/api/lecturer/topics/${editingTopic.id}`
          : '/api/lecturer/topics';

      const method =
        isEditing
          ? 'PATCH'
          : 'POST';

      const body = isEditing
        ? {
            id:
              editingTopic.id,
            unit_id:
              unit.id,
            title,
            description:
              description ||
              null,
            order_number:
              orderNumber,
            status:
              topicForm.status ||
              'active',
          }
        : {
            unit_id:
              unit.id,
            title,
            description:
              description ||
              null,
            order_number:
              orderNumber,
            status:
              topicForm.status ||
              'active',
          };

      const response =
        await fetch(
          endpoint,
          {
            method,
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(
              body
            ),
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
            (isEditing
              ? 'Unable to update topic.'
              : 'Unable to create topic.')
        );
      }

      setShowTopicModal(false);
      setEditingTopic(null);

      setActionSuccess(
        isEditing
          ? 'Topic updated successfully.'
          : 'Topic created successfully.'
      );

      await loadUnit();
    } catch (error) {
      console.error(
        'SAVE TOPIC ERROR:',
        error
      );

      setTopicFormError(
        error instanceof Error
          ? error.message
          : 'Unable to save topic.'
      );
    } finally {
      setSavingTopic(false);
    }
  }

  /* =======================================================
     DELETE TOPIC
  ======================================================= */

  async function handleDeleteTopic() {
    if (!topicToDelete) {
      return;
    }

    try {
      setDeletingTopicId(
        topicToDelete.id
      );

      clearActionMessages();

      const response =
        await fetch(
          `/api/lecturer/topics?id=${topicToDelete.id}`,
          {
            method: 'DELETE',
            credentials: 'include',
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
            'Unable to delete topic.'
        );
      }

      setTopicToDelete(null);

      setActionSuccess(
        'Topic deleted successfully.'
      );

      await loadUnit();
    } catch (error) {
      console.error(
        'DELETE TOPIC ERROR:',
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : 'Unable to delete topic.'
      );

      setTopicToDelete(null);
    } finally {
      setDeletingTopicId(null);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-green" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading unit...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !unit) {
    return (
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <h1 className="font-bold text-red-800">
                  Unable to load unit
                </h1>

                <p className="mt-1 text-sm text-red-700">
                  {error ||
                    'The requested unit could not be found.'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadUnit}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Try Again
              </button>

              <Link
                href="/lecturer/dashboard/units"
                className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50"
              >
                Back to Units
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            BACK
        ================================================= */}

        <Link
          href="/lecturer/dashboard/units"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-brand-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course Units
        </Link>

        {/* =================================================
            ACTION MESSAGES
        ================================================= */}

        {actionError && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-bold">
                Action failed
              </p>

              <p className="mt-1">
                {actionError}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setActionError('')
              }
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-bold">
                Success
              </p>

              <p className="mt-1">
                {actionSuccess}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setActionSuccess('')
              }
              className="rounded-lg p-1 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* =================================================
            HERO
        ================================================= */}

        <div className="overflow-hidden rounded-3xl bg-brand-dark shadow-soft">

          <div className="p-6 sm:p-8 lg:p-10">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

              <div className="min-w-0">

                <div className="mb-4 flex flex-wrap items-center gap-2">

                  <span className="rounded-full bg-brand-gold/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-gold">
                    {safeString(
                      unit.course.name
                    )}
                  </span>

                  {unit.course.code && (
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white/70">
                      {safeString(
                        unit.course.code
                      )}
                    </span>
                  )}

                </div>

                <div className="flex items-start gap-4">

                  <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 sm:flex">
                    <Layers3 className="h-7 w-7 text-brand-gold" />
                  </div>

                  <div className="min-w-0">

                    <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                      {safeString(
                        unit.name
                      )}
                    </h1>

                    {unit.code && (
                      <p className="mt-2 text-sm font-semibold text-brand-gold">
                        {safeString(
                          unit.code
                        )}
                      </p>
                    )}

                  </div>

                </div>

                {unit.description && (
                  <p className="mt-5 max-w-3xl text-sm leading-7 text-white/60">
                    {safeString(
                      unit.description
                    )}
                  </p>
                )}

              </div>

              <div className="flex flex-wrap items-center gap-2">

                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
                    safeString(
                      unit.status
                    ).toLowerCase() ===
                    'active'
                      ? 'bg-green-400/10 text-green-300'
                      : 'bg-red-400/10 text-red-300'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />

                  {safeString(
                    unit.status
                  ) || 'Unknown'}
                </span>

              </div>

            </div>

          </div>

          {/* COURSE BAR */}

          <div className="border-t border-white/10 bg-white/5 px-6 py-4 sm:px-8">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/60">

                {unit.credit_hours !==
                  null && (
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-brand-gold" />

                    {unit.credit_hours}{' '}
                    credit{' '}
                    {unit.credit_hours ===
                    1
                      ? 'hour'
                      : 'hours'}
                  </span>
                )}

                {unit.year_of_study !==
                  null && (
                  <span>
                    Year{' '}
                    {unit.year_of_study}
                  </span>
                )}

                {unit.term_number !==
                  null && (
                  <span>
                    Term{' '}
                    {unit.term_number}
                  </span>
                )}

                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-gold" />

                  {unit.topic_count}{' '}
                  {unit.topic_count ===
                  1
                    ? 'Topic'
                    : 'Topics'}
                </span>

              </div>

              {/* UNIT ACTIONS */}

              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={
                    openEditUnit
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Unit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowDeleteUnitModal(
                      true
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Unit
                </button>

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <BookOpen className="h-5 w-5 text-brand-green" />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Course
                </p>

                <p className="mt-1 text-sm font-bold text-brand-dark">
                  {safeString(
                    unit.course.name
                  )}
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
                <p className="text-xs text-slate-500">
                  Total Topics
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {unit.topic_count}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Active Topics
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {activeTopics}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* =================================================
            TOPICS
        ================================================= */}

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">

          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-2">
                  <Layers3 className="h-5 w-5 text-brand-green" />

                  <h2 className="font-bold text-brand-dark">
                    Unit Topics
                  </h2>
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Build your unit curriculum by adding topics.
                  Each topic can later contain lessons, materials,
                  videos, assignments and quizzes.
                </p>

              </div>

              <div className="flex items-center gap-2">

                <div className="rounded-xl bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green">
                  {unit.topic_count}{' '}
                  {unit.topic_count ===
                  1
                    ? 'Topic'
                    : 'Topics'}
                </div>

                <button
                  type="button"
                  onClick={
                    openAddTopic
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-dark"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Topic
                </button>

              </div>

            </div>

          </div>

          {sortedTopics.length ===
          0 ? (

            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>

              <h3 className="mt-5 font-bold text-brand-dark">
                No topics yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Start building this unit by adding
                your first topic.
              </p>

              <button
                type="button"
                onClick={
                  openAddTopic
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                <Plus className="h-4 w-4" />
                Add First Topic
              </button>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {sortedTopics.map(
                (
                  topic: Topic,
                  index: number
                ) => (

                  <div
                    key={
                      topic.id
                    }
                    className="group px-5 py-5 transition hover:bg-slate-50 sm:px-6"
                  >

                    <div className="flex items-start gap-4">

                      {/* NUMBER */}

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-sm font-bold text-brand-green">
                        {index + 1}
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-sm font-bold text-brand-dark sm:text-base">
                            {safeString(
                              topic.title
                            ) ||
                              'Untitled Topic'}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              safeString(
                                topic.status
                              ).toLowerCase() ===
                              'active'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {safeString(
                              topic.status
                            ) ||
                              'Unknown'}
                          </span>

                        </div>

                        {topic.description && (
                          <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-500">
                            {safeString(
                              topic.description
                            )}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-400">

                          <span className="inline-flex items-center gap-1.5">
                            <Circle className="h-3 w-3" />

                            Topic{' '}
                            {
                              topic.order_number
                            }
                          </span>

                          <span>
                            ID #{topic.id}
                          </span>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex shrink-0 items-center gap-1">

                        <button
                          type="button"
                          onClick={() =>
                            openEditTopic(
                              topic
                            )
                          }
                          className="rounded-xl p-2 text-slate-400 transition hover:bg-brand-green/10 hover:text-brand-green"
                          title="Edit Topic"
                          aria-label="Edit Topic"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setTopicToDelete(
                              topic
                            )
                          }
                          disabled={
                            deletingTopicId ===
                            topic.id
                          }
                          className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Delete Topic"
                          aria-label="Delete Topic"
                        >
                          {deletingTopicId ===
                          topic.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>

                        <Link
                         href={`/lecturer/dashboard/lessons?topic_id=${topic.id}&unit_id=${unit.id}`}
                          className="ml-1 rounded-xl p-2 text-slate-300 transition hover:bg-brand-green/10 hover:text-brand-green"
                          title="Manage Topic"
                          aria-label="Manage Topic"
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

        {/* =================================================
            COURSE INFORMATION
        ================================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">
                <GraduationCap className="h-5 w-5 text-brand-green" />
              </div>

              <div>
                <h2 className="font-bold text-brand-dark">
                  Course Information
                </h2>

                <p className="text-xs text-slate-500">
                  The course this unit belongs to.
                </p>
              </div>

            </div>

            <div className="mt-5 space-y-4">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Course Name
                </p>

                <p className="mt-1 text-sm font-bold text-brand-dark">
                  {safeString(
                    unit.course.name
                  )}
                </p>
              </div>

              {unit.course.code && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Course Code
                  </p>

                  <p className="mt-1 text-sm font-bold text-brand-dark">
                    {safeString(
                      unit.course.code
                    )}
                  </p>
                </div>
              )}

              {unit.course.level && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Level
                  </p>

                  <p className="mt-1 text-sm font-bold text-brand-dark">
                    {safeString(
                      unit.course.level
                    )}
                  </p>
                </div>
              )}

              {unit.course.duration && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Duration
                  </p>

                  <p className="mt-1 text-sm font-bold text-brand-dark">
                    {safeString(
                      unit.course.duration
                    )}
                  </p>
                </div>
              )}

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="font-bold text-brand-dark">
                  Unit Information
                </h2>

                <p className="text-xs text-slate-500">
                  Academic details for this unit.
                </p>
              </div>

            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Credit Hours
                </p>

                <p className="mt-1 text-lg font-bold text-brand-dark">
                  {unit.credit_hours ??
                    '—'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Year
                </p>

                <p className="mt-1 text-lg font-bold text-brand-dark">
                  {unit.year_of_study ??
                    '—'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Term
                </p>

                <p className="mt-1 text-lg font-bold text-brand-dark">
                  {unit.term_number ??
                    '—'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Topics
                </p>

                <p className="mt-1 text-lg font-bold text-brand-dark">
                  {unit.topic_count}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          EDIT UNIT MODAL
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

            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-6">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">
                  <Edit3 className="h-5 w-5 text-brand-green" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-brand-dark">
                    Edit Course Unit
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Update the details of this course unit.
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
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <form
              onSubmit={
                handleUpdateUnit
              }
            >

              <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">

                {unitFormError && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                      <p className="font-bold">
                        Unable to update unit
                      </p>

                      <p className="mt-0.5">
                        {unitFormError}
                      </p>
                    </div>

                  </div>
                )}

                <div className="space-y-5">

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                      Course
                    </label>

                    <input
                      type="text"
                      value={
                        unit.course.name
                      }
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-500"
                    />

                    <p className="mt-1.5 text-[11px] text-slate-400">
                      This unit remains under its assigned course.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">

                    <div>
                      <label
                        htmlFor="edit-unit-code"
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                      >
                        Unit Code
                      </label>

                      <input
                        id="edit-unit-code"
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
                              code:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        disabled={
                          savingUnit
                        }
                        placeholder="e.g. EMT 102"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-unit-name"
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                      >
                        Unit Name
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        id="edit-unit-name"
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
                              name:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        disabled={
                          savingUnit
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                      />
                    </div>

                  </div>

                  <div>
                    <label
                      htmlFor="edit-unit-description"
                      className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      Description
                    </label>

                    <textarea
                      id="edit-unit-description"
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
                      disabled={
                        savingUnit
                      }
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-3">

                    <div>
                      <label
                        htmlFor="edit-credit-hours"
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                      >
                        Credit Hours
                      </label>

                      <input
                        id="edit-credit-hours"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-year"
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                      >
                        Year
                      </label>

                      <input
                        id="edit-year"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-term"
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                      >
                        Term
                      </label>

                      <input
                        id="edit-term"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                      />
                    </div>

                  </div>

                  <div>
                    <label
                      htmlFor="edit-unit-status"
                      className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      Status
                    </label>

                    <select
                      id="edit-unit-status"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
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

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">

                <button
                  type="button"
                  onClick={
                    closeUnitModal
                  }
                  disabled={
                    savingUnit
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    savingUnit
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
                >
                  {savingUnit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          ADD / EDIT TOPIC MODAL
      ===================================================== */}

      {showTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">

          <div
            className="fixed inset-0"
            onClick={
              closeTopicModal
            }
          />

          <div className="relative z-10 my-8 w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-6">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">
                  {editingTopic ? (
                    <Edit3 className="h-5 w-5 text-brand-green" />
                  ) : (
                    <Plus className="h-5 w-5 text-brand-green" />
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-brand-dark">
                    {editingTopic
                      ? 'Edit Topic'
                      : 'Add Topic'}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {editingTopic
                      ? 'Update this topic.'
                      : 'Create a new topic under this unit.'}
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={
                  closeTopicModal
                }
                disabled={
                  savingTopic
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <form
              onSubmit={
                handleSaveTopic
              }
            >

              <div className="space-y-5 px-5 py-5 sm:px-6">

                {topicFormError && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                      <p className="font-bold">
                        Unable to save topic
                      </p>

                      <p className="mt-0.5">
                        {topicFormError}
                      </p>
                    </div>

                  </div>
                )}

                <div>
                  <label
                    htmlFor="topic-title"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                  >
                    Topic Title
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="topic-title"
                    type="text"
                    value={
                      topicForm.title
                    }
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) =>
                      setTopicForm(
                        (
                          current: TopicForm
                        ) => ({
                          ...current,
                          title:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    disabled={
                      savingTopic
                    }
                    placeholder="e.g. Introduction to Anatomy"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="topic-description"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                  >
                    Description
                  </label>

                  <textarea
                    id="topic-description"
                    rows={4}
                    value={
                      topicForm.description
                    }
                    onChange={(
                      event: React.ChangeEvent<HTMLTextAreaElement>
                    ) =>
                      setTopicForm(
                        (
                          current: TopicForm
                        ) => ({
                          ...current,
                          description:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    disabled={
                      savingTopic
                    }
                    placeholder="Describe what this topic covers..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>
                    <label
                      htmlFor="topic-order"
                      className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      Order
                    </label>

                    <input
                      id="topic-order"
                      type="number"
                      min="1"
                      step="1"
                      value={
                        topicForm.order_number
                      }
                      onChange={(
                        event: React.ChangeEvent<HTMLInputElement>
                      ) =>
                        setTopicForm(
                          (
                            current: TopicForm
                          ) => ({
                            ...current,
                            order_number:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      disabled={
                        savingTopic
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                    />

                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Determines the topic's position.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="topic-status"
                      className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600"
                    >
                      Status
                    </label>

                    <select
                      id="topic-status"
                      value={
                        topicForm.status
                      }
                      onChange={(
                        event: React.ChangeEvent<HTMLSelectElement>
                      ) =>
                        setTopicForm(
                          (
                            current: TopicForm
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
                        savingTopic
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
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

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">

                <button
                  type="button"
                  onClick={
                    closeTopicModal
                  }
                  disabled={
                    savingTopic
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    savingTopic
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
                >
                  {savingTopic ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingTopic
                        ? 'Save Changes'
                        : 'Create Topic'}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          DELETE UNIT MODAL
      ===================================================== */}

      {showDeleteUnitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div
            className="fixed inset-0"
            onClick={() =>
              !deletingUnit &&
              setShowDeleteUnitModal(
                false
              )
            }
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-brand-dark">
              Delete Course Unit?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to delete{' '}
              <span className="font-bold text-slate-700">
                {unit.name}
              </span>
              . This action cannot be undone.
            </p>

            {unit.topic_count >
              0 && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                This unit contains{' '}
                <strong>
                  {unit.topic_count}
                </strong>{' '}
                topic
                {unit.topic_count ===
                1
                  ? ''
                  : 's'}
                . The server will prevent deletion until
                the topics are removed.
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  setShowDeleteUnitModal(
                    false
                  )
                }
                disabled={
                  deletingUnit
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleDeleteUnit
                }
                disabled={
                  deletingUnit
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingUnit ? (
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

      {/* =====================================================
          DELETE TOPIC MODAL
      ===================================================== */}

      {topicToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div
            className="fixed inset-0"
            onClick={() =>
              deletingTopicId ===
                null &&
              setTopicToDelete(
                null
              )
            }
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-brand-dark">
              Delete Topic?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to delete{' '}
              <span className="font-bold text-slate-700">
                {topicToDelete.title}
              </span>
              .
            </p>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              If this topic already contains lessons,
              materials, videos, assignments or quizzes,
              the server should prevent deletion rather than
              silently removing curriculum content.
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  setTopicToDelete(
                    null
                  )
                }
                disabled={
                  deletingTopicId !==
                  null
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleDeleteTopic
                }
                disabled={
                  deletingTopicId !==
                  null
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingTopicId !==
                null ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Topic
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

