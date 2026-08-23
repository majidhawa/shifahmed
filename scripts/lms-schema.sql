/* =========================================================
   SHIFAH MEDICAL TRAINING COLLEGE
   LMS DATABASE FOUNDATION
   PostgreSQL
========================================================= */


/* =========================================================
   1. LMS PROGRAMS
========================================================= */

CREATE TABLE IF NOT EXISTS lms_programs (
    id SERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL UNIQUE,

    code VARCHAR(50) UNIQUE,

    description TEXT,

    duration VARCHAR(100),

    level VARCHAR(100),

    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


/* =========================================================
   2. ACADEMIC TERMS
========================================================= */

CREATE TABLE IF NOT EXISTS lms_terms (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    academic_year VARCHAR(20) NOT NULL,

    term_number INTEGER NOT NULL
        CHECK (term_number >= 1),

    start_date DATE,

    end_date DATE,

    status VARCHAR(30) NOT NULL DEFAULT 'upcoming'
        CHECK (
            status IN (
                'upcoming',
                'active',
                'completed'
            )
        ),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (
        academic_year,
        term_number
    )
);


/* =========================================================
   3. LMS UNITS / SUBJECTS
========================================================= */

CREATE TABLE IF NOT EXISTS lms_units (
    id SERIAL PRIMARY KEY,

    program_id INTEGER NOT NULL
        REFERENCES lms_programs(id)
        ON DELETE CASCADE,

    code VARCHAR(50),

    name VARCHAR(200) NOT NULL,

    description TEXT,

    credit_hours INTEGER DEFAULT 0
        CHECK (credit_hours >= 0),

    year_of_study INTEGER DEFAULT 1
        CHECK (year_of_study >= 1),

    term_number INTEGER DEFAULT 1
        CHECK (term_number >= 1),

    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (
        program_id,
        name
    )
);


/* =========================================================
   4. STUDENT LMS ENROLMENTS
========================================================= */

CREATE TABLE IF NOT EXISTS lms_enrollments (
    id SERIAL PRIMARY KEY,

    application_id INTEGER NOT NULL
        REFERENCES applications(id)
        ON DELETE CASCADE,

    program_id INTEGER NOT NULL
        REFERENCES lms_programs(id)
        ON DELETE RESTRICT,

    term_id INTEGER
        REFERENCES lms_terms(id)
        ON DELETE SET NULL,

    student_number VARCHAR(100),

    year_of_study INTEGER DEFAULT 1
        CHECK (year_of_study >= 1),

    enrollment_status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (
            enrollment_status IN (
                'active',
                'suspended',
                'completed',
                'withdrawn'
            )
        ),

    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    completed_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (
        application_id,
        program_id,
        term_id
    )
);


/* =========================================================
   5. STUDENT UNIT REGISTRATION
========================================================= */

CREATE TABLE IF NOT EXISTS lms_unit_enrollments (
    id SERIAL PRIMARY KEY,

    enrollment_id INTEGER NOT NULL
        REFERENCES lms_enrollments(id)
        ON DELETE CASCADE,

    unit_id INTEGER NOT NULL
        REFERENCES lms_units(id)
        ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'completed',
                'dropped'
            )
        ),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (
        enrollment_id,
        unit_id
    )
);


/* =========================================================
   6. INDEXES
========================================================= */

CREATE INDEX IF NOT EXISTS idx_lms_units_program
ON lms_units(program_id);


CREATE INDEX IF NOT EXISTS idx_lms_enrollments_application
ON lms_enrollments(application_id);


CREATE INDEX IF NOT EXISTS idx_lms_enrollments_program
ON lms_enrollments(program_id);


CREATE INDEX IF NOT EXISTS idx_lms_enrollments_term
ON lms_enrollments(term_id);


CREATE INDEX IF NOT EXISTS idx_lms_unit_enrollments_enrollment
ON lms_unit_enrollments(enrollment_id);


CREATE INDEX IF NOT EXISTS idx_lms_unit_enrollments_unit
ON lms_unit_enrollments(unit_id);


/* =========================================================
   7. INITIAL PROGRAMS
========================================================= */

INSERT INTO lms_programs
    (name, code, description, duration, level)
VALUES
(
    'Emergency Medical Technology (EMT)',
    'EMT',
    'Emergency Medical Technology training programme.',
    '1 Year',
    'Level 5'
),
(
    'Diploma in Paramedicine',
    'PARAMEDIC',
    'Diploma programme in Paramedicine.',
    '2 Years',
    'Level 6'
),
(
    'Safe Phlebotomy',
    'PHLEB',
    'Safe blood collection and phlebotomy training.',
    '8 Weeks',
    'Proficiency'
),
(
    'German Language',
    'GERMAN',
    'German language training for healthcare and general communication.',
    '2–3 Months',
    'A1–B2'
),
(
    'Caregiving Level 4',
    'CARE4',
    'Certificate-level caregiving training.',
    '6 Months',
    'Level 4'
),
(
    'Dialysis Technology',
    'DIALYSIS',
    'Dialysis technology and renal care training.',
    '4 Months',
    'Proficiency'
)
ON CONFLICT (name) DO NOTHING;


/* =========================================================
   8. INITIAL ACADEMIC TERMS
========================================================= */

INSERT INTO lms_terms
    (name, academic_year, term_number, status)
VALUES
(
    'Term 1',
    '2026',
    1,
    'active'
),
(
    'Term 2',
    '2026',
    2,
    'upcoming'
),
(
    'Term 3',
    '2026',
    3,
    'upcoming'
)
ON CONFLICT (
    academic_year,
    term_number
) DO NOTHING;