import { ReactNode } from 'react';

import LecturerHeader from '@/components/lecturer/LecturerHeader';
import LecturerSidebar from '@/components/lecturer/LecturerSidebar';

/* =========================================================
   LECTURER PORTAL LAYOUT
   Shifah Medical Training College LMS

   IMPORTANT:
   - Never statically cache lecturer pages.
   - Always render the portal dynamically.
   - Protected pages must be revalidated after logout.
========================================================= */

export const dynamic = 'force-dynamic';

export const revalidate = 0;

export const fetchCache = 'force-no-store';

export const dynamicParams = true;

/* =========================================================
   LAYOUT
========================================================= */

export default function LecturerPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-brand-cream"
      style={{
        WebkitOverflowScrolling: 'touch',
      }}
    >

      {/* =====================================================
          LECTURER HEADER
      ===================================================== */}

      <LecturerHeader />

      {/* =====================================================
          PORTAL BODY
      ===================================================== */}

      <div className="flex">

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <LecturerSidebar />

        {/* ===================================================
            MAIN CONTENT
        =================================================== */}

        <main className="min-w-0 flex-1 lg:ml-72">
          {children}
        </main>

      </div>

    </div>
  );
}