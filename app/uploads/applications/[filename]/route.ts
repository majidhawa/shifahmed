import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

type RouteContext = {
  params: Promise<{
    filename: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { filename } = await context.params;

    if (!filename) {
      return NextResponse.json(
        {
          success: false,
          message: 'File name is required.',
        },
        { status: 400 }
      );
    }

    /*
     * Only allow safe file names.
     */
    if (
      filename.includes('/') ||
      filename.includes('\\') ||
      filename.includes('..')
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file name.',
        },
        { status: 400 }
      );
    }

    const storagePath =
      `applications/${filename}`;

    const { data, error } =
      await supabaseAdmin.storage
        .from('application-documents')
        .download(storagePath);

    if (error || !data) {
      console.error(
        'SUPABASE DOCUMENT ERROR:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: 'Document not found.',
        },
        { status: 404 }
      );
    }

    const contentType =
      data.type ||
      'application/octet-stream';

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control':
          'private, no-store, max-age=0',
      },
    });

  } catch (error) {
    console.error(
      'DOCUMENT RETRIEVAL ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to retrieve document.',
      },
      { status: 500 }
    );
  }
}