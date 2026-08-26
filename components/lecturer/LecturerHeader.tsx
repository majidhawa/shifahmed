'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  Menu,
  UserCircle,
  LogOut,
  ChevronDown,
  Loader2,
} from 'lucide-react';

/* =========================================================
   LECTURER HEADER
   Shifah Medical Training College LMS

   IMPORTANT:
   - Uses server-side lecturer session
   - Clears local lecturer state during logout
   - Uses window.location.replace()
   - Prevents returning to authenticated pages through
     normal browser navigation after logout
========================================================= */

type Lecturer = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
};

export default function LecturerHeader() {
  /* =========================================================
     STATE
  ========================================================= */

  const [lecturer, setLecturer] = useState<Lecturer | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const [loggingOut, setLoggingOut] = useState(false);

  /* =========================================================
     LOAD CURRENT LECTURER
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadLecturer() {
      try {
        const response = await fetch('/api/lecturer/me', {
          method: 'GET',
          credentials: 'include',

          /*
           * VERY IMPORTANT
           * Always ask the server for the latest session.
           */
          cache: 'no-store',

          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!mounted) {
          return;
        }

        if (!response.ok) {
          setLecturer(null);
          return;
        }

        const data = await response.json();

        if (data?.success && data?.lecturer) {
          setLecturer(data.lecturer);
        } else {
          setLecturer(null);
        }
      } catch (error) {
        console.error(
          'Unable to load lecturer:',
          error
        );

        if (mounted) {
          setLecturer(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadLecturer();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    /*
     * Prevent multiple logout requests.
     */
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    /*
     * Close account dropdown immediately.
     */
    setMenuOpen(false);

    try {
      /*
       * Ask the server to completely destroy the
       * lecturer authentication cookie/session.
       */
      const response = await fetch('/api/lecturer/logout', {
        method: 'POST',
        credentials: 'include',

        /*
         * Never allow this request to use a cached response.
         */
        cache: 'no-store',

        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      /*
       * Clear lecturer information from React state.
       */
      setLecturer(null);

      /*
       * Replace the current browser history entry.
       *
       * IMPORTANT:
       * Do NOT use:
       *
       * window.location.href = '/lecturer/login'
       *
       * because that leaves the previous page in the
       * browser history.
       */
      if (response.ok) {
        window.location.replace('/lecturer/login');
        return;
      }

      /*
       * Even if the server returns an unexpected status,
       * we still force the user to the login page.
       */
      window.location.replace('/lecturer/login');
    } catch (error) {
      console.error(
        'Lecturer logout error:',
        error
      );

      /*
       * Even if the network request fails, do not leave
       * the lecturer sitting inside the portal.
       */
      setLecturer(null);

      window.location.replace('/lecturer/login');
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <header
      className="
        sticky
        top-0
        z-50
        border-b
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      <div
        className="
          flex
          h-16
          items-center
          justify-between
          px-4
          sm:px-6
          lg:px-8
        "
      >

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="flex items-center gap-3">

          {/* =================================================
              MOBILE MENU
          ================================================= */}

          <button
            type="button"
            aria-label="Open lecturer navigation"
            disabled={loggingOut}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              text-slate-600
              transition
              hover:bg-brand-green/10
              hover:text-brand-green
              disabled:pointer-events-none
              disabled:opacity-50
              lg:hidden
            "
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent(
                  'lecturer-toggle-sidebar'
                )
              );
            }}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* =================================================
              LOGO
          ================================================= */}

          <a
            href="/lecturer/dashboard"
            className="flex items-center gap-3"
            onClick={(event) => {
              /*
               * Never allow navigation to dashboard while
               * logout is in progress.
               */
              if (loggingOut) {
                event.preventDefault();
              }
            }}
          >

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                border
                border-brand-gold/30
                bg-white
                shadow-sm
              "
            >
              <img
                src="/images/logo.jpg"
                alt="Shifah Medical Training College"
                className="
                  h-full
                  w-full
                  object-contain
                "
              />
            </div>

            <div className="hidden sm:block">

              <p
                className="
                  text-sm
                  font-bold
                  leading-tight
                  text-brand-dark
                "
              >
                Shifah Medical
              </p>

              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-brand-green
                "
              >
                Lecturer LMS
              </p>

            </div>

          </a>

        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div
          className="
            flex
            items-center
            gap-2
            sm:gap-4
          "
        >

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <a
            href="/lecturer/notifications"
            aria-label="Notifications"
            onClick={(event) => {
              if (loggingOut) {
                event.preventDefault();
              }
            }}
            className="
              relative
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              text-slate-500
              transition
              hover:bg-brand-green/10
              hover:text-brand-green
            "
          >

            <Bell className="h-5 w-5" />

            <span
              className="
                absolute
                right-2
                top-2
                h-2
                w-2
                rounded-full
                bg-brand-gold
              "
            />

          </a>

          {/* =================================================
              DIVIDER
          ================================================= */}

          <div
            className="
              hidden
              h-8
              w-px
              bg-slate-200
              sm:block
            "
          />

          {/* =================================================
              LECTURER ACCOUNT
          ================================================= */}

          <div className="relative">

            <button
              type="button"
              disabled={loggingOut}
              onClick={() => {
                if (!loggingOut) {
                  setMenuOpen(
                    (current) => !current
                  );
                }
              }}
              className="
                flex
                items-center
                gap-2
                rounded-xl
                px-2
                py-1.5
                transition
                hover:bg-slate-50
                disabled:pointer-events-none
                disabled:opacity-60
                sm:px-3
              "
            >

              {/* =================================================
                  PROFILE ICON
              ================================================= */}

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  bg-brand-green/10
                "
              >

                {loggingOut ? (
                  <Loader2
                    className="
                      h-5
                      w-5
                      animate-spin
                      text-brand-green
                    "
                  />
                ) : (
                  <UserCircle
                    className="
                      h-6
                      w-6
                      text-brand-green
                    "
                  />
                )}

              </div>

              {/* =================================================
                  ACCOUNT DETAILS
              ================================================= */}

              <div className="hidden text-left sm:block">

                {loading ? (
                  <>
                    <div
                      className="
                        h-3
                        w-24
                        animate-pulse
                        rounded
                        bg-slate-200
                      "
                    />

                    <div
                      className="
                        mt-1
                        h-2
                        w-32
                        animate-pulse
                        rounded
                        bg-slate-100
                      "
                    />
                  </>
                ) : (
                  <>
                    <p
                      className="
                        max-w-[150px]
                        truncate
                        text-sm
                        font-bold
                        text-brand-dark
                      "
                    >
                      {lecturer?.name || 'Lecturer'}
                    </p>

                    <p
                      className="
                        max-w-[170px]
                        truncate
                        text-[11px]
                        text-slate-400
                      "
                    >
                      {lecturer?.email ||
                        'Lecturer Account'}
                    </p>
                  </>
                )}

              </div>

              {/* =================================================
                  CHEVRON
              ================================================= */}

              <ChevronDown
                className={`
                  hidden
                  h-4
                  w-4
                  text-slate-400
                  transition
                  sm:block
                  ${
                    menuOpen
                      ? 'rotate-180'
                      : ''
                  }
                `}
              />

            </button>

            {/* =================================================
                ACCOUNT DROPDOWN
            ================================================= */}

            {menuOpen && !loggingOut && (
              <>

                {/* =================================================
                    CLICK AWAY AREA
                ================================================= */}

                <button
                  type="button"
                  aria-label="Close menu"
                  className="
                    fixed
                    inset-0
                    z-40
                    cursor-default
                  "
                  onClick={() =>
                    setMenuOpen(false)
                  }
                />

                {/* =================================================
                    DROPDOWN
                ================================================= */}

                <div
                  className="
                    absolute
                    right-0
                    z-50
                    mt-2
                    w-64
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-xl
                  "
                >

                  {/* =================================================
                      USER INFORMATION
                  ================================================= */}

                  <div
                    className="
                      border-b
                      border-slate-100
                      bg-slate-50
                      px-4
                      py-4
                    "
                  >

                    <p
                      className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-[0.12em]
                        text-brand-gold
                      "
                    >
                      Lecturer Account
                    </p>

                    <p
                      className="
                        mt-1
                        truncate
                        text-sm
                        font-bold
                        text-brand-dark
                      "
                    >
                      {lecturer?.name ||
                        'Lecturer'}
                    </p>

                    <p
                      className="
                        mt-1
                        truncate
                        text-xs
                        text-slate-500
                      "
                    >
                      {lecturer?.email || ''}
                    </p>

                  </div>

                  {/* =================================================
                      MENU LINKS
                  ================================================= */}

                  <div className="p-2">

                    {/* PROFILE */}

                    <a
                      href="/lecturer/profile"
                      onClick={() =>
                        setMenuOpen(false)
                      }
                      className="
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        px-3
                        py-2.5
                        text-sm
                        font-semibold
                        text-slate-600
                        transition
                        hover:bg-brand-green/10
                        hover:text-brand-green
                      "
                    >
                      <UserCircle
                        className="h-4 w-4"
                      />

                      My Profile
                    </a>

                    {/* NOTIFICATIONS */}

                    <a
                      href="/lecturer/notifications"
                      onClick={() =>
                        setMenuOpen(false)
                      }
                      className="
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        px-3
                        py-2.5
                        text-sm
                        font-semibold
                        text-slate-600
                        transition
                        hover:bg-brand-green/10
                        hover:text-brand-green
                      "
                    >
                      <Bell
                        className="h-4 w-4"
                      />

                      Notifications
                    </a>

                    {/* =================================================
                        SIGN OUT
                    ================================================= */}

                    <button
                      type="button"
                      disabled={loggingOut}
                      onClick={handleLogout}
                      className="
                        mt-1
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-xl
                        px-3
                        py-2.5
                        text-left
                        text-sm
                        font-semibold
                        text-red-600
                        transition
                        hover:bg-red-50
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >

                      {loggingOut ? (
                        <Loader2
                          className="
                            h-4
                            w-4
                            animate-spin
                          "
                        />
                      ) : (
                        <LogOut
                          className="h-4 w-4"
                        />
                      )}

                      {loggingOut
                        ? 'Signing Out...'
                        : 'Sign Out'}

                    </button>

                  </div>

                </div>

              </>
            )}

          </div>

        </div>

      </div>
    </header>
  );
}