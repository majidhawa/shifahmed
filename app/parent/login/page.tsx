'use client';

import React, { FormEvent, useState } from 'react';

import {
  FileText,
  Phone,
  ShieldCheck,
  GraduationCap,
  LogIn,
  Users,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

/* =========================================================
   PARENT LOGIN PAGE
   Shifah Medical Training College
========================================================= */

export default function ParentLoginPage() {
  const router = useRouter();

  const [studentApplicationNumber, setStudentApplicationNumber] =
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
       VALIDATE STUDENT APPLICATION NUMBER
    ------------------------------------------------------- */

    if (!studentApplicationNumber.trim()) {
      setError(
        'Please enter the student application number.'
      );
      return;
    }

    /* -------------------------------------------------------
       VALIDATE PARENT/GUARDIAN PHONE
    ------------------------------------------------------- */

    if (!phone.trim()) {
      setError(
        'Please enter the phone number registered with the student.'
      );
      return;
    }

    setLoading(true);

    try {
      /* -----------------------------------------------------
         PARENT LOGIN API
      ----------------------------------------------------- */

      const response = await fetch(
        '/api/parent/login',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          credentials: 'include',

          body: JSON.stringify({
            studentApplicationNumber:
              studentApplicationNumber.trim(),
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
          'The parent login service returned an invalid response.'
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
            'Unable to verify the parent account. Please check the details and try again.'
        );

        return;
      }

      /* -----------------------------------------------------
         SUCCESS
      ----------------------------------------------------- */

      router.replace('/parent/dashboard');

      router.refresh();
    } catch (err) {
      console.error(
        'Parent login error:',
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
                Parent Portal
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
                Stay connected with your student&apos;s
                academic progress, payments, attendance,
                communication and college information.
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
                    STUDENT APPLICATION NUMBER
                ================================================== */}

                <div>

                  <label
                    htmlFor="student-application-number"
                    className="mb-2 block text-sm font-semibold text-brand-dark"
                  >
                    Student Application Number
                  </label>

                  <div className="relative">

                    <FileText
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="student-application-number"
                      name="studentApplicationNumber"
                      type="text"
                      autoComplete="off"
                      value={studentApplicationNumber}
                      onChange={(e) =>
                        setStudentApplicationNumber(
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
                    Enter the application number of
                    the student you are associated with.
                  </p>

                </div>

                {/* =================================================
                    PARENT PHONE NUMBER
                ================================================== */}

                <div>

                  <label
                    htmlFor="parent-phone"
                    className="mb-2 block text-sm font-semibold text-brand-dark"
                  >
                    Parent / Guardian Phone Number
                  </label>

                  <div className="relative">

                    <Phone
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="parent-phone"
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
                    Use the phone number registered
                    as the parent or guardian contact.
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

                      Verifying account...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 transition-transform group-hover:scale-105" />

                      Sign In to Parent Portal
                    </>
                  )}

                </button>

              </form>

              {/* =================================================
                  PARENT INFORMATION
              ================================================== */}

              <div className="mt-7 border-t border-slate-100 pt-6">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green/10">

                    <Users className="h-5 w-5 text-brand-green" />

                  </div>

                  <div>

                    <p className="text-xs font-bold text-brand-dark">
                      Parent &amp; Guardian Access
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Use the student&apos;s application
                      number together with the parent or
                      guardian phone number registered
                      with the college.
                    </p>

                  </div>

                </div>

              </div>

              {/* =================================================
                  SECURITY NOTICE
              ================================================== */}

              <div className="mt-6 border-t border-slate-100 pt-6">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green/10">

                    <ShieldCheck className="h-5 w-5 text-brand-green" />

                  </div>

                  <div>

                    <p className="text-xs font-bold text-brand-dark">
                      Secure Parent Area
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      This portal provides secure access
                      to information relating to your
                      student at Shifah Medical Training
                      College.
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
                SMTC Parent Portal
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