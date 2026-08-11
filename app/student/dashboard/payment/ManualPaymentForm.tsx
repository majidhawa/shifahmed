'use client';

import { FormEvent, useState } from 'react';

import {
  CheckCircle2,
  Loader2,
  Send,
} from 'lucide-react';

type Props = {
  applicationNumber: string;
};

export default function ManualPaymentForm({
  applicationNumber,
}: Props) {
  const [mpesaCode, setMpesaCode] =
    useState('');

  const [phoneNumber, setPhoneNumber] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');

    const code = mpesaCode
      .trim()
      .toUpperCase();

    if (!code) {
      setError(
        'Please enter your M-Pesa transaction code.'
      );

      return;
    }

    if (code.length < 8) {
      setError(
        'Please enter a valid M-Pesa transaction code.'
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        '/api/payments/manual',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            applicationNumber,
            mpesaCode: code,
            phoneNumber:
              phoneNumber.trim(),
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
            'Unable to submit payment.'
        );
      }

      setSuccess(
        data.message ||
          'Payment submitted successfully.'
      );

      setMpesaCode('');
      setPhoneNumber('');

    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to submit payment.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10">
          <CheckCircle2 className="h-5 w-5 text-brand-green" />
        </div>

        <div>
          <h2 className="font-bold text-brand-dark">
            Submit Payment Details
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            After making your payment, enter the
            transaction code from the M-Pesa SMS.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      <div className="mt-6 space-y-5">

        <div>
          <label
            htmlFor="mpesaCode"
            className="block text-sm font-semibold text-brand-dark"
          >
            M-Pesa Transaction Code
          </label>

          <input
            id="mpesaCode"
            type="text"
            value={mpesaCode}
            onChange={(event) =>
              setMpesaCode(
                event.target.value
                  .toUpperCase()
              )
            }
            placeholder="e.g. QAB12CD34E"
            maxLength={20}
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold uppercase tracking-wide outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
          />

          <p className="mt-2 text-xs text-slate-400">
            Enter the transaction code exactly as it
            appears in your M-Pesa confirmation message.
          </p>
        </div>

        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-semibold text-brand-dark"
          >
            M-Pesa Phone Number
            <span className="ml-1 font-normal text-slate-400">
              (optional)
            </span>
          </label>

          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(event) =>
              setPhoneNumber(
                event.target.value
              )
            }
            placeholder="e.g. 07XXXXXXXX"
            autoComplete="tel"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-green focus:ring-2 focus:ring-brand-green/10"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Payment for Verification
            </>
          )}
        </button>

      </div>

      <p className="mt-5 text-center text-xs leading-5 text-slate-400">
        Your payment will remain pending until it has
        been verified by the admissions office.
      </p>
    </form>
  );
}