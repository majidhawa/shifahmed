
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';

import AdminLogoutButton from '@/components/admin/AdminLogoutButton';

/* =========================================================
   NAVIGATION
========================================================= */

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Applications',
    href: '/admin/dashboard/applications',
    icon: ClipboardList,
  },
   {
    name: 'Payment Approvals',
    href: '/admin/dashboard/payment-approvals',
    icon: ClipboardList,
  },
  {
    name: 'Payments',
    href: '/admin/dashboard/payments',
    icon: CreditCard,
  },
  {
    name: 'Receipts',
    href: '/admin/dashboard/receipts',
    icon: FileText,
  },
  {
    name: 'Students',
    href: '/admin/dashboard/students',
    icon: GraduationCap,
  },
  {
    name: 'Documents',
    href: '/admin/dashboard/documents',
    icon: FileText,
  },
  {
    name: 'Reports',
    href: '/admin/dashboard/reports',
    icon: BarChart3,
  },
];

/* =========================================================
   SIDEBAR
========================================================= */

export default function AdminSidebar() {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href;
    }

    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ===================================================
          MOBILE MENU BUTTON
      ==================================================== */}

      <button
        type="button"
        aria-label="Open admin navigation"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green text-white shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ===================================================
          MOBILE OVERLAY
      ==================================================== */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-brand-dark/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ===================================================
          SIDEBAR
      ==================================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-72 flex-col
          bg-brand-green text-white shadow-2xl
          transition-transform duration-300
          lg:translate-x-0
          ${
            mobileOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >
        {/* =================================================
            BRAND
        ================================================== */}

        <div className="flex h-24 items-center justify-between border-b border-white/10 px-5">

          <Link
            href="/admin/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-lg">
              <img
                src="/images/logo.jpg"
                alt="Shifah Medical Training College"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="text-sm font-bold leading-tight text-white">
                Shifah Medical
              </p>

              <p className="text-sm font-bold leading-tight text-white">
                Training College
              </p>

              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-gold">
                Admin Portal
              </p>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        {/* =================================================
            NAVIGATION
        ================================================== */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            Main Menu
          </p>

          <div className="space-y-1.5">

            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    group flex items-center gap-3 rounded-xl
                    px-3 py-3 text-sm font-semibold
                    transition
                    ${
                      active
                        ? 'bg-white text-brand-green shadow-md'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon
                    className={`
                      h-5 w-5 shrink-0
                      ${
                        active
                          ? 'text-brand-green'
                          : 'text-white/60 group-hover:text-brand-gold'
                      }
                    `}
                  />

                  <span>{item.name}</span>

                  {item.name === 'Applications' && (
                    <span
                      className={`
                        ml-auto rounded-full px-2 py-0.5
                        text-[10px] font-bold
                        ${
                          active
                            ? 'bg-brand-green/10 text-brand-green'
                            : 'bg-brand-gold/20 text-brand-gold'
                        }
                      `}
                    >
                      New
                    </span>
                  )}
                </Link>
              );
            })}

          </div>

          {/* =================================================
              SETTINGS
          ================================================== */}

          <div className="mt-8">

            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
              System
            </p>

            <Link
              href="/admin/dashboard/settings"
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 rounded-xl px-3 py-3
                text-sm font-semibold transition
                ${
                  isActive('/admin/dashboard/settings')
                    ? 'bg-white text-brand-green shadow-md'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>

          </div>

        </nav>

        {/* =================================================
            LOGOUT
        ================================================== */}

        <div className="border-t border-white/10 p-4">

          <div className="mb-4 rounded-2xl bg-white/5 p-4">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold text-sm font-bold text-brand-dark">
                A
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  Administrator
                </p>

                <p className="text-xs text-white/50">
                  System Administrator
                </p>
              </div>

            </div>
          </div>

          <div className="[&>button]:w-full [&>button]:justify-center [&>button]:border-white/10 [&>button]:bg-white/5 [&>button]:text-white [&>button]:hover:bg-white/10 [&>button]:hover:text-white">
            <AdminLogoutButton />
          </div>

        </div>

      </aside>
    </>
  );
}

