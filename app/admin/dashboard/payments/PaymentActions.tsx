'use client';

import { useState } from 'react';

import {
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

export default function PaymentActions({
  applicationId,
  applicationNumber,
}: {
  applicationId: number;
  applicationNumber: string;
}) {
  const [loading, setLoading] =
    useState<'verify' | 'reject' | null>(
      null
    );

  const [error, setError] =
    useState('');

  async function verifyPayment() {
    const confirmed =
      window.confirm(
        `Verify the M-Pesa payment for ${applicationNumber}?`
      );

    if (!confirmed) {
      return;
    }

    setError('');
    setLoading('verify');

    try {
      const response =
        await fetch(
          '/api/admin/payments/verify',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              applicationId,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Unable to verify payment.'
        );
      }

      window.location.reload();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to verify payment.'
      );
    } finally {
      setLoading(null);
    }
  }

  async function rejectPayment() {

    const reason =
      window.prompt(
        'Enter the reason for rejecting this payment:'
      );

    if (!reason?.trim()) {
      return;
    }

    setError('');
    setLoading('reject');

    try {
      const response =
        await fetch(
          '/api/admin/payments/reject',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              applicationId,
              reason: reason.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Unable to reject payment.'
        );
      }

      window.location.reload();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to reject payment.'
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">

      <div className="flex flex-wrap justify-end gap-2">

        <button
          type="button"
          onClick={verifyPayment}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-green px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >

          {loading === 'verify' ? (
            <Loader2
              className="h-3.5 w-3.5 animate-spin"
            />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}

          Verify

        </button>

        <button
          type="button"
          onClick={rejectPayment}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >

          {loading === 'reject' ? (
            <Loader2
              className="h-3.5 w-3.5 animate-spin"
            />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}

          Reject

        </button>

      </div>

      {error && (
        <p className="max-w-[220px] text-right text-xs font-medium text-red-600">
          {error}
        </p>
      )}

    </div>
  );
}