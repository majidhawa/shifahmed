import { redirect } from 'next/navigation';
import Link from 'next/link';

import pool from '@/lib/db';
import { getStudentSession } from '@/lib/student-auth';

import {
  FileText,
  CreditCard,
  FolderOpen,
  Phone,
  CheckCircle2,
  Clock3,
  AlertCircle,
  FileCheck2,
  Download,
  Eye,
  Image as ImageIcon,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';

/* =========================================================
   MY DOCUMENTS PAGE
========================================================= */

export default async function StudentDocumentsPage() {
  /* =======================================================
     CHECK SESSION
  ======================================================= */

  const session = await getStudentSession();

  if (!session) {
    redirect('/student/login');
  }

  /* =======================================================
     GET STUDENT APPLICATION
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

        id_document,
        kcse_certificate,
        passport_photo,

        application_status,
        payment_status,

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
    .join(' ');

  /* =======================================================
     DOCUMENT STATUS
  ======================================================= */

  const documents = [
    {
      key: 'id',
      title: 'ID / Passport Document',
      description:
        'National ID, passport, or other identification document submitted with your application.',
      file: student.id_document,
      icon: <FileText size={22} />,
      type: 'Document',
    },
    {
      key: 'kcse',
      title: 'KCSE Certificate',
      description:
        'Your KCSE certificate or academic certificate submitted during application.',
      file: student.kcse_certificate,
      icon: <FileCheck2 size={22} />,
      type: 'Certificate',
    },
    {
      key: 'photo',
      title: 'Passport Photo',
      description:
        'Passport-size photograph submitted for your student application.',
      file: student.passport_photo,
      icon: <ImageIcon size={22} />,
      type: 'Image',
    },
  ];

  const uploadedCount = documents.filter(
    (document) => !!document.file
  ).length;

  const totalDocuments = documents.length;

  /* =======================================================
     APPLICATION STATUS
  ======================================================= */

  const applicationStatus =
    student.application_status || 'Pending';

  const paymentStatus =
    student.payment_status || 'Pending';

  const applicationStatusLower =
    String(applicationStatus)
      .trim()
      .toLowerCase();

  const paymentStatusLower =
    String(paymentStatus)
      .trim()
      .toLowerCase();

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
     STATUS COLOR
  ======================================================= */

  let applicationStatusClass =
    'border-amber-200 bg-amber-50 text-amber-700';

  if (isApproved) {
    applicationStatusClass =
      'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (isRejected) {
    applicationStatusClass =
      'border-red-200 bg-red-50 text-red-700';
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f8faf9] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            BACK
        ================================================= */}

        <Link
          href="/student/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-[#0f4f3f]"
        >
          <ArrowLeft size={17} />

          Back to Dashboard
        </Link>

        {/* =================================================
            INTRO
        ================================================= */}

        <div className="mb-7">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>
              <p className="text-sm font-semibold text-[#0f4f3f]">
                Application Documents
              </p>

              <h2 className="mt-1 text-2xl font-bold text-[#0c1f1a] sm:text-3xl">
                My Documents
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                View the documents you submitted with your
                application. Documents are securely linked to
                your authenticated student account.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                Application No.
              </span>

              <span className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-xs font-bold text-gray-700">
                {student.application_number}
              </span>
            </div>

          </div>
        </div>

        {/* =================================================
            DOCUMENT SUMMARY
        ================================================= */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="grid md:grid-cols-3">

            {/* DOCUMENT COUNT */}

            <div className="p-6">
              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">
                  <FolderOpen size={22} />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Documents
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#0c1f1a]">
                    {uploadedCount}/{totalDocuments}
                  </p>
                </div>

              </div>
            </div>

            {/* APPLICATION STATUS */}

            <div className="border-t border-gray-100 p-6 md:border-l md:border-t-0">
              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d7a93b]/15 text-[#a67d13]">
                  <FileCheck2 size={22} />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Application Status
                  </p>

                  <span
                    className={`mt-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${applicationStatusClass}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />

                    {applicationStatus}
                  </span>
                </div>

              </div>
            </div>

            {/* PAYMENT STATUS */}

            <div className="border-t border-gray-100 bg-[#fafcfb] p-6 md:border-l md:border-t-0">
              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  {isPaid ? (
                    <CheckCircle2 size={22} />
                  ) : (
                    <Clock3 size={22} />
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Application Fee
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#0c1f1a]">
                    {paymentStatus}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* =================================================
            SECURITY NOTICE
        ================================================= */}

        <div className="mb-6 rounded-2xl border border-[#0f4f3f]/10 bg-[#f1f8f5] p-5">
          <div className="flex gap-3">

            <ShieldCheck
              size={21}
              className="mt-0.5 shrink-0 text-[#0f4f3f]"
            />

            <div>
              <p className="text-sm font-semibold text-[#0c1f1a]">
                Your documents are protected
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                These documents are associated with your
                authenticated application account. Do not share
                copies of your documents or your student login
                details with unauthorized persons.
              </p>
            </div>

          </div>
        </div>

        {/* =================================================
            DOCUMENTS
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-6 sm:p-7">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">
                <FolderOpen size={21} />
              </div>

              <div>
                <h3 className="font-bold text-[#0c1f1a]">
                  Submitted Documents
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Documents received as part of your application.
                </p>
              </div>

            </div>
          </div>

          <div className="divide-y divide-gray-100">

            {documents.map((document) => (
              <DocumentRow
                key={document.key}
                title={document.title}
                description={document.description}
                file={document.file}
                icon={document.icon}
                type={document.type}
              />
            ))}

          </div>

        </section>

        {/* =================================================
            IMPORTANT NOTICE
        ================================================= */}

        <section className="mt-6 rounded-2xl border border-[#d7a93b]/20 bg-[#fffdf5] p-6">

          <div className="flex gap-3">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-[#a67d13]"
            />

            <div>
              <h3 className="text-sm font-bold text-[#0c1f1a]">
                Need to replace a document?
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                If a document was uploaded incorrectly, is unclear,
                expired, or does not belong to you, please contact
                the admissions office. Do not submit another
                application just to replace a document.
              </p>

              <Link
                href="/student/dashboard/contact"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0f4f3f] transition hover:text-[#a67d13]"
              >
                Contact Admissions

                <ChevronRight size={16} />
              </Link>
            </div>

          </div>

        </section>

        {/* =================================================
            APPLICATION DETAILS
        ================================================= */}

        <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h3 className="font-bold text-[#0c1f1a]">
                Application Record
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                These documents form part of your official
                application record at Shifah Medical Training College.
              </p>
            </div>

          </div>

          <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">

            <InfoItem
              label="Applicant"
              value={fullName}
            />

            <InfoItem
              label="Course"
              value={student.course}
            />

            <InfoItem
              label="Intake"
              value={student.intake}
            />

          </div>

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="py-8 text-center">

          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Shifah Medical Training College.
            All rights reserved.
          </p>

          <p className="mt-1 text-[11px] text-gray-400">
            Student Portal • Secure Applicant Access
          </p>

        </div>

      </div>
    </main>
  );
}

/* =========================================================
   DOCUMENT ROW
========================================================= */

function DocumentRow({
  title,
  description,
  file,
  icon,
  type,
}: {
  title: string;
  description: string;
  file: string | null | undefined;
  icon: React.ReactNode;
  type: string;
}) {
  const hasFile =
    typeof file === 'string' &&
    file.trim().length > 0;

  /*
   * The database may contain either:
   *
   * /uploads/applications/file.pdf
   *
   * or
   *
   * uploads/applications/file.pdf
   *
   * Normalize the value before displaying it.
   */

  const fileUrl = hasFile
    ? file!.startsWith('/')
      ? file!
      : `/${file}`
    : '';

  const lowerFileUrl =
    fileUrl.toLowerCase();

  const isPdf =
    hasFile &&
    lowerFileUrl.includes('.pdf');

  const isImage =
    hasFile &&
    (
      lowerFileUrl.includes('.jpg') ||
      lowerFileUrl.includes('.jpeg') ||
      lowerFileUrl.includes('.png') ||
      lowerFileUrl.includes('.webp')
    );

  return (
    <div className="p-6 sm:p-7">

      {/* DOCUMENT INFO + ACTIONS */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        {/* DOCUMENT INFO */}

        <div className="flex min-w-0 items-start gap-4">

          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              hasFile
                ? 'bg-[#0f4f3f]/10 text-[#0f4f3f]'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {icon}
          </div>

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2">

              <h4 className="font-bold text-[#0c1f1a]">
                {title}
              </h4>

              {hasFile ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 size={12} />

                  Uploaded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
                  <Clock3 size={12} />

                  Not Available
                </span>
              )}

            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
              {description}
            </p>

            <p className="mt-2 text-xs font-medium text-gray-400">
              Type: {type}
            </p>

          </div>

        </div>

        {/* ACTIONS */}

        <div className="flex shrink-0 items-center gap-2">

          {hasFile ? (
            <>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#0f4f3f]/30 hover:bg-[#f1f8f5] hover:text-[#0f4f3f]"
              >
                <Eye size={17} />

                View
              </a>

              <a
                href={fileUrl}
                download
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f4f3f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c1f1a]"
              >
                <Download size={17} />

                Download
              </a>
            </>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-400">
              <Clock3 size={17} />

              No File
            </span>
          )}

        </div>

      </div>

      {/* FILE TYPE INDICATOR */}

      {hasFile && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">

          {isPdf ? (
            <FileText size={14} />
          ) : isImage ? (
            <ImageIcon size={14} />
          ) : (
            <FolderOpen size={14} />
          )}

          <span className="truncate">
            {fileUrl.split('/').pop() ||
              'Uploaded document'}
          </span>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>

      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold text-gray-800">
        {value || '—'}
      </p>

    </div>
  );
}