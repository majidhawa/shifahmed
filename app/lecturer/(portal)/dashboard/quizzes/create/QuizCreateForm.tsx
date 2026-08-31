'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileQuestion,
  ListChecks,
  Loader2,
  Save,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Program = {
  id: number;
  name: string;
};

type Unit = {
  id: number;
  programId: number;
  code: string;
  name: string;
};

type Topic = {
  id: number;
  unitId: number;
  title: string;
};

type Lesson = {
  id: number;
  topicId: number;
  title: string;
};

type QuizCreateFormProps = {
  programs: Program[];
  units: Unit[];
  topics: Topic[];
  lessons: Lesson[];
};

/* =========================================================
   COMPONENT
========================================================= */

export default function QuizCreateForm({
  programs,
  units,
  topics,
  lessons,
}: QuizCreateFormProps) {
  /* =======================================================
     STATE
  ======================================================= */

  const [programId, setProgramId] =
    useState('');

  const [unitId, setUnitId] =
    useState('');

  const [topicId, setTopicId] =
    useState('');

  const [lessonId, setLessonId] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  /* =======================================================
     FILTER UNITS
     
     Program
       ↓
     Units
  ======================================================= */

  const filteredUnits = useMemo(() => {
    if (!programId) {
      return [];
    }

    const selectedProgramId =
      Number(programId);

    return units.filter(
      (unit) =>
        unit.programId ===
        selectedProgramId
    );
  }, [programId, units]);

  /* =======================================================
     FILTER TOPICS
     
     Unit
       ↓
     Topics
  ======================================================= */

  const filteredTopics = useMemo(() => {
    if (!unitId) {
      return [];
    }

    const selectedUnitId =
      Number(unitId);

    return topics.filter(
      (topic) =>
        topic.unitId ===
        selectedUnitId
    );
  }, [unitId, topics]);

  /* =======================================================
     FILTER LESSONS
     
     Topic
       ↓
     Lessons
  ======================================================= */

  const filteredLessons = useMemo(() => {
    if (!topicId) {
      return [];
    }

    const selectedTopicId =
      Number(topicId);

    return lessons.filter(
      (lesson) =>
        lesson.topicId ===
        selectedTopicId
    );
  }, [topicId, lessons]);

  /* =======================================================
     SELECTED INFORMATION
  ======================================================= */

  const selectedProgram =
    programs.find(
      (program) =>
        program.id ===
        Number(programId)
    );

  const selectedUnit =
    units.find(
      (unit) =>
        unit.id ===
        Number(unitId)
    );

  const selectedTopic =
    topics.find(
      (topic) =>
        topic.id ===
        Number(topicId)
    );

  const selectedLesson =
    lessons.find(
      (lesson) =>
        lesson.id ===
        Number(lessonId)
    );

  /* =======================================================
     PROGRAM CHANGE
     
     When program changes:
       Unit resets
       Topic resets
       Lesson resets
  ======================================================= */

  function handleProgramChange(
    value: string
  ) {
    setProgramId(value);

    setUnitId('');
    setTopicId('');
    setLessonId('');

    setErrorMessage('');
  }

  /* =======================================================
     UNIT CHANGE
     
     When unit changes:
       Topic resets
       Lesson resets
  ======================================================= */

  function handleUnitChange(
    value: string
  ) {
    setUnitId(value);

    setTopicId('');
    setLessonId('');

    setErrorMessage('');
  }

  /* =======================================================
     TOPIC CHANGE
     
     When topic changes:
       Lesson resets
  ======================================================= */

  function handleTopicChange(
    value: string
  ) {
    setTopicId(value);

    setLessonId('');

    setErrorMessage('');
  }

  /* =======================================================
     LESSON CHANGE
  ======================================================= */

  function handleLessonChange(
    value: string
  ) {
    setLessonId(value);

    setErrorMessage('');
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage('');

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!programId) {
      setErrorMessage(
        'Please select a program.'
      );

      return;
    }

    if (!unitId) {
      setErrorMessage(
        'Please select a unit.'
      );

      return;
    }

    if (!topicId) {
      setErrorMessage(
        'Please select a topic.'
      );

      return;
    }

    if (!lessonId) {
      setErrorMessage(
        'Please select a lesson.'
      );

      return;
    }

    /* =====================================================
       ENSURE THE HIERARCHY IS VALID
       
       This is an additional frontend check.
       The API still performs its own secure
       database validation.
    ===================================================== */

    const validUnit =
      selectedUnit &&
      selectedUnit.programId ===
        Number(programId);

    const validTopic =
      selectedTopic &&
      selectedTopic.unitId ===
        Number(unitId);

    const validLesson =
      selectedLesson &&
      selectedLesson.topicId ===
        Number(topicId);

    if (!validUnit) {
      setErrorMessage(
        'The selected unit does not belong to the selected program.'
      );

      return;
    }

    if (!validTopic) {
      setErrorMessage(
        'The selected topic does not belong to the selected unit.'
      );

      return;
    }

    if (!validLesson) {
      setErrorMessage(
        'The selected lesson does not belong to the selected topic.'
      );

      return;
    }

    /* =====================================================
       SUBMITTING
    ===================================================== */

    setSubmitting(true);

    try {
      const form =
        event.currentTarget;

      const formData =
        new FormData(form);

      /*
       * Explicitly set the hierarchy IDs.
       * This guarantees the values submitted to
       * the API are the currently selected values.
       */

      formData.set(
        'program_id',
        programId
      );

      formData.set(
        'unit_id',
        unitId
      );

      formData.set(
        'topic_id',
        topicId
      );

      formData.set(
        'lesson_id',
        lessonId
      );

      const response =
        await fetch(
          '/api/lecturer/quizzes',
          {
            method: 'POST',
            body: formData,
          }
        );

      const data =
        await response.json();

      /* ===================================================
         API ERROR
      =================================================== */

      if (!response.ok || !data.success) {
        setErrorMessage(
          data.message ||
            'Failed to create the assessment.'
        );

        return;
      }

      /* ===================================================
         SUCCESS
      =================================================== */

      if (
        data.redirectUrl
      ) {
        window.location.href =
          data.redirectUrl;

        return;
      }

      if (
        data.quiz?.id
      ) {
        window.location.href =
          `/lecturer/dashboard/quizzes/${data.quiz.id}/questions`;

        return;
      }

      /*
       * Fallback
       */

      window.location.href =
        '/lecturer/dashboard/quizzes';
    } catch (error) {
      console.error(
        'CREATE QUIZ SUBMIT ERROR:',
        error
      );

      setErrorMessage(
        'Unable to create the assessment. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-6"
    >

      {/* ==================================================
          ERROR MESSAGE
      ================================================== */}

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">

          <div className="flex items-start gap-3">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100">

              <span className="text-sm font-bold text-red-600">
                !
              </span>

            </div>

            <div>
              <p className="text-sm font-bold text-red-800">
                Unable to create assessment
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {errorMessage}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* ==================================================
          BASIC INFORMATION
      ================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">

            <FileQuestion className="h-5 w-5 text-brand-green" />

          </div>

          <div>
            <h2 className="text-lg font-bold text-brand-dark">
              Assessment Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the basic information for this quiz or exam.
            </p>
          </div>

        </div>

        <div className="mt-7 grid gap-5">

          {/* TITLE */}

          <div>

            <label
              htmlFor="title"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Quiz / Exam Title *
            </label>

            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={255}
              placeholder="e.g. EMT Introduction Mid-Term Assessment"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
            />

          </div>

          {/* DESCRIPTION */}

          <div>

            <label
              htmlFor="description"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Briefly describe what this assessment covers..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
            />

          </div>

          {/* INSTRUCTIONS */}

          <div>

            <label
              htmlFor="instructions"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Instructions
            </label>

            <textarea
              id="instructions"
              name="instructions"
              rows={4}
              placeholder="Enter instructions students should follow..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
            />

          </div>

        </div>

      </section>

      {/* ==================================================
          ASSESSMENT LOCATION
      ================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-gold/20">

            <BookOpen className="h-5 w-5 text-brand-dark" />

          </div>

          <div>
            <h2 className="text-lg font-bold text-brand-dark">
              Assessment Location
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select the program, unit, topic and lesson where this assessment belongs.
            </p>
          </div>

        </div>

        {/* =================================================
            HIERARCHY PREVIEW
        ================================================= */}

        {(selectedProgram ||
          selectedUnit ||
          selectedTopic ||
          selectedLesson) && (

          <div className="mt-6 rounded-2xl border border-brand-green/10 bg-brand-green/5 p-4">

            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-green">
              Selected Assessment Location
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">

              {selectedProgram && (
                <>
                  <span className="rounded-lg bg-white px-3 py-2 font-bold text-brand-dark shadow-sm">
                    {selectedProgram.name}
                  </span>

                  {selectedUnit && (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </>
              )}

              {selectedUnit && (
                <>
                  <span className="rounded-lg bg-white px-3 py-2 font-bold text-brand-dark shadow-sm">
                    {selectedUnit.code}
                  </span>

                  {selectedTopic && (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </>
              )}

              {selectedTopic && (
                <>
                  <span className="rounded-lg bg-white px-3 py-2 font-bold text-brand-dark shadow-sm">
                    {selectedTopic.title}
                  </span>

                  {selectedLesson && (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </>
              )}

              {selectedLesson && (
                <span className="rounded-lg bg-brand-green px-3 py-2 font-bold text-white shadow-sm">
                  {selectedLesson.title}
                </span>
              )}

            </div>

          </div>
        )}

        <div className="mt-7 grid gap-5 sm:grid-cols-2">

          {/* =================================================
              PROGRAM
          ================================================= */}

          <div>

            <label
              htmlFor="program_id"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Program *
            </label>

            <select
              id="program_id"
              name="program_id"
              value={programId}
              onChange={(event) =>
                handleProgramChange(
                  event.target.value
                )
              }
              required
              disabled={submitting}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:bg-slate-50"
            >

              <option value="">
                Select program
              </option>

              {programs.map(
                (program) => (
                  <option
                    key={program.id}
                    value={program.id}
                  >
                    {program.name}
                  </option>
                )
              )}

            </select>

          </div>

          {/* =================================================
              UNIT
          ================================================= */}

          <div>

            <label
              htmlFor="unit_id"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Unit *
            </label>

            <select
              id="unit_id"
              name="unit_id"
              value={unitId}
              onChange={(event) =>
                handleUnitChange(
                  event.target.value
                )
              }
              required
              disabled={
                !programId ||
                filteredUnits.length === 0 ||
                submitting
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:bg-slate-50"
            >

              <option value="">
                {!programId
                  ? 'Select program first'
                  : filteredUnits.length === 0
                  ? 'No units available'
                  : 'Select unit'}
              </option>

              {filteredUnits.map(
                (unit) => (
                  <option
                    key={unit.id}
                    value={unit.id}
                  >
                    {unit.code} — {unit.name}
                  </option>
                )
              )}

            </select>

            {programId && (
              <p className="mt-1 text-[11px] text-slate-400">
                {filteredUnits.length}{' '}
                {filteredUnits.length === 1
                  ? 'unit'
                  : 'units'}{' '}
                available for this program.
              </p>
            )}

          </div>

          {/* =================================================
              TOPIC
          ================================================= */}

          <div>

            <label
              htmlFor="topic_id"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Topic *
            </label>

            <select
              id="topic_id"
              name="topic_id"
              value={topicId}
              onChange={(event) =>
                handleTopicChange(
                  event.target.value
                )
              }
              required
              disabled={
                !unitId ||
                filteredTopics.length === 0 ||
                submitting
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:bg-slate-50"
            >

              <option value="">
                {!unitId
                  ? 'Select unit first'
                  : filteredTopics.length === 0
                  ? 'No topics available'
                  : 'Select topic'}
              </option>

              {filteredTopics.map(
                (topic) => (
                  <option
                    key={topic.id}
                    value={topic.id}
                  >
                    {topic.title}
                  </option>
                )
              )}

            </select>

            {unitId && (
              <p className="mt-1 text-[11px] text-slate-400">
                {filteredTopics.length}{' '}
                {filteredTopics.length === 1
                  ? 'topic'
                  : 'topics'}{' '}
                available for this unit.
              </p>
            )}

          </div>

          {/* =================================================
              LESSON
          ================================================= */}

          <div>

            <label
              htmlFor="lesson_id"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Lesson *
            </label>

            <select
              id="lesson_id"
              name="lesson_id"
              value={lessonId}
              onChange={(event) =>
                handleLessonChange(
                  event.target.value
                )
              }
              required
              disabled={
                !topicId ||
                filteredLessons.length === 0 ||
                submitting
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:bg-slate-50"
            >

              <option value="">
                {!topicId
                  ? 'Select topic first'
                  : filteredLessons.length === 0
                  ? 'No lessons available'
                  : 'Select lesson'}
              </option>

              {filteredLessons.map(
                (lesson) => (
                  <option
                    key={lesson.id}
                    value={lesson.id}
                  >
                    {lesson.title}
                  </option>
                )
              )}

            </select>

            {topicId && (
              <p className="mt-1 text-[11px] text-slate-400">
                {filteredLessons.length}{' '}
                {filteredLessons.length === 1
                  ? 'lesson'
                  : 'lessons'}{' '}
                available for this topic.
              </p>
            )}

          </div>

        </div>

      </section>

      {/* ==================================================
          ASSESSMENT SETTINGS
      ================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">

            <ListChecks className="h-5 w-5 text-brand-green" />

          </div>

          <div>
            <h2 className="text-lg font-bold text-brand-dark">
              Assessment Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure marks, attempts and the passing score.
            </p>
          </div>

        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL MARKS */}

          <div>

            <label
              htmlFor="total_marks"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Total Marks *
            </label>

            <input
              id="total_marks"
              name="total_marks"
              type="number"
              min="1"
              step="1"
              defaultValue="10"
              required
              disabled={submitting}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-brand-dark outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
            />

          </div>

          {/* TIME */}

          <div>

            <label
              htmlFor="time_limit_minutes"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Time Limit
            </label>

            <div className="relative">

              <Clock3 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="time_limit_minutes"
                name="time_limit_minutes"
                type="number"
                min="0"
                step="1"
                defaultValue="0"
                disabled={submitting}
                className="w-full rounded-2xl border border-slate-200 px-10 py-3 text-sm font-semibold text-brand-dark outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
              />

            </div>

            <p className="mt-1 text-[11px] text-slate-400">
              0 = no time limit
            </p>

          </div>

          {/* ATTEMPTS */}

          <div>

            <label
              htmlFor="attempts_allowed"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Attempts *
            </label>

            <input
              id="attempts_allowed"
              name="attempts_allowed"
              type="number"
              min="1"
              step="1"
              defaultValue="1"
              required
              disabled={submitting}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-brand-dark outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
            />

          </div>

          {/* PASSING SCORE */}

          <div>

            <label
              htmlFor="passing_score"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Passing Score *
            </label>

            <div className="relative">

              <input
                id="passing_score"
                name="passing_score"
                type="number"
                min="0"
                max="100"
                step="1"
                defaultValue="50"
                required
                disabled={submitting}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-10 text-sm font-semibold text-brand-dark outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                %
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* ==================================================
          STATUS
      ================================================== */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50">

            <CheckCircle2 className="h-5 w-5 text-green-600" />

          </div>

          <div className="flex-1">

            <h2 className="text-lg font-bold text-brand-dark">
              Quiz Status
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Keep the quiz as a draft while you prepare the
              questions. You can publish it when it is ready.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              {/* DRAFT */}

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-brand-green">

                <input
                  type="radio"
                  name="status"
                  value="draft"
                  defaultChecked
                  disabled={submitting}
                  className="mt-1 h-4 w-4 accent-brand-green"
                />

                <div>

                  <p className="text-sm font-bold text-brand-dark">
                    Draft
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Prepare the assessment before making it
                    available to students.
                  </p>

                </div>

              </label>

              {/* ACTIVE */}

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-brand-green">

                <input
                  type="radio"
                  name="status"
                  value="active"
                  disabled={submitting}
                  className="mt-1 h-4 w-4 accent-brand-green"
                />

                <div>

                  <p className="text-sm font-bold text-brand-dark">
                    Active
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Make the assessment available according
                    to the student LMS rules.
                  </p>

                </div>

              </label>

            </div>

          </div>

        </div>

      </section>

      {/* ==================================================
          ACTIONS
      ================================================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

        <Link
          href="/lecturer/dashboard/quizzes"
          className={`inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 ${
            submitting
              ? 'pointer-events-none opacity-50'
              : ''
          }`}
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={
            submitting ||
            !programId ||
            !unitId ||
            !topicId ||
            !lessonId
          }
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-green px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >

          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Assessment...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Create Quiz
            </>
          )}

        </button>

      </div>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <div className="mt-8 rounded-3xl bg-brand-green p-7 shadow-soft">

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
          SMTC Lecturer Portal
        </p>

        <h2 className="mt-2 text-xl font-bold text-white">
          Create the assessment first, then build the questions.
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
          Once the quiz has been created, you will be taken to
          its question management page where you can add
          multiple-choice, true/false, short-answer and essay
          questions.
        </p>

      </div>

    </form>
  );
}