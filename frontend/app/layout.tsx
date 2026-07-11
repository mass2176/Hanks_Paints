import './globals.css'
import type { Metadata } from 'next'
import SiteNav from '../components/SiteNav'

const siteUrl = 'https://hanks-paints.com'
const description =
  'Auto body, paint, rust repair, coatings, Spray PPF, custom refinishing, and Hanks Paints detailing products.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Hanks Paints',
    template: '%s | Hanks Paints',
  },
  description,
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
        <SiteNav />
        {children}
      </body>
    </html>
  )
}
