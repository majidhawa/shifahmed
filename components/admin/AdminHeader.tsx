
'use client';

import { Bell, Search } from 'lucide-react';

type AdminHeaderProps = {
  adminName: string;
  adminEmail: string;
};

export default function AdminHeader({
  adminName,
  adminEmail,
}: AdminHeaderProps) {
  const initials = adminName
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* Search */}
        <div className="hidden w-full max-w-md md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              placeholder="Search applications, students..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">

          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-brand-green/20 hover:bg-brand-green/5 hover:text-brand-green"
          >
            <Bell className="h-5 w-5" />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-gold ring-2 ring-white" />
          </button>

          {/* Divider */}
          <div className="hidden h-9 w-px bg-slate-200 sm:block" />

          {/* Administrator */}
          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-brand-dark">
                {adminName}
              </p>

              <p className="text-xs text-slate-500">
                {adminEmail}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-white ring-4 ring-brand-green/10">
              {initials || 'A'}
            </div>

          </div>

        </div>

      </div>
    </header>
  );
}

