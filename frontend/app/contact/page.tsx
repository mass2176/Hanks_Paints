export default function Page() {
  return (
    <main className="section">
      <h1>Contact Hanks Paints</h1>
      <p className="muted">
        Use the estimate and portal workflow so requests, photos, messages, approvals, invoices, and
        payment notes stay attached to the correct customer and vehicle.
      </p>

      <div className="grid">
        <div className="card">
          <h3>New Repair Request</h3>
          <p className="muted">
            Start with customer information, vehicle details, service type, payment type, damage
            notes, and vehicle photos or videos.
          </p>
          <a className="btn" href="/estimate">
            Start Free Estimate
          </a>
        </div>

        <div className="card">
          <h3>Shop Hours</h3>
          <p className="muted">Monday through Friday</p>
          <p>
            <b>8:00 AM - 5:00 PM</b>
          </p>
        </div>

        <div className="card">
          <h3>Existing Quote / Job</h3>
          <p className="muted">
            Check status, send a message, upload additional media, request an inspection, and review
            approvals from the portal.
          </p>
          <a className="btn secondary" href="/portal">
            Open Portal
          </a>
        </div>
      </div>
    </main>
  )
}
