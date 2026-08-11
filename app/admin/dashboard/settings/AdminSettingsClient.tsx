
'use client';

import React, { useEffect, useState } from 'react';

import {
  User,
  Lock,
  Building2,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type AdminData = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type SystemSettings = {
  id: number;
  collegeName: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  updatedAt?: string;
};

type Props = {
  admin: AdminData;
};

type MessageType = 'success' | 'error' | '';

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminSettingsClient({
  admin: initialAdmin,
}: Props) {
  /* =======================================================
     ADMIN PROFILE
  ======================================================= */

  const [name, setName] = useState(
    initialAdmin.name || ''
  );

  const [email, setEmail] = useState(
    initialAdmin.email || ''
  );

  const [role] = useState(
    initialAdmin.role || ''
  );

  /* =======================================================
     SYSTEM SETTINGS
  ======================================================= */

  const [collegeName, setCollegeName] =
    useState(
      'SHIFAH MEDICAL TRAINING COLLEGE'
    );

  const [slogan, setSlogan] = useState(
    'HEALTH THROUGH INNOVATION AND RESEARCH'
  );

  const [phone, setPhone] = useState('');

  const [systemEmail, setSystemEmail] =
    useState('');

  const [address, setAddress] =
    useState('Kitale, Kenya');

  const [website, setWebsite] =
    useState('');

  /* =======================================================
     PASSWORD
  ======================================================= */

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  /* =======================================================
     UI STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [systemSaving, setSystemSaving] =
    useState(false);

  const [passwordSaving, setPasswordSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [messageType, setMessageType] =
    useState<MessageType>('');

  /* =======================================================
     MESSAGE HELPER
  ======================================================= */

  const showMessage = (
    text: string,
    type: MessageType
  ) => {
    setMessage(text);
    setMessageType(type);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* =======================================================
     LOAD SETTINGS
  ======================================================= */

  const loadSettings = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        '/api/admin/settings',
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to load settings.'
        );
      }

      /* ===============================================
         ADMIN
      =============================================== */

      if (data.admin) {
        setName(
          data.admin.name || ''
        );

        setEmail(
          data.admin.email || ''
        );
      }

      /* ===============================================
         SYSTEM
      =============================================== */

      if (data.settings) {
        setCollegeName(
          data.settings.collegeName || ''
        );

        setSlogan(
          data.settings.slogan || ''
        );

        setPhone(
          data.settings.phone || ''
        );

        setSystemEmail(
          data.settings.email || ''
        );

        setAddress(
          data.settings.address || ''
        );

        setWebsite(
          data.settings.website || ''
        );
      }
    } catch (error) {
      console.error(
        'Load settings error:',
        error
      );

      showMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load settings.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadSettings();
  }, []);

  /* =======================================================
     SAVE PROFILE
  ======================================================= */

  const saveProfile = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setProfileSaving(true);
    setMessage('');
    setMessageType('');

    try {
      if (!name.trim()) {
        throw new Error(
          'Administrator name is required.'
        );
      }

      if (!email.trim()) {
        throw new Error(
          'Administrator email is required.'
        );
      }

      const response = await fetch(
        '/api/admin/settings',
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            action: 'profile',
            name: name.trim(),
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to update profile.'
        );
      }

      showMessage(
        data.message ||
          'Profile updated successfully.',
        'success'
      );
    } catch (error) {
      console.error(
        'Profile update error:',
        error
      );

      showMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update profile.',
        'error'
      );
    } finally {
      setProfileSaving(false);
    }
  };

  /* =======================================================
     SAVE SYSTEM SETTINGS
  ======================================================= */

  const saveSystemSettings = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setSystemSaving(true);
    setMessage('');
    setMessageType('');

    try {
      if (!collegeName.trim()) {
        throw new Error(
          'College name is required.'
        );
      }

      if (!slogan.trim()) {
        throw new Error(
          'College slogan is required.'
        );
      }

      const response = await fetch(
        '/api/admin/settings',
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            action: 'system',

            collegeName:
              collegeName.trim(),

            slogan:
              slogan.trim(),

            phone:
              phone.trim(),

            email:
              systemEmail.trim(),

            address:
              address.trim(),

            website:
              website.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to save system settings.'
        );
      }

      showMessage(
        data.message ||
          'System settings updated successfully.',
        'success'
      );
    } catch (error) {
      console.error(
        'System settings error:',
        error
      );

      showMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save system settings.',
        'error'
      );
    } finally {
      setSystemSaving(false);
    }
  };

  /* =======================================================
     CHANGE PASSWORD
  ======================================================= */

  const changePassword = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setPasswordSaving(true);
    setMessage('');
    setMessageType('');

    try {
      if (!currentPassword) {
        throw new Error(
          'Current password is required.'
        );
      }

      if (!newPassword) {
        throw new Error(
          'New password is required.'
        );
      }

      if (newPassword.length < 8) {
        throw new Error(
          'New password must contain at least 8 characters.'
        );
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        throw new Error(
          'New passwords do not match.'
        );
      }

      const response = await fetch(
        '/api/admin/settings',
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            action: 'password',

            currentPassword,

            newPassword,

            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to change password.'
        );
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      showMessage(
        data.message ||
          'Password changed successfully.',
        'success'
      );
    } catch (error) {
      console.error(
        'Password change error:',
        error
      );

      showMessage(
        error instanceof Error
          ? error.message
          : 'Unable to change password.',
        'error'
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-brand-green">
          <Loader2 className="h-6 w-6 animate-spin" />

          <span className="font-medium">
            Loading settings...
          </span>
        </div>
      </div>
    );
  }

  /* =======================================================
     PASSWORD INPUT HELPER
  ======================================================= */

  const passwordInputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10';

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="space-y-8">

      {/* =================================================
          MESSAGE
      ================================================= */}

      {message && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 ${
            messageType === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {messageType === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          )}

          <p className="text-sm font-medium">
            {message}
          </p>
        </div>
      )}

      {/* =================================================
          PROFILE
      ================================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-brand-cream p-3">
              <User className="h-6 w-6 text-brand-green" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-brand-dark">
                Administrator Profile
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update the administrator account information.
              </p>
            </div>

          </div>
        </div>

        <form
          onSubmit={saveProfile}
          className="p-6"
        >

          <div className="grid gap-6 md:grid-cols-2">

            {/* NAME */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Administrator name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />
            </div>

            {/* EMAIL */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />
            </div>

            {/* ROLE */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Role
              </label>

              <input
                type="text"
                value={role}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium capitalize text-slate-500"
              />
            </div>

          </div>

          <div className="mt-6 flex justify-end">

            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >

              {profileSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {profileSaving
                ? 'Saving...'
                : 'Save Profile'}

            </button>

          </div>

        </form>

      </section>

      {/* =================================================
          SYSTEM SETTINGS
      ================================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-brand-cream p-3">
              <Building2 className="h-6 w-6 text-brand-green" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-brand-dark">
                College Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage information displayed across the college system.
              </p>
            </div>

          </div>
        </div>

        <form
          onSubmit={saveSystemSettings}
          className="p-6"
        >

          <div className="grid gap-6 md:grid-cols-2">

            {/* COLLEGE NAME */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                College Name
              </label>

              <input
                type="text"
                value={collegeName}
                onChange={(event) =>
                  setCollegeName(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />

            </div>

            {/* SLOGAN */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Slogan
              </label>

              <input
                type="text"
                value={slogan}
                onChange={(event) =>
                  setSlogan(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />

            </div>

            {/* PHONE */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phone Number
              </label>

              <input
                type="text"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="College phone number"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />

            </div>

            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                College Email
              </label>

              <input
                type="email"
                value={systemEmail}
                onChange={(event) =>
                  setSystemEmail(event.target.value)
                }
                placeholder="info@college.co.ke"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />

            </div>

            {/* ADDRESS */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Address
              </label>

              <input
                type="text"
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />

            </div>

            {/* WEBSITE */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Website
              </label>

              <input
                type="text"
                value={website}
                onChange={(event) =>
                  setWebsite(event.target.value)
                }
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
              />

            </div>

          </div>

          <div className="mt-6 flex justify-end">

            <button
              type="submit"
              disabled={systemSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >

              {systemSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {systemSaving
                ? 'Saving...'
                : 'Save College Information'}

            </button>

          </div>

        </form>

      </section>

      {/* =================================================
          PASSWORD
      ================================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">

        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-red-50 p-3">
              <Lock className="h-6 w-6 text-red-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-brand-dark">
                Change Password
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Change the password used to access the admin dashboard.
              </p>
            </div>

          </div>

        </div>

        <form
          onSubmit={changePassword}
          className="p-6"
        >

          <div className="grid gap-6 md:grid-cols-2">

            {/* CURRENT PASSWORD */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Current Password
              </label>

              <div className="relative">

                <input
                  type={
                    showCurrentPassword
                      ? 'text'
                      : 'password'
                  }
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(
                      event.target.value
                    )
                  }
                  autoComplete="current-password"
                  className={passwordInputClass}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword(
                      (value) => !value
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-green"
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

                <input
                  type={
                    showNewPassword
                      ? 'text'
                      : 'password'
                  }
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  className={passwordInputClass}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      (value) => !value
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-green"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>

              </div>

              <p className="mt-2 text-xs text-slate-400">
                Minimum 8 characters.
              </p>

            </div>

            {/* CONFIRM PASSWORD */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Confirm New Password
              </label>

              <div className="relative">

                <input
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  className={passwordInputClass}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-green"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>

              </div>

            </div>

          </div>

          <div className="mt-6 flex justify-end">

            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >

              {passwordSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}

              {passwordSaving
                ? 'Changing...'
                : 'Change Password'}

            </button>

          </div>

        </form>

      </section>

      {/* =================================================
          SECURITY
      ================================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">

        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-green-50 p-3">
              <ShieldCheck className="h-6 w-6 text-brand-green" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-brand-dark">
                Security
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Information about your administrator session.
              </p>
            </div>

          </div>

        </div>

        <div className="p-6">

          <div className="grid gap-4 md:grid-cols-3">

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Account Status
              </p>

              <div className="mt-2 flex items-center gap-2">

                <CheckCircle2 className="h-5 w-5 text-brand-green" />

                <span className="text-sm font-semibold text-brand-green">
                  Active
                </span>

              </div>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Authentication
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                Secure Session
              </p>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Session Cookie
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                HTTP Only
              </p>

            </div>

          </div>

          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">

            <div className="flex items-start gap-3">

              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

              <div>

                <p className="text-sm font-semibold text-blue-900">
                  Administrator security
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Your administrator session is protected
                  using an HTTP-only signed session cookie.
                  Passwords are stored using bcrypt hashing.
                </p>

              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={loadSettings}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >

            <RefreshCw className="h-4 w-4" />

            Refresh Settings

          </button>

        </div>

      </section>

    </div>
  );
}

