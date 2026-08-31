
'use client';

import {
  FormEvent,
  useState,
  ChangeEvent,
} from 'react';
import {
  useParams,
  useRouter,
} from 'next/navigation';
import Link from 'next/link';

import {
  ArrowLeft,
  BookOpen,
  Video,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2,
  Link2,
  Upload,
  X,
} from 'lucide-react';

export default function CreateLessonVideoPage() {
  const router = useRouter();
  const params = useParams();

  const lessonId = params?.id;

  const numericLessonId = Number(lessonId);

  const [title, setTitle] = useState('');
  const [description, setDescription] =
    useState('');

  const [sourceType, setSourceType] =
    useState<'url' | 'upload'>('url');

  const [videoUrl, setVideoUrl] =
    useState('');

  const [thumbnailUrl, setThumbnailUrl] =
    useState('');

  const [duration, setDuration] =
    useState('');

  const [orderNumber, setOrderNumber] =
    useState('1');

  const [status, setStatus] =
    useState('active');

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [videoFileName, setVideoFileName] =
    useState('');

  const [videoFileUrl, setVideoFileUrl] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  /* =========================================================
     VALIDATE LESSON
  ========================================================= */

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
            className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 hover:bg-brand-green/5 hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lessons
          </Link>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <h1 className="text-lg font-bold text-red-700">
                  Invalid Lesson
                </h1>

                <p className="mt-1 text-sm text-red-600">
                  A valid lesson ID is required.
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

    const maxFileSize =
      100 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setSelectedFile(null);
      setVideoFileName('');

      setError(
        'The selected video is too large. Maximum file size is 100 MB.'
      );

      event.target.value = '';

      return;
    }

    const allowedExtensions = [
      '.mp4',
      '.webm',
      '.mov',
      '.avi',
      '.mkv',
      '.m4v',
    ];

    const lowerName =
      file.name.toLowerCase();

    const validExtension =
      allowedExtensions.some(
        (extension) =>
          lowerName.endsWith(extension)
      );

    const validMime =
      file.type.startsWith('video/');

    if (
      !validExtension &&
      !validMime
    ) {
      setSelectedFile(null);
      setVideoFileName('');

      setError(
        'Unsupported video type. Please upload MP4, WebM, MOV, AVI, MKV or M4V.'
      );

      event.target.value = '';

      return;
    }

    setSelectedFile(file);
    setVideoFileName(file.name);
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
        'Video title is required.'
      );
      return;
    }

    if (
      sourceType === 'url' &&
      !videoUrl.trim()
    ) {
      setError(
        'Please provide a video URL.'
      );
      return;
    }

    if (
      sourceType === 'upload' &&
      !selectedFile
    ) {
      setError(
        'Please select a video to upload.'
      );
      return;
    }

    const parsedDuration =
      duration.trim()
        ? Number(duration)
        : null;

    if (
      parsedDuration !== null &&
      (!Number.isFinite(parsedDuration) ||
        parsedDuration < 0)
    ) {
      setError(
        'Duration must be a valid number of seconds.'
      );
      return;
    }

    const parsedOrder =
      Number(orderNumber);

    if (
      !Number.isInteger(parsedOrder) ||
      parsedOrder <= 0
    ) {
      setError(
        'Order number must be a positive whole number.'
      );
      return;
    }

    try {
      setSaving(true);

      let finalVideoUrl =
        videoUrl.trim();

      let finalVideoFileName =
        videoFileName.trim();

      let finalVideoFileUrl =
        videoFileUrl.trim();

      /* =====================================================
         UPLOAD VIDEO
      ===================================================== */

      if (
        sourceType === 'upload' &&
        selectedFile
      ) {
        setUploading(true);

        const formData =
          new FormData();

        formData.append(
          'file',
          selectedFile
        );

        formData.append(
          'lesson_id',
          String(numericLessonId)
        );

        const uploadResponse =
          await fetch(
            '/api/lecturer/lesson-videos/upload',
            {
              method: 'POST',
              credentials: 'include',
              body: formData,
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
              'Unable to upload video.'
          );
        }

        finalVideoFileName =
          uploadData.video?.file_name ||
          selectedFile.name;

        finalVideoFileUrl =
          uploadData.video?.file_url ||
          '';

        /*
         * Keep video_url populated as well so
         * the player can use the uploaded file.
         */

        finalVideoUrl =
          finalVideoFileUrl;

        setVideoFileName(
          finalVideoFileName
        );

        setVideoFileUrl(
          finalVideoFileUrl
        );

        setVideoUrl(
          finalVideoUrl
        );

        setUploading(false);
      }

      /* =====================================================
         CREATE DATABASE RECORD
      ===================================================== */

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
                numericLessonId,

              title:
                title.trim(),

              description:
                description.trim() ||
                null,

              video_url:
                finalVideoUrl,

              thumbnail_url:
                thumbnailUrl.trim() ||
                null,

              duration_seconds:
                parsedDuration !== null
                  ? Math.trunc(
                      parsedDuration
                    )
                  : null,

              order_number:
                parsedOrder,

              status,

              video_file_name:
                finalVideoFileName ||
                null,

              video_file_url:
                finalVideoFileUrl ||
                null,

              source_type:
                sourceType,
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
            'Unable to create lesson video.'
        );
      }

      setSuccess(
        'Lesson video created successfully.'
      );

      setTimeout(() => {
        router.push(
          `/lecturer/dashboard/lessons/${numericLessonId}/videos`
        );
      }, 700);

    } catch (err) {
      console.error(
        'CREATE LESSON VIDEO ERROR:',
        err
      );

      setUploading(false);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create lesson video.'
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

        {/* ===================================================
           BACK
        =================================================== */}

        <Link
          href={`/lecturer/dashboard/lessons/${numericLessonId}/videos`}
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
            <BookOpen className="h-4 w-4" />
            Lesson Video
          </div>

          <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">
            Add Lesson Video
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Add a video resource to this lesson
            using a video URL or an uploaded video
            file.
          </p>

        </div>

        {/* ===================================================
           SUCCESS
        =================================================== */}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">

            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />

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

            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

            <p className="text-sm font-semibold text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* ===================================================
           FORM
        =================================================== */}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft"
        >

          {/* FORM HEADER */}

          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <Video className="h-5 w-5 text-brand-green" />
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

          {/* FORM BODY */}

          <div className="space-y-6 p-5 sm:p-6">

            {/* TITLE */}

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
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
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
                rows={4}
                placeholder="Briefly describe this video..."
                disabled={
                  saving ||
                  uploading
                }
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 disabled:bg-slate-50"
              />
            </div>

            {/* SOURCE TYPE */}

            <div>
              <label className="mb-3 block text-sm font-bold text-slate-700">
                Video Source
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="mb-4 flex rounded-xl bg-slate-100 p-1">

                <button
                  type="button"
                  onClick={() => {
                    setSourceType('url');
                    setSelectedFile(null);
                    setVideoFileName('');
                    setVideoFileUrl('');
                    setError('');
                  }}
                  disabled={
                    saving ||
                    uploading
                  }
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold ${
                    sourceType === 'url'
                      ? 'bg-white text-brand-green shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  <Link2 className="h-4 w-4" />
                  Video URL
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSourceType('upload');
                    setVideoUrl('');
                    setError('');
                  }}
                  disabled={
                    saving ||
                    uploading
                  }
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold ${
                    sourceType === 'upload'
                      ? 'bg-white text-brand-green shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Upload Video
                </button>

              </div>

              {sourceType === 'url' ? (
                <div>

                  <div className="relative">

                    <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(event) =>
                        setVideoUrl(
                          event.target.value
                        )
                      }
                      placeholder="https://example.com/video.mp4"
                      disabled={
                        saving ||
                        uploading
                      }
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                    />

                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Enter a public video URL.
                  </p>

                </div>
              ) : (
                <div>

                  <label
                    htmlFor="videoFile"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center hover:border-brand-green/40 hover:bg-brand-green/5"
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
                      MP4, WebM, MOV, AVI, MKV or M4V
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Maximum size: 100 MB
                    </p>

                    <input
                      id="videoFile"
                      type="file"
                      accept="video/*,.mp4,.webm,.mov,.avi,.mkv,.m4v"
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
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">

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
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-green-600 hover:bg-green-100"
                      >
                        <X className="h-4 w-4" />
                      </button>

                    </div>
                  )}

                </div>
              )}
            </div>

            {/* THUMBNAIL */}

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
                value={thumbnailUrl}
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
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Optional image URL displayed as the
                video thumbnail.
              </p>
            </div>

            {/* DURATION + ORDER */}

            <div className="grid gap-5 sm:grid-cols-2">

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
                  value={duration}
                  onChange={(event) =>
                    setDuration(
                      event.target.value
                    )
                  }
                  placeholder="e.g. 600"
                  disabled={
                    saving ||
                    uploading
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Duration in seconds.
                </p>
              </div>

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
                  value={orderNumber}
                  onChange={(event) =>
                    setOrderNumber(
                      event.target.value
                    )
                  }
                  disabled={
                    saving ||
                    uploading
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Determines the video's position
                  within the lesson.
                </p>
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
                disabled={
                  saving ||
                  uploading
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>

              <p className="mt-1.5 text-xs text-slate-400">
                Inactive videos remain available for
                later editing.
              </p>
            </div>

          </div>

          {/* ACTIONS */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-5 sm:flex-row sm:justify-end sm:px-6">

            <Link
              href={`/lecturer/dashboard/lessons/${numericLessonId}/videos`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                saving ||
                uploading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
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

