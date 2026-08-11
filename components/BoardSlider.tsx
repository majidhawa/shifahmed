
'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const boardMembers = [
  {
    name: 'Musah Kanenje',
    title: 'Board Chair',
    image: '/images/musa.png',
  },
  {
    name: 'Zaitun Kanenje',
    title: 'Operations & Human Resource',
    image: '/images/director.png',
  },
  {
    name: 'Ramadhan Kanenje',
    title: 'Partnership & Stakeholder Engagements',
    image: '/images/rama.png',
  },
  {
    name: 'Jactone A. Ocharo',
    title: 'Secretary to the Board',
    image: '/images/jack.png',
  },
];

export function BoardSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  /*
   * =========================================================
   * AUTOMATIC SLIDER
   * =========================================================
   */

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % boardMembers.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

  /*
   * =========================================================
   * NAVIGATION
   * =========================================================
   */

  const previous = () => {
    setCurrent(
      (prev) => (prev - 1 + boardMembers.length) % boardMembers.length
    );
  };

  const next = () => {
    setCurrent((prev) => (prev + 1) % boardMembers.length);
  };

  return (
    <section className="relative overflow-hidden bg-white py-24">
      {/* =====================================================
          DECORATIVE BACKGROUND
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-brand-green/5 blur-3xl" />

        <div className="absolute -right-32 bottom-20 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* ===================================================
            SECTION HEADING
        ==================================================== */}

        <div className="mx-auto mb-14 max-w-3xl text-center">

          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-brand-gold" />

            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-gold">
              Board of Directors
            </p>

            <span className="h-px w-12 bg-brand-gold" />
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight text-brand-dark md:text-5xl">
            Leadership Behind
            <span className="text-brand-green"> Our Vision</span>
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-600">
            Meet the members of the Board of Directors providing strategic
            leadership, governance and direction for Shifah Medical Training
            College.
          </p>
        </div>

        {/* ===================================================
            SLIDER
        ==================================================== */}

        <div
          className="relative mx-auto max-w-6xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >

          {/* =================================================
              SLIDES
          ================================================== */}

          <div className="overflow-hidden">

            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${current * 100}%)`,
              }}
            >

              {boardMembers.map((member) => (

                <div
                  key={member.name}
                  className="min-w-full"
                >

                  {/* =========================================
                      MAIN SLIDE
                  ========================================== */}

                  <div className="grid items-center lg:grid-cols-[1fr_1fr]">

                    {/* =======================================
                        IMAGE
                    ======================================== */}

                    <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden sm:min-h-[500px] lg:min-h-[560px]">

                      <Image
                        src={member.image}
                        alt={`${member.name} - ${member.title}`}
                        fill
                        priority={member === boardMembers[0]}
                        className="object-contain object-center transition-transform duration-700 hover:scale-[1.02]"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />

                      {/* Mobile name */}

                      <div className="absolute bottom-6 left-6 right-6 z-10 lg:hidden">

                        <p className="text-2xl font-extrabold text-brand-dark drop-shadow-sm">
                          {member.name}
                        </p>

                        <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-brand-green">
                          {member.title}
                        </p>

                      </div>

                    </div>

                    {/* =======================================
                        INFORMATION
                    ======================================== */}

                    <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16">

                      {/* Desktop heading */}

                      <div className="hidden lg:block">

                        <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-gold">
                          Board of Directors
                        </p>

                        <div className="mt-5 h-1 w-12 rounded-full bg-brand-green" />

                        <h3 className="mt-6 text-4xl font-extrabold leading-tight text-brand-dark">
                          {member.name}
                        </h3>

                        <p className="mt-3 text-lg font-semibold text-brand-green">
                          {member.title}
                        </p>

                      </div>

                      {/* Description */}

                     

                      {/* Institution */}

                      <div className="mt-8 flex items-center gap-3">

                        <span className="h-10 w-1 rounded-full bg-brand-gold" />

                        <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                          Shifah Medical Training College
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* ===================================================
              PREVIOUS BUTTON
          ==================================================== */}

          <button
            type="button"
            onClick={previous}
            aria-label="Previous board member"
            className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-brand-dark shadow-lg backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-brand-green hover:text-white lg:-left-6"
          >

            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>

          </button>

          {/* ===================================================
              NEXT BUTTON
          ==================================================== */}

          <button
            type="button"
            onClick={next}
            aria-label="Next board member"
            className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-brand-dark shadow-lg backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-brand-green hover:text-white lg:-right-6"
          >

            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>

          </button>

        </div>

        {/* ===================================================
            SLIDER DOTS
        ==================================================== */}

        <div className="mt-8 flex items-center justify-center gap-2">

          {boardMembers.map((member, index) => (

            <button
              key={member.name}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Go to ${member.name}`}
              aria-current={current === index ? 'true' : undefined}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                current === index
                  ? 'w-10 bg-brand-green'
                  : 'w-2.5 bg-slate-300 hover:bg-brand-gold'
              }`}
            />

          ))}

        </div>

        {/* ===================================================
            SLIDE COUNTER
        ==================================================== */}

        <div className="mt-5 text-center">

          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            {current + 1} / {boardMembers.length}
          </p>

        </div>

      </div>
    </section>
  );
}

