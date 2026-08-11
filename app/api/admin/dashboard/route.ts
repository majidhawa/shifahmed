import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    /*
     * =========================================================
     * APPLICATION STATISTICS
     * =========================================================
     */

    const applicationsResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total_applications,

        COUNT(*) FILTER (
          WHERE application_status = 'Pending'
        )::int AS pending_applications,

        COUNT(*) FILTER (
          WHERE application_status = 'Approved'
        )::int AS approved_applications,

        COUNT(*) FILTER (
          WHERE application_status = 'Rejected'
        )::int AS rejected_applications,

        COUNT(*) FILTER (
          WHERE payment_status = 'Paid'
        )::int AS paid_applications,

        COALESCE(
          SUM(application_fee) FILTER (
            WHERE payment_status = 'Paid'
          ),
          0
        )::numeric AS total_amount_received

      FROM applications
    `);

    /*
     * =========================================================
     * ADMISSION STATISTICS
     * =========================================================
     */

    const admissionsResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total_admissions
      FROM admissions
    `);

    /*
     * =========================================================
     * RECENT APPLICATIONS
     * =========================================================
     */

    const recentApplicationsResult = await pool.query(`
      SELECT
        id,
        application_number,
        first_name,
        middle_name,
        surname,
        course,
        intake,
        application_status,
        payment_status,
        application_fee,
        created_at
      FROM applications
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const stats = applicationsResult.rows[0];

    return NextResponse.json({
      success: true,

      statistics: {
        totalApplications:
          Number(stats.total_applications || 0),

        pendingApplications:
          Number(stats.pending_applications || 0),

        approvedApplications:
          Number(stats.approved_applications || 0),

        rejectedApplications:
          Number(stats.rejected_applications || 0),

        paidApplications:
          Number(stats.paid_applications || 0),

        totalAmountReceived:
          Number(stats.total_amount_received || 0),

        totalAdmissions:
          Number(
            admissionsResult.rows[0]?.total_admissions || 0
          ),
      },

      recentApplications:
        recentApplicationsResult.rows.map(
          (application) => ({
            id: application.id,
            applicationNumber:
              application.application_number,

            studentName: [
              application.first_name,
              application.middle_name,
              application.surname,
            ]
              .filter(Boolean)
              .join(' '),

            course: application.course,
            intake: application.intake,

            applicationStatus:
              application.application_status,

            paymentStatus:
              application.payment_status,

            applicationFee:
              Number(application.application_fee || 0),

            createdAt: application.created_at,
          })
        ),
    });

  } catch (error) {
    console.error(
      'ADMIN DASHBOARD ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to load dashboard statistics.',
      },
      {
        status: 500,
      }
    );
  }
}