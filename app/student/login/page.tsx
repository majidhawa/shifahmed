'use client';

import React, { FormEvent, useState } from 'react';

import {
  FileText,
  Phone,
  ShieldCheck,
  GraduationCap,
  LogIn,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

/* =========================================================
   STUDENT LOGIN PAGE
   Shifah Medical Training College
========================================================= */

export default function StudentLoginPage() {
  const router = useRouter();

  const [applicationNumber, setApplicationNumber] =
    useState('');

  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  /* =========================================================
     LOGIN HANDLER
  ========================================================= */

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError('');

    /* -------------------------------------------------------
       VALIDATE APPLICATION NUMBER
    ------------------------------------------------------- */

    if (!applicationNumber.trim()) {
      setError(
        'Please enter your application number.'
      );
      return;
    }

    /* -------------------------------------------------------
       VALIDATE PHONE NUMBER
    ------------------------------------------------------- */

    if (!phone.trim()) {
      setError(
        'Please enter the phone number you used during application.'
      );
      return;
    }

    setLoading(true);

    try {
      /* -----------------------------------------------------
         STUDENT LOGIN API
      ----------------------------------------------------- */

      const response = await fetch(
        '/api/student/login',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          credentials: 'include',

          body: JSON.stringify({
            applicationNumber:
              applicationNumber.trim(),
            phone: phone.trim(),
          }),
        }
      );

      /* -----------------------------------------------------
         READ RESPONSE SAFELY
      ----------------------------------------------------- */

      const contentType =
        response.headers.get('content-type');

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      if (
        contentType?.includes('application/json')
      ) {
        data = await response.json();
      } else {
        throw new Error(
          'The student login service returned an invalid response.'
        );
      }

      /* -----------------------------------------------------
         CHECK LOGIN RESULT
      ----------------------------------------------------- */

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            'Invalid application number or phone number. Please try again.'
        );

        return;
      }

      /* -----------------------------------------------------
         SUCCESS
      ----------------------------------------------------- */

      router.replace('/student/dashboard');

      router.refresh();
    } catch (err) {
      console.error(
        'Student login error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="min-h-screen bg-brand-cream">

      {/* =====================================================
          TOP BRAND BAR
      ====================================================== */}

      <div className="h-1.5 w-full bg-brand-gold" />

      <div className="relative flex min-h-[calc(100vh-6px)] items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">

        {/* =================================================
            DECORATIVE BACKGROUND
        ================================================== */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-brand-green/10 blur-3xl" />

          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-gold/10 blur-3xl" />

          <div className="absolute inset-0 bg-brand-radial opacity-70" />

        </div>

        {/* =================================================
            LOGIN CONTAINER
        ================================================== */}

        <div className="relative z-10 w-full max-w-md">

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">

            {/* =================================================
                CARD HEADER
            ================================================== */}

            <div className="bg-brand-green px-6 py-8 text-center sm:px-8">

              {/* =================================================
                  SMTC LOGO
              ================================================== */}

              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-brand-gold/40 bg-white p-2 shadow-lg">

                <img
                  src="/images/logo.jpg"
                  alt="Shifah Medical Training College"
                  className="h-full w-full object-contain"
                />

              </div>

              {/* =================================================
                  PORTAL LABEL
              ================================================== */}

              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                Student Portal
              </p>

              {/* =================================================
                  TITLE
              ================================================== */}

              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Welcome Back
              </h1>

              {/* =================================================
                  DESCRIPTION
              ================================================== */}

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/75">
                Sign in to access your application,
                admission details, payments, documents
                and student Learning Management System.
              </p>

            </div>

            {/* =================================================
                FORM AREA
            ================================================== */}

            <div className="px-6 py-8 sm:px-8 sm:py-9">

              {/* =================================================
                  ERROR MESSAGE
              ================================================== */}

              {error && (
                <div
                  role="alert"
                  className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >

                  <div className="flex items-start gap-3">

                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                      !
                    </span>

                    <p>
                      {error}
                    </p>

                  </div>

                </div>
              )}

              {/* =================================================
                  LOGIN FORM
              ================================================== */}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* =================================================
                    APPLICATION NUMBER
                ================================================== */}

                <div>

                  <label
                    htmlFor="student-application-number"
                    className="mb-2 block text-sm font-semibold text-brand-dark"
                  >
                    Application Number
                  </label>

                  <div className="relative">

                    <FileText
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="student-application-number"
                      name="applicationNumber"
                      type="text"
                      autoComplete="off"
                      value={applicationNumber}
                      onChange={(e) =>
                        setApplicationNumber(
                          e.target.value
                        )
                      }
                      placeholder="SMTC/2026/XXXXXXXX"
                      disabled={loading}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Enter the application number
                    you received after submitting
                    your application.
                  </p>

                </div>

                {/* =================================================
                    PHONE NUMBER
                ================================================== */}

                <div>

                  <label
                    htmlFor="student-phone"
                    className="mb-2 block text-sm font-semibold text-brand-dark"
                  >
                    Phone Number
                  </label>

                  <div className="relative">

                    <Phone
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="student-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value)
                      }
                      placeholder="07XXXXXXXX"
                      disabled={loading}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-brand-dark outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Use the mobile number you
                    provided during your application.
                  </p>

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

                      Checking account...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 transition-transform group-hover:scale-105" />

                      Sign In to Student Portal
                    </>
                  )}

                </button>

              </form>

              {/* =================================================
                  APPLY LINK
              ================================================== */}

              <div className="mt-7 border-t border-slate-100 pt-6 text-center">

                <p className="text-sm text-slate-500">
                  Haven&apos;t applied yet?
                </p>

                <a
                  href="/apply"
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-green transition hover:text-brand-gold"
                >
                  Apply to SMTC

                  <span className="transition-transform hover:translate-x-1">
                    →
                  </span>
                </a>

              </div>

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
                      Secure Student Area
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      This portal provides secure
                      access to your Shifah Medical
                      Training College student account
                      and application information.
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

            <div className="flex items-center justify-center gap-2">

              <GraduationCap className="h-4 w-4 text-brand-green" />

              <p className="text-xs text-slate-500">
                SMTC Student Portal
              </p>

            </div>

            <p className="mt-2 text-[11px] text-slate-400">
              © {new Date().getFullYear()}{' '}
              Shifah Medical Training College
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Health through innovation and research
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}