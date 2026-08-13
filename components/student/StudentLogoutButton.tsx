'use client';

import { LogOut } from 'lucide-react';
import { useState } from 'react';

export default function StudentLogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const response = await fetch('/api/student/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status}`);
      }

      window.location.href = '/student/login';
    } catch (error) {
      console.error('Student logout failed:', error);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <LogOut size={19} />

      {loading ? 'Logging out...' : 'Logout'}
    </button>
  );
}