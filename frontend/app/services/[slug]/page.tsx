import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  businessName,
  displayPhone,
  findServicePage,
  localServiceAreas,
  phone,
  servicePages,
  siteUrl,
} from '../../../lib/localSeo'

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return servicePages.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const service = findServicePage(slug)
  if (!service) return {}

  return {
    title: service.searchTitle,
    description: `${businessName} provides ${service.title.toLowerCase()} estimate intake, inspection scheduling, and customer approval tracking for Kokomo, Howard County, and Central Indiana.`,
    alternates: {
      canonical: `/services/${service.slug}`,
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const service = findServicePage(slug)
  if (!service) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${siteUrl}/services/${service.slug}#service`,
    name: `${businessName} ${service.title}`,
    description: service.description,
    provider: {
      '@id': `${siteUrl}/#business`,
      name: businessName,
      telephone: phone,
    },
    areaServed: localServiceAreas.map((area) => ({
      '@type': 'City',
      name: `${area.city}, ${area.region}`,
    })),
    serviceType: service.title,
    url: `${siteUrl}/services/${service.slug}`,
  }

  return (
    <main className="section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1>{service.searchTitle}</h1>
      <p className="muted">
        {service.description} Hanks Paints serves Kokomo, Howard County, and surrounding Central
        Indiana communities with online estimate requests, customer messaging, inspection scheduling,
        estimate review, and invoice tracking.
      </p>

      <div className="grid">
        <div className="card">
          <h2>Start With Photos</h2>
          <p className="muted">
            Submit vehicle details, service notes, payment type, and media so Hanks Paints can review
            the request and determine whether an on-site inspection is needed.
          </p>
          <a className="btn" href={`/estimate?service=${encodeURIComponent(service.title)}`}>
            Start Free Estimate
          </a>
        </div>

        <div className="card">
          <h2>Service Area</h2>
          <p className="muted">
            Kokomo, Greentown, Russiaville, Sharpsville, Tipton, Peru, Logansport, Marion,
            Noblesville, Westfield, Carmel, Fishers, Lafayette, and nearby Indiana communities.
          </p>
          <a className="btn secondary" href="/areas">
            View Service Areas
          </a>
        </div>

        <div className="card">
          <h2>Contact</h2>
          <p className="muted">Text or call Hanks Paints with questions about this service.</p>
          <p>
            <a href="tel:17652527998">
              <b>{displayPhone}</b>
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
