import './globals.css'
import type { Metadata } from 'next'
import SiteNav from '../components/SiteNav'

export const metadata: Metadata = { title: 'Hanks Paints', description: 'Auto body, paint, rust repair, coatings, Spray PPF, and custom refinishing.' }
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><SiteNav />{children}</body></html> }
