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
  const [mpesaCode, setMpesaCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');

    const code = mpesaCode.trim().toUpperCase();

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
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicationNumber,
            mpesaCode: code,
            phoneNumber: phoneNumber.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
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
      className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7"
    >
      {/* =================================================
          FORM HEADER
      ================================================= */}

      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">
          <CheckCircle2 size={21} />
        </div>

        <div>
          <h2 className="font-bold text-[#0c1f1a]">
            Submit Payment Details
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            After making your payment, enter the
            transaction code from the M-Pesa SMS.
          </p>
        </div>
      </div>

      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {/* =================================================
          SUCCESS MESSAGE
      ================================================= */}

      {success && (
        <div
          role="status"
          className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
        >
          {success}
        </div>
      )}

      {/* =================================================
          FORM FIELDS
      ================================================= */}

      <div className="mt-6 space-y-5">

        {/* M-PESA TRANSACTION CODE */}

        <div>
          <label
            htmlFor="mpesaCode"
            className="block text-sm font-semibold text-[#0c1f1a]"
          >
            M-Pesa Transaction Code
          </label>

          <input
            id="mpesaCode"
            name="mpesaCode"
            type="text"
            value={mpesaCode}
            onChange={(event) =>
              setMpesaCode(
                event.target.value.toUpperCase()
              )
            }
            placeholder="e.g. QAB12CD34E"
            maxLength={20}
            autoComplete="off"
            spellCheck={false}
            required
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold uppercase tracking-wide text-[#0c1f1a] outline-none transition placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:border-[#0f4f3f] focus:ring-2 focus:ring-[#0f4f3f]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
          />

          <p className="mt-2 text-xs leading-5 text-gray-400">
            Enter the transaction code exactly as it
            appears in your M-Pesa confirmation message.
          </p>
        </div>

        {/* PHONE NUMBER */}

        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-semibold text-[#0c1f1a]"
          >
            M-Pesa Phone Number

            <span className="ml-1 font-normal text-gray-400">
              (optional)
            </span>
          </label>

          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(event) =>
              setPhoneNumber(event.target.value)
            }
            placeholder="e.g. 07XXXXXXXX"
            autoComplete="tel"
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#0c1f1a] outline-none transition placeholder:text-gray-400 focus:border-[#0f4f3f] focus:ring-2 focus:ring-[#0f4f3f]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
          />

          <p className="mt-2 text-xs leading-5 text-gray-400">
            This helps the admissions office confirm the
            payment source.
          </p>
        </div>

        {/* SUBMIT */}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f4f3f] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0c1f1a] focus:outline-none focus:ring-2 focus:ring-[#0f4f3f]/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />

              Submitting...
            </>
          ) : (
            <>
              <Send size={17} />

              Submit Payment for Verification
            </>
          )}
        </button>

      </div>

      {/* =================================================
          VERIFICATION NOTICE
      ================================================= */}

      <div className="mt-5 rounded-xl bg-[#f7f9f8] px-4 py-3.5">
        <p className="text-center text-xs leading-5 text-gray-400">
          Your payment will remain pending until it has
          been verified by the admissions office.
        </p>
      </div>
    </form>
  );
}