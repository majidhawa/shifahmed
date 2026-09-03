import { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import pool from '@/lib/db';
import { getStudentSession } from '@/lib/student-auth';

import StudentHeader from '@/components/student/studentHeader';
import StudentSidebar from '@/components/student/studentSidebar';

/* =========================================================
   STUDENT PORTAL LAYOUT
   Shifah Medical Training College LMS

   IMPORTANT:
   - Never statically cache student pages.
   - Always render the portal dynamically.
   - Protected pages are revalidated after logout.
   - Header and sidebar are shared across the entire
     /student/dashboard/* portal.
========================================================= */

export const dynamic = 'force-dynamic';

export const revalidate = 0;

export const fetchCache = 'force-no-store';

export const dynamicParams = true;

/* =========================================================
   ADMISSION TYPE
========================================================= */

interface AdmissionRecord {
  id: number;
  admission_number: string | null;
  application_number: string | null;
  course: string | null;
  intake: string | null;
  admission_status: string | null;
  admission_date: string | Date | null;
}

/* =========================================================
   STUDENT PORTAL LAYOUT
========================================================= */

export default async function StudentPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  /* =======================================================
     GET STUDENT SESSION
  ======================================================= */

  const session = await getStudentSession();

  if (!session) {
    redirect('/student/login');
  }

  /* =======================================================
     GET APPLICATION
  ======================================================= */

  const result = await pool.query(
    `
      SELECT
        id,
        application_number,

        surname,
        middle_name,
        first_name,

        course,
        intake,

        payment_status,
        application_status,

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
     FULL NAME
  ======================================================= */

  const fullName = [
    student.first_name,
    student.middle_name,
    student.surname,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const firstName =
    student.first_name || 'Student';

  /* =======================================================
     APPLICATION STATUS
  ======================================================= */

  const applicationStatus = String(
    student.application_status || 'Pending'
  ).trim();

  const normalizedApplicationStatus =
    applicationStatus.toLowerCase();

  const applicationApproved = [
    'approved',
    'accepted',
    'admitted',
  ].includes(
    normalizedApplicationStatus
  );

  /* =======================================================
     GET ADMISSION

     Admission number comes from the admissions table,
     NOT the applications table.
  ======================================================= */

  let admission: AdmissionRecord | null = null;

  if (applicationApproved) {
    const admissionResult = await pool.query(
      `
        SELECT
          id,
          admission_number,
          application_number,
          course,
          intake,
          admission_status,
          admission_date

        FROM admissions

        WHERE application_id = $1

        LIMIT 1
      `,
      [student.id]
    );

    if (admissionResult.rows.length > 0) {
      const row = admissionResult.rows[0];

      admission = {
        id: Number(row.id),

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

        course:
          row.course
            ? String(row.course)
            : null,

        intake:
          row.intake
            ? String(row.intake)
            : null,

        admission_status:
          row.admission_status
            ? String(
                row.admission_status
              )
            : null,

        admission_date:
          row.admission_date || null,
      };
    }
  }

  /* =======================================================
     ADMISSION STATUS
  ======================================================= */

  const normalizedAdmissionStatus =
    String(
      admission?.admission_status || ''
    )
      .trim()
      .toLowerCase();

  const hasActiveAdmission =
    Boolean(admission) &&
    normalizedAdmissionStatus === 'active';

  /* =======================================================
     STUDENT NUMBERS
  ======================================================= */

  const admissionNumber =
    admission?.admission_number || null;

  const applicationNumber =
    student.application_number ||
    session.applicationNumber ||
    null;

  /* =======================================================
     PORTAL ROLE
  ======================================================= */

  const portalRole =
    hasActiveAdmission
      ? 'Student'
      : 'Applicant';

  const portalLabel =
    hasActiveAdmission
      ? 'Student Portal'
      : 'Applicant Portal';

  /* =======================================================
     STUDENT INITIAL
  ======================================================= */

  const studentInitial =
    fullName.charAt(0).toUpperCase() || 'S';

  /* =======================================================
     RENDER STUDENT PORTAL
  ======================================================= */

  return (
    <div
      className="min-h-screen bg-[#f7f9f8]"
      style={{
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* ===================================================
          STUDENT HEADER
      =================================================== */}

      <StudentHeader
        firstName={firstName}
        studentInitial={studentInitial}
        portalLabel={portalLabel}
        hasActiveAdmission={
          hasActiveAdmission
        }
        admissionNumber={
          admissionNumber
        }
        applicationNumber={
          applicationNumber
        }
      />

      {/* ===================================================
          PORTAL BODY
      =================================================== */}

      <div className="flex">
        {/* =================================================
            STUDENT SIDEBAR
        ================================================= */}

        <StudentSidebar
          fullName={fullName}
          studentInitial={studentInitial}
          portalRole={portalRole}
          portalLabel={portalLabel}
          hasActiveAdmission={
            hasActiveAdmission
          }
        />

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <main className="min-w-0 flex-1 lg:ml-72">
          {children}
        </main>
      </div>
    </div>
  );
}