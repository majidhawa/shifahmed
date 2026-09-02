'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Menu,
  UserCircle,
  LogOut,
  ChevronDown,
  Loader2,
  Megaphone,
} from 'lucide-react';

type Lecturer = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export default function LecturerHeader() {
  const [lecturer, setLecturer] = useState<Lecturer | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const accountDropdownRef = useRef<HTMLDivElement | null>(null);

  /*
   * ============================================================
   * LOAD LECTURER
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    const loadLecturer = async () => {
      try {
        const response = await fetch('/api/lecturer/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          if (mounted) {
            setLecturer(null);
          }

          return;
        }

        const data = await response.json();

        if (mounted) {
          setLecturer(
            data?.lecturer ??
              data?.user ??
              null
          );
        }
      } catch (error) {
        console.error(
          'Failed to load lecturer:',
          error
        );

        if (mounted) {
          setLecturer(null);
        }
      }
    };

    void loadLecturer();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ============================================================
   * CLOSE ACCOUNT DROPDOWN WHEN CLICKING OUTSIDE
   * ============================================================
   */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  /*
   * ============================================================
   * LOGOUT
   * ============================================================
   */

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await fetch('/api/lecturer/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
    } catch (error) {
      console.error(
        'Logout error:',
        error
      );
    } finally {
      setLecturer(null);
      setMenuOpen(false);

      window.location.replace(
        '/lecturer/login'
      );
    }
  };

  /*
   * ============================================================
   * TOGGLE ACCOUNT MENU
   * ============================================================
   */

  const toggleAccountMenu = () => {
    if (loggingOut) {
      return;
    }

    setMenuOpen((current) => !current);
  };

  const displayName =
    lecturer?.name || 'Lecturer';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ======================================================
            LEFT SIDE
        ====================================================== */}

        <div className="flex items-center gap-3">

          {/* Mobile Sidebar Toggle */}
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent(
                  'lecturer-toggle-sidebar'
                )
              );
            }}
            disabled={loggingOut}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-brand-green/10 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link
            href="/lecturer/dashboard"
            className="flex items-center gap-3"
            onClick={(event) => {
              if (loggingOut) {
                event.preventDefault();
              }
            }}
          >
            <img
              src="/images/logo.jpg"
              alt="Shifah Medical Training College"
              className="h-10 w-10 rounded-xl object-cover"
            />

            <div className="hidden sm:block">
              <p className="text-sm font-bold text-brand-dark">
                Shifah Medical Training College
              </p>

              <p className="text-xs text-slate-500">
                Lecturer Portal
              </p>
            </div>
          </Link>
        </div>

        {/* ======================================================
            RIGHT SIDE
        ====================================================== */}

        <div className="flex items-center gap-2 sm:gap-3">

          {/* ====================================================
              ANNOUNCEMENTS / BELL
          ==================================================== */}

          <Link
            href="/lecturer/dashboard/announcements"
            aria-label="Announcements"
            title="Announcements"
            onClick={(event) => {
              if (loggingOut) {
                event.preventDefault();
              }

              setMenuOpen(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-brand-green/10 hover:text-brand-green"
          >
            <Bell className="h-5 w-5" />

            {/* Announcement indicator */}
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand-gold ring-2 ring-white" />
          </Link>

          {/* ====================================================
              ACCOUNT MENU
          ==================================================== */}

          <div
            ref={accountDropdownRef}
            className="relative"
          >
            <button
              type="button"
              onClick={toggleAccountMenu}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <UserCircle className="h-8 w-8 text-brand-green" />

              <div className="hidden text-left sm:block">
                <p className="max-w-[130px] truncate text-xs font-semibold text-slate-800">
                  {displayName}
                </p>

                <p className="text-[10px] text-slate-400">
                  Lecturer
                </p>
              </div>

              <ChevronDown
                className={`hidden h-4 w-4 text-slate-400 transition sm:block ${
                  menuOpen
                    ? 'rotate-180'
                    : ''
                }`}
              />
            </button>

            {/* ==================================================
                ACCOUNT DROPDOWN
            ================================================== */}

            {menuOpen && (
              <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10">

                {/* Account Information */}
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {displayName}
                  </p>

                  {lecturer?.email && (
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {lecturer.email}
                    </p>
                  )}
                </div>

                {/* Profile */}
                <Link
                  href="/lecturer/dashboard/profile"
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-brand-green"
                >
                  <UserCircle className="h-4 w-4" />
                  Profile
                </Link>

                {/* Announcements */}
                <Link
                  href="/lecturer/dashboard/announcements"
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-brand-green"
                >
                  <Megaphone className="h-4 w-4" />
                  Announcements
                </Link>

                <div className="my-1 border-t border-slate-100" />

                {/* Sign Out */}
                <button
                  type="button"
                  onClick={() =>
                    void handleLogout()
                  }
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}

                  {loggingOut
                    ? 'Signing out...'
                    : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}