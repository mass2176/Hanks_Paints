import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  businessName,
  displayPhone,
  findServiceArea,
  localServiceAreas,
  phone,
  servicePages,
  serviceNames,
  siteUrl,
} from '../../../lib/localSeo'

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return localServiceAreas.map((area) => ({ slug: area.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const area = findServiceArea(slug)
  if (!area) return {}

  return {
    title: `${area.city} Auto Body, Paint, Rust Repair, and Spray PPF`,
    description: `${businessName} serves ${area.city}, ${area.region} with auto body repair, collision repair, rust repair, custom paint, paint correction, coatings, Spray PPF, and paint protection film estimate requests.`,
    alternates: {
      canonical: `/areas/${area.slug}`,
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const area = findServiceArea(slug)
  if (!area) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${siteUrl}/areas/${area.slug}#service`,
    name: `${businessName} auto body, paint, rust repair, and Spray PPF near ${area.city}, ${area.region}`,
    areaServed: {
      '@type': 'City',
      name: `${area.city}, ${area.region}`,
    },
    provider: {
      '@id': `${siteUrl}/#business`,
      name: businessName,
      telephone: phone,
    },
    serviceType: serviceNames,
    url: `${siteUrl}/areas/${area.slug}`,
  }

  return (
    <main className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1>{area.city}, Indiana Auto Body, Paint, Rust Repair, and Spray PPF</h1>
      <p className="muted">
        {area.summary} Hanks Paints uses an online estimate workflow so customers can submit vehicle
        details, photos, service needs, and contact information before an in-person inspection is
        scheduled when needed.
      </p>

      <div className="grid">
        <div className="card">
          <h2>Request an Estimate Near {area.city}</h2>
          <p className="muted">
            Start with photos and notes for paint damage, rust, collision damage, panel replacement,
            custom paint, paint correction, coatings, Spray PPF, or paint protection film.
          </p>
          <a className="btn" href="/estimate">
            Start Free Estimate
          </a>
        </div>

        <div className="card">
          <h2>Shop Contact</h2>
          <p className="muted">
            Text or call Hanks Paints for questions about estimate requests, inspections, approvals,
            invoices, and pickup status.
          </p>
          <p>
            <a href="tel:17652527998">
              <b>{displayPhone}</b>
            </a>
          </p>
          <a className="btn secondary" href="/contact">
            Contact Hanks Paints
          </a>
        </div>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>Services for {area.city} Drivers</h2>
        <div className="grid">
          {servicePages.map((service) => (
            <a className="card" href={`/services/${service.slug}`} key={service.slug}>
              <h3>{service.title}</h3>
              <p className="muted">
                Submit a request to have Hanks Paints review the vehicle, photos, repair scope, and
                inspection needs.
              </p>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
