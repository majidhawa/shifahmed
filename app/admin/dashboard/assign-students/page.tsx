'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Loader2,
  Search,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Student = {
  id: number;
  application_id: number;

  full_name: string;
  email: string;

  application_number?: string;
  admission_number?: string;

  course?: string;
  intake?: string;

  application_status?: string;
  payment_status?: string;
};

type Program = {
  id: number;
  name: string;
};

type Lecturer = {
  id: number;
  name: string;
  email: string;
};

type LecturerProgram = {
  id: number;
  lecturer_id: number;
  program_id: number;

  assigned_at?: string;
  updated_at?: string;

  lecturer_name: string;
  lecturer_email: string;

  program_name: string;
};

type Enrollment = {
  id: number;

  application_id: number;
  program_id: number;

  term_id?: number | null;
  student_number?: string;
  year_of_study?: number | null;

  /*
   * IMPORTANT:
   * This is the exact field returned by the API/database.
   */
  enrollment_status?: string;

  enrolled_at?: string;
  completed_at?: string;
  updated_at?: string;

  lecturer_id?: number | null;

  program_name?: string;

  lecturer_name?: string;
  lecturer_email?: string;
};

type LecturerAssignment = {
  id: number;

  lecturer_id: number;
  application_id: number;
  program_id: number;

  assigned_at?: string;
  updated_at?: string;

  lecturer_name?: string;
  lecturer_email?: string;

  program_name?: string;
};

type ApiResponse = {
  success: boolean;

  error?: string;
  message?: string;

  students?: Student[];
  programs?: Program[];
  lecturers?: Lecturer[];

  lecturerPrograms?: LecturerProgram[];

  enrollments?: Enrollment[];

  lecturerAssignments?: LecturerAssignment[];
};

/* =========================================================
   MAIN PAGE
========================================================= */

export default function AdminAssignStudentsPage() {
  const [students, setStudents] =
    useState<Student[]>([]);

  const [programs, setPrograms] =
    useState<Program[]>([]);

  const [lecturers, setLecturers] =
    useState<Lecturer[]>([]);

  const [lecturerPrograms, setLecturerPrograms] =
    useState<LecturerProgram[]>([]);

  const [enrollments, setEnrollments] =
    useState<Enrollment[]>([]);

  const [lecturerAssignments, setLecturerAssignments] =
    useState<LecturerAssignment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [programFilter, setProgramFilter] =
    useState('all');

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [selectedLecturer, setSelectedLecturer] =
    useState('');

  const [selectedProgram, setSelectedProgram] =
    useState('');

  const [showAssignModal, setShowAssignModal] =
    useState(false);

  /* =====================================================
     LOAD DATA
  ===================================================== */

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        '/api/admin/assign-students',
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const data: ApiResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            'Failed to load assignment data.'
        );
      }

      setStudents(
        data.students || []
      );

      setPrograms(
        data.programs || []
      );

      setLecturers(
        data.lecturers || []
      );

      setLecturerPrograms(
        data.lecturerPrograms || []
      );

      setEnrollments(
        data.enrollments || []
      );

      setLecturerAssignments(
        data.lecturerAssignments || []
      );
    } catch (err) {
      console.error(
        'Failed to load assignment data:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load assignment data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =====================================================
     CURRENT ENROLLMENT

     IMPORTANT:
     Match using application_id.

     The API returns:
       application_id
       program_id
       program_name
       enrollment_status
  ===================================================== */

  const getStudentEnrollment = (
    applicationId: number
  ): Enrollment | undefined => {
    return enrollments.find(
      (item) =>
        Number(item.application_id) ===
          Number(applicationId) &&
        String(
          item.enrollment_status || ''
        ).toLowerCase() !== 'inactive'
    );
  };

  /* =====================================================
     CURRENT LECTURER ASSIGNMENT
  ===================================================== */

  const getStudentLecturer = (
    applicationId: number
  ): LecturerAssignment | undefined => {
    return lecturerAssignments.find(
      (item) =>
        Number(item.application_id) ===
        Number(applicationId)
    );
  };

  /* =====================================================
     FILTER STUDENTS
  ===================================================== */

  const filteredStudents = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        String(
          student.full_name || ''
        )
          .toLowerCase()
          .includes(query) ||
        String(
          student.email || ''
        )
          .toLowerCase()
          .includes(query) ||
        String(
          student.course || ''
        )
          .toLowerCase()
          .includes(query) ||
        String(
          student.application_number || ''
        )
          .toLowerCase()
          .includes(query) ||
        String(
          student.admission_number || ''
        )
          .toLowerCase()
          .includes(query);

      if (!matchesSearch) {
        return false;
      }

      if (programFilter === 'all') {
        return true;
      }

      const enrollment =
        getStudentEnrollment(
          student.application_id
        );

      return (
        String(
          enrollment?.program_id || ''
        ) === programFilter
      );
    });
  }, [
    students,
    search,
    programFilter,
    enrollments,
  ]);

  /* =====================================================
     OPEN ASSIGN MODAL
  ===================================================== */

  const openAssignModal = (
    student: Student
  ) => {
    const enrollment =
      getStudentEnrollment(
        student.application_id
      );

    const lecturer =
      getStudentLecturer(
        student.application_id
      );

    setSelectedStudent(student);

    /*
     * Existing lecturer
     */
    setSelectedLecturer(
      lecturer
        ? String(
            lecturer.lecturer_id
          )
        : ''
    );

    /*
     * Existing LMS program
     */
    setSelectedProgram(
      enrollment
        ? String(
            enrollment.program_id
          )
        : ''
    );

    setError('');
    setSuccess('');

    setShowAssignModal(true);
  };

  /* =====================================================
     AUTHORIZED PROGRAMS
  ===================================================== */

  const authorizedPrograms = useMemo(() => {
    if (!selectedLecturer) {
      return [];
    }

    const programsForLecturer =
      lecturerPrograms
        .filter(
          (item) =>
            String(
              item.lecturer_id
            ) === selectedLecturer
        )
        .map((item) => ({
          id: Number(
            item.program_id
          ),
          name:
            item.program_name,
        }));

    /*
     * Remove duplicates.
     */
    return programsForLecturer.filter(
      (program, index, array) =>
        array.findIndex(
          (item) =>
            item.id === program.id
        ) === index
    );
  }, [
    selectedLecturer,
    lecturerPrograms,
  ]);

  /* =====================================================
     AUTO SELECT PROGRAM

     If lecturer has exactly one authorized
     program, automatically select it.

     If lecturer has multiple programs,
     admin chooses.
  ===================================================== */

  useEffect(() => {
    if (!selectedLecturer) {
      setSelectedProgram('');
      return;
    }

    const currentProgramExists =
      authorizedPrograms.some(
        (program) =>
          String(program.id) ===
          selectedProgram
      );

    if (!currentProgramExists) {
      if (
        authorizedPrograms.length ===
        1
      ) {
        setSelectedProgram(
          String(
            authorizedPrograms[0].id
          )
        );
      } else {
        setSelectedProgram('');
      }
    }
  }, [
    selectedLecturer,
    authorizedPrograms,
    selectedProgram,
  ]);

  /* =====================================================
     ASSIGN STUDENT
  ===================================================== */

  const handleAssign = async () => {
    if (!selectedStudent) {
      setError(
        'Please select a student.'
      );
      return;
    }

    if (!selectedLecturer) {
      setError(
        'Please select a lecturer.'
      );
      return;
    }

    if (!selectedProgram) {
      setError(
        'Please select an authorized LMS program.'
      );
      return;
    }

    /*
     * Make sure lecturer is actually
     * authorized for selected program.
     */
    const lecturerIsAuthorized =
      authorizedPrograms.some(
        (program) =>
          String(program.id) ===
          selectedProgram
      );

    if (!lecturerIsAuthorized) {
      setError(
        'The selected lecturer is not authorized for this LMS program.'
      );
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        '/api/admin/assign-students',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            /*
             * IMPORTANT:
             * applications.id is the student
             * LMS enrollment key.
             */
            applicationId:
              Number(
                selectedStudent.application_id
              ),

            programId:
              Number(
                selectedProgram
              ),

            lecturerId:
              Number(
                selectedLecturer
              ),
          }),
        }
      );

      const data: ApiResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            'Failed to assign student.'
        );
      }

      /*
       * Close modal after successful save.
       */
      setShowAssignModal(false);

      /*
       * Show success message.
       */
      setSuccess(
        data.message ||
          'Student assigned successfully.'
      );

      /*
       * Reload fresh database data.
       */
      await loadData();
    } catch (err) {
      console.error(
        'Student assignment failed:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to assign student.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     REMOVE LECTURER
  ===================================================== */

  const removeLecturer = async (
    applicationId: number
  ) => {
    if (
      !window.confirm(
        'Remove the lecturer assignment for this student?'
      )
    ) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const response = await fetch(
        '/api/admin/assign-students',
        {
          method: 'DELETE',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            applicationId:
              Number(applicationId),

            type: 'lecturer',
          }),
        }
      );

      const data: ApiResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            'Failed to remove lecturer.'
        );
      }

      setSuccess(
        'Lecturer assignment removed successfully.'
      );

      await loadData();
    } catch (err) {
      console.error(
        'Failed to remove lecturer:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to remove lecturer.'
      );
    }
  };

  /* =====================================================
     STATISTICS
  ===================================================== */

  const assignedStudents =
    students.filter(
      (student) =>
        !!getStudentEnrollment(
          student.application_id
        )
    ).length;

  const lecturerAssignedStudents =
    students.filter(
      (student) =>
        !!getStudentLecturer(
          student.application_id
        )
    ).length;

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6">

          <div className="mb-2 flex items-center gap-2">

            <div className="rounded-xl bg-brand-green/10 p-2 text-brand-green">
              <UserCheck size={22} />
            </div>

            <span className="text-sm font-semibold uppercase tracking-wide text-brand-green">
              Admin LMS
            </span>

          </div>

          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Assign Students
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Assign approved students to lecturers and
            their authorized LMS programs.
          </p>

        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1 text-sm">
              {error}
            </div>

            <button
              onClick={() =>
                setError('')
              }
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>

          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">

            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1 text-sm">
              {success}
            </div>

            <button
              onClick={() =>
                setSuccess('')
              }
              className="rounded-lg p-1 hover:bg-green-100"
            >
              <X size={16} />
            </button>

          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            icon={<Users size={21} />}
            label="Approved Students"
            value={students.length}
          />

          <StatCard
            icon={<BookOpen size={21} />}
            label="LMS Programs"
            value={programs.length}
          />

          <StatCard
            icon={<GraduationCap size={21} />}
            label="Program Enrolled"
            value={assignedStudents}
          />

          <StatCard
            icon={<UserCheck size={21} />}
            label="Lecturer Assigned"
            value={
              lecturerAssignedStudents
            }
          />

        </div>

        {/* =================================================
            FILTER
        ================================================= */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 md:flex-row">

            <div className="relative flex-1">

              <Search
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search student name, email, course or application number..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/20"
              />

            </div>

            <div className="relative md:w-64">

              <select
                value={programFilter}
                onChange={(event) =>
                  setProgramFilter(
                    event.target.value
                  )
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              >

                <option value="all">
                  All Programs
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

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

            </div>

          </div>

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">

              <div className="flex flex-col items-center gap-3 text-slate-500">

                <Loader2
                  size={32}
                  className="animate-spin text-brand-green"
                />

                <p className="text-sm">
                  Loading students...
                </p>

              </div>

            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

              <div className="mb-3 rounded-full bg-slate-100 p-4">

                <Users
                  size={30}
                  className="text-slate-400"
                />

              </div>

              <h3 className="font-semibold text-slate-800">
                No students found
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                No approved students match your
                current search or program filter.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Applied Course
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      LMS Program
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Lecturer
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredStudents.map(
                    (student) => {

                      const enrollment =
                        getStudentEnrollment(
                          student.application_id
                        );

                      const lecturer =
                        getStudentLecturer(
                          student.application_id
                        );

                      return (
                        <tr
                          key={
                            student.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* STUDENT */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green/10 font-semibold text-brand-green">
                                {(
                                  student.full_name ||
                                  '?'
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">

                                <p className="truncate font-semibold text-slate-800">
                                  {
                                    student.full_name
                                  }
                                </p>

                                <p className="truncate text-xs text-slate-500">
                                  {
                                    student.email
                                  }
                                </p>

                                {student.application_number && (
                                  <p className="mt-0.5 text-[11px] text-slate-400">
                                    {
                                      student.application_number
                                    }
                                  </p>
                                )}

                              </div>

                            </div>

                          </td>

                          {/* COURSE */}

                          <td className="px-5 py-4">

                            <p className="text-sm font-medium text-slate-700">
                              {
                                student.course ||
                                'Not specified'
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                student.intake ||
                                'No intake'
                              }
                            </p>

                          </td>

                          {/* LMS PROGRAM */}

                          <td className="px-5 py-4">

                            {enrollment ? (
                              <div>

                                <span className="inline-flex rounded-full bg-brand-green/10 px-2.5 py-1 text-xs font-semibold text-brand-green">
                                  {
                                    enrollment.program_name ||
                                    'Program assigned'
                                  }
                                </span>

                                <p className="mt-1 text-xs font-medium text-green-600">
                                  {(
                                    enrollment.enrollment_status ||
                                    'active'
                                  )
                                    .charAt(0)
                                    .toUpperCase() +
                                    (
                                      enrollment.enrollment_status ||
                                      'active'
                                    ).slice(1)}
                                </p>

                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">
                                Not assigned
                              </span>
                            )}

                          </td>

                          {/* LECTURER */}

                          <td className="px-5 py-4">

                            {lecturer ? (
                              <div>

                                <p className="text-sm font-medium text-slate-700">
                                  {
                                    lecturer.lecturer_name ||
                                    'Lecturer assigned'
                                  }
                                </p>

                                <p className="text-xs text-slate-500">
                                  {
                                    lecturer.lecturer_email ||
                                    ''
                                  }
                                </p>

                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">
                                Not assigned
                              </span>
                            )}

                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                onClick={() =>
                                  openAssignModal(
                                    student
                                  )
                                }
                                className="rounded-lg bg-brand-green px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-green/90"
                              >
                                {enrollment ||
                                lecturer
                                  ? 'Manage'
                                  : 'Assign'}
                              </button>

                              {lecturer && (
                                <button
                                  onClick={() =>
                                    removeLecturer(
                                      student.application_id
                                    )
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                >
                                  Remove Lecturer
                                </button>
                              )}

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* =================================================
            ASSIGN MODAL
        ================================================= */}

        {showAssignModal &&
          selectedStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

              <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* MODAL HEADER */}

                <div className="flex items-start justify-between border-b border-slate-200 p-5">

                  <div>

                    <h2 className="text-lg font-bold text-slate-900">
                      Assign Student
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Select a lecturer and their
                      authorized LMS program.
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      setShowAssignModal(
                        false
                      )
                    }
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={20} />
                  </button>

                </div>

                {/* MODAL BODY */}

                <div className="space-y-5 p-5">

                  {/* STUDENT */}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                    <div className="mb-3 flex items-center justify-between">

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Student Information
                      </p>

                      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500">
                        Read-only
                      </span>

                    </div>

                    <div className="space-y-3">

                      <div>

                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Student Name
                        </p>

                        <div className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800">
                          {
                            selectedStudent.full_name
                          }
                        </div>

                      </div>

                      <div>

                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Email
                        </p>

                        <div className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
                          {
                            selectedStudent.email
                          }
                        </div>

                      </div>

                      <div>

                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Applied Course
                        </p>

                        <div className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand-green">
                          {
                            selectedStudent.course ||
                            'Not specified'
                          }
                        </div>

                      </div>

                    </div>

                  </div>

                  {/* LECTURER */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Lecturer
                    </label>

                    <select
                      value={
                        selectedLecturer
                      }
                      onChange={(
                        event
                      ) => {
                        setSelectedLecturer(
                          event.target.value
                        );

                        setSelectedProgram(
                          ''
                        );
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                    >

                      <option value="">
                        Select lecturer
                      </option>

                      {lecturers.map(
                        (
                          lecturer
                        ) => {

                          const count =
                            lecturerPrograms.filter(
                              (
                                item
                              ) =>
                                Number(
                                  item.lecturer_id
                                ) ===
                                Number(
                                  lecturer.id
                                )
                            ).length;

                          return (
                            <option
                              key={
                                lecturer.id
                              }
                              value={
                                lecturer.id
                              }
                            >
                              {
                                lecturer.name
                              }{' '}
                              —{' '}
                              {count}{' '}
                              {count ===
                              1
                                ? 'program'
                                : 'programs'}
                            </option>
                          );
                        }
                      )}

                    </select>

                    {lecturers.length ===
                      0 && (
                      <p className="mt-2 text-xs text-amber-600">
                        No lecturers with assigned
                        LMS programs were found.
                      </p>
                    )}

                  </div>

                  {/* LMS PROGRAM */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Authorized LMS Program
                    </label>

                    <select
                      value={
                        selectedProgram
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedProgram(
                          event.target.value
                        )
                      }
                      disabled={
                        !selectedLecturer ||
                        authorizedPrograms.length ===
                          0
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >

                      <option value="">
                        {!selectedLecturer
                          ? 'Select a lecturer first'
                          : authorizedPrograms.length ===
                              0
                          ? 'No authorized programs'
                          : 'Select authorized program'}
                      </option>

                      {authorizedPrograms.map(
                        (
                          program
                        ) => (
                          <option
                            key={
                              program.id
                            }
                            value={
                              program.id
                            }
                          >
                            {
                              program.name
                            }
                          </option>
                        )
                      )}

                    </select>

                    {selectedLecturer &&
                      authorizedPrograms.length >
                        0 && (
                        <div className="mt-2 rounded-lg bg-brand-green/5 p-3">

                          <p className="text-xs font-semibold text-brand-green">
                            Authorized programs for
                            this lecturer
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">

                            {authorizedPrograms.map(
                              (
                                program
                              ) => (
                                <span
                                  key={
                                    program.id
                                  }
                                  className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-brand-green ring-1 ring-brand-green/20"
                                >
                                  {
                                    program.name
                                  }
                                </span>
                              )
                            )}

                          </div>

                        </div>
                      )}

                    {selectedLecturer &&
                      authorizedPrograms.length ===
                        0 && (
                        <div className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                          This lecturer does not
                          currently have any programs
                          assigned in{' '}
                          <strong>
                            lms_lecturer_programs
                          </strong>
                          .
                        </div>
                      )}

                  </div>

                </div>

                {/* MODAL FOOTER */}

                <div className="flex gap-3 border-t border-slate-200 bg-slate-50 p-5">

                  <button
                    onClick={() =>
                      setShowAssignModal(
                        false
                      )
                    }
                    disabled={saving}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={
                      handleAssign
                    }
                    disabled={
                      saving ||
                      !selectedLecturer ||
                      !selectedProgram
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {saving && (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    )}

                    {saving
                      ? 'Saving...'
                      : 'Save Assignment'}

                  </button>

                </div>

              </div>

            </div>
          )}

      </div>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </p>

        </div>

        <div className="rounded-xl bg-brand-green/10 p-3 text-brand-green">
          {icon}
        </div>

      </div>

    </div>
  );
}

