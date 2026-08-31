
'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import Link from 'next/link';

import {
  ArrowLeft,
  BookOpen,
  FileText,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2,
  Link2,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type LessonDocument = {
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

/* =========================================================
   PAGE
========================================================= */

export default function EditLessonMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const lessonId = params?.id;
  const documentId = params?.documentId;

  const topicId = searchParams.get('topic_id');
  const unitId = searchParams.get('unit_id');

  const numericLessonId = Number(lessonId);
  const numericDocumentId = Number(documentId);

  /* =========================================================
     STATE
  ========================================================= */

  const [document, setDocument] =
    useState<LessonDocument | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] =
    useState('');
  const [fileName, setFileName] =
    useState('');
  const [fileUrl, setFileUrl] =
    useState('');
  const [fileSize, setFileSize] =
    useState('');
  const [mimeType, setMimeType] =
    useState('application/pdf');
  const [status, setStatus] =
    useState('active');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  /* =========================================================
     MATERIALS URL
  ========================================================= */

  const materialsUrl =
    `/lecturer/dashboard/lessons/${numericLessonId}/materials${
      topicId
        ? `?topic_id=${topicId}&unit_id=${unitId || ''}`
        : ''
    }`;

  /* =========================================================
     LOAD DOCUMENT
  ========================================================= */

  useEffect(() => {
    if (
      !lessonId ||
      !documentId ||
      !Number.isInteger(numericLessonId) ||
      numericLessonId <= 0 ||
      !Number.isInteger(numericDocumentId) ||
      numericDocumentId <= 0
    ) {
      setError(
        'A valid lesson and document ID are required.'
      );

      setLoading(false);
      return;
    }

    const loadDocument = async () => {
      try {
        setLoading(true);
        setError('');

        /*
         * The API is scoped to the lesson so that a lecturer
         * cannot edit a document belonging to another lesson.
         */

       const response = await fetch(
  `/api/lecturer/lessons/${numericLessonId}/documents/${numericDocumentId}`,
  {
    method: 'GET',
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
              'Unable to load lesson material.'
          );
        }

        const loadedDocument =
          data.document as LessonDocument;

        /*
         * Extra client-side protection.
         */

        if (
          Number(loadedDocument.lesson_id) !==
          numericLessonId
        ) {
          throw new Error(
            'This material does not belong to the selected lesson.'
          );
        }

        setDocument(loadedDocument);

        setTitle(
          loadedDocument.title || ''
        );

        setDescription(
          loadedDocument.description || ''
        );

        setFileName(
          loadedDocument.file_name || ''
        );

        setFileUrl(
          loadedDocument.file_url || ''
        );

        setFileSize(
          loadedDocument.file_size !== null &&
          loadedDocument.file_size !== undefined
            ? String(loadedDocument.file_size)
            : ''
        );

        setMimeType(
          loadedDocument.mime_type ||
            'application/pdf'
        );

        setStatus(
          loadedDocument.status ||
            'active'
        );

      } catch (err) {
        console.error(
          'LOAD LESSON DOCUMENT ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load lesson material.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [
    lessonId,
    documentId,
    numericLessonId,
    numericDocumentId,
  ]);

  /* =========================================================
     SUBMIT UPDATE
  ========================================================= */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError(
        'Material title is required.'
      );
      return;
    }

    if (!fileName.trim()) {
      setError(
        'File name is required.'
      );
      return;
    }

    if (!fileUrl.trim()) {
      setError(
        'File URL is required.'
      );
      return;
    }

    if (
      fileSize.trim() &&
      (
        !Number.isFinite(
          Number(fileSize)
        ) ||
        Number(fileSize) < 0
      )
    ) {
      setError(
        'File size must be a valid number greater than or equal to 0.'
      );
      return;
    }

    if (
      status !== 'active' &&
      status !== 'inactive'
    ) {
      setError(
        'Status must be either active or inactive.'
      );
      return;
    }

   try {
  setSaving(true);

  const response = await fetch(
    `/api/lecturer/lessons/${numericLessonId}/documents/${numericDocumentId}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
          body: JSON.stringify({
            lesson_id:
              numericLessonId,

            title:
              title.trim(),

            description:
              description.trim() ||
              null,

            file_name:
              fileName.trim(),

            file_url:
              fileUrl.trim(),

            file_size:
              fileSize.trim()
                ? Number(fileSize)
                : null,

            mime_type:
              mimeType.trim() ||
              'application/pdf',

            status,
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
            'Unable to update lesson material.'
        );
      }

      setDocument(
        data.document ||
          document
      );

      setSuccess(
        'Lesson material updated successfully.'
      );

      /*
       * Return to materials after successful update.
       */

      setTimeout(() => {
        router.push(materialsUrl);
      }, 700);

    } catch (err) {
      console.error(
        'UPDATE LESSON DOCUMENT ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update lesson material.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     INVALID PARAMETERS
  ========================================================= */

  if (
    !lessonId ||
    !documentId ||
    !Number.isInteger(numericLessonId) ||
    numericLessonId <= 0 ||
    !Number.isInteger(numericDocumentId) ||
    numericDocumentId <= 0
  ) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">

          <Link
            href="/lecturer/dashboard/lessons"
            className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-green/5 hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lessons
          </Link>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>

              <div>

                <h1 className="text-lg font-bold text-red-700">
                  Invalid Material
                </h1>

                <p className="mt-1 text-sm leading-6 text-red-600">
                  A valid lesson ID and document ID
                  are required.
                </p>

              </div>

            </div>

          </div>

        </div>
      </div>
    );
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">

          <div className="flex min-h-[500px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10">
                <Loader2 className="h-7 w-7 animate-spin text-brand-green" />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading material...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait while we load the
                material details.
              </p>

            </div>

          </div>

        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR / NOT FOUND
  ========================================================= */

  if (error && !document) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">

          <Link
            href={materialsUrl}
            className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-green/5 hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Materials
          </Link>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>

              <div className="min-w-0">

                <h1 className="text-lg font-bold text-red-700">
                  Unable to Load Material
                </h1>

                <p className="mt-1 text-sm leading-6 text-red-600">
                  {error}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      window.location.reload()
                    }
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
                  >
                    Try Again
                  </button>

                  <Link
                    href={materialsUrl}
                    className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                  >
                    Back to Materials
                  </Link>

                </div>

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
      <div className="mx-auto max-w-4xl">

        {/* =====================================================
           BACK
        ===================================================== */}

        <Link
          href={materialsUrl}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-green/5 hover:text-brand-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Materials
        </Link>

        {/* =====================================================
           HEADER
        ===================================================== */}

        <div className="mb-6">

          <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green">

            <BookOpen className="h-4 w-4" />

            Lesson Material

          </div>

          <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">
            Edit Lesson Material
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Update the title, description, document
            URL, file information, or status of this
            learning resource.
          </p>

        </div>

        {/* =====================================================
           SUCCESS
        ===================================================== */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">

            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

            <p className="text-sm font-semibold text-green-700">
              {success}
            </p>

          </div>
        )}

        {/* =====================================================
           ERROR
        ===================================================== */}

        {error && document && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <p className="text-sm font-semibold text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* =====================================================
           FORM
        ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft"
        >

          {/* ===================================================
             FORM HEADER
          =================================================== */}

          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <FileText className="h-5 w-5 text-brand-green" />
              </div>

              <div className="min-w-0">

                <h2 className="font-bold text-brand-dark">
                  Material Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Document #{numericDocumentId}
                </p>

              </div>

            </div>

          </div>

          {/* ===================================================
             FORM BODY
          =================================================== */}

          <div className="space-y-6 p-5 sm:p-6">

            {/* TITLE */}

            <div>

              <label
                htmlFor="title"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Material Title
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="e.g. Introduction to EMT Notes"
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
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
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Briefly describe this learning material..."
                rows={4}
                disabled={saving}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
              />

            </div>

            {/* FILE NAME */}

            <div>

              <label
                htmlFor="fileName"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                File Name
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="fileName"
                type="text"
                value={fileName}
                onChange={(event) =>
                  setFileName(
                    event.target.value
                  )
                }
                placeholder="e.g. introduction-to-emt.pdf"
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
              />

            </div>

            {/* FILE URL */}

            <div>

              <label
                htmlFor="fileUrl"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                File URL
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">

                <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="fileUrl"
                  type="url"
                  value={fileUrl}
                  onChange={(event) =>
                    setFileUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://example.com/document.pdf"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
                />

              </div>

              <p className="mt-1.5 text-xs text-slate-400">
                Update the URL where the document is
                hosted.
              </p>

            </div>

            {/* FILE INFORMATION */}

            <div className="grid gap-5 sm:grid-cols-2">

              {/* FILE SIZE */}

              <div>

                <label
                  htmlFor="fileSize"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  File Size
                </label>

                <input
                  id="fileSize"
                  type="number"
                  min="0"
                  value={fileSize}
                  onChange={(event) =>
                    setFileSize(
                      event.target.value
                    )
                  }
                  placeholder="e.g. 250000"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  File size in bytes. Optional.
                </p>

              </div>

              {/* MIME TYPE */}

              <div>

                <label
                  htmlFor="mimeType"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  File Type
                </label>

                <select
                  id="mimeType"
                  value={mimeType}
                  onChange={(event) =>
                    setMimeType(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
                >

                  <option value="application/pdf">
                    PDF Document
                  </option>

                  <option value="application/msword">
                    Microsoft Word
                  </option>

                  <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                    Word Document
                  </option>

                  <option value="application/vnd.ms-powerpoint">
                    PowerPoint
                  </option>

                  <option value="application/vnd.openxmlformats-officedocument.presentationml.presentation">
                    PowerPoint Presentation
                  </option>

                  <option value="text/plain">
                    Text File
                  </option>

                  <option value="text/html">
                    HTML
                  </option>

                  <option value="application/octet-stream">
                    Other
                  </option>

                </select>

              </div>

            </div>

            {/* STATUS */}

            <div>

              <label
                htmlFor="status"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
              >

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

              </select>

              <p className="mt-1.5 text-xs text-slate-400">
                Inactive materials can remain in the
                system for later use.
              </p>

            </div>

          </div>

          {/* ===================================================
             ACTIONS
          =================================================== */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-6">

            <Link
              href={materialsUrl}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >

              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
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
  );
}

