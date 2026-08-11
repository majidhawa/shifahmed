import type { Metadata } from 'next';
import './globals.css';

import { SiteChrome } from '@/components/SiteChrome';

export const metadata: Metadata = {
  title:
    'Shifah Medical Training College | Best Medical College in Kitale Kenya',

  description:
    'Shifah Medical Training College in Kitale, Kenya. Accredited courses in Caregiving, Safe Phlebotomy and Dialysis Technology. KCSE D- entry. Apply today.',

  keywords:
    'medical training college Kitale, phlebotomy course Kenya, caregiving training Kenya, dialysis technology Kenya, NITA accredited medical college, healthcare training Kitale',

  verification: {
    google:
      'UcpAtuqKJzDagBTSLtMFzB-cWeRP9TDO1SdcjEJi7QI',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>

        {/* =================================================
            STRUCTURED DATA
        ================================================== */}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollegeOrUniversity',

              name: 'Shifah Medical Training College',

              url: 'https://shifahmedicalcollege.co.ke',

              address: {
                '@type': 'PostalAddress',
                streetAddress:
                  'Ambwere Plaza, 2nd Floor',
                addressLocality: 'Kitale',
                addressCountry: 'KE',
              },

              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+254142068933',
                contactType:
                  'customer service',
              },

              sameAs: [
                'https://www.facebook.com/people/Shifah-Medical-Training-College/61588805690949/',
                'https://www.instagram.com/shifahmedicalcollege',
                'https://x.com/shifahmtc',
              ],
            }),
          }}
        />

        {/* =================================================
            PUBLIC WEBSITE / ADMIN / STUDENT CONTENT
        ================================================== */}

        <SiteChrome>
          {children}
        </SiteChrome>

      </body>
    </html>
  );
}