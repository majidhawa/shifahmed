'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MarqueeBar } from '@/components/MarqueeBar';

type SiteChromeProps = {
  children: React.ReactNode;
};

export function SiteChrome({
  children,
}: SiteChromeProps) {
  const pathname = usePathname();

  /* =========================================================
     ADMIN AREA
     No public website chrome
  ========================================================= */

  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  /* =========================================================
     STUDENT DASHBOARD AREA
     
     The authenticated student portal has its own layout.
     Do NOT show:
     - Marquee
     - Public Navbar
     - Public Footer
  ========================================================= */

  if (
    pathname === '/student/dashboard' ||
    pathname.startsWith('/student/dashboard/')
  ) {
    return <>{children}</>;
  }
if (
  pathname === '/student/login' ||
  pathname.startsWith('/student/login/')
) {
  return <>{children}</>;
}

  if (
    pathname === '/lecturer/dashboard' ||
    pathname.startsWith('/lecturer/dashboard/')
  ) {
    return <>{children}</>;
  }

   if (
    pathname === '/parent/dashboard' ||
    pathname.startsWith('/parent/dashboard/')
  ) {
    return <>{children}</>;
  }
 
  /* =========================================================
     PUBLIC WEBSITE
  ========================================================= */

  return (
    <div className="flex min-h-screen flex-col">

      <MarqueeBar />

      <Navbar />

      <main className="flex-1">
        {children}
      </main>

      <Footer />

    </div>
  );
}