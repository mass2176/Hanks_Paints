type LineItem = {
  id?: number
  description?: string
  category?: string
  amount?: number
}

type Estimate = {
  id: number
  estimate_type?: string
  version?: number
  status?: string
  customer_notes?: string | null
  internal_notes?: string | null
  created_at?: string
  total?: number
  line_items?: LineItem[]
  approval?: {
    typed_legal_name?: string
    approved_total?: number
    created_at?: string
  } | null
}

type Invoice = {
  id: number
  status?: string
  total_due?: number
  amount_paid?: number
  balance_due?: number
  payments?: {
    id?: number
    amount?: number
    method?: string
    created_at?: string
  }[]
}

type QuoteData = {
  quote?: {
    id?: number
    service_type?: string
    payment_type?: string
    damage_description?: string
    status?: string
    created_at?: string
  }
  customer?: {
    full_name?: string
    street_address?: string | null
    city?: string | null
    state?: string | null
    zip_code?: string | null
    phone?: string
    email?: string
  }
  vehicle?: {
    vin?: string | null
    year?: string | number | null
    make?: string | null
    model?: string | null
    trim?: string | null
    plate?: string | null
  }
}

function money(value?: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function displayDate(value?: string) {
  if (!value) return new Date().toLocaleDateString()
  return new Date(value).toLocaleDateString()
}

function estimateTitle(type?: string) {
  return type === 'final' ? 'Final Estimate' : 'Preliminary Photo Estimate'
}

function formatAddress(customer?: QuoteData['customer']) {
  const cityLine = [customer?.city, customer?.state, customer?.zip_code].filter(Boolean).join(', ')
  return [customer?.street_address, cityLine].filter(Boolean)
}

function vehicleName(vehicle?: QuoteData['vehicle']) {
  return [vehicle?.year, vehicle?.make, vehicle?.model, vehicle?.trim].filter(Boolean).join(' ')
}

function DocumentHeader({ title, number, date }: { title: string; number?: number | string; date?: string }) {
  return (
    <div className="print-header">
      <div>
        <h1>Hanks Paints</h1>
        <p>Auto Body, Paint, Rust Repair, Coatings, Spray PPF</p>
        <p>Phone: (765) 252-7998</p>
        <p>Website: hanks-paints.com</p>
      </div>
      <div className="print-title-block">
        <h2>{title}</h2>
        <table>
          <tbody>
            <tr>
              <th>Date</th>
              <td>{date || new Date().toLocaleDateString()}</td>
            </tr>
            <tr>
              <th>{title === 'Invoice' ? 'Invoice #' : 'Estimate #'}</th>
              <td>{number || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CustomerVehicleBlocks({ data }: { data: QuoteData }) {
  const address = formatAddress(data.customer)

  return (
    <div className="print-two-column">
      <section>
        <h3>Bill To</h3>
        <p>{data.customer?.full_name || 'Customer'}</p>
        {address.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p>{data.customer?.phone || ''}</p>
        <p>{data.customer?.email || ''}</p>
      </section>
      <section>
        <h3>Vehicle / Request</h3>
        <p>{vehicleName(data.vehicle) || 'Vehicle details not provided'}</p>
        <p>Service: {data.quote?.service_type || '-'}</p>
        <p>Payment: {data.quote?.payment_type || '-'}</p>
        {data.vehicle?.vin && <p>VIN: {data.vehicle.vin}</p>}
        {data.vehicle?.plate && <p>Plate: {data.vehicle.plate}</p>}
      </section>
    </div>
  )
}

export function PrintableEstimate({ id, data, estimate }: { id: string; data: QuoteData; estimate: Estimate }) {
  const lineItems = estimate.line_items || []

  return (
    <article className="print-document" id={id}>
      <DocumentHeader title={estimateTitle(estimate.estimate_type)} number={estimate.id} date={displayDate(estimate.created_at)} />
      <CustomerVehicleBlocks data={data} />

      <table className="print-detail-table">
        <tbody>
          <tr>
            <th>Quote #</th>
            <td>{data.quote?.id || '-'}</td>
            <th>Status</th>
            <td>{estimate.status || data.quote?.status || '-'}</td>
            <th>Version</th>
            <td>{estimate.version || 1}</td>
          </tr>
        </tbody>
      </table>

      <table className="print-line-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th>Category</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, index) => (
            <tr key={item.id || index}>
              <td>{index + 1}</td>
              <td>{item.description || '-'}</td>
              <td>{item.category || 'Labor/Repair'}</td>
              <td>{money(item.amount)}</td>
            </tr>
          ))}
          {!lineItems.length && (
            <tr>
              <td>1</td>
              <td>No line items entered.</td>
              <td>-</td>
              <td>{money(estimate.total)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="print-total-row">
        <span>Total</span>
        <strong>{money(estimate.total)}</strong>
      </div>

      <section className="print-notes">
        <h3>Notes and Terms</h3>
        <p>{estimate.customer_notes || data.quote?.damage_description || 'No customer notes provided.'}</p>
        <p>
          Photo-based estimates are preliminary only. Final pricing requires an in-person inspection. Hidden damage found
          after disassembly may require a separate supplement or change order approval.
        </p>
      </section>

      <section className="print-signature">
        <h3>Customer Approval</h3>
        {estimate.approval ? (
          <>
            <p>Signed by: {estimate.approval.typed_legal_name}</p>
            <p>Approved total: {money(estimate.approval.approved_total)}</p>
            <p>Signed on: {displayDate(estimate.approval.created_at)}</p>
          </>
        ) : (
          <div className="print-signature-lines">
            <span>Customer Signature</span>
            <span>Date</span>
          </div>
        )}
      </section>
    </article>
  )
}

export function PrintableInvoice({ id, data, invoice }: { id: string; data: QuoteData; invoice: Invoice }) {
  const payments = invoice.payments || []

  return (
    <article className="print-document" id={id}>
      <DocumentHeader title="Invoice" number={invoice.id} />
      <CustomerVehicleBlocks data={data} />

      <table className="print-line-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th>Method</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Approved repair invoice for Quote #{data.quote?.id || '-'}</td>
            <td>-</td>
            <td>{money(invoice.total_due)}</td>
          </tr>
          {payments.map((payment, index) => (
            <tr key={payment.id || index}>
              <td>{index + 2}</td>
              <td>Payment received {payment.created_at ? `on ${displayDate(payment.created_at)}` : ''}</td>
              <td>{payment.method || '-'}</td>
              <td>-{money(payment.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-total-row">
        <span>Total Due</span>
        <strong>{money(invoice.total_due)}</strong>
      </div>
      <div className="print-total-row">
        <span>Amount Paid</span>
        <strong>{money(invoice.amount_paid)}</strong>
      </div>
      <div className="print-total-row print-balance-row">
        <span>Balance Due</span>
        <strong>{money(invoice.balance_due)}</strong>
      </div>

      <section className="print-notes">
        <h3>Payment Notes</h3>
        <p>Status: {invoice.status || 'draft'}</p>
        <p>Payments are manually tracked by Hanks Paints. Please contact the shop with questions about this invoice.</p>
      </section>
    </article>
  )
}
