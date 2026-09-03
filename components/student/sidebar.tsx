import Link from 'next/link';
import type { ReactNode } from 'react';

import { ChevronRight } from 'lucide-react';

/* =========================================================
   SIDEBAR SECTION TITLE
========================================================= */

export function SidebarSectionTitle({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 ${className}`}
    >
      {children}
    </p>
  );
}

/* =========================================================
   SIDEBAR ITEM
========================================================= */

export function SidebarItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        group flex items-center gap-3 rounded-xl
        px-3.5 py-3 text-sm font-medium
        transition
        ${
          active
            ? 'bg-[#d7a93b] text-[#0c1f1a] shadow-sm'
            : 'text-white/65 hover:bg-white/10 hover:text-white'
        }
      `}
    >
      <span
        className={`
          transition
          ${
            active
              ? 'text-[#0c1f1a]'
              : 'text-white/50 group-hover:text-[#d7a93b]'
          }
        `}
      >
        {icon}
      </span>

      <span className="flex-1">
        {label}
      </span>

      {!active && (
        <ChevronRight
          size={14}
          className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-50"
        />
      )}
    </Link>
  );
}