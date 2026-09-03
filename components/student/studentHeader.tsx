'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Bell,
  ChevronRight,
} from 'lucide-react';

interface StudentHeaderProps {
  firstName: string;
  studentInitial: string;
  portalLabel: string;
  hasActiveAdmission: boolean;
  admissionNumber: string | null;
  applicationNumber: string | null;
}

const pageTitles: Record<string, string> = {
  '/student/dashboard': 'Dashboard',
  '/student/dashboard/application': 'My Application',
  '/student/dashboard/payment': 'Payment & Receipt',
  '/student/dashboard/admission': 'Admission',
  '/student/dashboard/documents': 'My Documents',
  '/student/dashboard/profile': 'My Profile',
  '/student/dashboard/courses': 'My Courses',
  '/student/dashboard/units': 'Units & Lessons',
  '/student/dashboard/assignments': 'Assignments',
  '/student/dashboard/quizzes': 'Quizzes',
  '/student/dashboard/results': 'My Results',
  '/student/dashboard/progress': 'Learning Progress',
  '/student/dashboard/notifications': 'Notifications',
  '/student/dashboard/contact': 'Contact Admissions',
};

export default function StudentHeader({
  firstName,
  studentInitial,
  portalLabel,
  hasActiveAdmission,
  admissionNumber,
  applicationNumber,
}: StudentHeaderProps) {
  const pathname = usePathname();

  const pageTitle =
    pageTitles[pathname] ||
    getPageTitle(pathname);

  const displayNumber = hasActiveAdmission
    ? admissionNumber ||
      applicationNumber ||
      'Student'
    : applicationNumber ||
      'Applicant';

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* ========================================================
            PAGE TITLE
        ======================================================== */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0f4f3f]">
              {portalLabel}
            </span>

            <ChevronRight
              size={13}
              className="shrink-0 text-gray-300"
            />

            <span className="truncate text-xs font-medium text-gray-400">
              {pageTitle}
            </span>
          </div>

          <h1 className="mt-1 truncate text-lg font-bold text-[#0c1f1a] sm:text-xl">
            {pathname === '/student/dashboard'
              ? `Welcome back, ${firstName}`
              : pageTitle}
          </h1>
        </div>

        {/* ========================================================
            HEADER ACTIONS
        ======================================================== */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          {/* Notifications */}
          <Link
            href="/student/dashboard/notifications"
            aria-label="Notifications"
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 ${
              pathname ===
              '/student/dashboard/notifications'
                ? 'border-[#0f4f3f]/20 bg-[#0f4f3f]/10 text-[#0f4f3f]'
                : 'border-gray-200 text-gray-500 hover:border-[#0f4f3f]/20 hover:bg-[#0f4f3f]/5 hover:text-[#0f4f3f]'
            }`}
          >
            <Bell size={19} />

            {/* Notification indicator */}
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#d7a93b]" />
          </Link>

          {/* Desktop student identity */}
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-sm font-semibold text-[#0c1f1a]">
                {firstName}
              </p>

              <p className="mt-0.5 max-w-[190px] truncate font-mono text-[10px] text-gray-400">
                {displayNumber}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f4f3f] text-sm font-bold text-white shadow-sm">
              {studentInitial}
            </div>
          </div>

          {/* Mobile student identity */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f4f3f] text-sm font-bold text-white shadow-sm sm:hidden">
            {studentInitial}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ================================================================
   FALLBACK PAGE TITLE
================================================================ */

function getPageTitle(pathname: string) {
  const segments = pathname
    .split('/')
    .filter(Boolean);

  const lastSegment =
    segments[segments.length - 1] || 'dashboard';

  return lastSegment
    .split('-')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ');
}