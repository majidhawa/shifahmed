
import { redirect } from 'next/navigation';

import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { requireAdmin } from '@/lib/admin-auth';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = requireAdmin();

  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-brand-cream">

      {/* =================================================
          SIDEBAR
      ================================================== */}

      <AdminSidebar />

      {/* =================================================
          MAIN AREA
      ================================================== */}

      <div className="lg:pl-72">

        <AdminHeader
          adminName={admin.name}
          adminEmail={admin.email}
        />

        <main>
          {children}
        </main>

      </div>

    </div>
  );
}

