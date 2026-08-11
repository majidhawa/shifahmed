
import Link from 'next/link';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import {
  FileText,
  Image as ImageIcon,
  FileCheck2,
  Search,
  Download,
  Eye,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type DocumentRecord = {
  id: number;
  application_number: string;
  student_name: string;
  course: string;
  intake: string;
  id_document: string | null;
  kcse_certificate: string | null;
  passport_photo: string | null;
  created_at: string;
};

export default async function DocumentsPage() {
  /* =====================================================
     ADMIN AUTHENTICATION
  ===================================================== */

  const admin = requireAdmin();

  if (!admin) {
    return null;
  }

  /* =====================================================
     GET APPLICATION DOCUMENTS
  ===================================================== */

  const result = await pool.query(`
    SELECT
      id,
      application_number,

      CONCAT_WS(
        ' ',
        surname,
        middle_name,
        first_name
      ) AS student_name,

      course,
      intake,

      id_document,
      kcse_certificate,
      passport_photo,

      created_at

    FROM applications

    ORDER BY created_at DESC
  `);

  const documents: DocumentRecord[] = result.rows;

  /* =====================================================
     HELPERS
  ===================================================== */

  const formatDate = (value: string | null) => {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const documentCount = (document: DocumentRecord) => {
    let count = 0;

    if (document.id_document) {
      count++;
    }

    if (document.kcse_certificate) {
      count++;
    }

    if (document.passport_photo) {
      count++;
    }

    return count;
  };

  const totalDocuments = documents.reduce(
    (total, document) =>
      total + documentCount(document),
    0
  );

  const idDocuments = documents.filter(
    (document) =>
      Boolean(document.id_document)
  ).length;

  const kcseDocuments = documents.filter(
    (document) =>
      Boolean(document.kcse_certificate)
  ).length;

  const passportPhotos = documents.filter(
    (document) =>
      Boolean(document.passport_photo)
  ).length;

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="min-h-screen bg-brand-cream">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
                Admissions
              </p>

              <h1 className="mt-1 text-3xl font-bold text-brand-dark">
                Documents
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                View applicant documents submitted
                through the application system.
              </p>

            </div>

            <Link
              href="/admin/dashboard/students"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-green px-5 py-3 text-sm font-semibold text-brand-green transition hover:bg-brand-cream"
            >
              Students

              <ArrowRight className="h-4 w-4" />

            </Link>

          </div>

        </div>

      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* TOTAL DOCUMENTS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Total Documents
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {totalDocuments}
                </p>

              </div>

              <div className="rounded-xl bg-brand-cream p-3">

                <FolderOpen className="h-7 w-7 text-brand-green" />

              </div>

            </div>

          </div>

          {/* ID DOCUMENTS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  ID Documents
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {idDocuments}
                </p>

              </div>

              <div className="rounded-xl bg-blue-50 p-3">

                <FileText className="h-7 w-7 text-blue-600" />

              </div>

            </div>

          </div>

          {/* KCSE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  KCSE Certificates
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {kcseDocuments}
                </p>

              </div>

              <div className="rounded-xl bg-green-50 p-3">

                <FileCheck2 className="h-7 w-7 text-brand-green" />

              </div>

            </div>

          </div>

          {/* PHOTOS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Passport Photos
                </p>

                <p className="mt-2 text-3xl font-bold text-brand-dark">
                  {passportPhotos}
                </p>

              </div>

              <div className="rounded-xl bg-purple-50 p-3">

                <ImageIcon className="h-7 w-7 text-purple-600" />

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            DOCUMENT TABLE
        ================================================= */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">

          {/* HEADER */}

          <div className="border-b border-slate-200 px-6 py-5">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h2 className="text-lg font-bold text-brand-dark">
                  Applicant Documents
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Documents submitted during application.
                </p>

              </div>

              <div className="relative w-full lg:w-80">

                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
                />

              </div>

            </div>

          </div>

          {/* =================================================
              DESKTOP TABLE
          ================================================= */}

          <div className="hidden overflow-x-auto md:block">

            <table className="w-full text-left">

              <thead className="bg-brand-cream">

                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                  <th className="px-6 py-4">
                    Applicant
                  </th>

                  <th className="px-6 py-4">
                    Course
                  </th>

                  <th className="px-6 py-4">
                    ID Document
                  </th>

                  <th className="px-6 py-4">
                    KCSE
                  </th>

                  <th className="px-6 py-4">
                    Passport Photo
                  </th>

                  <th className="px-6 py-4">
                    Submitted
                  </th>

                  <th className="px-6 py-4 text-right">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {documents.map((document) => (

                  <tr
                    key={document.id}
                    className="transition hover:bg-slate-50"
                  >

                    {/* APPLICANT */}

                    <td className="px-6 py-4">

                      <div>

                        <p className="font-semibold text-brand-dark">
                          {document.student_name || '—'}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {document.application_number}
                        </p>

                      </div>

                    </td>

                    {/* COURSE */}

                    <td className="max-w-[200px] px-6 py-4">

                      <p className="truncate text-sm text-slate-600">
                        {document.course || '—'}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {document.intake || '—'}
                      </p>

                    </td>

                    {/* ID */}

                    <td className="px-6 py-4">

                      {document.id_document ? (

                        <a
                          href={document.id_document}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-brand-cream px-3 py-2 text-xs font-semibold text-brand-green transition hover:bg-brand-green hover:text-white"
                        >

                          <Eye className="h-3.5 w-3.5" />

                          View

                        </a>

                      ) : (

                        <span className="text-xs text-slate-400">
                          Not submitted
                        </span>

                      )}

                    </td>

                    {/* KCSE */}

                    <td className="px-6 py-4">

                      {document.kcse_certificate ? (

                        <a
                          href={document.kcse_certificate}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-brand-cream px-3 py-2 text-xs font-semibold text-brand-green transition hover:bg-brand-green hover:text-white"
                        >

                          <Eye className="h-3.5 w-3.5" />

                          View

                        </a>

                      ) : (

                        <span className="text-xs text-slate-400">
                          Not submitted
                        </span>

                      )}

                    </td>

                    {/* PHOTO */}

                    <td className="px-6 py-4">

                      {document.passport_photo ? (

                        <a
                          href={document.passport_photo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-brand-cream px-3 py-2 text-xs font-semibold text-brand-green transition hover:bg-brand-green hover:text-white"
                        >

                          <Eye className="h-3.5 w-3.5" />

                          View

                        </a>

                      ) : (

                        <span className="text-xs text-slate-400">
                          Not submitted
                        </span>

                      )}

                    </td>

                    {/* DATE */}

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">

                      {formatDate(document.created_at)}

                    </td>

                    {/* ACTION */}

                    <td className="px-6 py-4 text-right">

                      <Link
                        href={`/admin/dashboard/applications/${document.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
                      >

                        <Eye className="h-3.5 w-3.5" />

                        Applicant

                      </Link>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {documents.length === 0 && (

            <div className="px-6 py-16 text-center">

              <FolderOpen className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 text-lg font-semibold text-brand-dark">
                No documents available
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Applicant documents will appear here
                after applications are submitted.
              </p>

            </div>

          )}

          {/* =================================================
              MOBILE
          ================================================= */}

          {documents.length > 0 && (

            <div className="divide-y divide-slate-100 md:hidden">

              {documents.map((document) => (

                <div
                  key={document.id}
                  className="p-5"
                >

                  {/* APPLICANT */}

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="font-semibold text-brand-dark">
                        {document.student_name || '—'}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {document.application_number}
                      </p>

                    </div>

                    <span className="rounded-full bg-brand-cream px-2.5 py-1 text-xs font-semibold text-brand-green">
                      {documentCount(document)} / 3
                    </span>

                  </div>

                  {/* COURSE */}

                  <div className="mt-4">

                    <p className="text-xs text-slate-400">
                      Course
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {document.course || '—'}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {document.intake || '—'}
                    </p>

                  </div>

                  {/* DOCUMENT BUTTONS */}

                  <div className="mt-5 grid grid-cols-1 gap-3">

                    {document.id_document ? (

                      <a
                        href={document.id_document}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-brand-green transition hover:bg-brand-cream"
                      >

                        <Download className="h-4 w-4" />

                        View ID Document

                      </a>

                    ) : (

                      <div className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-400">
                        ID document not submitted
                      </div>

                    )}

                    {document.kcse_certificate ? (

                      <a
                        href={document.kcse_certificate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-brand-green transition hover:bg-brand-cream"
                      >

                        <Download className="h-4 w-4" />

                        View KCSE Certificate

                      </a>

                    ) : (

                      <div className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-400">
                        KCSE certificate not submitted
                      </div>

                    )}

                    {document.passport_photo ? (

                      <a
                        href={document.passport_photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-brand-green transition hover:bg-brand-cream"
                      >

                        <Download className="h-4 w-4" />

                        View Passport Photo

                      </a>

                    ) : (

                      <div className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-400">
                        Passport photo not submitted
                      </div>

                    )}

                  </div>

                  {/* APPLICANT */}

                  <Link
                    href={`/admin/dashboard/applications/${document.id}`}
                    className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
                  >

                    <Eye className="h-4 w-4" />

                    View Applicant

                  </Link>

                </div>

              ))}

            </div>

          )}

        </div>

      </main>

    </div>
  );
}

