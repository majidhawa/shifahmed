
'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';

export default function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to log out.'
        );
      }

      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);

      setLoading(false);

      alert(
        'Unable to log out. Please try again.'
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />

      {loading ? 'Signing out...' : 'Logout'}
    </button>
  );
}

