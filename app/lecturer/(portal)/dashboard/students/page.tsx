'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  UserCheck,
  BookOpen,
  RefreshCw,
  Eye,
  GraduationCap,
} from 'lucide-react';

type Student = {
  id: number | string;
  name: string;
  admission_number?: string | null;
  email?: string | null;
  phone?: string | null;
  course?: string | null;
  status?: string | null;
};

export default function LecturerStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/lecturer/students', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to load students (${response.status})`);
      }

      const data = await response.json();

      setStudents(
        Array.isArray(data)
          ? data
          : Array.isArray(data.students)
            ? data.students
            : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load students.'
      );

      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const courses = useMemo(() => {
    return Array.from(
      new Set(
        students
          .map((student) => student.course)
          .filter(Boolean)
      )
    ) as string[];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        student.name?.toLowerCase().includes(query) ||
        student.admission_number
          ?.toLowerCase()
          .includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.phone?.toLowerCase().includes(query);

      const matchesCourse =
        courseFilter === 'all' ||
        student.course === courseFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (student.status || 'Active').toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [students, search, courseFilter, statusFilter]);

  const totalStudents = students.length;

  const activeStudents = students.filter(
    (student) =>
      (student.status || 'Active').toLowerCase() === 'active'
  ).length;

  const inactiveStudents = students.filter(
    (student) =>
      (student.status || '').toLowerCase() === 'inactive'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-brand-green/10 p-3 text-brand-green">
                <Users size={26} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  My Students
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  View students assigned to your courses.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadStudents}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-green/20 hover:bg-brand-green/5 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Total Students"
            value={totalStudents}
            icon={<Users size={22} />}
          />

          <StatCard
            title="Active Students"
            value={activeStudents}
            icon={<UserCheck size={22} />}
          />

          <StatCard
            title="My Courses"
            value={courses.length}
            icon={<BookOpen size={22} />}
          />

          <StatCard
            title="Inactive Students"
            value={inactiveStudents}
            icon={<GraduationCap size={22} />}
          />

        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/10"
              />
            </div>

            {/* Course */}
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/10"
            >
              <option value="all">All Courses</option>

              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/10"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Students */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">
                Students
              </h2>

              <p className="text-sm text-slate-500">
                {filteredStudents.length} student
                {filteredStudents.length === 1 ? '' : 's'} found
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <RefreshCw
                  size={30}
                  className="mx-auto animate-spin text-brand-green"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading students...
                </p>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full bg-brand-green/10 p-4">
                <Users size={28} className="text-brand-green" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No students found
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                There are no students matching your current search
                or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">

                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Student
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Admission No.
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Course
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Contact
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredStudents.map((student) => {
                    const status =
                      student.status || 'Active';

                    const isActive =
                      status.toLowerCase() === 'active';

                    return (
                      <tr
                        key={student.id}
                        className="transition hover:bg-brand-green/5"
                      >

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/10 font-bold text-brand-green">
                              {student.name
                                ?.charAt(0)
                                .toUpperCase() || 'S'}
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

                        <td className="px-5 py-4 text-sm font-medium text-slate-700">
                          {student.admission_number || '—'}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-brand-green/10 px-3 py-1.5 text-xs font-semibold text-brand-green">
                            {student.course || '—'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {student.phone || '—'}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/lecturer/dashboard/students/${student.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-green/20 hover:bg-brand-green/10 hover:text-brand-green"
                          >
                            <Eye size={15} />
                            View
                          </Link>
                        </td>

                      </tr>
                    );
                  })}

                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-green/20 hover:shadow-md">
      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
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

