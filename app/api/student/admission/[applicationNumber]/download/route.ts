import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

import { getStudentSession } from '@/lib/student-auth';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    applicationNumber: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    /* =====================================================
       1. CHECK STUDENT SESSION
    ===================================================== */

    const session = await getStudentSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized. Please log in.',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       GET APPLICATION NUMBER
    ===================================================== */

    const { applicationNumber } =
      await context.params;

    if (!applicationNumber) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application number is required.',
        },
        { status: 400 }
      );
    }

    const requestedApplicationNumber =
      String(applicationNumber).trim();

    /* =====================================================
       2. CONFIRM APPLICATION BELONGS TO STUDENT
    ===================================================== */

    const result = await pool.query(
      `
        SELECT
          id,
          application_number,

          surname,
          middle_name,
          first_name,

          date_of_birth,
          gender,
          nationality,
          country,
          id_passport_number,

          postal_address,
          postal_code,
          town,
          county,

          mobile,
          email,

          kcse_index,
          kcse_year,
          kcse_mean_grade,

          course,
          intake,

          application_status,
          payment_status,

          application_fee,

          created_at

        FROM applications

        WHERE id = $1
          AND application_number = $2

        LIMIT 1
      `,
      [
        session.applicationId,
        requestedApplicationNumber,
      ]
    );

    /* =====================================================
       APPLICATION NOT FOUND
    ===================================================== */

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Application not found or does not belong to this student.',
        },
        { status: 404 }
      );
    }

    const student = result.rows[0];

    /* =====================================================
       3. CHECK APPLICATION APPROVAL
    ===================================================== */

    const applicationStatus =
      String(
        student.application_status || ''
      )
        .trim()
        .toLowerCase();

    const isApproved =
      [
        'approved',
        'accepted',
        'admitted',
      ].includes(applicationStatus);

    if (!isApproved) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Admission letter is only available after your application has been approved.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       FONT PATHS
    ===================================================== */

    const regularFontPath =
      path.join(
        process.cwd(),
        'public',
        'fonts',
        'DejaVuSans.ttf'
      );

    const boldFontPath =
      path.join(
        process.cwd(),
        'public',
        'fonts',
        'DejaVuSans-Bold.ttf'
      );

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

    /* =====================================================
       IMAGE PATHS
    ===================================================== */

    const logoPath =
      path.join(
        process.cwd(),
        'public',
        'images',
        'logo.jpg'
      );

    const principalSignaturePath =
      path.join(
        process.cwd(),
        'public',
        'images',
        'principal_signature.png'
      );

    const collegeStampPath =
      path.join(
        process.cwd(),
        'public',
        'images',
        'college_stamp.png'
      );

    const logoExists =
      fs.existsSync(logoPath);

    const signatureExists =
      fs.existsSync(
        principalSignaturePath
      );

    const stampExists =
      fs.existsSync(
        collegeStampPath
      );

    /* =====================================================
       APPLICANT NAME
    ===================================================== */

    const applicantName = [
      student.surname,
      student.middle_name,
      student.first_name,
    ]
      .filter(Boolean)
      .join(' ');

    const firstName =
      student.first_name ||
      applicantName ||
      'Student';

    /* =====================================================
       ADMISSION NUMBER
       
       Since we are NOT using the admissions table,
       use the application number.
    ===================================================== */

    const admissionNumber =
      String(
        student.application_number
      ).trim();

    /* =====================================================
       DATE
    ===================================================== */

    let admissionDateText = 'N/A';

    if (student.created_at) {
      const date =
        new Date(student.created_at);

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
       SMTC COLORS
    ===================================================== */

    const COLORS = {
      green: '#006B3F',
      darkGreen: '#004D2C',
      gold: '#D4AF37',
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
       font MUST be supplied here.

       This prevents PDFKit from trying to load
       Helvetica.afm from the Next.js vendor chunk.
    ===================================================== */

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,

      font: regularFontPath,

      info: {
        Title:
          `SMTC Admission Letter - ${admissionNumber}`,

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

    const left = 42;
    const right =
      pageWidth - 42;

    const contentWidth =
      right - left;

    /* =====================================================
       WHITE BACKGROUND
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
       TOP BRANDING
    ===================================================== */

    doc
      .rect(
        0,
        0,
        pageWidth,
        8
      )
      .fill(COLORS.green);

    doc
      .rect(
        0,
        8,
        pageWidth,
        3
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
          25,
          {
            fit: [70, 70],
          }
        );
      } catch (error) {
        console.error(
          'Unable to load SMTC logo:',
          error
        );
      }
    }

    /* =====================================================
       COLLEGE HEADER
    ===================================================== */

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(16.5)
      .text(
        'SHIFAH MEDICAL TRAINING COLLEGE',
        120,
        30,
        {
          width: 435,
          align: 'center',
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.gold)
      .font('SMTC-Bold')
      .fontSize(7.8)
      .text(
        'HEALTH THROUGH INNOVATION AND RESEARCH',
        120,
        52,
        {
          width: 435,
          align: 'center',
          characterSpacing: 0.4,
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(7.2)
      .text(
        'Ambwere Plaza, 2nd Floor, Kitale, Kenya',
        120,
        68,
        {
          width: 435,
          align: 'center',
          lineBreak: false,
        }
      );

    doc.text(
      'Tel: +254 142 068 933  |  shifahmedicalcollege.co.ke',
      120,
      80,
      {
        width: 435,
        align: 'center',
        lineBreak: false,
      }
    );

    /* =====================================================
       DIVIDER
    ===================================================== */

    doc
      .moveTo(left, 103)
      .lineTo(right, 103)
      .lineWidth(1.5)
      .strokeColor(COLORS.gold)
      .stroke();

    /* =====================================================
       TITLE
    ===================================================== */

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(15.5)
      .text(
        'ADMISSION LETTER',
        left,
        116,
        {
          width: contentWidth,
          align: 'center',
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(7.2)
      .text(
        'OFFICIAL OFFER OF ADMISSION',
        left,
        138,
        {
          width: contentWidth,
          align: 'center',
          lineBreak: false,
        }
      );

    /* =====================================================
       ADMISSION NUMBER BOX
    ===================================================== */

    doc
      .roundedRect(
        left,
        157,
        contentWidth,
        43,
        5
      )
      .fill(COLORS.lightGreen);

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(7.2)
      .text(
        'ADMISSION NUMBER',
        left + 14,
        167,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(10.5)
      .text(
        admissionNumber,
        left + 14,
        181,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(7.2)
      .text(
        `Date: ${admissionDateText}`,
        left + 315,
        176,
        {
          width: 145,
          align: 'right',
          lineBreak: false,
        }
      );

    /* =====================================================
       STUDENT ADDRESS
    ===================================================== */

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Bold')
      .fontSize(8.8)
      .text(
        applicantName || 'N/A',
        left,
        216,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(7.3);

    if (student.postal_address) {
      doc.text(
        student.postal_address,
        left,
        230,
        {
          lineBreak: false,
        }
      );
    }

    if (student.postal_code) {
      doc.text(
        student.postal_code,
        left,
        241,
        {
          lineBreak: false,
        }
      );
    }

    if (student.town) {
      doc.text(
        student.town,
        left,
        252,
        {
          lineBreak: false,
        }
      );
    }

    /* =====================================================
       SUBJECT
    ===================================================== */

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Bold')
      .fontSize(8.8)
      .text(
        'RE: OFFER OF ADMISSION',
        left,
        269,
        {
          lineBreak: false,
        }
      );

    /* =====================================================
       GREETING
    ===================================================== */

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Regular')
      .fontSize(8.3)
      .text(
        `Dear ${firstName},`,
        left,
        291,
        {
          lineBreak: false,
        }
      );

    /* =====================================================
       INTRODUCTION
    ===================================================== */

    doc
      .font('SMTC-Regular')
      .fontSize(8.3)
      .text(
        `We are pleased to inform you that you have been offered admission to Shifah Medical Training College to pursue the ${student.course || 'selected programme'} programme.`,
        left,
        310,
        {
          width: contentWidth,
          align: 'justify',
          lineGap: 1.5,
        }
      );

    /* =====================================================
       ADMISSION DETAILS BOX
    ===================================================== */

    const detailsY = 344;
    const detailsHeight = 89;

    doc
      .roundedRect(
        left,
        detailsY,
        contentWidth,
        detailsHeight,
        5
      )
      .fill(COLORS.lightGray);

    doc
      .roundedRect(
        left,
        detailsY,
        5,
        detailsHeight,
        2
      )
      .fill(COLORS.green);

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(8.2)
      .text(
        'ADMISSION DETAILS',
        left + 17,
        detailsY + 10,
        {
          lineBreak: false,
        }
      );

    const detailX =
      left + 155;

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(7.3)
      .text(
        'Admission Number',
        left + 17,
        detailsY + 29,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Bold')
      .fontSize(7.6)
      .text(
        admissionNumber,
        detailX,
        detailsY + 29,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .text(
        'Programme',
        left + 17,
        detailsY + 47,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Bold')
      .text(
        student.course ||
          'N/A',
        detailX,
        detailsY + 47,
        {
          width: 340,
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .text(
        'Intake',
        left + 17,
        detailsY + 65,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Bold')
      .text(
        student.intake ||
          'N/A',
        detailX,
        detailsY + 65,
        {
          width: 340,
          lineBreak: false,
        }
      );

    /* =====================================================
       MAIN BODY
    ===================================================== */

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Regular')
      .fontSize(8.15)
      .text(
        `Your admission is for the ${student.intake || 'selected intake'}. Your official admission number is ${admissionNumber}. Please quote this admission number in all future correspondence with the College.`,
        left,
        449,
        {
          width: contentWidth,
          align: 'justify',
          lineGap: 1.5,
        }
      );

    doc.text(
      'You are expected to report to the College on the official reporting date communicated by the Admissions Office. Upon reporting, you will be required to complete the necessary registration and admission procedures.',
      left,
      490,
      {
        width: contentWidth,
        align: 'justify',
        lineGap: 1.5,
      }
    );

    doc.text(
      'Please bring the relevant original academic certificates, identification documents and other required supporting documents together with copies as may be required during registration.',
      left,
      530,
      {
        width: contentWidth,
        align: 'justify',
        lineGap: 1.5,
      }
    );

    /* =====================================================
       IMPORTANT NOTICE
    ===================================================== */

    const noticeY = 568;
    const noticeHeight = 51;

    doc
      .roundedRect(
        left,
        noticeY,
        contentWidth,
        noticeHeight,
        5
      )
      .fill(COLORS.lightGreen);

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(7.8)
      .text(
        'IMPORTANT NOTICE',
        left + 13,
        noticeY + 9,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Regular')
      .fontSize(7)
      .text(
        'This offer of admission is subject to verification of the information and documents provided in your application and compliance with the College admission requirements.',
        left + 13,
        noticeY + 23,
        {
          width:
            contentWidth - 26,
          align: 'justify',
          lineGap: 1,
        }
      );

    /* =====================================================
       CLOSING
    ===================================================== */

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Regular')
      .fontSize(8.2)
      .text(
        'We congratulate you on your admission and look forward to welcoming you to Shifah Medical Training College.',
        left,
        632,
        {
          width: contentWidth,
          align: 'justify',
          lineGap: 1.5,
        }
      );

    /* =====================================================
       SIGN-OFF
    ===================================================== */

    doc
      .fillColor(COLORS.black)
      .font('SMTC-Regular')
      .fontSize(8)
      .text(
        'Yours faithfully,',
        left,
        665,
        {
          lineBreak: false,
        }
      );

    /* =====================================================
       PRINCIPAL SIGNATURE
    ===================================================== */

    const signatureX = left;
    const signatureY = 680;

    if (signatureExists) {
      try {
        doc.image(
          principalSignaturePath,
          signatureX,
          signatureY,
          {
            fit: [170, 78],
          }
        );
      } catch (signatureError) {
        console.error(
          'Unable to load principal signature:',
          signatureError
        );
      }
    }

    /* =====================================================
       COLLEGE STAMP
    ===================================================== */

    const stampX =
      left + 285;

    const stampY = 674;

    if (stampExists) {
      try {
        doc.image(
          collegeStampPath,
          stampX,
          stampY,
          {
            fit: [185, 185],
          }
        );
      } catch (stampError) {
        console.error(
          'Unable to load college stamp:',
          stampError
        );
      }
    }

    /* =====================================================
       SIGNATURE LINE
    ===================================================== */

    doc
      .moveTo(left, 721)
      .lineTo(left + 150, 721)
      .lineWidth(0.7)
      .strokeColor(COLORS.gray)
      .stroke();

    /* =====================================================
       PRINCIPAL TITLE
    ===================================================== */

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(8)
      .text(
        'PRINCIPAL',
        left,
        726,
        {
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(7)
      .text(
        'Shifah Medical Training College',
        left,
        739,
        {
          lineBreak: false,
        }
      );

    /* =====================================================
       FOOTER
    ===================================================== */

    const footerLineY = 766;

    doc
      .moveTo(
        left,
        footerLineY
      )
      .lineTo(
        right,
        footerLineY
      )
      .lineWidth(1)
      .strokeColor(COLORS.gold)
      .stroke();

    doc
      .fillColor(COLORS.green)
      .font('SMTC-Bold')
      .fontSize(7.5)
      .text(
        'SHIFAH MEDICAL TRAINING COLLEGE',
        left,
        footerLineY + 10,
        {
          width: contentWidth,
          align: 'center',
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.gray)
      .font('SMTC-Regular')
      .fontSize(6.8)
      .text(
        'Health through innovation and research',
        left,
        footerLineY + 23,
        {
          width: contentWidth,
          align: 'center',
          lineBreak: false,
        }
      );

    doc
      .fillColor(COLORS.gold)
      .font('SMTC-Bold')
      .fontSize(6.2)
      .text(
        'OFFICIAL ADMISSION DOCUMENT',
        left,
        footerLineY + 35,
        {
          width: contentWidth,
          align: 'center',
          characterSpacing: 0.4,
          lineBreak: false,
        }
      );

    /* =====================================================
       FINISH PDF
    ===================================================== */

    doc.end();

    const pdfBuffer =
      await pdfPromise;

    /* =====================================================
       SAFE FILE NAME
    ===================================================== */

    const safeApplicationNumber =
      admissionNumber.replace(
        /[^a-zA-Z0-9_-]/g,
        '-'
      );

    /* =====================================================
       RETURN PDF DOWNLOAD
    ===================================================== */

    return new NextResponse(
      new Uint8Array(pdfBuffer),
      {
        status: 200,

        headers: {
          'Content-Type':
            'application/pdf',

          'Content-Disposition':
            `attachment; filename="SMTC-Admission-Letter-${safeApplicationNumber}.pdf"`,

          'Content-Length':
            String(pdfBuffer.length),

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

    console.error(
      '===================================='
    );

    console.error(
      'STUDENT ADMISSION LETTER ERROR'
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