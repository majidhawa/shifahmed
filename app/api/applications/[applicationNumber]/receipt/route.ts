
import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    applicationNumber: string;
  }>;
};

/* =========================================================
   FORMAT PAYMENT DATE

   Supports:
   20260810110551
   20260810
   PostgreSQL timestamp/date
========================================================= */

function formatTransactionDate(
  transactionDate: unknown
): string {
  if (!transactionDate) {
    return 'N/A';
  }

  const value = String(transactionDate).trim();

  /* M-Pesa: YYYYMMDDHHMMSS */
  if (/^\d{14}$/.test(value)) {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);

    return `${day}/${month}/${year}`;
  }

  /* YYYYMMDD */
  if (/^\d{8}$/.test(value)) {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);

    return `${day}/${month}/${year}`;
  }

  /* PostgreSQL date/timestamp */
  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    const day = String(
      date.getDate()
    ).padStart(2, '0');

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  return value;
}

/* =========================================================
   GET RECEIPT
========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    /* =====================================================
       GET APPLICATION NUMBER
    ===================================================== */

    const { applicationNumber } =
      await context.params;

    if (!applicationNumber) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Application number is required.',
        },
        { status: 400 }
      );
    }

    /* =====================================================
       DECODE APPLICATION NUMBER
    ===================================================== */

    let decodedApplicationNumber =
      applicationNumber;

    try {
      decodedApplicationNumber =
        decodeURIComponent(
          applicationNumber
        );
    } catch {
      decodedApplicationNumber =
        applicationNumber;
    }

    console.log(
      '===================================='
    );

    console.log(
      'GENERATING SMTC PAYMENT RECEIPT'
    );

    console.log(
      'Application:',
      decodedApplicationNumber
    );

    console.log(
      '===================================='
    );

    /* =====================================================
       GET APPLICATION + ALL PAYMENT SOURCES
    ===================================================== */

    const result = await pool.query(
      `
        SELECT
          id,
          application_number,

          surname,
          middle_name,
          first_name,

          course,
          intake,

          application_fee,

          payment_status,

          /* AUTOMATIC M-PESA PAYMENT */
          mpesa_receipt_number,
          mpesa_transaction_date,
          mpesa_phone_number,

          /* MANUAL PAYMENT */
          manual_mpesa_code,
          manual_mpesa_phone,
          manual_payment_submitted_at

        FROM applications

        WHERE application_number = $1

        LIMIT 1
      `,
      [decodedApplicationNumber]
    );

    /* =====================================================
       APPLICATION NOT FOUND
    ===================================================== */

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Application not found.',
        },
        { status: 404 }
      );
    }

    const application =
      result.rows[0];

    console.log(
      'Receipt application found:',
      application.application_number
    );

    /* =====================================================
       PAYMENT STATUS
    ===================================================== */

    const paymentStatus =
      String(
        application.payment_status || ''
      )
        .trim()
        .toLowerCase();

    console.log(
      'Payment status:',
      paymentStatus
    );

    /* =====================================================
       PAYMENT MUST BE PAID
    ===================================================== */

    if (paymentStatus !== 'paid') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Receipt unavailable. The application fee has not been verified as paid.',
        },
        { status: 403 }
      );
    }

    /* =====================================================
       RESOLVE PAYMENT DETAILS

       PRIORITY:

       1. MANUAL PAYMENT
       2. AUTOMATIC M-PESA CALLBACK
    ===================================================== */

    const paymentCode =
      application.manual_mpesa_code ||
      application.mpesa_receipt_number ||
      '';

    const paymentPhone =
      application.manual_mpesa_phone ||
      application.mpesa_phone_number ||
      '';

    const paymentDate =
      application.manual_payment_submitted_at ||
      application.mpesa_transaction_date ||
      null;

    console.log(
      'Resolved payment code:',
      paymentCode
    );

    console.log(
      'Resolved payment phone:',
      paymentPhone
    );

    console.log(
      'Resolved payment date:',
      paymentDate
    );

    /* =====================================================
       PAYMENT REFERENCE MUST EXIST

       This is important because BOTH automatic and
       manual payments must have a transaction reference.
    ===================================================== */

    if (!paymentCode) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Payment is marked as paid, but no M-Pesa transaction code or receipt number was found.',
        },
        { status: 409 }
      );
    }

    /* =====================================================
       APPLICANT NAME
    ===================================================== */

    const applicantName = [
      application.surname,
      application.middle_name,
      application.first_name,
    ]
      .filter(Boolean)
      .join(' ');

    /* =====================================================
       RECEIPT NUMBER
    ===================================================== */

    const receiptNumber =
      `SMTC-RCPT-${String(
        application.id
      ).padStart(6, '0')}`;

    /* =====================================================
       FORMAT PAYMENT DATE
    ===================================================== */

    const formattedTransactionDate =
      formatTransactionDate(
        paymentDate
      );

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

    /* =====================================================
       VERIFY FONT FILES
    ===================================================== */

    if (
      !fs.existsSync(
        regularFontPath
      )
    ) {
      throw new Error(
        `Regular font not found: ${regularFontPath}`
      );
    }

    if (
      !fs.existsSync(
        boldFontPath
      )
    ) {
      throw new Error(
        `Bold font not found: ${boldFontPath}`
      );
    }

    /* =====================================================
       LOGO
    ===================================================== */

    const logoPath =
      path.join(
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
    ===================================================== */

    const doc =
      new PDFDocument({
        size: 'A4',
        margin: 45,
        bufferPages: true,
        font: regularFontPath,
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

    doc.font(
      'SMTC-Regular'
    );

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
      } catch (
        logoError
      ) {
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
      .fillColor(
        COLORS.green
      )
      .font(
        'SMTC-Bold'
      )
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
       SLOGAN
    ===================================================== */

    doc
      .fillColor(
        COLORS.gold
      )
      .font(
        'SMTC-Bold'
      )
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
       RECEIPT SUBTITLE
    ===================================================== */

    doc
      .fillColor(
        COLORS.gray
      )
      .font(
        'SMTC-Regular'
      )
      .fontSize(8.5)
      .text(
        'OFFICIAL APPLICATION FEE RECEIPT',
        145,
        83,
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
      .strokeColor(
        COLORS.gold
      )
      .stroke();

    /* =====================================================
       RECEIPT TITLE
    ===================================================== */

    doc
      .fillColor(
        COLORS.green
      )
      .font(
        'SMTC-Bold'
      )
      .fontSize(17)
      .text(
        'APPLICATION FEE RECEIPT',
        left,
        148,
        {
          width: contentWidth,
          align: 'center',
        }
      );

    doc
      .fillColor(
        COLORS.gray
      )
      .font(
        'SMTC-Regular'
      )
      .fontSize(8)
      .text(
        'Official confirmation of application fee payment',
        left,
        171,
        {
          width: contentWidth,
          align: 'center',
        }
      );

    /* =====================================================
       SECTION TITLE HELPER
    ===================================================== */

    const drawSectionTitle = (
      title: string,
      y: number
    ) => {
      doc
        .roundedRect(
          left,
          y,
          contentWidth,
          26,
          4
        )
        .fill(
          COLORS.green
        );

      doc
        .fillColor(
          COLORS.white
        )
        .font(
          'SMTC-Bold'
        )
        .fontSize(10)
        .text(
          title,
          left + 12,
          y + 8
        );
    };

    /* =====================================================
       RECEIPT DETAILS
    ===================================================== */

    drawSectionTitle(
      'RECEIPT DETAILS',
      195
    );

    let y = 235;

    /* Receipt Number */

    doc
      .fillColor(
        COLORS.gray
      )
      .font(
        'SMTC-Regular'
      )
      .fontSize(9.5)
      .text(
        'Receipt Number',
        left + 12,
        y
      );

    doc
      .fillColor(
        COLORS.black
      )
      .font(
        'SMTC-Bold'
      )
      .text(
        receiptNumber,
        190,
        y
      );

    y += 22;

    /* Application Number */

    doc
      .fillColor(
        COLORS.gray
      )
      .font(
        'SMTC-Regular'
      )
      .text(
        'Application Number',
        left + 12,
        y
      );

    doc
      .fillColor(
        COLORS.black
      )
      .font(
        'SMTC-Bold'
      )
      .text(
        application.application_number ||
          'N/A',
        190,
        y
      );

    y += 22;

    /* Payment Status */

    doc
      .fillColor(
        COLORS.gray
      )
      .font(
        'SMTC-Regular'
      )
      .text(
        'Payment Status',
        left + 12,
        y
      );

    doc
      .fillColor(
        COLORS.green
      )
      .font(
        'SMTC-Bold'
      )
      .text(
        'PAID / VERIFIED',
        190,
        y
      );

    /* =====================================================
       APPLICANT INFORMATION
    ===================================================== */

    y += 38;

    drawSectionTitle(
      'APPLICANT INFORMATION',
      y
    );

    y += 40;

    const applicantRows = [
      [
        'Applicant Name',
        applicantName || 'N/A',
      ],
      [
        'Course',
        application.course || 'N/A',
      ],
      [
        'Intake',
        application.intake || 'N/A',
      ],
    ];

    applicantRows.forEach(
      ([label, value]) => {
        doc
          .fillColor(
            COLORS.gray
          )
          .font(
            'SMTC-Regular'
          )
          .fontSize(9.5)
          .text(
            label,
            left + 12,
            y
          );

        doc
          .fillColor(
            COLORS.black
          )
          .font(
            'SMTC-Bold'
          )
          .text(
            String(value),
            190,
            y,
            {
              width: 350,
            }
          );

        y += 23;
      }
    );

    /* =====================================================
       PAYMENT INFORMATION
    ===================================================== */

    y += 15;

    drawSectionTitle(
      'PAYMENT INFORMATION',
      y
    );

    y += 40;

    const amountPaid =
      Number(
        application.application_fee
      ).toLocaleString();

    const paymentRows = [
      [
        'Amount Paid',
        `KSh ${amountPaid}`,
      ],
      [
        'M-Pesa Transaction Code',
        String(paymentCode),
      ],
      [
        'M-Pesa Phone Number',
        paymentPhone || 'N/A',
      ],
      [
        'Transaction Date',
        formattedTransactionDate,
      ],
    ];

    paymentRows.forEach(
      ([label, value]) => {
        doc
          .fillColor(
            COLORS.gray
          )
          .font(
            'SMTC-Regular'
          )
          .fontSize(9.5)
          .text(
            label,
            left + 12,
            y
          );

        doc
          .fillColor(
            COLORS.black
          )
          .font(
            'SMTC-Bold'
          )
          .text(
            String(value),
            190,
            y,
            {
              width: 350,
            }
          );

        y += 23;
      }
    );

    /* =====================================================
       TOTAL PAID BOX
    ===================================================== */

    y += 12;

    doc
      .roundedRect(
        left,
        y,
        contentWidth,
        67,
        6
      )
      .fill(
        COLORS.lightGreen
      );

    doc
      .roundedRect(
        left,
        y,
        7,
        67,
        3
      )
      .fill(
        COLORS.green
      );

    doc
      .fillColor(
        COLORS.gray
      )
      .font(
        'SMTC-Bold'
      )
      .fontSize(9)
      .text(
        'TOTAL APPLICATION FEE PAID',
        left + 22,
        y + 14
      );

    doc
      .fillColor(
        COLORS.green
      )
      .font(
        'SMTC-Bold'
      )
      .fontSize(20)
      .text(
        `KSh ${amountPaid}`,
        left + 22,
        y + 31
      );

    /* =====================================================
       VERIFIED PAYMENT BADGE
    ===================================================== */

    y += 85;

    doc
      .roundedRect(
        left,
        y,
        contentWidth,
        54,
        7
      )
      .fill(
        COLORS.green
      );

    doc
      .fillColor(
        COLORS.white
      )
      .font(
        'SMTC-Bold'
      )
      .fontSize(14)
      .text(
        '[OK]  PAYMENT VERIFIED - PAID',
        left,
        y + 13,
        {
          width: contentWidth,
          align: 'center',
        }
      );

    doc
      .fillColor(
        COLORS.white
      )
      .font(
        'SMTC-Regular'
      )
      .fontSize(7.5)
      .text(
        'M-Pesa payment successfully received and verified by the college system.',
        left,
        y + 33,
        {
          width: contentWidth,
          align: 'center',
        }
      );

    /* =====================================================
       DECLARATION
    ===================================================== */

    y += 75;

    doc
      .fillColor(
        COLORS.gray
      )
      .font(
        'SMTC-Regular'
      )
      .fontSize(8.5)
      .text(
        'This receipt confirms that the application fee stated above has been successfully received and verified through M-Pesa.',
        left + 15,
        y,
        {
          width:
            contentWidth - 30,
          align: 'center',
          lineGap: 3,
        }
      );

    /* =====================================================
       FOOTER LINE
    ===================================================== */

    doc
      .moveTo(
        left,
        pageHeight - 76
      )
      .lineTo(
        right,
        pageHeight - 76
      )
      .lineWidth(1)
      .strokeColor(
        COLORS.gold
      )
      .stroke();

    /* =====================================================
       FOOTER COLLEGE NAME
    ===================================================== */

    doc
      .fillColor(
        COLORS.green
      )
      .font(
        'SMTC-Bold'
      )
      .fontSize(8.5)
      .text(
        'SHIFAH MEDICAL TRAINING COLLEGE',
        left,
        pageHeight - 61,
        {
          width: contentWidth,
          align: 'center',
        }
      );

    /* =====================================================
       FOOTER DESCRIPTION
    ===================================================== */

    doc
      .fillColor(
        COLORS.gray
      )
      .font(
        'SMTC-Regular'
      )
      .fontSize(7.5)
      .text(
        'This is a system-generated receipt and does not require a physical signature.',
        left,
        pageHeight - 46,
        {
          width: contentWidth,
          align: 'center',
        }
      );

    /* =====================================================
       OFFICIAL DOCUMENT LABEL
    ===================================================== */

    doc
      .fillColor(
        COLORS.gold
      )
      .font(
        'SMTC-Bold'
      )
      .fontSize(7)
      .text(
        'OFFICIAL PAYMENT DOCUMENT',
        left,
        pageHeight - 30,
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
      'PDF generated successfully.'
    );

    console.log(
      'PDF size:',
      pdfBuffer.length,
      'bytes'
    );

    /* =====================================================
       SAFE FILE NAME
    ===================================================== */

    const safeApplicationNumber =
      String(
        application.application_number
      ).replace(
        /[^a-zA-Z0-9_-]/g,
        '-'
      );

    /* =====================================================
       RETURN PDF
    ===================================================== */

    return new NextResponse(
      new Uint8Array(
        pdfBuffer
      ),
      {
        status: 200,

        headers: {
          'Content-Type':
            'application/pdf',

          'Content-Disposition':
            `attachment; filename="SMTC-Receipt-${safeApplicationNumber}.pdf"`,

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
      'RECEIPT GENERATION ERROR'
    );

    console.error(
      '===================================='
    );

    console.error(error);

    return NextResponse.json(
      {
        success: false,

        message:
          'Unable to generate receipt.',

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

