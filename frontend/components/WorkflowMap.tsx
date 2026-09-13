type WorkflowMapProps = {
  adminMode?: boolean
}

const statusFlow = [
  'Request Received',
  'Under Review',
  'Inspection Needed',
  'Appointment Confirmed',
  'Inspection Completed',
  'Final Estimate Sent',
  'Customer Approved',
  'Converted to Job',
  'Invoiced',
  'Paid / Ready for Pickup',
]

const workflowStages = [
  {
    number: '01',
    title: 'Estimate Request',
    customer:
      'Starts a free estimate, enters contact details, vehicle information, service type, payment type, description, phone consent, and uploads vehicle media.',
    shop:
      'Receives the new request in the shop dashboard queue with the quote number, customer name, vehicle, service type, media, and contact information.',
    system:
      'Creates the quote record, assigns the quote number, validates required fields and media, texts the customer confirmation, and texts the shop notification.',
    output: 'Quote status becomes Request Received.',
  },
  {
    number: '02',
    title: 'Shop Review',
    customer:
      'Can check status through the customer portal and respond to shop messages when more information or media is requested.',
    shop:
      'Opens the quote, starts review, reviews uploaded media, uses direct messaging, and decides whether photos are enough or an inspection is needed.',
    system:
      'Moves the record to Under Review, keeps the message history with the quote, and shows quote/message notifications on the dashboard views.',
    output: 'The shop chooses preliminary estimate, more information, or on-site inspection.',
  },
  {
    number: '03',
    title: 'Inspection Scheduling',
    customer:
      'Chooses from owner-controlled available inspection times, sees existing appointments, and can request rescheduling or cancellation when needed.',
    shop:
      'Maintains available time slots, confirms appointments, reschedules, marks no-show, cancels, or marks the physical inspection completed.',
    system:
      'Adds confirmed inspections to the office calendar display and sends appointment scheduled and reminder text messages to the customer and shop.',
    output: 'Final estimate stays locked until the in-person inspection is completed.',
  },
  {
    number: '04',
    title: 'Estimate Creation',
    customer:
      'Receives the estimate link by text and can view the estimate in the portal. Shared estimate texts can include both the portal link and estimate image/PDF.',
    shop:
      'Creates flat dollar line items, saves preliminary or final estimate details, prints the estimate, copies the link, shares it, or sends it by text.',
    system:
      'Separates preliminary photo estimates from final estimates and applies required inspection disclaimers where appropriate.',
    output: 'Estimate is ready for customer review.',
  },
  {
    number: '05',
    title: 'Customer Approval',
    customer:
      'Reviews the final estimate, enters legal name, checks approval acknowledgments, and electronically approves the final estimate.',
    shop:
      'Tracks whether the customer has approved the estimate and can move approved final estimates into active repair work.',
    system:
      'Captures approval time, approval text, signed name, estimate version, total, and customer authorization record.',
    output: 'Approved final estimate can be converted to an active job.',
  },
  {
    number: '06',
    title: 'Repair Job',
    customer:
      'Can follow status updates, view customer-visible photos, and approve supplements if hidden damage or scope changes are found.',
    shop:
      'Converts the approved quote to a job, updates repair status, uploads internal or customer-visible media, and creates supplements when needed.',
    system:
      'Keeps internal-only material, activity, and photo notes separate from customer-visible updates and requires supplement approval before extra work continues.',
    output: 'Job moves through active repair, waiting on approval, ready for pickup, or balance due.',
  },
  {
    number: '07',
    title: 'Invoice And Payment',
    customer:
      'Receives invoice text messages with the portal link and invoice image/PDF, then pays through the shop accepted manual payment methods.',
    shop:
      'Generates invoices from approved estimates and supplements, records payments manually, and updates remaining balance or pickup status.',
    system:
      'Tracks invoice totals, payment records, balance due, and product order notifications from Stripe separately from repair invoice payments.',
    output: 'Invoice is paid, balance due is visible, and the vehicle can be marked ready for pickup.',
  },
]

const crossCutting = [
  {
    title: 'Access',
    body: 'Customers use passwordless quote access. Shop staff use admin, employee, or receptionist access depending on their role.',
  },
  {
    title: 'Messaging',
    body: 'Customer and shop messages stay attached to the selected quote so the conversation remains part of the work record.',
  },
  {
    title: 'Notifications',
    body: 'SMS alerts cover new estimates, estimate/invoice sharing, scheduled inspections, inspection reminders, product orders, and customer messages.',
  },
  {
    title: 'Calendar',
    body: 'The office calendar view shows confirmed inspections and dashboard notifications for items that need shop attention.',
  },
]

export default function WorkflowMap({ adminMode = false }: WorkflowMapProps) {
  return (
    <main className="section workflow-page">
      <section className="workflow-hero">
        <p className="eyebrow">Website operations map</p>
        <h1>Estimate To Payment Workflow</h1>
        <p className="sub">
          A visual overview of how Hanks Paints moves a customer from an online estimate request
          through review, inspection, final estimate approval, repair work, invoice, and payment
          tracking.
        </p>
        <div className="btns">
          <a className="btn" href="/estimate">
            Start Estimate
          </a>
          <a className="btn secondary" href="/status">
            Check Status
          </a>
          <a className="btn secondary" href="/admin">
            {adminMode ? 'Dashboard' : 'Shop Login'}
          </a>
          <a className="btn secondary" href="/admin/calendar">
            Office Calendar
          </a>
        </div>
      </section>

      <section className="workflow-status" aria-labelledby="status-flow-title">
        <h2 id="status-flow-title">Status Progression</h2>
        <div className="workflow-status-track">
          {statusFlow.map((status, index) => (
            <div className="workflow-status-step" key={status}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{status}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="workflow-map" aria-labelledby="workflow-map-title">
        <h2 id="workflow-map-title">Customer, Shop, And System Handoffs</h2>
        <div className="workflow-legend" aria-label="Workflow lane legend">
          <span className="legend-customer">Customer</span>
          <span className="legend-shop">Shop / Admin</span>
          <span className="legend-system">Automated System</span>
        </div>

        {workflowStages.map((stage) => (
          <article className="workflow-stage" key={stage.number}>
            <div className="workflow-stage-heading">
              <span>{stage.number}</span>
              <h3>{stage.title}</h3>
            </div>
            <div className="workflow-lanes">
              <section className="workflow-lane customer-lane" aria-label={`${stage.title} customer actions`}>
                <h4>Customer</h4>
                <p>{stage.customer}</p>
              </section>
              <section className="workflow-lane shop-lane" aria-label={`${stage.title} shop actions`}>
                <h4>Shop / Admin</h4>
                <p>{stage.shop}</p>
              </section>
              <section className="workflow-lane system-lane" aria-label={`${stage.title} automated actions`}>
                <h4>System</h4>
                <p>{stage.system}</p>
              </section>
            </div>
            <p className="workflow-output">{stage.output}</p>
          </article>
        ))}
      </section>

      <section className="workflow-foundation" aria-labelledby="foundation-title">
        <h2 id="foundation-title">Features That Support The Whole Workflow</h2>
        <div className="grid">
          {crossCutting.map((item) => (
            <div className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p className="muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
