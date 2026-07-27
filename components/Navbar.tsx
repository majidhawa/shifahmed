'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/courses', label: 'Courses' },
  { href: '/admissions', label: 'Admissions' },
  { href: '/departments', label: 'Departments' },
  { href: '/contact', label: 'Contact' },
  { href: '/downloads', label: 'Downloads' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/videos', label: 'Videos' }
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="bg-brand-dark">
        <div className="container-shell flex items-center justify-between py-2">
          <p className="text-[11px] tracking-widest text-white/50 uppercase">Health through innovation and research</p>
          <div className="flex items-center gap-2">
            <Link href="https://www.facebook.com/profile.php?id=61589605739657" target="_blank" rel="noreferrer" aria-label="Facebook" className="group flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all duration-300 hover:border-brand-gold/50 hover:text-brand-gold hover:scale-110">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </Link>
            <Link href="https://www.instagram.com/shifahmedicalcollege/" target="_blank" rel="noreferrer" aria-label="Instagram" className="group flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all duration-300 hover:border-brand-gold/50 hover:text-brand-gold hover:scale-110">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </Link>
             <Link
    href="https://www.tiktok.com/@shifah.medical.tr"
    target="_blank"
    rel="noreferrer"
    aria-label="TikTok"
    className="group flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all duration-300 hover:border-white hover:text-white hover:scale-110"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.35h-3.4v13.29a2.89 2.89 0 1 1-2.89-2.89c.28 0 .55.04.81.11V9.39a6.3 6.3 0 0 0-.81-.05A6.29 6.29 0 1 0 15.82 15V8.57a8.24 8.24 0 0 0 4.77 1.52V6.69z"/>
    </svg>
  </Link>
   {/* WhatsApp */}
  <Link
    href="https://wa.me/254794882948"
    target="_blank"
    rel="noreferrer"
    aria-label="WhatsApp"
    className="group flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all duration-300 hover:border-[#25D366] hover:text-[#25D366] hover:scale-110"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.42 0 .04 5.38.04 12c0 2.11.55 4.17 1.6 6L0 24l6.19-1.62A11.95 11.95 0 0 0 12.04 24C18.66 24 24 18.62 24 12c0-3.19-1.24-6.19-3.48-8.52zM12.04 21.84c-1.83 0-3.62-.49-5.19-1.42l-.37-.22-3.67.96.98-3.58-.24-.37A9.8 9.8 0 1 1 12.04 21.84zm5.4-7.36c-.3-.15-1.79-.88-2.06-.98-.28-.1-.48-.15-.69.15-.2.3-.79.98-.96 1.18-.18.2-.35.23-.65.08-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.69-1.66-.95-2.27-.25-.6-.5-.52-.69-.53h-.59c-.2 0-.53.08-.81.38-.28.3-1.07 1.05-1.07 2.56 0 1.5 1.1 2.95 1.25 3.15.15.2 2.16 3.3 5.23 4.62.73.32 1.3.51 1.74.65.73.23 1.39.2 1.91.12.58-.09 1.79-.73 2.04-1.44.25-.71.25-1.32.18-1.44-.08-.12-.28-.2-.58-.35z"/>
    </svg>
  </Link>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-300 ${scrolled ? 'bg-white shadow-lg shadow-black/8' : 'bg-white shadow-sm'}`}>
        <div className="container-shell flex items-center justify-between border-b border-slate-100 py-3">
          <Link href="/" className="group flex items-center gap-3">
            <img src="/images/logo.png" alt="Shifah Medical Training College" className="h-16 w-auto object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110" />
            <div className="hidden sm:block leading-tight">
              <p className="text-base font-bold text-brand-green tracking-tight">Shifah Medical</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Training College</p>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-3">
            <a href="tel:+254142068933" className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs text-slate-600 transition-all duration-200 hover:border-brand-green/40 hover:bg-brand-green/5 hover:text-brand-green">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg>
              +254 142 068933
            </a>
            <a href="mailto:admin@shifahmedicalcollege.co.ke" className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs text-slate-600 transition-all duration-200 hover:border-brand-green/40 hover:bg-brand-green/5 hover:text-brand-green">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              admin@shifahmedicalcollege.co.ke
            </a>
            <span className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs text-slate-600">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Ambwere Plaza, Kitale
            </span>
          </div>
        </div>

        <div className="container-shell flex items-center justify-between">
          <nav className="hidden lg:flex items-center">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} className={`group relative px-4 py-4 text-sm font-medium transition-colors duration-200 ${active ? 'text-brand-green' : 'text-slate-600 hover:text-brand-green'}`}>
                  {link.label}
                  <span className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-brand-gold transition-all duration-300 ${active ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-100'}`} />
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 py-2">
            <Link href="/apply" className="hidden md:inline-flex items-center gap-2 rounded-full bg-brand-green px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-green/25 transition-all duration-300 hover:bg-brand-dark hover:shadow-lg hover:shadow-brand-green/20 hover:-translate-y-0.5 active:translate-y-0">
              Apply Now
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <button onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu" className="flex lg:hidden flex-col justify-center items-center w-10 h-10 gap-[5px] rounded-xl border border-slate-200 hover:border-brand-green/30 hover:bg-slate-50 transition-all duration-200">
              <span className={`block h-[2px] w-5 rounded bg-slate-700 transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block h-[2px] w-5 rounded bg-slate-700 transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block h-[2px] w-5 rounded bg-slate-700 transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className={`lg:hidden overflow-hidden transition-all duration-400 ease-in-out ${menuOpen ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="border-t border-slate-100 bg-white shadow-xl">
          <nav className="container-shell flex flex-col py-4 gap-1">
            {links.map((link, i) => {
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} style={{ transitionDelay: menuOpen ? `${i * 40}ms` : '0ms' }} className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${active ? 'bg-brand-green/8 text-brand-green' : 'text-slate-700 hover:bg-slate-50 hover:text-brand-green'}`}>
                  {link.label}
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />}
                </Link>
              );
            })}
            <Link href="/apply" className="mt-3 flex items-center justify-center gap-2 rounded-full bg-brand-green py-3 text-sm font-semibold text-white shadow-md shadow-brand-green/20 transition hover:bg-brand-dark">
              Apply Now
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
