'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  ArrowLeft,
  BookOpen,
  FileText,
  Plus,
  Loader2,
  AlertCircle,
  ExternalLink,
  Pencil,
  Trash2,
  CheckCircle2,
  File,
  Layers3,
} from 'lucide-react';

type Document = {
  id: number;
  lesson_id: number;
  title: string;
  description: string | null;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type Lesson = {
  id: number;
  title: string;
  topic_id: number;
  topic_title?: string;
  unit_id?: number;
  unit_name?: string;
  unit_code?: string;
  course_name?: string;
  course_code?: string;
};

export default function LessonMaterialsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const lessonId = params?.id;

  const topicId =
    searchParams.get('topic_id');

  const unitId =
    searchParams.get('unit_id');

  const [lesson, setLesson] =
    useState<Lesson | null>(null);

  const [documents, setDocuments] =
    useState<Document[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  /* =========================================================
     LOAD MATERIALS
  ========================================================= */

  const loadMaterials = async () => {
    if (!lessonId) {
      setError('No lesson was selected.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `/api/lecturer/lessons/${lessonId}/documents`,
        {
          credentials: 'include',
          cache: 'no-store',
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
            'Unable to load lesson materials.'
        );
      }

      setLesson(data.lesson);
      setDocuments(
        Array.isArray(data.documents)
          ? data.documents
          : []
      );
    } catch (err) {
      console.error(
        'LOAD MATERIALS ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load materials.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [lessonId]);

  /* =========================================================
     DELETE MATERIAL
  ========================================================= */

  const deleteDocument = async (
    documentId: number,
    title: string
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(documentId);

      const response = await fetch(
        `/api/lecturer/lessons/${lessonId}/documents/${documentId}`,
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
            'Unable to delete material.'
        );
      }

      setDocuments((current) =>
        current.filter(
          (document) =>
            document.id !== documentId
        )
      );
    } catch (err) {
      console.error(
        'DELETE MATERIAL ERROR:',
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : 'Unable to delete material.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================================
     FORMAT FILE SIZE
  ========================================================= */

  const formatFileSize = (
    bytes: number | null
  ) => {
    if (
      bytes === null ||
      bytes === undefined
    ) {
      return 'Size unavailable';
    }

    if (bytes === 0) {
      return '0 Bytes';
    }

    const units = [
      'Bytes',
      'KB',
      'MB',
      'GB',
    ];

    const index = Math.floor(
      Math.log(bytes) /
        Math.log(1024)
    );

    return `${(
      bytes /
      Math.pow(1024, index)
    ).toFixed(index === 0 ? 0 : 1)} ${
      units[index]
    }`;
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10">
                <Loader2 className="h-7 w-7 animate-spin text-brand-green" />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading lesson materials...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          <button
            type="button"
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-green/5 hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lesson
          </button>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <h1 className="text-lg font-bold text-red-700">
                  Unable to Load Materials
                </h1>

                <p className="mt-1 text-sm leading-6 text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadMaterials}
                  className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* =====================================================
           BACK
        ===================================================== */}

        <Link
          href={`/lecturer/dashboard/lessons/${lessonId}?topic_id=${topicId || lesson?.topic_id || ''}&unit_id=${unitId || lesson?.unit_id || ''}`}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-green/5 hover:text-brand-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lesson
        </Link>

        {/* =====================================================
           HEADER
        ===================================================== */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div className="min-w-0">

            {lesson?.course_name && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green">
                <BookOpen className="h-4 w-4" />
                {lesson.course_name}
              </div>
            )}

            <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">
              Lesson Materials
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Manage notes, PDFs, documents and other
              learning resources for this lesson.
            </p>

            {lesson && (
              <div className="mt-4 flex flex-wrap gap-2">

                {lesson.unit_code && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-500">
                    <Layers3 className="h-3 w-3" />
                    {lesson.unit_code}
                  </span>
                )}

                {lesson.unit_name && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                    {lesson.unit_name}
                  </span>
                )}

                <span className="rounded-lg bg-brand-green/5 px-2.5 py-1.5 text-[10px] font-bold text-brand-green">
                  {lesson.title}
                </span>

              </div>
            )}

          </div>

          {/* ADD */}

          <Link
            href={`/lecturer/dashboard/lessons/${lessonId}/materials/create?topic_id=${topicId || lesson?.topic_id || ''}&unit_id=${unitId || lesson?.unit_id || ''}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            Add Material
          </Link>

        </div>

        {/* =====================================================
           STATISTICS
        ===================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <FileText className="h-5 w-5 text-brand-green" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Total Materials
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {documents.length}
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
                <p className="text-sm text-slate-500">
                  Active Materials
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {
                    documents.filter(
                      (document) =>
                        document.status ===
                        'active'
                    ).length
                  }
                </p>
              </div>

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">

            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
                <File className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Lesson
                </p>

                <p className="mt-1 truncate text-sm font-bold text-brand-dark">
                  {lesson?.title || '—'}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* =====================================================
           MATERIALS
        ===================================================== */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">

          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="font-bold text-brand-dark">
                  Learning Materials
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Documents and resources attached to this lesson.
                </p>
              </div>

              <Link
                href={`/lecturer/dashboard/lessons/${lessonId}/materials/create?topic_id=${topicId || lesson?.topic_id || ''}&unit_id=${unitId || lesson?.unit_id || ''}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-dark"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Material
              </Link>

            </div>

          </div>

          {/* EMPTY */}

          {documents.length === 0 ? (

            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 py-16 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-green/10">
                <FileText className="h-8 w-8 text-brand-green" />
              </div>

              <h3 className="mt-5 text-base font-bold text-brand-dark">
                No materials yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                This lesson does not have any learning
                materials yet. Add your first PDF,
                document or learning resource.
              </p>

              <Link
                href={`/lecturer/dashboard/lessons/${lessonId}/materials/create?topic_id=${topicId || lesson?.topic_id || ''}&unit_id=${unitId || lesson?.unit_id || ''}`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                <Plus className="h-4 w-4" />
                Add First Material
              </Link>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {documents.map(
                (document) => (

                  <div
                    key={document.id}
                    className="p-5 transition hover:bg-slate-50/70 sm:p-6"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      <div className="flex min-w-0 gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">
                          <FileText className="h-6 w-6 text-brand-green" />
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="text-sm font-bold text-brand-dark sm:text-base">
                              {document.title}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                document.status ===
                                'inactive'
                                  ? 'bg-slate-100 text-slate-500'
                                  : 'bg-green-50 text-green-700'
                              }`}
                            >
                              {document.status}
                            </span>

                          </div>

                          {document.description && (
                            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                              {document.description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">

                            <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                              {document.file_name}
                            </span>

                            <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                              {formatFileSize(
                                document.file_size
                              )}
                            </span>

                            {document.mime_type && (
                              <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
                                {document.mime_type}
                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex shrink-0 flex-wrap gap-2">

                     
<a
  href={`/api/lecturer/lesson-documents/${document.id}/view`}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-brand-green/30 hover:bg-brand-green/5 hover:text-brand-green"
>
  <ExternalLink className="h-3.5 w-3.5" />
  Open
</a>


                        <Link
                          href={`/lecturer/dashboard/lessons/${lessonId}/materials/${document.id}/edit?topic_id=${topicId || lesson?.topic_id || ''}&unit_id=${unitId || lesson?.unit_id || ''}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-green/20 bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green transition hover:bg-brand-green hover:text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>

                        <button
                          type="button"
                          disabled={
                            deletingId ===
                            document.id
                          }
                          onClick={() =>
                            deleteDocument(
                              document.id,
                              document.title
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId ===
                          document.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}

                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>
    </div>
  );
}