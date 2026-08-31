'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';

type QuizDeleteButtonProps = {
  quizId: number;
  quizTitle: string;
  mobile?: boolean;
};

export default function QuizDeleteButton({
  quizId,
  quizTitle,
  mobile = false,
}: QuizDeleteButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${quizTitle}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/lecturer/quizzes/${quizId}`,
        {
          method: 'DELETE',
        }
      );

      let data: {
        message?: string;
        error?: string;
      } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'Failed to delete the assessment.'
        );
      }

      router.refresh();
    } catch (error) {
      console.error('DELETE QUIZ ERROR:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete the assessment.'
      );

      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      title={`Delete ${quizTitle}`}
      aria-label={`Delete ${quizTitle}`}
      className={
        mobile
          ? 'inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60'
          : 'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60'
      }
    >
      {deleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}

      {deleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}