const stages = [
  'Initial intake photos',
  'Inspection documentation',
  'Repair progress photos',
  'Paint and refinish updates',
  'Customer-visible completion photos',
  'Internal-only supplement documentation',
]

export default function Page() {
  return (
    <main className="section">
      <h1>Gallery</h1>
      <p className="muted">
        The production gallery is managed through each quote and job record. Customers can upload
        vehicle photos and videos during estimate intake, and the shop can add progress media as
        Customer Visible or Internal Only.
      </p>

      <div className="grid">
        {stages.map((stage) => (
          <div className="card" key={stage}>
            <h3>{stage}</h3>
            <p className="muted">
              Media from this stage is stored on the quote/job timeline so the repair history stays
              with the customer and vehicle.
            </p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Submit Your Vehicle</h2>
        <p className="muted">
          Upload close-up damage photos, wide walkaround photos, videos, and relevant documents when
          starting an estimate.
        </p>
        <a className="btn" href="/estimate">
          Start Free Estimate
        </a>
      </div>
    </main>
  )
}
