/* =========================================================
   M-PESA DARaja SERVICE
   Shifah Medical Training College
========================================================= */

const MPESA_ENVIRONMENT =
  process.env.MPESA_ENVIRONMENT || 'sandbox';

const MPESA_CONSUMER_KEY =
  process.env.MPESA_CONSUMER_KEY;

const MPESA_CONSUMER_SECRET =
  process.env.MPESA_CONSUMER_SECRET;

const MPESA_SHORTCODE =
  process.env.MPESA_SHORTCODE;

const MPESA_PASSKEY =
  process.env.MPESA_PASSKEY;

const MPESA_CALLBACK_URL =
  process.env.MPESA_CALLBACK_URL;

/* =========================================================
   API URLS
========================================================= */

const BASE_URL =
  MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

const OAUTH_URL =
  `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;

const STK_PUSH_URL =
  `${BASE_URL}/mpesa/stkpush/v1/processrequest`;
const callbackUrl =
  process.env.MPESA_CALLBACK_URL;
/* =========================================================
   TYPES
========================================================= */

export type STKPushResponse = {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
  errorCode?: string;
  errorMessage?: string;
};

export type AccessTokenResponse = {
  access_token: string;
  expires_in: string;
};

/* =========================================================
   VALIDATE CONFIGURATION
========================================================= */

function validateMpesaConfiguration() {
  const missing: string[] = [];

  if (!MPESA_CONSUMER_KEY) {
    missing.push('MPESA_CONSUMER_KEY');
  }

  if (!MPESA_CONSUMER_SECRET) {
    missing.push('MPESA_CONSUMER_SECRET');
  }

  if (!MPESA_SHORTCODE) {
    missing.push('MPESA_SHORTCODE');
  }

  if (!MPESA_PASSKEY) {
    missing.push('MPESA_PASSKEY');
  }

  if (!MPESA_CALLBACK_URL) {
    missing.push('MPESA_CALLBACK_URL');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing M-Pesa environment variables: ${missing.join(', ')}`
    );
  }
}

/* =========================================================
   GENERATE ACCESS TOKEN
========================================================= */

export async function getMpesaAccessToken(): Promise<string> {
  validateMpesaConfiguration();

  const credentials = Buffer.from(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const response = await fetch(OAUTH_URL, {
    method: 'GET',

    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
    },

    cache: 'no-store',
  });

  const data =
    (await response.json()) as
      | AccessTokenResponse
      | {
          errorCode?: string;
          errorMessage?: string;
        };

  if (!response.ok) {
    throw new Error(
      `M-Pesa authentication failed: ${
        'errorMessage' in data
          ? data.errorMessage
          : 'Unable to obtain access token.'
      }`
    );
  }

  if (
    !('access_token' in data) ||
    !data.access_token
  ) {
    throw new Error(
      'M-Pesa did not return an access token.'
    );
  }

  return data.access_token;
}

/* =========================================================
   GENERATE STK PASSWORD
========================================================= */

function generateTimestamp(): string {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    now.getDate()
  ).padStart(2, '0');

  const hours = String(
    now.getHours()
  ).padStart(2, '0');

  const minutes = String(
    now.getMinutes()
  ).padStart(2, '0');

  const seconds = String(
    now.getSeconds()
  ).padStart(2, '0');

  return (
    `${year}${month}${day}` +
    `${hours}${minutes}${seconds}`
  );
}

function generatePassword(
  timestamp: string
): string {
  if (!MPESA_SHORTCODE || !MPESA_PASSKEY) {
    throw new Error(
      'M-Pesa shortcode or passkey is missing.'
    );
  }

  return Buffer.from(
    `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
  ).toString('base64');
}

/* =========================================================
   FORMAT PHONE NUMBER
========================================================= */

export function normalizeMpesaPhone(
  phone: string
): string {
  let cleaned = phone.trim();

  cleaned = cleaned.replace(
    /[\s()-]/g,
    ''
  );

  /*
    0712345678
    ↓
    254712345678

    +254712345678
    ↓
    254712345678
  */

  if (
    cleaned.startsWith('+254')
  ) {
    cleaned =
      '254' +
      cleaned.substring(4);
  } else if (
    cleaned.startsWith('254')
  ) {
    // Already correctly formatted.
  } else if (
    cleaned.startsWith('0')
  ) {
    cleaned =
      '254' +
      cleaned.substring(1);
  }
if (
  !/^254(?:1|7)\d{8}$/.test(cleaned)
) {
  throw new Error(
    'Please provide a valid Kenyan M-Pesa phone number.'
  );
}

  return cleaned;
}

/* =========================================================
   INITIATE STK PUSH
========================================================= */

export async function initiateSTKPush({
  phoneNumber,
  amount,
  accountReference,
  transactionDescription,
}: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDescription: string;
}): Promise<STKPushResponse> {
  validateMpesaConfiguration();

  if (!Number.isInteger(amount)) {
    throw new Error(
      'M-Pesa amount must be a whole number.'
    );
  }

  if (amount <= 0) {
    throw new Error(
      'M-Pesa amount must be greater than zero.'
    );
  }

  const phone =
    normalizeMpesaPhone(phoneNumber);

  const accessToken =
    await getMpesaAccessToken();

  const timestamp =
    generateTimestamp();

  const password =
    generatePassword(timestamp);

  const payload = {
    BusinessShortCode:
      MPESA_SHORTCODE,

    Password:
      password,

    Timestamp:
      timestamp,

    TransactionType:
      'CustomerPayBillOnline',

    Amount:
      amount,

    PartyA:
      phone,

    PartyB:
      MPESA_SHORTCODE,

    PhoneNumber:
      phone,

   CallBackURL: callbackUrl,

    AccountReference:
      accountReference,

    TransactionDesc:
      transactionDescription,
  };

  const response = await fetch(
    STK_PUSH_URL,
    {
      method: 'POST',

      headers: {
        Authorization:
          `Bearer ${accessToken}`,

        'Content-Type':
          'application/json',

        Accept:
          'application/json',
      },

      body:
        JSON.stringify(payload),

      cache: 'no-store',
    }
  );

  const data =
    (await response.json()) as STKPushResponse;

  if (!response.ok) {
    throw new Error(
      data.errorMessage ||
        data.ResponseDescription ||
        'M-Pesa STK Push request failed.'
    );
  }

  return data;
}