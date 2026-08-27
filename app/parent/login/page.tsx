'use client';

import React, {
  FormEvent,
  useState,
} from 'react';

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  Users,
  ShieldCheck,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

/* =========================================================
   PARENT LOGIN
   Shifah Medical Training College
========================================================= */

export default function ParentLoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  /* =========================================================
     LOGIN HANDLER
  ========================================================= */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');

    if (!identifier.trim()) {
      setError(
        'Please enter your email address or phone number.'
      );
      return;
    }

    if (!password) {
      setError(
        'Please enter your password.'
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          '/api/parent/login',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            credentials: 'include',

            body: JSON.stringify({
              identifier:
                identifier.trim(),
              password,
              rememberMe,
            }),
          }
        );

      const contentType =
        response.headers.get(
          'content-type'
        );

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      if (
        contentType?.includes(
          'application/json'
        )
      ) {
        data =
          await response.json();
      } else {
        throw new Error(
          'The parent login service returned an invalid response.'
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            'Invalid email/phone or password.'
        );

        return;
      }

      router.replace(
        '/parent/dashboard'
      );

      router.refresh();
    } catch (error) {
      console.error(
        'Parent login error:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-cream">

      {/* TOP BAR */}

      <div className="h-1.5 w-full bg-brand-gold" />

      <div className="relative flex min-h-[calc(100vh-6px)] items-center justify-center overflow-hidden px-4 py-10">

        {/* BACKGROUND */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-brand-green/5" />

          <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-brand-gold/10" />

        </div>

        {/* LOGIN CARD */}

        <div className="relative w-full max-w-md">

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">

            {/* HEADER */}

            <div className="bg-brand-green px-6 py-8 text-center sm:px-8">

              <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg">

                <img
                  src="/images/logo.jpg"
                  alt="Shifah Medical Training College"
                  className="h-full w-full object-contain"
                />

              </div>

              <h1 className="mt-5 text-2xl font-bold text-white">
                Parent Portal
              </h1>

              <p className="mt-2 text-sm text-white/70">
                Monitor your student&apos;s
                progress and college information.
              </p>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6 sm:p-8"
            >

              {/* ERROR */}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* EMAIL / PHONE */}

              <div>

                <label
                  htmlFor="identifier"
                  className="mb-2 block text-sm font-semibold text-brand-dark"
                >
                  Email or Phone Number
                </label>

                <div className="relative">

                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">

                    {identifier.includes('@') ? (
                      <Mail size={19} />
                    ) : (
                      <Phone size={19} />
                    )}

                  </div>

                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(
                      event
                    ) =>
                      setIdentifier(
                        event.target.value
                      )
                    }
                    placeholder="Email or 07XXXXXXXX"
                    autoComplete="username"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-brand-dark"
                >
                  Password
                </label>

                <div className="relative">

                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <LockKeyhole size={19} />
                  </div>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(
                      event
                    ) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-brand-green"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>

              {/* REMEMBER ME */}

              <div className="flex items-center justify-between">

                <label className="flex cursor-pointer items-center gap-2">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(
                      event
                    ) =>
                      setRememberMe(
                        event.target.checked
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-green focus:ring-brand-green"
                  />

                  <span className="text-xs text-slate-500">
                    Remember me
                  </span>

                </label>

              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-green px-5 py-3.5 font-semibold text-white shadow-lg transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >

                <span className="absolute inset-y-0 left-0 w-1 bg-brand-gold transition-all duration-300 group-hover:w-full group-hover:opacity-10" />

                {loading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>

                    <span>
                      Signing in...
                    </span>
                  </>
                ) : (
                  <>
                    <Users size={19} />

                    <span>
                      Login to Parent Portal
                    </span>
                  </>
                )}

              </button>

              {/* SECURITY */}

              <div className="flex items-start gap-3 rounded-xl bg-brand-green/5 p-4">

                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-brand-green"
                />

                <p className="text-xs leading-5 text-slate-500">
                  Your login is protected by
                  secure password authentication
                  and encrypted session cookies.
                </p>

              </div>

            </form>

          </div>

        </div>

      </div>

    </main>
  );
}