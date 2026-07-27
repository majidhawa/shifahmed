import Link from 'next/link';
import { site } from '@/data/site';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-brand-dark text-white">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-3">
        <div>
          <h3 className="text-xl font-semibold">{site.shortName}</h3>
          <p className="mt-3 max-w-sm text-sm leading-7 text-white/75 italic">
            &ldquo;{site.mission}&rdquo;
          </p>
          <div className="mt-5 flex items-center gap-2">
  {/* Facebook */}
  <a
    href="https://www.facebook.com/profile.php?id=61589605739657"
    target="_blank"
    rel="noreferrer"
    aria-label="Facebook"
    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:bg-white/10 hover:text-white"
  >
    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  </a>

  {/* Instagram */}
  <a
    href="https://www.instagram.com/shifahmedicalcollege/"
    target="_blank"
    rel="noreferrer"
    aria-label="Instagram"
    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:bg-white/10 hover:text-white"
  >
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  </a>

  {/* LinkedIn */}
  <a
    href="https://www.linkedin.com/company/shifah-medical-training-college/"
    target="_blank"
    rel="noreferrer"
    aria-label="LinkedIn"
    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:bg-[#0077B5] hover:text-white"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1s2.5 1.12 2.5 2.5zM0 8h5v16H0V8zm8 0h4.8v2.3h.1c.7-1.3 2.4-2.7 5-2.7 5.3 0 6.3 3.5 6.3 8V24h-5v-7.1c0-1.7 0-3.9-2.4-3.9s-2.8 1.8-2.8 3.8V24H8V8z"/>
    </svg>
  </a>

  {/* TikTok */}
  <a
    href="https://www.tiktok.com/@shifah.medical.tr"
    target="_blank"
    rel="noreferrer"
    aria-label="TikTok"
    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:bg-black hover:text-white"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.35h-3.4v13.29a2.89 2.89 0 1 1-2.89-2.89c.28 0 .55.04.81.11V9.39a6.3 6.3 0 0 0-.81-.05A6.29 6.29 0 1 0 15.82 15V8.57a8.24 8.24 0 0 0 4.77 1.52V6.69z"/>
    </svg>
  </a>
</div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">Quick Links</h4>
          <div className="mt-4 grid gap-3 text-sm text-white/80">
            <Link href="/courses">Courses</Link>
            <Link href="/admissions">Admissions</Link>
            <Link href="/departments">Departments</Link>
            <Link href="/apply">Apply Now</Link>
             <Link href="/downloads">Downloads</Link>
              <Link href="/announcements">Announcements</Link>
              <Link href="/contacts">Contacts</Link>
              <Link href="/videos">Videos</Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">Contact</h4>
          <div className="mt-4 space-y-3 text-sm text-white/80">
            <p>{site.location}</p>
            <p>{site.phone}</p>
            <p>{site.email}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/55">
        © 2026 {site.shortName}. All rights reserved.
      </div>
    </footer>
  );
}
