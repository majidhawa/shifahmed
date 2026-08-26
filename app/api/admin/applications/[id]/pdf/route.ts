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
   TYPES
========================================================= */

type Field = {
  label: string;
  value: unknown;
};

/* =========================================================
   HELPERS
========================================================= */

/**
 * Safely convert a value to a printable string.
 */
function displayValue(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return '—';
  }

  return String(value);
}

/**
 * Format database date values for Kenya.
 */
function formatDate(value: unknown): string {
  if (!value) {
    return '—';
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format Kenyan currency.
 */
function formatCurrency(value: unknown): string {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Make a safe PDF filename.
 */
function safeFileName(value: unknown): string {
  return String(value || 'application').replace(
    /[^a-zA-Z0-9_-]/g,
    '_'
  );
}

/**
 * Check whether a string is an HTTP/HTTPS URL.
 */
function isHttpUrl(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://')
  );
}

/**
 * Load passport photo from database value.
 *
 * Supported:
 *
 * 1. Base64:
 *    data:image/jpeg;base64,...
 *
 * 2. Remote URL:
 *    https://...
 *
 * 3. Public path:
 *    /uploads/applications/photo.jpg
 *
 * 4. Relative path:
 *    uploads/applications/photo.jpg
 */
async function getImageBuffer(
  imageValue: unknown
): Promise<Buffer | null> {
  if (
    imageValue === null ||
    imageValue === undefined
  ) {
    return null;
  }

  const image = String(imageValue).trim();

  if (!image) {
    return null;
  }

  try {
    /* =====================================================
       BASE64 IMAGE
    ===================================================== */

    if (image.startsWith('data:image/')) {
      const commaIndex = image.indexOf(',');

      if (commaIndex === -1) {
        return null;
      }

      const base64Data =
        image.substring(commaIndex + 1);

      if (!base64Data) {
        return null;
      }

      return Buffer.from(
        base64Data,
        'base64'
      );
    }

    /* =====================================================
       HTTP / HTTPS IMAGE
    ===================================================== */

    if (isHttpUrl(image)) {
      const response = await fetch(image, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        console.error(
          `Unable to fetch passport photo. HTTP status: ${response.status}`
        );

        return null;
      }

      const contentType =
        response.headers.get('content-type');

      if (
        contentType &&
        !contentType.startsWith('image/')
      ) {
        console.warn(
          `Passport photo URL returned content type: ${contentType}`
        );
      }

      const arrayBuffer =
        await response.arrayBuffer();

      return Buffer.from(arrayBuffer);
    }

    /* =====================================================
       LOCAL FILE
    ===================================================== */

    let filePath = image;

    /*
     * Example:
     *
     * /uploads/applications/photo.jpg
     *
     * becomes:
     *
     * <project>/public/uploads/applications/photo.jpg
     */

    if (image.startsWith('/')) {
      filePath = path.join(
        process.cwd(),
        'public',
        image.replace(/^\/+/, '')
      );
    }

    /*
     * Example:
     *
     * uploads/applications/photo.jpg
     */

    else if (!path.isAbsolute(image)) {
      filePath = path.join(
        process.cwd(),
        'public',
        image
      );
    }

    if (!fs.existsSync(filePath)) {
      console.error(
        `Passport photo file does not exist: ${filePath}`
      );

      return null;
    }

    return fs.readFileSync(filePath);
  } catch (error) {
    console.error(
      'Error loading passport photo:',
      error
    );

    return null;
  }
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
       FETCH APPLICATION
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

          application_fee,
          payment_status,
          application_status,

          declaration,
          created_at,

          passport_photo

        FROM applications

        WHERE id = $1

        LIMIT 1
      `,
      [applicationId]
    );

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
       APPLICANT NAME
    ===================================================== */

    const studentName =
      [
        application.first_name,
        application.middle_name,
        application.surname,
      ]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Applicant';

    /* =====================================================
       LOAD PASSPORT PHOTO
    ===================================================== */

    const passportPhotoBuffer =
      await getImageBuffer(
        application.passport_photo
      );

    /* =====================================================
       ASSET PATHS
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
       BRAND COLORS
    ===================================================== */

    const COLORS = {
      green: '#047857',
      darkGreen: '#065F46',
      deepGreen: '#064E3B',

      gold: '#C9A227',
      darkGold: '#A67C00',

      white: '#FFFFFF',
      black: '#111827',

      darkGray: '#374151',
      gray: '#6B7280',
      muted: '#9CA3AF',

      lightGray: '#F3F4F6',
      lighterGray: '#F8FAFC',

      border: '#D1D5DB',

      success: '#047857',
      warning: '#A16207',
      danger: '#B91C1C',
      blue: '#1D4ED8',

      softGreen: '#ECFDF5',
      softRed: '#FEF2F2',
      softGold: '#FFFBEB',
      softBlue: '#EFF6FF',
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

      bufferPages: true,

      font: regularFontPath,

      info: {
        Title:
          `SMTC Student Application - ${displayValue(
            application.application_number
          )}`,

        Author:
          'Shifah Medical Training College',

        Subject:
          'Official Student Application Record',

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

    const pdfPromise =
      new Promise<Buffer>(
        (resolve, reject) => {
          doc.on('end', () => {
            resolve(
              Buffer.concat(chunks)
            );
          });

          doc.on(
            'error',
            reject
          );
        }
      );

    /* =====================================================
       PAGE DIMENSIONS
    ===================================================== */

    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;

    const LEFT = 42;
    const RIGHT = 553;

    const CONTENT_WIDTH =
      RIGHT - LEFT;

    /*
     * Header and footer boundaries.
     */

    const HEADER_BOTTOM = 112;

    const FOOTER_HEIGHT = 52;

    const CONTENT_TOP = 122;

    const CONTENT_BOTTOM =
      PAGE_HEIGHT -
      FOOTER_HEIGHT -
      14;

    /* =====================================================
       TEXT HELPER
    ===================================================== */

    const drawText = (
      value: unknown,
      x: number,
      y: number,
      width: number,
      size = 8,
      bold = false,
      color = COLORS.black,
      align:
        | 'left'
        | 'center'
        | 'right' = 'left'
    ) => {
      doc
        .font(
          bold
            ? 'SMTC-Bold'
            : 'SMTC-Regular'
        )
        .fontSize(size)
        .fillColor(color)
        .text(
          displayValue(value),
          x,
          y,
          {
            width,
            align,
            lineGap: 1,
          }
        );
    };

    /* =====================================================
       LINE HELPER
    ===================================================== */

    const drawLine = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color = COLORS.border,
      width = 0.7
    ) => {
      doc
        .moveTo(x1, y1)
        .lineTo(x2, y2)
        .lineWidth(width)
        .strokeColor(color)
        .stroke();
    };

    /* =====================================================
       HEADER
    ===================================================== */

    const drawHeader = () => {
      /*
       * Green strip
       */

      doc
        .rect(
          0,
          0,
          PAGE_WIDTH,
          7
        )
        .fill(COLORS.green);

      /*
       * Gold strip
       */

      doc
        .rect(
          0,
          7,
          PAGE_WIDTH,
          3
        )
        .fill(COLORS.gold);

      /*
       * Logo
       */

      if (fs.existsSync(logoPath)) {
        try {
          doc.image(
            logoPath,
            LEFT,
            25,
            {
              fit: [65, 65],
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
        120,
        27,
        390,
        16,
        true,
        COLORS.deepGreen,
        'center'
      );

      /*
       * Motto
       */

      drawText(
        'Health through Innovation & research',
        120,
        49,
        390,
        8,
        true,
        COLORS.darkGold,
        'center'
      );

      /*
       * Address
       */

      drawText(
        'P.O BOX 37-40308, AMBWERE PLAZA, KITALE, KENYA',
        120,
        65,
        390,
        7.2,
        true,
        COLORS.darkGray,
        'center'
      );

      /*
       * Contact
       */

      drawText(
        'TEL: (0722-378-665)  |  EMAIL: admissions.smtc@gmail.com',
        120,
        78,
        390,
        7.2,
        false,
        COLORS.gray,
        'center'
      );

      /*
       * Header divider
       */

      drawLine(
        LEFT,
        HEADER_BOTTOM,
        RIGHT,
        HEADER_BOTTOM,
        COLORS.gold,
        1.4
      );
    };

    /* =====================================================
       FOOTER
    ===================================================== */

    const drawFooter = (
      pageNumber: number,
      totalPages: number
    ) => {
      const footerY =
        PAGE_HEIGHT -
        FOOTER_HEIGHT;

      drawLine(
        LEFT,
        footerY,
        RIGHT,
        footerY,
        COLORS.gold,
        0.9
      );

      drawText(
        'SHIFAH MEDICAL TRAINING COLLEGE',
        LEFT,
        footerY + 8,
        CONTENT_WIDTH,
        6.5,
        true,
        COLORS.deepGreen,
        'center'
      );

      drawText(
        'Health through Innovation & research',
        LEFT,
        footerY + 19,
        CONTENT_WIDTH,
        6,
        false,
        COLORS.gray,
        'center'
      );

      drawText(
        `Application ${displayValue(
          application.application_number
        )}  •  Page ${pageNumber} of ${totalPages}`,
        LEFT,
        footerY + 30,
        CONTENT_WIDTH,
        6,
        false,
        COLORS.gray,
        'center'
      );
    };

    /* =====================================================
       DOCUMENT TITLE
    ===================================================== */

    const drawDocumentTitle = (
      title: string,
      subtitle: string
    ) => {
      drawText(
        title,
        LEFT,
        CONTENT_TOP,
        CONTENT_WIDTH,
        17,
        true,
        COLORS.deepGreen,
        'center'
      );

      drawText(
        subtitle,
        LEFT,
        CONTENT_TOP + 25,
        CONTENT_WIDTH,
        7.5,
        true,
        COLORS.darkGold,
        'center'
      );
    };

    /* =====================================================
       SECTION HEADER
    ===================================================== */

    const drawSection = (
      title: string,
      y: number,
      color = COLORS.deepGreen
    ) => {
      const height = 27;

      doc
        .roundedRect(
          LEFT,
          y,
          CONTENT_WIDTH,
          height,
          4
        )
        .fill(color);

      /*
       * Gold accent
       */

      doc
        .rect(
          LEFT,
          y,
          5,
          height
        )
        .fill(COLORS.gold);

      drawText(
        title,
        LEFT + 15,
        y + 8,
        CONTENT_WIDTH - 25,
        8.5,
        true,
        COLORS.white
      );

      return y + 34;
    };

    /* =====================================================
       THREE COLUMN TABLE
    ===================================================== */

    const drawThreeColumnTable = (
      fields: Field[],
      startY: number,
      rowHeight = 32
    ) => {
      const columnWidth =
        CONTENT_WIDTH / 3;

      let y = startY;

      for (
        let i = 0;
        i < fields.length;
        i += 3
      ) {
        const rowFields =
          fields.slice(i, i + 3);

        const rowIndex =
          Math.floor(i / 3);

        const background =
          rowIndex % 2 === 0
            ? COLORS.white
            : COLORS.lighterGray;

        /*
         * Draw all three cells.
         */

        for (
          let column = 0;
          column < 3;
          column++
        ) {
          const x =
            LEFT +
            column *
              columnWidth;

          doc
            .rect(
              x,
              y,
              columnWidth,
              rowHeight
            )
            .fill(background);

          doc
            .rect(
              x,
              y,
              columnWidth,
              rowHeight
            )
            .lineWidth(0.5)
            .strokeColor(
              COLORS.border
            )
            .stroke();
        }

        /*
         * Draw actual fields.
         */

        rowFields.forEach(
          (item, column) => {
            const x =
              LEFT +
              column *
                columnWidth;

            drawText(
              item.label.toUpperCase(),
              x + 8,
              y + 6,
              columnWidth - 16,
              5.7,
              true,
              COLORS.gray
            );

            drawText(
              item.value,
              x + 8,
              y + 18,
              columnWidth - 16,
              7.2,
              true,
              COLORS.black
            );
          }
        );

        y += rowHeight;
      }

      return y;
    };

    /* =====================================================
       TWO COLUMN TABLE
    ===================================================== */

    const drawTwoColumnTable = (
      fields: Field[],
      startY: number,
      rowHeight = 30
    ) => {
      const labelWidth = 145;

      const valueWidth =
        CONTENT_WIDTH -
        labelWidth;

      let y = startY;

      /*
       * Table header
       */

      doc
        .rect(
          LEFT,
          y,
          CONTENT_WIDTH,
          23
        )
        .fill(COLORS.deepGreen);

      drawText(
        'FIELD',
        LEFT + 10,
        y + 6,
        labelWidth - 20,
        6.3,
        true,
        COLORS.white
      );

      drawText(
        'INFORMATION',
        LEFT + labelWidth + 10,
        y + 6,
        valueWidth - 20,
        6.3,
        true,
        COLORS.white
      );

      drawLine(
        LEFT + labelWidth,
        y,
        LEFT + labelWidth,
        y + 23,
        COLORS.white,
        0.6
      );

      y += 23;

      fields.forEach(
        (item, index) => {
          const background =
            index % 2 === 0
              ? COLORS.white
              : COLORS.lighterGray;

          doc
            .rect(
              LEFT,
              y,
              CONTENT_WIDTH,
              rowHeight
            )
            .fill(background);

          doc
            .rect(
              LEFT,
              y,
              CONTENT_WIDTH,
              rowHeight
            )
            .lineWidth(0.5)
            .strokeColor(
              COLORS.border
            )
            .stroke();

          drawLine(
            LEFT + labelWidth,
            y,
            LEFT + labelWidth,
            y + rowHeight,
            COLORS.border,
            0.5
          );

          drawText(
            item.label,
            LEFT + 10,
            y + 8,
            labelWidth - 20,
            6.8,
            true,
            COLORS.gray
          );

          drawText(
            item.value,
            LEFT + labelWidth + 10,
            y + 7,
            valueWidth - 20,
            7.2,
            true,
            COLORS.black
          );

          y += rowHeight;
        }
      );

      return y;
    };

    /* =====================================================
       STATUS BOX
    ===================================================== */

    const drawStatusBox = (
      label: string,
      value: unknown,
      x: number,
      y: number,
      width: number,
      height = 54
    ) => {
      const normalized =
        String(value || '')
          .toLowerCase();

      let background =
        COLORS.softGreen;

      let foreground =
        COLORS.success;

      if (
        normalized.includes('rejected') ||
        normalized.includes('declined')
      ) {
        background =
          COLORS.softRed;

        foreground =
          COLORS.danger;
      } else if (
        normalized.includes('pending') ||
        normalized.includes('awaiting')
      ) {
        background =
          COLORS.softGold;

        foreground =
          COLORS.warning;
      } else if (
        normalized.includes('processing')
      ) {
        background =
          COLORS.softBlue;

        foreground =
          COLORS.blue;
      }

      doc
        .roundedRect(
          x,
          y,
          width,
          height,
          5
        )
        .fill(background);

      doc
        .roundedRect(
          x,
          y,
          width,
          height,
          5
        )
        .lineWidth(0.7)
        .strokeColor(
          COLORS.border
        )
        .stroke();

      /*
       * Gold accent.
       */

      doc
        .rect(
          x,
          y,
          width,
          4
        )
        .fill(COLORS.gold);

      drawText(
        label.toUpperCase(),
        x + 10,
        y + 10,
        width - 20,
        5.8,
        true,
        COLORS.gray
      );

      drawText(
        value,
        x + 10,
        y + 25,
        width - 20,
        8,
        true,
        foreground
      );
    };

    /* =====================================================
       APPLICATION SUMMARY
    ===================================================== */

    const drawApplicationSummary = (
      startY: number
    ) => {
      const gap = 10;

      const width =
        (CONTENT_WIDTH -
          gap * 2) /
        3;

      drawStatusBox(
        'Application Number',
        application.application_number,
        LEFT,
        startY,
        width
      );

      drawStatusBox(
        'Application Status',
        application.application_status,
        LEFT + width + gap,
        startY,
        width
      );

      drawStatusBox(
        'Payment Status',
        application.payment_status,
        LEFT +
          (width + gap) * 2,
        startY,
        width
      );

      return startY + 66;
    };

    /* =====================================================
       PASSPORT PHOTO
    ===================================================== */

    const drawPassportPhoto = (
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      /*
       * Outer frame.
       */

      doc
        .roundedRect(
          x,
          y,
          width,
          height,
          5
        )
        .fill(COLORS.white);

      doc
        .roundedRect(
          x,
          y,
          width,
          height,
          5
        )
        .lineWidth(1)
        .strokeColor(
          COLORS.gold
        )
        .stroke();

      /*
       * Uploaded photo.
       */

      if (passportPhotoBuffer) {
        try {
          doc.save();

          /*
           * Clip image to frame.
           */

          doc
            .roundedRect(
              x + 3,
              y + 3,
              width - 6,
              height - 6,
              3
            )
            .clip();

          doc.image(
            passportPhotoBuffer,
            x + 3,
            y + 3,
            {
              fit: [
                width - 6,
                height - 6,
              ],
              align: 'center',
              valign: 'center',
            }
          );

          doc.restore();

          drawText(
            'PASSPORT PHOTO',
            x,
            y + height + 6,
            width,
            6,
            true,
            COLORS.gray,
            'center'
          );
        } catch (error) {
          console.error(
            'Unable to render passport photo:',
            error
          );

          drawPassportPlaceholder(
            x,
            y,
            width,
            height
          );
        }
      } else {
        drawPassportPlaceholder(
          x,
          y,
          width,
          height
        );
      }
    };

    /* =====================================================
       PASSPORT PHOTO PLACEHOLDER
    ===================================================== */

    const drawPassportPlaceholder = (
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      doc
        .roundedRect(
          x + 5,
          y + 5,
          width - 10,
          height - 10,
          3
        )
        .lineWidth(0.8)
        .dash(3, {
          space: 3,
        })
        .strokeColor(
          COLORS.gold
        )
        .stroke();

      doc.undash();

      drawText(
        'PASSPORT',
        x + 5,
        y + height / 2 - 16,
        width - 10,
        7,
        true,
        COLORS.gray,
        'center'
      );

      drawText(
        'PHOTO',
        x + 5,
        y + height / 2 - 3,
        width - 10,
        7,
        true,
        COLORS.gray,
        'center'
      );

      drawText(
        'NOT AVAILABLE',
        x + 5,
        y + height + 6,
        width - 10,
        6,
        true,
        COLORS.danger,
        'center'
      );
    };

    /* =====================================================
       OFFICIAL USE FIELD
    ===================================================== */

    const drawOfficialField = (
      label: string,
      x: number,
      y: number,
      width: number
    ) => {
      const height = 47;

      doc
        .roundedRect(
          x,
          y,
          width,
          height,
          4
        )
        .fill(COLORS.white);

      doc
        .roundedRect(
          x,
          y,
          width,
          height,
          4
        )
        .lineWidth(0.6)
        .strokeColor(
          COLORS.border
        )
        .stroke();

      /*
       * Gold accent.
       */

      doc
        .rect(
          x,
          y,
          3,
          height
        )
        .fill(COLORS.gold);

      drawText(
        label.toUpperCase(),
        x + 9,
        y + 8,
        width - 18,
        5.8,
        true,
        COLORS.gray
      );

      drawLine(
        x + 9,
        y + 34,
        x + width - 9,
        y + 34,
        COLORS.border,
        0.7
      );
    };

    /* =====================================================
       PAGE 1
    ===================================================== */

    drawHeader();

    drawDocumentTitle(
      'STUDENT APPLICATION FORM',
      'OFFICIAL APPLICATION RECORD'
    );

    let y =
      CONTENT_TOP + 48;

    /*
     * Application summary.
     */

    y =
      drawApplicationSummary(y);

    y += 7;

    /* =====================================================
       PERSONAL INFORMATION
    ===================================================== */

    y =
      drawSection(
        '1. PERSONAL INFORMATION',
        y
      );

    const photoWidth = 82;
    const photoHeight = 104;

    const photoGap = 12;

    const photoX =
      RIGHT -
      photoWidth -
      4;

    const personalStartY =
      y;

    /*
     * Table beside passport photo.
     */

    const personalTableWidth =
      CONTENT_WIDTH -
      photoWidth -
      photoGap;

    const personalColumnWidth =
      personalTableWidth / 3;

    const personalRowHeight = 40;

    const personalFields: Field[] = [
      {
        label: 'Surname',
        value:
          application.surname,
      },
      {
        label: 'Middle Name',
        value:
          application.middle_name,
      },
      {
        label: 'First Name',
        value:
          application.first_name,
      },
      {
        label: 'Date of Birth',
        value:
          formatDate(
            application.date_of_birth
          ),
      },
      {
        label: 'Gender',
        value:
          application.gender,
      },
      {
        label: 'Nationality',
        value:
          application.nationality,
      },
      {
        label: 'Country',
        value:
          application.country,
      },
      {
        label: 'ID / Passport Number',
        value:
          application.id_passport_number,
      },
      {
        label: 'Marital Status',
        value:
          application.marital_status,
      },
    ];

    for (
      let i = 0;
      i < personalFields.length;
      i += 3
    ) {
      const rowFields =
        personalFields.slice(
          i,
          i + 3
        );

      const row =
        Math.floor(i / 3);

      const fieldY =
        personalStartY +
        row *
          personalRowHeight;

      const background =
        row % 2 === 0
          ? COLORS.white
          : COLORS.lighterGray;

      /*
       * Draw cells.
       */

      for (
        let column = 0;
        column < 3;
        column++
      ) {
        const x =
          LEFT +
          column *
            personalColumnWidth;

        doc
          .rect(
            x,
            fieldY,
            personalColumnWidth,
            personalRowHeight
          )
          .fill(background);

        doc
          .rect(
            x,
            fieldY,
            personalColumnWidth,
            personalRowHeight
          )
          .lineWidth(0.5)
          .strokeColor(
            COLORS.border
          )
          .stroke();
      }

      rowFields.forEach(
        (item, column) => {
          const x =
            LEFT +
            column *
              personalColumnWidth;

          drawText(
            item.label.toUpperCase(),
            x + 8,
            fieldY + 6,
            personalColumnWidth - 16,
            5.5,
            true,
            COLORS.gray
          );

          drawText(
            item.value,
            x + 8,
            fieldY + 18,
            personalColumnWidth - 16,
            7,
            true,
            COLORS.black
          );
        }
      );
    }

    /*
     * Passport photo remains on Page 1.
     */

    drawPassportPhoto(
      photoX,
      personalStartY,
      photoWidth,
      photoHeight
    );

    y =
      personalStartY +
      Math.ceil(
        personalFields.length / 3
      ) *
        personalRowHeight +
      9;

    /* =====================================================
       CONTACT INFORMATION
    ===================================================== */

    y =
      drawSection(
        '2. CONTACT INFORMATION',
        y
      );

    y =
      drawThreeColumnTable(
        [
          {
            label: 'Mobile Number',
            value:
              application.mobile,
          },
          {
            label: 'Email Address',
            value:
              application.email,
          },
          {
            label: 'Town',
            value:
              application.town,
          },
          {
            label: 'County',
            value:
              application.county,
          },
          {
            label: 'Postal Address',
            value:
              application.postal_address,
          },
          {
            label: 'Postal Code',
            value:
              application.postal_code,
          },
        ],
        y,
        31
      );

    y += 8;

    /* =====================================================
       GUARDIAN
    ===================================================== */

    y =
      drawSection(
        '3. PARENT / GUARDIAN / NEXT OF KIN',
        y
      );

    drawThreeColumnTable(
      [
        {
          label: 'Name',
          value:
            application.guardian_name,
        },
        {
          label: 'Relationship',
          value:
            application.guardian_relationship,
        },
        {
          label: 'Mobile Number',
          value:
            application.guardian_mobile,
        },
        {
          label: 'Email Address',
          value:
            application.guardian_email,
        },
      ],
      y,
      31
    );

    /* =====================================================
       PAGE 2
    ===================================================== */

    doc.addPage();

    drawHeader();

    drawDocumentTitle(
      'STUDENT APPLICATION FORM',
      'ACADEMIC & ADMISSION INFORMATION'
    );

    y =
      CONTENT_TOP + 48;

    /* =====================================================
       ACADEMIC INFORMATION
    ===================================================== */

    y =
      drawSection(
        '4. ACADEMIC INFORMATION',
        y
      );

    y =
      drawThreeColumnTable(
        [
          {
            label: 'KCSE Index Number',
            value:
              application.kcse_index,
          },
          {
            label: 'KCSE Year',
            value:
              application.kcse_year,
          },
          {
            label: 'KCSE Mean Grade',
            value:
              application.kcse_mean_grade,
          },
          {
            label: 'English Grade',
            value:
              application.english_grade,
          },
          {
            label: 'Kiswahili Grade',
            value:
              application.kiswahili_grade,
          },
          {
            label: 'Biology Grade',
            value:
              application.biology_grade,
          },
          {
            label: 'Chemistry Grade',
            value:
              application.chemistry_grade,
          },
          {
            label: 'Physics Grade',
            value:
              application.physics_grade,
          },
          {
            label: 'Mathematics Grade',
            value:
              application.mathematics_grade,
          },
        ],
        y,
        29
      );

    y += 7;

    /* =====================================================
       PREVIOUS EDUCATION
    ===================================================== */

    y =
      drawSection(
        '5. PREVIOUS EDUCATION',
        y
      );

    y =
      drawTwoColumnTable(
        [
          {
            label:
              'Previous Institution',
            value:
              application.previous_institution,
          },
          {
            label:
              'Highest Qualification',
            value:
              application.highest_qualification,
          },
        ],
        y,
        29
      );

    y += 7;

    /* =====================================================
       COURSE & INTAKE
    ===================================================== */

    y =
      drawSection(
        '6. COURSE & INTAKE',
        y,
        COLORS.green
      );

    y =
      drawTwoColumnTable(
        [
          {
            label:
              'Selected Course',
            value:
              application.course,
          },
          {
            label:
              'Intake',
            value:
              application.intake,
          },
        ],
        y,
        29
      );

    y += 7;

    /* =====================================================
       SPONSOR INFORMATION
    ===================================================== */

    y =
      drawSection(
        '7. SPONSOR INFORMATION',
        y
      );

    y =
      drawThreeColumnTable(
        [
          {
            label: 'Sponsor Type',
            value:
              application.sponsor_type,
          },
          {
            label: 'Sponsor Name',
            value:
              application.sponsor_name,
          },
          {
            label: 'Relationship',
            value:
              application.sponsor_relationship,
          },
          {
            label: 'Mobile Number',
            value:
              application.sponsor_mobile,
          },
          {
            label: 'Email Address',
            value:
              application.sponsor_email,
          },
        ],
        y,
        29
      );

    y += 7;

    /* =====================================================
       APPLICATION & PAYMENT
    ===================================================== */

    y =
      drawSection(
        '8. APPLICATION & PAYMENT',
        y,
        COLORS.green
      );

    /*
     * IMPORTANT:
     *
     * This table is intentionally compact so that
     * Application Date and Declaration remain safely
     * above the footer.
     */

    drawThreeColumnTable(
      [
        {
          label:
            'Application Fee',
          value:
            formatCurrency(
              application.application_fee
            ),
        },
        {
          label:
            'Payment Status',
          value:
            application.payment_status,
        },
        {
          label:
            'Application Status',
          value:
            application.application_status,
        },
        {
          label:
            'Application Date',
          value:
            formatDate(
              application.created_at
            ),
        },
        {
          label:
            'Declaration',
          value:
            application.declaration
              ? 'Accepted'
              : 'Not Accepted',
        },
      ],
      y,
      31
    );

    /*
     * Page 2 ends here.
     *
     * Nothing else is drawn below this section.
     */

    /* =====================================================
       PAGE 3
    ===================================================== */

    doc.addPage();

    drawHeader();

    drawDocumentTitle(
      'APPLICATION REVIEW',
      'DECLARATION & OFFICIAL USE'
    );

    y =
      CONTENT_TOP + 48;

    /* =====================================================
       APPLICANT PROFILE
    ===================================================== */

    y =
      drawSection(
        '9. APPLICANT PROFILE',
        y
      );

    const profileHeight = 100;

    doc
      .roundedRect(
        LEFT,
        y,
        CONTENT_WIDTH,
        profileHeight,
        6
      )
      .fill(
        COLORS.softGreen
      );

    doc
      .roundedRect(
        LEFT,
        y,
        CONTENT_WIDTH,
        profileHeight,
        6
      )
      .lineWidth(0.8)
      .strokeColor(
        COLORS.border
      )
      .stroke();

    /*
     * Gold accent.
     */

    doc
      .rect(
        LEFT,
        y,
        6,
        profileHeight
      )
      .fill(COLORS.gold);

    drawText(
      studentName,
      LEFT + 20,
      y + 17,
      CONTENT_WIDTH - 40,
      17,
      true,
      COLORS.deepGreen,
      'center'
    );

    drawText(
      `Application Number: ${displayValue(
        application.application_number
      )}`,
      LEFT + 20,
      y + 45,
      CONTENT_WIDTH - 40,
      8,
      true,
      COLORS.darkGray,
      'center'
    );

    drawText(
      application.course,
      LEFT + 20,
      y + 63,
      CONTENT_WIDTH - 40,
      8,
      true,
      COLORS.green,
      'center'
    );

    drawText(
      `Intake: ${displayValue(
        application.intake
      )}`,
      LEFT + 20,
      y + 80,
      CONTENT_WIDTH - 40,
      7.5,
      false,
      COLORS.gray,
      'center'
    );

    y += 114;

    /* =====================================================
       APPLICATION STATUS
    ===================================================== */

    y =
      drawSection(
        '10. APPLICATION STATUS',
        y,
        COLORS.green
      );

    const statusGap = 10;

    const statusWidth =
      (CONTENT_WIDTH -
        statusGap * 2) /
      3;

    drawStatusBox(
      'Application Status',
      application.application_status,
      LEFT,
      y,
      statusWidth
    );

    drawStatusBox(
      'Payment Status',
      application.payment_status,
      LEFT +
        statusWidth +
        statusGap,
      y,
      statusWidth
    );

    drawStatusBox(
      'Application Fee',
      formatCurrency(
        application.application_fee
      ),
      LEFT +
        (statusWidth +
          statusGap) *
          2,
      y,
      statusWidth
    );

    y += 68;

    /* =====================================================
       DECLARATION
    ===================================================== */

    y =
      drawSection(
        '11. DECLARATION',
        y
      );

    const declarationHeight = 140;

    doc
      .roundedRect(
        LEFT,
        y,
        CONTENT_WIDTH,
        declarationHeight,
        6
      )
      .fill(
        COLORS.lighterGray
      );

    doc
      .roundedRect(
        LEFT,
        y,
        CONTENT_WIDTH,
        declarationHeight,
        6
      )
      .lineWidth(0.7)
      .strokeColor(
        COLORS.border
      )
      .stroke();

    /*
     * Declaration text.
     */

    drawText(
      'I declare that the information provided in this application is true, complete and accurate to the best of my knowledge. I understand that providing false or misleading information may affect my admission or continued enrollment at Shifah Medical Training College.',
      LEFT + 18,
      y + 17,
      CONTENT_WIDTH - 36,
      8.2,
      false,
      COLORS.darkGray
    );

    const declarationAccepted =
      Boolean(
        application.declaration
      );

    /*
     * Declaration badge.
     */

    const badgeY =
      y + 91;

    doc
      .roundedRect(
        LEFT + 18,
        badgeY,
        190,
        30,
        4
      )
      .fill(
        declarationAccepted
          ? COLORS.softGreen
          : COLORS.softRed
      );

    doc
      .roundedRect(
        LEFT + 18,
        badgeY,
        190,
        30,
        4
      )
      .lineWidth(0.7)
      .strokeColor(
        declarationAccepted
          ? COLORS.success
          : COLORS.danger
      )
      .stroke();

    drawText(
      declarationAccepted
        ? 'DECLARATION ACCEPTED'
        : 'DECLARATION NOT ACCEPTED',
      LEFT + 28,
      badgeY + 10,
      170,
      7,
      true,
      declarationAccepted
        ? COLORS.success
        : COLORS.danger,
      'center'
    );

    /*
     * Submission date.
     */

    drawText(
      `Submitted: ${formatDate(
        application.created_at
      )}`,
      LEFT + 225,
      badgeY + 10,
      265,
      7.2,
      false,
      COLORS.gray,
      'right'
    );

    y += declarationHeight + 17;

    /* =====================================================
       OFFICIAL USE
    ===================================================== */

    y =
      drawSection(
        '12. FOR OFFICIAL USE ONLY',
        y,
        COLORS.green
      );

    const officialHeight = 148;

    /*
     * Outer official-use container.
     */

    doc
      .roundedRect(
        LEFT,
        y,
        CONTENT_WIDTH,
        officialHeight,
        6
      )
      .fill(COLORS.white);

    doc
      .roundedRect(
        LEFT,
        y,
        CONTENT_WIDTH,
        officialHeight,
        6
      )
      .lineWidth(0.8)
      .strokeColor(
        COLORS.border
      )
      .stroke();

    /*
     * Gold top accent.
     */

    doc
      .rect(
        LEFT,
        y,
        CONTENT_WIDTH,
        4
      )
      .fill(COLORS.gold);

    /*
     * Three official fields.
     */

    const officialGap = 9;

    const officialWidth =
      (CONTENT_WIDTH -
        24 -
        officialGap * 2) /
      3;

    drawOfficialField(
      'Reviewed By',
      LEFT + 12,
      y + 16,
      officialWidth
    );

    drawOfficialField(
      'Admission Decision',
      LEFT +
        12 +
        officialWidth +
        officialGap,
      y + 16,
      officialWidth
    );

    drawOfficialField(
      'Date',
      LEFT +
        12 +
        (officialWidth +
          officialGap) *
          2,
      y + 16,
      officialWidth
    );

    /*
     * Signature area.
     */

    drawText(
      'AUTHORIZED SIGNATURE',
      LEFT + 15,
      y + 82,
      180,
      6.3,
      true,
      COLORS.gray
    );

    drawLine(
      LEFT + 15,
      y + 111,
      LEFT + 195,
      y + 111,
      COLORS.darkGreen,
      0.8
    );

    /*
     * Stamp area.
     */

    drawText(
      'OFFICIAL COLLEGE STAMP',
      LEFT + 270,
      y + 82,
      220,
      6.3,
      true,
      COLORS.gray,
      'center'
    );

    doc
      .circle(
        LEFT + 380,
        y + 110,
        30
      )
      .lineWidth(1)
      .strokeColor(
        COLORS.gold
      )
      .stroke();

    doc
      .circle(
        LEFT + 380,
        y + 110,
        23
      )
      .lineWidth(0.6)
      .strokeColor(
        COLORS.border
      )
      .stroke();

    drawText(
      'STAMP',
      LEFT + 350,
      y + 106,
      60,
      5.5,
      true,
      COLORS.muted,
      'center'
    );

    /* =====================================================
       SYSTEM NOTICE
    ===================================================== */

    /*
     * Keep this above the footer.
     */

    const noticeY =
      y +
      officialHeight +
      12;

    if (
      noticeY + 12 <
      CONTENT_BOTTOM
    ) {
      drawText(
        'This document contains information submitted by the applicant through the Shifah Medical Training College online application system.',
        LEFT,
        noticeY,
        CONTENT_WIDTH,
        6.2,
        false,
        COLORS.gray,
        'center'
      );
    }

    /* =====================================================
       FOOTERS FOR ALL PAGES
    ===================================================== */

    const range =
      doc.bufferedPageRange();

    const totalPages =
      range.count;

    for (
      let page = range.start;
      page <
      range.start + range.count;
      page++
    ) {
      doc.switchToPage(page);

      const pageNumber =
        page -
          range.start +
        1;

      drawFooter(
        pageNumber,
        totalPages
      );
    }

    /* =====================================================
       FINISH PDF
    ===================================================== */

    doc.end();

    const pdf =
      await pdfPromise;

    /* =====================================================
       FILE NAME
    ===================================================== */

    const applicationNumber =
      safeFileName(
        application.application_number ||
          applicationId
      );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return new NextResponse(
      new Uint8Array(pdf),
      {
        status: 200,

        headers: {
          'Content-Type':
            'application/pdf',

          'Content-Disposition':
            `attachment; filename="SMTC-Application-${applicationNumber}.pdf"`,

          'Content-Length':
            String(pdf.length),

          'Cache-Control':
            'no-store, no-cache, must-revalidate',

          Pragma:
            'no-cache',

          Expires:
            '0',
        },
      }
    );
  } catch (error) {
    console.error(
      '===================================='
    );

    console.error(
      'SMTC APPLICATION PDF ERROR'
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