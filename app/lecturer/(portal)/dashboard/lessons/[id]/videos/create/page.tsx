'use client';

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import Link from 'next/link';

import {
  ArrowLeft,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Film,
  Link2,
  Loader2,
  Save,
  Upload,
  X,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

interface Lesson {
  id: number;
  title: string;
  description?: string | null;
}

/* =========================================================
   PAGE
========================================================= */

export default function CreateLessonVideoPage() {
  const params = useParams();
  const router = useRouter();

  /* =======================================================
     LESSON ID
  ======================================================= */

  const lessonId = Number(
    params?.id
  );

  const validLessonId =
    Number.isInteger(lessonId) &&
    lessonId > 0;

  /* =======================================================
     LESSON
  ======================================================= */

  const [lesson, setLesson] =
    useState<Lesson | null>(null);

  const [loadingLesson, setLoadingLesson] =
    useState(true);

  /* =======================================================
     FORM
  ======================================================= */

  const [title, setTitle] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [videoUrl, setVideoUrl] =
    useState('');

  const [thumbnailUrl, setThumbnailUrl] =
    useState('');

  const [durationSeconds, setDurationSeconds] =
    useState('');

  const [orderNumber, setOrderNumber] =
    useState('1');

  const [status, setStatus] =
    useState('active');

  const [sourceType, setSourceType] =
    useState<'url' | 'upload'>(
      'url'
    );

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [videoFileName, setVideoFileName] =
    useState('');

  const [videoFileUrl, setVideoFileUrl] =
    useState('');

  /* =======================================================
     STATE
  ======================================================= */

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  /* =========================================================
     LOAD LESSON
  ========================================================= */

  useEffect(() => {
    if (!validLessonId) {
      setLoadingLesson(false);
      return;
    }

    const loadLesson =
      async () => {
        try {
          setLoadingLesson(true);

          const response =
            await fetch(
              `/api/lecturer/lessons/${lessonId}`,
              {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
              }
            );

          if (!response.ok) {
            throw new Error(
              'Unable to load lesson.'
            );
          }

          const data =
            await response.json();

          if (
            !data?.success ||
            !data?.lesson
          ) {
            throw new Error(
              data?.message ||
                'Lesson not found.'
            );
          }

          setLesson(
            data.lesson
          );
        } catch (error) {
          console.error(
            'LOAD LESSON ERROR:',
            error
          );

          setError(
            error instanceof Error
              ? error.message
              : 'Unable to load lesson.'
          );
        } finally {
          setLoadingLesson(false);
        }
      };

    loadLesson();
  }, [
    lessonId,
    validLessonId,
  ]);

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

    /* =====================================================
       MAXIMUM VIDEO SIZE
    ===================================================== */

    const maxFileSize =
      100 * 1024 * 1024;

    if (
      file.size >
      maxFileSize
    ) {
      setSelectedFile(null);
      setVideoFileName('');

      setError(
        'The selected video is too large. Maximum video size is 100 MB.'
      );

      event.target.value = '';

      return;
    }

    /* =====================================================
       ALLOWED VIDEO TYPES
    ===================================================== */

    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
    ];

    const allowedExtensions = [
      '.mp4',
      '.webm',
      '.ogg',
      '.mov',
      '.avi',
      '.mkv',
    ];

    const fileName =
      file.name.toLowerCase();

    const validType =
      allowedTypes.includes(
        file.type
      );

    const validExtension =
      allowedExtensions.some(
        (extension) =>
          fileName.endsWith(
            extension
          )
      );

    if (
      !validType &&
      !validExtension
    ) {
      setSelectedFile(null);
      setVideoFileName('');

      setError(
        'Unsupported video type. Please upload MP4, WebM, OGG, MOV, AVI or MKV.'
      );

      event.target.value = '';

      return;
    }

    setSelectedFile(file);

    setVideoFileName(
      file.name
    );
  };

  /* =========================================================
     REMOVE VIDEO
  ========================================================= */

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setVideoFileName('');
    setVideoFileUrl('');

    const input =
      document.getElementById(
        'videoFile'
      ) as HTMLInputElement | null;

    if (input) {
      input.value = '';
    }
  };

  /* =========================================================
     FORMAT FILE SIZE
  ========================================================= */

  const formatFileSize = (
    size: number
  ) => {
    if (size < 1024 * 1024) {
      return `${(
        size / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      size /
      1024 /
      1024
    ).toFixed(2)} MB`;
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

    /* =====================================================
       VALIDATE LESSON
    ===================================================== */

    if (!validLessonId) {
      setError(
        'A valid lesson ID is required.'
      );

      return;
    }

    /* =====================================================
       VALIDATE TITLE
    ===================================================== */

    if (!title.trim()) {
      setError(
        'Video title is required.'
      );

      return;
    }

    /* =====================================================
       VALIDATE SOURCE
    ===================================================== */

    if (
      sourceType === 'url' &&
      !videoUrl.trim()
    ) {
      setError(
        'Please provide the video URL.'
      );

      return;
    }

    if (
      sourceType === 'upload' &&
      !selectedFile &&
      !videoFileUrl
    ) {
      setError(
        'Please select a video to upload.'
      );

      return;
    }

    /* =====================================================
       VALIDATE URL
    ===================================================== */

    if (
      sourceType === 'url'
    ) {
      try {
        new URL(
          videoUrl.trim()
        );
      } catch {
        setError(
          'Please enter a valid video URL.'
        );

        return;
      }
    }

    /* =====================================================
       VALIDATE ORDER
    ===================================================== */

    const parsedOrder =
      Number(orderNumber);

    if (
      !Number.isInteger(
        parsedOrder
      ) ||
      parsedOrder <= 0
    ) {
      setError(
        'Order number must be a positive number.'
      );

      return;
    }

    /* =====================================================
       VALIDATE DURATION
    ===================================================== */

    let finalDuration:
      | number
      | null = null;

    if (
      durationSeconds.trim()
    ) {
      const parsedDuration =
        Number(
          durationSeconds
        );

      if (
        !Number.isFinite(
          parsedDuration
        ) ||
        parsedDuration < 0
      ) {
        setError(
          'Duration must be a valid number of seconds.'
        );

        return;
      }

      finalDuration =
        Math.trunc(
          parsedDuration
        );
    }

    try {
      setSaving(true);

      let finalVideoUrl =
        videoUrl.trim();

      let finalVideoFileUrl =
        videoFileUrl.trim();

      let finalVideoFileName =
        videoFileName.trim();

      /* ===================================================
         UPLOAD VIDEO
      =================================================== */

      if (
        sourceType ===
          'upload' &&
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
          String(lessonId)
        );

        const uploadResponse =
          await fetch(
            '/api/lecturer/lesson-videos/upload',
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
          !uploadData?.success
        ) {
          throw new Error(
            uploadData?.message ||
              'Unable to upload video.'
          );
        }

        finalVideoFileUrl =
          uploadData.file
            ?.video_file_url ||
          uploadData.file
            ?.file_url ||
          '';

        finalVideoFileName =
          uploadData.file
            ?.video_file_name ||
          uploadData.file
            ?.file_name ||
          selectedFile.name;

        if (!finalVideoFileUrl) {
          throw new Error(
            'Video uploaded, but no video URL was returned.'
          );
        }

        setVideoFileUrl(
          finalVideoFileUrl
        );

        setVideoFileName(
          finalVideoFileName
        );

        setUploading(false);
      }

      /* ===================================================
         CREATE DATABASE RECORD
      =================================================== */

      const response =
        await fetch(
          '/api/lecturer/lesson-videos',
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              lesson_id:
                lessonId,

              title:
                title.trim(),

              description:
                description.trim() ||
                null,

              video_url:
                sourceType ===
                'url'
                  ? finalVideoUrl
                  : '',

              thumbnail_url:
                thumbnailUrl.trim() ||
                null,

              duration_seconds:
                finalDuration,

              order_number:
                parsedOrder,

              status,

              video_file_name:
                sourceType ===
                'upload'
                  ? finalVideoFileName
                  : null,

              video_file_url:
                sourceType ===
                'upload'
                  ? finalVideoFileUrl
                  : null,

              source_type:
                sourceType,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            'Unable to create lesson video.'
        );
      }

      setSuccess(
        'Lesson video created successfully.'
      );

      /* ===================================================
         REDIRECT
      =================================================== */

      setTimeout(() => {
        router.push(
          `/lecturer/dashboard/lessons/${lessonId}/videos`
        );

        router.refresh();
      }, 700);

    } catch (error) {
      console.error(
        'CREATE LESSON VIDEO ERROR:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to create lesson video.'
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  /* =========================================================
     INVALID LESSON
  ========================================================= */

  if (!validLessonId) {
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
                  A valid lesson ID is required
                  to create a video.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-4xl">

        {/* ===================================================
           BACK
        =================================================== */}

        <Link
          href={`/lecturer/dashboard/lessons/${lessonId}/videos`}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-green/5 hover:text-brand-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Videos
        </Link>

        {/* ===================================================
           HEADER
        =================================================== */}

        <div className="mb-6">

          <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green">

            <Film className="h-4 w-4" />

            Lesson Video

          </div>

          <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">
            Add Lesson Video
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Add a video resource to this lesson
            using an external URL or an uploaded
            video file.
          </p>

          {lesson && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">

              <BookOpen className="h-4 w-4 text-brand-green" />

              {lesson.title}

            </div>
          )}

        </div>

        {/* ===================================================
           LOADING LESSON
        =================================================== */}

        {loadingLesson && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">

            <Loader2 className="h-5 w-5 animate-spin text-brand-green" />

            <p className="text-sm font-semibold text-slate-500">
              Loading lesson...
            </p>

          </div>
        )}

        {/* ===================================================
           SUCCESS
        =================================================== */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">

            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

            <p className="text-sm font-semibold text-green-700">
              {success}
            </p>

          </div>
        )}

        {/* ===================================================
           ERROR
        =================================================== */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <p className="text-sm font-semibold text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* ===================================================
           FORM
        =================================================== */}

        <form
          onSubmit={
            handleSubmit
          }
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft"
        >

          {/* =================================================
             FORM HEADER
          ================================================= */}

          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">

                <Film className="h-5 w-5 text-brand-green" />

              </div>

              <div>

                <h2 className="font-bold text-brand-dark">
                  Video Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Enter the information for this
                  lesson video.
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
             BODY
          ================================================= */}

          <div className="space-y-6 p-5 sm:p-6">

            {/* =================================================
               TITLE
            ================================================= */}

            <div>

              <label
                htmlFor="title"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Video Title
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
                placeholder="e.g. Introduction to Emergency Medical Technology"
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
                value={
                  description
                }
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Briefly describe what students will learn from this video..."
                rows={4}
                disabled={
                  saving ||
                  uploading
                }
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
              />

            </div>

            {/* =================================================
               SOURCE
            ================================================= */}

            <div>

              <label className="mb-3 block text-sm font-bold text-slate-700">

                Video Source

                <span className="ml-1 text-red-500">
                  *
                </span>

              </label>

              {/* SOURCE SWITCH */}

              <div className="mb-4 flex rounded-xl bg-slate-100 p-1">

                <button
                  type="button"
                  onClick={() => {
                    setSourceType(
                      'url'
                    );

                    setSelectedFile(
                      null
                    );

                    setVideoFileName(
                      ''
                    );

                    setVideoFileUrl(
                      ''
                    );

                    setError('');
                  }}
                  disabled={
                    saving ||
                    uploading
                  }
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                    sourceType ===
                    'url'
                      ? 'bg-white text-brand-green shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >

                  <Link2 className="h-4 w-4" />

                  Video URL

                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSourceType(
                      'upload'
                    );

                    setVideoUrl(
                      ''
                    );

                    setError('');
                  }}
                  disabled={
                    saving ||
                    uploading
                  }
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                    sourceType ===
                    'upload'
                      ? 'bg-white text-brand-green shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >

                  <Upload className="h-4 w-4" />

                  Upload Video

                </button>

              </div>

              {/* =================================================
                 URL
              ================================================= */}

              {sourceType ===
              'url' ? (
                <div>

                  <div className="relative">

                    <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="url"
                      value={
                        videoUrl
                      }
                      onChange={(
                        event
                      ) =>
                        setVideoUrl(
                          event.target.value
                        )
                      }
                      placeholder="https://youtube.com/watch?v=..."
                      disabled={
                        saving ||
                        uploading
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
                    />

                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Enter a public video URL,
                    such as YouTube, Vimeo or
                    another supported video host.
                  </p>

                </div>
              ) : (

                /* =================================================
                   UPLOAD
                ================================================= */

                <div>

                  <label
                    htmlFor="videoFile"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:border-brand-green/40 hover:bg-brand-green/5"
                  >

                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10">

                      <Upload className="h-6 w-6 text-brand-green" />

                    </div>

                    <p className="text-sm font-bold text-slate-700">

                      {selectedFile
                        ? selectedFile.name
                        : 'Click to choose a video'}

                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      MP4, WebM, OGG, MOV,
                      AVI or MKV
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Maximum size: 100 MB
                    </p>

                    <input
                      id="videoFile"
                      type="file"
                      accept=".mp4,.webm,.ogg,.mov,.avi,.mkv,video/*"
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

                  {selectedFile && (
                    <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">

                      <div className="min-w-0">

                        <p className="truncate text-sm font-bold text-green-700">
                          {
                            selectedFile.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-green-600">
                          {formatFileSize(
                            selectedFile.size
                          )}
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
                        aria-label="Remove selected video"
                      >

                        <X className="h-4 w-4" />

                      </button>

                    </div>
                  )}

                </div>
              )}

            </div>

            {/* =================================================
               THUMBNAIL
            ================================================= */}

            <div>

              <label
                htmlFor="thumbnailUrl"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Thumbnail URL
              </label>

              <input
                id="thumbnailUrl"
                type="url"
                value={
                  thumbnailUrl
                }
                onChange={(event) =>
                  setThumbnailUrl(
                    event.target.value
                  )
                }
                placeholder="https://example.com/thumbnail.jpg"
                disabled={
                  saving ||
                  uploading
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Optional image displayed as the
                video thumbnail.
              </p>

            </div>

            {/* =================================================
               VIDEO SETTINGS
            ================================================= */}

            <div className="grid gap-5 sm:grid-cols-2">

              {/* DURATION */}

              <div>

                <label
                  htmlFor="duration"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Duration
                </label>

                <input
                  id="duration"
                  type="number"
                  min="0"
                  value={
                    durationSeconds
                  }
                  onChange={(event) =>
                    setDurationSeconds(
                      event.target.value
                    )
                  }
                  placeholder="e.g. 600"
                  disabled={
                    saving ||
                    uploading
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Duration in seconds.
                </p>

              </div>

              {/* ORDER */}

              <div>

                <label
                  htmlFor="orderNumber"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Order Number
                </label>

                <input
                  id="orderNumber"
                  type="number"
                  min="1"
                  value={
                    orderNumber
                  }
                  onChange={(event) =>
                    setOrderNumber(
                      event.target.value
                    )
                  }
                  disabled={
                    saving ||
                    uploading
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Determines the position of
                  the video in the lesson.
                </p>

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
                Inactive videos remain available
                for later editing.
              </p>

            </div>

          </div>

          {/* =================================================
             ACTIONS
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-6">

            <Link
              href={`/lecturer/dashboard/lessons/${lessonId}/videos`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                saving ||
                uploading ||
                loadingLesson
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >

              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading Video...
                </>
              ) : saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Video...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Video
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}