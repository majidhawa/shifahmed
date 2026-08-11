
'use client';

import React, {
  FormEvent,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

/* =========================================================
   STUDENT LOGIN PAGE
========================================================= */

export default function StudentLoginPage() {
  const router = useRouter();

  const [applicationNumber, setApplicationNumber] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  /* =======================================================
     LOGIN
  ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        '/api/student/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicationNumber:
              applicationNumber.trim(),
            phone: phone.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            'Unable to log in. Please check your details and try again.'
        );

        return;
      }

      router.push('/student/dashboard');
      router.refresh();
    } catch (error) {
      console.error(
        'LOGIN ERROR:',
        error
      );

      setError(
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f6ef]">

      {/* =================================================
          DECORATIVE BACKGROUND
      ================================================= */}

      <div className="pointer-events-none absolute inset-0">

        {/* Top green gradient */}
        <div className="absolute left-0 right-0 top-0 h-72 bg-gradient-to-br from-[#0c1f1a] via-[#0f4f3f] to-[#176c55]" />

        {/* Large decorative circle */}
        <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full border-[70px] border-white/5" />

        <div className="absolute -left-32 top-20 h-[300px] w-[300px] rounded-full border-[45px] border-[#d7a93b]/10" />

        {/* Medical cross decoration */}
        <div className="absolute right-[12%] top-[18%] hidden opacity-10 lg:block">
          <div className="relative h-32 w-32">
            <div className="absolute left-1/2 top-0 h-full w-8 -translate-x-1/2 rounded-full bg-[#d7a93b]" />
            <div className="absolute left-0 top-1/2 h-8 w-full -translate-y-1/2 rounded-full bg-[#d7a93b]" />
          </div>
        </div>

        {/* Small circles */}
        <div className="absolute bottom-16 left-[8%] h-20 w-20 rounded-full border-8 border-[#0f4f3f]/5" />

        <div className="absolute bottom-32 right-[8%] h-12 w-12 rounded-full bg-[#d7a93b]/10" />

      </div>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">

        <div className="w-full max-w-5xl">

          {/* =================================================
              HEADER / BRAND
          ================================================= */}

          <div className="mb-8 text-center">

            {/* Logo */}
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-[0_20px_60px_rgba(15,79,63,0.20)]">

              <img
                src="/images/logo.jpg"
                alt="Shifah Medical Training College"
                className="h-full w-full object-contain"
              />

            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Student Portal
            </h1>

            <p className="mt-2 text-sm font-medium text-white/80 sm:text-base">
              Shifah Medical Training College
            </p>

          </div>

          {/* =================================================
              LOGIN CARD
          ================================================= */}

          <div className="mx-auto max-w-md">

            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_20px_60px_rgba(15,79,63,0.16)]">

              {/* Card top accent */}
              <div className="h-1.5 bg-gradient-to-r from-[#0f4f3f] via-[#d7a93b] to-[#0f4f3f]" />

              <div className="p-6 sm:p-8">

                {/* =================================================
                    CARD HEADER
                ================================================= */}

                <div className="mb-7">

                  <div className="mb-4 flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f4f3f] shadow-md">

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5 text-white"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 19.5A2.5 2.5 0 016.5 17H20"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 6h8M8 10h8M8 14h5"
                        />
                      </svg>

                    </div>

                    <div>

                      <h2 className="text-xl font-bold text-[#0c1f1a]">
                        Applicant Login
                      </h2>

                      <p className="text-xs text-gray-500">
                        Secure student access
                      </p>

                    </div>

                  </div>

                  <p className="text-sm leading-6 text-gray-600">
                    Sign in using your application number
                    and the mobile number you provided
                    during your application.
                  </p>

                </div>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                  <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mt-0.5 h-5 w-5 flex-shrink-0"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                      />

                      <path
                        strokeLinecap="round"
                        d="M12 8v4"
                      />

                      <path
                        strokeLinecap="round"
                        d="M12 16h.01"
                      />
                    </svg>

                    <span>{error}</span>

                  </div>
                )}

                {/* =================================================
                    FORM
                ================================================= */}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >

                  {/* APPLICATION NUMBER */}

                  <div>

                    <label
                      htmlFor="applicationNumber"
                      className="mb-2 block text-sm font-semibold text-[#0c1f1a]"
                    >
                      Application Number
                    </label>

                    <div className="relative">

                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-5 w-5 text-gray-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
                          />

                          <path
                            strokeLinecap="round"
                            d="M8 7h8M8 11h8M8 15h5"
                          />
                        </svg>

                      </div>

                      <input
                        id="applicationNumber"
                        type="text"
                        value={applicationNumber}
                        onChange={(event) =>
                          setApplicationNumber(
                            event.target.value
                          )
                        }
                        placeholder="SMTC/2026/XXXXXXXX"
                        autoComplete="off"
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0f4f3f] focus:bg-white focus:ring-4 focus:ring-[#0f4f3f]/10"
                      />

                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      Enter the application number
                      received after submitting your
                      application.
                    </p>

                  </div>

                  {/* PHONE */}

                  <div>

                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-semibold text-[#0c1f1a]"
                    >
                      Phone Number
                    </label>

                    <div className="relative">

                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-5 w-5 text-gray-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 3h4l2 5-2.5 1.5a15 15 0 006 6L16 13l5 2v4a2 2 0 01-2 2C10.716 21 3 13.284 3 5a2 2 0 012-2z"
                          />
                        </svg>

                      </div>

                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(event) =>
                          setPhone(
                            event.target.value
                          )
                        }
                        placeholder="07XXXXXXXX"
                        autoComplete="tel"
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0f4f3f] focus:bg-white focus:ring-4 focus:ring-[#0f4f3f]/10"
                      />

                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      Use the mobile number you
                      provided in your application.
                    </p>

                  </div>

                  {/* =================================================
                      LOGIN BUTTON
                  ================================================= */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#0f4f3f] px-5 py-3.5 font-semibold text-white shadow-lg shadow-[#0f4f3f]/20 transition-all duration-200 hover:bg-[#0c3f32] hover:shadow-xl hover:shadow-[#0f4f3f]/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {/* Gold hover accent */}
                    <span className="absolute inset-y-0 left-0 w-1 bg-[#d7a93b] transition-all duration-300 group-hover:w-full group-hover:opacity-10" />

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
                          Checking application...
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          Login to Student Portal
                        </span>

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 12h14"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 6l6 6-6 6"
                          />
                        </svg>
                      </>
                    )}

                  </button>

                </form>

                {/* =================================================
                    APPLY LINK
                ================================================= */}

                <div className="mt-7 border-t border-gray-100 pt-6 text-center">

                  <p className="text-sm text-gray-500">
                    Haven&apos;t applied yet?
                  </p>

                  <a
                    href="/apply"
                    className="mt-2 inline-flex items-center gap-1 font-semibold text-[#0f4f3f] transition hover:text-[#d7a93b]"
                  >
                    Apply to SMTC

                    <span className="transition-transform hover:translate-x-1">
                      →
                    </span>
                  </a>

                </div>

              </div>

            </div>

            {/* =================================================
                SECURITY NOTE
            ================================================= */}

            <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-gray-500">

              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4 text-[#0f4f3f]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4"
                />
              </svg>

              <span>
                Secure access to your SMTC student account
              </span>

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <p className="mt-5 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} Shifah Medical
              Training College. All rights reserved.
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}

