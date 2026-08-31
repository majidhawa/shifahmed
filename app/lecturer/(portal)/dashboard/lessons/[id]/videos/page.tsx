
'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  Film,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Video,
  XCircle,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

interface LessonVideo {
  id: number;
  lesson_id: number;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_number: number;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  video_file_name: string | null;
  video_file_url: string | null;
  source_type: string;
}

interface Lesson {
  id: number;
  title?: string;
  lesson_title?: string;
  topic_id?: number | null;
  unit_id?: number | null;
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  videos?: LessonVideo[];
  lesson?: Lesson;
}

/* =========================================================
   HELPERS
========================================================= */

function formatDuration(
  seconds: number | null
) {
  if (
    seconds === null ||
    seconds === undefined ||
    !Number.isFinite(seconds)
  ) {
    return 'Not specified';
  }

  const totalSeconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const remainingSeconds =
    totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(
      minutes
    ).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`;
  }

  return `${minutes}:${String(
    remainingSeconds
  ).padStart(2, '0')}`;
}

function getVideoUrl(
  video: LessonVideo
) {
  if (
    video.source_type === 'upload' &&
    video.video_file_url
  ) {
    return `/api/lecturer/lesson-videos/${video.id}/view`;
  }

  return video.video_url || '';
}

function getSourceLabel(
  sourceType: string
) {
  return sourceType === 'upload'
    ? 'Uploaded Video'
    : 'External URL';
}

/* =========================================================
   PAGE
========================================================= */

export default function ManageVideosPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const lessonId =
    params?.id;

  const topicId =
    searchParams.get('topic_id');

  const unitId =
    searchParams.get('unit_id');

  const numericLessonId =
    Number(lessonId);

  const [videos, setVideos] =
    useState<LessonVideo[]>([]);

  const [lesson, setLesson] =
    useState<Lesson | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [playingId, setPlayingId] =
    useState<number | null>(null);

  /* =========================================================
     BACK URL
  ========================================================= */

  const materialsUrl =
    `/lecturer/dashboard/lessons/${numericLessonId}/materials${
      topicId
        ? `?topic_id=${topicId}&unit_id=${unitId || ''}`
        : ''
    }`;

  const createUrl =
    `/lecturer/dashboard/lessons/${numericLessonId}/videos/create${
      topicId
        ? `?topic_id=${topicId}&unit_id=${unitId || ''}`
        : ''
    }`;

  /* =========================================================
     LOAD VIDEOS
  ========================================================= */

  const loadVideos =
    useCallback(async () => {
      if (
        !Number.isInteger(
          numericLessonId
        ) ||
        numericLessonId <= 0
      ) {
        setError(
          'Invalid lesson ID.'
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError('');

        const response =
          await fetch(
            `/api/lecturer/lesson-videos?lesson_id=${numericLessonId}`,
            {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            }
          );

        const data =
          (await response.json()) as ApiResponse;

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Unable to load lesson videos.'
          );
        }

        setVideos(
          Array.isArray(data.videos)
            ? data.videos
            : []
        );

        if (data.lesson) {
          setLesson(data.lesson);
        }
      } catch (err) {
        console.error(
          'LOAD LESSON VIDEOS ERROR:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load lesson videos.'
        );
      } finally {
        setLoading(false);
      }
    }, [numericLessonId]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  /* =========================================================
     DELETE VIDEO
  ========================================================= */

  const handleDelete = async (
    video: LessonVideo
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${video.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(video.id);
      setError('');

      const response =
        await fetch(
          `/api/lecturer/lesson-videos/${video.id}`,
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
            'Unable to delete video.'
        );
      }

      setVideos(
        (current) =>
          current.filter(
            (item) =>
              item.id !== video.id
          )
      );
    } catch (err) {
      console.error(
        'DELETE LESSON VIDEO ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete video.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================================
     VALIDATE LESSON ID
  ========================================================= */

  if (
    !lessonId ||
    !Number.isInteger(
      numericLessonId
    ) ||
    numericLessonId <= 0
  ) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

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
                <XCircle className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <h1 className="text-lg font-bold text-red-700">
                  Invalid Lesson
                </h1>

                <p className="mt-1 text-sm text-red-600">
                  A valid lesson ID is required to
                  manage lesson videos.
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
      <div className="mx-auto max-w-6xl">

        {/* ===================================================
           BACK
        =================================================== */}

        <Link
          href={materialsUrl}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-500 transition hover:bg-brand-green/5 hover:text-brand-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Materials
        </Link>

        {/* ===================================================
           HEADER
        =================================================== */}

        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-brand-green/5 px-3 py-2 text-xs font-bold text-brand-green">
              <Video className="h-4 w-4" />
              Lesson Videos
            </div>

            <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">
              Manage Videos
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Add, manage and organize video
              lessons for this lesson.
            </p>

            {lesson && (
              <p className="mt-2 text-sm font-semibold text-brand-green">
                {lesson.title ||
                  lesson.lesson_title ||
                  `Lesson #${numericLessonId}`}
              </p>
            )}

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <button
              type="button"
              onClick={loadVideos}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm transition hover:border-brand-green/30 hover:bg-brand-green/5 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading
                    ? 'animate-spin'
                    : ''
                }`}
              />
              Refresh
            </button>

            <Link
              href={createUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
            >
              <Plus className="h-4 w-4" />
              Add Video
            </Link>

          </div>

        </div>

        {/* ===================================================
           ERROR
        =================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div className="flex-1">
              <p className="text-sm font-bold text-red-700">
                Unable to load videos
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              className="rounded-lg p-1 text-red-500 transition hover:bg-red-100"
            >
              <XCircle className="h-4 w-4" />
            </button>

          </div>
        )}

        {/* ===================================================
           STATISTICS
        =================================================== */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Total Videos
                </p>

                <p className="mt-2 text-2xl font-bold text-brand-dark">
                  {videos.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <Video className="h-5 w-5 text-brand-green" />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Active
                </p>

                <p className="mt-2 text-2xl font-bold text-brand-dark">
                  {
                    videos.filter(
                      (video) =>
                        video.status ===
                        'active'
                    ).length
                  }
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Uploaded
                </p>

                <p className="mt-2 text-2xl font-bold text-brand-dark">
                  {
                    videos.filter(
                      (video) =>
                        video.source_type ===
                        'upload'
                    ).length
                  }
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
                <Film className="h-5 w-5 text-blue-600" />
              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  External
                </p>

                <p className="mt-2 text-2xl font-bold text-brand-dark">
                  {
                    videos.filter(
                      (video) =>
                        video.source_type !==
                        'upload'
                    ).length
                  }
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50">
                <ExternalLink className="h-5 w-5 text-purple-600" />
              </div>

            </div>
          </div>

        </div>

        {/* ===================================================
           LOADING
        =================================================== */}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-soft">

            <div className="flex flex-col items-center justify-center text-center">

              <Loader2 className="h-8 w-8 animate-spin text-brand-green" />

              <p className="mt-4 text-sm font-bold text-slate-700">
                Loading videos...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait while we retrieve the
                lesson videos.
              </p>

            </div>

          </div>
        ) : videos.length === 0 ? (

          /* =================================================
             EMPTY STATE
          ================================================= */

          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-soft sm:p-14">

            <div className="mx-auto max-w-md text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-green/10">
                <Video className="h-8 w-8 text-brand-green" />
              </div>

              <h2 className="mt-5 text-xl font-bold text-brand-dark">
                No Videos Yet
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                This lesson does not have any
                videos yet. Add a video to provide
                students with visual learning
                resources.
              </p>

              <Link
                href={createUrl}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
              >
                <Plus className="h-4 w-4" />
                Add First Video
              </Link>

            </div>

          </div>

        ) : (

          /* =================================================
             VIDEO LIST
          ================================================= */

          <div className="space-y-4">

            {videos.map(
              (video, index) => {

                const videoUrl =
                  getVideoUrl(video);

                const isPlaying =
                  playingId ===
                  video.id;

                return (
                  <div
                    key={video.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft"
                  >

                    <div className="flex flex-col lg:flex-row">

                      {/* =====================================
                         THUMBNAIL / VIDEO
                      ===================================== */}

                      <div className="relative aspect-video w-full shrink-0 bg-slate-900 lg:aspect-auto lg:h-auto lg:w-72">

                        {video.thumbnail_url ? (
                          <img
                            src={
                              video.thumbnail_url
                            }
                            alt={
                              video.title
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full min-h-44 items-center justify-center bg-slate-900">
                            <Video className="h-12 w-12 text-white/30" />
                          </div>
                        )}

                        <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-white">
                          #{video.order_number ||
                            index + 1}
                        </div>

                        {video.duration_seconds !==
                          null && (
                          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs font-bold text-white">
                            <Clock className="h-3 w-3" />
                            {formatDuration(
                              video.duration_seconds
                            )}
                          </div>
                        )}

                      </div>

                      {/* =====================================
                         CONTENT
                      ===================================== */}

                      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                          <div className="min-w-0 flex-1">

                            <div className="mb-2 flex flex-wrap items-center gap-2">

                              <span className="rounded-lg bg-brand-green/5 px-2.5 py-1 text-[11px] font-bold text-brand-green">
                                Video #{video.order_number ||
                                  index + 1}
                              </span>

                              <span
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                                  video.status ===
                                  'active'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {video.status ===
                                'active' ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}

                                {video.status ===
                                'active'
                                  ? 'Active'
                                  : 'Inactive'}
                              </span>

                              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                                {getSourceLabel(
                                  video.source_type
                                )}
                              </span>

                            </div>

                            <h2 className="text-lg font-bold text-brand-dark">
                              {video.title}
                            </h2>

                            {video.description && (
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                                {
                                  video.description
                                }
                              </p>
                            )}

                          </div>

                        </div>

                        {/* =================================
                           FILE / URL
                        ================================= */}

                        <div className="mt-5 rounded-2xl bg-slate-50 p-4">

                          <div className="flex items-start gap-3">

                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                              {video.source_type ===
                              'upload' ? (
                                <Film className="h-4 w-4 text-brand-green" />
                              ) : (
                                <ExternalLink className="h-4 w-4 text-brand-green" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">

                              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                {video.source_type ===
                                'upload'
                                  ? 'Video File'
                                  : 'Video URL'}
                              </p>

                              <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                                {video.source_type ===
                                'upload'
                                  ? video.video_file_name ||
                                    'Uploaded video'
                                  : video.video_url ||
                                    'No URL provided'}
                              </p>

                            </div>

                          </div>

                        </div>

                        {/* =================================
                           ACTIONS
                        ================================= */}

                        <div className="mt-5 flex flex-wrap items-center gap-2">

                          {videoUrl &&
                            video.status ===
                              'active' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPlayingId(
                                    isPlaying
                                      ? null
                                      : video.id
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-green px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-dark"
                              >
                                {isPlaying ? (
                                  <>
                                    <XCircle className="h-3.5 w-3.5" />
                                    Close
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3.5 w-3.5" />
                                    Play
                                  </>
                                )}
                              </button>
                            )}

                          {videoUrl &&
                            video.status ===
                              'active' && (
                              <a
                                href={
                                  videoUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-brand-green/30 hover:bg-brand-green/5 hover:text-brand-green"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open
                              </a>
                            )}

                          <Link
                            href={`/lecturer/dashboard/lessons/${numericLessonId}/videos/${video.id}/edit${
                              topicId
                                ? `?topic_id=${topicId}&unit_id=${unitId || ''}`
                                : ''
                            }`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-brand-green/30 hover:bg-brand-green/5 hover:text-brand-green"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                video
                              )
                            }
                            disabled={
                              deletingId ===
                              video.id
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId ===
                            video.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Delete
                          </button>

                        </div>

                        {/* =================================
                           INLINE PLAYER
                        ================================= */}

                        {isPlaying &&
                          videoUrl && (
                            <div className="mt-5 overflow-hidden rounded-2xl bg-black">

                              <video
                                src={
                                  videoUrl
                                }
                                controls
                                playsInline
                                className="max-h-[520px] w-full"
                              />

                            </div>
                          )}

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>
    </div>
  );
}

