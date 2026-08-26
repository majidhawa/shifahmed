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

/* =========================================================
   HELPERS
========================================================= */

function displayValue(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '';
  }

  return String(value);
}

function formatDate(value: unknown): string {
  if (!value) {
    return '';
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/* =========================================================
   MAIN ROUTE
========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    /* =====================================================
       ADMIN AUTHENTICATION
    ===================================================== */

    await requireAdmin();

    /* =====================================================
       APPLICATION ID
    ===================================================== */

    const { id } = await context.params;

    const applicationId = Number(id);

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid application ID.',
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       GET APPLICATION
       
       Only fields that correspond to the uploaded
       application form are used.
    ===================================================== */

    const result = await pool.query(
      `
        SELECT
          id,

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

          guardian_name,
          guardian_relationship,
          guardian_mobile,
          guardian_email,

          sponsor_type,
          sponsor_name,
          sponsor_relationship,
          sponsor_mobile,
          sponsor_email,

          created_at

        FROM applications

        WHERE id = $1

        LIMIT 1
      `,
      [applicationId]
    );

    /* =====================================================
       APPLICATION NOT FOUND
    ===================================================== */

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application not found.',
        },
        {
          status: 404,
        }
      );
    }

    const application = result.rows[0];

    /* =====================================================
       FILE PATHS
    ===================================================== */

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

    const logoPath = path.join(
      process.cwd(),
      'public',
      'images',
      'logo.jpg'
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
       PDF CONSTANTS
    ===================================================== */

    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;

    const LEFT = 45;
    const RIGHT = 550;

    const CONTENT_WIDTH = RIGHT - LEFT;

    /*
     * The uploaded form uses approximately:
     *
     * left/right margin: 45pt
     * section borders: black
     * red divider
     * blue section titles
     */

    const COLORS = {
      black: '#000000',
      white: '#FFFFFF',
      blue: '#21469A',
      red: '#B31B1B',
      gray: '#333333',
      lightGray: '#F5F5F5',
    };

    /* =====================================================
       PDF DOCUMENT
    ===================================================== */

    const doc = new PDFDocument({
      size: 'A4',

      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },

      autoFirstPage: true,

      bufferPages: true,

      font: regularFontPath,

      info: {
        Title: 'Shifah Medical Training College - Application Form',

        Author:
          'Shifah Medical Training College',

        Subject:
          'Application Form',

        Creator:
          'Shifah Medical Training College',
      },
    });

    /* =====================================================
       REGISTER FONTS
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

    const pdfPromise = new Promise<Buffer>(
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
       BASIC DRAWING HELPERS
    ===================================================== */

    const drawText = (
      text: string,
      x: number,
      y: number,
      width: number,
      fontSize: number,
      bold = false,
      align:
        | 'left'
        | 'center'
        | 'right' = 'left'
    ) => {
      doc
        .fillColor(COLORS.black)
        .font(
          bold
            ? 'SMTC-Bold'
            : 'SMTC-Regular'
        )
        .fontSize(fontSize)
        .text(
          text,
          x,
          y,
          {
            width,
            align,
            lineBreak: false,
          }
        );
    };

    const drawLine = (
      x1: number,
      y: number,
      x2: number,
      lineWidth = 1
    ) => {
      doc
        .moveTo(x1, y)
        .lineTo(x2, y)
        .lineWidth(lineWidth)
        .strokeColor(COLORS.black)
        .stroke();
    };

    const drawBox = (
      x: number,
      y: number,
      width: number,
      height: number,
      lineWidth = 0.8
    ) => {
      doc
        .rect(
          x,
          y,
          width,
          height
        )
        .lineWidth(lineWidth)
        .strokeColor(COLORS.black)
        .stroke();
    };

    /* =====================================================
       HEADER
       
       Matches the uploaded application form.
    ===================================================== */

    const drawHeader = () => {
      /*
       * Logo
       */

      if (fs.existsSync(logoPath)) {
        try {
          doc.image(
            logoPath,
            PAGE_WIDTH / 2 - 42,
            35,
            {
              fit: [84, 84],
              align: 'center',
              valign: 'center',
            }
          );
        } catch (error) {
          console.error(
            'Unable to load logo:',
            error
          );
        }
      }

      /*
       * College name
       */

      drawText(
        'SHIFAH MEDICAL TRAINING COLLEGE',
        45,
        130,
        CONTENT_WIDTH,
        15,
        true,
        'center'
      );

      /*
       * Motto
       */

      drawText(
        'Health through Innovation & research',
        45,
        149,
        CONTENT_WIDTH,
        9,
        true,
        'center'
      );

      /*
       * Address
       */

      drawText(
        'P.O BOX 37-40308, AMBWERE PLAZA, KITALE, KENYA.',
        45,
        174,
        CONTENT_WIDTH,
        8.5,
        true,
        'center'
      );

      /*
       * Telephone
       */

      drawText(
        'TEL: (0722-378-665)',
        45,
        191,
        CONTENT_WIDTH,
        8.5,
        true,
        'center'
      );

      /*
       * Office
       */

      drawText(
        'OFFICE OF THE PRINCIPAL',
        45,
        226,
        CONTENT_WIDTH,
        9,
        true,
        'center'
      );

      /*
       * Email
       */

      drawText(
        'EMAIL: admissions.smtc@gmail.com',
        45,
        242,
        CONTENT_WIDTH,
        8.5,
        true,
        'center'
      );

      /*
       * Repeated motto
       */

      drawText(
        'Health through Innovation & research',
        45,
        258,
        CONTENT_WIDTH,
        8.5,
        false,
        'center'
      );

      /*
       * Red divider
       */

      doc
        .moveTo(33, 286)
        .lineTo(PAGE_WIDTH - 33, 286)
        .lineWidth(2.5)
        .strokeColor(COLORS.red)
        .stroke();
    };

    /* =====================================================
       FORM TITLE
    ===================================================== */

    const drawFormTitle = () => {
      drawText(
        'APPLICATION FORM',
        45,
        299,
        CONTENT_WIDTH,
        11,
        true,
        'center'
      );

      drawText(
        'Please complete this form in BLOCK LETTERS',
        45,
        324,
        CONTENT_WIDTH,
        8.5,
        false,
        'center'
      );
    };

    /* =====================================================
       SECTION HEADER
    ===================================================== */

    const sectionHeader = (
      title: string,
      y: number
    ) => {
      const height = 26;

      doc
        .rect(
          LEFT,
          y,
          CONTENT_WIDTH,
          height
        )
        .lineWidth(0.8)
        .strokeColor(COLORS.black)
        .stroke();

      drawText(
        title,
        LEFT + 5,
        y + 7,
        CONTENT_WIDTH - 10,
        9.5,
        true,
        'center'
      );

      /*
       * Section heading is blue in the
       * original uploaded document.
       */

      doc
        .fillColor(COLORS.blue)
        .font('SMTC-Bold')
        .fontSize(9.5)
        .text(
          title,
          LEFT + 5,
          y + 7,
          {
            width:
              CONTENT_WIDTH - 10,
            align: 'center',
            lineBreak: false,
          }
        );
    };

    /* =====================================================
       LABEL + LINE
    ===================================================== */

    const labelLine = (
      label: string,
      x: number,
      y: number,
      lineStart: number,
      lineEnd: number,
      fontSize = 8.5,
      value?: unknown
    ) => {
      drawText(
        label,
        x,
        y,
        lineStart - x,
        fontSize,
        true
      );

      /*
       * If a value exists, place it on
       * the line.
       */

      const valueText =
        displayValue(value);

      if (valueText) {
        drawText(
          valueText,
          lineStart + 2,
          y - 1,
          lineEnd - lineStart - 4,
          fontSize,
          false
        );
      }

      drawLine(
        lineStart,
        y + 11,
        lineEnd,
        0.9
      );
    };

    /* =====================================================
       PAGE 1
    ===================================================== */

    drawHeader();

    drawFormTitle();

    /* =====================================================
       PERSONAL DATA
    ===================================================== */

    const personalY = 348;

    sectionHeader(
      'PERSONAL DATA',
      personalY
    );

    /*
     * Outer personal-data box.
     *
     * The uploaded form places the section
     * header and fields inside one bordered
     * rectangular area.
     */

    drawBox(
      LEFT,
      personalY,
      CONTENT_WIDTH,
      295
    );

    /*
     * Re-draw header border so it remains
     * visually consistent.
     */

    drawBox(
      LEFT,
      personalY,
      CONTENT_WIDTH,
      26
    );

    /*
     * Name row
     */

    const nameY = personalY + 51;

    labelLine(
      'Surname',
      51,
      nameY,
      118,
      210,
      8.5,
      application.surname
    );

    labelLine(
      'Middle Name',
      210,
      nameY,
      285,
      398,
      8.5,
      application.middle_name
    );

    labelLine(
      'First',
      398,
      nameY,
      425,
      515,
      8.5,
      application.first_name
    );

    /*
     * Date of birth / gender
     */

    const dobY =
      personalY + 76;

    labelLine(
      'Date of Birth:',
      51,
      dobY,
      112,
      190,
      8.5,
      formatDate(
        application.date_of_birth
      )
    );

    drawText(
      'Gender: (Tick)',
      195,
      dobY,
      72,
      8.5,
      true
    );

    drawText(
      `Male [ ${
        String(
          application.gender || ''
        ).toLowerCase() ===
        'male'
          ? 'X'
          : ' '
      } ]`,
      270,
      dobY,
      65,
      8.5,
      false
    );

    drawText(
      `Female [ ${
        String(
          application.gender || ''
        ).toLowerCase() ===
        'female'
          ? 'X'
          : ' '
      } ]`,
      337,
      dobY,
      75,
      8.5,
      false
    );

    /*
     * Date labels
     */

    drawText(
      '(Date)  (Month)  (Year)',
      58,
      dobY + 26,
      145,
      6.5,
      false
    );

    /*
     * Nationality / Country / ID
     */

    const nationalityY =
      personalY + 119;

    labelLine(
      'Nationality:',
      51,
      nationalityY,
      120,
      198,
      8.5,
      application.nationality
    );

    labelLine(
      'Country:',
      198,
      nationalityY,
      253,
      360,
      8.5,
      application.country
    );

    labelLine(
      'I.D/Passport No:',
      360,
      nationalityY,
      447,
      515,
      8.5,
      application.id_passport_number
    );

    /*
     * Marital status
     */

    const maritalY =
      personalY + 144;

    drawText(
      'Marital Status:',
      51,
      maritalY,
      85,
      8.5,
      true
    );

    const marital =
      String(
        application.marital_status ||
        ''
      ).toLowerCase();

    drawText(
      `Single [ ${
        marital === 'single'
          ? 'X'
          : ' '
      } ]`,
      132,
      maritalY,
      75,
      8.5,
      false
    );

    drawText(
      `Married [ ${
        marital === 'married'
          ? 'X'
          : ' '
      } ]`,
      207,
      maritalY,
      82,
      8.5,
      false
    );

    drawText(
      'Other(Specify)',
      290,
      maritalY,
      75,
      8.5,
      true
    );

    drawLine(
      366,
      maritalY + 11,
      485,
      0.9
    );

    /*
     * Religious affiliation
     *
     * No corresponding field exists in
     * the current application query,
     * therefore this remains blank.
     */

    const religionY =
      personalY + 170;

    drawText(
      'Religious Affiliation',
      51,
      religionY,
      125,
      8.5,
      true
    );

    drawText(
      '(Christian, Muslim, Hindu, Specify Other)',
      174,
      religionY,
      225,
      8.5,
      false
    );

    drawLine(
      401,
      religionY + 11,
      515,
      0.9
    );

    /* =====================================================
       CONTACT DETAILS
    ===================================================== */

    const contactY =
      personalY + 195;

    sectionHeader(
      'CONTACT DETAILS',
      contactY
    );

    /*
     * Contact section outer border.
     */

    drawBox(
      LEFT,
      contactY,
      CONTENT_WIDTH,
      126
    );

    drawBox(
      LEFT,
      contactY,
      CONTENT_WIDTH,
      26
    );

    /*
     * Postal address / postal code
     */

    const postalY =
      contactY + 39;

    labelLine(
      'Postal Address:',
      51,
      postalY,
      137,
      315,
      8.5,
      application.postal_address
    );

    labelLine(
      'Postal code:',
      315,
      postalY,
      382,
      445,
      8.5,
      application.postal_code
    );

    /*
     * Town / County
     */

    const townY =
      contactY + 64;

    labelLine(
      'Town:',
      51,
      townY,
      89,
      250,
      8.5,
      application.town
    );

    labelLine(
      'County:',
      250,
      townY,
      305,
      420,
      8.5,
      application.county
    );

    /*
     * Mobile / Home office
     */

    const phoneY =
      contactY + 89;

    labelLine(
      'Mobile:',
      51,
      phoneY,
      98,
      255,
      8.5,
      application.mobile
    );

    labelLine(
      'Home/Office Tel Number:',
      255,
      phoneY,
      388,
      515,
      8.5
    );

    /*
     * Email
     */

    const emailY =
      contactY + 114;

    labelLine(
      'Email:',
      51,
      emailY,
      90,
      390,
      8.5,
      application.email
    );

    /* =====================================================
       PARENT / GUARDIAN / NEXT OF KIN
    ===================================================== */

    const guardianY =
      contactY + 126;

    sectionHeader(
      "PARENT’S/GUARDIANS/NEXTOF KIN’S INFORMATION",
      guardianY
    );

    /*
     * Outer box.
     *
     * The uploaded form has this section
     * extending to the bottom of page 1.
     */

    drawBox(
      LEFT,
      guardianY,
      CONTENT_WIDTH,
      150
    );

    drawBox(
      LEFT,
      guardianY,
      CONTENT_WIDTH,
      26
    );

    /*
     * Name / relationship
     */

    const guardianNameY =
      guardianY + 39;

    labelLine(
      'Name:',
      51,
      guardianNameY,
      88,
      270,
      8.5,
      application.guardian_name
    );

    labelLine(
      'Relationship:',
      270,
      guardianNameY,
      350,
      435,
      8.5,
      application.guardian_relationship
    );

    /*
     * Postal address
     *
     * The current database query does not
     * expose guardian postal details.
     */

    const guardianPostalY =
      guardianY + 64;

    labelLine(
      'Postal Address:',
      51,
      guardianPostalY,
      137,
      315,
      8.5
    );

    labelLine(
      'Postal code:',
      315,
      guardianPostalY,
      382,
      445,
      8.5
    );

    /*
     * Town / County
     */

    const guardianTownY =
      guardianY + 89;

    labelLine(
      'Town:',
      51,
      guardianTownY,
      89,
      250,
      8.5
    );

    labelLine(
      'County:',
      250,
      guardianTownY,
      305,
      420,
      8.5
    );

    /*
     * Mobile / Home Office
     */

    const guardianPhoneY =
      guardianY + 114;

    labelLine(
      'Mobile:',
      51,
      guardianPhoneY,
      98,
      255,
      8.5,
      application.guardian_mobile
    );

    labelLine(
      'Home/Office Tel Number:',
      255,
      guardianPhoneY,
      388,
      515,
      8.5
    );

    /*
     * Email
     */

    const guardianEmailY =
      guardianY + 139;

    labelLine(
      'Email:',
      51,
      guardianEmailY,
      90,
      390,
      8.5,
      application.guardian_email
    );

    /* =====================================================
       PAGE 2
    ===================================================== */

    doc.addPage();

    /*
     * The original second page begins
     * directly with FINANCIAL DATA.
     *
     * No repeated college header is added
     * because the uploaded document does
     * not repeat it on page 2.
     */

    /* =====================================================
       FINANCIAL DATA
    ===================================================== */

    const financialY = 34;

    sectionHeader(
      'FINANCIAL DATA',
      financialY
    );

    /*
     * Outer financial box
     */

    drawBox(
      LEFT,
      financialY,
      CONTENT_WIDTH,
      226
    );

    drawBox(
      LEFT,
      financialY,
      CONTENT_WIDTH,
      26
    );

    /*
     * Sponsor question
     */

    const sponsorQuestionY =
      financialY + 39;

    drawText(
      'Who will sponsor your trainings at SMTC? (Tick)',
      51,
      sponsorQuestionY,
      450,
      8.5,
      true
    );

    /*
     * Sponsor type
     */

    const sponsorType =
      String(
        application.sponsor_type ||
        ''
      ).toLowerCase();

    const sponsorY =
      financialY + 64;

    drawText(
      `Self [ ${
        sponsorType === 'self'
          ? 'X'
          : ' '
      } ]`,
      51,
      sponsorY,
      60,
      8.5
    );

    drawText(
      `Parent [ ${
        sponsorType === 'parent'
          ? 'X'
          : ' '
      } ]`,
      112,
      sponsorY,
      70,
      8.5
    );

    drawText(
      `Guardian [ ${
        sponsorType === 'guardian'
          ? 'X'
          : ' '
      } ]`,
      183,
      sponsorY,
      85,
      8.5
    );

    drawText(
      `Sponsor [ ${
        sponsorType === 'sponsor'
          ? 'X'
          : ' '
      } ]`,
      269,
      sponsorY,
      80,
      8.5
    );

    /*
     * SELF/PARENT/GUARDIAN/SPONSOR INFORMATION
     */

    const sponsorInfoY =
      financialY + 90;

    drawText(
      'SELF/PARENT/GUARDIAN/SPONSOR’S INFORMATION',
      51,
      sponsorInfoY,
      470,
      8.5,
      true
    );

    /*
     * Name / Relationship
     */

    const sponsorNameY =
      financialY + 115;

    labelLine(
      'Name:',
      51,
      sponsorNameY,
      88,
      270,
      8.5,
      application.sponsor_name
    );

    labelLine(
      'Relationship:',
      270,
      sponsorNameY,
      350,
      435,
      8.5,
      application.sponsor_relationship
    );

    /*
     * Postal Address / Postal Code
     *
     * These fields are not currently
     * available in the database query.
     */

    const sponsorPostalY =
      financialY + 140;

    labelLine(
      'Postal Address:',
      51,
      sponsorPostalY,
      137,
      315,
      8.5
    );

    labelLine(
      'Postal code:',
      315,
      sponsorPostalY,
      382,
      445,
      8.5
    );

    /*
     * Town / Country
     */

    const sponsorTownY =
      financialY + 165;

    labelLine(
      'Town:',
      51,
      sponsorTownY,
      89,
      250,
      8.5
    );

    labelLine(
      'Country:',
      250,
      sponsorTownY,
      305,
      420,
      8.5
    );

    /*
     * Mobile / Home Office
     */

    const sponsorPhoneY =
      financialY + 190;

    labelLine(
      'Mobile:',
      51,
      sponsorPhoneY,
      98,
      255,
      8.5,
      application.sponsor_mobile
    );

    labelLine(
      'Home/Office Tel Number:',
      255,
      sponsorPhoneY,
      388,
      515,
      8.5
    );

    /*
     * Email
     */

    const sponsorEmailY =
      financialY + 215;

    labelLine(
      'Email:',
      51,
      sponsorEmailY,
      90,
      390,
      8.5,
      application.sponsor_email
    );

    /* =====================================================
       PASSPORT PHOTO INSTRUCTION
    ===================================================== */

    drawText(
      'ATTACH PASSPORT PHOTO ON THIS APPLICATION FORM',
      45,
      280,
      CONTENT_WIDTH,
      9.5,
      true,
      'center'
    );

    /* =====================================================
       FINISH PDF
    ===================================================== */

    doc.end();

    const pdf =
      await pdfPromise;

    /* =====================================================
       SAFE FILE NAME
    ===================================================== */

    const applicantName = [
      application.first_name,
      application.middle_name,
      application.surname,
    ]
      .filter(Boolean)
      .join('-')
      .replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      );

    const safeFileName =
      applicantName ||
      `Application-${applicationId}`;

    /* =====================================================
       RETURN PDF
    ===================================================== */

    return new NextResponse(
      new Uint8Array(pdf),
      {
        status: 200,

        headers: {
          'Content-Type':
            'application/pdf',

          'Content-Disposition':
            `attachment; filename="SMTC-Application-${safeFileName}.pdf"`,

          'Content-Length':
            String(pdf.length),

          'Cache-Control':
            'no-store, no-cache, must-revalidate',

          Pragma: 'no-cache',

          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error(
      '===================================='
    );

    console.error(
      'APPLICATION PDF GENERATION ERROR'
    );

    console.error(
      '===================================='
    );

    console.error(error);

    return NextResponse.json(
      {
        success: false,

        message:
          'Unable to generate application PDF.',

        error:
          error instanceof Error
            ? error.message
            : String(error),

        stack:
          error instanceof Error
            ? error.stack
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}