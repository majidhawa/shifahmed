
'use client';

import React, { FormEvent, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

/* =========================================================
   ADMIN LOGIN PAGE
   Shifah Medical Training College
========================================================= */

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* =========================================================
     LOGIN HANDLER

     Authentication API will be connected in the next step.
  ========================================================= */

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      /*
       * NEXT STEP:
       * This will connect to:
       *
       * /api/admin/login
       *
       * once we create the admin authentication backend.
       */

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || 'Invalid email or password. Please try again.'
        );
        return;
      }

      /*
       * Successful login
       *
       * The API will return the authenticated session.
       * We will redirect to the dashboard after authentication
       * is implemented.
       */

      window.location.href = '/admin/dashboard';
    } catch (err) {
      console.error('Admin login error:', err);

      setError(
        'Unable to connect to the server. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-cream">
      {/* =====================================================
          TOP BRAND BAR
      ====================================================== */}

      <div className="h-1.5 w-full bg-brand-gold" />

      <div className="relative flex min-h-[calc(100vh-6px)] items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">

        {/* Decorative background elements */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-brand-green/10 blur-3xl" />

          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-gold/10 blur-3xl" />

          <div className="absolute inset-0 bg-brand-radial opacity-70" />
        </div>

        {/* =================================================
            LOGIN CARD
        ================================================== */}

        <div className="relative z-10 w-full max-w-md">

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">

            {/* =================================================
                CARD HEADER
            ================================================== */}

            <div className="bg-brand-green px-6 py-8 text-center sm:px-8">

              {/* Logo placeholder / SMTC mark */}

            {/* =================================================
    SHIFAH MEDICAL TRAINING COLLEGE LOGO
================================================== */}

<div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-brand-gold/40 bg-white p-2 shadow-lg">
  <img
    src="/images/logo.jpg"
    alt="Shifah Medical Training College"
    className="h-full w-full object-contain"
  />
</div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                Administration Portal
              </p>

              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Welcome Back
              </h1>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/75">
                Sign in to manage applications, payments, receipts and
                admissions.
              </p>
            </div>

            {/* =================================================
                FORM
            ================================================== */}

            <div className="px-6 py-8 sm:px-8 sm:py-9">

              {/* Error message */}

              {error && (
                <div
                  role="alert"
                  className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                      !
                    </span>

                    <p>{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* =================================================
                    EMAIL
                ================================================== */}

                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-2 block text-sm font-semibold text-brand-dark"
                  >
                    Email Address
                  </label>

                  <div className="relative">

                    <Mail
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="admin-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@shifahmedicalcollege.co.ke"
                      disabled={loading}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                  </div>
                </div>

                {/* =================================================
                    PASSWORD
                ================================================== */}

                <div>
                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="admin-password"
                      className="block text-sm font-semibold text-brand-dark"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      className="text-xs font-semibold text-brand-green transition hover:text-brand-gold"
                      onClick={() => {
                        /*
                         * Password reset functionality will be added
                         * after authentication is implemented.
                         */
                        setError(
                          'Password reset will be available once the admin authentication system is configured.'
                        );
                      }}
                    >
                      Forgot password?
                    </button>

                  </div>

                  <div className="relative">

                    <LockKeyhole
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="admin-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={loading}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-brand-green/10 hover:text-brand-green disabled:cursor-not-allowed"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>

                  </div>
                </div>

                {/* =================================================
                    REMEMBER ME
                ================================================== */}

                <div className="flex items-center">

                  <label className="flex cursor-pointer items-center gap-3">

                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) =>
                        setRememberMe(e.target.checked)
                      }
                      disabled={loading}
                      className="h-4 w-4 rounded border-slate-300 text-brand-green accent-brand-green focus:ring-brand-green"
                    />

                    <span className="text-sm text-slate-600">
                      Remember me
                    </span>

                  </label>

                </div>

                {/* =================================================
                    LOGIN BUTTON
                ================================================== */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-green px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-green/20 transition duration-200 hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-xl hover:shadow-brand-green/20 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="h-5 w-5 transition-transform group-hover:scale-105" />
                      Sign In to Admin Portal
                    </>
                  )}
                </button>

              </form>

              {/* =================================================
                  SECURITY NOTICE
              ================================================== */}

              <div className="mt-7 border-t border-slate-100 pt-6">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green/10">
                    <ShieldCheck className="h-5 w-5 text-brand-green" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-brand-dark">
                      Secure Administration Area
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      This portal is restricted to authorized Shifah
                      Medical Training College personnel.
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              FOOTER
          ================================================== */}

          <div className="mt-6 text-center">

            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Shifah Medical Training College
            </p>

            <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <span>Health through innovation and research</span>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}

