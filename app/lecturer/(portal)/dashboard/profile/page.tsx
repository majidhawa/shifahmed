'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  UserCircle,
  Mail,
  Phone,
  ShieldCheck,
  BadgeCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  Pencil,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Save,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Lecturer = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ApiResponse = {
  success?: boolean;
  lecturer?: Lecturer;
  message?: string;
};

/* =========================================================
   HELPERS
========================================================= */

function getInitials(
  name: string
) {
  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (words.length === 0) {
    return 'L';
  }

  if (words.length === 1) {
    return words[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    words[0].charAt(0) +
    words[words.length - 1].charAt(0)
  ).toUpperCase();
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return 'Not available';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Not available';
  }

  return date.toLocaleDateString(
    'en-KE',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
}

function formatRole(
  role?: string | null
) {
  if (!role) {
    return 'Lecturer';
  }

  return role
    .replace(/[_-]+/g, ' ')
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

/* =========================================================
   PAGE
========================================================= */

export default function LecturerProfilePage() {
  const [lecturer, setLecturer] =
    useState<Lecturer | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [editOpen, setEditOpen] =
    useState(false);

  const [
    passwordOpen,
    setPasswordOpen,
  ] = useState(false);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState('');

  const [formError, setFormError] =
    useState('');

  /* =======================================================
     EDIT PROFILE FORM
  ======================================================== */

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [phone, setPhone] =
    useState('');

  /* =======================================================
     PASSWORD FORM
  ======================================================== */

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState('');

  const [
    newPassword,
    setNewPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  /* =======================================================
     LOAD PROFILE
  ======================================================== */

  const loadProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const response =
        await fetch(
          '/api/lecturer/profile',
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',

            headers: {
              'Cache-Control':
                'no-cache',
              Pragma: 'no-cache',
            },
          }
        );

      const data: ApiResponse =
        await response.json();

      if (
        response.status === 401
      ) {
        window.location.replace(
          '/lecturer/login'
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to load your profile.'
        );
      }

      if (
        !data.success ||
        !data.lecturer
      ) {
        throw new Error(
          data.message ||
            'Lecturer profile was not found.'
        );
      }

      setLecturer(
        data.lecturer
      );
    } catch (error) {
      console.error(
        'Lecturer profile error:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load your profile.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    loadProfile();
  }, []);

  /* =======================================================
     OPEN EDIT PROFILE
  ======================================================== */

  const openEditProfile = () => {
    if (!lecturer) {
      return;
    }

    setName(
      lecturer.name || ''
    );

    setEmail(
      lecturer.email || ''
    );

    setPhone(
      lecturer.phone || ''
    );

    setFormError('');
    setSuccessMessage('');
    setEditOpen(true);
  };

  /* =======================================================
     CLOSE EDIT PROFILE
  ======================================================== */

  const closeEditProfile = () => {
    if (savingProfile) {
      return;
    }

    setEditOpen(false);
    setFormError('');
  };

  /* =======================================================
     UPDATE PROFILE
  ======================================================== */

  const handleProfileSubmit =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (savingProfile) {
        return;
      }

      setFormError('');
      setSuccessMessage('');

      const cleanName =
        name.trim();

      const cleanEmail =
        email.trim().toLowerCase();

      const cleanPhone =
        phone.trim();

      if (!cleanName) {
        setFormError(
          'Please enter your full name.'
        );

        return;
      }

      if (cleanName.length < 2) {
        setFormError(
          'Your name must contain at least 2 characters.'
        );

        return;
      }

      if (!cleanEmail) {
        setFormError(
          'Please enter your email address.'
        );

        return;
      }

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          cleanEmail
        )
      ) {
        setFormError(
          'Please enter a valid email address.'
        );

        return;
      }

      setSavingProfile(true);

      try {
        const response =
          await fetch(
            '/api/lecturer/profile',
            {
              method: 'PATCH',
              credentials: 'include',
              cache: 'no-store',

              headers: {
                'Content-Type':
                  'application/json',
                'Cache-Control':
                  'no-cache',
              },

              body: JSON.stringify({
                name: cleanName,
                email: cleanEmail,
                phone: cleanPhone,
              }),
            }
          );

        const data: ApiResponse =
          await response.json();

        if (
          response.status === 401
        ) {
          window.location.replace(
            '/lecturer/login'
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Unable to update your profile.'
          );
        }

        if (
          !data.success ||
          !data.lecturer
        ) {
          throw new Error(
            data.message ||
              'Profile update failed.'
          );
        }

        setLecturer(
          data.lecturer
        );

        setEditOpen(false);

        setSuccessMessage(
          'Your profile has been updated successfully.'
        );
      } catch (error) {
        console.error(
          'Update profile error:',
          error
        );

        setFormError(
          error instanceof Error
            ? error.message
            : 'Unable to update your profile.'
        );
      } finally {
        setSavingProfile(false);
      }
    };

  /* =======================================================
     OPEN PASSWORD
  ======================================================== */

  const openPasswordChange =
    () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setFormError('');
      setSuccessMessage('');

      setPasswordOpen(true);
    };

  /* =======================================================
     CLOSE PASSWORD
  ======================================================== */

  const closePasswordChange =
    () => {
      if (changingPassword) {
        return;
      }

      setPasswordOpen(false);
      setFormError('');
    };

  /* =======================================================
     CHANGE PASSWORD
  ======================================================== */

  const handlePasswordSubmit =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (changingPassword) {
        return;
      }

      setFormError('');
      setSuccessMessage('');

      if (!currentPassword) {
        setFormError(
          'Please enter your current password.'
        );

        return;
      }

      if (!newPassword) {
        setFormError(
          'Please enter your new password.'
        );

        return;
      }

      if (newPassword.length < 8) {
        setFormError(
          'Your new password must be at least 8 characters long.'
        );

        return;
      }

      if (!confirmPassword) {
        setFormError(
          'Please confirm your new password.'
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setFormError(
          'The new passwords do not match.'
        );

        return;
      }

      if (
        currentPassword ===
        newPassword
      ) {
        setFormError(
          'Your new password must be different from your current password.'
        );

        return;
      }

      setChangingPassword(true);

      try {
        const response =
          await fetch(
            '/api/lecturer/profile',
            {
              method: 'POST',
              credentials: 'include',
              cache: 'no-store',

              headers: {
                'Content-Type':
                  'application/json',
                'Cache-Control':
                  'no-cache',
              },

              body: JSON.stringify({
                currentPassword,
                newPassword,
                confirmPassword,
              }),
            }
          );

        const data: ApiResponse =
          await response.json();

        if (
          response.status === 401
        ) {
          /*
           * 401 can mean either:
           * - session expired
           * - current password incorrect
           *
           * The API message lets us distinguish them.
           */

          if (
            data.message?.includes(
              'current password'
            )
          ) {
            throw new Error(
              data.message
            );
          }

          window.location.replace(
            '/lecturer/login'
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Unable to change your password.'
          );
        }

        setPasswordOpen(false);

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setSuccessMessage(
          'Your password has been changed successfully.'
        );
      } catch (error) {
        console.error(
          'Change password error:',
          error
        );

        setFormError(
          error instanceof Error
            ? error.message
            : 'Unable to change your password.'
        );
      } finally {
        setChangingPassword(false);
      }
    };

  /* =======================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green/10">
              <Loader2 className="h-7 w-7 animate-spin text-brand-green" />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Loading your profile...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Please wait a moment.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================== */

  if (
    error ||
    !lecturer
  ) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Unable to Load Profile
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ||
                'We could not retrieve your lecturer profile.'}
            </p>

            <button
              type="button"
              onClick={loadProfile}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     PROFILE DATA
  ======================================================== */

  const lecturerName =
    lecturer.name?.trim() ||
    'Lecturer';

  const lecturerEmail =
    lecturer.email?.trim() ||
    'Not provided';

  const lecturerPhone =
    lecturer.phone?.trim() ||
    'Not provided';

  const lecturerRole =
    formatRole(
      lecturer.role
    );

  const initials =
    getInitials(
      lecturerName
    );

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50">

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand-green">
              <UserCircle className="h-4 w-4" />
              Lecturer Account
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              My Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage your lecturer account information.
            </p>
          </div>

          <Link
            href="/lecturer/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-green/30 hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

        </div>

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <div className="flex-1">
              <p className="text-sm font-bold">
                Success
              </p>

              <p className="mt-0.5 text-sm">
                {successMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage('')
              }
              className="rounded-lg p-1 transition hover:bg-emerald-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* =================================================
            PROFILE HERO
        ================================================= */}

        <section className="overflow-hidden rounded-3xl bg-brand-dark shadow-xl">

          <div className="relative px-5 py-8 sm:px-8 sm:py-10">

            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-green/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-brand-gold/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">

              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white text-2xl font-bold text-brand-green shadow-xl ring-4 ring-white/10 sm:h-28 sm:w-28 sm:text-3xl">
                {initials}
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex flex-wrap items-center gap-2">

                  <h2 className="text-2xl font-bold text-white sm:text-3xl">
                    {lecturerName}
                  </h2>

                  {lecturer.active !== false && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  )}

                </div>

                <p className="mt-2 text-sm font-medium text-white/60">
                  {lecturerRole}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">

                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-medium text-white/70">
                    <GraduationCap className="h-4 w-4 text-brand-gold" />
                    Shifah Medical Training College
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-medium text-white/70">
                    <ShieldCheck className="h-4 w-4 text-brand-gold" />
                    Lecturer Account
                  </span>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          <button
            type="button"
            onClick={openEditProfile}
            className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-green/30 hover:shadow-md"
          >
            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10">
                <Pencil className="h-5 w-5 text-brand-green" />
              </div>

              <div className="min-w-0">
                <h3 className="font-bold text-slate-900">
                  Edit Profile
                </h3>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Update your name, email address and phone number.
                </p>
              </div>

            </div>
          </button>

          <button
            type="button"
            onClick={openPasswordChange}
            className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-gold/40 hover:shadow-md"
          >
            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gold/10">
                <LockKeyhole className="h-5 w-5 text-brand-gold" />
              </div>

              <div className="min-w-0">
                <h3 className="font-bold text-slate-900">
                  Change Password
                </h3>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Change your lecturer LMS login password securely.
                </p>
              </div>

            </div>
          </button>

        </div>

        {/* =================================================
            INFORMATION
        ================================================= */}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          <section className="lg:col-span-2">

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Personal Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your current lecturer account details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openEditProfile}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-green/30 hover:text-brand-green"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>

              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

                {/* NAME */}

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">
                      <UserCircle className="h-5 w-5 text-brand-green" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Full Name
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-slate-800">
                        {lecturerName}
                      </p>
                    </div>

                  </div>
                </div>

                {/* EMAIL */}

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">
                      <Mail className="h-5 w-5 text-brand-green" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Email Address
                      </p>

                      <p className="mt-1 truncate text-sm font-bold text-slate-800">
                        {lecturerEmail}
                      </p>
                    </div>

                  </div>
                </div>

                {/* PHONE */}

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">
                      <Phone className="h-5 w-5 text-brand-green" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Phone Number
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {lecturerPhone}
                      </p>
                    </div>

                  </div>
                </div>

                {/* ROLE */}

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">
                      <BadgeCheck className="h-5 w-5 text-brand-green" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Account Role
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {lecturerRole}
                      </p>
                    </div>

                  </div>
                </div>

              </div>

            </div>

          </section>

          {/* ACCOUNT STATUS */}

          <section>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 px-5 py-5">

                <h2 className="text-lg font-bold text-slate-900">
                  Account Status
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Account and access information.
                </p>

              </div>

              <div className="space-y-4 p-5">

                <div className="rounded-2xl bg-slate-50 p-4">

                  <div className="flex items-center justify-between gap-3">

                    <span className="text-sm font-semibold text-slate-600">
                      Status
                    </span>

                    {lecturer.active !== false ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                        Inactive
                      </span>
                    )}

                  </div>

                </div>

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Account ID
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-800">
                    #{lecturer.id}
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Member Since
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatDate(
                      lecturer.created_at
                    )}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    Profile information is managed securely through the LMS.
                  </p>

                </div>

              </div>

            </div>

          </section>

        </div>

        {/* =================================================
            SECURITY NOTICE
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-brand-green/10 bg-brand-green/5 p-5 sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <ShieldCheck className="h-5 w-5 text-brand-green" />
            </div>

            <div>

              <h3 className="font-bold text-slate-900">
                Keep Your Account Secure
              </h3>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Never share your lecturer login credentials with another
                person. Use a strong password and always sign out of the
                LMS when using a shared or public computer.
              </p>

            </div>

          </div>

        </section>

      </div>

      {/* ===================================================
          EDIT PROFILE MODAL
      ==================================================== */}

      {editOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div
            className="absolute inset-0"
            onClick={closeEditProfile}
          />

          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Edit Profile
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update your personal information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditProfile}
                disabled={savingProfile}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <form
              onSubmit={
                handleProfileSubmit
              }
            >

              <div className="space-y-5 p-5 sm:p-6">

                {formError && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">

                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <p className="text-sm font-medium">
                      {formError}
                    </p>

                  </div>
                )}

                {/* NAME */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>

                  <div className="relative">

                    <UserCircle className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value
                        )
                      }
                      disabled={
                        savingProfile
                      }
                      autoComplete="name"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 disabled:bg-slate-50"
                      placeholder="Enter your full name"
                    />

                  </div>
                </div>

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>

                  <div className="relative">

                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      disabled={
                        savingProfile
                      }
                      autoComplete="email"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 disabled:bg-slate-50"
                      placeholder="Enter your email address"
                    />

                  </div>
                </div>

                {/* PHONE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Phone Number
                  </label>

                  <div className="relative">

                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(
                          event.target.value
                        )
                      }
                      disabled={
                        savingProfile
                      }
                      autoComplete="tel"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 disabled:bg-slate-50"
                      placeholder="Enter your phone number"
                    />

                  </div>
                </div>

              </div>

              {/* FOOTER */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">

                <button
                  type="button"
                  onClick={
                    closeEditProfile
                  }
                  disabled={
                    savingProfile
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    savingProfile
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
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
      )}

      {/* ===================================================
          CHANGE PASSWORD MODAL
      ==================================================== */}

      {passwordOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div
            className="absolute inset-0"
            onClick={
              closePasswordChange
            }
          />

          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gold/10">
                  <LockKeyhole className="h-5 w-5 text-brand-gold" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Change Password
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Protect your lecturer account.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={
                  closePasswordChange
                }
                disabled={
                  changingPassword
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <form
              onSubmit={
                handlePasswordSubmit
              }
            >

              <div className="space-y-5 p-5 sm:p-6">

                {formError && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">

                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                    <p className="text-sm font-medium">
                      {formError}
                    </p>

                  </div>
                )}

                {/* CURRENT PASSWORD */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Current Password
                  </label>

                  <div className="relative">

                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      type={
                        showCurrentPassword
                          ? 'text'
                          : 'password'
                      }
                      value={
                        currentPassword
                      }
                      onChange={(event) =>
                        setCurrentPassword(
                          event.target.value
                        )
                      }
                      disabled={
                        changingPassword
                      }
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 disabled:bg-slate-50"
                      placeholder="Enter current password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(
                          (value) =>
                            !value
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showCurrentPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>

                  </div>
                </div>

                {/* NEW PASSWORD */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    New Password
                  </label>

                  <div className="relative">

                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      type={
                        showNewPassword
                          ? 'text'
                          : 'password'
                      }
                      value={
                        newPassword
                      }
                      onChange={(event) =>
                        setNewPassword(
                          event.target.value
                        )
                      }
                      disabled={
                        changingPassword
                      }
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 disabled:bg-slate-50"
                      placeholder="Enter new password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          (value) =>
                            !value
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showNewPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>

                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Use at least 8 characters.
                  </p>
                </div>

                {/* CONFIRM PASSWORD */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Confirm New Password
                  </label>

                  <div className="relative">

                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      type={
                        showConfirmPassword
                          ? 'text'
                          : 'password'
                      }
                      value={
                        confirmPassword
                      }
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      disabled={
                        changingPassword
                      }
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 disabled:bg-slate-50"
                      placeholder="Confirm new password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) =>
                            !value
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showConfirmPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>

                  </div>
                </div>

                {/* SECURITY MESSAGE */}

                <div className="rounded-2xl border border-brand-green/10 bg-brand-green/5 p-4">

                  <div className="flex gap-3">

                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />

                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Password Security
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Your password is securely hashed before being
                        stored. Never share your password with another person.
                      </p>
                    </div>

                  </div>

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">

                <button
                  type="button"
                  onClick={
                    closePasswordChange
                  }
                  disabled={
                    changingPassword
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    changingPassword
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="h-4 w-4" />
                      Change Password
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </main>
  );
}