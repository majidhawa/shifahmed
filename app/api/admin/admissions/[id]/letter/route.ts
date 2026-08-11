
import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    /* =====================================================
       ADMIN AUTHENTICATION
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
       GET ADMISSION ID
    ===================================================== */

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admission ID is required.',
        },
        { status: 400 }
      );
    }

    const admissionId = Number(id);

    if (
      !Number.isInteger(admissionId) ||
      admissionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid admission ID.',
        },
        { status: 400 }
      );
    }

    console.log(
      '===================================='
    );

    console.log(
      'GENERATING SMTC ADMISSION LETTER'
    );

    console.log(
      'Admission ID:',
      admissionId
    );

    console.log(
      '===================================='
    );

    /* =====================================================
       GET ADMISSION + APPLICATION
    ===================================================== */

    const result = await pool.query(
      `
        SELECT
          a.id AS admission_id,
          a.application_id,
          a.admission_number,
          a.application_number,
          a.student_name,
          a.course,
          a.intake,
          a.admission_date,
          a.admission_status,

          app.id,
          app.application_number AS app_application_number,
          app.surname,
          app.middle_name,
          app.first_name,
          app.date_of_birth,
          app.gender,
          app.nationality,
          app.country,
          app.id_passport_number,

          app.postal_address,
          app.postal_code,
          app.town,
          app.county,
          app.mobile,
          app.email,

          app.kcse_index,
          app.kcse_year,
          app.kcse_mean_grade,

          app.application_fee,
          app.payment_status

        FROM admissions a

        INNER JOIN applications app
          ON app.id = a.application_id

        WHERE a.id = $1

        LIMIT 1
      `,
      [admissionId]
    );

    /* =====================================================
       ADMISSION NOT FOUND
    ===================================================== */

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admission not found.',
        },
        { status: 404 }
      );
    }

    const admission = result.rows[0];

    console.log(
      'Admission found:',
      admission.admission_number
    );

    /* =====================================================
       ADMISSION STATUS
    ===================================================== */

    if (
      String(admission.admission_status)
        .trim()
        .toLowerCase() !== 'active'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Admission letter is only available for active admissions.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       FONT PATHS
    ===================================================== */

    /*
     * IMPORTANT:
     *
     * These files must exist:
     *
     * public/fonts/DejaVuSans.ttf
     * public/fonts/DejaVuSans-Bold.ttf
     */

    const regularFontPath = path.join(
      process.cwd(),
      'public',
      'fonts',
      'DejaVuSans.ttf'
    );

    const boldFontPath = path.join(
      process.cwd(),
      'public',
      'fonts',
      'DejaVuSans-Bold.ttf'
    );

    console.log(
      'Regular font:',
      regularFontPath
    );

    console.log(
      'Bold font:',
      boldFontPath
    );

    /* =====================================================
       VERIFY FONT FILES
    ===================================================== */

    if (!fs.existsSync(regularFontPath)) {
      throw new Error(
        `Regular font not found: ${regularFontPath}`
      );
    }

    if (!fs.existsSync(boldFontPath)) {
      throw new Error(
        `Bold font not found: ${boldFontPath}`
      );
    }

    console.log(
      'Custom PDF fonts found successfully.'
    );

    /* =====================================================
       APPLICANT NAME
    ===================================================== */

    const applicantName = [
      admission.surname,
      admission.middle_name,
      admission.first_name,
    ]
      .filter(Boolean)
      .join(' ');

    const firstName =
      admission.first_name ||
      applicantName ||
      'Student';

    /* =====================================================
       ADMISSION DATE
    ===================================================== */

    let admissionDateText = 'N/A';

    if (admission.admission_date) {
      const date = new Date(
        admission.admission_date
      );

      if (!Number.isNaN(date.getTime())) {
        admissionDateText =
          date.toLocaleDateString(
            'en-KE',
            {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }
          );
      }
    }

    /* =====================================================
       LOGO
    ===================================================== */

    const logoPath = path.join(
      process.cwd(),
      'public',
      'images',
      'logo.jpg'
    );

    const logoExists =
      fs.existsSync(logoPath);

    /* =====================================================
       SMTC COLORS
    ===================================================== */

    const COLORS = {
      green: '#006B3F',
      darkGreen: '#004D2C',
      gold: '#D4AF37',
      lightGold: '#F4E8B2',
      lightGreen: '#EAF5EF',
      white: '#FFFFFF',
      black: '#222222',
      gray: '#666666',
      lightGray: '#F5F5F5',
      border: '#D9D9D9',
    };

    /* =====================================================
       CREATE PDF

       IMPORTANT:
       We explicitly use the custom font.
       PDFKit will therefore NOT attempt to load
       Helvetica.afm.
    ===================================================== */

    const doc = new PDFDocument({
      size: 'A4',
      margin: 45,
      bufferPages: true,
      font: regularFontPath,
      info: {
        Title:
          `SMTC Admission Letter - ${admission.admission_number}`,
        Author:
          'Shifah Medical Training College',
        Subject:
          'Official Admission Letter',
      },
    });

    /* =====================================================
       REGISTER CUSTOM FONTS
    ===================================================== */

    doc.registerFont(
      'SMTC-Regular',
      regularFontPath
    );

    doc.registerFont(
      'SMTC-Bold',
      boldFontPath
    );

    /*
     * VERY IMPORTANT:
     * Set default active font immediately.
     */

    doc.font('SMTC-Regular');

    /* =====================================================
       PDF BUFFER
    ===================================================== */

    const chunks: Buffer[] = [];

    doc.on(
      'data',
      (chunk: Buffer) => {
        chunks.push(chunk);
      }
    );

    const pdfPromise =
      new Promise<Buffer>(
        (resolve, reject) => {
          doc.on(
            'end',
            () => {
              resolve(
                Buffer.concat(chunks)
              );
            }
          );

          doc.on(
            'error',
            reject
          );
        }
      );

    /* =====================================================
       PAGE DIMENSIONS
    ===================================================== */

    const pageWidth = 595.28;
    const pageHeight = 841.89;

    const left = 45;
    const right =
      pageWidth - 45;

    const contentWidth =
      right - left;

    /* =====================================================
       PAGE BACKGROUND
    ===================================================== */

    doc
      .rect(
        0,
        0,
        pageWidth,
        pageHeight
      )
      .fill(COLORS.white);

    /* =====================================================
       TOP GREEN HEADER
    ===================================================== */

    doc
      .rect(
        0,
        0,
        pageWidth,
        9
      )
      .fill(COLORS.green);

    doc
      .rect(
        0,
        9,
        pageWidth,
        4
      )
      .fill(COLORS.gold);

    /* =====================================================
       LOGO
    ===================================================== */

    if (logoExists) {
      try {
        doc.image(
          logoPath,
          left,
          32,
          {
            fit: [85, 85],
            align: 'center',
            valign: 'center',
          }
        );
      } catch (logoError) {
        console.error(
          'Unable to load SMTC logo:',
          logoError
        );
      }
    }

    /* =====================================================
       COLLEGE NAME
    ===================================================== */

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(19)
      .text(
        'SHIFAH MEDICAL TRAINING COLLEGE',
        145,
        40,
        {
          width: 405,
          align: 'center',
        }
      );

    /* =====================================================
       COLLEGE SLOGAN
    ===================================================== */

    doc
      .fillColor(COLORS.gold)
      .font('SMTC-Bold')
      .fontSize(9)
      .text(
        'HEALTH THROUGH INNOVATION AND RESEARCH',
        145,
        66,
        {
          width: 405,
          align: 'center',
          characterSpacing: 0.5,
        }
      );

    /* =====================================================
       COLLEGE CONTACT
    ===================================================== */

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(8)
      .text(
        'Ambwere Plaza, 2nd Floor, Kitale, Kenya',
        145,
        84,
        {
          width: 405,
          align: 'center',
        }
      );

    doc
      .text(
        'Tel: +254 142 068 933  |  shifahmedicalcollege.co.ke',
        145,
        97,
        {
          width: 405,
          align: 'center',
        }
      );

    /* =====================================================
       GOLD DIVIDER
    ===================================================== */

    doc
      .moveTo(
        left,
        125
      )
      .lineTo(
        right,
        125
      )
      .lineWidth(2)
      .strokeColor(COLORS.gold)
      .stroke();

    /* =====================================================
       ADMISSION LETTER TITLE
    ===================================================== */

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(18)
      .text(
        'ADMISSION LETTER',
        left,
        148,
        {
          width: contentWidth,
          align: 'center',
        }
      );

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(8.5)
      .text(
        'OFFICIAL OFFER OF ADMISSION',
        left,
        173,
        {
          width: contentWidth,
          align: 'center',
        }
      );

    /* =====================================================
       ADMISSION NUMBER BADGE
    ===================================================== */

    doc
      .roundedRect(
        left,
        198,
        contentWidth,
        48,
        6
      )
      .fill(COLORS.lightGreen);

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(8.5)
      .text(
        'ADMISSION NUMBER',
        left + 15,
        211
      );

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(13)
      .text(
        admission.admission_number ||
          'N/A',
        left + 15,
        225
      );

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(8)
      .text(
        `Date: ${admissionDateText}`,
        left + 330,
        220,
        {
          width: 135,
          align: 'right',
        }
      );

    /* =====================================================
       STUDENT ADDRESS
    ===================================================== */

    let y = 275;

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Bold')
      .fontSize(10.5)
      .text(
        applicantName || 'N/A',
        left,
        y
      );

    y += 17;

    if (admission.postal_address) {
      doc
        .fillColor(COLORS.gray)
        .font('SMTC-Regular')
        .fontSize(8.5)
        .text(
          admission.postal_address,
          left,
          y
        );

      y += 14;
    }

    if (admission.postal_code) {
      doc.text(
        admission.postal_code,
        left,
        y
      );

      y += 14;
    }

    if (admission.town) {
      doc.text(
        admission.town,
        left,
        y
      );

      y += 14;
    }

    /* =====================================================
       SUBJECT
    ===================================================== */

    y += 15;

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Bold')
      .fontSize(10.5)
      .text(
        'RE: OFFER OF ADMISSION',
        left,
        y
      );

    /* =====================================================
       GREETING
    ===================================================== */

    y += 30;

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Regular')
      .fontSize(9.8)
      .text(
        `Dear ${firstName},`,
        left,
        y
      );

    /* =====================================================
       INTRODUCTION
    ===================================================== */

    y += 26;

    doc.text(
      `We are pleased to inform you that you have been offered admission to Shifah Medical Training College to pursue the ${admission.course || 'selected programme'} programme.`,
      left,
      y,
      {
        width: contentWidth,
        align: 'justify',
        lineGap: 4,
      }
    );

    y = doc.y + 12;

    /* =====================================================
       ADMISSION DETAILS BOX
    ===================================================== */

    doc
      .roundedRect(
        left,
        y,
        contentWidth,
        108,
        6
      )
      .fill(COLORS.lightGray);

    doc
      .roundedRect(
        left,
        y,
        6,
        108,
        3
      )
      .fill(COLORS.green);

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(10)
      .text(
        'ADMISSION DETAILS',
        left + 20,
        y + 13
      );

    const detailStartY =
      y + 37;

    /* Admission number */

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(8.8)
      .text(
        'Admission Number',
        left + 20,
        detailStartY
      );

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Bold')
      .text(
        admission.admission_number ||
          'N/A',
        left + 170,
        detailStartY
      );

    /* Course */

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .text(
        'Programme',
        left + 20,
        detailStartY + 21
      );

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Bold')
      .text(
        admission.course ||
          'N/A',
        left + 170,
        detailStartY + 21,
        {
          width: 330,
        }
      );

    /* Intake */

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .text(
        'Intake',
        left + 20,
        detailStartY + 42
      );

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Bold')
      .text(
        admission.intake ||
          'N/A',
        left + 170,
        detailStartY + 42,
        {
          width: 330,
        }
      );

    /* Admission date */

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .text(
        'Admission Date',
        left + 20,
        detailStartY + 63
      );

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Bold')
      .text(
        admissionDateText,
        left + 170,
        detailStartY + 63
      );

    y += 132;

    /* =====================================================
       SECOND PARAGRAPH
    ===================================================== */

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Regular')
      .fontSize(9.8)
      .text(
        `Your admission is for the ${admission.intake || 'selected intake'}. Your official admission number is ${admission.admission_number || 'N/A'}. Please quote this admission number in all future correspondence with the College.`,
        left,
        y,
        {
          width: contentWidth,
          align: 'justify',
          lineGap: 4,
        }
      );

    y = doc.y + 12;

    /* =====================================================
       REPORTING INFORMATION
    ===================================================== */

    doc.text(
      'You are expected to report to the College on the official reporting date communicated by the Admissions Office. Upon reporting, you will be required to complete the necessary registration and admission procedures.',
      left,
      y,
      {
        width: contentWidth,
        align: 'justify',
        lineGap: 4,
      }
    );

    y = doc.y + 12;

    /* =====================================================
       DOCUMENT REQUIREMENTS
    ===================================================== */

    doc.text(
      'Please bring the relevant original academic certificates, identification documents and other required supporting documents together with copies as may be required during registration.',
      left,
      y,
      {
        width: contentWidth,
        align: 'justify',
        lineGap: 4,
      }
    );

    y = doc.y + 12;

    /* =====================================================
       VERIFICATION NOTICE
    ===================================================== */

    doc
      .roundedRect(
        left,
        y,
        contentWidth,
        60,
        6
      )
      .fill(COLORS.lightGreen);

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(9)
      .text(
        'IMPORTANT NOTICE',
        left + 15,
        y + 12
      );

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Regular')
      .fontSize(8)
      .text(
        'This offer of admission is subject to verification of the information and documents provided in your application and compliance with the College admission requirements.',
        left + 15,
        y + 28,
        {
          width:
            contentWidth - 30,
          align: 'justify',
          lineGap: 2,
        }
      );

    y += 78;

    /* =====================================================
       CLOSING
    ===================================================== */

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Regular')
      .fontSize(9.8)
      .text(
        'We congratulate you on your admission and look forward to welcoming you to Shifah Medical Training College.',
        left,
        y,
        {
          width: contentWidth,
          align: 'justify',
          lineGap: 4,
        }
      );

    y = doc.y + 24;

    /* =====================================================
       SIGNATURE
    ===================================================== */

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Regular')
      .fontSize(9.5)
      .text(
        'Yours faithfully,',
        left,
        y
      );

    y += 35;

    doc
      .moveTo(
        left,
        y
      )
      .lineTo(
        left + 160,
        y
      )
      .lineWidth(0.8)
      .strokeColor(COLORS.gray)
      .stroke();

    y += 7;

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(9.5)
      .text(
        'ADMISSIONS OFFICE',
        left,
        y
      );

    y += 14;

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(8)
      .text(
        'Shifah Medical Training College',
        left,
        y
      );

    /* =====================================================
       FOOTER LINE
    ===================================================== */

    doc
      .moveTo(
        left,
        pageHeight - 78
      )
      .lineTo(
        right,
        pageHeight - 78
      )
      .lineWidth(1)
      .strokeColor(COLORS.gold)
      .stroke();

    /* =====================================================
       FOOTER COLLEGE NAME
    ===================================================== */

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(8.5)
      .text(
        'SHIFAH MEDICAL TRAINING COLLEGE',
        left,
        pageHeight - 63,
        {
          width: contentWidth,
          align: 'center',
        }
      );

    /* =====================================================
       FOOTER SLOGAN
    ===================================================== */

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(7.5)
      .text(
        'Health through innovation and research',
        left,
        pageHeight - 48,
        {
          width: contentWidth,
          align: 'center',
        }
      );

    /* =====================================================
       OFFICIAL DOCUMENT LABEL
    ===================================================== */

    doc
      .fillColor(COLORS.gold)
      .font('SMTC-Bold')
      .fontSize(7)
      .text(
        'OFFICIAL ADMISSION DOCUMENT',
        left,
        pageHeight - 31,
        {
          width: contentWidth,
          align: 'center',
          characterSpacing: 0.5,
        }
      );

    /* =====================================================
       FINISH PDF
    ===================================================== */

    doc.end();

    const pdfBuffer =
      await pdfPromise;

    console.log(
      'Admission letter generated successfully.'
    );

    console.log(
      'PDF size:',
      pdfBuffer.length,
      'bytes'
    );

    /* =====================================================
       SAFE FILE NAME
    ===================================================== */

    const safeAdmissionNumber =
      String(
        admission.admission_number ||
          admission.application_number ||
          admissionId
      ).replace(
        /[^a-zA-Z0-9_-]/g,
        '-'
      );

    /* =====================================================
       RETURN PDF
    ===================================================== */

    return new NextResponse(
      new Uint8Array(pdfBuffer),
      {
        status: 200,

        headers: {
          'Content-Type':
            'application/pdf',

          'Content-Disposition':
            `attachment; filename="SMTC-Admission-Letter-${safeAdmissionNumber}.pdf"`,

          'Content-Length':
            String(
              pdfBuffer.length
            ),

          'Cache-Control':
            'no-store, no-cache, must-revalidate',

          'Pragma':
            'no-cache',

          'Expires':
            '0',
        },
      }
    );

  } catch (error) {
    /* =====================================================
       ERROR HANDLING
    ===================================================== */

    console.error(
      '===================================='
    );

    console.error(
      'ADMISSION LETTER GENERATION ERROR'
    );

    console.error(
      '===================================='
    );

    console.error(error);

    return NextResponse.json(
      {
        success: false,

        message:
          'Unable to generate admission letter.',

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}

