
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  ArrowLeft,
  BookOpen,
  Plus,
  Loader2,
  FileText,
  ClipboardList,
  HelpCircle,
  Video as VideoIcon,
  X,
  ExternalLink,
  Trash2,
  Pencil,
  Calendar,
  Clock,
  CheckCircle2,
  Upload,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Lesson = {
  id: number;
  topic_id: number;
  title: string;
  description: string | null;
  order_number: number;
  status: string;
  created_at: string;
  updated_at: string;

  topic_name: string;

  unit_id: number;
  unit_name: string;
  unit_code: string | null;

  program_id: number;
  program_name: string;
  program_code: string | null;
};

type Objective = {
  id: number;
  lesson_id: number;
  objective: string;
  order_number: number;
  status: string;
};

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
  created_at: string;
  updated_at: string;
};

type LessonVideo = {
  id: number;
  lesson_id: number;
  title: string;
  description: string | null;
  video_type: 'upload' | 'external';
  video_url: string;
  thumbnail_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  duration?: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type Assignment = {
  id: number;
  lesson_id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  total_marks: number;
  status: 'draft' | 'active' | 'closed';
  created_at: string;
  updated_at: string;
};

type Quiz = {
  id: number;
  lesson_id: number;

  title: string;
  description: string | null;
  instructions: string | null;

  total_marks: number;

  time_limit_minutes: number | null;

  attempts_allowed: number;

  passing_score: number;

  status: 'draft' | 'active' | 'closed';

  shuffle_questions: boolean;
  shuffle_options: boolean;

  show_results: boolean;
  show_correct_answers: boolean;

  available_from: string | null;
  available_until: string | null;

  question_count?: number;

  created_at: string;
  updated_at: string;
};

type Question = {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type:
    | 'multiple_choice'
    | 'true_false'
    | 'short_answer';
  options: string[] | null;
  correct_answer: string | null;
  marks: number;
  question_order: number;
  explanation: string | null;
  created_at: string;
  updated_at: string;
};
/* =========================================================
   PAGE
========================================================= */

export default function LessonManagementPage() {
  const params = useParams();

  const id = params?.id as string | undefined;

  /* =======================================================
     LESSON
  ======================================================= */

  const [lesson, setLesson] =
    useState<Lesson | null>(null);

  const [loading, setLoading] =
    useState(true);

  /* =======================================================
     OBJECTIVES
  ======================================================= */

  const [objectives, setObjectives] =
    useState<Objective[]>([]);

  const [showObjectiveModal, setShowObjectiveModal] =
    useState(false);

  const [objectiveText, setObjectiveText] =
    useState('');

  const [savingObjective, setSavingObjective] =
    useState(false);

  const [deletingObjective, setDeletingObjective] =
    useState<number | null>(null);

  /* =======================================================
     DOCUMENTS
  ======================================================= */

  const [documents, setDocuments] =
    useState<Document[]>([]);

  const [documentsLoading, setDocumentsLoading] =
    useState(true);

  const [showDocumentModal, setShowDocumentModal] =
    useState(false);

  const [savingDocument, setSavingDocument] =
    useState(false);

  const [deletingDocument, setDeletingDocument] =
    useState<number | null>(null);

  const [documentForm, setDocumentForm] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });

  /* =======================================================
     VIDEOS
  ======================================================= */

  const [videos, setVideos] =
    useState<LessonVideo[]>([]);

  const [videosLoading, setVideosLoading] =
    useState(true);

  const [showVideoModal, setShowVideoModal] =
    useState(false);

  const [savingVideo, setSavingVideo] =
    useState(false);

  const [deletingVideo, setDeletingVideo] =
    useState<number | null>(null);

  const [videoMode, setVideoMode] =
    useState<'upload' | 'external'>('upload');

  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    url: '',
    file: null as File | null,
  });

  /* =======================================================
     ASSIGNMENTS
  ======================================================= */

  const [assignments, setAssignments] =
    useState<Assignment[]>([]);

  const [assignmentsLoading, setAssignmentsLoading] =
    useState(true);

  const [showAssignmentModal, setShowAssignmentModal] =
    useState(false);

  const [editingAssignmentId, setEditingAssignmentId] =
    useState<number | null>(null);

  const [savingAssignment, setSavingAssignment] =
    useState(false);

  const [deletingAssignment, setDeletingAssignment] =
    useState<number | null>(null);

  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    due_date: '',
    total_marks: '100',
    status: 'draft' as
      | 'draft'
      | 'active'
      | 'closed',
  });

  /* =======================================================
     QUIZZES
  ======================================================= */

  const [quizzes, setQuizzes] =
    useState<Quiz[]>([]);

  const [quizzesLoading, setQuizzesLoading] =
    useState(true);

  const [showQuizModal, setShowQuizModal] =
    useState(false);

  const [editingQuizId, setEditingQuizId] =
    useState<number | null>(null);

  const [savingQuiz, setSavingQuiz] =
    useState(false);

  const [deletingQuiz, setDeletingQuiz] =
    useState<number | null>(null);

  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    instructions: '',

    total_marks: '0',

    time_limit_minutes: '30',

    attempts_allowed: '1',

    passing_score: '50',

    status: 'draft' as
      | 'draft'
      | 'active'
      | 'closed',

    shuffle_questions: false,

    shuffle_options: false,

    show_results: true,

    show_correct_answers: false,

    available_from: '',

    available_until: '',
  });

  /* =======================================================
     QUESTIONS
  ======================================================= */

  const [selectedQuiz, setSelectedQuiz] =
    useState<Quiz | null>(null);

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [questionsLoading, setQuestionsLoading] =
    useState(false);

  const [showQuestionModal, setShowQuestionModal] =
    useState(false);

  const [savingQuestion, setSavingQuestion] =
    useState(false);

  const [deletingQuestion, setDeletingQuestion] =
    useState<number | null>(null);

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
  question_type: 'multiple_choice' as
    | 'multiple_choice'
    | 'true_false'
    | 'short_answer',

    option1: '',
    option2: '',
    option3: '',
    option4: '',

    correct_answer: '',

    marks: '1',
  });

  /* =========================================================
     LOAD LESSON
  ========================================================= */

  async function loadLesson() {
    if (!id) return;

    try {
      const response = await fetch(
        `/api/lms/lessons/${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to load lesson.'
        );
      }

      setLesson(data.lesson);
    } catch (error) {
      console.error(error);
      alert('Failed to load lesson.');
    }
  }

  /* =========================================================
     LOAD OBJECTIVES
  ========================================================= */

  async function loadObjectives() {
    if (!id) return;

    try {
      const response = await fetch(
        `/api/lms/learning-objectives?lesson_id=${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to load objectives.'
        );
      }

      setObjectives(data.objectives || []);
    } catch (error) {
      console.error(error);
    }
  }

  /* =========================================================
     LOAD DOCUMENTS
  ========================================================= */

  async function loadDocuments() {
    if (!id) return;

    try {
      setDocumentsLoading(true);

      const response = await fetch(
        `/api/lms/documents?lesson_id=${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to load documents.'
        );
      }

      setDocuments(data.documents || []);
    } catch (error) {
      console.error(error);
    } finally {
      setDocumentsLoading(false);
    }
  }

  /* =========================================================
     LOAD VIDEOS
  ========================================================= */

  async function loadVideos() {
    if (!id) return;

    try {
      setVideosLoading(true);

      const response = await fetch(
        `/api/lms/videos?lesson_id=${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to load videos.'
        );
      }

      setVideos(data.videos || []);
    } catch (error) {
      console.error(error);
    } finally {
      setVideosLoading(false);
    }
  }

  /* =========================================================
     LOAD ASSIGNMENTS
  ========================================================= */

  async function loadAssignments() {
    if (!id) return;

    try {
      setAssignmentsLoading(true);

      const response = await fetch(
        `/api/lms/assignments?lesson_id=${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to load assignments.'
        );
      }

      setAssignments(data.assignments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setAssignmentsLoading(false);
    }
  }

  /* =========================================================
     LOAD QUIZZES
  ========================================================= */

  async function loadQuizzes() {
    if (!id) return;

    try {
      setQuizzesLoading(true);

      const response = await fetch(
        `/api/lms/quizzes?lesson_id=${id}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to load quizzes.'
        );
      }

      setQuizzes(data.quizzes || []);
    } catch (error) {
      console.error(error);
    } finally {
      setQuizzesLoading(false);
    }
  }

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        setLoading(true);

        await Promise.all([
          loadLesson(),
          loadObjectives(),
          loadDocuments(),
          loadVideos(),
          loadAssignments(),
          loadQuizzes(),
        ]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  /* =========================================================
     FORMAT FILE SIZE
  ========================================================= */

  function formatFileSize(
    bytes: number | null
  ) {
    if (!bytes || bytes <= 0) {
      return 'Unknown size';
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(
        bytes /
        (1024 * 1024)
      ).toFixed(1)} MB`;
    }

    return `${(
      bytes /
      (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;
  }

  /* =========================================================
     OBJECTIVE - CREATE
  ========================================================= */

  async function handleCreateObjective(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id || !objectiveText.trim()) {
      alert('Please enter a learning objective.');
      return;
    }

    try {
      setSavingObjective(true);

      const response = await fetch(
        '/api/lms/learning-objectives',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lesson_id: Number(id),
            objective: objectiveText.trim(),
            order_number: objectives.length + 1,
            status: 'active',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to create objective.'
        );
      }

      setObjectives((current) => [
        ...current,
        data.objective,
      ]);

      setObjectiveText('');
      setShowObjectiveModal(false);
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to create objective.'
      );
    } finally {
      setSavingObjective(false);
    }
  }

  /* =========================================================
     OBJECTIVE - DELETE
  ========================================================= */

  async function handleDeleteObjective(
    objectiveId: number
  ) {
    if (
      !window.confirm(
        'Are you sure you want to delete this learning objective?'
      )
    ) {
      return;
    }

    try {
      setDeletingObjective(objectiveId);

      const response = await fetch(
        `/api/lms/learning-objectives/${objectiveId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to delete objective.'
        );
      }

      setObjectives((current) =>
        current.filter(
          (item) => item.id !== objectiveId
        )
      );
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to delete objective.'
      );
    } finally {
      setDeletingObjective(null);
    }
  }

  /* =========================================================
     DOCUMENT - FILE CHANGE
  ========================================================= */

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] || null;

    if (!file) {
      setDocumentForm((current) => ({
        ...current,
        file: null,
      }));
      return;
    }

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      alert('Please select a PDF file.');
      event.target.value = '';

      setDocumentForm((current) => ({
        ...current,
        file: null,
      }));

      return;
    }

    setDocumentForm((current) => ({
      ...current,
      file,
    }));
  }

  /* =========================================================
     DOCUMENT - CREATE
  ========================================================= */

  async function handleCreateDocument(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id || !documentForm.file) {
      alert('Please select a PDF file.');
      return;
    }

    if (!documentForm.title.trim()) {
      alert('Document title is required.');
      return;
    }

    try {
      setSavingDocument(true);

      const formData = new FormData();

      formData.append(
        'lesson_id',
        String(id)
      );

      formData.append(
        'title',
        documentForm.title.trim()
      );

      formData.append(
        'description',
        documentForm.description.trim()
      );

      formData.append(
        'file',
        documentForm.file
      );

      const response = await fetch(
        '/api/lms/documents',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to upload document.'
        );
      }

      setDocuments((current) => [
        ...current,
        data.document,
      ]);

      setDocumentForm({
        title: '',
        description: '',
        file: null,
      });

      setShowDocumentModal(false);
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to upload document.'
      );
    } finally {
      setSavingDocument(false);
    }
  }

  /* =========================================================
     DOCUMENT - DELETE
  ========================================================= */

  async function handleDeleteDocument(
    documentId: number
  ) {
    if (
      !window.confirm(
        'Are you sure you want to delete this document?'
      )
    ) {
      return;
    }

    try {
      setDeletingDocument(documentId);

      const response = await fetch(
        `/api/lms/documents/${documentId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to delete document.'
        );
      }

      setDocuments((current) =>
        current.filter(
          (item) => item.id !== documentId
        )
      );
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to delete document.'
      );
    } finally {
      setDeletingDocument(null);
    }
  }

  /* =========================================================
     VIDEO - FILE CHANGE
  ========================================================= */

  function handleVideoFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] || null;

    if (!file) {
      setVideoForm((current) => ({
        ...current,
        file: null,
      }));
      return;
    }

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      event.target.value = '';

      setVideoForm((current) => ({
        ...current,
        file: null,
      }));

      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      alert(
        'Video file is too large. Maximum size is 500MB.'
      );
      event.target.value = '';

      setVideoForm((current) => ({
        ...current,
        file: null,
      }));

      return;
    }

    setVideoForm((current) => ({
      ...current,
      file,
    }));
  }

  /* =========================================================
     VIDEO - CREATE
  ========================================================= */

  async function handleCreateVideo(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id) return;

    if (!videoForm.title.trim()) {
      alert('Video title is required.');
      return;
    }

    if (
      videoMode === 'upload' &&
      !videoForm.file
    ) {
      alert('Please select a video file.');
      return;
    }

    if (
      videoMode === 'external' &&
      !videoForm.url.trim()
    ) {
      alert('Please enter a video URL.');
      return;
    }

    if (videoMode === 'external') {
      try {
        const url = new URL(
          videoForm.url.trim()
        );

        if (
          url.protocol !== 'http:' &&
          url.protocol !== 'https:'
        ) {
          throw new Error();
        }
      } catch {
        alert('Please enter a valid video URL.');
        return;
      }
    }

    try {
      setSavingVideo(true);

      const formData = new FormData();

      formData.append(
        'lesson_id',
        String(id)
      );

      formData.append(
        'title',
        videoForm.title.trim()
      );

      formData.append(
        'description',
        videoForm.description.trim()
      );

      formData.append(
        'source_type',
        videoMode
      );

      formData.append(
        'status',
        'draft'
      );

      if (videoMode === 'external') {
        formData.append(
          'video_url',
          videoForm.url.trim()
        );
      }

      if (
        videoMode === 'upload' &&
        videoForm.file
      ) {
        formData.append(
          'file',
          videoForm.file
        );
      }

      const response = await fetch(
        '/api/lms/videos',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to create video.'
        );
      }

      setVideos((current) => [
        ...current,
        data.video,
      ]);

      setVideoForm({
        title: '',
        description: '',
        url: '',
        file: null,
      });

      setVideoMode('upload');
      setShowVideoModal(false);
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to create video.'
      );
    } finally {
      setSavingVideo(false);
    }
  }

  /* =========================================================
     VIDEO - DELETE
  ========================================================= */

  async function handleDeleteVideo(
    videoId: number
  ) {
    if (
      !window.confirm(
        'Are you sure you want to delete this video?'
      )
    ) {
      return;
    }

    try {
      setDeletingVideo(videoId);

      const response = await fetch(
        `/api/lms/videos/${videoId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to delete video.'
        );
      }

      setVideos((current) =>
        current.filter(
          (video) => video.id !== videoId
        )
      );
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to delete video.'
      );
    } finally {
      setDeletingVideo(null);
    }
  }

  /* =========================================================
     ASSIGNMENT - CREATE
  ========================================================= */

  function openCreateAssignment() {
    setEditingAssignmentId(null);

    setAssignmentForm({
      title: '',
      description: '',
      due_date: '',
      total_marks: '100',
      status: 'draft',
    });

    setShowAssignmentModal(true);
  }

  /* =========================================================
     ASSIGNMENT - EDIT
  ========================================================= */

  function openEditAssignment(
    assignment: Assignment
  ) {
    setEditingAssignmentId(assignment.id);

    setAssignmentForm({
      title: assignment.title || '',
      description:
        assignment.description || '',
      due_date: assignment.due_date
        ? assignment.due_date.slice(0, 16)
        : '',
      total_marks: String(
        assignment.total_marks ?? 0
      ),
      status: assignment.status,
    });

    setShowAssignmentModal(true);
  }

  /* =========================================================
     ASSIGNMENT - SAVE
  ========================================================= */

  async function handleSaveAssignment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id) return;

    if (!assignmentForm.title.trim()) {
      alert('Assignment title is required.');
      return;
    }

    if (
      assignmentForm.total_marks === '' ||
      Number(assignmentForm.total_marks) < 0
    ) {
      alert('Please enter valid total marks.');
      return;
    }

    try {
      setSavingAssignment(true);

      const isEditing =
        editingAssignmentId !== null;

      const url = isEditing
        ? `/api/lms/assignments/${editingAssignmentId}`
        : '/api/lms/assignments';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          lesson_id: Number(id),
          title: assignmentForm.title.trim(),
          description:
            assignmentForm.description.trim() ||
            null,
          due_date:
            assignmentForm.due_date || null,
          total_marks: Number(
            assignmentForm.total_marks
          ),
          status: assignmentForm.status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            data.message ||
            'Failed to save assignment.'
        );
      }

      if (isEditing) {
        setAssignments((current) =>
          current.map((item) =>
            item.id === editingAssignmentId
              ? data.assignment
              : item
          )
        );
      } else {
        setAssignments((current) => [
          ...current,
          data.assignment,
        ]);
      }

      setShowAssignmentModal(false);
      setEditingAssignmentId(null);
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to save assignment.'
      );
    } finally {
      setSavingAssignment(false);
    }
  }

  /* =========================================================
     ASSIGNMENT - DELETE
  ========================================================= */

  async function handleDeleteAssignment(
    assignmentId: number
  ) {
    if (
      !window.confirm(
        'Are you sure you want to delete this assignment?'
      )
    ) {
      return;
    }

    try {
      setDeletingAssignment(assignmentId);

      const response = await fetch(
        `/api/lms/assignments/${assignmentId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            data.message ||
            'Failed to delete assignment.'
        );
      }

      setAssignments((current) =>
        current.filter(
          (item) => item.id !== assignmentId
        )
      );
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to delete assignment.'
      );
    } finally {
      setDeletingAssignment(null);
    }
  }

  /* =========================================================
     QUIZ - CREATE
  ========================================================= */

  function openCreateQuiz() {
    setEditingQuizId(null);

    setQuizForm({
      title: '',
      description: '',
      instructions: '',
      total_marks: '0',
      time_limit_minutes: '30',
      attempts_allowed: '1',
      passing_score: '50',
      status: 'draft',
      shuffle_questions: false,
      shuffle_options: false,
      show_results: true,
      show_correct_answers: false,
      available_from: '',
      available_until: '',
    });

    setShowQuizModal(true);
  }

  /* =========================================================
     QUIZ - EDIT
  ========================================================= */

  function openEditQuiz(quiz: Quiz) {
    setEditingQuizId(quiz.id);

    setQuizForm({
      title: quiz.title || '',
      description: quiz.description || '',
      instructions: quiz.instructions || '',

      total_marks: String(
        quiz.total_marks ?? 0
      ),

      time_limit_minutes:
        quiz.time_limit_minutes !== null &&
        quiz.time_limit_minutes !== undefined
          ? String(quiz.time_limit_minutes)
          : '',

      attempts_allowed: String(
        quiz.attempts_allowed ?? 1
      ),

      passing_score: String(
        quiz.passing_score ?? 0
      ),

      status: quiz.status,

      shuffle_questions:
        quiz.shuffle_questions ?? false,

      shuffle_options:
        quiz.shuffle_options ?? false,

      show_results:
        quiz.show_results ?? true,

      show_correct_answers:
        quiz.show_correct_answers ?? false,

      available_from: quiz.available_from
        ? quiz.available_from.slice(0, 16)
        : '',

      available_until: quiz.available_until
        ? quiz.available_until.slice(0, 16)
        : '',
    });

    setShowQuizModal(true);
  }

  /* =========================================================
     QUIZ - SAVE
  ========================================================= */

  async function handleSaveQuiz(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id) return;

    if (!quizForm.title.trim()) {
      alert('Quiz title is required.');
      return;
    }

    const totalMarks =
      Number(quizForm.total_marks);

    const attemptsAllowed =
      Number(quizForm.attempts_allowed);

    const passingScore =
      Number(quizForm.passing_score);

    if (totalMarks < 0) {
      alert('Total marks cannot be negative.');
      return;
    }

    if (attemptsAllowed < 1) {
      alert(
        'Maximum attempts must be at least 1.'
      );
      return;
    }

    if (
      passingScore < 0 ||
      passingScore > 100
    ) {
      alert(
        'Passing score must be between 0 and 100.'
      );
      return;
    }

    try {
      setSavingQuiz(true);

      const isEditing =
        editingQuizId !== null;

      const url = isEditing
        ? `/api/lms/quizzes/${editingQuizId}`
        : '/api/lms/quizzes';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          lesson_id: Number(id),

          title: quizForm.title.trim(),

          description:
            quizForm.description.trim() ||
            null,

          instructions:
            quizForm.instructions.trim() ||
            null,

          total_marks: totalMarks,

          time_limit_minutes:
            quizForm.time_limit_minutes === ''
              ? null
              : Number(
                  quizForm.time_limit_minutes
                ),

          attempts_allowed:
            attemptsAllowed,

          passing_score:
            passingScore,

          status: quizForm.status,

          shuffle_questions:
            quizForm.shuffle_questions,

          shuffle_options:
            quizForm.shuffle_options,

          show_results:
            quizForm.show_results,

          show_correct_answers:
            quizForm.show_correct_answers,

          available_from:
            quizForm.available_from ||
            null,

          available_until:
            quizForm.available_until ||
            null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            data.message ||
            'Failed to save quiz.'
        );
      }

      if (isEditing) {
        setQuizzes((current) =>
          current.map((quiz) =>
            quiz.id === editingQuizId
              ? data.quiz
              : quiz
          )
        );
      } else {
        setQuizzes((current) => [
          ...current,
          data.quiz,
        ]);
      }

      setShowQuizModal(false);
      setEditingQuizId(null);
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to save quiz.'
      );
    } finally {
      setSavingQuiz(false);
    }
  }

  /* =========================================================
     QUIZ - DELETE
  ========================================================= */

  async function handleDeleteQuiz(
    quizId: number
  ) {
    if (
      !window.confirm(
        'Are you sure you want to delete this quiz? All questions belonging to this quiz may also be deleted.'
      )
    ) {
      return;
    }

    try {
      setDeletingQuiz(quizId);

      const response = await fetch(
        `/api/lms/quizzes/${quizId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            data.message ||
            'Failed to delete quiz.'
        );
      }

      setQuizzes((current) =>
        current.filter(
          (quiz) => quiz.id !== quizId
        )
      );
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to delete quiz.'
      );
    } finally {
      setDeletingQuiz(null);
    }
  }

  /* =========================================================
     QUESTIONS - LOAD
  ========================================================= */

  async function loadQuestions(
    quizId: number
  ) {
    try {
      setQuestionsLoading(true);

      const response = await fetch(
        `/api/lms/quiz-questions?quiz_id=${quizId}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to load questions.'
        );
      }

      setQuestions(data.questions || []);
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to load questions.'
      );
    } finally {
      setQuestionsLoading(false);
    }
  }

  /* =========================================================
     OPEN QUESTIONS
  ========================================================= */

  async function openQuizQuestions(
    quiz: Quiz
  ) {
    setSelectedQuiz(quiz);

    await loadQuestions(quiz.id);
  }

  /* =========================================================
     OPEN CREATE QUESTION
  ========================================================= */

  function openCreateQuestion() {
    setQuestionForm({
      question_text: '',
      question_type: 'multiple_choice',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correct_answer: '',
      marks: '1',
    });

    setShowQuestionModal(true);
  }
/* =========================================================
   CREATE QUESTION
========================================================= */

async function handleCreateQuestion(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  if (!selectedQuiz) {
    alert('Please select a quiz first.');
    return;
  }

  /* =====================================================
     QUESTION TEXT
  ===================================================== */

  const questionText =
    questionForm.question_text?.trim() || '';

  if (!questionText) {
    alert('Question text is required.');
    return;
  }

  /* =====================================================
     QUESTION TYPE
  ===================================================== */

  const questionType =
    questionForm.question_type;

  const allowedTypes = [
    'multiple_choice',
    'true_false',
    'short_answer',
  ];

  if (!allowedTypes.includes(questionType)) {
    alert('Please select a valid question type.');
    return;
  }

  /* =====================================================
     MARKS
  ===================================================== */

  const marks = Number(
    questionForm.marks
  );

  if (!Number.isFinite(marks) || marks <= 0) {
    alert(
      'Question marks must be greater than 0.'
    );
    return;
  }

  /* =====================================================
     OPTIONS
  ===================================================== */

  let options: string[] = [];

  if (
    questionType ===
    'multiple_choice'
  ) {
    options = [
      questionForm.option1?.trim() || '',
      questionForm.option2?.trim() || '',
      questionForm.option3?.trim() || '',
      questionForm.option4?.trim() || '',
    ].filter(Boolean);

    if (options.length < 2) {
      alert(
        'Multiple-choice questions require at least two options.'
      );
      return;
    }

    /* ===================================================
       CORRECT ANSWER
    =================================================== */

    const correctAnswer =
      questionForm.correct_answer?.trim() || '';

    if (!correctAnswer) {
      alert(
        'Please select the correct answer.'
      );
      return;
    }

    if (!options.includes(correctAnswer)) {
      alert(
        'The correct answer must match one of the options.'
      );
      return;
    }
  }

  /* =====================================================
     TRUE / FALSE
  ===================================================== */

  if (
    questionType ===
    'true_false'
  ) {
    options = [
      'True',
      'False',
    ];

    const correctAnswer =
      questionForm.correct_answer?.trim() || '';

    if (
      correctAnswer !== 'True' &&
      correctAnswer !== 'False'
    ) {
      alert(
        'Please select either True or False as the correct answer.'
      );
      return;
    }
  }

  /* =====================================================
     SHORT ANSWER
  ===================================================== */

  if (
    questionType ===
    'short_answer'
  ) {
    options = [];
  }

  /* =====================================================
     SAVE QUESTION
  ===================================================== */

  try {
    setSavingQuestion(true);

    const payload = {
      quiz_id: Number(
        selectedQuiz.id
      ),

      /*
       * IMPORTANT:
       * The API expects question_text,
       * not question.
       */
      question_text:
        questionText,

      question_type:
        questionType,

      options,

      correct_answer:
        questionForm.correct_answer?.trim() ||
        null,

      marks,

      question_order:
        questions.length + 1,

      explanation: null,
    };

    console.log(
      'Creating quiz question:',
      payload
    );

    const response =
      await fetch(
        '/api/lms/quiz-questions',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const data =
      await response.json();

    console.log(
      'Create question response:',
      data
    );

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.error ||
          data.message ||
          'Failed to create question.'
      );
    }

    /* ===================================================
       ADD QUESTION TO UI
    =================================================== */

    setQuestions(
      (current) => [
        ...current,
        data.question,
      ]
    );

    /* ===================================================
       UPDATE QUESTION COUNT
    =================================================== */

    setQuizzes(
      (current) =>
        current.map(
          (quiz) =>
            quiz.id ===
            selectedQuiz.id
              ? {
                  ...quiz,

                  question_count:
                    (quiz.question_count ||
                      0) + 1,
                }
              : quiz
        )
    );

    /* ===================================================
       CLOSE MODAL
    =================================================== */

    setShowQuestionModal(
      false
    );

    /* ===================================================
       RESET FORM
    =================================================== */

    setQuestionForm({
      question_text: '',
      question_type:
        'multiple_choice',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correct_answer: '',
      marks: '1',
    });

  } catch (error: any) {
    console.error(
      'Create question error:',
      error
    );

    alert(
      error?.message ||
        'Failed to create question.'
    );

  } finally {
    setSavingQuestion(false);
  }
}



  /* =========================================================
     DELETE QUESTION
  ========================================================= */

  async function handleDeleteQuestion(
    questionId: number
  ) {
    if (
      !window.confirm(
        'Are you sure you want to delete this question?'
      )
    ) {
      return;
    }

    try {
      setDeletingQuestion(questionId);

      const response = await fetch(
        `/api/lms/quiz-questions/${questionId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            data.message ||
            'Failed to delete question.'
        );
      }

      setQuestions((current) =>
        current.filter(
          (question) =>
            question.id !== questionId
        )
      );

      if (selectedQuiz) {
        setQuizzes((current) =>
          current.map((quiz) =>
            quiz.id === selectedQuiz.id
              ? {
                  ...quiz,
                  question_count: Math.max(
                    0,
                    (quiz.question_count || 0) -
                      1
                  ),
                }
              : quiz
          )
        );
      }
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to delete question.'
      );
    } finally {
      setDeletingQuestion(null);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2
          className="animate-spin"
          size={32}
        />
      </div>
    );
  }

  /* =========================================================
     LESSON NOT FOUND
  ========================================================= */

  if (!lesson) {
    return (
      <div className="p-8">
        <div className="rounded-xl border bg-white p-8 text-center">
          <h2 className="text-lg font-semibold">
            Lesson not found
          </h2>

          <Link
            href="/admin/dashboard/lms"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back to LMS
          </Link>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-8 p-6">

      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">

        <Link
          href="/admin/dashboard/lms"
          className="hover:text-gray-900"
        >
          LMS
        </Link>

        <span>/</span>

        <Link
          href={`/admin/dashboard/lms/programs/${lesson.program_id}`}
          className="hover:text-gray-900"
        >
          {lesson.program_name}
        </Link>

        <span>/</span>

        <Link
          href={`/admin/dashboard/lms/units/${lesson.unit_id}`}
          className="hover:text-gray-900"
        >
          {lesson.unit_name}
        </Link>

        <span>/</span>

        <span className="font-medium text-gray-900">
          {lesson.title}
        </span>

      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

        <div>

          <Link
            href={`/admin/dashboard/lms/units/${lesson.unit_id}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Unit
          </Link>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-gray-100 p-3">
              <BookOpen size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {lesson.title}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {lesson.program_name}
                {' → '}
                {lesson.unit_name}
                {' → '}
                {lesson.topic_name}
              </p>
            </div>

          </div>

        </div>

        <span className="inline-flex w-fit items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
          {lesson.status}
        </span>

      </div>

      {/* =====================================================
          LESSON OVERVIEW
      ===================================================== */}

      <section className="rounded-2xl border bg-white p-6">

        <div className="mb-4 flex items-center gap-3">
          <BookOpen size={20} />

          <div>
            <h2 className="font-semibold">
              Lesson Overview
            </h2>

            <p className="text-sm text-gray-500">
              Overview and description of this lesson.
            </p>
          </div>
        </div>

        <p className="leading-7 text-gray-700">
          {lesson.description ||
            'No lesson description has been provided.'}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          <StatCard
            icon={<FileText size={18} />}
            label="Documents"
            value={documents.length}
          />

          <StatCard
            icon={<VideoIcon size={18} />}
            label="Videos"
            value={videos.length}
          />

          <StatCard
            icon={<ClipboardList size={18} />}
            label="Assignments"
            value={assignments.length}
          />

          <StatCard
            icon={<HelpCircle size={18} />}
            label="Quizzes"
            value={quizzes.length}
          />

        </div>

      </section>

      {/* =====================================================
          LEARNING OBJECTIVES
      ===================================================== */}

      <section className="rounded-2xl border bg-white">

        <SectionHeader
          icon={<BookOpen size={20} />}
          title="Learning Objectives"
          description="What students should know or be able to do after completing this lesson."
          buttonText="Add Objective"
          onClick={() =>
            setShowObjectiveModal(true)
          }
        />

        <div className="divide-y">

          {objectives.length === 0 ? (
            <EmptyState
              text="No learning objectives yet."
            />
          ) : (
            objectives.map((objective) => (
              <div
                key={objective.id}
                className="flex items-start justify-between gap-4 p-5"
              >

                <div className="flex gap-3">

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold">
                    {objective.order_number}
                  </span>

                  <p className="pt-1 text-gray-700">
                    {objective.objective}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteObjective(
                      objective.id
                    )
                  }
                  disabled={
                    deletingObjective ===
                    objective.id
                  }
                  className="text-gray-400 hover:text-red-600"
                >
                  {deletingObjective ===
                  objective.id ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={17} />
                  )}
                </button>

              </div>
            ))
          )}

        </div>

      </section>

      {/* =====================================================
          DOCUMENTS
      ===================================================== */}

      <section className="rounded-2xl border bg-white">

        <SectionHeader
          icon={<FileText size={20} />}
          title="Documents"
          description="Upload lesson PDFs and learning notes."
          buttonText="Upload PDF"
          onClick={() =>
            setShowDocumentModal(true)
          }
        />

        <div className="p-5">

          {documentsLoading ? (
            <LoadingRow />
          ) : documents.length === 0 ? (
            <EmptyState
              text="No documents uploaded yet."
            />
          ) : (
            <div className="space-y-4">

              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                >

                  <div className="flex items-start gap-3">

                    <div className="rounded-lg bg-red-50 p-2 text-red-600">
                      <FileText size={20} />
                    </div>

                    <div>

                      <h3 className="font-semibold">
                        {document.title}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {document.file_name}
                      </p>

                      {document.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {document.description}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-gray-400">
                        PDF •{' '}
                        {formatFileSize(
                          document.file_size
                        )}
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-2">

                  <a
  href={`/api/lms/documents/${document.id}/view`}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
>
  <ExternalLink size={15} />
  View
</a>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteDocument(
                          document.id
                        )
                      }
                      disabled={
                        deletingDocument ===
                        document.id
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      {deletingDocument ===
                      document.id ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={15} />
                      )}

                      Delete
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          VIDEOS
      ===================================================== */}

      <section className="rounded-2xl border bg-white">

        <SectionHeader
          icon={<VideoIcon size={20} />}
          title="Videos"
          description="Upload videos to Supabase Storage or add YouTube/Vimeo/external URLs."
          buttonText="Add Video"
          onClick={() =>
            setShowVideoModal(true)
          }
        />

        <div className="p-5">

          {videosLoading ? (
            <LoadingRow />
          ) : videos.length === 0 ? (
            <EmptyState
              text="No videos added yet."
            />
          ) : (
            <div className="space-y-4">

              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                >

                  <div className="flex items-start gap-3">

                    <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                      <VideoIcon size={20} />
                    </div>

                    <div>

                      <h3 className="font-semibold">
                        {video.title}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {video.video_type ===
                        'external'
                          ? 'External Video'
                          : 'Uploaded Video'}
                      </p>

                      {video.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {video.description}
                        </p>
                      )}

                    </div>

                  </div>

                  <div className="flex items-center gap-2">

                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      <ExternalLink size={15} />
                      View
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteVideo(
                          video.id
                        )
                      }
                      disabled={
                        deletingVideo ===
                        video.id
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      {deletingVideo ===
                      video.id ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={15} />
                      )}

                      Delete
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          ASSIGNMENTS
      ===================================================== */}

      <section className="rounded-2xl border bg-white">

        <SectionHeader
          icon={<ClipboardList size={20} />}
          title="Assignments"
          description="Create and manage assignments for this lesson."
          buttonText="Create Assignment"
          onClick={openCreateAssignment}
        />

        <div className="p-5">

          {assignmentsLoading ? (
            <LoadingRow />
          ) : assignments.length === 0 ? (
            <EmptyState
              text="No assignments yet"
              description="Create an assignment with instructions, marks and a due date."
              buttonText="Create Assignment"
              onClick={openCreateAssignment}
            />
          ) : (
            <div className="space-y-4">

              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-xl border p-5"
                >

                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                    <div>

                      <div className="flex items-center gap-2">

                        <h3 className="font-semibold text-gray-900">
                          {assignment.title}
                        </h3>

                        <StatusBadge
                          status={
                            assignment.status
                          }
                        />

                      </div>

                      {assignment.description && (
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {assignment.description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">

                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 size={15} />
                          {assignment.total_marks}{' '}
                          marks
                        </span>

                        {assignment.due_date && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={15} />
                            {new Date(
                              assignment.due_date
                            ).toLocaleString()}
                          </span>
                        )}

                      </div>

                    </div>

                    <div className="flex items-center gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          openEditAssignment(
                            assignment
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteAssignment(
                            assignment.id
                          )
                        }
                        disabled={
                          deletingAssignment ===
                          assignment.id
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        {deletingAssignment ===
                        assignment.id ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={15} />
                        )}

                        Delete
                      </button>

                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          QUIZZES
      ===================================================== */}

      <section className="rounded-2xl border bg-white">

        <SectionHeader
          icon={<HelpCircle size={20} />}
          title="Quizzes"
          description="Build quizzes and assessments for this lesson."
          buttonText="Create Quiz"
          onClick={openCreateQuiz}
        />

        <div className="p-5">

          {quizzesLoading ? (
            <LoadingRow />
          ) : quizzes.length === 0 ? (
            <EmptyState
              text="No quizzes yet"
              description="Create a quiz and add multiple-choice, true/false or short-answer questions."
              buttonText="Create Quiz"
              onClick={openCreateQuiz}
            />
          ) : (
            <div className="space-y-4">

              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="rounded-xl border p-5"
                >

                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="font-semibold text-gray-900">
                          {quiz.title}
                        </h3>

                        <StatusBadge
                          status={quiz.status}
                        />

                      </div>

                      {quiz.description && (
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {quiz.description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">

                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2 size={15} />
                          {quiz.total_marks || 0}{' '}
                          marks
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={15} />

                          {quiz.time_limit_minutes
                            ? `${quiz.time_limit_minutes} minutes`
                            : 'No time limit'}
                        </span>

                        <span>
                          {quiz.attempts_allowed}{' '}
                          attempt
                          {quiz.attempts_allowed ===
                          1
                            ? ''
                            : 's'}
                        </span>

                        <span>
                          {quiz.question_count ||
                            0}{' '}
                          questions
                        </span>

                      </div>

                    </div>

                    <div className="flex flex-wrap items-center gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          openQuizQuestions(quiz)
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        <HelpCircle size={15} />
                        Questions
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openEditQuiz(quiz)
                        }
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteQuiz(
                            quiz.id
                          )
                        }
                        disabled={
                          deletingQuiz ===
                          quiz.id
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        {deletingQuiz ===
                        quiz.id ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={15} />
                        )}

                        Delete
                      </button>

                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          OBJECTIVE MODAL
      ===================================================== */}

      {showObjectiveModal && (
        <Modal
          title="Add Learning Objective"
          subtitle="Define what students should know or be able to do after this lesson."
          onClose={() =>
            setShowObjectiveModal(false)
          }
        >

          <form
            onSubmit={handleCreateObjective}
            className="space-y-5"
          >

            <FormTextarea
              label="Learning Objective *"
              value={objectiveText}
              onChange={setObjectiveText}
              placeholder="e.g. Explain the importance of effective communication in emergency care."
            />

            <ModalButtons
              loading={savingObjective}
              submitText="Add Objective"
              onCancel={() =>
                setShowObjectiveModal(false)
              }
            />

          </form>

        </Modal>
      )}

      {/* =====================================================
          DOCUMENT MODAL
      ===================================================== */}

      {showDocumentModal && (
        <Modal
          title="Upload PDF"
          subtitle="Upload a PDF learning resource for this lesson."
          onClose={() =>
            setShowDocumentModal(false)
          }
        >

          <form
            onSubmit={handleCreateDocument}
            className="space-y-5"
          >

            <FormInput
              label="Document Title *"
              value={documentForm.title}
              onChange={(value) =>
                setDocumentForm(
                  (current) => ({
                    ...current,
                    title: value,
                  })
                )
              }
              placeholder="e.g. Doctor Patient Communication"
            />

            <FormTextarea
              label="Description"
              value={documentForm.description}
              onChange={(value) =>
                setDocumentForm(
                  (current) => ({
                    ...current,
                    description: value,
                  })
                )
              }
              placeholder="Describe this learning resource..."
            />

            <div>
              <label className="mb-2 block text-sm font-medium">
                PDF File *
              </label>

              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="block w-full rounded-lg border px-3 py-2 text-sm"
              />

              {documentForm.file && (
                <p className="mt-2 text-xs text-gray-500">
                  {documentForm.file.name}
                </p>
              )}
            </div>

            <ModalButtons
              loading={savingDocument}
              submitText="Upload PDF"
              onCancel={() =>
                setShowDocumentModal(false)
              }
            />

          </form>

        </Modal>
      )}

      {/* =====================================================
          VIDEO MODAL
      ===================================================== */}

      {showVideoModal && (
        <Modal
          title="Add Video"
          subtitle="Upload a video or add an external video URL."
          onClose={() =>
            setShowVideoModal(false)
          }
        >

          <form
            onSubmit={handleCreateVideo}
            className="space-y-5"
          >

            <FormInput
              label="Video Title *"
              value={videoForm.title}
              onChange={(value) =>
                setVideoForm(
                  (current) => ({
                    ...current,
                    title: value,
                  })
                )
              }
              placeholder="e.g. Effective Patient Communication"
            />

            <FormTextarea
              label="Description"
              value={videoForm.description}
              onChange={(value) =>
                setVideoForm(
                  (current) => ({
                    ...current,
                    description: value,
                  })
                )
              }
              placeholder="Describe this video..."
            />

            <div className="grid grid-cols-2 gap-2">

              <button
                type="button"
                onClick={() =>
                  setVideoMode('upload')
                }
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  videoMode === 'upload'
                    ? 'bg-gray-900 text-white'
                    : ''
                }`}
              >
                Upload Video
              </button>

              <button
                type="button"
                onClick={() =>
                  setVideoMode('external')
                }
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  videoMode === 'external'
                    ? 'bg-gray-900 text-white'
                    : ''
                }`}
              >
                External URL
              </button>

            </div>

            {videoMode === 'upload' ? (
              <div>

                <label className="mb-2 block text-sm font-medium">
                  Video File *
                </label>

                <input
                  type="file"
                  accept="video/*"
                  onChange={
                    handleVideoFileChange
                  }
                  className="block w-full rounded-lg border px-3 py-2 text-sm"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Maximum file size: 500MB.
                </p>

              </div>
            ) : (
              <FormInput
                label="Video URL *"
                value={videoForm.url}
                onChange={(value) =>
                  setVideoForm(
                    (current) => ({
                      ...current,
                      url: value,
                    })
                  )
                }
                placeholder="https://youtube.com/..."
              />
            )}

            <ModalButtons
              loading={savingVideo}
              submitText="Add Video"
              onCancel={() =>
                setShowVideoModal(false)
              }
            />

          </form>

        </Modal>
      )}

      {/* =====================================================
          ASSIGNMENT MODAL
      ===================================================== */}

      {showAssignmentModal && (
        <Modal
          title={
            editingAssignmentId
              ? 'Edit Assignment'
              : 'Create Assignment'
          }
          subtitle="Configure the assignment details, marks and due date."
          onClose={() => {
            setShowAssignmentModal(false);
            setEditingAssignmentId(null);
          }}
        >

          <form
            onSubmit={handleSaveAssignment}
            className="space-y-5"
          >

            <FormInput
              label="Assignment Title *"
              value={assignmentForm.title}
              onChange={(value) =>
                setAssignmentForm(
                  (current) => ({
                    ...current,
                    title: value,
                  })
                )
              }
              placeholder="e.g. Emergency Communication Case Study"
            />

            <FormTextarea
              label="Instructions / Description"
              value={assignmentForm.description}
              onChange={(value) =>
                setAssignmentForm(
                  (current) => ({
                    ...current,
                    description: value,
                  })
                )
              }
              placeholder="Enter assignment instructions..."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <FormInput
                label="Due Date"
                type="datetime-local"
                value={assignmentForm.due_date}
                onChange={(value) =>
                  setAssignmentForm(
                    (current) => ({
                      ...current,
                      due_date: value,
                    })
                  )
                }
              />

              <FormInput
                label="Total Marks"
                type="number"
                value={assignmentForm.total_marks}
                onChange={(value) =>
                  setAssignmentForm(
                    (current) => ({
                      ...current,
                      total_marks: value,
                    })
                  )
                }
              />

            </div>

            <StatusSelect
              label="Status"
              value={assignmentForm.status}
              onChange={(value) =>
                setAssignmentForm(
                  (current) => ({
                    ...current,
                    status: value as
                      | 'draft'
                      | 'active'
                      | 'closed',
                  })
                )
              }
            />

            <ModalButtons
              loading={savingAssignment}
              submitText={
                editingAssignmentId
                  ? 'Save Changes'
                  : 'Create Assignment'
              }
              onCancel={() => {
                setShowAssignmentModal(false);
                setEditingAssignmentId(null);
              }}
            />

          </form>

        </Modal>
      )}

      {/* =====================================================
          QUIZ MODAL
      ===================================================== */}

      {showQuizModal && (
        <Modal
          title={
            editingQuizId
              ? 'Edit Quiz'
              : 'Create Quiz'
          }
          subtitle="Configure the quiz settings, attempts, scoring and availability."
          onClose={() => {
            setShowQuizModal(false);
            setEditingQuizId(null);
          }}
        >

          <form
            onSubmit={handleSaveQuiz}
            className="space-y-5"
          >

            <FormInput
              label="Quiz Title *"
              value={quizForm.title}
              onChange={(value) =>
                setQuizForm(
                  (current) => ({
                    ...current,
                    title: value,
                  })
                )
              }
              placeholder="e.g. Communication in Emergency Care Quiz"
            />

            <FormTextarea
              label="Description"
              value={quizForm.description}
              onChange={(value) =>
                setQuizForm(
                  (current) => ({
                    ...current,
                    description: value,
                  })
                )
              }
              placeholder="Describe this quiz..."
            />

            <FormTextarea
              label="Instructions"
              value={quizForm.instructions}
              onChange={(value) =>
                setQuizForm(
                  (current) => ({
                    ...current,
                    instructions: value,
                  })
                )
              }
              placeholder="Enter instructions students should read before starting the quiz..."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <FormInput
                label="Total Marks"
                type="number"
                value={quizForm.total_marks}
                onChange={(value) =>
                  setQuizForm(
                    (current) => ({
                      ...current,
                      total_marks: value,
                    })
                  )
                }
              />

              <FormInput
                label="Time Limit (minutes)"
                type="number"
                value={
                  quizForm.time_limit_minutes
                }
                onChange={(value) =>
                  setQuizForm(
                    (current) => ({
                      ...current,
                      time_limit_minutes:
                        value,
                    })
                  )
                }
                placeholder="Leave blank for no limit"
              />

              <FormInput
                label="Maximum Attempts"
                type="number"
                value={
                  quizForm.attempts_allowed
                }
                onChange={(value) =>
                  setQuizForm(
                    (current) => ({
                      ...current,
                      attempts_allowed:
                        value,
                    })
                  )
                }
              />

              <FormInput
                label="Passing Score (%)"
                type="number"
                value={
                  quizForm.passing_score
                }
                onChange={(value) =>
                  setQuizForm(
                    (current) => ({
                      ...current,
                      passing_score:
                        value,
                    })
                  )
                }
              />

            </div>

            <StatusSelect
              label="Status"
              value={quizForm.status}
              onChange={(value) =>
                setQuizForm(
                  (current) => ({
                    ...current,
                    status: value as
                      | 'draft'
                      | 'active'
                      | 'closed',
                  })
                )
              }
            />

            <div className="space-y-3 rounded-xl border p-4">

              <p className="text-sm font-semibold">
                Quiz Options
              </p>

              <ToggleField
                label="Shuffle Questions"
                checked={
                  quizForm.shuffle_questions
                }
                onChange={(checked) =>
                  setQuizForm(
                    (current) => ({
                      ...current,
                      shuffle_questions:
                        checked,
                    })
                  )
                }
              />

              <ToggleField
                label="Shuffle Answer Options"
                checked={
                  quizForm.shuffle_options
                }
                onChange={(checked) =>
                  setQuizForm(
                    (current) => ({
                      ...current,
                      shuffle_options:
                        checked,
                    })
                  )
                }
              />

              <ToggleField
                label="Show Results"
                checked={
                  quizForm.show_results
                }
                onChange={(checked) =>
                  setQuizForm(
                    (current) => ({
                      ...current,
                      show_results:
                        checked,
                    })
                  )
                }
              />

              <ToggleField
                label="Show Correct Answers"
                checked={
                  quizForm.show_correct_answers
                }
                onChange={(checked) =>
                  setQuizForm(
                    (current) => ({
                      ...current,
                      show_correct_answers:
                        checked,
                    })
                  )
                }
              />

            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <FormInput
                label="Available From"
                type="datetime-local"
                value={
                  quizForm.available_from
                }
                onChange={(value) =>
                  setQuizForm(
                    (current) => ({
                      ...current,
                      available_from:
                        value,
                    })
                  )
                }
              />

              <FormInput
                label="Available Until"
                type="datetime-local"
                value={
                  quizForm.available_until
                }
                onChange={(value) =>
                  setQuizForm(
                    (current) => ({
                      ...current,
                      available_until:
                        value,
                    })
                  )
                }
              />

            </div>

            <ModalButtons
              loading={savingQuiz}
              submitText={
                editingQuizId
                  ? 'Save Changes'
                  : 'Create Quiz'
              }
              onCancel={() => {
                setShowQuizModal(false);
                setEditingQuizId(null);
              }}
            />

          </form>

        </Modal>
      )}

      {/* =====================================================
          QUESTIONS PANEL
      ===================================================== */}

      {selectedQuiz && (
        <Modal
          title={selectedQuiz.title}
          subtitle="Manage the questions included in this quiz."
          onClose={() => {
            setSelectedQuiz(null);
            setQuestions([]);
          }}
          wide
        >

          <div className="space-y-5">

            <div className="flex flex-col gap-3 rounded-xl bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Questions
                </p>

                <p className="font-semibold">
                  {questions.length} questions
                  {' • '}
                  {selectedQuiz.total_marks ||
                    0}{' '}
                  marks
                </p>

              </div>

              <button
                type="button"
                onClick={openCreateQuestion}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                <Plus size={16} />
                Add Question
              </button>

            </div>

            {questionsLoading ? (
              <LoadingRow />
            ) : questions.length === 0 ? (
              <EmptyState
                text="No questions yet"
                description="Add questions to build this quiz."
                buttonText="Add Question"
                onClick={openCreateQuestion}
              />
            ) : (
              <div className="space-y-4">

                {questions.map(
                  (question, index) => (
                    <div
                      key={question.id}
                      className="rounded-xl border p-5"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex gap-3">

                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold">
                            {index + 1}
                          </span>

                          <div>

                            <p className="font-medium text-gray-900">
                              {question.question_text}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">

                              <span>
                                {question.question_type.replace(
                                  '_',
                                  ' '
                                )}
                              </span>

                              <span>
                                {question.marks}{' '}
                                mark
                                {question.marks ===
                                1
                                  ? ''
                                  : 's'}
                              </span>

                            </div>

                            {question.options &&
                              question.options.length >
                                0 && (
                                <div className="mt-4 space-y-2">

                                  {question.options.map(
                                    (
                                      option,
                                      optionIndex
                                    ) => (
                                      <div
                                        key={
                                          optionIndex
                                        }
                                        className={`rounded-lg border px-3 py-2 text-sm ${
                                          option ===
                                          question.correct_answer
                                            ? 'border-green-300 bg-green-50 text-green-800'
                                            : 'bg-white'
                                        }`}
                                      >
                                        {String.fromCharCode(
                                          65 +
                                            optionIndex
                                        )}
                                        . {option}
                                      </div>
                                    )
                                  )}

                                </div>
                              )}

                            {question.question_type ===
                              'true_false' && (
                              <div className="mt-3 text-sm text-gray-600">
                                Correct answer:{' '}
                                <strong>
                                  {
                                    question.correct_answer
                                  }
                                </strong>
                              </div>
                            )}

                            {question.question_type ===
                              'short_answer' && (
                              <div className="mt-3 text-sm text-gray-600">
                                Expected answer:{' '}
                                <strong>
                                  {
                                    question.correct_answer
                                  }
                                </strong>
                              </div>
                            )}

                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteQuestion(
                              question.id
                            )
                          }
                          disabled={
                            deletingQuestion ===
                            question.id
                          }
                          className="text-gray-400 hover:text-red-600"
                        >
                          {deletingQuestion ===
                          question.id ? (
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={17} />
                          )}
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </Modal>
      )}

      {/* =====================================================
          QUESTION MODAL
      ===================================================== */}

      {showQuestionModal && (
        <Modal
          title="Add Quiz Question"
          subtitle="Create a professional assessment question."
          onClose={() =>
            setShowQuestionModal(false)
          }
        >

          <form
            onSubmit={handleCreateQuestion}
            className="space-y-5"
          >

            <FormTextarea
             label="Question *"

value={questionForm.question_text}

onChange={(value) =>
  setQuestionForm(
    (current) => ({
      ...current,
      question_text: value,
    })
  )
}

placeholder="Enter the question..."
            />

            <div>
              <label className="mb-2 block text-sm font-medium">
                Question Type
              </label>

              <select
                value={
                  questionForm.question_type
                }
                onChange={(event) =>
                  setQuestionForm(
                    (current) => ({
                      ...current,
                      question_type:
                        event.target
                          .value as
                          | 'multiple_choice'
                          | 'true_false'
                          | 'short_answer',
                      correct_answer: '',
                    })
                  )
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="multiple_choice">
                  Multiple Choice
                </option>

                <option value="true_false">
                  True / False
                </option>

                <option value="short_answer">
                  Short Answer
                </option>
              </select>
            </div>

            {questionForm.question_type ===
              'multiple_choice' && (
              <div className="space-y-3">

                <p className="text-sm font-semibold">
                  Answer Options
                </p>

                {[
                  'option1',
                  'option2',
                  'option3',
                  'option4',
                ].map((key, index) => (
                  <FormInput
                    key={key}
                    label={`Option ${String.fromCharCode(
                      65 + index
                    )}${
                      index < 2 ? ' *' : ''
                    }`}
                    value={
                      questionForm[
                        key as keyof typeof questionForm
                      ] as string
                    }
                    onChange={(value) =>
                      setQuestionForm(
                        (current) => ({
                          ...current,
                          [key]: value,
                        })
                      )
                    }
                  />
                ))}

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Correct Answer *
                  </label>

                  <select
                    value={
                      questionForm.correct_answer
                    }
                    onChange={(event) =>
                      setQuestionForm(
                        (current) => ({
                          ...current,
                          correct_answer:
                            event.target.value,
                        })
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="">
                      Select correct answer
                    </option>

                    {[
                      questionForm.option1,
                      questionForm.option2,
                      questionForm.option3,
                      questionForm.option4,
                    ]
                      .filter(Boolean)
                      .map(
                        (option, index) => (
                          <option
                            key={index}
                            value={option}
                          >
                            {String.fromCharCode(
                              65 + index
                            )}
                            . {option}
                          </option>
                        )
                      )}
                  </select>
                </div>

              </div>
            )}

            {questionForm.question_type ===
              'true_false' && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Correct Answer *
                </label>

                <select
                  value={
                    questionForm.correct_answer
                  }
                  onChange={(event) =>
                    setQuestionForm(
                      (current) => ({
                        ...current,
                        correct_answer:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">
                    Select answer
                  </option>

                  <option value="True">
                    True
                  </option>

                  <option value="False">
                    False
                  </option>
                </select>
              </div>
            )}

            {questionForm.question_type ===
              'short_answer' && (
              <FormInput
                label="Expected Answer"
                value={
                  questionForm.correct_answer
                }
                onChange={(value) =>
                  setQuestionForm(
                    (current) => ({
                      ...current,
                      correct_answer:
                        value,
                    })
                  )
                }
                placeholder="Enter the expected answer..."
              />
            )}

            <FormInput
              label="Marks"
              type="number"
              value={questionForm.marks}
              onChange={(value) =>
                setQuestionForm(
                  (current) => ({
                    ...current,
                    marks: value,
                  })
                )
              }
            />

            <ModalButtons
              loading={savingQuestion}
              submitText="Add Question"
              onCancel={() =>
                setShowQuestionModal(false)
              }
            />

          </form>

        </Modal>
      )}

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 text-gray-500">
        {icon}
      </div>

      <p className="text-2xl font-bold">
        {value}
      </p>

      <p className="text-sm text-gray-500">
        {label}
      </p>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  description,
  buttonText,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-b p-5 md:flex-row md:items-center md:justify-between">

      <div className="flex items-start gap-3">

        <div className="rounded-lg bg-gray-100 p-2">
          {icon}
        </div>

        <div>
          <h2 className="font-semibold">
            {title}
          </h2>

          <p className="text-sm text-gray-500">
            {description}
          </p>
        </div>

      </div>

      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        <Plus size={16} />
        {buttonText}
      </button>

    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  text,
  description,
  buttonText,
  onClick,
}: {
  text: string;
  description?: string;
  buttonText?: string;
  onClick?: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center">

      <p className="font-medium text-gray-700">
        {text}
      </p>

      {description && (
        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      )}

      {buttonText && onClick && (
        <button
          type="button"
          onClick={onClick}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          <Plus size={16} />
          {buttonText}
        </button>
      )}

    </div>
  );
}

/* =========================================================
   LOADING ROW
========================================================= */

function LoadingRow() {
  return (
    <div className="flex items-center justify-center py-10">
      <Loader2
        size={24}
        className="animate-spin"
      />
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const classes =
    status === 'active'
      ? 'bg-green-50 text-green-700'
      : status === 'closed'
        ? 'bg-red-50 text-red-700'
        : 'bg-yellow-50 text-yellow-700';

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {status}
    </span>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-xl ${
          wide ? 'max-w-4xl' : 'max-w-2xl'
        }`}
      >

        <div className="sticky top-0 z-10 flex items-start justify-between border-b bg-white p-5">

          <div>

            <h2 className="text-lg font-semibold">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">
                {subtitle}
              </p>
            )}

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={20} />
          </button>

        </div>

        <div className="p-5">
          {children}
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   FORM INPUT
========================================================= */

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-gray-500"
      />
    </div>
  );
}

/* =========================================================
   FORM TEXTAREA
========================================================= */

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-gray-500"
      />
    </div>
  );
}

/* =========================================================
   STATUS SELECT
========================================================= */

function StatusSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: 'draft' | 'active' | 'closed';
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border px-3 py-2 text-sm"
      >
        <option value="draft">
          Draft
        </option>

        <option value="active">
          Active
        </option>

        <option value="closed">
          Closed
        </option>
      </select>
    </div>
  );
}

/* =========================================================
   TOGGLE FIELD
========================================================= */

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">

      <span className="text-sm text-gray-700">
        {label}
      </span>

      <button
        type="button"
        onClick={() =>
          onChange(!checked)
        }
        className={`relative h-6 w-11 rounded-full transition ${
          checked
            ? 'bg-gray-900'
            : 'bg-gray-300'
        }`}
      >

        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked
              ? 'left-6'
              : 'left-1'
          }`}
        />

      </button>

    </label>
  );
}

/* =========================================================
   MODAL BUTTONS
========================================================= */

function ModalButtons({
  loading,
  submitText,
  onCancel,
}: {
  loading: boolean;
  submitText: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-3 border-t pt-5">

      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading && (
          <Loader2
            size={15}
            className="animate-spin"
          />
        )}

        {submitText}
      </button>

    </div>
  );
}
