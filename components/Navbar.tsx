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
} from 'lucide-react';

import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
} from 'react-icons/fa';


const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/courses', label: 'Courses' },
  { href: '/admissions', label: 'Admissions' },
  { href: '/departments', label: 'Departments' },
  { href: '/contact', label: 'Contact' },
   { href: '/student/login', label: 'Student Portal' },
];


const resources = [
  { href: '/downloads', label: 'Downloads' },
  { href: '/videos', label: 'Videos' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/faqs', label: 'FAQs' },
];


export function Navbar() {

  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resourceOpen, setResourceOpen] = useState(false);


  useEffect(() => {

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);

  }, []);



  useEffect(() => {

    setMenuOpen(false);
    setResourceOpen(false);

  }, [pathname]);



  return (

    <header className="sticky top-0 z-50 w-full">


      {/* TOP BAR */}

      <div className="bg-brand-dark">

        <div className="container-shell flex items-center justify-between py-2">


          <p className="hidden md:block text-[11px] uppercase tracking-widest text-white/60">
            Health through innovation and research
          </p>



          <div className="flex items-center gap-4 text-xs text-white/70">


            <span className="hidden lg:flex items-center gap-1">
              <Phone size={13}/>
              +254 142 068933
            </span>


            <span className="hidden lg:flex items-center gap-1">
              <Mail size={13}/>
              admin@shifahmedicalcollege.co.ke
            </span>



            <div className="flex gap-2">


              <a
                href="https://www.facebook.com/profile.php?id=61589605739657"
                target="_blank"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 hover:bg-blue-600 transition"
              >
                <FaFacebookF size={12}/>
              </a>


              <a
                href="https://www.instagram.com/shifahmedicalcollege/"
                target="_blank"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 hover:bg-pink-600 transition"
              >
                <FaInstagram size={12}/>
              </a>


              <a
                href="https://www.tiktok.com/@shifah.medical.tr"
                target="_blank"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 hover:bg-black transition"
              >
                <FaTiktok size={12}/>
              </a>


              <a
                href="https://wa.me/254794882948"
                target="_blank"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 hover:bg-green-600 transition"
              >
                <FaWhatsapp size={13}/>
              </a>


            </div>

          </div>

        </div>

      </div>




      {/* MAIN HEADER */}

      <div className={`bg-white transition ${scrolled ? 'shadow-xl' : 'shadow-sm'}`}>

        <div className="container-shell flex items-center justify-between py-3">


          {/* LOGO */}

          <Link href="/" className="flex items-center gap-3">

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





          {/* CONTACT INFO */}

          <div className="hidden lg:flex items-center gap-4 text-xs text-gray-600">


            <span className="flex items-center gap-2">
              <MapPin size={15} className="text-brand-green"/>
              Ambwere Plaza, Kitale
            </span>



            <Link
              href="/apply"
              className="rounded-full bg-brand-green px-6 py-2.5 text-white font-semibold hover:bg-green-800 transition"
            >
              Apply Now
            </Link>

<Link
  href="/student/login"
  className="..."
>
  Student Portal
</Link>
          </div>




          {/* MOBILE BUTTON */}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden rounded-lg border p-2"
          >

            {menuOpen ? <X/> : <Menu/>}

          </button>


        </div>





        {/* DESKTOP NAVIGATION */}

        <div className="container-shell hidden lg:flex">

          <nav className="flex items-center">


            {links.map((link)=>(

              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-4 text-sm font-medium transition ${
                  pathname === link.href
                  ? 'text-brand-green'
                  : 'text-slate-600 hover:text-brand-green'
                }`}
              >

                {link.label}


                {pathname === link.href && (

                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-gold"/>

                )}

              </Link>

            ))}





            {/* RESOURCES DROPDOWN */}

            <div
              className="relative group"
            >

              <button
                className="flex items-center gap-1 px-4 py-4 text-sm text-slate-600 hover:text-brand-green"
              >

                Resources

                <ChevronDown size={15}/>

              </button>



              <div className="
                absolute
                hidden
                group-hover:block
                top-full
                left-0
                w-64
                rounded-xl
                bg-white
                shadow-xl
                border
                overflow-hidden
              ">


                {resources.map(item=>(

                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-5 py-3 text-sm hover:bg-brand-green/10 hover:text-brand-green"
                  >

                    {item.label}

                  </Link>

                ))}


              </div>


            </div>


          </nav>

        </div>





        {/* MOBILE MENU */}

        {menuOpen && (

          <div className="lg:hidden border-t bg-white">

            <nav className="container-shell flex flex-col py-4">


              {links.map(link=>(

                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-3 hover:bg-gray-100"
                >

                  {link.label}

                </Link>

              ))}



              <button
                onClick={()=>setResourceOpen(!resourceOpen)}
                className="flex justify-between rounded-lg px-4 py-3 hover:bg-gray-100"
              >

                Resources

                <ChevronDown size={18}/>

              </button>



              {resourceOpen && (

                <div className="ml-4 border-l">

                  {resources.map(item=>(

                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-3 text-sm hover:text-brand-green"
                    >

                      {item.label}

                    </Link>

                  ))}

                </div>

              )}



              <Link
                href="/apply"
                className="mt-4 rounded-full bg-brand-green py-3 text-center font-semibold text-white"
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