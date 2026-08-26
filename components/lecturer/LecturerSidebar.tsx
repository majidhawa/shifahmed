'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  LayoutDashboard,
  BookOpen,
  Layers3,
  ClipboardList,
  FileText,
  ClipboardCheck,
  BarChart3,
  Users,
  CalendarCheck,
  Megaphone,
  Bell,
  UserCircle,
  LogOut,
  X,
  GraduationCap,
  Loader2,
} from 'lucide-react';

/* =========================================================
   LECTURER SIDEBAR
   Shifah Medical Training College LMS

   Navigation:
   - Dashboard
   - My Courses
   - Units
   - Lessons
   - Learning Materials
   - Assignments
   - Quizzes & Exams
   - Grades & Results
   - My Students
   - Attendance
   - Announcements
   - Notifications
   - My Profile
========================================================= */

/* =========================================================
   TYPES
========================================================= */

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

type NavigationSection = {
  title: string;
  items: NavigationItem[];
};

/* =========================================================
   NAVIGATION CONFIGURATION
========================================================= */

const navigationSections: NavigationSection[] = [

  /* =======================================================
     MAIN
  ======================================================== */

  {
    title: 'MAIN',
    items: [
      {
        label: 'Dashboard',
        href: '/lecturer/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },

  /* =======================================================
     TEACHING
  ======================================================== */

  {
    title: 'TEACHING',
    items: [
      {
        label: 'My Courses',
        href: '/lecturer/courses',
        icon: BookOpen,
      },
      {
        label: 'Course Units',
        href: '/lecturer/units',
        icon: Layers3,
      },
      {
        label: 'Lessons',
        href: '/lecturer/lessons',
        icon: ClipboardList,
      },
      {
        label: 'Learning Materials',
        href: '/lecturer/materials',
        icon: FileText,
      },
    ],
  },

  /* =======================================================
     ASSESSMENT
  ======================================================== */

  {
    title: 'ASSESSMENT',
    items: [
      {
        label: 'Assignments',
        href: '/lecturer/assignments',
        icon: ClipboardCheck,
      },
      {
        label: 'Quizzes & Exams',
        href: '/lecturer/quizzes',
        icon: BarChart3,
      },
      {
        label: 'Grades & Results',
        href: '/lecturer/grades',
        icon: GraduationCap,
      },
    ],
  },

  /* =======================================================
     STUDENTS
  ======================================================== */

  {
    title: 'STUDENTS',
    items: [
      {
        label: 'My Students',
        href: '/lecturer/students',
        icon: Users,
      },
      {
        label: 'Attendance',
        href: '/lecturer/attendance',
        icon: CalendarCheck,
      },
    ],
  },

  /* =======================================================
     COMMUNICATION
  ======================================================== */

  {
    title: 'COMMUNICATION',
    items: [
      {
        label: 'Announcements',
        href: '/lecturer/announcements',
        icon: Megaphone,
      },
      {
        label: 'Notifications',
        href: '/lecturer/notifications',
        icon: Bell,
      },
    ],
  },

  /* =======================================================
     ACCOUNT
  ======================================================== */

  {
    title: 'ACCOUNT',
    items: [
      {
        label: 'My Profile',
        href: '/lecturer/profile',
        icon: UserCircle,
      },
    ],
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function LecturerSidebar() {

  const pathname = usePathname();

  const router = useRouter();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  /* =======================================================
     LISTEN FOR HEADER MOBILE MENU BUTTON
  ======================================================== */

  useEffect(() => {

    const handleToggle = () => {
      setMobileOpen(
        (current) => !current
      );
    };

    window.addEventListener(
      'lecturer-toggle-sidebar',
      handleToggle
    );

    return () => {

      window.removeEventListener(
        'lecturer-toggle-sidebar',
        handleToggle
      );

    };

  }, []);

  /* =======================================================
     CLOSE SIDEBAR WHEN ROUTE CHANGES
  ======================================================== */

  useEffect(() => {

    setMobileOpen(false);

  }, [pathname]);

  /* =======================================================
     PREVENT BODY SCROLL WHEN MOBILE SIDEBAR IS OPEN
  ======================================================== */

  useEffect(() => {

    if (!mobileOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };

  }, [mobileOpen]);

  /* =======================================================
     ACTIVE NAVIGATION CHECK
  ======================================================== */

  const isActive = (href: string) => {

    /*
     * Dashboard should only be active on the exact
     * dashboard route.
     */

    if (
      href === '/lecturer/dashboard'
    ) {
      return pathname === href;
    }

    /*
     * Other navigation items remain active for
     * nested routes.
     *
     * Example:
     *
     * /lecturer/courses
     * /lecturer/courses/1
     * /lecturer/courses/1/edit
     *
     * All belong to My Courses.
     */

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  /* =======================================================
     CLOSE MOBILE SIDEBAR
  ======================================================== */

  const closeMobileSidebar = () => {

    setMobileOpen(false);

  };

  /* =======================================================
     LOGOUT
  ======================================================== */

  const handleLogout = async () => {

    /*
     * Prevent multiple logout requests.
     */

    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {

      const response = await fetch(
        '/api/lecturer/logout',
        {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );

      /*
       * The API should return HTTP 200.
       */

      if (!response.ok) {

        console.error(
          'Lecturer logout failed:',
          response.status
        );

      }

    } catch (error) {

      console.error(
        'Lecturer logout error:',
        error
      );

    } finally {

      /*
       * Close the mobile sidebar.
       */

      setMobileOpen(false);

      /*
       * Replace the current history entry instead
       * of adding another entry.
       *
       * This is important for logout behaviour.
       */

      window.location.replace(
        '/lecturer/login'
      );

    }

  };

  /* =======================================================
     SIDEBAR CONTENT
  ======================================================== */

  const sidebarContent = (

    <div className="flex h-full flex-col">

      {/* ===================================================
          BRAND
      ==================================================== */}

      <div className="border-b border-white/10 px-5 py-5">

        <Link
          href="/lecturer/dashboard"
          onClick={closeMobileSidebar}
          className="flex items-center gap-3"
        >

          {/* Logo */}

          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-lg">

            <img
              src="/images/logo.jpg"
              alt="Shifah Medical Training College"
              className="h-full w-full object-contain"
            />

          </div>

          {/* Brand text */}

          <div className="min-w-0">

            <p className="truncate text-sm font-bold text-white">
              Shifah Medical
            </p>

            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-brand-gold">
              Lecturer LMS
            </p>

          </div>

        </Link>

      </div>

      {/* ===================================================
          NAVIGATION
      ==================================================== */}

      <nav
        className="flex-1 overflow-y-auto px-3 py-5"
        aria-label="Lecturer navigation"
      >

        {navigationSections.map(
          (section) => (

            <div
              key={section.title}
              className="mb-6"
            >

              {/* Section title */}

              <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.18em] text-white/40">
                {section.title}
              </p>

              {/* Section items */}

              <div className="space-y-1">

                {section.items.map(
                  (item) => {

                    const Icon =
                      item.icon;

                    const active =
                      isActive(item.href);

                    return (

                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={
                          closeMobileSidebar
                        }
                        aria-current={
                          active
                            ? 'page'
                            : undefined
                        }
                        className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                          active
                            ? 'bg-white text-brand-green shadow-sm'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >

                        {/* Icon */}

                        <Icon
                          className={`h-5 w-5 shrink-0 transition-colors ${
                            active
                              ? 'text-brand-green'
                              : 'text-white/50 group-hover:text-brand-gold'
                          }`}
                        />

                        {/* Label */}

                        <span className="truncate">
                          {item.label}
                        </span>

                        {/* Active indicator */}

                        {active && (

                          <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-brand-gold" />

                        )}

                      </Link>

                    );

                  }
                )}

              </div>

            </div>

          )
        )}

      </nav>

      {/* ===================================================
          PORTAL FOOTER
      ==================================================== */}

      <div className="border-t border-white/10 p-4">

        {/* LMS information */}

        <div className="rounded-2xl bg-white/5 p-4">

          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-gold">
            SMTC LMS
          </p>

          <p className="mt-2 text-xs leading-5 text-white/50">
            Health through innovation and research
          </p>

        </div>

        {/* =================================================
            LOGOUT
        ================================================== */}

        <button
          type="button"
          disabled={loggingOut}
          onClick={handleLogout}
          className={`mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
            loggingOut
              ? 'cursor-not-allowed bg-white/5 text-white/30'
              : 'text-white/60 hover:bg-red-500/10 hover:text-red-300'
          }`}
        >

          {loggingOut ? (

            <Loader2 className="h-5 w-5 shrink-0 animate-spin" />

          ) : (

            <LogOut className="h-5 w-5 shrink-0" />

          )}

          <span>
            {loggingOut
              ? 'Signing Out...'
              : 'Sign Out'}
          </span>

        </button>

      </div>

    </div>

  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <>

      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside
        className="fixed bottom-0 left-0 top-16 z-40 hidden w-72 bg-brand-dark lg:block"
        aria-label="Lecturer desktop navigation"
      >

        {sidebarContent}

      </aside>

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {mobileOpen && (

        <button
          type="button"
          aria-label="Close lecturer navigation"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
          onClick={closeMobileSidebar}
        />

      )}

      {/* =====================================================
          MOBILE SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 w-72 bg-brand-dark shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
        aria-label="Lecturer mobile navigation"
        aria-hidden={!mobileOpen}
      >

        {/* =================================================
            MOBILE CLOSE BUTTON
        ================================================== */}

        <div className="absolute right-3 top-3 z-10">

          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMobileSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white"
          >

            <X className="h-5 w-5" />

          </button>

        </div>

        {sidebarContent}

      </aside>

    </>

  );
}