import { localServiceAreas, servicePages } from '../../lib/localSeo'

const services = [
  {
    title: 'Rust Repair',
    body: 'Rust assessment, metal repair planning, corrosion cleanup, and refinish work for panels, rockers, cab corners, bedsides, and structural-adjacent areas that need shop review.',
  },
  {
    title: 'Collision / Body Repair',
    body: 'Damage review, panel alignment, repair planning, replacement recommendations, and estimate documentation for customer-pay and insurance-related repairs.',
  },
  {
    title: 'Paint Repair',
    body: 'Scratch, chip, blend, panel refinish, and color-match work with clear communication about what can be quoted from photos and what requires inspection.',
  },
  {
    title: 'Custom Paint',
    body: 'Custom refinish planning for specialty colors, accents, panels, restoration work, and finish changes that need detailed scope review.',
  },
  {
    title: 'Full Color Change',
    body: 'Large-scope color-change planning with inspection-first quoting, line-item estimates, approval tracking, and supplement handling if hidden work is discovered.',
  },
  {
    title: 'Coatings / Spray PPF',
    body: 'Protective coating and Spray PPF requests with photo intake, surface-condition review, and inspection scheduling when the finish needs in-person evaluation.',
  },
]

export default function Page() {
  return (
    <main className="section">
      <h1>Services</h1>
      <p className="muted">
        Hanks Paints serves Kokomo, Howard County, and Central Indiana. Each vehicle is reviewed
        through the estimate workflow so the repair scope, photos, inspection status, approvals,
        supplements, invoice, and payments stay tied to the same record.
      </p>

      <div className="grid">
        {services.map((service) => {
          const detail = servicePages.find((item) => item.title === service.title || service.title.includes(item.title))
          return (
          <div className="card" key={service.title}>
            <h3>{service.title}</h3>
            <p className="muted">{service.body}</p>
            <a className="btn secondary" href={detail ? `/services/${detail.slug}` : '/estimate'}>
              View Service
            </a>
          </div>
        )})}
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>Detailed Services</h2>
        <div className="grid">
          {servicePages.map((service) => (
            <a className="card" href={`/services/${service.slug}`} key={service.slug}>
              <h3>{service.title}</h3>
              <p className="muted">{service.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Local Service Areas</h2>
        <div className="grid">
          {localServiceAreas.slice(0, 8).map((area) => (
            <a className="card" href={`/areas/${area.slug}`} key={area.slug}>
              <h3>{area.city}, IN</h3>
              <p className="muted">{area.summary}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
