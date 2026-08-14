'use client';

import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

/* =========================================================
   TYPES
========================================================= */

type SponsorType =
  | 'Self'
  | 'Parent'
  | 'Guardian'
  | 'Sponsor'
  | '';

type PaymentStatus =
  | 'payment_pending'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected';

type ApplicationData = {
  surname: string;
  middleName: string;
  firstName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  country: string;
  idPassportNumber: string;
  maritalStatus: string;

  postalAddress: string;
  postalCode: string;
  town: string;
  county: string;
  mobile: string;
  email: string;

  kcseIndex: string;
  kcseYear: string;
  kcseMeanGrade: string;
  englishGrade: string;
  kiswahiliGrade: string;
  biologyGrade: string;
  chemistryGrade: string;
  physicsGrade: string;
  mathematicsGrade: string;
  previousInstitution: string;
  highestQualification: string;

  course: string;
  intake: string;

  sponsorType: SponsorType;
  sponsorName: string;
  sponsorRelationship: string;
  sponsorMobile: string;
  sponsorEmail: string;

  guardianName: string;
  guardianRelationship: string;
  guardianMobile: string;
  guardianEmail: string;

  idDocument: File | null;
  kcseCertificate: File | null;
  passportPhoto: File | null;

  declaration: boolean;
};

type SubmittedApplication = {
  id: number;
  application_number: string;
  course: string;
  intake: string;
  application_fee: number;
  payment_status: string;
  application_status: string;
};

type PaymentData = {
  status?: string;
  paymentStatus?: string;

  mpesaReceipt?: string;
  receipt?: string;

  mpesaCode?: string;
  transactionCode?: string;

  manualMpesaCode?: string;
  manual_mpesa_code?: string;

  manualMpesaPhone?: string;
  manual_mpesa_phone?: string;

  amount?: number;

  transactionDate?: string;
  transaction_date?: string;

  phoneNumber?: string;
  phone?: string;

  rejectionReason?: string;
  rejection_reason?: string;

  manualPaymentSubmittedAt?: string;
  manual_payment_submitted_at?: string;
};

type PaymentStatusResponse = {
  success?: boolean;
  message?: string;

  payment?: PaymentData;

  paymentStatus?: string;

  rejectionReason?: string;
  rejection_reason?: string;

  manualMpesaCode?: string;
  manual_mpesa_code?: string;

  manualMpesaPhone?: string;
  manual_mpesa_phone?: string;
};

/* =========================================================
   INITIAL DATA
========================================================= */

const initialData: ApplicationData = {
  surname: '',
  middleName: '',
  firstName: '',
  dateOfBirth: '',
  gender: '',
  nationality: 'Kenyan',
  country: 'Kenya',
  idPassportNumber: '',
  maritalStatus: '',

  postalAddress: '',
  postalCode: '',
  town: '',
  county: '',
  mobile: '',
  email: '',

  kcseIndex: '',
  kcseYear: '',
  kcseMeanGrade: '',
  englishGrade: '',
  kiswahiliGrade: '',
  biologyGrade: '',
  chemistryGrade: '',
  physicsGrade: '',
  mathematicsGrade: '',
  previousInstitution: '',
  highestQualification: '',

  course: '',
  intake: '',

  sponsorType: '',
  sponsorName: '',
  sponsorRelationship: '',
  sponsorMobile: '',
  sponsorEmail: '',

  guardianName: '',
  guardianRelationship: '',
  guardianMobile: '',
  guardianEmail: '',

  idDocument: null,
  kcseCertificate: null,
  passportPhoto: null,

  declaration: false,
};

/* =========================================================
   OPTIONS
========================================================= */

const steps = [
  'Personal',
  'Contact',
  'Academic',
  'Course',
  'Guardian',
  'Review',
];

const courses = [
  'EMT',
  'Diploma in Paramedicine',
  'Safe Phlebotomy',
  'German Language',
  'Caregiving Level 4',
];

const intakes = [
  'September 2026 Intake',
  'January 2027 Intake',
  'March 2027 Intake',
  'May 2027 Intake',
];

const kcseGrades = [
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'C-',
  'D+',
  'D',
  'D-',
  'E',
];

/* =========================================================
   M-PESA
========================================================= */

const MPESA_PAYBILL = '247247';
const MPESA_ACCOUNT = '0330287421280';

/* =========================================================
   STYLES
========================================================= */

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:ring-2 focus:ring-green-600/10';

const buttonBase =
  'inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50';

/* =========================================================
   MAIN COMPONENT
========================================================= */

export function ApplyForm() {
  const formContainerRef =
    useRef<HTMLDivElement | null>(null);

  const [step, setStep] = useState(1);

  const [data, setData] =
    useState<ApplicationData>(initialData);

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  const [submitting, setSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState('');

  const [submitted, setSubmitted] =
    useState(false);

  const [submittedApplication, setSubmittedApplication] =
    useState<SubmittedApplication | null>(null);

  /* =======================================================
     MANUAL PAYMENT STATE

     FLOW:

     payment_pending
     ↓
     applicant pays
     ↓
     applicant enters phone + code
     ↓
     API saves:
       manual_mpesa_code
       manual_mpesa_phone
       manual_payment_submitted_at
       payment_status
     ↓
     awaiting_approval
     ↓
     fields locked
     ↓
     admin approves/rejects
     ↓
     rejected → fields unlocked
     approved → receipt available
  ======================================================= */

  const [mpesaCode, setMpesaCode] =
    useState('');

  const [submittedMpesaCode, setSubmittedMpesaCode] =
    useState('');

  const [mpesaPhone, setMpesaPhone] =
    useState('');

  const [submittedMpesaPhone, setSubmittedMpesaPhone] =
    useState('');

  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>('payment_pending');

  const [paymentSubmitting, setPaymentSubmitting] =
    useState(false);

  const [paymentMessage, setPaymentMessage] =
    useState('');

  const [paymentError, setPaymentError] =
    useState('');

  const [paymentChecking, setPaymentChecking] =
    useState(false);

  const [paymentApproved, setPaymentApproved] =
    useState(false);

  const [paymentRejected, setPaymentRejected] =
    useState(false);

  const [paymentRejectionReason, setPaymentRejectionReason] =
    useState('');

  const [mpesaReceipt, setMpesaReceipt] =
    useState('');

  const [paymentTransactionDate, setPaymentTransactionDate] =
    useState('');

  const [paymentPhoneNumber, setPaymentPhoneNumber] =
    useState('');

  const [paymentAmount, setPaymentAmount] =
    useState<number | null>(null);

  /* =========================================================
     HELPERS
  ========================================================= */

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email.trim()
    );
  };

  const isValidMpesaCode = (code: string) => {
    return /^[A-Z0-9]{8,15}$/i.test(
      code.trim()
    );
  };

  const normalizeMpesaPhone = (phone: string) => {
    return phone
      .trim()
      .replace(/\s+/g, '');
  };

  const isValidMpesaPhone = (phone: string) => {
    const normalized =
      normalizeMpesaPhone(phone);

    return /^(?:07\d{8}|01\d{8}|2547\d{8}|2541\d{8}|\+2547\d{8}|\+2541\d{8})$/.test(
      normalized
    );
  };

  /* =========================================================
     NORMALIZE PAYMENT STATUS
  ========================================================= */

  const normalizePaymentStatus = (
    status: string
  ): PaymentStatus | '' => {
    const normalized = status
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

    if (
      normalized === 'payment_pending' ||
      normalized === 'pending_payment' ||
      normalized === 'unpaid' ||
      normalized === 'pending'
    ) {
      return 'payment_pending';
    }

    if (
      normalized === 'awaiting_approval' ||
      normalized === 'awaiting_verification' ||
      normalized === 'verification_pending' ||
      normalized === 'submitted'
    ) {
      return 'awaiting_approval';
    }

    if (
      normalized === 'approved' ||
      normalized === 'paid' ||
      normalized === 'verified'
    ) {
      return 'approved';
    }

    if (
      normalized === 'rejected' ||
      normalized === 'declined'
    ) {
      return 'rejected';
    }

    return '';
  };

  /* =========================================================
     APPLY PAYMENT STATE
  ========================================================= */

  const applyPaymentState = (
    status: PaymentStatus,
    rejectionReason = ''
  ) => {
    setPaymentStatus(status);

    if (status === 'payment_pending') {
      setPaymentApproved(false);
      setPaymentRejected(false);
      setPaymentRejectionReason('');

      setPaymentMessage(
        'Please complete your M-Pesa payment and enter the transaction code and phone number below.'
      );

      return;
    }

    if (status === 'awaiting_approval') {
      setPaymentApproved(false);
      setPaymentRejected(false);
      setPaymentRejectionReason('');

      setPaymentMessage(
        'Your M-Pesa transaction details have been submitted successfully and are awaiting administrator approval.'
      );

      return;
    }

    if (status === 'rejected') {
      setPaymentApproved(false);
      setPaymentRejected(true);

      setPaymentRejectionReason(
        rejectionReason
      );

      setPaymentMessage(
        'Your payment verification was rejected. Please enter the correct M-Pesa transaction details and submit them again.'
      );

      return;
    }

    if (status === 'approved') {
      setPaymentApproved(true);
      setPaymentRejected(false);
      setPaymentRejectionReason('');

      setPaymentMessage(
        'Your M-Pesa payment has been approved successfully. Your official receipt is now available.'
      );

      return;
    }
  };

  /* =========================================================
     WHETHER MANUAL PAYMENT FIELDS ARE LOCKED
  ========================================================= */

  const paymentFieldsLocked =
    paymentSubmitting ||
    paymentStatus === 'awaiting_approval' ||
    paymentStatus === 'approved';

  /* =========================================================
     PAYMENT STATUS POLLING

     BACKEND IS SOURCE OF TRUTH
  ========================================================= */

  useEffect(() => {
    const applicationNumber =
      submittedApplication?.application_number;

    if (
      !submitted ||
      !applicationNumber
    ) {
      return;
    }

    let cancelled = false;

    let intervalId:
      | number
      | undefined;

    const checkPaymentStatus =
      async () => {
        if (cancelled) {
          return;
        }

        try {
          setPaymentChecking(true);

          const response =
            await fetch(
              `/api/applications/${encodeURIComponent(
                applicationNumber
              )}/payment-status`,
              {
                method: 'GET',
                cache: 'no-store',
              }
            );

          const result: PaymentStatusResponse =
            await response.json();

          if (
            !response.ok ||
            !result?.success
          ) {
            return;
          }

          const payment =
            result.payment || {};

          /* -----------------------------------------------
             STATUS
          ----------------------------------------------- */

          const rawStatus =
            payment.status ||
            payment.paymentStatus ||
            result.paymentStatus ||
            '';

          const normalizedStatus =
            normalizePaymentStatus(
              rawStatus
            );

          /* -----------------------------------------------
             MANUAL M-PESA CODE

             Support both camelCase and database
             snake_case response names.
          ----------------------------------------------- */

          const returnedMpesaCode =
            payment.manualMpesaCode ||
            payment.manual_mpesa_code ||
            payment.mpesaCode ||
            payment.transactionCode ||
            result.manualMpesaCode ||
            result.manual_mpesa_code ||
            '';

          if (returnedMpesaCode) {
            setSubmittedMpesaCode(
              returnedMpesaCode
            );

            setMpesaCode(
              returnedMpesaCode
            );
          }

          /* -----------------------------------------------
             MANUAL M-PESA PHONE
          ----------------------------------------------- */

          const returnedMpesaPhone =
            payment.manualMpesaPhone ||
            payment.manual_mpesa_phone ||
            payment.phoneNumber ||
            payment.phone ||
            result.manualMpesaPhone ||
            result.manual_mpesa_phone ||
            '';

          if (returnedMpesaPhone) {
            setSubmittedMpesaPhone(
              returnedMpesaPhone
            );

            setMpesaPhone(
              returnedMpesaPhone
            );

            setPaymentPhoneNumber(
              returnedMpesaPhone
            );
          }

          /* -----------------------------------------------
             AMOUNT
          ----------------------------------------------- */

          if (
            payment.amount !== undefined &&
            payment.amount !== null
          ) {
            setPaymentAmount(
              Number(payment.amount)
            );
          }

          /* -----------------------------------------------
             RECEIPT
          ----------------------------------------------- */

          setMpesaReceipt(
            payment.mpesaReceipt ||
              payment.receipt ||
              ''
          );

          /* -----------------------------------------------
             TRANSACTION DATE
          ----------------------------------------------- */

          setPaymentTransactionDate(
            payment.transactionDate ||
              payment.transaction_date ||
              ''
          );

          /* -----------------------------------------------
             REJECTION REASON
          ----------------------------------------------- */

          const rejectionReason =
            payment.rejectionReason ||
            payment.rejection_reason ||
            result.rejectionReason ||
            result.rejection_reason ||
            '';

          if (!normalizedStatus) {
            return;
          }

          if (cancelled) {
            return;
          }

          /* -----------------------------------------------
             PAYMENT PENDING
          ----------------------------------------------- */

          if (
            normalizedStatus ===
            'payment_pending'
          ) {
            applyPaymentState(
              'payment_pending'
            );

            return;
          }

          /* -----------------------------------------------
             AWAITING APPROVAL
          ----------------------------------------------- */

          if (
            normalizedStatus ===
            'awaiting_approval'
          ) {
            applyPaymentState(
              'awaiting_approval'
            );

            return;
          }

          /* -----------------------------------------------
             REJECTED
          ----------------------------------------------- */

          if (
            normalizedStatus ===
            'rejected'
          ) {
            applyPaymentState(
              'rejected',
              rejectionReason
            );

            if (intervalId) {
              window.clearInterval(
                intervalId
              );
            }

            return;
          }

          /* -----------------------------------------------
             APPROVED
          ----------------------------------------------- */

          if (
            normalizedStatus ===
            'approved'
          ) {
            applyPaymentState(
              'approved'
            );

            if (intervalId) {
              window.clearInterval(
                intervalId
              );
            }

            return;
          }
        } catch (error) {
          console.error(
            'Payment verification status error:',
            error
          );
        } finally {
          if (!cancelled) {
            setPaymentChecking(false);
          }
        }
      };

    void checkPaymentStatus();

    intervalId =
      window.setInterval(
        checkPaymentStatus,
        5000
      );

    return () => {
      cancelled = true;

      if (intervalId) {
        window.clearInterval(
          intervalId
        );
      }
    };
  }, [
    submitted,
    submittedApplication?.application_number,
  ]);

  /* =========================================================
     UPDATE FIELD
  ========================================================= */

  const updateField = <
    K extends keyof ApplicationData
  >(
    field: K,
    value: ApplicationData[K]
  ) => {
    setData((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const updated = {
        ...current,
      };

      delete updated[field];

      return updated;
    });

    setSubmitError('');
  };

  /* =========================================================
     SCROLL
  ========================================================= */

  const scrollToForm = () => {
    window.setTimeout(() => {
      formContainerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 50);
  };

  /* =========================================================
     VALIDATE STEP
  ========================================================= */

  const validateStep = () => {
    const newErrors: Record<
      string,
      string
    > = {};

    /* STEP 1 */

    if (step === 1) {
      if (!data.surname.trim()) {
        newErrors.surname =
          'Surname is required.';
      }

      if (!data.firstName.trim()) {
        newErrors.firstName =
          'First name is required.';
      }

      if (!data.dateOfBirth) {
        newErrors.dateOfBirth =
          'Date of birth is required.';
      }

      if (!data.gender) {
        newErrors.gender =
          'Please select your gender.';
      }

      if (
        !data.idPassportNumber.trim()
      ) {
        newErrors.idPassportNumber =
          'ID or Passport number is required.';
      }
    }

    /* STEP 2 */

    if (step === 2) {
      if (!data.mobile.trim()) {
        newErrors.mobile =
          'Mobile number is required.';
      }

      if (!data.email.trim()) {
        newErrors.email =
          'Email address is required.';
      } else if (
        !isValidEmail(data.email)
      ) {
        newErrors.email =
          'Please enter a valid email address.';
      }

      if (!data.county.trim()) {
        newErrors.county =
          'County is required.';
      }
    }

    /* STEP 3 */

    if (step === 3) {
      if (!data.kcseIndex.trim()) {
        newErrors.kcseIndex =
          'KCSE index number is required.';
      }

      if (!data.kcseYear.trim()) {
        newErrors.kcseYear =
          'KCSE year is required.';
      } else {
        const year =
          Number(data.kcseYear);

        if (
          !Number.isInteger(year) ||
          year < 1990 ||
          year >
            new Date().getFullYear()
        ) {
          newErrors.kcseYear =
            'Please enter a valid KCSE year.';
        }
      }

      if (!data.kcseMeanGrade) {
        newErrors.kcseMeanGrade =
          'KCSE mean grade is required.';
      }
    }

    /* STEP 4 */

    if (step === 4) {
      if (!data.course) {
        newErrors.course =
          'Please select a course.';
      }

      if (!data.intake) {
        newErrors.intake =
          'Please select an intake.';
      }

      if (!data.sponsorType) {
        newErrors.sponsorType =
          'Please select the sponsor type.';
      }

      if (
        data.sponsorType &&
        data.sponsorType !== 'Self' &&
        !data.sponsorName.trim()
      ) {
        newErrors.sponsorName =
          'Sponsor name is required.';
      }

      if (
        data.sponsorEmail.trim() &&
        !isValidEmail(
          data.sponsorEmail
        )
      ) {
        newErrors.sponsorEmail =
          'Please enter a valid sponsor email.';
      }
    }

    /* STEP 5 */

    if (step === 5) {
      if (!data.guardianName.trim()) {
        newErrors.guardianName =
          'Parent/Guardian name is required.';
      }

      if (!data.guardianMobile.trim()) {
        newErrors.guardianMobile =
          'Parent/Guardian mobile number is required.';
      }

      if (
        data.guardianEmail.trim() &&
        !isValidEmail(
          data.guardianEmail
        )
      ) {
        newErrors.guardianEmail =
          'Please enter a valid email address.';
      }
    }

    /* STEP 6 */

    if (step === 6) {
      if (!data.idDocument) {
        newErrors.idDocument =
          'National ID or Passport is required.';
      }

      if (!data.kcseCertificate) {
        newErrors.kcseCertificate =
          'KCSE Certificate or Result Slip is required.';
      }

      if (!data.passportPhoto) {
        newErrors.passportPhoto =
          'Passport size photo is required.';
      }
    }

    /* STEP 7 */

    if (step === 7) {
      if (!data.declaration) {
        newErrors.declaration =
          'You must accept the declaration before submitting.';
      }
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  /* =========================================================
     NEXT
  ========================================================= */

  const nextStep = () => {
    if (!validateStep()) {
      return;
    }

    setStep((current) =>
      Math.min(
        current + 1,
        steps.length
      )
    );

    scrollToForm();
  };

  /* =========================================================
     PREVIOUS
  ========================================================= */

  const previousStep = () => {
    setErrors({});
    setSubmitError('');

    setStep((current) =>
      Math.max(current - 1, 1)
    );

    scrollToForm();
  };

  /* =========================================================
     FINAL APPLICATION SUBMISSION
  ========================================================= */

  const handleFinalSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!validateStep()) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const formData =
        new FormData();

      /* PERSONAL */

      formData.append(
        'surname',
        data.surname.trim()
      );

      formData.append(
        'middleName',
        data.middleName.trim()
      );

      formData.append(
        'firstName',
        data.firstName.trim()
      );

      formData.append(
        'dateOfBirth',
        data.dateOfBirth
      );

      formData.append(
        'gender',
        data.gender
      );

      formData.append(
        'nationality',
        data.nationality.trim()
      );

      formData.append(
        'country',
        data.country.trim()
      );

      formData.append(
        'idPassportNumber',
        data.idPassportNumber.trim()
      );

      formData.append(
        'maritalStatus',
        data.maritalStatus
      );

      /* CONTACT */

      formData.append(
        'postalAddress',
        data.postalAddress.trim()
      );

      formData.append(
        'postalCode',
        data.postalCode.trim()
      );

      formData.append(
        'town',
        data.town.trim()
      );

      formData.append(
        'county',
        data.county.trim()
      );

      formData.append(
        'mobile',
        data.mobile.trim()
      );

      formData.append(
        'email',
        data.email.trim()
      );

      /* ACADEMIC */

      formData.append(
        'kcseIndex',
        data.kcseIndex.trim()
      );

      formData.append(
        'kcseYear',
        data.kcseYear.trim()
      );

      formData.append(
        'kcseMeanGrade',
        data.kcseMeanGrade
      );

      formData.append(
        'englishGrade',
        data.englishGrade
      );

      formData.append(
        'kiswahiliGrade',
        data.kiswahiliGrade
      );

      formData.append(
        'biologyGrade',
        data.biologyGrade
      );

      formData.append(
        'chemistryGrade',
        data.chemistryGrade
      );

      formData.append(
        'physicsGrade',
        data.physicsGrade
      );

      formData.append(
        'mathematicsGrade',
        data.mathematicsGrade
      );

      formData.append(
        'previousInstitution',
        data.previousInstitution.trim()
      );

      formData.append(
        'highestQualification',
        data.highestQualification.trim()
      );

      /* COURSE */

      formData.append(
        'course',
        data.course
      );

      formData.append(
        'intake',
        data.intake
      );

      /* SPONSOR */

      formData.append(
        'sponsorType',
        data.sponsorType
      );

      formData.append(
        'sponsorName',
        data.sponsorName.trim()
      );

      formData.append(
        'sponsorRelationship',
        data.sponsorRelationship.trim()
      );

      formData.append(
        'sponsorMobile',
        data.sponsorMobile.trim()
      );

      formData.append(
        'sponsorEmail',
        data.sponsorEmail.trim()
      );

      /* GUARDIAN */

      formData.append(
        'guardianName',
        data.guardianName.trim()
      );

      formData.append(
        'guardianRelationship',
        data.guardianRelationship
      );

      formData.append(
        'guardianMobile',
        data.guardianMobile.trim()
      );

      formData.append(
        'guardianEmail',
        data.guardianEmail.trim()
      );

      /* DECLARATION */

      formData.append(
        'declaration',
        String(data.declaration)
      );

     

      /* SEND APPLICATION */

      const response =
        await fetch(
          '/api/applications',
          {
            method: 'POST',
            body: formData,
          }
        );

      const responseText =
        await response.text();

      let result:
        | {
            success?: boolean;
            message?: string;
            application?: SubmittedApplication;
          }
        | null = null;

      try {
        result = responseText
          ? JSON.parse(
              responseText
            )
          : null;
     } catch {
  throw new Error(
    responseText ||
    `Server returned HTTP ${response.status}`
  );
}

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            'Failed to submit your application.'
        );
      }

      const application =
        result.application;

      if (
        !application ||
        !application.application_number
      ) {
        throw new Error(
          'Application was saved, but no application number was returned by the server.'
        );
      }

      setSubmittedApplication(
        application
      );

      /* =====================================================
         INITIAL PAYMENT STATE

         The applicant now needs to:

         1. Pay KSh 1,500
         2. Enter M-Pesa phone
         3. Enter M-Pesa transaction code
         4. Submit for approval
      ===================================================== */

      setMpesaCode('');
      setSubmittedMpesaCode('');

      setMpesaPhone(
        data.mobile || ''
      );

      setSubmittedMpesaPhone('');

      setPaymentStatus(
        'payment_pending'
      );

      setPaymentSubmitting(false);
      setPaymentChecking(false);

      setPaymentApproved(false);
      setPaymentRejected(false);

      setPaymentRejectionReason('');

      setPaymentError('');

      setPaymentMessage(
        'Please complete your M-Pesa payment and enter the transaction code and phone number below.'
      );

      setMpesaReceipt('');
      setPaymentTransactionDate('');
      setPaymentPhoneNumber('');
      setPaymentAmount(null);

      setSubmitted(true);

      scrollToForm();
    } catch (error) {
      console.error(
        'Application submission error:',
        error
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Something went wrong while submitting your application.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     SUBMIT MANUAL M-PESA CODE
     
     THIS IS THE IMPORTANT CHANGE.

     The API receives:

       manualMpesaCode
       manualMpesaPhone

     The API should save:

       manual_mpesa_code
       manual_mpesa_phone
       manual_payment_submitted_at
       payment_status
  ========================================================= */

  const handlePaymentVerification =
    async () => {
      if (paymentSubmitting) {
        return;
      }

      setPaymentError('');
      setPaymentMessage('');

      const applicationNumber =
        submittedApplication?.application_number;

      if (!applicationNumber) {
        setPaymentError(
          'Application number is missing. Please contact SMTC.'
        );

        return;
      }

      /* Applicant can only submit when pending/rejected */

      if (
        paymentStatus !==
          'payment_pending' &&
        paymentStatus !==
          'rejected'
      ) {
        return;
      }

      /* -----------------------------------------------
         VALIDATE M-PESA CODE
      ----------------------------------------------- */

      const code =
        mpesaCode
          .trim()
          .toUpperCase();

      if (!code) {
        setPaymentError(
          'Please enter your M-Pesa transaction code.'
        );

        return;
      }

      if (
        !isValidMpesaCode(code)
      ) {
        setPaymentError(
          'Please enter a valid M-Pesa transaction code.'
        );

        return;
      }

      /* -----------------------------------------------
         VALIDATE M-PESA PHONE
      ----------------------------------------------- */

      const phone =
        normalizeMpesaPhone(
          mpesaPhone
        );

      if (!phone) {
        setPaymentError(
          'Please enter the M-Pesa phone number used to make the payment.'
        );

        return;
      }

      if (
        !isValidMpesaPhone(phone)
      ) {
        setPaymentError(
          'Please enter a valid Kenyan M-Pesa phone number.'
        );

        return;
      }

      /* -----------------------------------------------
         DISPLAY / LOCK IMMEDIATELY
      ----------------------------------------------- */

      setMpesaCode(code);
      setMpesaPhone(phone);

      setSubmittedMpesaCode(code);
      setSubmittedMpesaPhone(phone);

      setPaymentPhoneNumber(phone);

      setPaymentStatus(
        'awaiting_approval'
      );

      setPaymentSubmitting(true);

      try {
        /* =================================================
           EXISTING PAYMENT VERIFICATION API

           DO NOT CREATE ANOTHER ENDPOINT.

           We are posting both manual payment values.
        ================================================= */

        const response =
          await fetch(
            `/api/applications/${encodeURIComponent(
              applicationNumber
            )}/payment-verification`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                /*
                 * Frontend names
                 */
                mpesaCode: code,
                mpesaPhone: phone,

                /*
                 * Explicit manual-payment names.
                 *
                 * These allow the API to map directly
                 * to the database fields.
                 */
                manualMpesaCode: code,
                manualMpesaPhone: phone,

                /*
                 * Snake-case versions are also included
                 * so the existing API can use either
                 * naming convention without losing the
                 * submitted information.
                 */
                manual_mpesa_code: code,
                manual_mpesa_phone: phone,
              }),
            }
          );

        const responseText =
          await response.text();

        let result:
          | {
              success?: boolean;
              message?: string;

              payment?: PaymentData;

              manualMpesaCode?: string;
              manual_mpesa_code?: string;

              manualMpesaPhone?: string;
              manual_mpesa_phone?: string;
            }
          | null = null;

        try {
          result = responseText
            ? JSON.parse(
                responseText
              )
            : null;
        } catch {
          throw new Error(
            'The payment verification server returned an invalid response.'
          );
        }

        /* -----------------------------------------------
           SERVER REJECTED REQUEST
        ----------------------------------------------- */

        if (
          !response.ok ||
          !result?.success
        ) {
          setPaymentStatus(
            'payment_pending'
          );

          setSubmittedMpesaCode('');
          setSubmittedMpesaPhone('');

          throw new Error(
            result?.message ||
              'Unable to submit your M-Pesa transaction details.'
          );
        }

        /* -----------------------------------------------
           READ RETURNED PAYMENT
        ----------------------------------------------- */

        const returnedPayment =
          result.payment || {};

        const returnedStatus =
          returnedPayment.status ||
          returnedPayment.paymentStatus ||
          'awaiting_approval';

        const normalizedStatus =
          normalizePaymentStatus(
            returnedStatus
          );

        const finalStatus =
          normalizedStatus ||
          'awaiting_approval';

        /* -----------------------------------------------
           RETURNED CODE
        ----------------------------------------------- */

        const returnedCode =
          returnedPayment.manualMpesaCode ||
          returnedPayment.manual_mpesa_code ||
          returnedPayment.mpesaCode ||
          returnedPayment.transactionCode ||
          result.manualMpesaCode ||
          result.manual_mpesa_code ||
          code;

        /* -----------------------------------------------
           RETURNED PHONE
        ----------------------------------------------- */

        const returnedPhone =
          returnedPayment.manualMpesaPhone ||
          returnedPayment.manual_mpesa_phone ||
          returnedPayment.phoneNumber ||
          returnedPayment.phone ||
          result.manualMpesaPhone ||
          result.manual_mpesa_phone ||
          phone;

        setMpesaCode(
          returnedCode
        );

        setSubmittedMpesaCode(
          returnedCode
        );

        setMpesaPhone(
          returnedPhone
        );

        setSubmittedMpesaPhone(
          returnedPhone
        );

        setPaymentPhoneNumber(
          returnedPhone
        );

        /* -----------------------------------------------
           AMOUNT
        ----------------------------------------------- */

        if (
          returnedPayment.amount !==
            undefined &&
          returnedPayment.amount !==
            null
        ) {
          setPaymentAmount(
            Number(
              returnedPayment.amount
            )
          );
        }

        /* -----------------------------------------------
           RECEIPT
        ----------------------------------------------- */

        setMpesaReceipt(
          returnedPayment.mpesaReceipt ||
            returnedPayment.receipt ||
            ''
        );

        /* -----------------------------------------------
           TRANSACTION DATE
        ----------------------------------------------- */

        setPaymentTransactionDate(
          returnedPayment.transactionDate ||
            returnedPayment.transaction_date ||
            ''
        );

        /* -----------------------------------------------
           REJECTION
        ----------------------------------------------- */

        const returnedRejectionReason =
          returnedPayment.rejectionReason ||
          returnedPayment.rejection_reason ||
          '';

        /* -----------------------------------------------
           AWAITING APPROVAL
        ----------------------------------------------- */

        if (
          finalStatus ===
          'awaiting_approval'
        ) {
          applyPaymentState(
            'awaiting_approval'
          );

          return;
        }

        /* -----------------------------------------------
           APPROVED
        ----------------------------------------------- */

        if (
          finalStatus ===
          'approved'
        ) {
          applyPaymentState(
            'approved'
          );

          return;
        }

        /* -----------------------------------------------
           REJECTED
        ----------------------------------------------- */

        if (
          finalStatus ===
          'rejected'
        ) {
          applyPaymentState(
            'rejected',
            returnedRejectionReason
          );

          return;
        }

        /* -----------------------------------------------
           FALLBACK
        ----------------------------------------------- */

        applyPaymentState(
          'awaiting_approval'
        );
      } catch (error) {
        console.error(
          'Payment verification submission error:',
          error
        );

        setPaymentError(
          error instanceof Error
            ? error.message
            : 'Unable to submit your M-Pesa transaction details.'
        );

        /*
         * If the server request failed, the applicant
         * must be allowed to submit again.
         */
        setPaymentStatus(
          'payment_pending'
        );

        setPaymentRejected(false);
        setPaymentApproved(false);
      } finally {
        setPaymentSubmitting(
          false
        );
      }
    };

  /* =========================================================
     SUCCESS SCREEN
  ========================================================= */

  if (
    submitted &&
    submittedApplication
  ) {
    const applicationFee =
      Number(
        submittedApplication.application_fee
      ) || 1500;

    const displayedPaymentAmount =
      paymentAmount ??
      applicationFee;

    const displayedPaymentStatus =
      paymentStatus === 'approved'
        ? 'Approved'
        : paymentStatus ===
          'rejected'
        ? 'Rejected'
        : paymentStatus ===
          'awaiting_approval'
        ? 'Awaiting Approval'
        : 'Payment Pending';

    return (
      <div
        ref={formContainerRef}
        className="rounded-2xl border border-green-200 bg-green-50 p-6 sm:p-8"
      >
        {/* =================================================
            SUCCESS HEADER
        ================================================= */}

        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-2xl font-bold text-white shadow-lg">
            ✓
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-green-700">
            Application Received
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Application Submitted Successfully
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
            Your application has been successfully
            submitted to Shifah Medical Training
            College. Please keep your application
            number safe.
          </p>
        </div>

        {/* =================================================
            APPLICATION NUMBER
        ================================================= */}

        <div className="mx-auto mt-7 max-w-lg rounded-2xl border-2 border-green-300 bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Your Application Number
          </p>

          <p className="mt-2 break-all text-2xl font-extrabold tracking-wide text-green-700 sm:text-3xl">
            {
              submittedApplication.application_number
            }
          </p>

          <p className="mt-3 text-xs text-slate-500">
            Save this number. You will need it
            when communicating with SMTC.
          </p>
        </div>

        {/* =================================================
            APPLICATION DETAILS
        ================================================= */}

        <div className="mx-auto mt-6 max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Application Details
            </h3>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <ConfirmationItem
              label="Application Number"
              value={
                submittedApplication.application_number
              }
            />

            <ConfirmationItem
              label="Course"
              value={
                submittedApplication.course
              }
            />

            <ConfirmationItem
              label="Intake"
              value={
                submittedApplication.intake
              }
            />

            <ConfirmationItem
              label="Application Fee"
              value="KSh. 1500"
            />

            <ConfirmationItem
              label="Payment Status"
              value={
                displayedPaymentStatus
              }
              status
            />

            <ConfirmationItem
              label="Application Status"
              value={
                paymentStatus ===
                'approved'
                  ? submittedApplication.application_status
                  : paymentStatus ===
                    'rejected'
                  ? 'Payment Rejected'
                  : paymentStatus ===
                    'awaiting_approval'
                  ? 'Payment Awaiting Approval'
                  : 'Payment Pending'
              }
              status
            />
          </div>
        </div>

        {/* =================================================
            PAYMENT SECTION
        ================================================= */}

        {!paymentApproved && (
          <div className="mx-auto mt-6 max-w-lg">

            {/* =================================================
                PAYMENT PENDING
            ================================================= */}

            {paymentStatus ===
              'payment_pending' && (
              <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">

                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-xs font-extrabold text-white">
                    KSh
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-green-700">
                    Step 1
                  </p>

                  <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
                    Pay Application Fee
                  </h3>

                  <p className="mt-1 text-3xl font-extrabold text-green-700">
                    KSh. 1500
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Complete the application fee
                    payment using the official
                    M-Pesa PayBill details below.
                  </p>
                </div>

                {/* PAYMENT DETAILS */}

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-green-700">
                    M-Pesa Payment Instructions
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-white p-4">
                      <span className="text-sm text-slate-500">
                        PayBill Number
                      </span>

                      <span className="text-xl font-extrabold tracking-wide text-slate-900">
                        {MPESA_PAYBILL}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-xl bg-white p-4">
                      <span className="text-sm text-slate-500">
                        Account Number
                      </span>

                      <span className="break-all text-right text-lg font-extrabold tracking-wide text-green-700">
                        {MPESA_ACCOUNT}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-xl bg-white p-4">
                      <span className="text-sm text-slate-500">
                        Amount
                      </span>

                      <span className="text-lg font-extrabold text-slate-900">
                        KSh.1500
                        
                      </span>
                    </div>
                  </div>
                </div>

                {/* PAYMENT MESSAGE */}

                <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm font-semibold leading-6 text-yellow-800">
                    Complete the M-Pesa payment first.
                    After receiving your M-Pesa
                    confirmation message, enter the
                    phone number used for payment and
                    the transaction code below.
                  </p>
                </div>

                {/* =================================================
                    M-PESA PHONE
                ================================================= */}

                <div className="mt-6">
                  <label
                    htmlFor="mpesa-phone"
                    className="text-sm font-bold text-slate-900"
                  >
                    M-Pesa Phone Number
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="mpesa-phone"
                    type="tel"
                    autoComplete="tel"
                    value={mpesaPhone}
                    disabled={
                      paymentFieldsLocked
                    }
                    onChange={(event) => {
                      setMpesaPhone(
                        event.target.value
                      );

                      setPaymentError('');
                      setPaymentMessage('');
                    }}
                    placeholder="e.g. 0712345678"
                    maxLength={13}
                    className={`${inputClass} ${
                      paymentError
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : ''
                    }`}
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Enter the M-Pesa phone number
                    that was used to make the
                    application fee payment.
                  </p>
                </div>

                {/* =================================================
                    TRANSACTION CODE
                ================================================= */}

                <div className="mt-5">
                  <label
                    htmlFor="mpesa-code"
                    className="text-sm font-bold text-slate-900"
                  >
                    M-Pesa Transaction Code
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="mpesa-code"
                    type="text"
                    autoComplete="off"
                    value={mpesaCode}
                    disabled={
                      paymentFieldsLocked
                    }
                    onChange={(event) => {
                      setMpesaCode(
                        event.target.value
                          .toUpperCase()
                          .replace(
                            /\s/g,
                            ''
                          )
                      );

                      setPaymentError('');
                      setPaymentMessage('');
                    }}
                    placeholder="e.g. UH5021U1A2"
                    maxLength={15}
                    className={`${inputClass} ${
                      paymentError
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : ''
                    }`}
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Enter the transaction code exactly
                    as shown in your M-Pesa
                    confirmation message.
                  </p>
                </div>

                {paymentError && (
                  <div
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"
                    role="alert"
                  >
                    <p className="text-sm font-semibold text-red-700">
                      {paymentError}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={
                    handlePaymentVerification
                  }
                  disabled={
                    paymentSubmitting ||
                    !mpesaCode.trim() ||
                    !mpesaPhone.trim()
                  }
                  className={`${buttonBase} mt-5 w-full bg-green-600 text-white shadow-sm hover:bg-green-700 hover:shadow-lg`}
                >
                  {paymentSubmitting ? (
                    <>
                      <span className="mr-2">
                        Submitting for Verification...
                      </span>

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </>
                  ) : (
                    'Submit for Verification'
                  )}
                </button>
              </div>
            )}

            {/* =================================================
                AWAITING APPROVAL
            ================================================= */}

            {paymentStatus ===
              'awaiting_approval' && (
              <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-6">

                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500 text-lg font-bold text-white">
                    ...
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-yellow-700">
                    Payment Awaiting Approval
                  </p>

                  <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                    Payment Verification in Progress
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-yellow-800">
                    Your M-Pesa transaction details
                    have been submitted successfully.
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    SMTC administration will verify
                    your payment. You do not need to
                    submit the payment again.
                  </p>
                </div>

                {/* LOCKED PHONE */}

                <div className="mt-5 rounded-xl border border-yellow-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    M-Pesa Phone Number
                  </p>

                  <p className="mt-2 text-lg font-extrabold tracking-wide text-slate-900">
                    {submittedMpesaPhone ||
                      mpesaPhone}
                  </p>

                  <div className="mt-3 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
                    🔒 Locked — Awaiting Approval
                  </div>
                </div>

                {/* LOCKED CODE */}

                <div className="mt-4 rounded-xl border border-yellow-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Submitted Transaction Code
                  </p>

                  <p className="mt-2 break-all text-lg font-extrabold tracking-wide text-green-700">
                    {submittedMpesaCode ||
                      mpesaCode}
                  </p>

                  <div className="mt-3 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
                    🔒 Locked — Awaiting Approval
                  </div>
                </div>

                {paymentMessage && (
                  <div className="mt-4 rounded-xl border border-yellow-200 bg-white p-4">
                    <p className="text-sm font-bold text-yellow-800">
                      Payment Awaiting Approval
                    </p>

                    <p className="mt-1 text-sm leading-6 text-yellow-700">
                      {paymentMessage}
                    </p>
                  </div>
                )}

                {paymentChecking && (
                  <div className="mt-5 text-center">
                    <p className="text-xs font-semibold text-yellow-700">
                      Checking payment approval status...
                    </p>

                    <div className="mx-auto mt-3 h-5 w-5 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" />
                  </div>
                )}
              </div>
            )}

            {/* =================================================
                REJECTED
            ================================================= */}

            {paymentStatus ===
              'rejected' && (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-6">

                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-xl font-bold text-white">
                    !
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-red-700">
                    Payment Rejected
                  </p>

                  <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                    Payment Could Not Be Approved
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-red-700">
                    Your submitted M-Pesa transaction
                    details were not approved by SMTC
                    administration.
                  </p>
                </div>

                {/* REJECTION REASON */}

                {paymentRejectionReason && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-red-500">
                      Rejection Reason
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {paymentRejectionReason}
                    </p>
                  </div>
                )}

                {/* UNLOCKED PHONE */}

                <div className="mt-6">
                  <label
                    htmlFor="corrected-mpesa-phone"
                    className="text-sm font-bold text-slate-900"
                  >
                    M-Pesa Phone Number
                  </label>

                  <input
                    id="corrected-mpesa-phone"
                    type="tel"
                    autoComplete="tel"
                    value={mpesaPhone}
                    disabled={
                      paymentSubmitting
                    }
                    onChange={(event) => {
                      setMpesaPhone(
                        event.target.value
                      );

                      setPaymentError('');
                      setPaymentMessage('');
                    }}
                    placeholder="e.g. 0712345678"
                    maxLength={13}
                    className={inputClass}
                  />
                </div>

                {/* UNLOCKED CODE */}

                <div className="mt-5">
                  <label
                    htmlFor="corrected-mpesa-code"
                    className="text-sm font-bold text-slate-900"
                  >
                    Enter Correct M-Pesa Transaction
                    Code
                  </label>

                  <input
                    id="corrected-mpesa-code"
                    type="text"
                    autoComplete="off"
                    value={mpesaCode}
                    disabled={
                      paymentSubmitting
                    }
                    onChange={(event) => {
                      setMpesaCode(
                        event.target.value
                          .toUpperCase()
                          .replace(
                            /\s/g,
                            ''
                          )
                      );

                      setPaymentError('');
                      setPaymentMessage('');
                    }}
                    placeholder="Enter corrected transaction code"
                    maxLength={15}
                    className={inputClass}
                  />

                  <div className="mt-3 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                    ✓ Transaction details unlocked
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Enter the correct M-Pesa phone
                    number and transaction code and
                    submit them again. The details will
                    be locked while awaiting approval.
                  </p>
                </div>

                {paymentError && (
                  <div
                    className="mt-4 rounded-xl border border-red-200 bg-white p-4"
                    role="alert"
                  >
                    <p className="text-sm font-semibold text-red-700">
                      {paymentError}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={
                    handlePaymentVerification
                  }
                  disabled={
                    paymentSubmitting ||
                    !mpesaCode.trim() ||
                    !mpesaPhone.trim()
                  }
                  className={`${buttonBase} mt-5 w-full bg-green-600 text-white shadow-sm hover:bg-green-700`}
                >
                  {paymentSubmitting ? (
                    <>
                      <span className="mr-2">
                        Submitting for Verification...
                      </span>

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </>
                  ) : (
                    'Submit Corrected Details'
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* =================================================
            APPROVED
        ================================================= */}

        {paymentApproved && (
          <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-green-300 bg-white p-6 shadow-sm">

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-2xl font-bold text-white shadow-lg">
                ✓
              </div>

              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-green-700">
                Payment Approved
              </p>

              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
                Application Fee Approved
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your M-Pesa payment has been verified
                and approved by SMTC administration.
              </p>
            </div>

            {/* PAYMENT DETAILS */}

            <div className="mt-6 space-y-4 rounded-xl bg-slate-50 p-5">

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Amount Paid
                </span>

                <span className="font-extrabold text-slate-900">
                  KSh{' '}
                  {displayedPaymentAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  M-Pesa Transaction Code
                </span>

                <span className="break-all text-right font-extrabold text-green-700">
                  {submittedMpesaCode ||
                    mpesaCode ||
                    'Verified'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  M-Pesa Phone
                </span>

                <span className="font-semibold text-slate-900">
                  {submittedMpesaPhone ||
                    paymentPhoneNumber ||
                    'Verified'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Payment Status
                </span>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  Approved
                </span>
              </div>

              {paymentTransactionDate && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    Transaction Date
                  </span>

                  <span className="font-semibold text-slate-900">
                    {paymentTransactionDate}
                  </span>
                </div>
              )}

              {mpesaReceipt &&
                mpesaReceipt !==
                  submittedMpesaCode && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">
                      M-Pesa Receipt
                    </span>

                    <span className="break-all text-right font-semibold text-slate-900">
                      {mpesaReceipt}
                    </span>
                  </div>
                )}
            </div>

            {/* COMPLETE */}

            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-bold text-green-800">
                Application Process Complete ✓
              </p>

              <p className="mt-1 text-xs leading-5 text-green-700">
                Your application fee has been approved.
                Your official receipt is now available
                for download.
              </p>
            </div>

            {/* RECEIPT */}

            <a
              href={`/api/applications/${encodeURIComponent(
                submittedApplication.application_number
              )}/receipt`}
              className={`${buttonBase} mt-5 w-full bg-green-600 text-white shadow-sm hover:bg-green-700 hover:shadow-lg`}
            >
              ↓ Download Official Receipt
            </a>

            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              Your official PDF receipt is available
              because your payment has been approved.
            </p>
          </div>
        )}

        {/* REVIEW */}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setStep(7);
              setSubmitError('');
            }}
            className={`${buttonBase} border border-slate-200 bg-white text-slate-700 hover:border-green-600 hover:text-green-600`}
          >
            ← Review Application
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     APPLICATION FORM
  ========================================================= */

  return (
    <div
      ref={formContainerRef}
      className="w-full"
    >
      <form
        onSubmit={handleFinalSubmit}
      >

        {/* =================================================
            PROGRESS
        ================================================= */}

        <div className="mb-10">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-600">
                SMTC Admission
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                Step {step} of {steps.length}
              </h2>
            </div>

            <p className="text-sm font-semibold text-slate-500">
              {steps[step - 1]}
            </p>
          </div>

          <div
            className="h-2 overflow-hidden rounded-full bg-slate-100"
            aria-label={`Application progress: step ${step} of ${steps.length}`}
          >
            <div
              className="h-full rounded-full bg-green-600 transition-all duration-300"
              style={{
                width: `${
                  (step / steps.length) *
                  100
                }%`,
              }}
            />
          </div>

          <div className="mt-5 hidden gap-2 md:flex">
            {steps.map(
              (item, index) => {
                const number =
                  index + 1;

                const active =
                  number === step;

                const completed =
                  number < step;

                return (
                  <div
                    key={item}
                    className={`flex-1 text-center text-[11px] font-bold ${
                      active ||
                      completed
                        ? 'text-green-600'
                        : 'text-slate-400'
                    }`}
                  >
                    <span
                      className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                        active ||
                        completed
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {completed
                        ? '✓'
                        : number}
                    </span>

                    {item}
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* =================================================
            STEP 1
        ================================================= */}

        {step === 1 && (
          <section>
            <SectionTitle
              title="Personal Information"
              description="Enter your personal information as it appears on your official documents."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Surname"
                required
                error={errors.surname}
              >
                <input
                  type="text"
                  className={inputClass}
                  value={data.surname}
                  autoComplete="family-name"
                  onChange={(event) =>
                    updateField(
                      'surname',
                      event.target.value
                    )
                  }
                  placeholder="Enter surname"
                />
              </Field>

              <Field label="Middle Name">
                <input
                  type="text"
                  className={inputClass}
                  value={data.middleName}
                  autoComplete="additional-name"
                  onChange={(event) =>
                    updateField(
                      'middleName',
                      event.target.value
                    )
                  }
                  placeholder="Enter middle name"
                />
              </Field>

              <Field
                label="First Name"
                required
                error={errors.firstName}
              >
                <input
                  type="text"
                  className={inputClass}
                  value={data.firstName}
                  autoComplete="given-name"
                  onChange={(event) =>
                    updateField(
                      'firstName',
                      event.target.value
                    )
                  }
                  placeholder="Enter first name"
                />
              </Field>

              <Field
                label="Date of Birth"
                required
                error={errors.dateOfBirth}
              >
                <input
                  type="date"
                  className={inputClass}
                  value={data.dateOfBirth}
                  onChange={(event) =>
                    updateField(
                      'dateOfBirth',
                      event.target.value
                    )
                  }
                />
              </Field>

              <Field
                label="Gender"
                required
                error={errors.gender}
              >
                <select
                  className={inputClass}
                  value={data.gender}
                  onChange={(event) =>
                    updateField(
                      'gender',
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select gender
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>
                </select>
              </Field>

              <Field label="Nationality">
                <input
                  type="text"
                  className={inputClass}
                  value={data.nationality}
                  onChange={(event) =>
                    updateField(
                      'nationality',
                      event.target.value
                    )
                  }
                />
              </Field>

              <Field label="Country">
                <input
                  type="text"
                  className={inputClass}
                  value={data.country}
                  onChange={(event) =>
                    updateField(
                      'country',
                      event.target.value
                    )
                  }
                />
              </Field>

              <Field
                label="ID / Passport Number"
                required
                error={
                  errors.idPassportNumber
                }
              >
                <input
                  type="text"
                  className={inputClass}
                  value={
                    data.idPassportNumber
                  }
                  onChange={(event) =>
                    updateField(
                      'idPassportNumber',
                      event.target.value
                    )
                  }
                  placeholder="Enter ID or passport number"
                />
              </Field>

              <Field label="Marital Status">
                <select
                  className={inputClass}
                  value={
                    data.maritalStatus
                  }
                  onChange={(event) =>
                    updateField(
                      'maritalStatus',
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select marital status
                  </option>

                  <option value="Single">
                    Single
                  </option>

                  <option value="Married">
                    Married
                  </option>

                  <option value="Divorced">
                    Divorced
                  </option>

                  <option value="Widowed">
                    Widowed
                  </option>
                </select>
              </Field>
            </div>
          </section>
        )}

        {/* =================================================
            STEP 2
        ================================================= */}

        {step === 2 && (
          <section>
            <SectionTitle
              title="Contact Details"
              description="Provide accurate contact details so SMTC can communicate with you."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Postal Address">
                <input
                  type="text"
                  className={inputClass}
                  value={data.postalAddress}
                  onChange={(event) =>
                    updateField(
                      'postalAddress',
                      event.target.value
                    )
                  }
                  placeholder="P.O. Box / Postal Address"
                />
              </Field>

              <Field label="Postal Code">
                <input
                  type="text"
                  className={inputClass}
                  value={data.postalCode}
                  onChange={(event) =>
                    updateField(
                      'postalCode',
                      event.target.value
                    )
                  }
                  placeholder="e.g. 30200"
                />
              </Field>

              <Field label="Town">
                <input
                  type="text"
                  className={inputClass}
                  value={data.town}
                  onChange={(event) =>
                    updateField(
                      'town',
                      event.target.value
                    )
                  }
                  placeholder="Enter town"
                />
              </Field>

              <Field
                label="County"
                required
                error={errors.county}
              >
                <input
                  type="text"
                  className={inputClass}
                  value={data.county}
                  onChange={(event) =>
                    updateField(
                      'county',
                      event.target.value
                    )
                  }
                  placeholder="Enter county"
                />
              </Field>

              <Field
                label="Mobile Number"
                required
                error={errors.mobile}
              >
                <input
                  type="tel"
                  className={inputClass}
                  value={data.mobile}
                  autoComplete="tel"
                  onChange={(event) =>
                    updateField(
                      'mobile',
                      event.target.value
                    )
                  }
                  placeholder="e.g. 0712345678"
                />
              </Field>

              <Field
                label="Email Address"
                required
                error={errors.email}
              >
                <input
                  type="email"
                  className={inputClass}
                  value={data.email}
                  autoComplete="email"
                  onChange={(event) =>
                    updateField(
                      'email',
                      event.target.value
                    )
                  }
                  placeholder="example@email.com"
                />
              </Field>
            </div>
          </section>
        )}

        {/* =================================================
            STEP 3
        ================================================= */}

        {step === 3 && (
          <section>
            <SectionTitle
              title="Academic Information"
              description="Enter your KCSE information and previous educational background."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="KCSE Index Number"
                required
                error={errors.kcseIndex}
              >
                <input
                  type="text"
                  className={inputClass}
                  value={data.kcseIndex}
                  onChange={(event) =>
                    updateField(
                      'kcseIndex',
                      event.target.value
                    )
                  }
                  placeholder="Enter KCSE index number"
                />
              </Field>

              <Field
                label="KCSE Year"
                required
                error={errors.kcseYear}
              >
                <input
                  type="number"
                  min="1990"
                  max={
                    new Date().getFullYear()
                  }
                  className={inputClass}
                  value={data.kcseYear}
                  onChange={(event) =>
                    updateField(
                      'kcseYear',
                      event.target.value
                    )
                  }
                  placeholder="e.g. 2025"
                />
              </Field>

              <Field
                label="KCSE Mean Grade"
                required
                error={errors.kcseMeanGrade}
              >
                <select
                  className={inputClass}
                  value={
                    data.kcseMeanGrade
                  }
                  onChange={(event) =>
                    updateField(
                      'kcseMeanGrade',
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select mean grade
                  </option>

                  {kcseGrades.map(
                    (grade) => (
                      <option
                        key={grade}
                        value={grade}
                      >
                        {grade}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <GradeField
                label="English Grade"
                value={
                  data.englishGrade
                }
                onChange={(value) =>
                  updateField(
                    'englishGrade',
                    value
                  )
                }
              />

              <GradeField
                label="Kiswahili Grade"
                value={
                  data.kiswahiliGrade
                }
                onChange={(value) =>
                  updateField(
                    'kiswahiliGrade',
                    value
                  )
                }
              />

              <GradeField
                label="Biology Grade"
                value={
                  data.biologyGrade
                }
                onChange={(value) =>
                  updateField(
                    'biologyGrade',
                    value
                  )
                }
              />

              <GradeField
                label="Chemistry Grade"
                value={
                  data.chemistryGrade
                }
                onChange={(value) =>
                  updateField(
                    'chemistryGrade',
                    value
                  )
                }
              />

              <GradeField
                label="Physics Grade"
                value={
                  data.physicsGrade
                }
                onChange={(value) =>
                  updateField(
                    'physicsGrade',
                    value
                  )
                }
              />

              <GradeField
                label="Mathematics Grade"
                value={
                  data.mathematicsGrade
                }
                onChange={(value) =>
                  updateField(
                    'mathematicsGrade',
                    value
                  )
                }
              />

              <Field label="Previous Institution">
                <input
                  type="text"
                  className={inputClass}
                  value={
                    data.previousInstitution
                  }
                  onChange={(event) =>
                    updateField(
                      'previousInstitution',
                      event.target.value
                    )
                  }
                  placeholder="Previous school / college"
                />
              </Field>

              <Field label="Highest Qualification">
                <input
                  type="text"
                  className={inputClass}
                  value={
                    data.highestQualification
                  }
                  onChange={(event) =>
                    updateField(
                      'highestQualification',
                      event.target.value
                    )
                  }
                  placeholder="e.g. KCSE"
                />
              </Field>
            </div>
          </section>
        )}

        {/* =================================================
            STEP 4
        ================================================= */}

        {step === 4 && (
          <section>
            <SectionTitle
              title="Course & Sponsorship"
              description="Select your preferred course and provide sponsorship information."
            />

            <div className="space-y-6">
              <Field
                label="Course Applied For"
                required
                error={errors.course}
              >
                <select
                  className={inputClass}
                  value={data.course}
                  onChange={(event) =>
                    updateField(
                      'course',
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select course
                  </option>

                  {courses.map(
                    (course) => (
                      <option
                        key={course}
                        value={course}
                      >
                        {course}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field
                label="Preferred Intake"
                required
                error={errors.intake}
              >
                <select
                  className={inputClass}
                  value={data.intake}
                  onChange={(event) =>
                    updateField(
                      'intake',
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select intake
                  </option>

                  {intakes.map(
                    (intake) => (
                      <option
                        key={intake}
                        value={intake}
                      >
                        {intake}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Sponsorship Information
                </h4>

                <p className="mt-1 text-xs leading-6 text-slate-500">
                  Tell us who will be responsible
                  for financing your education.
                </p>
              </div>

              <Field
                label="Who will sponsor your studies?"
                required
                error={errors.sponsorType}
              >
                <select
                  className={inputClass}
                  value={data.sponsorType}
                  onChange={(event) =>
                    updateField(
                      'sponsorType',
                      event.target.value as SponsorType
                    )
                  }
                >
                  <option value="">
                    Select sponsor
                  </option>

                  <option value="Self">
                    Self
                  </option>

                  <option value="Parent">
                    Parent
                  </option>

                  <option value="Guardian">
                    Guardian
                  </option>

                  <option value="Sponsor">
                    Sponsor
                  </option>
                </select>
              </Field>

              {data.sponsorType && (
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label={
                      data.sponsorType ===
                      'Self'
                        ? 'Applicant Name'
                        : 'Sponsor Name'
                    }
                    required={
                      data.sponsorType !==
                      'Self'
                    }
                    error={
                      errors.sponsorName
                    }
                  >
                    <input
                      type="text"
                      className={inputClass}
                      value={
                        data.sponsorName
                      }
                      onChange={(event) =>
                        updateField(
                          'sponsorName',
                          event.target.value
                        )
                      }
                      placeholder="Enter full name"
                    />
                  </Field>

                  <Field label="Relationship">
                    <input
                      type="text"
                      className={inputClass}
                      value={
                        data.sponsorRelationship
                      }
                      onChange={(event) =>
                        updateField(
                          'sponsorRelationship',
                          event.target.value
                        )
                      }
                      placeholder="e.g. Father"
                    />
                  </Field>

                  <Field label="Mobile Number">
                    <input
                      type="tel"
                      className={inputClass}
                      value={
                        data.sponsorMobile
                      }
                      onChange={(event) =>
                        updateField(
                          'sponsorMobile',
                          event.target.value
                        )
                      }
                      placeholder="Sponsor mobile number"
                    />
                  </Field>

                  <Field
                    label="Email Address"
                    error={
                      errors.sponsorEmail
                    }
                  >
                    <input
                      type="email"
                      className={inputClass}
                      value={
                        data.sponsorEmail
                      }
                      onChange={(event) =>
                        updateField(
                          'sponsorEmail',
                          event.target.value
                        )
                      }
                      placeholder="Sponsor email"
                    />
                  </Field>
                </div>
              )}

              <FeeNotice />
            </div>
          </section>
        )}

        {/* =================================================
            STEP 5
        ================================================= */}

        {step === 5 && (
          <section>
            <SectionTitle
              title="Parent / Guardian / Next of Kin"
              description="Provide a person SMTC can contact when necessary."
            />

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Full Name"
                required
                error={errors.guardianName}
              >
                <input
                  type="text"
                  className={inputClass}
                  value={data.guardianName}
                  onChange={(event) =>
                    updateField(
                      'guardianName',
                      event.target.value
                    )
                  }
                  placeholder="Full name"
                />
              </Field>

              <Field label="Relationship">
                <select
                  className={inputClass}
                  value={
                    data.guardianRelationship
                  }
                  onChange={(event) =>
                    updateField(
                      'guardianRelationship',
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select relationship
                  </option>

                  <option value="Father">
                    Father
                  </option>

                  <option value="Mother">
                    Mother
                  </option>

                  <option value="Guardian">
                    Guardian
                  </option>

                  <option value="Spouse">
                    Spouse
                  </option>

                  <option value="Sibling">
                    Sibling
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </Field>

              <Field
                label="Mobile Number"
                required
                error={
                  errors.guardianMobile
                }
              >
                <input
                  type="tel"
                  className={inputClass}
                  value={
                    data.guardianMobile
                  }
                  onChange={(event) =>
                    updateField(
                      'guardianMobile',
                      event.target.value
                    )
                  }
                  placeholder="e.g. 0712345678"
                />
              </Field>

              <Field
                label="Email Address"
                error={
                  errors.guardianEmail
                }
              >
                <input
                  type="email"
                  className={inputClass}
                  value={
                    data.guardianEmail
                  }
                  onChange={(event) =>
                    updateField(
                      'guardianEmail',
                      event.target.value
                    )
                  }
                  placeholder="guardian@email.com"
                />
              </Field>
            </div>
          </section>
        )}

      

        
        {/* =================================================
            STEP 6
        ================================================= */}

        {step === 6 && (
          <section>
            <SectionTitle
              title="Review Your Application"
              description="Review all information carefully before submitting your application."
            />

            <div className="space-y-6">
              <ReviewSection title="Personal Information">
                <ReviewItem
                  label="Full Name"
                  value={[
                    data.surname,
                    data.middleName,
                    data.firstName,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />

                <ReviewItem
                  label="Date of Birth"
                  value={
                    data.dateOfBirth
                  }
                />

                <ReviewItem
                  label="Gender"
                  value={data.gender}
                />

                <ReviewItem
                  label="Nationality"
                  value={
                    data.nationality
                  }
                />

                <ReviewItem
                  label="Country"
                  value={data.country}
                />

                <ReviewItem
                  label="ID / Passport"
                  value={
                    data.idPassportNumber
                  }
                />

                <ReviewItem
                  label="Marital Status"
                  value={
                    data.maritalStatus
                  }
                />
              </ReviewSection>

              <ReviewSection title="Contact Details">
                <ReviewItem
                  label="Mobile"
                  value={data.mobile}
                />

                <ReviewItem
                  label="Email"
                  value={data.email}
                />

                <ReviewItem
                  label="Town"
                  value={data.town}
                />

                <ReviewItem
                  label="County"
                  value={data.county}
                />

                <ReviewItem
                  label="Postal Address"
                  value={
                    data.postalAddress
                  }
                />
              </ReviewSection>

              <ReviewSection title="Academic Information">
                <ReviewItem
                  label="KCSE Index"
                  value={
                    data.kcseIndex
                  }
                />

                <ReviewItem
                  label="KCSE Year"
                  value={
                    data.kcseYear
                  }
                />

                <ReviewItem
                  label="Mean Grade"
                  value={
                    data.kcseMeanGrade
                  }
                />

                <ReviewItem
                  label="English"
                  value={
                    data.englishGrade
                  }
                />

                <ReviewItem
                  label="Kiswahili"
                  value={
                    data.kiswahiliGrade
                  }
                />

                <ReviewItem
                  label="Biology"
                  value={
                    data.biologyGrade
                  }
                />

                <ReviewItem
                  label="Chemistry"
                  value={
                    data.chemistryGrade
                  }
                />

                <ReviewItem
                  label="Physics"
                  value={
                    data.physicsGrade
                  }
                />

                <ReviewItem
                  label="Mathematics"
                  value={
                    data.mathematicsGrade
                  }
                />

                <ReviewItem
                  label="Previous Institution"
                  value={
                    data.previousInstitution
                  }
                />

                <ReviewItem
                  label="Highest Qualification"
                  value={
                    data.highestQualification
                  }
                />
              </ReviewSection>

              <ReviewSection title="Course & Intake">
                <ReviewItem
                  label="Course"
                  value={data.course}
                />

                <ReviewItem
                  label="Intake"
                  value={data.intake}
                />

                <ReviewItem
                  label="Sponsor Type"
                  value={
                    data.sponsorType
                  }
                />
              </ReviewSection>

              <ReviewSection title="Sponsor Information">
                <ReviewItem
                  label="Name"
                  value={
                    data.sponsorName
                  }
                />

                <ReviewItem
                  label="Relationship"
                  value={
                    data.sponsorRelationship
                  }
                />

                <ReviewItem
                  label="Mobile"
                  value={
                    data.sponsorMobile
                  }
                />

                <ReviewItem
                  label="Email"
                  value={
                    data.sponsorEmail
                  }
                />
              </ReviewSection>

              <ReviewSection title="Parent / Guardian">
                <ReviewItem
                  label="Name"
                  value={
                    data.guardianName
                  }
                />

                <ReviewItem
                  label="Relationship"
                  value={
                    data.guardianRelationship
                  }
                />

                <ReviewItem
                  label="Mobile"
                  value={
                    data.guardianMobile
                  }
                />

                <ReviewItem
                  label="Email"
                  value={
                    data.guardianEmail
                  }
                />
              </ReviewSection>

              

              {/* DECLARATION */}

              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={
                      data.declaration
                    }
                    onChange={(event) =>
                      updateField(
                        'declaration',
                        event.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 accent-green-600"
                  />

                  <span className="text-sm leading-6 text-slate-700">
                    I declare that the information
                    provided in this application is
                    true, accurate and complete to the
                    best of my knowledge. I understand
                    that providing false information may
                    result in cancellation of my
                    application or admission.
                  </span>
                </label>

                {errors.declaration && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    {errors.declaration}
                  </p>
                )}
              </div>

              <FeeNotice />

              {submitError && (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 p-4"
                  role="alert"
                >
                  <p className="text-sm font-semibold text-red-700">
                    {submitError}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={previousStep}
              disabled={submitting}
              className={`${buttonBase} border border-slate-200 text-slate-600 hover:border-green-600 hover:text-green-600`}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={submitting}
              className={`${buttonBase} bg-green-600 text-white shadow-sm hover:bg-green-700 hover:shadow-lg`}
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className={`${buttonBase} bg-yellow-500 text-slate-900 shadow-sm hover:bg-yellow-400 hover:shadow-lg`}
            >
              {submitting
                ? 'Submitting...'
                : 'Submit Application →'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-7">
      <h3 className="text-2xl font-extrabold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-900">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}

      {error && (
        <p
          className="mt-1 text-xs font-medium text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   GRADE FIELD
========================================================= */

function GradeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-900">
        {label}
      </label>

      <select
        className={inputClass}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >
        <option value="">
          Select grade
        </option>

        {kcseGrades.map(
          (grade) => (
            <option
              key={grade}
              value={grade}
            >
              {grade}
            </option>
          )
        )}
      </select>
    </div>
  );
}

/* =========================================================
   FILE FIELD
========================================================= */

function FileField({
  label,
  required = false,
  file,
  error,
  onChange,
}: {
  label: string;
  required?: boolean;
  file: File | null;
  error?: string;
  onChange: (
    file: File | null
  ) => void;
}) {
  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0] ??
      null;

    if (!selectedFile) {
      onChange(null);
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];

    const maxSize =
      5 * 1024 * 1024;

    if (
      !allowedTypes.includes(
        selectedFile.type
      )
    ) {
      onChange(null);
      event.target.value = '';
      return;
    }

    if (
      selectedFile.size >
      maxSize
    ) {
      onChange(null);
      event.target.value = '';
      return;
    }

    onChange(selectedFile);
  };

  return (
    <div>
      <label className="text-sm font-bold text-slate-900">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className={`mt-2 block w-full rounded-xl border ${
          error
            ? 'border-red-300'
            : 'border-dashed border-slate-300'
        } bg-slate-50 px-4 py-4 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-green-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white`}
      />

      {file && (
        <p className="mt-2 text-xs font-medium text-green-700">
          ✓ {file.name}
        </p>
      )}

      {error && (
        <p
          className="mt-1 text-xs font-medium text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   REVIEW SECTION
========================================================= */

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
        <h4 className="text-sm font-extrabold text-slate-900">
          {title}
        </h4>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   REVIEW ITEM
========================================================= */

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value || 'Not provided'}
      </p>
    </div>
  );
}

/* =========================================================
   CONFIRMATION ITEM
========================================================= */

function ConfirmationItem({
  label,
  value,
  status = false,
}: {
  label: string;
  value: string;
  status?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      {status ? (
        <span
          className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
            value === 'Approved'
              ? 'bg-green-100 text-green-700'
              : value === 'Rejected'
              ? 'bg-red-100 text-red-700'
              : value ===
                'Awaiting Approval'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {value}
        </span>
      ) : (
        <p className="mt-1 break-words text-sm font-semibold text-slate-900">
          {value || 'Not available'}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   APPLICATION FEE NOTICE
========================================================= */

function FeeNotice() {
  return (
    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-xs font-extrabold text-slate-900">
          KSh
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-700">
            Application Fee
          </p>

          <p className="mt-1 text-xl font-extrabold text-slate-900">
            KSh 1,500 payable after submission
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            After your application has been saved,
            you will be required to complete the
            application fee payment using the official
            M-Pesa PayBill details below.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                PayBill
              </p>

              <p className="mt-1 text-lg font-extrabold text-slate-900">
                {MPESA_PAYBILL}
              </p>
            </div>

            <div className="rounded-xl bg-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Account Number
              </p>

              <p className="mt-1 break-all text-sm font-extrabold text-green-700">
                {MPESA_ACCOUNT}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}