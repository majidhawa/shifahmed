
const { loadEnvConfig } = require('@next/env');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const readline = require('readline');

/* =========================================================
   LOAD NEXT.JS ENVIRONMENT VARIABLES
========================================================= */

const projectDir = process.cwd();

loadEnvConfig(projectDir);

/* =========================================================
   CHECK DATABASE CONFIGURATION
========================================================= */

if (!process.env.DATABASE_URL) {
  console.error('');
  console.error('ERROR: DATABASE_URL was not found.');
  console.error('');
  console.error('Make sure your .env.local file contains:');
  console.error('');
  console.error('DATABASE_URL=postgresql://...');
  console.error('');
  process.exit(1);
}

/* =========================================================
   DATABASE CONNECTION
========================================================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

/* =========================================================
   TERMINAL INPUT
========================================================= */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

/* =========================================================
   CREATE ADMIN
========================================================= */

async function createAdmin() {
  try {
    console.log('');
    console.log('==============================================');
    console.log('   SHIFAH MEDICAL TRAINING COLLEGE');
    console.log('   ADMIN ACCOUNT SETUP');
    console.log('==============================================');
    console.log('');

    const name = await ask('Administrator name: ');
    const email = await ask('Administrator email: ');
    const password = await ask('Administrator password: ');

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!name.trim()) {
      console.error('\nAdministrator name is required.');
      return;
    }

    if (!email.trim()) {
      console.error('\nAdministrator email is required.');
      return;
    }

    if (!password) {
      console.error('\nAdministrator password is required.');
      return;
    }

    if (password.length < 8) {
      console.error(
        '\nPassword must contain at least 8 characters.'
      );
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    /* =====================================================
       CHECK IF ADMIN ALREADY EXISTS
    ===================================================== */

    const existing = await pool.query(
      `
      SELECT id, email
      FROM admin_users
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      console.error('');
      console.error(
        `An administrator with the email "${normalizedEmail}" already exists.`
      );
      return;
    }

    /* =====================================================
       HASH PASSWORD
    ===================================================== */

    console.log('');
    console.log('Creating secure password hash...');

    const passwordHash = await bcrypt.hash(password, 12);

    /* =====================================================
       INSERT ADMIN
    ===================================================== */

    await pool.query(
      `
      INSERT INTO admin_users
        (
          name,
          email,
          password_hash,
          role,
          is_active
        )
      VALUES
        ($1, $2, $3, $4, $5)
      `,
      [
        name.trim(),
        normalizedEmail,
        passwordHash,
        'admin',
        true,
      ]
    );

    /* =====================================================
       SUCCESS
    ===================================================== */

    console.log('');
    console.log('==============================================');
    console.log('   ADMIN ACCOUNT CREATED SUCCESSFULLY');
    console.log('==============================================');
    console.log('');
    console.log(`Name:  ${name.trim()}`);
    console.log(`Email: ${normalizedEmail}`);
    console.log('Password: ********');
    console.log('');
    console.log(
      'You can now use these credentials on /admin/login.'
    );
    console.log('');
  } catch (error) {
    console.error('');
    console.error('Unable to create administrator.');

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
  } finally {
    await pool.end();
    rl.close();
  }
}

/* =========================================================
   RUN
========================================================= */

createAdmin();

