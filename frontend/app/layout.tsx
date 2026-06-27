import './globals.css'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Hanks Paints', description: 'Auto body, paint, rust repair, coatings, Spray PPF, and custom refinishing.' }
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><nav className="nav"><a className="brand" href="/">HANKS <span className="accent">PAINTS</span></a><div className="links"><a href="/services">Services</a><a href="/gallery">Gallery</a><a href="/estimate">Start Estimate</a><a href="/status">Check Status</a><a href="/contact">Contact</a><a href="/admin">Shop Login</a></div></nav>{children}</body></html> }
