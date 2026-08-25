import Link from 'next/link';
import { Container } from '@/components/Container';
import { CourseCard } from '@/components/CourseCard';
import { HeroSlider } from '@/components/HeroSlider';
import { PartnersMarquee } from '@/components/PartnersMarquee';
import { courses, site } from '@/data/site';
import { BoardSlider } from '@/components/BoardSlider';

export default function HomePage() {
  return (
<main>
  <HeroSlider />
  {/* rest of your homepage */}
      <section className="py-24 overflow-hidden">
        <Container className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-brand-gold" />
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">About the College</p>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-brand-dark md:text-4xl">
              Training the next generation of{' '}
              <span className="text-brand-green">healthcare professionals.</span>
            </h2>
            <div className="mt-4 h-1 w-12 rounded-full bg-brand-gold" />
            <p className="mt-6 text-base leading-8 text-slate-600">{site.about}</p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { value: '3+', label: 'Programmes' },
                { value: '6mo', label: 'Shortest Course' },
                { value: '100%', label: 'Practical Focus' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-center">
                  <p className="text-2xl font-extrabold text-brand-green">{s.value}</p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about" className="inline-flex items-center gap-2 rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-green/20 transition-all hover:bg-brand-dark hover:-translate-y-0.5">
                Learn More
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link href="/apply" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-brand-green/40 hover:text-brand-green hover:bg-brand-green/5">
                Apply Today
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-6 -top-6 h-full w-full rounded-3xl bg-brand-cream" />
            <div className="absolute -left-3 top-8 bottom-8 w-1 rounded-full bg-gradient-to-b from-brand-green to-brand-gold" />
            <div className="relative overflow-hidden rounded-3xl shadow-xl">
              <img src="/images/girl.jpeg" alt="Student nurse" className="h-full w-full object-cover aspect-[4/5]" />
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-brand-dark/80 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">Shifah Medical Training College</p>
                <p className="mt-0.5 text-sm text-white/80">Kitale, Kenya — {site.motto}</p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    {/* Leadership Messages */}
<section className="py-28 bg-slate-50 overflow-hidden">
  <Container>

    {/* Heading */}
    <div className="max-w-3xl mx-auto text-center mb-16">

      <div className="flex items-center justify-center gap-3 mb-5">
        <span className="h-px w-12 bg-brand-gold" />

        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-gold">
          College Leadership
        </p>

        <span className="h-px w-12 bg-brand-gold" />
      </div>


      <h2 className="text-4xl font-extrabold tracking-tight text-brand-dark md:text-5xl">
        Messages From Our
        <span className="text-brand-green"> Leadership</span>
      </h2>


      <p className="mt-6 text-base leading-8 text-slate-600">
        Meet the leaders driving Shifah Medical Training College towards
        excellence in healthcare education, innovation, professionalism and
        community impact.
      </p>

    </div>



    {/* Director */}
    <div className="mb-16 rounded-[2.5rem] bg-white shadow-xl border border-slate-100 overflow-hidden">

      <div className="grid lg:grid-cols-[380px_1fr] items-center">


        {/* Image */}
        <div className="relative h-full min-h-[500px]">

          <img
            src="/images/director.png"
            alt="Director Shifah Medical Training College"
            className="absolute inset-0 h-full w-full object-cover"
          />


          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />


          <div className="absolute bottom-8 left-8">

            <p className="text-xl font-bold text-white">
              Ms. Zaitun Kanenje
            </p>

            <p className="text-sm uppercase tracking-widest text-brand-gold">
              College Executive Director
            </p>

          </div>

        </div>



        {/* Message */}
        <div className="p-8 md:p-12 lg:p-16">


          <div className="flex items-center gap-3 mb-6">

            <span className="h-10 w-1 rounded-full bg-brand-gold" />

            <h3 className="text-3xl font-extrabold text-brand-dark">
              Executive Director's Message
            </h3>

          </div>



          <div className="relative">

            <span className="absolute -top-8 left-0 text-7xl font-serif text-brand-green/20">
              "
            </span>


            <p className="relative text-base leading-8 text-slate-600 whitespace-pre-line">
Dear Prospective Students, Esteemed Parents, Development Partners and Distinguished Stakeholders,

It gives me immense pleasure to welcome you to Shifah Medical Training College (SMTC)—an institution dedicated to shaping the future of healthcare through excellence in education, innovation and professional development.

At SMTC, we recognize that the quality of healthcare services depends on the quality of the professionals entrusted with delivering them. Guided by this conviction, we have established a learning institution that combines academic excellence, practical competence, ethical values and technological advancement to prepare graduates who are ready to make a meaningful impact in society.

Our strategic vision is to nurture healthcare professionals who are knowledgeable, compassionate, innovative and responsive to the evolving demands of both national and international healthcare systems. Through a competency-based approach, state-of-the-art learning resources, experienced tutors and strong collaborations with healthcare institutions, we provide an educational experience that equips our students for lifelong success.

As we pursue our guiding philosophy of "Health through Innovation and Research," we remain committed to fostering a culture of continuous improvement, critical thinking, creativity and evidence-based practice. These principles enable our graduates to become transformative leaders who uphold the highest standards of professionalism and patient care.

Beyond academic achievement, we strive to develop individuals of integrity, resilience, and social responsibility who are prepared to contribute positively to their communities and the global healthcare workforce.

I warmly invite you to become part of the Shifah Medical Training College family. Together, let us embrace opportunities, inspire innovation and cultivate excellence as we prepare the next generation of healthcare professionals.

Thank you for placing your trust in Shifah Medical Training College. We look forward to partnering with you on this exciting journey of learning, growth, and professional achievement.

Welcome to Shifah Medical Training College—where excellence is nurtured, innovation is inspired and future healthcare leaders are made.
            </p>


          </div>


        </div>


      </div>

    </div>



 {/* Operations Director */}
    <div className="mb-16 rounded-[2.5rem] bg-white shadow-xl border border-slate-100 overflow-hidden">

      <div className="grid lg:grid-cols-[380px_1fr] items-center">


        {/* Image */}
        <div className="relative h-full min-h-[500px]">

          <img
            src="/images/jactone.jpg"
            alt="Operations Director Shifah Medical Training College"
            className="absolute inset-0 h-full w-full object-cover"
          />


          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />


          <div className="absolute bottom-8 left-8">

            <p className="text-xl font-bold text-white">
              Mr. Jactone A. Ocharo,PHN
            </p>

            <p className="text-sm uppercase tracking-widest text-brand-gold">
              Operations Director
            </p>

          </div>

        </div>



        {/* Message */}
        <div className="p-8 md:p-12 lg:p-16">


          <div className="flex items-center gap-3 mb-6">

            <span className="h-10 w-1 rounded-full bg-brand-gold" />

            <h3 className="text-3xl font-extrabold text-brand-dark">
              Operations Director's Message
            </h3>

          </div>



          <div className="relative">

            <span className="absolute -top-8 left-0 text-7xl font-serif text-brand-green/20">
              "
            </span>


            <p className="relative text-base leading-8 text-slate-600 whitespace-pre-line">

Welcome to Shifah Medical Training College (SMTC).

At SMTC, operational excellence is at the heart of everything we do. We are committed to providing a safe, efficient and student-centred learning environment that fosters academic excellence, professional growth and practical competence. Our goal is to equip every learner with the knowledge, skills and values required to excel in the healthcare profession.

We are proud to be part of your journey and remain committed to your success.</p>


          </div>


        </div>


      </div>

    </div>


    {/* Principal */}
    <div className="rounded-[2.5rem] bg-white shadow-xl border border-slate-100 overflow-hidden">


      <div className="grid lg:grid-cols-[1fr_380px] items-center">


        {/* Message */}

        <div className="p-8 md:p-12 lg:p-16 order-2 lg:order-1">


          <div className="flex items-center gap-3 mb-6">

            <span className="h-10 w-1 rounded-full bg-brand-green" />

            <h3 className="text-3xl font-extrabold text-brand-dark">
              Principal's Message
            </h3>

          </div>


          <div className="relative">


            <span className="absolute -top-8 left-0 text-7xl font-serif text-brand-gold/30">
              "
            </span>

            <p className="relative text-base leading-8 text-slate-600 whitespace-pre-line">

It is my great pleasure to welcome you to Shifah Medical Training College, a centre of excellence committed to transforming lives through quality healthcare education. Our mission is to nurture competent, ethical and compassionate healthcare professionals who are equipped with the knowledge, practical skills and integrity needed to meet the evolving demands of the healthcare sector.

At SMTC, we believe that every student has the potential to make a meaningful difference in society. Through a learner-centred approach, experienced tutors,modern training methodologies and hands-on clinical exposure, we prepare our students to excel both academically and professionally.

Our commitment extends beyond academic achievement. We strive to cultivate leadership, professionalism, critical thinking, innovation and a lifelong passion for learning. Guided by our motto, "Health through Innovation and Research," we continuously improve our programmes to align with national and international healthcare standards.

Whether you are joining us to begin your healthcare career or to advance your professional journey, you will find a supportive learning environment that encourages excellence, integrity and service to humanity.

On behalf of the Board of Directors, Management and Staff, I warmly welcome you to the Shifah Medical Training College family. We look forward to walking with you on your journey towards a successful and rewarding healthcare career.

Thank you for choosing Shifah Medical Training College, where your future in healthcare begins.

            </p>


          </div>


        </div>

        {/* Image */}

        <div className="relative h-full min-h-[500px] order-1 lg:order-2">

          <img
            src="/images/Principal.jpg"
            alt="Principal Shifah Medical Training College"
            className="absolute inset-0 h-full w-full object-cover"
          />


          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />


          <div className="absolute bottom-8 right-8 text-right">

            <p className="text-xl font-bold text-white">
              Miss. Miriam M. Gikonyo
            </p>

            <p className="text-sm uppercase tracking-widest text-brand-gold">
              College Principal
            </p>

          </div>


        </div>


      </div>


    </div>

{/* Board of Directors */}
<BoardSlider />
  </Container>
</section>
      <section className="bg-slate-50 py-20">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green">Featured Courses</p>
          <h2 className="section-title mt-4">Best Medical Training College in Kitale — Caregiving, Phlebotomy & Dialysis.</h2>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24 bg-brand-dark text-white overflow-hidden">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="h-px w-8 bg-brand-gold" />
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">Why Choose Shifah</p>
              <span className="h-px w-8 bg-brand-gold" />
            </div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Built for students who are serious about a <span className="text-brand-gold">healthcare career.</span>
            </h2>
            <p className="mt-4 text-base text-white/60 leading-7">At Shifah Medical Training College, we combine practical training, strong values, and a clear pathway to help you succeed in the medical field.</p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
                title: 'Accredited Programmes',
                text: 'Our courses are accredited by NITA, TVET/CDACC and other recognised bodies, giving your certificate real value locally and internationally.'
              },
              {
                icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
                title: 'Hands-On Training',
                text: 'Every programme at Shifah is built around practical, real-world skills — not just theory. You graduate ready to work from day one.'
              },
              {
                icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                title: 'Short, Focused Courses',
                text: 'From 2 months to 6 months, our programmes are designed to get you qualified and into the workforce quickly without compromising quality.'
              },
              {
                icon: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                title: 'Open to All Backgrounds',
                text: 'With a minimum entry of KCSE D-, Shifah opens the door to healthcare careers for students from all walks of life and experience levels.'
              },
            ].map((item) => (
              <div key={item.title} className="group relative rounded-3xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:bg-white/10 hover:border-brand-gold/30 hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold transition-all duration-300 group-hover:bg-brand-gold group-hover:text-brand-dark">
                  {item.icon}
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{item.title}</h3>
                <div className="mt-2 h-0.5 w-8 rounded-full bg-brand-gold/40 transition-all duration-300 group-hover:w-12 group-hover:bg-brand-gold" />
                <p className="mt-3 text-sm leading-7 text-white/60">{item.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24 bg-white overflow-hidden">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="h-px w-8 bg-brand-gold" />
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">Academic Departments</p>
              <span className="h-px w-8 bg-brand-gold" />
            </div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-brand-dark md:text-4xl">
              A full spectrum of <span className="text-brand-green">healthcare disciplines.</span>
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Shifah's departments are structured to give students a broad, credible foundation across all major areas of healthcare practice.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {site.departments.map((dept, i) => (
              <div key={dept} className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 px-6 py-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-green/40 hover:bg-white hover:shadow-xl hover:shadow-brand-green/10">
                <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-slate-200 transition-all duration-500 group-hover:bg-brand-green group-hover:top-2 group-hover:bottom-2" />
                <div className="relative">
                  <p className="text-2xl font-black text-brand-green/30 transition-colors duration-300 group-hover:text-brand-green">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-2 text-sm font-bold leading-snug text-brand-dark">{dept}</h3>
                  <div className="mt-3 h-0.5 w-5 rounded-full bg-brand-gold/30 transition-all duration-500 group-hover:w-12 group-hover:bg-brand-gold" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 via-brand-green/5 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-green/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-green/20 to-transparent" />
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="h-px w-8 bg-brand-gold" />
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">Partners & Recognition</p>
              <span className="h-px w-8 bg-brand-gold" />
            </div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-brand-dark md:text-4xl">
              Trusted by leading <span className="text-brand-green">healthcare organisations.</span>
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">Shifah's programmes are backed by recognised accreditation bodies and industry partners.</p>
          </div>
          <PartnersMarquee />
        </Container>
      </section>

      <section className="pt-24 pb-10">
        <Container>
          <div className="rounded-[2rem] bg-brand-cream px-8 py-10 md:px-12 md:py-14">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green">Apply for Intake</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-brand-dark md:text-4xl">Ready to begin your healthcare career with Shifah?</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">Applications are open. Choose your programme, complete the form, and take the first step toward a meaningful career in healthcare.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/apply" className="rounded-full bg-brand-green px-7 py-3 text-sm font-semibold text-white">Apply Now</Link>
              <Link href="/admissions" className="rounded-full border border-slate-300 px-7 py-3 text-sm font-semibold text-slate-700">Admissions Guide</Link>
            </div>
          </div>
        </Container>
           </section>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/254794882948?text=Hello%20Shifah%20Medical%20Training%20College,%20I%20would%20like%20to%20make%20an%20enquiry."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Admissions on WhatsApp"
        className="group fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-[#25D366] px-5 py-3 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-[#20ba5a] animate-[pulse_2.5s_infinite]"
      >
        {/* WhatsApp Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="h-8 w-8 fill-current shrink-0"
        >
          <path d="M16.01 3C8.83 3 3 8.82 3 16c0 2.53.73 4.98 2.11 7.09L3 29l6.08-2.06A12.93 12.93 0 0 0 16.01 29C23.19 29 29 23.18 29 16S23.19 3 16.01 3Zm0 23.67c-2.13 0-4.22-.57-6.06-1.65l-.43-.25-3.61 1.22 1.21-3.52-.28-.45A10.61 10.61 0 0 1 5.4 16c0-5.86 4.76-10.62 10.61-10.62S26.63 10.14 26.63 16s-4.76 10.67-10.62 10.67Zm5.82-7.97c-.32-.16-1.89-.93-2.18-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.36.24-.68.08-.32-.16-1.34-.49-2.55-1.56-.94-.84-1.58-1.87-1.76-2.19-.18-.32-.02-.49.14-.65.15-.15.32-.39.47-.58.16-.18.21-.32.32-.53.11-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.35-.26-.61-.53-.53-.71-.54h-.61c-.21 0-.55.08-.84.39-.29.32-1.11 1.08-1.11 2.63s1.13 3.05 1.29 3.26c.16.21 2.21 3.37 5.35 4.73.75.32 1.34.51 1.8.65.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.16-1.52.26-.74.26-1.37.18-1.52-.08-.13-.29-.21-.61-.37Z" />
        </svg>

        <div className="hidden sm:block leading-tight">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
            Need Help?
          </p>
          <p className="text-sm font-bold">
            Chat with Admissions
          </p>
        </div>
      </a>
    </main>
  );
}