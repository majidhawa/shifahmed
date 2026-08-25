'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  UserPlus,
  Users,
  ShieldCheck,
  GraduationCap,
  UserRound,
  Loader2,
  Trash2,
  Edit3,
  X,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type UserRole =
  | 'admin'
  | 'lecturer'
  | 'parent';

type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at?: string;
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
};

const initialForm: FormData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'lecturer',
};

/* =========================================================
   PAGE
========================================================= */

export default function ManageUsersPage() {
  const [users, setUsers] =
    useState<User[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [showModal, setShowModal] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [form, setForm] =
    useState<FormData>(initialForm);

  /* =====================================================
     LOAD USERS
  ===================================================== */

  async function loadUsers() {
    try {
      setLoading(true);
      setError('');

      const response =
        await fetch(
          '/api/admin/users',
          {
            method: 'GET',
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
            'Unable to load users.'
        );
      }

      setUsers(
        Array.isArray(data.users)
          ? data.users
          : []
      );
    } catch (error) {
      console.error(
        'LOAD USERS ERROR:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load users.'
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadUsers();
  }, []);

  /* =====================================================
     OPEN ADD MODAL
  ===================================================== */

  function openAddModal() {
    setEditingUser(null);
    setForm({
      ...initialForm,
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  }

  /* =====================================================
     OPEN EDIT MODAL
  ===================================================== */

  function openEditModal(
    user: User
  ) {
    setEditingUser(user);

    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role,
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  }

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingUser(null);

    setForm({
      ...initialForm,
    });

    setError('');
    setSuccess('');
  }

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  function updateForm(
    field: keyof FormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* =====================================================
     SAVE USER
  ===================================================== */

  async function saveUser(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      /* =================================================
         VALIDATION
      ================================================= */

      if (!form.name.trim()) {
        throw new Error(
          'Full name is required.'
        );
      }

      if (!form.email.trim()) {
        throw new Error(
          'Email address is required.'
        );
      }

      if (
        !editingUser &&
        !form.password
      ) {
        throw new Error(
          'Password is required.'
        );
      }

      if (
        form.password &&
        form.password.length < 8
      ) {
        throw new Error(
          'Password must be at least 8 characters.'
        );
      }

      /* =================================================
         URL
      ================================================= */

      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';

      /* =================================================
         METHOD
      ================================================= */

      const method = editingUser
        ? 'PATCH'
        : 'POST';

      /* =================================================
         REQUEST BODY
      ================================================= */

      const body: any = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: form.role,
      };

      /*
       * Only send password when:
       * - creating a new user, or
       * - editing and entering a new password
       */
      if (
        !editingUser ||
        form.password.trim()
      ) {
        body.password =
          form.password.trim();
      }

      /* =================================================
         REQUEST
      ================================================= */

      const response =
        await fetch(
          url,
          {
            method,
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(body),
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
            'Unable to save user.'
        );
      }

      /* =================================================
         SUCCESS
      ================================================= */

      setSuccess(
        editingUser
          ? 'User updated successfully.'
          : 'User created successfully.'
      );

      await loadUsers();

      /* =================================================
         CLOSE MODAL
      ================================================= */

      setTimeout(() => {
        setShowModal(false);
        setEditingUser(null);
        setForm({
          ...initialForm,
        });
        setSuccess('');
      }, 700);
    } catch (error) {
      console.error(
        'SAVE USER ERROR:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to save user.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     DELETE USER
  ===================================================== */

  async function deleteUser(
    user: User
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete ${user.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(user.id);
      setError('');
      setSuccess('');

      const response =
        await fetch(
          `/api/admin/users/${user.id}`,
          {
            method: 'DELETE',
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
            'Unable to delete user.'
        );
      }

      setSuccess(
        'User deleted successfully.'
      );

      await loadUsers();
    } catch (error) {
      console.error(
        'DELETE USER ERROR:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to delete user.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =====================================================
     ROLE ICON
  ===================================================== */

  function RoleIcon({
    role,
  }: {
    role: UserRole;
  }) {
    if (role === 'admin') {
      return (
        <ShieldCheck className="h-4 w-4" />
      );
    }

    if (role === 'lecturer') {
      return (
        <GraduationCap className="h-4 w-4" />
      );
    }

    return (
      <UserRound className="h-4 w-4" />
    );
  }

  /* =====================================================
     ROLE LABEL
  ===================================================== */

  function roleLabel(
    role: UserRole
  ) {
    switch (role) {
      case 'admin':
        return 'Administrator';

      case 'lecturer':
        return 'Lecturer';

      case 'parent':
        return 'Parent';

      default:
        return role;
    }
  }

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalUsers =
    users.length;

  const adminCount =
    users.filter(
      (user) =>
        user.role === 'admin'
    ).length;

  const lecturerCount =
    users.filter(
      (user) =>
        user.role === 'lecturer'
    ).length;

  const parentCount =
    users.filter(
      (user) =>
        user.role === 'parent'
    ).length;

  const activeCount =
    users.filter(
      (user) => user.active
    ).length;

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold text-brand-dark sm:text-3xl">
              Manage Users
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Create and manage LMS accounts
              for administrators, lecturers
              and parents.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
          >
            <UserPlus className="h-4 w-4" />

            Add User
          </button>
        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green/10">
                <Users className="h-5 w-5 text-brand-green" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Total Users
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {totalUsers}
                </p>
              </div>

            </div>
          </div>

          {/* ADMINS */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Administrators
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {adminCount}
                </p>
              </div>

            </div>
          </div>

          {/* LECTURERS */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Lecturers
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {lecturerCount}
                </p>
              </div>

            </div>
          </div>

          {/* PARENTS */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50">
                <UserRound className="h-5 w-5 text-purple-600" />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Parents
                </p>

                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {parentCount}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* =================================================
            ACTIVE SUMMARY
        ================================================= */}

        {!loading && totalUsers > 0 && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-soft">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-bold text-brand-dark">
                  Account Status
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Currently active system accounts
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  {activeCount}
                </p>

                <p className="text-xs text-slate-500">
                  of {totalUsers} active
                </p>
              </div>

            </div>
          </div>
        )}

        {/* =================================================
            USERS TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">

          <div className="border-b border-slate-200 px-5 py-4">

            <h2 className="font-bold text-brand-dark">
              System Users
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Users stored in the LMS users table.
            </p>

          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">

              <div className="text-center">

                <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-green" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading users...
                </p>

              </div>

            </div>

          ) : users.length === 0 ? (

            /* EMPTY */

            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

              <Users className="h-12 w-12 text-slate-200" />

              <h3 className="mt-4 text-sm font-bold text-brand-dark">
                No users found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create your first LMS user.
              </p>

              <button
                type="button"
                onClick={openAddModal}
                className="mt-5 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                Add User
              </button>

            </div>

          ) : (

            /* TABLE */

            <div className="overflow-x-auto">

              <table className="min-w-[900px] w-full">

                <thead>

                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      User
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Role
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Phone
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {users.map(
                    (user) => (
                      <tr
                        key={user.id}
                        className="transition hover:bg-slate-50"
                      >

                        {/* USER */}

                        <td className="px-5 py-4">

                          <p className="text-sm font-bold text-brand-dark">
                            {user.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {user.email}
                          </p>

                        </td>

                        {/* ROLE */}

                        <td className="px-5 py-4">

                          <span
                            className={`
                              inline-flex items-center gap-1.5
                              rounded-full px-3 py-1
                              text-xs font-bold
                              ${
                                user.role ===
                                'admin'
                                  ? 'bg-green-50 text-green-700'
                                  : user.role ===
                                    'lecturer'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-purple-50 text-purple-700'
                              }
                            `}
                          >

                            <RoleIcon
                              role={
                                user.role
                              }
                            />

                            {roleLabel(
                              user.role
                            )}

                          </span>

                        </td>

                        {/* PHONE */}

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {user.phone ||
                            '—'}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`
                              inline-flex rounded-full
                              px-3 py-1 text-xs font-bold
                              ${
                                user.active
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }
                            `}
                          >
                            {user.active
                              ? 'Active'
                              : 'Inactive'}
                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  user
                                )
                              }
                              disabled={
                                deletingId !==
                                null
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-brand-green transition hover:border-brand-green/30 hover:bg-brand-green/5 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              <Edit3 className="h-3.5 w-3.5" />

                              Edit

                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                deleteUser(
                                  user
                                )
                              }
                              disabled={
                                deletingId ===
                                user.id
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              {deletingId ===
                              user.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}

                              {deletingId ===
                              user.id
                                ? 'Deleting...'
                                : 'Delete'}

                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>
      </div>

      {/* ===================================================
          ADD / EDIT USER MODAL
      =================================================== */}

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  {editingUser
                    ? 'Edit User'
                    : 'Add User'}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {editingUser
                    ? 'Update this LMS user account.'
                    : 'Create a new LMS user account.'}
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={saveUser}
              className="space-y-5 px-6 py-6"
            >

              {/* NAME */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Full Name *
                </label>

                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      'name',
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                  placeholder="Enter full name"
                />

              </div>

              {/* EMAIL */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email Address *
                </label>

                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    updateForm(
                      'email',
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                  placeholder="user@example.com"
                />

              </div>

              {/* PHONE */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateForm(
                      'phone',
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                  placeholder="07XXXXXXXX"
                />

              </div>

              {/* ROLE */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  User Role *
                </label>

                <select
                  required
                  value={form.role}
                  onChange={(event) =>
                    updateForm(
                      'role',
                      event.target
                        .value as UserRole
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                >
                  <option value="lecturer">
                    Lecturer
                  </option>

                  <option value="parent">
                    Parent
                  </option>

                </select>

              </div>

              {/* PASSWORD */}

              <div>

                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">

                  {editingUser
                    ? 'New Password'
                    : 'Password *'}

                </label>

                <input
                  type="password"
                  required={!editingUser}
                  value={form.password}
                  onChange={(event) =>
                    updateForm(
                      'password',
                      event.target.value
                    )
                  }
                  minLength={8}
                  autoComplete={
                    editingUser
                      ? 'new-password'
                      : 'new-password'
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                  placeholder={
                    editingUser
                      ? 'Leave blank to keep current password'
                      : 'Minimum 8 characters'
                  }
                />

                {editingUser && (
                  <p className="mt-2 text-xs text-slate-400">
                    Leave this field blank if
                    you do not want to change
                    the current password.
                  </p>
                )}

              </div>

              {/* ALERTS */}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {editingUser
                    ? 'Update User'
                    : 'Create User'}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}
    </div>
  );
}