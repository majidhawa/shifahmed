
'use client';

import { useState } from 'react';

import {
  CreditCard,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Smartphone,
  Download,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

type PaymentData = {
  applicationNumber: string;
  applicationId: number;
  fullName: string;
  course: string;
  intake: string;
  applicationFee: number;
  paymentStatus: string;
  paymentPhone: string;
  mpesaReceiptNumber: string | null;
  mpesaTransactionDate: string;
  isPaid: boolean;
};

type PaymentClientProps = {
  payment: PaymentData;
};

export default function PaymentClient({
  payment,
}: PaymentClientProps) {
  const [phone, setPhone] = useState(
    payment.paymentPhone || ''
  );

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [receiptLoading, setReceiptLoading] =
    useState(false);

  /* =========================================================
     FORMAT PHONE NUMBER
  ========================================================= */

  function normalizePhone(value: string) {
    let cleaned = value.replace(/\D/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = `254${cleaned.substring(1)}`;
    }

    if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(1);
    }

    return cleaned;
  }

  /* =========================================================
     INITIATE PAYMENT
  ========================================================= */

  async function handlePayment() {
    if (!phone.trim()) {
      setMessage({
        type: 'error',
        text:
          'Please enter the M-Pesa phone number you will use for payment.',
      });

      return;
    }

    const normalizedPhone =
      normalizePhone(phone);

    if (!/^2547\d{8}$/.test(normalizedPhone)) {
      setMessage({
        type: 'error',
        text:
          'Please enter a valid Kenyan M-Pesa number.',
      });

      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        '/api/mpesa/stkpush',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicationNumber:
              payment.applicationNumber,

            phoneNumber:
              normalizedPhone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to initiate fee payment. Please try again.'
        );
      }

      setMessage({
        type: 'success',
        text:
          data.message ||
          'M-Pesa payment prompt sent. Check your phone and enter your M-Pesa PIN.',
      });

    } catch (error) {
      console.error(
        'STK payment error:',
        error
      );

      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to initiate fee payment. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     DOWNLOAD RECEIPT
  ========================================================= */

  async function handleDownloadReceipt() {
    setReceiptLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/applications/${encodeURIComponent(
          payment.applicationNumber
        )}/receipt`
      );

      if (!response.ok) {
        let errorMessage =
          'Unable to download receipt.';

        try {
          const data =
            await response.json();

          if (data.message) {
            errorMessage = data.message;
          }
        } catch {
          // Ignore JSON parsing failure.
        }

        throw new Error(errorMessage);
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = url;

      link.download =
        `SMTC-Payment-Receipt-${payment.applicationNumber}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(
        'Receipt download error:',
        error
      );

      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to download receipt.',
      });
    } finally {
      setReceiptLoading(false);
    }
  }

  /* =========================================================
     PAID STATE
  ========================================================= */

  if (payment.isPaid) {
    return (
      <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-7">

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>

            <div>

              <h3 className="font-bold text-[#0c1f1a]">
                Payment Verified
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Your application fee has been successfully
                received and verified by Shifah Medical
                Training College.
              </p>

              {payment.mpesaReceiptNumber && (
                <p className="mt-3 text-xs text-gray-500">
                  M-Pesa Receipt:{' '}
                  <span className="font-mono font-bold text-[#0f4f3f]">
                    {payment.mpesaReceiptNumber}
                  </span>
                </p>
              )}

              {payment.mpesaTransactionDate !==
                '—' && (
                <p className="mt-1 text-xs text-gray-400">
                  Payment Date:{' '}
                  {payment.mpesaTransactionDate}
                </p>
              )}

            </div>

          </div>

          <button
            type="button"
            onClick={handleDownloadReceipt}
            disabled={receiptLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0f4f3f] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c1f1a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {receiptLoading ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Download size={17} />
            )}

            {receiptLoading
              ? 'Preparing...'
              : 'Download Receipt'}
          </button>

        </div>

        {message && (
          <Message
            type={message.type}
            text={message.text}
          />
        )}

      </section>
    );
  }

  /* =========================================================
     PAYMENT FORM
  ========================================================= */

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

      {/* HEADER */}

      <div className="border-b border-gray-100 bg-[#fafcfb] p-6 sm:p-7">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0f4f3f]/10 text-[#0f4f3f]">
            <CreditCard size={23} />
          </div>

          <div>

            <h3 className="font-bold text-[#0c1f1a]">
              Pay Application Fee
            </h3>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              Initiate an M-Pesa payment request for
              your application fee.
            </p>

          </div>

        </div>

      </div>

      {/* BODY */}

      <div className="p-6 sm:p-7">

        <div className="grid gap-6 lg:grid-cols-2">

          {/* AMOUNT */}

          <div className="rounded-xl border border-[#d7a93b]/20 bg-[#fffdf5] p-5">

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Amount Payable
            </p>

            <p className="mt-2 text-3xl font-bold text-[#0c1f1a]">
              KSh{' '}
              {payment.applicationFee.toLocaleString(
                'en-KE'
              )}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Application fee
            </p>

          </div>

          {/* PHONE */}

          <div>

            <label
              htmlFor="payment-phone"
              className="block text-sm font-semibold text-[#0c1f1a]"
            >
              M-Pesa Phone Number
            </label>

            <div className="relative mt-2">

              <Smartphone
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="payment-phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="0712345678"
                disabled={loading}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#0f4f3f] focus:ring-2 focus:ring-[#0f4f3f]/10 disabled:bg-gray-50"
              />

            </div>

            <p className="mt-2 text-xs text-gray-400">
              Enter the M-Pesa number that should
              receive the payment prompt.
            </p>

          </div>

        </div>

        {/* PAY BUTTON */}

        <button
          type="button"
          onClick={handlePayment}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f4f3f] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c1f1a] disabled:cursor-not-allowed disabled:opacity-60"
        >

          {loading ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Sending M-Pesa Prompt...
            </>
          ) : (
            <>
              <CreditCard size={18} />

              Pay KSh{' '}
              {payment.applicationFee.toLocaleString(
                'en-KE'
              )}{' '}
              via M-Pesa
            </>
          )}

        </button>

        {/* MESSAGE */}

        {message && (
          <Message
            type={message.type}
            text={message.text}
          />
        )}

        {/* SECURITY */}

        <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#f8faf9] p-4">

          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-[#0f4f3f]"
          />

          <p className="text-xs leading-5 text-gray-500">
            Your payment is processed through the
            official M-Pesa payment system. Never
            share your M-Pesa PIN with anyone.
          </p>

        </div>

      </div>

    </section>
  );
}

/* =========================================================
   MESSAGE
========================================================= */

function Message({
  type,
  text,
}: {
  type: 'success' | 'error';
  text: string;
}) {
  const success = type === 'success';

  return (
    <div
      className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${
        success
          ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
          : 'border-red-100 bg-red-50 text-red-700'
      }`}
    >
      {success ? (
        <CheckCircle2
          size={18}
          className="mt-0.5 shrink-0"
        />
      ) : (
        <AlertCircle
          size={18}
          className="mt-0.5 shrink-0"
        />
      )}

      <p className="text-sm leading-6">
        {text}
      </p>
    </div>
  );
}

