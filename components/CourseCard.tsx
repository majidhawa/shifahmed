import Link from 'next/link';
import { Course } from '@/data/site';
export function CourseCard({ course }: { course: Course }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand-green/20">
      <div className="relative h-56 overflow-hidden">
        <img src={course.heroImage} alt={course.cardTitle} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute bottom-3 left-4 rounded-full bg-brand-dark/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-gold backdrop-blur-sm">
          {course.duration}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 h-0.5 w-8 rounded-full bg-brand-gold" />
        <h3 className="text-xl font-bold text-brand-dark">{course.cardTitle}</h3>
        <p className="mt-3 flex-1 text-sm leading-7 text-slate-500">{course.summary}</p>
        <div className="mt-6 flex gap-3">
          <Link href={`/courses/${course.slug}`} className="flex-1 rounded-full bg-brand-green py-2.5 text-center text-sm font-semibold text-white shadow-sm shadow-brand-green/20 transition-all duration-200 hover:bg-brand-dark hover:-translate-y-0.5">
            Learn More
          </Link>
          <Link href="/apply" className="flex-1 rounded-full border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-brand-green/40 hover:text-brand-green hover:bg-brand-green/5">
            Apply
          </Link>
        </div>
      </div>
    </div>
  );
}
