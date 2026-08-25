'use client';

import { useEffect, useState } from 'react';

const targetDate = new Date('2026-08-28T23:59:59+03:00').getTime();

export function AdmissionsCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate - Date.now();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();

    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeBox = (value: number, label: string) => (
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-xl border border-white/10 bg-white/10 px-2 py-3 backdrop-blur-md">
      <span className="text-xl font-black leading-none text-white">
        {String(value).padStart(2, '0')}
      </span>

      <span className="mt-1 text-[8px] font-bold uppercase tracking-widest text-white/50">
        {label}
      </span>
    </div>
  );

  return (
 <aside
  className="
    fixed
    right-5
    top-[255px]
    z-[40]
    hidden
    w-[300px]
    overflow-hidden
    rounded-[2rem]
    border
    border-white/10
    bg-brand-dark
    shadow-[0_20px_60px_rgba(0,0,0,0.30)]
    lg:block
  "
>
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-brand-green/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-brand-gold/10 blur-3xl" />

      {/* Top accent */}
      <div className="relative h-1.5 w-full bg-gradient-to-r from-brand-green via-brand-gold to-brand-green" />

      <div className="relative p-6">

        {/* Admissions Alert */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-gold opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-gold" />
          </span>

          <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-brand-gold">
            Admissions Alert
          </p>
        </div>

        {/* Heading */}
        <h3 className="mt-3 text-[25px] font-black leading-[1.1] tracking-tight text-white">
          September Intake
          <span className="mt-1 block text-white">
            Admissions Ongoing
          </span>
        </h3>

        {/* Description */}
        <p className="mt-3 text-[13px] leading-6 text-white/60">
          Building the next generation of healthcare professionals.
        </p>

        {/* Divider */}
        <div className="my-5 h-px bg-white/10" />

        {/* Countdown header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-white">
              3 Days To Go
            </p>

            <p className="mt-1 text-[9px] text-white/40">
              Applications closing soon
            </p>
          </div>

          <div className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-2.5 py-1">
            <p className="text-[9px] font-bold text-brand-gold">
              28 AUG 2026
            </p>
          </div>
        </div>

        {/* Countdown boxes */}
        <div className="mt-4 flex gap-2">
          {timeBox(timeLeft.days, 'Days')}
          {timeBox(timeLeft.hours, 'Hours')}
          {timeBox(timeLeft.minutes, 'Min')}
          {timeBox(timeLeft.seconds, 'Sec')}
        </div>

        {/* CTA */}
        <a
          href="/apply"
          className="
            mt-5
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-full
            bg-brand-green
            px-5
            py-3
            text-sm
            font-bold
            text-white
            shadow-lg
            shadow-brand-green/20
            transition-all
            duration-300
            hover:-translate-y-0.5
            hover:bg-brand-gold
            hover:text-brand-dark
          "
        >
          Secure Your Place

          <svg
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </a>

        {/* Bottom text */}
        <p className="mt-3 text-center text-[9px] font-medium text-white/35">
          Start your healthcare career with Shifah Medical Training College.
        </p>
      </div>
    </aside>
  );
}