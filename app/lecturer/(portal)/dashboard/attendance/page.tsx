'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Loader2,
  RefreshCw,
  Save,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';

type Program = {
  id: number;
  name: string;
  code?: string | null;
  level?: string | null;
};

type Unit = {
  id: number;
  program_id: number;
  code?: string | null;
  name: string;
  year_of_study?: number | null;
  term_number?: number | null;
  status?: string | null;
};

type Student = {
  id: number | string;
  name: string;
  admission_number?: string | null;
  student_number?: string | null;
  email?: string | null;
  phone?: string | null;
  course?: string | null;
  status?: string | null;
  application_id?: number | null;
  enrollment_id?: number | null;
  program?: {
    id?: number;
    name?: string | null;
    code?: string | null;
  } | null;
};

type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'excused';

type AttendanceRecord = {
  enrollment_id: number;
  status: AttendanceStatus;
  remarks?: string | null;
};

type AttendanceMap = Record<
  string,
  {
    status: AttendanceStatus;
    remarks: string;
  }
>;

export default function LecturerAttendancePage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [attendanceDate, setAttendanceDate] =
    useState(getToday());

  const [attendance, setAttendance] =
    useState<AttendanceMap>({});

  const [search, setSearch] = useState('');

  const [loadingPrograms, setLoadingPrograms] =
    useState(true);

  const [loadingUnits, setLoadingUnits] =
    useState(false);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [loadingAttendance, setLoadingAttendance] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* =====================================================
     LOAD PROGRAMS
  ===================================================== */

  const loadPrograms = async () => {
    try {
      setLoadingPrograms(true);
      setError('');

      const response = await fetch(
        '/api/lecturer/programs',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load programs (${response.status})`
        );
      }

      const data = await response.json();

      const programData = Array.isArray(data)
        ? data
        : Array.isArray(data.programs)
          ? data.programs
          : [];

      setPrograms(programData);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load programs.'
      );
    } finally {
      setLoadingPrograms(false);
    }
  };

  /* =====================================================
     LOAD UNITS
  ===================================================== */

  const loadUnits = async (programId: string) => {
    if (!programId) {
      setUnits([]);
      return;
    }

    try {
      setLoadingUnits(true);
      setError('');
      setUnits([]);
      setSelectedUnit('');

      const response = await fetch(
        `/api/lecturer/units?program_id=${encodeURIComponent(
          programId
        )}`,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load units (${response.status})`
        );
      }

      const data = await response.json();

      const unitData = Array.isArray(data)
        ? data
        : Array.isArray(data.units)
          ? data.units
          : [];

      setUnits(unitData);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load units.'
      );
    } finally {
      setLoadingUnits(false);
    }
  };

  /* =====================================================
     LOAD STUDENTS
  ===================================================== */

  const loadStudents = async () => {
    if (!selectedProgram) {
      setError('Please select a program.');
      return;
    }

    try {
      setLoadingStudents(true);
      setError('');
      setSuccess('');

      const response = await fetch(
        '/api/lecturer/students',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load students (${response.status})`
        );
      }

      const data = await response.json();

      const studentData: Student[] = Array.isArray(data)
        ? data
        : Array.isArray(data.students)
          ? data.students
          : [];

      const filtered = studentData.filter(
        (student) =>
          Number(student.program?.id) ===
          Number(selectedProgram)
      );

      setStudents(filtered);

      /*
       * Initialize every student as present.
       * Lecturer can change individual statuses.
       */
      const initialAttendance: AttendanceMap = {};

      filtered.forEach((student) => {
        const enrollmentId =
          student.enrollment_id || student.id;

        initialAttendance[String(enrollmentId)] = {
          status: 'present',
          remarks: '',
        };
      });

      setAttendance(initialAttendance);

      /*
       * If a unit has been selected, load existing attendance.
       */
      if (selectedUnit) {
        await loadExistingAttendance(
          selectedUnit,
          attendanceDate,
          filtered
        );
      }
    } catch (err) {
      console.error(err);

      setStudents([]);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load students.'
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  /* =====================================================
     LOAD EXISTING ATTENDANCE
  ===================================================== */

  const loadExistingAttendance = async (
    unitId: string,
    date: string,
    studentList: Student[] = students
  ) => {
    if (!unitId || !date) {
      return;
    }

    try {
      setLoadingAttendance(true);

      const response = await fetch(
        `/api/lecturer/attendance?unit_id=${encodeURIComponent(
          unitId
        )}&attendance_date=${encodeURIComponent(date)}`,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        /*
         * If the API doesn't yet return existing records,
         * don't prevent the lecturer from taking attendance.
         */
        return;
      }

      const data = await response.json();

      const records: AttendanceRecord[] =
        Array.isArray(data)
          ? data
          : Array.isArray(data.attendance)
            ? data.attendance
            : [];

      if (records.length === 0) {
        return;
      }

      const existing: AttendanceMap = {};

      studentList.forEach((student) => {
        const enrollmentId =
          student.enrollment_id || student.id;

        existing[String(enrollmentId)] = {
          status: 'present',
          remarks: '',
        };
      });

      records.forEach((record) => {
        existing[String(record.enrollment_id)] = {
          status: record.status,
          remarks: record.remarks || '',
        };
      });

      setAttendance(existing);
    } catch (err) {
      console.error(
        'LOAD EXISTING ATTENDANCE ERROR:',
        err
      );
    } finally {
      setLoadingAttendance(false);
    }
  };

  /* =====================================================
     EFFECTS
  ===================================================== */

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      loadUnits(selectedProgram);
      setStudents([]);
      setAttendance({});
    }
  }, [selectedProgram]);

  useEffect(() => {
    if (
      selectedUnit &&
      selectedProgram &&
      students.length > 0
    ) {
      loadExistingAttendance(
        selectedUnit,
        attendanceDate
      );
    }
  }, [selectedUnit, attendanceDate]);

  /* =====================================================
     FILTER STUDENTS
  ===================================================== */

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.name
          ?.toLowerCase()
          .includes(query) ||
        student.admission_number
          ?.toLowerCase()
          .includes(query) ||
        student.student_number
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [students, search]);

  /* =====================================================
     STATISTICS
  ===================================================== */

  const attendanceStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    students.forEach((student) => {
      const enrollmentId =
        student.enrollment_id || student.id;

      const status =
        attendance[String(enrollmentId)]?.status ||
        'present';

      if (status === 'present') present++;
      if (status === 'absent') absent++;
      if (status === 'late') late++;
      if (status === 'excused') excused++;
    });

    return {
      present,
      absent,
      late,
      excused,
      total: students.length,
    };
  }, [students, attendance]);

  /* =====================================================
     SET STATUS
  ===================================================== */

  const setStudentStatus = (
    student: Student,
    status: AttendanceStatus
  ) => {
    const enrollmentId =
      student.enrollment_id || student.id;

    setAttendance((previous) => ({
      ...previous,
      [String(enrollmentId)]: {
        status,
        remarks:
          previous[String(enrollmentId)]?.remarks || '',
      },
    }));
  };

  /* =====================================================
     SET REMARK
  ===================================================== */

  const setStudentRemark = (
    student: Student,
    remarks: string
  ) => {
    const enrollmentId =
      student.enrollment_id || student.id;

    setAttendance((previous) => ({
      ...previous,
      [String(enrollmentId)]: {
        status:
          previous[String(enrollmentId)]?.status ||
          'present',
        remarks,
      },
    }));
  };

  /* =====================================================
     MARK ALL
  ===================================================== */

  const markAll = (status: AttendanceStatus) => {
    const updated: AttendanceMap = {};

    students.forEach((student) => {
      const enrollmentId =
        student.enrollment_id || student.id;

      updated[String(enrollmentId)] = {
        status,
        remarks:
          attendance[String(enrollmentId)]?.remarks ||
          '',
      };
    });

    setAttendance(updated);
  };

  /* =====================================================
     SAVE ATTENDANCE
  ===================================================== */

  const saveAttendance = async () => {
    if (!selectedProgram) {
      setError('Please select a program.');
      return;
    }

    if (!selectedUnit) {
      setError('Please select a unit.');
      return;
    }

    if (!attendanceDate) {
      setError('Please select an attendance date.');
      return;
    }

    if (students.length === 0) {
      setError('There are no students to mark.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const records = students.map((student) => {
        const enrollmentId =
          student.enrollment_id || student.id;

        const record =
          attendance[String(enrollmentId)];

        return {
          enrollment_id: Number(enrollmentId),
          program_id: Number(selectedProgram),
          unit_id: Number(selectedUnit),
          attendance_date: attendanceDate,
          status: record?.status || 'present',
          remarks: record?.remarks || null,
        };
      });

      const response = await fetch(
        '/api/lecturer/attendance',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            program_id: Number(selectedProgram),
            unit_id: Number(selectedUnit),
            attendance_date: attendanceDate,
            records,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to save attendance (${response.status})`
        );
      }

      setSuccess(
        data?.message ||
          'Attendance saved successfully.'
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save attendance.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     SELECTED PROGRAM / UNIT
  ===================================================== */

  const selectedProgramData = programs.find(
    (program) =>
      String(program.id) === selectedProgram
  );

  const selectedUnitData = units.find(
    (unit) =>
      String(unit.id) === selectedUnit
  );

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-green/10 p-3 text-brand-green">
              <ClipboardCheck size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Attendance
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Record and manage attendance for your
                students.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              loadPrograms();

              if (selectedProgram) {
                loadUnits(selectedProgram);
              }

              if (selectedProgram) {
                loadStudents();
              }
            }}
            disabled={
              loadingPrograms ||
              loadingUnits ||
              loadingStudents
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-green/20 hover:bg-brand-green/5 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                loadingPrograms ||
                loadingUnits ||
                loadingStudents
                  ? 'animate-spin'
                  : ''
              }
            />
            Refresh
          </button>
        </div>

        {/* =================================================
            ERROR / SUCCESS
        ================================================= */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <X size={18} className="mt-0.5 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{success}</span>
          </div>
        )}

        {/* =================================================
            SELECTION PANEL
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-brand-green/10 p-2.5 text-brand-green">
              <CalendarDays size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Attendance Setup
              </h2>

              <p className="text-sm text-slate-500">
                Select the program, unit and date.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* PROGRAM */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Program
              </label>

              <div className="relative">
                <select
                  value={selectedProgram}
                  onChange={(e) =>
                    setSelectedProgram(
                      e.target.value
                    )
                  }
                  disabled={loadingPrograms}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {loadingPrograms
                      ? 'Loading programs...'
                      : 'Select program'}
                  </option>

                  {programs.map((program) => (
                    <option
                      key={program.id}
                      value={program.id}
                    >
                      {program.name}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {/* UNIT */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Unit
              </label>

              <div className="relative">
                <select
                  value={selectedUnit}
                  onChange={(e) =>
                    setSelectedUnit(
                      e.target.value
                    )
                  }
                  disabled={
                    !selectedProgram ||
                    loadingUnits
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {!selectedProgram
                      ? 'Select program first'
                      : loadingUnits
                        ? 'Loading units...'
                        : 'Select unit'}
                  </option>

                  {units.map((unit) => (
                    <option
                      key={unit.id}
                      value={unit.id}
                    >
                      {unit.code
                        ? `${unit.code} — ${unit.name}`
                        : unit.name}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {/* DATE */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Attendance Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) =>
                    setAttendanceDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/10"
                />
              </div>
            </div>

          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={loadStudents}
              disabled={
                !selectedProgram ||
                loadingStudents
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingStudents ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Users size={18} />
              )}

              Load Students
            </button>
          </div>
        </div>

        {/* =================================================
            SELECTED COURSE SUMMARY
        ================================================= */}

        {(selectedProgramData ||
          selectedUnitData) && (
          <div className="rounded-2xl border border-brand-green/10 bg-brand-green/5 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-green">
                  Current Attendance
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {selectedProgramData?.name ||
                    'Program'}
                </h2>

                {selectedUnitData && (
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedUnitData.code
                      ? `${selectedUnitData.code} — `
                      : ''}
                    {selectedUnitData.name}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
                <CalendarDays
                  size={18}
                  className="text-brand-green"
                />

                <span className="text-sm font-semibold text-slate-700">
                  {formatDate(attendanceDate)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        {students.length > 0 && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

            <AttendanceStat
              title="Present"
              value={attendanceStats.present}
              icon={<UserCheck size={20} />}
              className="bg-green-50 text-green-700 border-green-100"
            />

            <AttendanceStat
              title="Absent"
              value={attendanceStats.absent}
              icon={<UserX size={20} />}
              className="bg-red-50 text-red-700 border-red-100"
            />

            <AttendanceStat
              title="Late"
              value={attendanceStats.late}
              icon={<Clock3 size={20} />}
              className="bg-amber-50 text-amber-700 border-amber-100"
            />

            <AttendanceStat
              title="Excused"
              value={attendanceStats.excused}
              icon={<ClipboardCheck size={20} />}
              className="bg-brand-green/5 text-brand-green border-brand-green/10"
            />

          </div>
        )}

        {/* =================================================
            STUDENT ATTENDANCE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="font-bold text-slate-900">
                Student Attendance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {students.length > 0
                  ? `${students.length} student${
                      students.length === 1
                        ? ''
                        : 's'
                    } enrolled`
                  : 'Load students to take attendance.'}
              </p>
            </div>

            {students.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    markAll('present')
                  }
                  className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                >
                  Mark All Present
                </button>

                <button
                  type="button"
                  onClick={() =>
                    markAll('absent')
                  }
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Mark All Absent
                </button>
              </div>
            )}
          </div>

          {/* SEARCH */}

          {students.length > 0 && (
            <div className="border-b border-slate-100 p-4">
              <div className="relative max-w-md">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search student..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/10"
                />
              </div>
            </div>
          )}

          {loadingStudents ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={34}
                  className="mx-auto animate-spin text-brand-green"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading students...
                </p>
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full bg-brand-green/10 p-5">
                <Users
                  size={30}
                  className="text-brand-green"
                />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No students loaded
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Select a program and click
                <span className="font-semibold">
                  {' '}
                  Load Students
                </span>{' '}
                to begin taking attendance.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex min-h-[250px] items-center justify-center px-6 text-center">
              <div>
                <Search
                  size={28}
                  className="mx-auto text-slate-400"
                />

                <h3 className="mt-3 font-semibold text-slate-900">
                  No students found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try a different search term.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">

                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Student
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Admission No.
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Student Number
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Attendance
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredStudents.map(
                    (student) => {
                      const enrollmentId =
                        student.enrollment_id ||
                        student.id;

                      const record =
                        attendance[
                          String(enrollmentId)
                        ];

                      const status =
                        record?.status ||
                        'present';

                      return (
                        <tr
                          key={student.id}
                          className="transition hover:bg-brand-green/5"
                        >

                          {/* STUDENT */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-green/10 font-bold text-brand-green">
                                {student.name
                                  ?.charAt(0)
                                  .toUpperCase() ||
                                  'S'}
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {student.name}
                                </p>

                                {student.email && (
                                  <p className="text-xs text-slate-500">
                                    {student.email}
                                  </p>
                                )}
                              </div>

                            </div>
                          </td>

                          {/* ADMISSION */}

                          <td className="px-5 py-4 text-sm font-medium text-slate-700">
                            {student.admission_number ||
                              '—'}
                          </td>

                          {/* STUDENT NUMBER */}

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {student.student_number ||
                              '—'}
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">

                              <AttendanceButton
                                label="Present"
                                active={
                                  status ===
                                  'present'
                                }
                                type="present"
                                onClick={() =>
                                  setStudentStatus(
                                    student,
                                    'present'
                                  )
                                }
                              />

                              <AttendanceButton
                                label="Absent"
                                active={
                                  status ===
                                  'absent'
                                }
                                type="absent"
                                onClick={() =>
                                  setStudentStatus(
                                    student,
                                    'absent'
                                  )
                                }
                              />

                              <AttendanceButton
                                label="Late"
                                active={
                                  status ===
                                  'late'
                                }
                                type="late"
                                onClick={() =>
                                  setStudentStatus(
                                    student,
                                    'late'
                                  )
                                }
                              />

                              <AttendanceButton
                                label="Excused"
                                active={
                                  status ===
                                  'excused'
                                }
                                type="excused"
                                onClick={() =>
                                  setStudentStatus(
                                    student,
                                    'excused'
                                  )
                                }
                              />

                            </div>
                          </td>

                          {/* REMARKS */}

                          <td className="px-5 py-4">
                            <input
                              type="text"
                              value={
                                record?.remarks ||
                                ''
                              }
                              onChange={(e) =>
                                setStudentRemark(
                                  student,
                                  e.target.value
                                )
                              }
                              placeholder="Optional..."
                              className="w-full min-w-[180px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/10"
                            />
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>
              </table>
            </div>
          )}

          {/* =================================================
              SAVE BAR
          ================================================= */}

          {students.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {students.length}
                </span>{' '}
                students ready for attendance.
              </div>

              <button
                type="button"
                onClick={saveAttendance}
                disabled={
                  saving ||
                  !selectedProgram ||
                  !selectedUnit
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={18} />
                )}

                {saving
                  ? 'Saving Attendance...'
                  : 'Save Attendance'}
              </button>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   ATTENDANCE BUTTON
========================================================= */

function AttendanceButton({
  label,
  active,
  type,
  onClick,
}: {
  label: string;
  active: boolean;
  type: AttendanceStatus;
  onClick: () => void;
}) {
  const styles: Record<
    AttendanceStatus,
    string
  > = {
    present:
      'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
    absent:
      'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    late:
      'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    excused:
      'border-brand-green/20 bg-brand-green/5 text-brand-green hover:bg-brand-green/10',
  };

  const activeStyles: Record<
    AttendanceStatus,
    string
  > = {
    present:
      'border-green-600 bg-green-600 text-white',
    absent:
      'border-red-600 bg-red-600 text-white',
    late:
      'border-amber-500 bg-amber-500 text-white',
    excused:
      'border-brand-green bg-brand-green text-white',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
        active
          ? activeStyles[type]
          : styles[type]
      }`}
    >
      {label}
    </button>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function AttendanceStat({
  title,
  value,
  icon,
  className,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-white/70 p-2.5">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DATE HELPERS
========================================================= */

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  if (!value) return '—';

  const date = new Date(
    `${value}T00:00:00`
  );

  return date.toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}