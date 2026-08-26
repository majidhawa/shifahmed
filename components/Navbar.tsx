'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Menu,
  X,
  GraduationCap,
  UserRound,
  Users,
  Download,
  Video,
  Megaphone,
  HelpCircle,
} from 'lucide-react';

import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
} from 'react-icons/fa';

/* =========================================================
   MAIN NAVIGATION LINKS
========================================================= */

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/courses', label: 'Courses' },
  { href: '/admissions', label: 'Admissions' },
  { href: '/departments', label: 'Departments' },
  { href: '/contact', label: 'Contact' },
];

/* =========================================================
   PORTAL LOGIN LINKS
========================================================= */

const logins = [
  {
    href: '/student/login',
    label: 'Student Portal',
    description: 'Access your student account',
    icon: GraduationCap,
  },
  {
    href: '/lecturer/login',
    label: 'Lecturer Portal',
    description: 'Access the lecturer LMS',
    icon: UserRound,
  },
  {
    href: '/parent/login',
    label: 'Parent Portal',
    description: 'Monitor student progress',
    icon: Users,
  },
];

/* =========================================================
   RESOURCES LINKS
========================================================= */

const resources = [
  {
    href: '/downloads',
    label: 'Downloads',
    description: 'Forms and useful documents',
    icon: Download,
  },
  {
    href: '/videos',
    label: 'Videos',
    description: 'Videos and learning content',
    icon: Video,
  },
  {
    href: '/announcements',
    label: 'Announcements',
    description: 'Latest college updates',
    icon: Megaphone,
  },
  {
    href: '/faqs',
    label: 'FAQs',
    description: 'Frequently asked questions',
    icon: HelpCircle,
  },
];

/* =========================================================
   NAVBAR COMPONENT
========================================================= */

export function Navbar() {
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [portalOpen, setPortalOpen] = useState(false);
  const [resourceOpen, setResourceOpen] = useState(false);

  /* =======================================================
     HANDLE SCROLL
  ======================================================= */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  /* =======================================================
     CLOSE MENUS WHEN ROUTE CHANGES
  ======================================================= */

  useEffect(() => {
    setMenuOpen(false);
    setPortalOpen(false);
    setResourceOpen(false);
  }, [pathname]);

  /* =======================================================
     ACTIVE PORTAL
  ======================================================= */

  const isPortalActive =
    pathname.startsWith('/student') ||
    pathname.startsWith('/lecturer') ||
    pathname.startsWith('/parent');

  /* =======================================================
     ACTIVE RESOURCE
  ======================================================= */

  const isResourceActive =
    pathname.startsWith('/downloads') ||
    pathname.startsWith('/videos') ||
    pathname.startsWith('/announcements') ||
    pathname.startsWith('/faqs');

  /* =======================================================
     DROPDOWN ITEM COMPONENT
  ======================================================= */

  const DropdownItem = ({
    href,
    label,
    description,
    icon: Icon,
  }: {
    href: string;
    label: string;
    description: string;
    icon: React.ElementType;
  }) => {
    const active =
      pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        href={href}
        className={`
          flex
          items-center
          gap-3
          px-5
          py-4
          transition
          ${
            active
              ? 'bg-brand-green/10 text-brand-green'
              : 'text-gray-700 hover:bg-brand-green/5 hover:text-brand-green'
          }
        `}
      >
        {/* ICON */}

        <div
          className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-lg
            transition
            ${
              active
                ? 'bg-brand-green text-white'
                : 'bg-gray-100 text-gray-600'
            }
          `}
        >
          <Icon size={19} />
        </div>

        {/* TEXT */}

        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {label}
          </p>

          <p className="mt-0.5 text-xs text-gray-400">
            {description}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <div className="bg-brand-dark">
        <div className="container-shell flex items-center justify-between py-2">

          {/* TAGLINE */}

          <p className="hidden md:block text-[11px] uppercase tracking-widest text-white/60">
            Health through innovation and research
          </p>

          {/* CONTACT + SOCIAL MEDIA */}

          <div className="flex items-center gap-4 text-xs text-white/70">

            {/* PHONE */}

            <span className="hidden lg:flex items-center gap-1">
              <Phone size={13} />
              +254 142 068933
            </span>

            {/* EMAIL */}

            <span className="hidden lg:flex items-center gap-1">
              <Mail size={13} />
              admin@shifahmedicalcollege.co.ke
            </span>

            {/* SOCIAL MEDIA */}

            <div className="flex gap-2">

              {/* FACEBOOK */}

              <a
                href="https://www.facebook.com/profile.php?id=61589605739657"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="
                  flex h-7 w-7
                  items-center justify-center
                  rounded-full
                  border border-white/20
                  hover:bg-blue-600
                  transition
                "
              >
                <FaFacebookF size={12} />
              </a>

              {/* INSTAGRAM */}

              <a
                href="https://www.instagram.com/shifahmedicalcollege/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="
                  flex h-7 w-7
                  items-center justify-center
                  rounded-full
                  border border-white/20
                  hover:bg-pink-600
                  transition
                "
              >
                <FaInstagram size={12} />
              </a>

              {/* TIKTOK */}

              <a
                href="https://www.tiktok.com/@shifah.medical.tr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="
                  flex h-7 w-7
                  items-center justify-center
                  rounded-full
                  border border-white/20
                  hover:bg-black
                  transition
                "
              >
                <FaTiktok size={12} />
              </a>

              {/* WHATSAPP */}

              <a
                href="https://wa.me/254794882948"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="
                  flex h-7 w-7
                  items-center justify-center
                  rounded-full
                  border border-white/20
                  hover:bg-green-600
                  transition
                "
              >
                <FaWhatsapp size={13} />
              </a>

            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MAIN HEADER
      ===================================================== */}

      <div
        className={`
          bg-white
          transition
          ${
            scrolled
              ? 'shadow-xl'
              : 'shadow-sm'
          }
        `}
      >

        <div className="container-shell flex items-center justify-between py-3">

          {/* =================================================
              LOGO
          ================================================= */}

          <Link
            href="/"
            className="flex items-center gap-3"
          >

            <img
              src="/images/logo.png"
              alt="Shifah Medical Training College"
              className="h-16 w-auto"
            />

            <div className="hidden sm:block leading-tight">

              <p className="text-lg font-bold text-brand-green">
                Shifah Medical
              </p>

              <p className="text-[11px] uppercase tracking-widest text-gray-400">
                Training College
              </p>

            </div>

          </Link>

          {/* =================================================
              DESKTOP CONTACT + APPLY
          ================================================= */}

          <div className="hidden lg:flex items-center gap-4 text-xs text-gray-600">

            {/* LOCATION */}

            <span className="flex items-center gap-2">
              <MapPin
                size={15}
                className="text-brand-green"
              />

              Ambwere Plaza, Kitale
            </span>

            {/* APPLY */}

            <Link
              href="/apply"
              className="
                rounded-full
                bg-brand-green
                px-6
                py-2.5
                text-white
                font-semibold
                hover:bg-green-800
                transition
              "
            >
              Apply Now
            </Link>

          </div>

          {/* =================================================
              MOBILE MENU BUTTON
          ================================================= */}

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={
              menuOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            className="
              lg:hidden
              rounded-lg
              border
              border-gray-200
              p-2
              text-gray-700
              hover:bg-gray-100
              transition
            "
          >
            {menuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>

        </div>

        {/* =====================================================
            DESKTOP NAVIGATION
        ===================================================== */}

        <div className="container-shell hidden lg:flex">

          <nav className="flex items-center">

            {/* =================================================
                MAIN LINKS
            ================================================= */}

            {links.map((link) => {
              const active =
                pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative
                    px-4
                    py-4
                    text-sm
                    font-medium
                    transition
                    ${
                      active
                        ? 'text-brand-green'
                        : 'text-slate-600 hover:text-brand-green'
                    }
                  `}
                >

                  {link.label}

                  {/* ACTIVE LINE */}

                  {active && (
                    <span
                      className="
                        absolute
                        bottom-0
                        left-3
                        right-3
                        h-0.5
                        bg-brand-gold
                      "
                    />
                  )}

                </Link>
              );
            })}

            {/* =================================================
                PORTAL LOGIN DROPDOWN
            ================================================= */}

            <div className="relative group">

              <button
                type="button"
                className={`
                  relative
                  flex
                  items-center
                  gap-1
                  px-4
                  py-4
                  text-sm
                  font-medium
                  transition
                  ${
                    isPortalActive
                      ? 'text-brand-green'
                      : 'text-slate-600 hover:text-brand-green'
                  }
                `}
              >

                Portal Login

                <ChevronDown
                  size={15}
                  className="
                    transition-transform
                    duration-200
                    group-hover:rotate-180
                  "
                />

                {isPortalActive && (
                  <span
                    className="
                      absolute
                      bottom-0
                      left-3
                      right-3
                      h-0.5
                      bg-brand-gold
                    "
                  />
                )}

              </button>

              {/* PORTAL DROPDOWN */}

              <div
                className="
                  absolute
                  left-0
                  top-full
                  hidden
                  w-72
                  overflow-hidden
                  rounded-xl
                  border
                  border-gray-100
                  bg-white
                  shadow-xl
                  group-hover:block
                "
              >

                {/* HEADER */}

                <div
                  className="
                    border-b
                    bg-gray-50
                    px-5
                    py-4
                  "
                >

                  <p className="text-sm font-bold text-gray-800">
                    Portal Login
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Select your portal to continue
                  </p>

                </div>

                {/* PORTALS */}

                {logins.map((login) => (
                  <DropdownItem
                    key={login.href}
                    href={login.href}
                    label={login.label}
                    description={login.description}
                    icon={login.icon}
                  />
                ))}

              </div>

            </div>

            {/* =================================================
                RESOURCES DROPDOWN
            ================================================= */}

            <div className="relative group">

              <button
                type="button"
                className={`
                  relative
                  flex
                  items-center
                  gap-1
                  px-4
                  py-4
                  text-sm
                  font-medium
                  transition
                  ${
                    isResourceActive
                      ? 'text-brand-green'
                      : 'text-slate-600 hover:text-brand-green'
                  }
                `}
              >

                Resources

                <ChevronDown
                  size={15}
                  className="
                    transition-transform
                    duration-200
                    group-hover:rotate-180
                  "
                />

                {isResourceActive && (
                  <span
                    className="
                      absolute
                      bottom-0
                      left-3
                      right-3
                      h-0.5
                      bg-brand-gold
                    "
                  />
                )}

              </button>

              {/* RESOURCE DROPDOWN */}

              <div
                className="
                  absolute
                  left-0
                  top-full
                  hidden
                  w-72
                  overflow-hidden
                  rounded-xl
                  border
                  border-gray-100
                  bg-white
                  shadow-xl
                  group-hover:block
                "
              >

                {/* HEADER */}

                <div
                  className="
                    border-b
                    bg-gray-50
                    px-5
                    py-4
                  "
                >

                  <p className="text-sm font-bold text-gray-800">
                    Resources
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Explore useful college resources
                  </p>

                </div>

                {/* RESOURCES */}

                {resources.map((resource) => (
                  <DropdownItem
                    key={resource.href}
                    href={resource.href}
                    label={resource.label}
                    description={resource.description}
                    icon={resource.icon}
                  />
                ))}

              </div>

            </div>

          </nav>

        </div>

        {/* =====================================================
            MOBILE MENU
        ===================================================== */}

        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">

            <nav className="container-shell flex flex-col py-4">

              {/* =================================================
                  MAIN LINKS
              ================================================= */}

              {links.map((link) => {
                const active =
                  pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      rounded-lg
                      px-4
                      py-3
                      text-sm
                      font-medium
                      transition
                      ${
                        active
                          ? 'bg-brand-green/10 text-brand-green'
                          : 'text-slate-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* =================================================
                  MOBILE PORTAL LOGIN
              ================================================= */}

              <button
                type="button"
                onClick={() => {
                  setPortalOpen(!portalOpen);
                  setResourceOpen(false);
                }}
                className={`
                  flex
                  items-center
                  justify-between
                  rounded-lg
                  px-4
                  py-3
                  text-sm
                  font-medium
                  transition
                  ${
                    isPortalActive
                      ? 'bg-brand-green/10 text-brand-green'
                      : 'text-slate-700 hover:bg-gray-100'
                  }
                `}
              >

                <span>Portal Login</span>

                <ChevronDown
                  size={18}
                  className={`
                    transition-transform
                    duration-200
                    ${
                      portalOpen
                        ? 'rotate-180'
                        : ''
                    }
                  `}
                />

              </button>

              {/* MOBILE PORTALS */}

              {portalOpen && (
                <div className="ml-4 border-l border-gray-200 pl-2">

                  {logins.map((login) => {
                    const Icon = login.icon;

                    const active =
                      pathname === login.href;

                    return (
                      <Link
                        key={login.href}
                        href={login.href}
                        className={`
                          flex
                          items-center
                          gap-3
                          rounded-lg
                          px-4
                          py-3
                          transition
                          ${
                            active
                              ? 'bg-brand-green/10 text-brand-green'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-brand-green'
                          }
                        `}
                      >

                        <div
                          className={`
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            ${
                              active
                                ? 'bg-brand-green text-white'
                                : 'bg-gray-100 text-gray-600'
                            }
                          `}
                        >
                          <Icon size={17} />
                        </div>

                        <div>

                          <p className="text-sm font-semibold">
                            {login.label}
                          </p>

                          <p className="text-[11px] text-gray-400">
                            {login.description}
                          </p>

                        </div>

                      </Link>
                    );
                  })}

                </div>
              )}

              {/* =================================================
                  MOBILE RESOURCES
              ================================================= */}

              <button
                type="button"
                onClick={() => {
                  setResourceOpen(!resourceOpen);
                  setPortalOpen(false);
                }}
                className={`
                  flex
                  items-center
                  justify-between
                  rounded-lg
                  px-4
                  py-3
                  text-sm
                  font-medium
                  transition
                  ${
                    isResourceActive
                      ? 'bg-brand-green/10 text-brand-green'
                      : 'text-slate-700 hover:bg-gray-100'
                  }
                `}
              >

                <span>Resources</span>

                <ChevronDown
                  size={18}
                  className={`
                    transition-transform
                    duration-200
                    ${
                      resourceOpen
                        ? 'rotate-180'
                        : ''
                    }
                  `}
                />

              </button>

              {/* MOBILE RESOURCES */}

              {resourceOpen && (
                <div className="ml-4 border-l border-gray-200 pl-2">

                  {resources.map((resource) => {
                    const Icon = resource.icon;

                    const active =
                      pathname === resource.href;

                    return (
                      <Link
                        key={resource.href}
                        href={resource.href}
                        className={`
                          flex
                          items-center
                          gap-3
                          rounded-lg
                          px-4
                          py-3
                          transition
                          ${
                            active
                              ? 'bg-brand-green/10 text-brand-green'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-brand-green'
                          }
                        `}
                      >

                        <div
                          className={`
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            ${
                              active
                                ? 'bg-brand-green text-white'
                                : 'bg-gray-100 text-gray-600'
                            }
                          `}
                        >
                          <Icon size={17} />
                        </div>

                        <div>

                          <p className="text-sm font-semibold">
                            {resource.label}
                          </p>

                          <p className="text-[11px] text-gray-400">
                            {resource.description}
                          </p>

                        </div>

                      </Link>
                    );
                  })}

                </div>
              )}

              {/* =================================================
                  MOBILE APPLY BUTTON
              ================================================= */}

              <Link
                href="/apply"
                className="
                  mt-4
                  rounded-full
                  bg-brand-green
                  py-3
                  text-center
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-green-800
                  transition
                "
              >
                Apply Now
              </Link>

            </nav>

          </div>
        )}

      </div>

    </header>
  );
}