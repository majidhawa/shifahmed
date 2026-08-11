
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import pool from '@/lib/db';
import {
  requireAdmin,
  createAdminSession,
} from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================================================
   GET SETTINGS
   GET /api/admin/settings
========================================================= */

export async function GET() {
  try {
    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    const admin = requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       GET ADMIN PROFILE
    ===================================================== */

    const adminResult = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        is_active,
        last_login
      FROM admin_users
      WHERE id = $1
      LIMIT 1
      `,
      [admin.id]
    );

    if (adminResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Administrator account not found.',
        },
        { status: 404 }
      );
    }

    /* =====================================================
       GET SYSTEM SETTINGS
    ===================================================== */

    const settingsResult = await pool.query(
      `
      SELECT
        id,
        college_name,
        slogan,
        phone,
        email,
        address,
        website,
        updated_at
      FROM admin_settings
      WHERE id = 1
      LIMIT 1
      `
    );

    let settings = settingsResult.rows[0];

    /* =====================================================
       CREATE DEFAULT SETTINGS IF MISSING
    ===================================================== */

    if (!settings) {
      const insertResult = await pool.query(
        `
        INSERT INTO admin_settings (
          id,
          college_name,
          slogan,
          phone,
          email,
          address,
          website
        )
        VALUES (
          1,
          'SHIFAH MEDICAL TRAINING COLLEGE',
          'HEALTH THROUGH INNOVATION AND RESEARCH',
          '',
          '',
          'Kitale, Kenya',
          ''
        )
        RETURNING
          id,
          college_name,
          slogan,
          phone,
          email,
          address,
          website,
          updated_at
        `
      );

      settings = insertResult.rows[0];
    }

    /* =====================================================
       RETURN
    ===================================================== */

    return NextResponse.json({
      success: true,

      admin: {
        id: adminResult.rows[0].id,
        name: adminResult.rows[0].name,
        email: adminResult.rows[0].email,
        role: adminResult.rows[0].role,
        isActive: adminResult.rows[0].is_active,
        lastLogin: adminResult.rows[0].last_login,
      },

      settings: {
        id: settings.id,
        collegeName: settings.college_name,
        slogan: settings.slogan,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        website: settings.website,
        updatedAt: settings.updated_at,
      },
    });
  } catch (error) {
    console.error('GET admin settings error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load settings.',
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT SETTINGS
   PUT /api/admin/settings
========================================================= */

export async function PUT(request: Request) {
  try {
    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    const admin = requireAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       READ BODY
    ===================================================== */

    const body = await request.json();

    const action =
      typeof body.action === 'string'
        ? body.action.trim()
        : '';

    /* =====================================================
       PROFILE UPDATE
    ===================================================== */

    if (action === 'profile') {
      const name =
        typeof body.name === 'string'
          ? body.name.trim()
          : '';

      const email =
        typeof body.email === 'string'
          ? body.email.trim().toLowerCase()
          : '';

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message: 'Administrator name is required.',
          },
          { status: 400 }
        );
      }

      if (!email) {
        return NextResponse.json(
          {
            success: false,
            message: 'Administrator email is required.',
          },
          { status: 400 }
        );
      }

      /* =================================================
         CHECK EMAIL
      ================================================= */

      const existingAdmin = await pool.query(
        `
        SELECT id
        FROM admin_users
        WHERE LOWER(email) = $1
          AND id <> $2
        LIMIT 1
        `,
        [email, admin.id]
      );

      if (existingAdmin.rows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              'That email address is already being used by another administrator.',
          },
          { status: 409 }
        );
      }

      /* =================================================
         UPDATE ADMIN
      ================================================= */

      const result = await pool.query(
        `
        UPDATE admin_users
        SET
          name = $1,
          email = $2
        WHERE id = $3
        RETURNING
          id,
          name,
          email,
          role
        `,
        [name, email, admin.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Administrator account not found.',
          },
          { status: 404 }
        );
      }

      const updatedAdmin = result.rows[0];

      /* =================================================
         REFRESH SESSION
      ================================================= */

      createAdminSession({
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        rememberMe: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Administrator profile updated successfully.',
        admin: updatedAdmin,
      });
    }

    /* =====================================================
       CHANGE PASSWORD
    ===================================================== */

    if (action === 'password') {
      const currentPassword =
        typeof body.currentPassword === 'string'
          ? body.currentPassword
          : '';

      const newPassword =
        typeof body.newPassword === 'string'
          ? body.newPassword
          : '';

      const confirmPassword =
        typeof body.confirmPassword === 'string'
          ? body.confirmPassword
          : '';

      if (!currentPassword) {
        return NextResponse.json(
          {
            success: false,
            message: 'Current password is required.',
          },
          { status: 400 }
        );
      }

      if (!newPassword) {
        return NextResponse.json(
          {
            success: false,
            message: 'New password is required.',
          },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          {
            success: false,
            message:
              'New password must contain at least 8 characters.',
          },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          {
            success: false,
            message: 'New passwords do not match.',
          },
          { status: 400 }
        );
      }

      /* =================================================
         GET CURRENT PASSWORD
      ================================================= */

      const adminResult = await pool.query(
        `
        SELECT
          id,
          password_hash
        FROM admin_users
        WHERE id = $1
        LIMIT 1
        `,
        [admin.id]
      );

      if (adminResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Administrator account not found.',
          },
          { status: 404 }
        );
      }

      const currentHash =
        adminResult.rows[0].password_hash;

      /* =================================================
         VERIFY CURRENT PASSWORD
      ================================================= */

      const currentPasswordMatches =
        await bcrypt.compare(
          currentPassword,
          currentHash
        );

      if (!currentPasswordMatches) {
        return NextResponse.json(
          {
            success: false,
            message: 'Current password is incorrect.',
          },
          { status: 401 }
        );
      }

      /* =================================================
         PREVENT SAME PASSWORD
      ================================================= */

      const samePassword =
        await bcrypt.compare(
          newPassword,
          currentHash
        );

      if (samePassword) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Your new password must be different from your current password.',
          },
          { status: 400 }
        );
      }

      /* =================================================
         HASH NEW PASSWORD
      ================================================= */

      const newPasswordHash =
        await bcrypt.hash(newPassword, 12);

      /* =================================================
         UPDATE PASSWORD
      ================================================= */

      await pool.query(
        `
        UPDATE admin_users
        SET password_hash = $1
        WHERE id = $2
        `,
        [newPasswordHash, admin.id]
      );

      return NextResponse.json({
        success: true,
        message:
          'Password changed successfully.',
      });
    }

    /* =====================================================
       SYSTEM SETTINGS
    ===================================================== */

    if (action === 'system') {
      const collegeName =
        typeof body.collegeName === 'string'
          ? body.collegeName.trim()
          : '';

      const slogan =
        typeof body.slogan === 'string'
          ? body.slogan.trim()
          : '';

      const phone =
        typeof body.phone === 'string'
          ? body.phone.trim()
          : '';

      const email =
        typeof body.email === 'string'
          ? body.email.trim()
          : '';

      const address =
        typeof body.address === 'string'
          ? body.address.trim()
          : '';

      const website =
        typeof body.website === 'string'
          ? body.website.trim()
          : '';

      if (!collegeName) {
        return NextResponse.json(
          {
            success: false,
            message: 'College name is required.',
          },
          { status: 400 }
        );
      }

      if (!slogan) {
        return NextResponse.json(
          {
            success: false,
            message: 'College slogan is required.',
          },
          { status: 400 }
        );
      }

      const result = await pool.query(
        `
        INSERT INTO admin_settings (
          id,
          college_name,
          slogan,
          phone,
          email,
          address,
          website,
          updated_at
        )
        VALUES (
          1,
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (id)
        DO UPDATE SET
          college_name = EXCLUDED.college_name,
          slogan = EXCLUDED.slogan,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          address = EXCLUDED.address,
          website = EXCLUDED.website,
          updated_at = CURRENT_TIMESTAMP
        RETURNING
          id,
          college_name,
          slogan,
          phone,
          email,
          address,
          website,
          updated_at
        `,
        [
          collegeName,
          slogan,
          phone,
          email,
          address,
          website,
        ]
      );

      const settings = result.rows[0];

      return NextResponse.json({
        success: true,
        message:
          'System settings updated successfully.',

        settings: {
          id: settings.id,
          collegeName: settings.college_name,
          slogan: settings.slogan,
          phone: settings.phone,
          email: settings.email,
          address: settings.address,
          website: settings.website,
          updatedAt: settings.updated_at,
        },
      });
    }

    /* =====================================================
       INVALID ACTION
    ===================================================== */

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid settings action.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('PUT admin settings error:', error);

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to save settings. Please try again.',
      },
      { status: 500 }
    );
  }
}

