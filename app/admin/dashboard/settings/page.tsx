
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/admin-auth';
import AdminSettingsClient from './AdminSettingsClient';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  /* =====================================================
     ADMIN AUTHENTICATION
  ===================================================== */

  const admin = requireAdmin();

  /*
   * If there is no authenticated administrator,
   * send the user to the admin login page.
   */
  if (!admin) {
    redirect('/admin/login');
  }

  /* =====================================================
     SETTINGS PAGE
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-brand-dark">
              Settings
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your administrator account and
              system preferences.
            </p>
          </div>

        </div>

      </div>

      {/* =================================================
          SETTINGS CONTENT
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <AdminSettingsClient
          admin={{
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
          }}
        />

      </main>

    </div>
  );
}

