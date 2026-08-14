import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';

/* =========================================================
   CONFIGURATION
========================================================= */

const ALLOWED_COURSES = [
  'EMT',
  'Diploma in Paramedicine',
  'Safe Phlebotomy',
  'German Language',
  'Caregiving Level 4',
  'Dialysis Technology',
];

const ALLOWED_INTAKES = [
  'September 2026 Intake',
  'January 2027 Intake',
  'March 2027 Intake',
  'May 2027 Intake',
];

/* =========================================================
   HELPERS
========================================================= */

function clean(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function generateApplicationNumber(): string {
  const year = new Date().getFullYear();

  const randomPart = crypto
    .randomBytes(4)
    .toString('hex')
    .toUpperCase();

  return `SMTC/${year}/${randomPart}`;
}

/* =========================================================
   POST APPLICATION
========================================================= */

export async function POST(request: Request) {
  try {
    /* =====================================================
       READ FORM DATA
    ===================================================== */

    const formData = await request.formData();

    /* =====================================================
       PERSONAL
    ===================================================== */

    const surname = clean(formData.get('surname'));

    const middleName = clean(
      formData.get('middleName')
    );

    const firstName = clean(
      formData.get('firstName')
    );

    const dateOfBirth = clean(
      formData.get('dateOfBirth')
    );

    const gender = clean(
      formData.get('gender')
    );

    const nationality = clean(
      formData.get('nationality')
    );

    const country = clean(
      formData.get('country')
    );

    const idPassportNumber = clean(
      formData.get('idPassportNumber')
    );

    const maritalStatus = clean(
      formData.get('maritalStatus')
    );

    /* =====================================================
       CONTACT
    ===================================================== */

    const postalAddress = clean(
      formData.get('postalAddress')
    );

    const postalCode = clean(
      formData.get('postalCode')
    );

    const town = clean(
      formData.get('town')
    );

    const county = clean(
      formData.get('county')
    );

    const mobile = clean(
      formData.get('mobile')
    );

    const email = clean(
      formData.get('email')
    );

    /* =====================================================
       ACADEMIC
    ===================================================== */

    const kcseIndex = clean(
      formData.get('kcseIndex')
    );

    const kcseYear = clean(
      formData.get('kcseYear')
    );

    const kcseMeanGrade = clean(
      formData.get('kcseMeanGrade')
    );

    const englishGrade = clean(
      formData.get('englishGrade')
    );

    const kiswahiliGrade = clean(
      formData.get('kiswahiliGrade')
    );

    const biologyGrade = clean(
      formData.get('biologyGrade')
    );

    const chemistryGrade = clean(
      formData.get('chemistryGrade')
    );

    const physicsGrade = clean(
      formData.get('physicsGrade')
    );

    const mathematicsGrade = clean(
      formData.get('mathematicsGrade')
    );

    const previousInstitution = clean(
      formData.get('previousInstitution')
    );

    const highestQualification = clean(
      formData.get('highestQualification')
    );

    /* =====================================================
       COURSE
    ===================================================== */

    const course = clean(
      formData.get('course')
    );

    const intake = clean(
      formData.get('intake')
    );

    /* =====================================================
       SPONSOR
    ===================================================== */

    const sponsorType = clean(
      formData.get('sponsorType')
    );

    const sponsorName = clean(
      formData.get('sponsorName')
    );

    const sponsorRelationship = clean(
      formData.get('sponsorRelationship')
    );

    const sponsorMobile = clean(
      formData.get('sponsorMobile')
    );

    const sponsorEmail = clean(
      formData.get('sponsorEmail')
    );

    /* =====================================================
       GUARDIAN
    ===================================================== */

    const guardianName = clean(
      formData.get('guardianName')
    );

    const guardianRelationship = clean(
      formData.get('guardianRelationship')
    );

    const guardianMobile = clean(
      formData.get('guardianMobile')
    );

    const guardianEmail = clean(
      formData.get('guardianEmail')
    );

    /* =====================================================
       DECLARATION
    ===================================================== */

    const declaration =
      clean(formData.get('declaration')) === 'true';

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !surname ||
      !firstName ||
      !dateOfBirth ||
      !gender ||
      !idPassportNumber
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please provide all required personal information.',
        },
        { status: 400 }
      );
    }

    if (
      !mobile ||
      !email ||
      !county
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please provide all required contact information.',
        },
        { status: 400 }
      );
    }

    if (
      !kcseIndex ||
      !kcseYear ||
      !kcseMeanGrade
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please provide the required KCSE information.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       COURSE VALIDATION
    ===================================================== */

    if (!ALLOWED_COURSES.includes(course)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The selected course is not valid.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       INTAKE VALIDATION
    ===================================================== */

    if (!ALLOWED_INTAKES.includes(intake)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'The selected intake is not valid.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       SPONSOR VALIDATION
    ===================================================== */

    if (!sponsorType) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please select the sponsor type.',
        },
        { status: 400 }
      );
    }

    if (
      sponsorType !== 'Self' &&
      !sponsorName
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Sponsor name is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       GUARDIAN VALIDATION
    ===================================================== */

    if (
      !guardianName ||
      !guardianMobile
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Parent/Guardian name and mobile number are required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       DECLARATION VALIDATION
    ===================================================== */

    if (!declaration) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You must accept the declaration before submitting.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please provide a valid email address.',
        },
        { status: 400 }
      );
    }

    if (
      sponsorEmail &&
      !emailRegex.test(sponsorEmail)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please provide a valid sponsor email address.',
        },
        { status: 400 }
      );
    }

    if (
      guardianEmail &&
      !emailRegex.test(guardianEmail)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please provide a valid guardian email address.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       APPLICATION NUMBER
    ===================================================== */

    const applicationNumber =
      generateApplicationNumber();

    /* =====================================================
       DOCUMENT UPLOADS TEMPORARILY DISABLED
       
       We are intentionally NOT saving:
       
       - ID document
       - KCSE certificate
       - Passport photo
       
       These will be connected to Supabase Storage later.
       
       The existing database columns remain untouched.
    ===================================================== */

    const idDocument = null;

    const kcseCertificate = null;

    const passportPhoto = null;

    /* =====================================================
       DATABASE INSERT
    ===================================================== */

    const query = `
      INSERT INTO applications (
        application_number,

        surname,
        middle_name,
        first_name,
        date_of_birth,
        gender,
        nationality,
        country,
        id_passport_number,
        marital_status,

        postal_address,
        postal_code,
        town,
        county,
        mobile,
        email,

        kcse_index,
        kcse_year,
        kcse_mean_grade,
        english_grade,
        kiswahili_grade,
        biology_grade,
        chemistry_grade,
        physics_grade,
        mathematics_grade,
        previous_institution,
        highest_qualification,

        course,
        intake,

        sponsor_type,
        sponsor_name,
        sponsor_relationship,
        sponsor_mobile,
        sponsor_email,

        guardian_name,
        guardian_relationship,
        guardian_mobile,
        guardian_email,

        id_document,
        kcse_certificate,
        passport_photo,

        declaration,
        application_fee,
        payment_status,
        application_status
      )

      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,

        $11, $12, $13, $14, $15, $16,

        $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26, $27,

        $28, $29,

        $30, $31, $32, $33, $34,

        $35, $36, $37, $38,

        $39, $40, $41,

        $42, $43, $44, $45
      )

      RETURNING
        id,
        application_number,
        course,
        intake,
        application_fee,
        payment_status,
        application_status,
        created_at
    `;

    const values = [
      /* ===================================================
         PERSONAL
      =================================================== */

      applicationNumber,
      surname,
      middleName,
      firstName,
      dateOfBirth,
      gender,
      nationality,
      country,
      idPassportNumber,
      maritalStatus,

      /* ===================================================
         CONTACT
      =================================================== */

      postalAddress,
      postalCode,
      town,
      county,
      mobile,
      email,

      /* ===================================================
         ACADEMIC
      =================================================== */

      kcseIndex,
      kcseYear,
      kcseMeanGrade,
      englishGrade,
      kiswahiliGrade,
      biologyGrade,
      chemistryGrade,
      physicsGrade,
      mathematicsGrade,
      previousInstitution,
      highestQualification,

      /* ===================================================
         COURSE
      =================================================== */

      course,
      intake,

      /* ===================================================
         SPONSOR
      =================================================== */

      sponsorType,
      sponsorName,
      sponsorRelationship,
      sponsorMobile,
      sponsorEmail,

      /* ===================================================
         GUARDIAN
      =================================================== */

      guardianName,
      guardianRelationship,
      guardianMobile,
      guardianEmail,

      /* ===================================================
         DOCUMENTS
         
         Temporarily NULL.
      =================================================== */

      idDocument,
      kcseCertificate,
      passportPhoto,

      /* ===================================================
         APPLICATION STATUS
      =================================================== */

      true,
      1500,
      'Pending',
      'Pending',
    ];

    console.log(
      'Inserting application into PostgreSQL:',
      applicationNumber
    );

    const result = await pool.query(
      query,
      values
    );

    const savedApplication =
      result.rows[0];

    console.log(
      'Application successfully saved:',
      savedApplication
    );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          'Application submitted successfully.',

        application: {
          id:
            savedApplication.id,

          application_number:
            savedApplication.application_number,

          course:
            savedApplication.course,

          intake:
            savedApplication.intake,

          application_fee:
            savedApplication.application_fee,

          payment_status:
            savedApplication.payment_status,

          application_status:
            savedApplication.application_status,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(
      'APPLICATION SUBMISSION ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while submitting your application.',
      },
      { status: 500 }
    );
  }
}