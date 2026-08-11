
/* =========================================================
   SHIFAH MEDICAL TRAINING COLLEGE
   COURSE FEE STRUCTURE
========================================================= */

export type CourseFee = {
  course: string;
  amount: number;
  feeType: 'per_term' | 'fixed';
  description: string;
};

/* =========================================================
   CURRENT FEE STRUCTURE
========================================================= */

export const COURSE_FEES: CourseFee[] = [
  {
    course: 'EMT',
    amount: 58000,
    feeType: 'per_term',
    description: 'KSh 58,000 per term',
  },

  {
    course: 'Diploma in Paramedicine',
    amount: 58000,
    feeType: 'per_term',
    description: 'KSh 58,000 per term',
  },

  {
    course: 'Safe Phlebotomy',
    amount: 38000,
    feeType: 'fixed',
    description: 'KSh 38,000',
  },

  {
    course: 'German A1/A2',
    amount: 16500,
    feeType: 'fixed',
    description: 'KSh 16,500',
  },

  {
    course: 'German B1/B2',
    amount: 20500,
    feeType: 'fixed',
    description: 'KSh 20,500',
  },

  {
    course: 'Caregiving Level 4',
    amount: 75000,
    feeType: 'fixed',
    description: 'KSh 75,000',
  },

  {
    course: 'Dialysis Technology',
    amount: 75000,
    feeType: 'fixed',
    description: 'KSh 75,000',
  },
];

/* =========================================================
   NORMALIZE COURSE NAME
========================================================= */

function normalizeCourse(
  course: string | null | undefined
): string {
  return String(course || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/* =========================================================
   GET COURSE FEE
========================================================= */

export function getCourseFee(
  course: string | null | undefined
): CourseFee | null {
  const normalized =
    normalizeCourse(course);

  if (!normalized) {
    return null;
  }

  const fee =
    COURSE_FEES.find(
      (item) =>
        normalizeCourse(item.course) ===
        normalized
    );

  return fee || null;
}

/* =========================================================
   FORMAT COURSE FEE
========================================================= */

export function formatCourseFee(
  amount: number
): string {
  return `KSh ${amount.toLocaleString('en-KE')}`;
}

/* =========================================================
   APPLICATION FEE
========================================================= */

export const APPLICATION_FEE = 1500;

