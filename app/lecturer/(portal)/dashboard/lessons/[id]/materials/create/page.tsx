
'use client';

import {
  FormEvent,
  useState,
  ChangeEvent,
} from 'react';
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
  Upload,
  X,
} from 'lucide-react';

export default function CreateLessonMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const lessonId = params?.id;

  const topicId = searchParams.get('topic_id');
  const unitId = searchParams.get('unit_id');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [mimeType, setMimeType] =
    useState('application/pdf');

  const [status, setStatus] =
    useState('active');

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [inputMode, setInputMode] =
    useState<'upload' | 'url'>('upload');

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  /* =========================================================
     VALIDATE LESSON ID
  ========================================================= */

  const numericLessonId = Number(lessonId);

  if (
    !lessonId ||
    !Number.isInteger(numericLessonId) ||
    numericLessonId <= 0
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
                  Invalid Lesson
                </h1>

                <p className="mt-1 text-sm text-red-600">
                  A valid lesson ID is required to create
                  lesson material.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  }

  /* =========================================================
     FILE CHANGE
  ========================================================= */

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError('');
    setSuccess('');

    /*
     * Maximum file size: 20 MB
     */

    const maxFileSize =
      20 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setSelectedFile(null);
      setFileName('');
      setFileSize('');
      setMimeType('application/pdf');

      setError(
        'The selected document is too large. Maximum file size is 20 MB.'
      );

      event.target.value = '';

      return;
    }

    const allowedExtensions = [
      '.pdf',
      '.doc',
      '.docx',
      '.ppt',
      '.pptx',
      '.txt',
      '.html',
      '.rtf',
      '.odt',
    ];

    const lowerFileName =
      file.name.toLowerCase();

    const validExtension =
      allowedExtensions.some(
        (extension) =>
          lowerFileName.endsWith(extension)
      );

    if (!validExtension) {
      setSelectedFile(null);

      setError(
        'Unsupported document type. Please upload a PDF, Word, PowerPoint, TXT, HTML, RTF or ODT document.'
      );

      event.target.value = '';

      return;
    }

    setSelectedFile(file);

    setFileName(file.name);

    setFileSize(
      String(file.size)
    );

    setMimeType(
      file.type ||
        'application/octet-stream'
    );
  };

  /* =========================================================
     REMOVE SELECTED FILE
  ========================================================= */

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFileName('');
    setFileSize('');
    setMimeType('application/pdf');

    const input =
      document.getElementById(
        'documentFile'
      ) as HTMLInputElement | null;

    if (input) {
      input.value = '';
    }
  };

  /* =========================================================
     SUBMIT
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

    if (
      inputMode === 'upload' &&
      !selectedFile
    ) {
      setError(
        'Please select a document to upload.'
      );

      return;
    }

    if (
      inputMode === 'url' &&
      !fileUrl.trim()
    ) {
      setError(
        'Please provide a document URL.'
      );

      return;
    }

    try {
      setSaving(true);

      let finalFileUrl =
        fileUrl.trim();

      /*
       * =======================================================
       * UPLOAD DOCUMENT
       * =======================================================
       */

      if (
        inputMode === 'upload' &&
        selectedFile
      ) {
        setUploading(true);

        const uploadFormData =
          new FormData();

        uploadFormData.append(
          'file',
          selectedFile
        );

        uploadFormData.append(
          'lesson_id',
          String(numericLessonId)
        );

        const uploadResponse =
          await fetch(
            '/api/lecturer/lesson-documents/upload',
            {
              method: 'POST',
              credentials: 'include',
              body: uploadFormData,
            }
          );

        const uploadData =
          await uploadResponse.json();

        if (
          !uploadResponse.ok ||
          !uploadData.success
        ) {
          throw new Error(
            uploadData.message ||
              'Unable to upload document.'
          );
        }

        finalFileUrl =
          uploadData.file.file_url;

        setFileName(
          uploadData.file.file_name
        );

        setFileSize(
          String(
            uploadData.file.file_size
          )
        );

        setMimeType(
          uploadData.file.mime_type ||
            'application/octet-stream'
        );

        setUploading(false);
      }

      /*
       * =======================================================
       * CREATE DATABASE RECORD
       * =======================================================
       */

      const response =
        await fetch(
          '/api/lecturer/lesson-documents',
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json',
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
                finalFileUrl,

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
            'Unable to create lesson material.'
        );
      }

      setSuccess(
        'Lesson material created successfully.'
      );

      setTimeout(() => {
        router.push(
          `/lecturer/dashboard/lessons/${numericLessonId}/materials${
            topicId
              ? `?topic_id=${topicId}&unit_id=${unitId || ''}`
              : ''
          }`
        );
      }, 700);

    } catch (err) {
      console.error(
        'CREATE LESSON MATERIAL ERROR:',
        err
      );

      setUploading(false);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create lesson material.'
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* =====================================================
           BACK
        ===================================================== */}

        <Link
          href={`/lecturer/dashboard/lessons/${numericLessonId}/materials${
            topicId
              ? `?topic_id=${topicId}&unit_id=${unitId || ''}`
              : ''
          }`}
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
            Add Lesson Material
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Add a PDF, document, notes file, or
            other learning resource to this lesson.
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

        {error && (
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

              <div>
                <h2 className="font-bold text-brand-dark">
                  Material Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Enter the information for this
                  learning resource.
                </p>
              </div>

            </div>

          </div>

          {/* ===================================================
             FORM BODY
          =================================================== */}

          <div className="space-y-6 p-5 sm:p-6">

            {/* =================================================
               TITLE
            ================================================= */}

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
                disabled={
                  saving ||
                  uploading
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
              />

            </div>

            {/* =================================================
               DESCRIPTION
            ================================================= */}

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
                disabled={
                  saving ||
                  uploading
                }
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
              />

            </div>

            {/* =================================================
               DOCUMENT SOURCE
            ================================================= */}

            <div>

              <label className="mb-3 block text-sm font-bold text-slate-700">
                Document Source
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              {/* SOURCE SWITCH */}

              <div className="mb-4 flex rounded-xl bg-slate-100 p-1">

                <button
                  type="button"
                  onClick={() => {
                    setInputMode(
                      'upload'
                    );

                    setFileUrl('');

                    setError('');
                  }}
                  disabled={
                    saving ||
                    uploading
                  }
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                    inputMode === 'upload'
                      ? 'bg-white text-brand-green shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Upload Document
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputMode(
                      'url'
                    );

                    setSelectedFile(
                      null
                    );

                    setError('');
                  }}
                  disabled={
                    saving ||
                    uploading
                  }
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                    inputMode === 'url'
                      ? 'bg-white text-brand-green shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Link2 className="h-4 w-4" />
                  Use URL
                </button>

              </div>

              {/* =================================================
                 UPLOAD DOCUMENT
              ================================================= */}

              {inputMode ===
              'upload' ? (
                <div>

                  <label
                    htmlFor="documentFile"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:border-brand-green/40 hover:bg-brand-green/5"
                  >

                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">
                      <Upload className="h-6 w-6 text-brand-green" />
                    </div>

                    <p className="text-sm font-bold text-slate-700">
                      {selectedFile
                        ? selectedFile.name
                        : 'Click to choose a document'}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      PDF, Word, PowerPoint,
                      TXT, HTML, RTF or ODT
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Maximum size: 20 MB
                    </p>

                    <input
                      id="documentFile"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.html,.rtf,.odt"
                      onChange={
                        handleFileChange
                      }
                      disabled={
                        saving ||
                        uploading
                      }
                      className="hidden"
                    />

                  </label>

                  {/* SELECTED FILE */}

                  {selectedFile && (
                    <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">

                      <div className="min-w-0">

                        <p className="truncate text-sm font-bold text-green-700">
                          {selectedFile.name}
                        </p>

                        <p className="mt-1 text-xs text-green-600">
                          {(
                            selectedFile.size /
                            1024 /
                            1024
                          ).toFixed(2)}{' '}
                          MB
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={
                          removeSelectedFile
                        }
                        disabled={
                          saving ||
                          uploading
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-green-600 transition hover:bg-green-100"
                        aria-label="Remove selected file"
                      >
                        <X className="h-4 w-4" />
                      </button>

                    </div>
                  )}

                </div>
              ) : (
                /* =================================================
                   EXTERNAL URL
                ================================================= */

                <div>

                  <div className="relative">

                    <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="fileUrl"
                      type="url"
                      value={fileUrl}
                      onChange={(
                        event
                      ) =>
                        setFileUrl(
                          event.target.value
                        )
                      }
                      placeholder="https://example.com/document.pdf"
                      disabled={
                        saving ||
                        uploading
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
                    />

                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Paste a public URL to a
                    document hosted elsewhere.
                  </p>

                </div>
              )}

            </div>

            {/* =================================================
               FILE NAME
            ================================================= */}

            <div>

              <label
                htmlFor="fileName"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                File Name
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
                disabled={
                  saving ||
                  uploading ||
                  inputMode ===
                    'upload'
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                {inputMode ===
                'upload'
                  ? 'Automatically taken from the uploaded document.'
                  : 'Enter the name of the document.'}
              </p>

            </div>

            {/* =================================================
               FILE DETAILS
            ================================================= */}

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
                  disabled={
                    saving ||
                    uploading ||
                    inputMode ===
                      'upload'
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  File size in bytes.
                  Automatically detected when
                  uploading.
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
                  disabled={
                    saving ||
                    uploading ||
                    inputMode ===
                      'upload'
                  }
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

                  <option value="application/rtf">
                    RTF Document
                  </option>

                  <option value="application/octet-stream">
                    Other
                  </option>
                </select>

              </div>

            </div>

            {/* =================================================
               STATUS
            ================================================= */}

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
                disabled={
                  saving ||
                  uploading
                }
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
                Inactive materials can remain
                available for later editing.
              </p>

            </div>

          </div>

          {/* ===================================================
             ACTIONS
          =================================================== */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-6">

            <Link
              href={`/lecturer/dashboard/lessons/${numericLessonId}/materials${
                topicId
                  ? `?topic_id=${topicId}&unit_id=${unitId || ''}`
                  : ''
              }`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                saving ||
                uploading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >

              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Material
                </>
              )}

            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

