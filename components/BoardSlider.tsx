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

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % boardMembers.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

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
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-brand-green/5 blur-3xl" />
        <div className="absolute -right-32 bottom-20 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* Heading */}
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

        {/* Slider */}
        <div
          className="relative mx-auto max-w-6xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >

          <div className="overflow-hidden rounded-[2.5rem]">

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

                  <div className="grid overflow-hidden rounded-[2.5rem] border border-slate-100 bg-slate-50 shadow-xl lg:grid-cols-[0.9fr_1.1fr]">

                    {/* Image */}
                    <div className="relative min-h-[450px] overflow-hidden bg-brand-dark">

                      <Image
                        src={member.image}
                        alt={`${member.name} - ${member.title}`}
                        fill
                        priority={member === boardMembers[0]}
                        className="object-cover transition-transform duration-700 hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 45vw"
                      />

                      {/* Image overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/10 to-transparent" />

                      {/* Board label */}
                      <div className="absolute left-7 top-7 rounded-full bg-brand-gold px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-dark shadow-lg">
                        Board Member
                      </div>

                      {/* Name on image - mobile */}
                      <div className="absolute bottom-7 left-7 right-7 lg:hidden">
                        <p className="text-2xl font-extrabold text-white">
                          {member.name}
                        </p>

                        <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-brand-gold">
                          {member.title}
                        </p>
                      </div>

                    </div>

                    {/* Information */}
                    <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">

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

                      <p className="mt-6 text-base leading-8 text-slate-600">
                        Providing strategic leadership and contributing to the
                        continued growth, excellence and vision of Shifah
                        Medical Training College.
                      </p>

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

          {/* Previous button */}
          <button
            type="button"
            onClick={previous}
            aria-label="Previous board member"
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-brand-dark/80 text-white shadow-xl backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-brand-green lg:-left-6"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Next button */}
          <button
            type="button"
            onClick={next}
            aria-label="Next board member"
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-brand-dark/80 text-white shadow-xl backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-brand-green lg:-right-6"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

        </div>

        {/* Dots */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {boardMembers.map((member, index) => (
            <button
              key={member.name}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Go to ${member.name}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                current === index
                  ? 'w-10 bg-brand-green'
                  : 'w-2.5 bg-slate-300 hover:bg-brand-gold'
              }`}
            />
          ))}
        </div>

        {/* Small indicator */}
        <div className="mt-5 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            {current + 1} / {boardMembers.length}
          </p>
        </div>

      </div>
    </section>
  );
}