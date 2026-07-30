import Link from 'next/link';
import { Container } from '@/components/Container';
import { site } from '@/data/site';


const departmentDetails: Record<
  string,
  {
    icon: JSX.Element;
    text: string;
    courses: string[];
  }
> = {

  "Department of Emergency Medicine": {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </svg>
    ),
    text:
      "Training competent emergency healthcare professionals equipped with skills in emergency response, trauma management, patient stabilization, and pre-hospital care.",
    courses: [
      "Certificate in Emergency Medical Technology (EMT)",
      "Diploma in Paramedicine",
    ],
  },


  "Department of Nursing Support Services": {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 21c-5-4-8-7-8-11a4 4 0 018-2 4 4 0 018 2c0 4-3 7-8 11z"/>
      </svg>
    ),
    text:
      "It prepares compassionate and skilled healthcare professionals who provide quality patient care, health education, and support in various healthcare settings. Students are trained in clinical nursing practices, patient management, community health, and modern healthcare approaches to develop the knowledge and skills needed to promote wellness and save lives..",
    courses: [
      "Proficiency in Dialysis Technology",
      "Certificate in Caregiving Level 4",
    ],
  },


  "Department of Laboratory": {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 3h6"/>
        <path d="M10 3v8l-5 10h14l-5-10V3"/>
      </svg>
    ),
    text:
      "Equipping students with practical diagnostic support skills including specimen collection, blood handling procedures, and laboratory safety practices.",
    courses: [
      "Proficiency in Safe Phlebotomy",
    ],
  },


  "Department of Pathology": {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/>
      </svg>
    ),
    text:
      "providing accurate laboratory investigations that support disease diagnosis, treatment, and prevention. Students are trained in specimen collection, laboratory procedures, medical testing, and analysis of samples such as blood, urine, and tissues using modern laboratory techniques.",
    courses: [
      "Diploma in Mortuary Science",
    ],
  },


  "Department of Linguistics": {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20"/>
        <path d="M12 2a15 15 0 010 20"/>
      </svg>
    ),
    text:
      "It focuses on the scientific study of languages, communication, and their role in society. Students are equipped with skills in language structure, pronunciation, interpretation, translation, and effective communication. The department prepares learners to use language professionally in areas such as education, healthcare, international relations, research, and community development.",
    courses: [
      "Proficiency in German Language A1 & A2",
      "Proficiency in German Language B1 & B2",
    ],
  },

};



export default function DepartmentsPage() {


return (

<main>


{/* HERO SECTION */}

<section className="relative overflow-hidden bg-brand-dark py-24 text-white">


<img
src="/images/hero5.jpeg"
alt="Departments"
className="
absolute inset-0 h-full w-full
object-cover opacity-20
"
/>


<div className="
absolute inset-0
bg-gradient-to-r
from-brand-dark/95
via-brand-dark/80
to-transparent
"/>


<div className="
absolute left-0 top-0
h-full w-1
bg-gradient-to-b
from-brand-green
via-brand-gold
to-transparent
"/>



<Container className="relative">


<div className="flex items-center gap-2 mb-5">

<span className="h-px w-8 bg-brand-gold"/>

<p className="
text-xs font-bold uppercase
tracking-[0.25em]
text-brand-gold
">
Academic Departments
</p>

</div>



<h1 className="
max-w-3xl
text-4xl md:text-6xl
font-extrabold
leading-tight
tracking-tight
">

Building the next generation of

<span className="text-brand-gold">
 healthcare professionals.
</span>


</h1>


<div className="
mt-5 h-1 w-20
rounded-full bg-brand-gold
"/>



<p className="
mt-6 max-w-2xl
text-base md:text-lg
leading-8
text-white/70
">
Shifah Medical Training College offers specialized healthcare
programmes designed to equip students with practical skills,
professional knowledge, and career-ready competencies.

</p>

<div className="
mt-10 flex flex-wrap gap-4
">


{[

{
value:"5",
label:"Departments"
},

{
value:"NITA",
label:"Accredited"
},

{
value:"100%",
label:"Practical Training"
}

].map((item)=>(

<div
key={item.label}
className="
rounded-2xl
border border-white/10
bg-white/5
px-6 py-4
backdrop-blur-sm
"
>

<p className="
text-xl font-extrabold
text-brand-gold
">
{item.value}
</p>
<p className="
text-[11px]
uppercase
tracking-wider
text-white/50
">
{item.label}
</p>
</div>
))}
</div>
</Container>
</section>
{/* DEPARTMENTS SECTION */}

<section className="bg-slate-50 py-24">
  <Container>

    <div className="mx-auto mb-14 max-w-3xl text-center">

      <div className="mb-4 flex items-center justify-center gap-3">
        <span className="h-px w-10 bg-brand-gold" />
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
          Our Departments
        </p>
        <span className="h-px w-10 bg-brand-gold" />
      </div>

      <h2 className="text-3xl font-extrabold tracking-tight text-brand-dark md:text-5xl">
        Explore our
        <span className="text-brand-green"> healthcare disciplines.</span>
      </h2>

      <p className="mt-5 leading-8 text-slate-500">
        Our departments provide focused training that combines classroom
        knowledge, practical skills, and professional healthcare experience.
      </p>

    </div>


    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

      {site.departments.map((dept, index) => {

        const details = departmentDetails[dept];

        return (
          <div
            key={dept}
            className="
              group relative overflow-hidden rounded-[2rem]
              border border-slate-100 bg-white p-8
              transition-all duration-500
              hover:-translate-y-3
              hover:shadow-2xl hover:shadow-brand-green/10
            "
          >

            {/* Background Decoration */}
            <div
              className="
                absolute -right-12 -top-12
                h-40 w-40 rounded-full
                bg-brand-green/5
                transition-all duration-500
                group-hover:bg-brand-green/10
              "
            />

            {/* Number */}
            <div
              className="
                absolute right-6 top-5
                text-7xl font-black
                text-slate-100
                transition-all
                group-hover:text-brand-green/10
              "
            >
              {String(index + 1).padStart(2, "0")}
            </div>


            {/* Icon */}
            <div
              className="
                relative flex h-16 w-16 items-center justify-center
                rounded-2xl bg-brand-green/10
                text-brand-green
                transition-all duration-300
                group-hover:bg-brand-green
                group-hover:text-white
              "
            >
              {details?.icon}
            </div>


            {/* Department Name */}
            <h3 className="mt-7 text-xl font-extrabold leading-snug text-brand-dark">
              {dept}
            </h3>


            <div
              className="
                mt-4 h-1 w-12 rounded-full bg-brand-gold
                transition-all duration-500
                group-hover:w-24
              "
            />


            {/* Description */}
            <p className="mt-5 text-sm leading-7 text-slate-500">
              {details?.text}
            </p>


            {/* Courses */}
            <div className="mt-7">

              <p
                className="
                  mb-3 text-xs font-bold uppercase
                  tracking-[0.2em] text-brand-green
                "
              >
                Courses Offered
              </p>


              <div className="flex flex-wrap gap-2">

                {details?.courses.map((course) => (

                  <span
                    key={course}
                    className="
                      rounded-full
                      border border-brand-green/20
                      bg-brand-green/5
                      px-4 py-2
                      text-xs font-semibold
                      text-brand-green
                      transition-all
                      hover:bg-brand-green
                      hover:text-white
                    "
                  >
                    {course}
                  </span>

                ))}

              </div>

            </div>

          </div>
        );

      })}

    </div>

  </Container>
</section>



{/* CALL TO ACTION */}

<section className="py-20">
  <Container>

    <div
      className="
        relative overflow-hidden
        rounded-[2rem]
        bg-brand-green
        px-8 py-14
        text-white
        md:px-14
      "
    >

      <div
        className="
          absolute right-0 top-0
          h-72 w-72
          rounded-full
          bg-white/5
          translate-x-1/3
          -translate-y-1/3
        "
      />


      <div className="relative max-w-3xl">

        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
          Join Shifah
        </p>


        <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
          Start your journey towards a healthcare career.
        </h2>


        <p className="mt-5 text-base leading-8 text-white/75">
          Explore our programmes and choose a department that matches your
          passion and career goals.
        </p>


        <div className="mt-8 flex flex-wrap gap-4">

          <Link
            href="/courses"
            className="
              rounded-full
              bg-white
              px-8 py-3
              text-sm font-bold
              text-brand-green
              transition-all
              hover:-translate-y-1
              hover:bg-brand-cream
            "
          >
            View Courses →
          </Link>


          <Link
            href="/apply"
            className="
              rounded-full
              border border-white/30
              px-8 py-3
              text-sm font-semibold
              text-white
              transition-all
              hover:bg-white/10
            "
          >
            Apply Now
          </Link>

        </div>

      </div>

    </div>

  </Container>
</section>
</main>
);

}