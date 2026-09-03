'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  FileText,
  CreditCard,
  GraduationCap,
  FolderOpen,
  UserCircle,
  Bell,
  Phone,
  BookOpen,
  ClipboardList,
  HelpCircle,
  BarChart3,
  TrendingUp,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface StudentSidebarProps {
  fullName: string;
  studentInitial: string;
  portalRole: string;
  portalLabel: string;
  hasActiveAdmission: boolean;
}

export default function StudentSidebar({
  fullName,
  studentInitial,
  portalRole,
  portalLabel,
  hasActiveAdmission,
}: StudentSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-white/10 bg-[#0c1f1a] lg:flex">
      {/* ============================================================
          BRAND
      ============================================================ */}
      <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-5">
        <Link
          href="/student/dashboard"
          className="group flex items-center gap-3"
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/10">
            <Image
              src="/images/logo.jpg"
              alt="Shifah Medical Training College"
              fill
              sizes="44px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide text-white">
              SHIFAH MTC
            </p>

            <p className="mt-0.5 truncate text-[11px] text-white/45">
              {portalLabel}
            </p>
          </div>
        </Link>
      </div>

      {/* ============================================================
          STUDENT PROFILE
      ============================================================ */}
      <div className="shrink-0 border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d7a93b] text-sm font-bold text-[#0c1f1a] shadow-sm">
            {studentInitial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {fullName || 'Student'}
            </p>

            <div className="mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

              <span className="text-[11px] font-medium text-white/45">
                {portalRole}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          NAVIGATION
      ============================================================ */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {/* ----------------------------------------------------------
            MAIN MENU
        ---------------------------------------------------------- */}
        <SidebarSectionTitle>
          Main Menu
        </SidebarSectionTitle>

        <div className="space-y-1">
          <SidebarItem
            href="/student/dashboard"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            pathname={pathname}
            exact
          />

          <SidebarItem
            href="/student/dashboard/application"
            icon={<FileText size={18} />}
            label="My Application"
            pathname={pathname}
          />

          <SidebarItem
            href="/student/dashboard/payment"
            icon={<CreditCard size={18} />}
            label="Payment & Receipt"
            pathname={pathname}
          />

          <SidebarItem
            href="/student/dashboard/admission"
            icon={<GraduationCap size={18} />}
            label="Admission"
            pathname={pathname}
          />

          <SidebarItem
            href="/student/dashboard/documents"
            icon={<FolderOpen size={18} />}
            label="My Documents"
            pathname={pathname}
          />

          <SidebarItem
            href="/student/dashboard/profile"
            icon={<UserCircle size={18} />}
            label="My Profile"
            pathname={pathname}
          />
        </div>

        {/* ----------------------------------------------------------
            ACADEMICS
        ---------------------------------------------------------- */}
        {hasActiveAdmission && (
          <>
            <SidebarSectionTitle>
              Academics
            </SidebarSectionTitle>

            <div className="space-y-1">
              <SidebarItem
                href="/student/dashboard/courses"
                icon={<BookOpen size={18} />}
                label="My Courses"
                pathname={pathname}
              />

              <SidebarItem
                href="/student/dashboard/units"
                icon={<BookOpen size={18} />}
                label="Units & Lessons"
                pathname={pathname}
              />

              <SidebarItem
                href="/student/dashboard/assignments"
                icon={<ClipboardList size={18} />}
                label="Assignments"
                pathname={pathname}
              />

              <SidebarItem
                href="/student/dashboard/quizzes"
                icon={<HelpCircle size={18} />}
                label="Quizzes"
                pathname={pathname}
              />

              <SidebarItem
                href="/student/dashboard/results"
                icon={<BarChart3 size={18} />}
                label="My Results"
                pathname={pathname}
              />

              <SidebarItem
                href="/student/dashboard/progress"
                icon={<TrendingUp size={18} />}
                label="Learning Progress"
                pathname={pathname}
              />
            </div>
          </>
        )}

        {/* ----------------------------------------------------------
            SUPPORT
        ---------------------------------------------------------- */}
        <SidebarSectionTitle>
          Support
        </SidebarSectionTitle>

        <div className="space-y-1">
          <SidebarItem
            href="/student/dashboard/notifications"
            icon={<Bell size={18} />}
            label="Notifications"
            pathname={pathname}
          />

          <SidebarItem
            href="/student/dashboard/contact"
            icon={<Phone size={18} />}
            label="Contact Admissions"
            pathname={pathname}
          />
        </div>
      </nav>

      {/* ============================================================
          LOGOUT
      ============================================================ */}
      <div className="shrink-0 border-t border-white/10 p-4">
        <form action="/api/student/logout" method="POST">
          <button
            type="submit"
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-white/55 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 transition-colors group-hover:bg-red-500/10">
              <LogOut size={17} />
            </span>

            <span className="flex-1">
              Sign Out
            </span>

            <ChevronRight
              size={15}
              className="text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-red-300"
            />
          </button>
        </form>
      </div>
    </aside>
  );
}

/* ================================================================
   SECTION TITLE
================================================================ */

function SidebarSectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 mt-6 first:mt-0 px-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
        {children}
      </p>
    </div>
  );
}

/* ================================================================
   SIDEBAR ITEM
================================================================ */

function SidebarItem({
  href,
  icon,
  label,
  pathname,
  exact = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  pathname: string;
  exact?: boolean;
}) {
  const isActive = exact
    ? pathname === href
    : pathname === href ||
      pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-[#0f4f3f] text-white shadow-sm'
          : 'text-white/55 hover:bg-white/[0.05] hover:text-white'
      }`}
    >
      {/* Active indicator */}
      <span
        className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200 ${
          isActive
            ? 'bg-[#d7a93b] opacity-100'
            : 'bg-transparent opacity-0'
        }`}
      />

      {/* Icon */}
      <span
        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-white/10 text-[#d7a93b]'
            : 'text-white/45 group-hover:bg-[#0f4f3f] group-hover:text-white'
        }`}
      >
        {icon}
      </span>

      {/* Label */}
      <span className="relative flex-1 truncate">
        {label}
      </span>

      {/* Active / hover arrow */}
      <ChevronRight
        size={14}
        className={`relative shrink-0 transition-all duration-200 ${
          isActive
            ? 'translate-x-0 text-[#d7a93b] opacity-100'
            : 'text-white/20 opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100'
        }`}
      />
    </Link>
  );
}