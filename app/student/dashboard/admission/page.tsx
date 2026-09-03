// app/student/dashboard/admission/page.tsx

import { redirect } from 'next/navigation';
import Link from 'next/link';

import pool from '@/lib/db';
import { getStudentSession } from '@/lib/student-auth';

import {
  CheckCircle2,
  Clock3,
  AlertCircle,
  ShieldCheck,
  CalendarDays,
  BookOpen,
  UserRound,
  ArrowLeft,
  Download,
  Award,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';

/* =========================================================
   STUDENT ADMISSION PAGE
========================================================= */

export const dynamic = 'force-dynamic';

export default async function StudentAdmissionPage() {
  /* =======================================================
     1. CHECK SESSION
  ======================================================= */

  const session = await getStudentSession();

  if (!session) {
    redirect('/student/login');
  }

  /* =======================================================
     2. GET STUDENT APPLICATION
  ======================================================= */

  const result = await pool.query(
    `
      SELECT
        id,
        application_number,

        surname,
        middle_name,
        first_name,

        mobile,
        email,

        course,
        intake,

        application_status,
        payment_status,

        application_fee,

        created_at

      FROM applications

      WHERE id = $1
        AND application_number = $2

      LIMIT 1
    `,
    [
      session.applicationId,
      session.applicationNumber,
    ]
  );

  /* =======================================================
     APPLICATION NOT FOUND
  ======================================================= */

  if (result.rows.length === 0) {
    redirect('/student/login');
  }

  const student = result.rows[0];

  /* =======================================================
     3. APPLICATION NUMBER
  ======================================================= */

  const applicationNumber = student.application_number
    ? String(student.application_number).trim()
    : '';

  /* =======================================================
     4. FULL NAME
  ======================================================= */

  const fullName = [
    student.first_name,
    student.middle_name,
    student.surname,
  ]
    .filter(Boolean)
    .join(' ');

  const firstName =
    student.first_name || 'Student';

  /* =======================================================
     5. APPLICATION STATUS
  ======================================================= */

  const applicationStatus =
    String(student.application_status || 'Pending');

  const paymentStatus =
    String(student.payment_status || 'Pending');

  const applicationStatusLower =
    applicationStatus.trim().toLowerCase();

  const paymentStatusLower =
    paymentStatus.trim().toLowerCase();

  const isApproved = [
    'approved',
    'accepted',
    'admitted',
  ].includes(applicationStatusLower);

  const isRejected = [
    'rejected',
    'declined',
  ].includes(applicationStatusLower);

  const isPaid =
    paymentStatusLower === 'paid';

  /* =======================================================
     6. GET ADMISSION RECORD

     The student does NOT create an admission record.

     The record must already have been created by the
     administrator.

     The admission letter is only considered available
     when the administrator has already generated and
     stored the PDF in the database.
  ======================================================= */

  let admission: {
    id: number;
    application_id: number;
    admission_number: string | null;
    application_number: string | null;
    student_name: string | null;
    course: string | null;
    intake: string | null;
    admission_date: string | Date | null;
    admission_status: string | null;
    admission_letter_path: string | null;
    has_letter: boolean;
  } | null = null;

  if (isApproved && applicationNumber) {
    const admissionResult = await pool.query(
      `
        SELECT
          id,
          application_id,
          admission_number,
          application_number,
          student_name,
          course,
          intake,
          admission_date,
          admission_status,
          admission_letter_path,
          (
            admission_letter_pdf IS NOT NULL
          ) AS has_letter

        FROM admissions

        WHERE application_id = $1
          AND application_number = $2

        LIMIT 1
      `,
      [
        student.id,
        applicationNumber,
      ]
    );

    if (admissionResult.rows.length > 0) {
      const row = admissionResult.rows[0];

      admission = {
        id: Number(row.id),

        application_id:
          Number(row.application_id),

        admission_number:
          row.admission_number
            ? String(
                row.admission_number
              ).trim()
            : null,

        application_number:
          row.application_number
            ? String(
                row.application_number
              ).trim()
            : null,

        student_name:
          row.student_name
            ? String(row.student_name)
            : null,

        course:
          row.course
            ? String(row.course)
            : null,

        intake:
          row.intake
            ? String(row.intake)
            : null,

        admission_date:
          row.admission_date || null,

        admission_status:
          row.admission_status
            ? String(
                row.admission_status
              )
            : null,

        admission_letter_path:
          row.admission_letter_path
            ? String(
                row.admission_letter_path
              )
            : null,

        has_letter:
          Boolean(row.has_letter),
      };
    }
  }

  /* =======================================================
     7. ADMISSION STATUS
  ======================================================= */

  const admissionStatusLower =
    String(
      admission?.admission_status || ''
    )
      .trim()
      .toLowerCase();

  const hasActiveAdmission =
    Boolean(admission) &&
    admissionStatusLower === 'active';

  /* =======================================================
     8. CHECK WHETHER LETTER IS AVAILABLE

     The PDF must already exist in the database.

     The student page never generates the PDF.
  ======================================================= */

  const admissionLetterAvailable =
    isApproved &&
    hasActiveAdmission &&
    admission?.has_letter === true;

  /* =======================================================
     9. ADMISSION NUMBER

     This MUST come from the admissions table.
  ======================================================= */

  const admissionNumber =
    admission?.admission_number || null;

  /* =======================================================
     10. DOWNLOAD URL
  ======================================================= */

  const admissionDownloadUrl =
    admissionLetterAvailable &&
    applicationNumber
      ? `/api/student/admission/${encodeURIComponent(
          applicationNumber
        )}/download`
      : null;

  /* =======================================================
     11. APPLICATION DATE
  ======================================================= */

  const applicationDate =
    student.created_at
      ? new Date(
          student.created_at
        ).toLocaleDateString(
          'en-KE',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }
        )
      : '—';

  /* =======================================================
     12. STATUS STYLING
  ======================================================= */

  let statusClass =
    'border-amber-200 bg-amber-50 text-amber-700';

  if (isApproved) {
    statusClass =
      'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (isRejected) {
    statusClass =
      'border-red-200 bg-red-50 text-red-700';
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f8faf9]">

      <main className="px-4 py-6 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-7xl">

          {/* =================================================
              BACK
          ================================================= */}

          <Link
            href="/student/dashboard"
            className="
              mb-6
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-gray-500
              transition
              hover:text-[#0f4f3f]
            "
          >
            <ArrowLeft size={17} />

            Back to Dashboard
          </Link>

          {/* =================================================
              INTRO
          ================================================= */}

          <div className="mb-7">

            <p
              className="
                text-sm
                font-semibold
                text-[#0f4f3f]
              "
            >
              Admission Centre
            </p>

            <h2
              className="
                mt-1
                text-2xl
                font-bold
                text-[#0c1f1a]
                sm:text-3xl
              "
            >
              Your Admission
            </h2>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-gray-500
              "
            >
              View your admission status, programme
              details, intake information and
              admission letter.
            </p>

          </div>

          {/* =================================================
              STATUS
          ================================================= */}

          <section
            className="
              mb-6
              overflow-hidden
              rounded-2xl
              border
              border-gray-100
              bg-white
              shadow-sm
            "
          >

            <div className="p-6 sm:p-8">

              <div
                className="
                  flex
                  flex-col
                  gap-6
                  md:flex-row
                  md:items-center
                  md:justify-between
                "
              >

                {/* STATUS INFORMATION */}

                <div className="flex items-start gap-4">

                  <div
                    className={`
                      flex
                      h-14
                      w-14
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-600'
                          : isRejected
                          ? 'bg-red-50 text-red-600'
                          : 'bg-amber-50 text-amber-600'
                      }
                    `}
                  >

                    {isApproved ? (
                      <CheckCircle2 size={27} />
                    ) : isRejected ? (
                      <AlertCircle size={27} />
                    ) : (
                      <Clock3 size={27} />
                    )}

                  </div>

                  <div>

                    <p
                      className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-400
                      "
                    >
                      Admission Status
                    </p>

                    <div
                      className="
                        mt-2
                        flex
                        flex-wrap
                        items-center
                        gap-3
                      "
                    >

                      <span
                        className={`
                          inline-flex
                          items-center
                          gap-2
                          rounded-full
                          border
                          px-3
                          py-1.5
                          text-xs
                          font-bold
                          ${statusClass}
                        `}
                      >

                        <span
                          className="
                            h-1.5
                            w-1.5
                            rounded-full
                            bg-current
                          "
                        />

                        {applicationStatus}

                      </span>

                    </div>

                    <p className="mt-2 text-sm text-gray-500">

                      {isApproved
                        ? 'Congratulations! Your application has been approved.'
                        : isRejected
                        ? 'Your application was not approved. Please contact Admissions for clarification.'
                        : 'Your application is still being reviewed by the Admissions Office.'}

                    </p>

                  </div>

                </div>

                {/* LETTER PENDING */}

                {isApproved &&
                !admissionLetterAvailable ? (

                  <div
                    className="
                      flex
                      max-w-sm
                      items-center
                      gap-3
                      rounded-xl
                      border
                      border-amber-200
                      bg-amber-50
                      px-4
                      py-3
                    "
                  >

                    <div
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-white
                        text-amber-600
                        shadow-sm
                      "
                    >
                      <Clock3 size={18} />
                    </div>

                    <div>

                      <p
                        className="
                          text-sm
                          font-semibold
                          text-amber-800
                        "
                      >
                        Admission Letter Not Yet Available
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-xs
                          leading-5
                          text-amber-700
                        "
                      >
                        Your application is approved,
                        but the Admissions Office has
                        not yet generated your official
                        admission letter.
                      </p>

                    </div>

                  </div>

                ) : null}

              </div>

            </div>

          </section>

          {/* =================================================
              APPROVED
          ================================================= */}

          {isApproved ? (
            <>

              {/* WELCOME CARD */}

              <section
                className="
                  mb-6
                  overflow-hidden
                  rounded-2xl
                  bg-[#0c1f1a]
                  text-white
                  shadow-sm
                "
              >

                <div
                  className="
                    relative
                    p-7
                    sm:p-9
                  "
                >

                  <div
                    className="
                      absolute
                      right-6
                      top-6
                      opacity-10
                    "
                  >
                    <Award size={110} />
                  </div>

                  <div className="relative">

                    <div
                      className="
                        mb-4
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-xl
                        bg-[#d7a93b]
                        text-[#0c1f1a]
                      "
                    >
                      <GraduationCap size={24} />
                    </div>

                    <p
                      className="
                        text-sm
                        font-semibold
                        text-[#d7a93b]
                      "
                    >
                      Congratulations, {firstName}
                    </p>

                    <h3
                      className="
                        mt-1
                        text-2xl
                        font-bold
                        sm:text-3xl
                      "
                    >
                      You have been admitted to
                      Shifah Medical Training College.
                    </h3>

                    <p
                      className="
                        mt-3
                        max-w-2xl
                        text-sm
                        leading-6
                        text-white/60
                      "
                    >
                      Your application has successfully
                      passed the admissions review process.
                      Your official admission record and
                      admission letter will appear here
                      once processed by the Admissions Office.
                    </p>

                  </div>

                </div>

              </section>

              {/* =================================================
                  ADMISSION DETAILS
              ================================================= */}

              <AdmissionSection
                title="Admission Details"
                description="Your official programme, intake and admission information."
                icon={<GraduationCap size={20} />}
              >

                <div
                  className="
                    grid
                    gap-5
                    sm:grid-cols-2
                    lg:grid-cols-3
                  "
                >

                  <AdmissionInfo
                    label="Applicant Name"
                    value={fullName}
                  />

                  <AdmissionInfo
                    label="Application Number"
                    value={applicationNumber}
                  />

                  <AdmissionInfo
                    label="Admission Number"
                    value={admissionNumber}
                    highlight={Boolean(admissionNumber)}
                  />

                  <AdmissionInfo
                    label="Programme"
                    value={
                      admission?.course ||
                      student.course
                    }
                    highlight
                  />

                  <AdmissionInfo
                    label="Intake"
                    value={
                      admission?.intake ||
                      student.intake
                    }
                    highlight
                  />

                  <AdmissionInfo
                    label="Admission Record"
                    value={
                      hasActiveAdmission
                        ? 'ACTIVE'
                        : 'PROCESSING'
                    }
                    highlight={hasActiveAdmission}
                  />

                  <AdmissionInfo
                    label="Application Status"
                    value="ADMITTED"
                    highlight
                  />

                  <AdmissionInfo
                    label="Application Fee"
                    value={`KSh ${Number(
                      student.application_fee || 0
                    ).toLocaleString()}`}
                  />

                </div>

              </AdmissionSection>

              {/* =================================================
                  OFFICIAL ADMISSION LETTER
              ================================================= */}

              <section
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-gray-100
                  bg-white
                  p-6
                  shadow-sm
                  sm:p-7
                "
              >

                <div className="flex items-start gap-4">

                  <div
                    className={`
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      ${
                        admissionLetterAvailable
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      }
                    `}
                  >

                    {admissionLetterAvailable ? (
                      <CheckCircle2 size={21} />
                    ) : (
                      <Clock3 size={21} />
                    )}

                  </div>

                  <div className="flex-1">

                    <h3
                      className="
                        font-bold
                        text-[#0c1f1a]
                      "
                    >
                      Official Admission Letter
                    </h3>

                    <p
                      className="
                        mt-1
                        text-sm
                        leading-6
                        text-gray-500
                      "
                    >
                      {admissionLetterAvailable
                        ? 'Your official admission letter has been generated by the Admissions Office and is ready for download.'
                        : 'Your application has been approved, but your official admission letter has not yet been generated by the Admissions Office.'}
                    </p>

                    {admissionNumber && (
                      <div
                        className="
                          mt-4
                          inline-flex
                          items-center
                          gap-2
                          rounded-lg
                          bg-[#f7fbf9]
                          px-3
                          py-2
                        "
                      >

                        <span
                          className="
                            text-xs
                            font-medium
                            text-gray-500
                          "
                        >
                          Admission No:
                        </span>

                        <span
                          className="
                            text-xs
                            font-bold
                            text-[#0f4f3f]
                          "
                        >
                          {admissionNumber}
                        </span>

                      </div>
                    )}

                    {/* DOWNLOAD */}

                    {admissionLetterAvailable &&
                    admissionDownloadUrl ? (

                      <div className="mt-5">

                        <a
                          href={admissionDownloadUrl}
                          className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            bg-[#0f4f3f]
                            px-5
                            py-3
                            text-sm
                            font-semibold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-[#0c3f32]
                          "
                        >

                          <Download size={17} />

                          Download Admission Letter

                        </a>

                      </div>

                    ) : (

                      <div
                        className="
                          mt-5
                          inline-flex
                          items-center
                          gap-2
                          rounded-xl
                          border
                          border-gray-200
                          bg-gray-50
                          px-4
                          py-3
                          text-sm
                          font-semibold
                          text-gray-400
                        "
                      >

                        <Clock3 size={17} />

                        Admission Letter Pending

                      </div>

                    )}

                  </div>

                </div>

              </section>

              {/* =================================================
                  STUDENT INFORMATION
              ================================================= */}

              <AdmissionSection
                title="Student Information"
                description="Information associated with your admission record."
                icon={<UserRound size={20} />}
              >

                <div
                  className="
                    grid
                    gap-5
                    md:grid-cols-2
                  "
                >

                  <AdmissionInfo
                    label="Full Name"
                    value={fullName}
                  />

                  <AdmissionInfo
                    label="Mobile Number"
                    value={student.mobile}
                  />

                  <AdmissionInfo
                    label="Email Address"
                    value={student.email}
                  />

                  <AdmissionInfo
                    label="Application Number"
                    value={applicationNumber}
                  />

                </div>

              </AdmissionSection>

              {/* =================================================
                  PROGRAMME INFORMATION
              ================================================= */}

              <AdmissionSection
                title="Programme Information"
                description="Your selected programme and intake."
                icon={<BookOpen size={20} />}
              >

                <div
                  className="
                    grid
                    gap-5
                    md:grid-cols-2
                  "
                >

                  <div
                    className="
                      rounded-xl
                      border
                      border-[#0f4f3f]/10
                      bg-[#f7fbf9]
                      p-5
                    "
                  >

                    <p
                      className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-400
                      "
                    >
                      Programme
                    </p>

                    <p
                      className="
                        mt-2
                        text-base
                        font-bold
                        text-[#0f4f3f]
                      "
                    >
                      {admission?.course ||
                        student.course ||
                        '—'}
                    </p>

                  </div>

                  <div
                    className="
                      rounded-xl
                      border
                      border-[#d7a93b]/20
                      bg-[#fffdf5]
                      p-5
                    "
                  >

                    <p
                      className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-gray-400
                      "
                    >
                      Intake
                    </p>

                    <p
                      className="
                        mt-2
                        text-base
                        font-bold
                        text-[#a67d13]
                      "
                    >
                      {admission?.intake ||
                        student.intake ||
                        '—'}
                    </p>

                  </div>

                </div>

              </AdmissionSection>

              {/* =================================================
                  NEXT STEPS
              ================================================= */}

              <section
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-gray-100
                  bg-white
                  p-6
                  shadow-sm
                  sm:p-7
                "
              >

                <div className="flex items-start gap-4">

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-[#d7a93b]/15
                      text-[#a67d13]
                    "
                  >
                    <CalendarDays size={21} />
                  </div>

                  <div>

                    <h3
                      className="
                        font-bold
                        text-[#0c1f1a]
                      "
                    >
                      What to do next
                    </h3>

                    <div
                      className="
                        mt-4
                        space-y-3
                        text-sm
                        text-gray-600
                      "
                    >

                      <StepItem
                        number="01"
                        text={
                          admissionLetterAvailable
                            ? 'Download and carefully read your admission letter.'
                            : 'Wait for the Admissions Office to generate your official admission letter.'
                        }
                      />

                      <StepItem
                        number="02"
                        text="Follow the reporting and registration instructions provided in the admission letter."
                      />

                      <StepItem
                        number="03"
                        text="Prepare the required original documents for admission and registration."
                      />

                      <StepItem
                        number="04"
                        text="Contact the Admissions Office if you need clarification before reporting."
                      />

                    </div>

                  </div>

                </div>

              </section>

            </>

          ) : isRejected ? (

            /* =================================================
               REJECTED
            ================================================= */

            <section
              className="
                rounded-2xl
                border
                border-red-100
                bg-white
                p-7
                shadow-sm
                sm:p-9
              "
            >

              <div
                className="
                  mx-auto
                  max-w-2xl
                  text-center
                "
              >

                <div
                  className="
                    mx-auto
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-2xl
                    bg-red-50
                    text-red-600
                  "
                >
                  <AlertCircle size={30} />
                </div>

                <h3
                  className="
                    mt-5
                    text-xl
                    font-bold
                    text-[#0c1f1a]
                  "
                >
                  Application Not Approved
                </h3>

                <p
                  className="
                    mt-3
                    text-sm
                    leading-6
                    text-gray-500
                  "
                >
                  Your application has not been approved
                  at this time. If you require more
                  information about this decision, please
                  contact the Admissions Office.
                </p>

                <Link
                  href="/student/dashboard/contact"
                  className="
                    mt-6
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-[#0f4f3f]
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-[#0c3f32]
                  "
                >

                  Contact Admissions

                  <ChevronRight size={17} />

                </Link>

              </div>

            </section>

          ) : (

            /* =================================================
               PENDING
            ================================================= */

            <>

              <section
                className="
                  rounded-2xl
                  border
                  border-amber-100
                  bg-white
                  p-7
                  shadow-sm
                  sm:p-9
                "
              >

                <div
                  className="
                    mx-auto
                    max-w-2xl
                    text-center
                  "
                >

                  <div
                    className="
                      mx-auto
                      flex
                      h-16
                      w-16
                      items-center
                      justify-center
                      rounded-2xl
                      bg-amber-50
                      text-amber-600
                    "
                  >
                    <Clock3 size={30} />
                  </div>

                  <h3
                    className="
                      mt-5
                      text-xl
                      font-bold
                      text-[#0c1f1a]
                    "
                  >
                    Your Admission Is Still Pending
                  </h3>

                  <p
                    className="
                      mt-3
                      text-sm
                      leading-6
                      text-gray-500
                    "
                  >
                    The Admissions Office is currently
                    reviewing your application. Once a
                    decision has been made, your admission
                    status will be updated here.
                  </p>

                </div>

              </section>

              {/* APPLICATION SUMMARY */}

              <section
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-gray-100
                  bg-white
                  p-6
                  shadow-sm
                  sm:p-7
                "
              >

                <div className="flex items-start gap-4">

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-[#0f4f3f]/10
                      text-[#0f4f3f]
                    "
                  >
                    <ShieldCheck size={21} />
                  </div>

                  <div>

                    <h3
                      className="
                        font-bold
                        text-[#0c1f1a]
                      "
                    >
                      Application Under Review
                    </h3>

                    <p
                      className="
                        mt-1
                        text-sm
                        leading-6
                        text-gray-500
                      "
                    >
                      Your application has been received
                      and is associated with the following
                      programme.
                    </p>

                  </div>

                </div>

                <div
                  className="
                    mt-6
                    grid
                    gap-5
                    border-t
                    border-gray-100
                    pt-5
                    md:grid-cols-3
                  "
                >

                  <AdmissionInfo
                    label="Application Number"
                    value={applicationNumber}
                  />

                  <AdmissionInfo
                    label="Programme"
                    value={student.course}
                    highlight
                  />

                  <AdmissionInfo
                    label="Intake"
                    value={student.intake}
                  />

                </div>

              </section>

            </>

          )}

          {/* =================================================
              APPLICATION RECORD
          ================================================= */}

          <section
            className="
              mt-6
              rounded-2xl
              border
              border-gray-100
              bg-white
              p-6
              shadow-sm
              sm:p-7
            "
          >

            <div className="flex items-start gap-4">

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#0f4f3f]/10
                  text-[#0f4f3f]
                "
              >
                <ShieldCheck size={21} />
              </div>

              <div>

                <h3
                  className="
                    font-bold
                    text-[#0c1f1a]
                  "
                >
                  Admission Record
                </h3>

                <p
                  className="
                    mt-1
                    text-sm
                    leading-6
                    text-gray-500
                  "
                >
                  This admission information is linked
                  to your authenticated application record.
                </p>

              </div>

            </div>

            <div
              className="
                mt-6
                grid
                gap-5
                border-t
                border-gray-100
                pt-5
                sm:grid-cols-3
              "
            >

              <AdmissionInfo
                label="Application Number"
                value={applicationNumber}
              />

              <AdmissionInfo
                label="Admission Number"
                value={admissionNumber}
                highlight={Boolean(admissionNumber)}
              />

              <AdmissionInfo
                label="Application Date"
                value={applicationDate}
              />

              <AdmissionInfo
                label="Payment Status"
                value={paymentStatus}
                highlight={isPaid}
              />

              {isApproved && (
                <AdmissionInfo
                  label="Admission Letter"
                  value={
                    admissionLetterAvailable
                      ? 'AVAILABLE'
                      : 'NOT YET AVAILABLE'
                  }
                  highlight={
                    admissionLetterAvailable
                  }
                />
              )}

            </div>

          </section>

          {/* =================================================
              NOTICE
          ================================================= */}

          <div
            className="
              mt-6
              rounded-2xl
              border
              border-[#d7a93b]/20
              bg-[#fffdf5]
              p-5
            "
          >

            <div className="flex gap-3">

              <AlertCircle
                size={20}
                className="
                  mt-0.5
                  shrink-0
                  text-[#a67d13]
                "
              />

              <div>

                <p
                  className="
                    text-sm
                    font-semibold
                    text-[#0c1f1a]
                  "
                >
                  Need help with your admission?
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    leading-6
                    text-gray-600
                  "
                >
                  If you have questions about your
                  admission, reporting date, programme
                  or registration, please contact the
                  Admissions Office.
                </p>

                <Link
                  href="/student/dashboard/contact"
                  className="
                    mt-3
                    inline-flex
                    items-center
                    gap-1
                    text-sm
                    font-semibold
                    text-[#0f4f3f]
                    hover:text-[#a67d13]
                  "
                >

                  Contact Admissions

                  <ChevronRight size={16} />

                </Link>

              </div>

            </div>

          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="py-8 text-center">

            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Shifah Medical
              Training College. All rights reserved.
            </p>

            <p className="mt-1 text-[11px] text-gray-400">
              Student Portal • Secure Applicant Access
            </p>

          </div>

        </div>

      </main>

    </div>
  );
}

/* =========================================================
   ADMISSION SECTION
========================================================= */

function AdmissionSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        mt-6
        rounded-2xl
        border
        border-gray-100
        bg-white
        p-6
        shadow-sm
        sm:p-7
      "
    >

      <div className="flex items-start gap-4">

        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-[#0f4f3f]/10
            text-[#0f4f3f]
          "
        >
          {icon}
        </div>

        <div>

          <h3
            className="
              font-bold
              text-[#0c1f1a]
            "
          >
            {title}
          </h3>

          <p
            className="
              mt-1
              text-sm
              leading-6
              text-gray-500
            "
          >
            {description}
          </p>

        </div>

      </div>

      <div className="mt-6">
        {children}
      </div>

    </section>
  );
}

/* =========================================================
   ADMISSION INFO
========================================================= */

function AdmissionInfo({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div>

      <p
        className="
          text-xs
          font-medium
          uppercase
          tracking-wider
          text-gray-400
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-1.5
          break-words
          text-sm
          font-semibold
          ${
            highlight
              ? 'text-[#0f4f3f]'
              : 'text-gray-800'
          }
        `}
      >
        {value || '—'}
      </p>

    </div>
  );
}

/* =========================================================
   NEXT STEP ITEM
========================================================= */

function StepItem({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">

      <span
        className="
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-[#0f4f3f]/10
          text-[10px]
          font-bold
          text-[#0f4f3f]
        "
      >
        {number}
      </span>

      <p className="pt-1 leading-5">
        {text}
      </p>

    </div>
  );
}