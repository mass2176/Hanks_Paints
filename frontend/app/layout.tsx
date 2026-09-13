import './globals.css'
import type { Metadata } from 'next'
import SiteNav from '../components/SiteNav'
import { businessName, email, phone, serviceAreaNames, serviceNames, siteUrl } from '../lib/localSeo'

const description =
  'Hanks Paints serves Kokomo, Howard County, and Central Indiana with auto body repair, collision repair, rust repair, automotive paint, custom refinishing, coatings, Spray PPF, paint protection film, paint correction, full color changes, panel replacement, and detailing products.'

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': ['AutoBodyShop', 'AutomotiveBusiness', 'LocalBusiness'],
    '@id': `${siteUrl}/#business`,
    name: businessName,
    url: siteUrl,
    image: `${siteUrl}/og-image.png`,
    logo: `${siteUrl}/icon.png`,
    telephone: phone,
    email,
    priceRange: '$$',
    areaServed: serviceAreaNames.map((name) => ({
      '@type': 'City',
      name,
    })),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '17:00',
      },
    ],
    knowsAbout: serviceNames,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Auto body, paint, restoration, coatings, and protection services',
      itemListElement: serviceNames.slice(0, 11).map((name) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name,
          provider: {
            '@id': `${siteUrl}/#business`,
          },
        },
      })),
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: phone,
        email,
        availableLanguage: 'English',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: businessName,
    url: siteUrl,
    publisher: {
      '@id': `${siteUrl}/#business`,
    },
  },
]

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Hanks Paints',
    template: '%s | Hanks Paints',
  },
  description,
  keywords: serviceNames,
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'Hanks Paints',
    description,
    url: siteUrl,
    siteName: 'Hanks Paints',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Hanks Paints',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hanks Paints',
    description,
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <SiteNav />
        {children}
      </body>
    </html>
  )
}
