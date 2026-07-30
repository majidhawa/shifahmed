import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs | Shifah Medical Training College",
  description:
    "Frequently asked questions about admissions, courses, fees, student life, accommodation and international students at Shifah Medical Training College.",
};

const faqCategories = [
  {
    title: "Admissions FAQs",
    questions: [
      {
        question: "How do I apply for admission at Shifah Medical Training College?",
        answer:
          "You can apply by visiting our Admissions page, contacting the admissions office, visiting our campus in Kitale, or applying through our online application form.",
      },
      {
        question: "What are the admission requirements?",
        answer:
          "Admission requirements vary depending on the course. Applicants must meet the KCSE requirements or equivalent qualifications specified for each program.",
      },
      {
        question: "When are admissions open?",
        answer:
          "Admissions are open in January, March, May and September.",
      },
      {
        question: "Can I join if I completed my studies outside Kenya?",
        answer:
          "Yes. Students with foreign qualifications can apply, subject to qualification verification and approval.",
      },
      {
        question: "Do you accept government-sponsored students?",
        answer:
          "Yes. Students can inquire with admissions about available sponsorship and funding opportunities.",
      },
    ],
  },

  {
    title: "Course FAQs",
    questions: [
      {
        question: "Which courses are offered at Shifah Medical Training College?",
        answer:
          "Currently We offer Emergency Medical Technology (EMT), Diploma in Paramedicine, Safe Phlebotomy, German Language Classes, Caregiving Level 4 and Dialysis Technology.",
      },
      {
        question: "Are the courses accredited and recognized?",
        answer:
          "Yes. Our programs follow the required healthcare training standards and are designed to equip students with professional skills.",
      },
      {
        question: "Do courses include practical training?",
        answer:
          "Yes. Students receive practical sessions and clinical exposure to prepare them for real healthcare environments.",
      },
      {
        question: "Can I study part-time?",
        answer:
          "Learning schedules depend on the specific program. Contact admissions for available study options.",
      },
      {
        question: "Do you offer short professional courses?",
        answer:
          "Yes. We offer short courses designed to provide specialized healthcare skills.",
      },
    ],
  },

  {
    title: "Fees & Payment FAQs",
    questions: [
      {
        question: "How much are the course fees?",
        answer:
          "Fees vary depending on the course. Contact the admissions office for the latest fee structure.",
      },
      {
        question: "Are there flexible payment options?",
        answer:
          "Yes. Students can discuss available payment arrangements with the college administration.",
      },
      {
        question: "Do I pay the full fees before starting classes?",
        answer:
          "Students should confirm payment requirements with the admissions office before reporting.",
      },
      {
        question: "Are there additional charges apart from tuition fees?",
        answer:
          "Additional costs may include registration, practical materials, examinations, and other approved charges depending on the course.",
      },
      {
        question: "Do you offer scholarships or financial assistance?",
        answer:
          "Students can inquire from the administration about available financial support opportunities.",
      },
    ],
  },

  {
    title: "Student Life FAQs",
    questions: [
      {
        question: "What is student life like at Shifah Medical Training College?",
        answer:
          "Students enjoy a professional learning environment with academic support, practical training, teamwork and career development opportunities.",
      },
      {
        question: "Do students participate in practical activities?",
        answer:
          "Yes. Practical sessions are an important part of healthcare training.",
      },
      {
        question: "Are there student support services?",
        answer:
          "Yes. Students receive guidance and support from lecturers and administration throughout their studies.",
      },
      {
        question: "Are there clubs and student activities?",
        answer:
          "Students may participate in academic, social and professional development activities within the institution.",
      },
    ],
  },

  {
    title: "International Students FAQs",
    questions: [
      {
        question: "Do you accept international students?",
        answer:
          "Yes. International students are welcome to apply for programs offered at Shifah Medical Training College.",
      },
      {
        question: "What documents are required for international students?",
        answer:
          "International applicants should provide academic certificates, identification documents and any required immigration documents.",
      },
      {
        question: "Do international students need a study permit?",
        answer:
          "International students should obtain the required permits according to Kenyan immigration regulations.",
      },
      {
        question: "Can international students get assistance during admission?",
        answer:
          "Yes. Our admissions team guides international students through the application process.",
      },
    ],
  },

  {
    title: "Accommodation FAQs",
    questions: [
      {
        question: "Does Shifah Medical Training College provide accommodation?",
        answer:
          "Students can inquire with the college administration about available accommodation options near the institution.",
      },
      {
        question: "Are there hostels available near the college?",
        answer:
          "Yes. Students can access accommodation options within Kitale town and surrounding areas.",
      },
      {
        question: "Is accommodation safe for students?",
        answer:
          "Students are guided on safe and convenient accommodation options close to the college.",
      },
      {
        question: "Can international students get help finding accommodation?",
        answer:
          "Yes. International students can contact admissions for guidance on accommodation arrangements.",
      },
    ],
  },
];


export default function FAQsPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      <section className="bg-brand-green py-20 text-white">
        <div className="container-shell text-center">

          <h1 className="text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>

          <p className="max-w-3xl mx-auto text-white/80 text-lg">
            Find answers about admissions, courses, fees, student life,
            accommodation and studying at Shifah Medical Training College.
          </p>

        </div>
      </section>


      <section className="container-shell py-16">

        <div className="max-w-5xl mx-auto space-y-12">

          {faqCategories.map((category) => (

            <div key={category.title}>

              <h2 className="text-3xl font-bold text-brand-green mb-6">
                {category.title}
              </h2>


              <div className="space-y-4">

                {category.questions.map((faq) => (

                  <details
                    key={faq.question}
                    className="
                      bg-white
                      rounded-xl
                      border
                      border-gray-100
                      shadow-sm
                      p-6
                      group
                    "
                  >

                    <summary
                      className="
                        cursor-pointer
                        flex
                        justify-between
                        items-center
                        font-semibold
                        text-lg
                        text-slate-800
                      "
                    >

                      {faq.question}

                      <span className="text-brand-green text-2xl transition group-open:rotate-180">
                        ⌄
                      </span>

                    </summary>


                    <p className="mt-4 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>


                  </details>

                ))}

              </div>

            </div>

          ))}

        </div>

      </section>


      <section className="bg-brand-dark py-12 text-white">

        <div className="container-shell text-center">

          <h2 className="text-3xl font-bold mb-3">
            Still have questions?
          </h2>

          <p className="text-white/70 mb-6">
            Contact our admissions team for more information.
          </p>

          <a
            href="https://wa.me/254794882948"
            target="_blank"
            className="
              inline-block
              bg-brand-green
              px-8
              py-3
              rounded-full
              font-semibold
              hover:bg-green-800
              transition
            "
          >
            Chat with Admissions
          </a>

        </div>

      </section>

    </main>
  );
}