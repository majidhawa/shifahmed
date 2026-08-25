'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Save,
  UserRound,
  Phone,
  GraduationCap,
  Users,
  ShieldCheck,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

/* =========================================================
   TYPES
========================================================= */

type Application = {
  id: number;
  application_number: string;

  surname: string;
  middle_name: string;
  first_name: string;

  date_of_birth: string;
  gender: string;
  nationality: string;
  country: string;
  id_passport_number: string;
  marital_status: string;

  postal_address: string;
  postal_code: string;
  town: string;
  county: string;
  mobile: string;
  email: string;

  kcse_index: string;
  kcse_year: string;
  kcse_mean_grade: string;
  english_grade: string;
  kiswahili_grade: string;
  biology_grade: string;
  chemistry_grade: string;
  physics_grade: string;
  mathematics_grade: string;
  previous_institution: string;
  highest_qualification: string;

  course: string;
  intake: string;

  sponsor_type: string;
  sponsor_name: string;
  sponsor_relationship: string;
  sponsor_mobile: string;
  sponsor_email: string;

  guardian_name: string;
  guardian_relationship: string;
  guardian_mobile: string;
  guardian_email: string;

  application_fee: number;

  payment_status: string;
  application_status: string;

  rejection_reason: string | null;

  manual_mpesa_code: string | null;
  manual_mpesa_phone: string | null;

  admission_number: string | null;

  declaration: boolean;

  created_at: string;
  updated_at: string;
};

/* =========================================================
   DEFAULT APPLICATION
========================================================= */

const emptyApplication: Application = {
  id: 0,
  application_number: '',

  surname: '',
  middle_name: '',
  first_name: '',

  date_of_birth: '',
  gender: '',
  nationality: '',
  country: '',
  id_passport_number: '',
  marital_status: '',

  postal_address: '',
  postal_code: '',
  town: '',
  county: '',
  mobile: '',
  email: '',

  kcse_index: '',
  kcse_year: '',
  kcse_mean_grade: '',
  english_grade: '',
  kiswahili_grade: '',
  biology_grade: '',
  chemistry_grade: '',
  physics_grade: '',
  mathematics_grade: '',
  previous_institution: '',
  highest_qualification: '',

  course: '',
  intake: '',

  sponsor_type: '',
  sponsor_name: '',
  sponsor_relationship: '',
  sponsor_mobile: '',
  sponsor_email: '',

  guardian_name: '',
  guardian_relationship: '',
  guardian_mobile: '',
  guardian_email: '',

  application_fee: 1500,

  payment_status: '',
  application_status: '',

  rejection_reason: null,

  manual_mpesa_code: null,
  manual_mpesa_phone: null,

  admission_number: null,

  declaration: false,

  created_at: '',
  updated_at: '',
};

/* =========================================================
   HELPERS
========================================================= */

function getDateValue(value: string | null | undefined) {
  if (!value) return '';

  return String(value).split('T')[0];
}

function inputValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(value);
}

/* =========================================================
   FORM INPUT
========================================================= */

function FormInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
      />
    </div>
  );
}

/* =========================================================
   SELECT
========================================================= */

function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  options: string[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
      >
        <option value="">
          Select {label}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =========================================================
   SECTION
========================================================= */

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
            {icon}
          </div>

          <div>
            <h2 className="font-bold text-brand-dark">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-xs text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [application, setApplication] =
    useState<Application>(
      emptyApplication
    );

  const [applicationId, setApplicationId] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  /* =======================================================
     LOAD APPLICATION
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadApplication() {
      try {
        setLoading(true);
        setError('');

        const resolvedParams =
          await params;

        const id =
          resolvedParams.id;

        if (!id) {
          throw new Error(
            'Invalid application ID.'
          );
        }

        if (!cancelled) {
          setApplicationId(id);
        }

        const response =
          await fetch(
            `/api/admin/applications/${id}`,
            {
              method: 'GET',
              cache: 'no-store',
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
              'Unable to load application.'
          );
        }

        if (!cancelled) {
          const app =
            data.application;

          setApplication({
            ...emptyApplication,
            ...app,

            date_of_birth:
              getDateValue(
                app.date_of_birth
              ),

            manual_mpesa_code:
              app.manual_mpesa_code ||
              app.manualMpesaPayment
                ?.code ||
              null,

            manual_mpesa_phone:
              app.manual_mpesa_phone ||
              app.manualMpesaPayment
                ?.phone ||
              null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error(
            'LOAD EDIT APPLICATION ERROR:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load application.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadApplication();

    return () => {
      cancelled = true;
    };
  }, [params]);

  /* =======================================================
     HANDLE INPUT
  ======================================================= */

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const {
      name,
      value,
    } = event.target;

    setApplication((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /* =======================================================
     HANDLE SELECT
  ======================================================= */

  function handleSelectChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const {
      name,
      value,
    } = event.target;

    setApplication((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        /* PERSONAL */
        surname:
          application.surname,

        middle_name:
          application.middle_name,

        first_name:
          application.first_name,

        date_of_birth:
          application.date_of_birth,

        gender:
          application.gender,

        nationality:
          application.nationality,

        country:
          application.country,

        id_passport_number:
          application.id_passport_number,

        marital_status:
          application.marital_status,

        /* CONTACT */
        postal_address:
          application.postal_address,

        postal_code:
          application.postal_code,

        town:
          application.town,

        county:
          application.county,

        mobile:
          application.mobile,

        email:
          application.email,

        /* ACADEMIC */
        kcse_index:
          application.kcse_index,

        kcse_year:
          application.kcse_year,

        kcse_mean_grade:
          application.kcse_mean_grade,

        english_grade:
          application.english_grade,

        kiswahili_grade:
          application.kiswahili_grade,

        biology_grade:
          application.biology_grade,

        chemistry_grade:
          application.chemistry_grade,

        physics_grade:
          application.physics_grade,

        mathematics_grade:
          application.mathematics_grade,

        previous_institution:
          application.previous_institution,

        highest_qualification:
          application.highest_qualification,

        /* COURSE */
        course:
          application.course,

        intake:
          application.intake,

        /* SPONSOR */
        sponsor_type:
          application.sponsor_type,

        sponsor_name:
          application.sponsor_name,

        sponsor_relationship:
          application.sponsor_relationship,

        sponsor_mobile:
          application.sponsor_mobile,

        sponsor_email:
          application.sponsor_email,

        /* GUARDIAN */
        guardian_name:
          application.guardian_name,

        guardian_relationship:
          application.guardian_relationship,

        guardian_mobile:
          application.guardian_mobile,

        guardian_email:
          application.guardian_email,

        /* APPLICATION */
        application_fee:
          application.application_fee,

        admission_number:
          application.admission_number,

        application_status:
          application.application_status,

        rejection_reason:
          application.rejection_reason,
      };

      const response =
        await fetch(
          `/api/admin/applications/${applicationId}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify(
              payload
            ),
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
            'Unable to save application.'
        );
      }

      setApplication((current) => ({
        ...current,
        ...(data.application || {}),
      }));

      setSuccess(
        'Application updated successfully.'
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (err) {
      console.error(
        'SAVE APPLICATION ERROR:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save application.'
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-brand-green" />

          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading application...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error &&
    !application.application_number
  ) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href={
              `/admin/dashboard/applications/${applicationId}`
            }
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green hover:text-brand-dark"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Application
          </Link>

          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />

              <div>
                <h2 className="font-bold text-red-800">
                  Unable to load application
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* =================================================
            TOP BAR
        ================================================== */}

        <div className="mb-8">
          <Link
            href={`/admin/dashboard/applications/${applicationId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Application
          </Link>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
                Admissions
              </p>

              <h1 className="mt-1 text-2xl font-bold text-brand-dark sm:text-3xl">
                Edit Application
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Application{' '}
                <span className="font-bold text-brand-green">
                  {application.application_number}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                {application.application_status ||
                  'Pending'}
              </span>

              <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                {application.payment_status ||
                  'Unpaid'}
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />

              <p className="text-sm font-semibold text-green-700">
                {success}
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />

              <p className="text-sm font-semibold text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* =================================================
              PERSONAL INFORMATION
          ================================================== */}

          <Section
            icon={
              <UserRound className="h-5 w-5" />
            }
            title="Personal Information"
            description="Edit the applicant's personal and identification details."
          >
            <div className="grid gap-5 md:grid-cols-3">

              <FormInput
                label="First Name"
                name="first_name"
                value={inputValue(
                  application.first_name
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Middle Name"
                name="middle_name"
                value={inputValue(
                  application.middle_name
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Surname"
                name="surname"
                value={inputValue(
                  application.surname
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={inputValue(
                  application.date_of_birth
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormSelect
                label="Gender"
                name="gender"
                value={inputValue(
                  application.gender
                )}
                onChange={
                  handleSelectChange
                }
                options={[
                  'Male',
                  'Female',
                  'Other',
                ]}
              />

              <FormInput
                label="Nationality"
                name="nationality"
                value={inputValue(
                  application.nationality
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Country"
                name="country"
                value={inputValue(
                  application.country
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="ID / Passport Number"
                name="id_passport_number"
                value={inputValue(
                  application.id_passport_number
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormSelect
                label="Marital Status"
                name="marital_status"
                value={inputValue(
                  application.marital_status
                )}
                onChange={
                  handleSelectChange
                }
                options={[
                  'Single',
                  'Married',
                  'Divorced',
                  'Widowed',
                ]}
              />

            </div>
          </Section>

          {/* =================================================
              CONTACT INFORMATION
          ================================================== */}

          <Section
            icon={
              <Phone className="h-5 w-5" />
            }
            title="Contact Information"
            description="Update the applicant's contact and address details."
          >
            <div className="grid gap-5 md:grid-cols-2">

              <FormInput
                label="Mobile Number"
                name="mobile"
                value={inputValue(
                  application.mobile
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Email Address"
                name="email"
                type="email"
                value={inputValue(
                  application.email
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Postal Address"
                name="postal_address"
                value={inputValue(
                  application.postal_address
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Postal Code"
                name="postal_code"
                value={inputValue(
                  application.postal_code
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Town"
                name="town"
                value={inputValue(
                  application.town
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="County"
                name="county"
                value={inputValue(
                  application.county
                )}
                onChange={
                  handleInputChange
                }
              />

            </div>
          </Section>

          {/* =================================================
              ACADEMIC INFORMATION
          ================================================== */}

          <Section
            icon={
              <GraduationCap className="h-5 w-5" />
            }
            title="Academic Information"
            description="Update KCSE results and previous educational information."
          >
            <div className="grid gap-5 md:grid-cols-3">

              <FormInput
                label="KCSE Index"
                name="kcse_index"
                value={inputValue(
                  application.kcse_index
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="KCSE Year"
                name="kcse_year"
                value={inputValue(
                  application.kcse_year
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="KCSE Mean Grade"
                name="kcse_mean_grade"
                value={inputValue(
                  application.kcse_mean_grade
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="English Grade"
                name="english_grade"
                value={inputValue(
                  application.english_grade
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Kiswahili Grade"
                name="kiswahili_grade"
                value={inputValue(
                  application.kiswahili_grade
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Biology Grade"
                name="biology_grade"
                value={inputValue(
                  application.biology_grade
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Chemistry Grade"
                name="chemistry_grade"
                value={inputValue(
                  application.chemistry_grade
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Physics Grade"
                name="physics_grade"
                value={inputValue(
                  application.physics_grade
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Mathematics Grade"
                name="mathematics_grade"
                value={inputValue(
                  application.mathematics_grade
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Previous Institution"
                name="previous_institution"
                value={inputValue(
                  application.previous_institution
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Highest Qualification"
                name="highest_qualification"
                value={inputValue(
                  application.highest_qualification
                )}
                onChange={
                  handleInputChange
                }
              />

            </div>
          </Section>

          {/* =================================================
              COURSE & INTAKE
          ================================================== */}

          <Section
            icon={
              <GraduationCap className="h-5 w-5" />
            }
            title="Course & Intake"
            description="Change the programme or intake attached to the application."
          >
            <div className="grid gap-5 md:grid-cols-2">

              <FormSelect
                label="Course"
                name="course"
                value={inputValue(
                  application.course
                )}
                onChange={
                  handleSelectChange
                }
                options={[
                  'EMT',
                  'Diploma in Paramedicine',
                  'Safe Phlebotomy',
                  'German Language',
                  'Caregiving Level 4',
                  'Dialysis Technology',
                ]}
              />

              <FormSelect
                label="Intake"
                name="intake"
                value={inputValue(
                  application.intake
                )}
                onChange={
                  handleSelectChange
                }
                options={[
                  'September 2026',
                  'January 2027',
                  'March 2027',
                  'May 2027',
                ]}
              />

            </div>
          </Section>

          {/* =================================================
              SPONSOR
          ================================================== */}

          <Section
            icon={
              <Users className="h-5 w-5" />
            }
            title="Sponsor Information"
            description="Update the applicant's sponsor information."
          >
            <div className="grid gap-5 md:grid-cols-2">

              <FormSelect
                label="Sponsor Type"
                name="sponsor_type"
                value={inputValue(
                  application.sponsor_type
                )}
                onChange={
                  handleSelectChange
                }
                options={[
                  'Self',
                  'Parent',
                  'Guardian',
                  'Employer',
                  'Organization',
                  'Other',
                ]}
              />

              <FormInput
                label="Sponsor Name"
                name="sponsor_name"
                value={inputValue(
                  application.sponsor_name
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Relationship"
                name="sponsor_relationship"
                value={inputValue(
                  application.sponsor_relationship
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Sponsor Mobile"
                name="sponsor_mobile"
                value={inputValue(
                  application.sponsor_mobile
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Sponsor Email"
                name="sponsor_email"
                type="email"
                value={inputValue(
                  application.sponsor_email
                )}
                onChange={
                  handleInputChange
                }
              />

            </div>
          </Section>

          {/* =================================================
              GUARDIAN
          ================================================== */}

          <Section
            icon={
              <Users className="h-5 w-5" />
            }
            title="Guardian Information"
            description="Update the applicant's guardian or emergency contact."
          >
            <div className="grid gap-5 md:grid-cols-2">

              <FormInput
                label="Guardian Name"
                name="guardian_name"
                value={inputValue(
                  application.guardian_name
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Relationship"
                name="guardian_relationship"
                value={inputValue(
                  application.guardian_relationship
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Guardian Mobile"
                name="guardian_mobile"
                value={inputValue(
                  application.guardian_mobile
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Guardian Email"
                name="guardian_email"
                type="email"
                value={inputValue(
                  application.guardian_email
                )}
                onChange={
                  handleInputChange
                }
              />

            </div>
          </Section>

          {/* =================================================
              APPLICATION ADMINISTRATION
          ================================================== */}

          <Section
            icon={
              <ShieldCheck className="h-5 w-5" />
            }
            title="Application Administration"
            description="Update administrative information without changing the submitted documents."
          >
            <div className="grid gap-5 md:grid-cols-2">

              <FormSelect
                label="Application Status"
                name="application_status"
                value={inputValue(
                  application.application_status
                )}
                onChange={
                  handleSelectChange
                }
                options={[
                  'Pending',
                  'Approved',
                  'Rejected',
                ]}
              />

              <FormInput
                label="Admission Number"
                name="admission_number"
                value={inputValue(
                  application.admission_number
                )}
                onChange={
                  handleInputChange
                }
              />

              <FormInput
                label="Application Fee"
                name="application_fee"
                type="number"
                value={inputValue(
                  application.application_fee
                )}
                onChange={
                  handleInputChange
                }
              />

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Payment Status
                </label>

                <div className="flex min-h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-700">
                  <CreditCard className="mr-2 h-4 w-4 text-brand-green" />

                  {application.payment_status ||
                    'Unpaid'}

                  <span className="ml-2 text-xs font-normal text-slate-400">
                    Managed from the application
                    payment controls
                  </span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="rejection_reason"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Rejection Reason
                </label>

                <textarea
                  id="rejection_reason"
                  name="rejection_reason"
                  value={inputValue(
                    application.rejection_reason
                  )}
                  onChange={(
                    event
                  ) =>
                    setApplication(
                      (current) => ({
                        ...current,
                        rejection_reason:
                          event.target
                            .value,
                      })
                    )
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-green focus:bg-white focus:ring-4 focus:ring-brand-green/10"
                  placeholder="Enter rejection reason if applicable..."
                />
              </div>

            </div>
          </Section>

          {/* =================================================
              PAYMENT INFORMATION
          ================================================== */}

          <Section
            icon={
              <CreditCard className="h-5 w-5" />
            }
            title="Payment Information"
            description="M-Pesa payment information is displayed for reference."
          >
            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  M-Pesa Transaction Code
                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-700">
                  {application.manual_mpesa_code ||
                    'Not submitted'}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  M-Pesa Phone
                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-700">
                  {application.manual_mpesa_phone ||
                    'Not submitted'}
                </div>
              </div>

            </div>
          </Section>

          {/* =================================================
              ACTION BAR
          ================================================== */}

          <div className="sticky bottom-4 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <Link
                href={`/admin/dashboard/applications/${applicationId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
}