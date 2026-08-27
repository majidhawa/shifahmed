import crypto from 'crypto';
import { cookies } from 'next/headers';

/* =========================================================
   PARENT AUTHENTICATION
   Shifah Medical Training College
========================================================= */

const PARENT_SESSION_COOKIE = 'smtc_parent_session';

/* =========================================================
   SESSION SECRET
========================================================= */

function getSessionSecret(): string {
  const secret =
    process.env.PARENT_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      'PARENT_SESSION_SECRET, AUTH_SECRET, or SESSION_SECRET must be configured.'
    );
  }

  return secret;
}

/* =========================================================
   SESSION CONFIGURATION
========================================================= */

const SESSION_SECRET = getSessionSecret();

const SESSION_DURATION_MS =
  7 * 24 * 60 * 60 * 1000;

const SESSION_MAX_AGE =
  7 * 24 * 60 * 60;

/* =========================================================
   TYPES
========================================================= */

export type ParentSession = {
  parentId: number;
  email: string;
  issuedAt: number;
};

/* =========================================================
   ENCODE SESSION
========================================================= */

function encodeSession(
  session: ParentSession
): string {
  const payload = Buffer.from(
    JSON.stringify(session),
    'utf8'
  ).toString('base64url');

  const signature = crypto
    .createHmac(
      'sha256',
      SESSION_SECRET
    )
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

/* =========================================================
   DECODE SESSION
========================================================= */

function decodeSession(
  value: string
): ParentSession | null {
  try {
    const parts = value.split('.');

    if (parts.length !== 2) {
      return null;
    }

    const [payload, signature] = parts;

    if (!payload || !signature) {
      return null;
    }

    const expectedSignature = crypto
      .createHmac(
        'sha256',
        SESSION_SECRET
      )
      .update(payload)
      .digest('base64url');

    const signatureBuffer = Buffer.from(
      signature,
      'utf8'
    );

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

    const decoded = Buffer.from(
      payload,
      'base64url'
    ).toString('utf8');

    const session =
      JSON.parse(decoded) as ParentSession;

    if (
      typeof session.parentId !== 'number' ||
      !Number.isInteger(session.parentId) ||
      session.parentId <= 0
    ) {
      return null;
    }

    if (
      typeof session.email !== 'string' ||
      !session.email.trim()
    ) {
      return null;
    }

    if (
      typeof session.issuedAt !== 'number' ||
      !Number.isFinite(session.issuedAt)
    ) {
      return null;
    }

    const sessionAge =
      Date.now() - session.issuedAt;

    if (
      sessionAge < 0 ||
      sessionAge > SESSION_DURATION_MS
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/* =========================================================
   CREATE PARENT SESSION
========================================================= */

export async function createParentSession(
  parentId: number,
  email: string
): Promise<void> {
  if (
    !Number.isInteger(parentId) ||
    parentId <= 0
  ) {
    throw new Error(
      'Invalid parent ID.'
    );
  }

  if (!email || !email.trim()) {
    throw new Error(
      'Parent email is required.'
    );
  }

  const session: ParentSession = {
    parentId,
    email: email
      .trim()
      .toLowerCase(),
    issuedAt: Date.now(),
  };

  const token = encodeSession(session);

  const cookieStore = await cookies();

  cookieStore.set(
    PARENT_SESSION_COOKIE,
    token,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        'production',

      sameSite: 'lax',

      path: '/',

      maxAge: SESSION_MAX_AGE,
    }
  );
}

/* =========================================================
   GET PARENT SESSION
========================================================= */

export async function getParentSession(): Promise<
  ParentSession | null
> {
  const cookieStore = await cookies();

  const cookie = cookieStore.get(
    PARENT_SESSION_COOKIE
  );

  if (!cookie || !cookie.value) {
    return null;
  }

  return decodeSession(
    cookie.value
  );
}

/* =========================================================
   CLEAR PARENT SESSION
========================================================= */

export async function clearParentSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(
    PARENT_SESSION_COOKIE
  );
}

/* =========================================================
   REQUIRE PARENT SESSION
========================================================= */

export async function requireParentSession(): Promise<ParentSession> {
  const session =
    await getParentSession();

  if (!session) {
    throw new Error(
      'UNAUTHORIZED_PARENT'
    );
  }

  return session;
}

/* =========================================================
   CHECK AUTHENTICATION
========================================================= */

export async function isParentAuthenticated(): Promise<boolean> {
  const session =
    await getParentSession();

  return session !== null;
}