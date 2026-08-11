import crypto from 'crypto';
import { cookies } from 'next/headers';

/* =========================================================
   CONFIGURATION
========================================================= */

const STUDENT_SESSION_COOKIE = 'smtc_student_session';

const SESSION_SECRET =
  process.env.STUDENT_SESSION_SECRET ||
  'CHANGE_THIS_STUDENT_SESSION_SECRET';

/* =========================================================
   TYPES
========================================================= */

export type StudentSession = {
  applicationId: number;
  applicationNumber: string;
};

/* =========================================================
   CREATE SIGNATURE
========================================================= */

function createSignature(payload: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('hex');
}

/* =========================================================
   CREATE STUDENT SESSION
========================================================= */

export async function createStudentSession(
  applicationId: number,
  applicationNumber: string
) {
  const payload = `${applicationId}|${applicationNumber}`;

  const signature = createSignature(payload);

  const sessionValue = `${payload}|${signature}`;

  const cookieStore = await cookies();

  cookieStore.set(
    STUDENT_SESSION_COOKIE,
    sessionValue,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    }
  );
}

/* =========================================================
   GET STUDENT SESSION
========================================================= */

export async function getStudentSession(): Promise<StudentSession | null> {
  try {
    const cookieStore = await cookies();

    const cookie = cookieStore.get(
      STUDENT_SESSION_COOKIE
    );

    if (!cookie?.value) {
      return null;
    }

    const parts = cookie.value.split('|');

    if (parts.length !== 3) {
      return null;
    }

    const [
      applicationIdString,
      applicationNumber,
      signature,
    ] = parts;

    const payload =
      `${applicationIdString}|${applicationNumber}`;

    const expectedSignature =
      createSignature(payload);

    const validSignature =
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

    if (!validSignature) {
      return null;
    }

    const applicationId =
      Number(applicationIdString);

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      return null;
    }

    return {
      applicationId,
      applicationNumber,
    };
  } catch (error) {
    console.error(
      'STUDENT SESSION ERROR:',
      error
    );

    return null;
  }
}

/* =========================================================
   DESTROY STUDENT SESSION
========================================================= */

export async function destroyStudentSession() {
  const cookieStore = await cookies();

  cookieStore.set(
    STUDENT_SESSION_COOKIE,
    '',
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    }
  );
}