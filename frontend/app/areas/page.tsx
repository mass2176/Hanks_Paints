import type { Metadata } from 'next'
import { displayPhone, localServiceAreas, servicePages } from '../../lib/localSeo'

export const metadata: Metadata = {
  title: 'Service Areas',
  description:
    'Hanks Paints serves Kokomo, Howard County, and Central Indiana with auto body repair, collision repair, rust repair, custom paint, coatings, Spray PPF, and paint correction.',
}

export default function Page() {
  const primaryArea = localServiceAreas.find((area) => area.priority === 'primary')
  const nearbyAreas = localServiceAreas.filter((area) => area.priority === 'nearby')
  const regionalAreas = localServiceAreas.filter((area) => area.priority === 'regional')

  return (
    <main className="section">
      <h1>Auto Body, Paint, Rust Repair, and Spray PPF Near Kokomo, Indiana</h1>
      <p className="muted">
        Hanks Paints helps vehicle owners in Kokomo, Howard County, and surrounding Central Indiana
        communities request photo-based estimates, schedule inspections, review estimates, and track
        approvals through one workflow.
      </p>

      <div className="grid">
        <div className="card">
          <h2>Primary Service Area</h2>
          {primaryArea && (
            <>
              <h3>{primaryArea.city}, {primaryArea.region}</h3>
              <p className="muted">{primaryArea.summary}</p>
              <a className="btn" href={`/areas/${primaryArea.slug}`}>
                View Kokomo Services
              </a>
            </>
          )}
        </div>

        <div className="card">
          <h2>Contact</h2>
          <p className="muted">Start online or text/call the shop with questions.</p>
          <p>
            <a href="tel:17652527998">
              <b>{displayPhone}</b>
            </a>
          </p>
          <a className="btn secondary" href="/estimate">
            Start Free Estimate
          </a>
        </div>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>Nearby Towns</h2>
        <div className="grid">
          {nearbyAreas.map((area) => (
            <a className="card" href={`/areas/${area.slug}`} key={area.slug}>
              <h3>{area.city}</h3>
              <p className="muted">{area.summary}</p>
            </a>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Broader Central Indiana Service Area</h2>
        <div className="grid">
          {regionalAreas.map((area) => (
            <a className="card" href={`/areas/${area.slug}`} key={area.slug}>
              <h3>{area.city}</h3>
              <p className="muted">{area.summary}</p>
            </a>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Services Customers Search For</h2>
        <div className="grid">
          {servicePages.map((service) => (
            <a className="card" href={`/services/${service.slug}`} key={service.slug}>
              <h3>{service.title}</h3>
              <p className="muted">Request a Hanks Paints estimate with photos and vehicle details.</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
