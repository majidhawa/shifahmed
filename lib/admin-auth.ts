
import crypto from 'crypto';
import { cookies } from 'next/headers';

/* =========================================================
   ADMIN AUTHENTICATION CONFIGURATION
========================================================= */

const SESSION_COOKIE_NAME = 'smtc_admin_session';

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  console.warn(
    'ADMIN_SESSION_SECRET is not configured. Add it to .env.local.'
  );
}

/* =========================================================
   SESSION TYPES
========================================================= */

export type AdminSession = {
  id: number;
  name: string;
  email: string;
  role: string;
  expiresAt: number;
};

/* =========================================================
   CREATE SIGNATURE
========================================================= */

function createSignature(payload: string): string {
  const secret = SESSION_SECRET || 'development-only-secret';

  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/* =========================================================
   CREATE SESSION COOKIE
========================================================= */

export function createAdminSession(session: {
  id: number;
  name: string;
  email: string;
  role: string;
  rememberMe?: boolean;
}) {
  const rememberMe = session.rememberMe === true;

  const expiresAt =
    Date.now() +
    (rememberMe
      ? 1000 * 60 * 60 * 24 * 30
      : 1000 * 60 * 60 * 8);

  const sessionData: AdminSession = {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    expiresAt,
  };

  const payload = Buffer.from(
    JSON.stringify(sessionData)
  ).toString('base64url');

  const signature = createSignature(payload);

  const token = `${payload}.${signature}`;

  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe
      ? 60 * 60 * 24 * 30
      : 60 * 60 * 8,
  });
}

/* =========================================================
   VERIFY SESSION
========================================================= */

export function getAdminSession(): AdminSession | null {
  const cookieStore = cookies();

  const sessionCookie = cookieStore.get(
    SESSION_COOKIE_NAME
  );

  if (!sessionCookie?.value) {
    return null;
  }

  const parts = sessionCookie.value.split('.');

  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;

  try {
    const expectedSignature = createSignature(payload);

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(
      expectedSignature,
      'utf8'
    );

    if (
      signatureBuffer.length !==
      expectedBuffer.length
    ) {
      return null;
    }

    if (
      !crypto.timingSafeEqual(
        signatureBuffer,
        expectedBuffer
      )
    ) {
      return null;
    }

    const sessionData = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as AdminSession;

    if (
      !sessionData.id ||
      !sessionData.email ||
      !sessionData.expiresAt
    ) {
      return null;
    }

    if (Date.now() > sessionData.expiresAt) {
      return null;
    }

    return sessionData;
  } catch {
    return null;
  }
}

/* =========================================================
   CLEAR SESSION
========================================================= */

export function clearAdminSession() {
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/* =========================================================
   REQUIRE ADMIN AUTHENTICATION
========================================================= */

export function requireAdmin() {
  const session = getAdminSession();

  if (!session) {
    return null;
  }

  return session;
}


