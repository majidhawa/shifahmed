
import Link from 'next/link';
import { site } from '@/data/site';

import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
} from 'lucide-react';

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
} from 'react-icons/fa';

export function Footer() {
  return (
    <footer className="w-full bg-brand-dark text-white">

      {/* =====================================================
          MAIN FOOTER
      ===================================================== */}

      <div className="container-shell grid gap-10 py-14 md:grid-cols-4">

        {/* ===================================================
            ABOUT COLLEGE
        =================================================== */}

        <div>

          <h3 className="text-xl font-bold text-white">
            {site.shortName}
          </h3>

          <p className="mt-4 text-sm leading-7 text-white/70 italic">
            &quot;{site.mission}&quot;
          </p>

          {/* SOCIAL MEDIA */}

          <div className="mt-6 flex gap-3">

            <a
              href="https://www.facebook.com/profile.php?id=61589605739657"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:bg-blue-600 hover:text-white"
            >
              <FaFacebookF size={14} />
            </a>

            <a
              href="https://www.instagram.com/shifahmedicalcollege/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:bg-pink-600 hover:text-white"
            >
              <FaInstagram size={15} />
            </a>

            <a
              href="https://www.linkedin.com/company/shifah-medical-training-college/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:bg-blue-700 hover:text-white"
            >
              <FaLinkedinIn size={15} />
            </a>

            <a
              href="https://www.tiktok.com/@shifah.medical.tr"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:bg-black hover:text-white"
            >
              <FaTiktok size={14} />
            </a>

          </div>

        </div>

        {/* ===================================================
            QUICK LINKS
        =================================================== */}

        <div>

          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Quick Links
          </h4>

          <div className="mt-5 grid gap-3 text-sm text-white/75">

            <Link
              href="/"
              className="transition hover:text-brand-gold"
            >
              Home
            </Link>

            <Link
              href="/about"
              className="transition hover:text-brand-gold"
            >
              About Us
            </Link>

            <Link
              href="/courses"
              className="transition hover:text-brand-gold"
            >
              Courses
            </Link>

            <Link
              href="/admissions"
              className="transition hover:text-brand-gold"
            >
              Admissions
            </Link>

            <Link
              href="/departments"
              className="transition hover:text-brand-gold"
            >
              Departments
            </Link>

            <Link
              href="/contact"
              className="transition hover:text-brand-gold"
            >
              Contact
            </Link>

            <Link
              href="/apply"
              className="transition hover:text-brand-gold"
            >
              Apply Now
            </Link>

            <Link
              href="/student/login"
              className="transition hover:text-brand-gold"
            >
              Student Portal
            </Link>

          </div>

        </div>

        {/* ===================================================
            RESOURCES
        =================================================== */}

        <div>

          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Resources
          </h4>

          <div className="mt-5 grid gap-3 text-sm text-white/75">

            <Link
              href="/downloads"
              className="transition hover:text-brand-gold"
            >
              Downloads
            </Link>

            <Link
              href="/videos"
              className="transition hover:text-brand-gold"
            >
              Videos
            </Link>

            <Link
              href="/announcements"
              className="transition hover:text-brand-gold"
            >
              Announcements
            </Link>

            <Link
              href="/faqs"
              className="transition hover:text-brand-gold"
            >
              FAQs
            </Link>

          </div>

        </div>

        {/* ===================================================
            CONTACT DETAILS
        =================================================== */}

        <div>

          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Contact Us
          </h4>

          <div className="mt-5 space-y-4 text-sm text-white/75">

            <p className="flex items-start gap-3">

              <MapPin
                size={18}
                className="mt-1 shrink-0 text-brand-gold"
              />

              <span>
                {site.location}
              </span>

            </p>

            <p className="flex items-center gap-3">

              <Phone
                size={18}
                className="shrink-0 text-brand-gold"
              />

              <span>
                {site.phone}
              </span>

            </p>

            <p className="flex items-center gap-3">

              <Mail
                size={18}
                className="shrink-0 text-brand-gold"
              />

              <span>
                {site.email}
              </span>

            </p>

            <a
              href="https://wa.me/254794882948"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
            >

              <MessageCircle size={17} />

              Chat Admissions

            </a>

          </div>

        </div>

      </div>

      {/* =====================================================
          COPYRIGHT
      ===================================================== */}

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">

        © 2026 {site.shortName}. All rights reserved.

      </div>

    </footer>
  );
}

