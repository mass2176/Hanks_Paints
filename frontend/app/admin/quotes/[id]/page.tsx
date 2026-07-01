'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { apiBaseUrl } from '../../../../lib/config'

function money(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function emptyLineItem() {
  return { description: '', amount: '' }
}

function CollapsibleCard({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="card">
      <button
        aria-expanded={open}
        className="muted"
        onClick={() => setOpen((current) => !current)}
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 0,
          color: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          font: 'inherit',
          justifyContent: 'space-between',
          padding: 0,
          textAlign: 'left',
          width: '100%',
        }}
        type="button"
      >
        <h2 style={{ margin: 0 }}>{title}</h2>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  )
}

export default function QuoteDetail() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<any>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [estimateType, setEstimateType] = useState('preliminary')
  const [editingEstimateId, setEditingEstimateId] = useState<number | null>(null)
  const [estimateLineItems, setEstimateLineItems] = useState([emptyLineItem()])
  const [customerNotes, setCustomerNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [shopMessage, setShopMessage] = useState('')
  const [mediaVisibility, setMediaVisibility] = useState('customer_visible')
  const [files, setFiles] = useState<FileList | null>(null)
  const [supplementReason, setSupplementReason] = useState('')
  const [supplementAmount, setSupplementAmount] = useState('')
  const [invoiceTotal, setInvoiceTotal] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')

  async function load() {
    const res = await fetch(`${apiBaseUrl}/quotes/${id}`)
    const body = await res.json()
    if (!res.ok) throw new Error(body.detail || 'Quote load failed')
    setData(body)
  }

  async function run(action: () => Promise<void>, done: string) {
    setError('')
    setNotice('')
    try {
      await action()
      setNotice(done)
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function deleteQuote() {
    const confirmed = window.confirm(
      `Delete quote #${id}? This permanently removes the quote, related messages, appointments, estimates, jobs, invoices, payments, timeline entries, and uploaded media.`
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      const res = await fetch(`${apiBaseUrl}/quotes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      window.location.href = '/admin'
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (id) {
      load().catch((err) => setError(err.message))
    }
  }, [id])

  const latestJob = data?.jobs?.[0]
  const latestInvoice = latestJob?.invoices?.[0]
  const existingEstimate = data?.estimates?.[0]
  const showEstimateForm = !existingEstimate || editingEstimateId !== null
  const quoteStatus = data?.quote?.status || ''
  const quotationComplete = quoteStatus === 'Preliminary Estimate Ready' || quoteStatus === 'Final Estimate Ready'
  const inspectionComplete = Boolean(data?.quote?.physical_inspection_completed)
  const inspectionLocked = quotationComplete || quoteStatus === 'Final Estimate Approved' || quoteStatus === 'Converted to Job'
  const estimateStatus = existingEstimate
    ? `${existingEstimate.estimate_type === 'final' ? 'Final' : 'Preliminary'} Created`
    : 'Not Created'
  const workflowButtonText = quoteStatus === 'Request Received'
    ? 'Start Review'
    : quotationComplete
      ? 'Reopen Quotation'
      : existingEstimate
        ? 'Complete Quotation'
        : ''
  const workflowButtonDisabled = !data || quoteStatus === 'Final Estimate Approved' || quoteStatus === 'Converted to Job'
  const showWorkflowButton = Boolean(workflowButtonText) || quoteStatus === 'Final Estimate Approved' || quoteStatus === 'Converted to Job'
  const finalWorkflowLabel = quoteStatus === 'Final Estimate Approved'
    ? 'Quote Approved'
    : quoteStatus === 'Converted to Job'
      ? 'Converted to Job'
      : workflowButtonText

  async function runWorkflowAction() {
    if (quoteStatus === 'Request Received') {
      await run(async () => {
        const res = await fetch(`${apiBaseUrl}/quotes/${id}/start-quotation`, { method: 'POST' })
        if (!res.ok) throw new Error(await res.text())
      }, 'Review started.')
      return
    }

    if (quotationComplete) {
      const confirmed = window.confirm('Reopen this quote for changes? This will move it back to Under Review.')
      if (!confirmed) return

      await run(async () => {
        const res = await fetch(`${apiBaseUrl}/quotes/${id}/reopen-quotation`, { method: 'POST' })
        if (!res.ok) throw new Error(await res.text())
      }, 'Quotation reopened.')
      return
    }

    if (existingEstimate) {
      await run(async () => {
        const res = await fetch(`${apiBaseUrl}/quotes/${id}/quotation-complete`, { method: 'POST' })
        if (!res.ok) throw new Error(await res.text())
      }, 'Quotation marked complete.')
    }
  }

  function updateEstimateLineItem(index: number, field: 'description' | 'amount', value: string) {
    setEstimateLineItems((items) => items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )))
  }

  function addEstimateLineItem() {
    setEstimateLineItems((items) => [...items, emptyLineItem()])
  }

  function removeEstimateLineItem(index: number) {
    setEstimateLineItems((items) => items.length === 1 ? items : items.filter((_, itemIndex) => itemIndex !== index))
  }

  function resetEstimateForm() {
    setEditingEstimateId(null)
    setEstimateType('preliminary')
    setEstimateLineItems([emptyLineItem()])
    setCustomerNotes('')
    setInternalNotes('')
  }

  function editEstimate(estimate: any) {
    setEditingEstimateId(estimate.id)
    setEstimateType(estimate.estimate_type)
    setCustomerNotes(estimate.customer_notes || '')
    setInternalNotes(estimate.internal_notes || '')
    setEstimateLineItems(
      estimate.line_items.length
        ? estimate.line_items.map((item: any) => ({
            description: item.description || '',
            amount: String(item.amount ?? ''),
          }))
        : [emptyLineItem()]
    )
  }

  return (
    <main className="section">
      <h1>Quote #{id}</h1>
      {error && <p className="muted">Error: {error}</p>}
      {notice && <p className="muted">{notice}</p>}

      {data && (
        <>
          <div className="grid">
            <div className="card">
              <h2>{data.customer.full_name}</h2>
              <p>
                <b>{data.quote.status}</b>
              </p>
              <p className="muted">
                {data.vehicle.year} {data.vehicle.make} {data.vehicle.model}
              </p>
              <p className="muted">{data.customer.phone} / {data.customer.email}</p>
              <p className="muted">{data.quote.damage_description}</p>
            </div>

            <CollapsibleCard title="Workflow" defaultOpen>
              <p className="muted">
                Quote: {quoteStatus}
              </p>
              <p className="muted">
                Estimate: {estimateStatus}
              </p>
              <p className="muted">
                Inspection: {inspectionComplete ? 'Completed' : 'Not Completed'}
              </p>
              {!existingEstimate && quoteStatus !== 'Request Received' && (
                <p className="muted">Create an estimate before completing quotation.</p>
              )}
              <div className="btns">
                {showWorkflowButton && (
                  <button
                    className="btn"
                    disabled={workflowButtonDisabled}
                    onClick={runWorkflowAction}
                  >
                    {finalWorkflowLabel}
                  </button>
                )}
                {!inspectionComplete && !inspectionLocked && (
                  <button
                    className="btn secondary"
                    onClick={() =>
                      run(async () => {
                        const res = await fetch(`${apiBaseUrl}/quotes/${id}/inspection-complete`, { method: 'POST' })
                        if (!res.ok) throw new Error(await res.text())
                      }, 'Inspection marked complete.')
                    }
                  >
                    Mark Inspection Complete
                  </button>
                )}
              </div>
            </CollapsibleCard>

            <CollapsibleCard title="Admin Actions">
              <div className="btns">
                <button className="btn danger" type="button" onClick={deleteQuote}>
                  Delete Quote
                </button>
              </div>
            </CollapsibleCard>
          </div>

          <div className="grid" style={{ marginTop: 18 }}>
            {showEstimateForm ? (
              <CollapsibleCard title={editingEstimateId ? `Edit Estimate #${editingEstimateId}` : 'Create Estimate'} defaultOpen>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    run(async () => {
                      const endpoint = editingEstimateId
                        ? `${apiBaseUrl}/estimates/${editingEstimateId}`
                        : `${apiBaseUrl}/quotes/${id}/estimates`
                      const res = await fetch(endpoint, {
                        method: editingEstimateId ? 'PUT' : 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          estimate_type: estimateType,
                          customer_notes: customerNotes,
                          internal_notes: internalNotes,
                          line_items: estimateLineItems.map((item) => (
                            {
                              description: item.description,
                              category: 'Labor/Repair',
                              amount: Number(item.amount),
                              customer_visible: true,
                            }
                          )),
                        }),
                      })
                      if (!res.ok) throw new Error(await res.text())
                      resetEstimateForm()
                    }, editingEstimateId ? `${estimateType} estimate updated.` : `${estimateType} estimate created.`)
                  }}
                >
                  <div className="field">
                    <label>Estimate Type</label>
                    <select value={estimateType} onChange={(e) => setEstimateType(e.target.value)}>
                      <option value="preliminary">Preliminary Photo Estimate</option>
                      <option value="final">Final Estimate After Physical Inspection</option>
                    </select>
                  </div>
                  {estimateLineItems.map((item, index) => (
                    <div key={index}>
                      <div className="field">
                        <label>Line Item</label>
                        <input value={item.description} onChange={(e) => updateEstimateLineItem(index, 'description', e.target.value)} required />
                      </div>
                      <div className="field">
                        <label>Amount</label>
                        <input type="number" min="0" step="0.01" value={item.amount} onChange={(e) => updateEstimateLineItem(index, 'amount', e.target.value)} required />
                      </div>
                      <div className="btns" style={{ marginTop: 0 }}>
                        <button className="btn secondary" type="button" onClick={addEstimateLineItem}>
                          +
                        </button>
                        <button className="btn danger" type="button" onClick={() => removeEstimateLineItem(index)} disabled={estimateLineItems.length === 1}>
                          -
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="field">
                    <label>Customer Notes</label>
                    <textarea rows={3} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Internal Notes</label>
                    <textarea rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
                  </div>
                  <button className="btn" type="submit">
                    Save Estimate
                  </button>
                </form>
              </CollapsibleCard>
            ) : (
              <CollapsibleCard title="Estimate" defaultOpen>
                <p>
                  <b>#{existingEstimate.id} {existingEstimate.estimate_type}</b> - {existingEstimate.status} - {money(existingEstimate.total)}
                </p>
                {existingEstimate.line_items.map((item: any) => (
                  <p className="muted" key={item.id}>
                    {item.description}: {money(item.amount)}
                  </p>
                ))}
                {existingEstimate.customer_notes && (
                  <p className="muted">Customer Notes: {existingEstimate.customer_notes}</p>
                )}
                {existingEstimate.internal_notes && (
                  <p className="muted">Internal Notes: {existingEstimate.internal_notes}</p>
                )}
                <button className="btn secondary" type="button" onClick={() => editEstimate(existingEstimate)}>
                  Edit Estimate
                </button>
              </CollapsibleCard>
            )}

            <CollapsibleCard title="Upload Shop Media">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  run(async () => {
                    if (!files?.length) return
                    for (const file of Array.from(files)) {
                      const body = new FormData()
                      body.append('file', file)
                      const res = await fetch(
                        `${apiBaseUrl}/quotes/${id}/media?visibility=${mediaVisibility}&uploaded_by=employee`,
                        { method: 'POST', body }
                      )
                      if (!res.ok) throw new Error(await res.text())
                    }
                    setFiles(null)
                  }, 'Shop media uploaded.')
                }}
              >
                <div className="field">
                  <label>Visibility</label>
                  <select value={mediaVisibility} onChange={(e) => setMediaVisibility(e.target.value)}>
                    <option value="customer_visible">Customer Visible</option>
                    <option value="internal_only">Internal Only</option>
                  </select>
                </div>
                <div className="field">
                  <input type="file" accept="image/*,video/*,.pdf" multiple onChange={(e) => setFiles(e.target.files)} />
                </div>
                <button className="btn" type="submit">
                  Upload Media
                </button>
              </form>
            </CollapsibleCard>

            <CollapsibleCard title="Message Customer">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  run(async () => {
                    const res = await fetch(`${apiBaseUrl}/quotes/${id}/messages`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sender_type: 'shop', body: shopMessage }),
                    })
                    if (!res.ok) throw new Error(await res.text())
                    setShopMessage('')
                  }, 'Shop message sent.')
                }}
              >
                <div className="field">
                  <textarea rows={5} value={shopMessage} onChange={(e) => setShopMessage(e.target.value)} required />
                </div>
                <button className="btn" type="submit">
                  Send Message
                </button>
              </form>
            </CollapsibleCard>
          </div>

          <div className="grid" style={{ marginTop: 18 }}>
            <CollapsibleCard title="Appointments">
              {data.appointments.map((item: any) => (
                <p className="muted" key={item.id}>
                  #{item.id} {item.status} - {new Date(item.requested_start).toLocaleString()}
                  {item.status !== 'Appointment Confirmed' && (
                    <button
                      className="btn secondary"
                      style={{ marginLeft: 12 }}
                      onClick={() =>
                        run(async () => {
                          const res = await fetch(`${apiBaseUrl}/appointments/${item.id}/confirm`, { method: 'POST' })
                          if (!res.ok) throw new Error(await res.text())
                        }, 'Appointment confirmed.')
                      }
                    >
                      Confirm
                    </button>
                  )}
                </p>
              ))}
            </CollapsibleCard>

            <CollapsibleCard title="Media">
              {data.media.map((item: any) => (
                <p className="muted" key={item.id}>
                  <a href={`${apiBaseUrl.replace('/api', '')}${item.media_url}`} target="_blank">
                    {item.original_name}
                  </a>{' '}
                  - {item.visibility} - {item.uploaded_by}
                </p>
              ))}
            </CollapsibleCard>
          </div>

          {latestJob && (
            <div className="grid" style={{ marginTop: 18 }}>
              <CollapsibleCard title="Supplement">
                <p className="muted">Job #{latestJob.id} - {latestJob.status}</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    run(async () => {
                      const res = await fetch(
                        `${apiBaseUrl}/jobs/${latestJob.id}/supplements?reason=${encodeURIComponent(supplementReason)}&amount=${encodeURIComponent(supplementAmount || '0')}`,
                        { method: 'POST' }
                      )
                      if (!res.ok) throw new Error(await res.text())
                      setSupplementReason('')
                      setSupplementAmount('')
                    }, 'Supplement created.')
                  }}
                >
                  <div className="field">
                    <label>Reason</label>
                    <textarea rows={3} value={supplementReason} onChange={(e) => setSupplementReason(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Amount</label>
                    <input type="number" min="0" step="0.01" value={supplementAmount} onChange={(e) => setSupplementAmount(e.target.value)} />
                  </div>
                  <button className="btn" type="submit">
                    Create Change Order
                  </button>
                </form>
              </CollapsibleCard>

              <CollapsibleCard title="Invoice">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    run(async () => {
                      const res = await fetch(
                        `${apiBaseUrl}/jobs/${latestJob.id}/invoice?total_due=${encodeURIComponent(invoiceTotal)}`,
                        { method: 'POST' }
                      )
                      if (!res.ok) throw new Error(await res.text())
                      setInvoiceTotal('')
                    }, 'Invoice created.')
                  }}
                >
                  <div className="field">
                    <label>Total Due</label>
                    <input type="number" min="0" step="0.01" value={invoiceTotal} onChange={(e) => setInvoiceTotal(e.target.value)} required />
                  </div>
                  <button className="btn" type="submit">
                    Create Invoice
                  </button>
                </form>
              </CollapsibleCard>

              {latestInvoice && (
                <CollapsibleCard title="Record Payment">
                  <p className="muted">Invoice #{latestInvoice.id}: {latestInvoice.status}, balance {money(latestInvoice.balance_due)}</p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      run(async () => {
                        const res = await fetch(`${apiBaseUrl}/invoices/${latestInvoice.id}/payments`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ amount: Number(paymentAmount), method: paymentMethod, note: 'Recorded in admin portal' }),
                        })
                        if (!res.ok) throw new Error(await res.text())
                        setPaymentAmount('')
                      }, 'Payment recorded.')
                    }}
                  >
                    <div className="field">
                      <label>Amount</label>
                      <input type="number" min="0" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
                    </div>
                    <div className="field">
                      <label>Method</label>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        <option>Cash</option>
                        <option>Check</option>
                        <option>Card processed elsewhere</option>
                        <option>Zelle</option>
                        <option>Venmo</option>
                        <option>Cash App</option>
                        <option>Bank transfer</option>
                        <option>Financing</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <button className="btn" type="submit">
                      Record Payment
                    </button>
                  </form>
                </CollapsibleCard>
              )}
            </div>
          )}

          <div className="grid" style={{ marginTop: 18 }}>
            <CollapsibleCard title="Supplements">
              {data.jobs.flatMap((job: any) => job.supplements).map((item: any) => (
                <p className="muted" key={item.id}>
                  #{item.id} {item.status} - {item.reason} - {money(item.amount)}
                </p>
              ))}
            </CollapsibleCard>

            <CollapsibleCard title="Messages">
              {data.messages.map((item: any) => (
                <p className="muted" key={item.id}>
                  <b>{item.sender_type}:</b> {item.body}
                </p>
              ))}
            </CollapsibleCard>

            <CollapsibleCard title="Timeline">
              {data.timeline.map((item: any, index: number) => (
                <p className="muted" key={`${item.event}-${index}`}>
                  <b>{item.event}</b> - {item.actor}
                  <br />
                  {new Date(item.created_at).toLocaleString()} {item.detail || ''}
                </p>
              ))}
            </CollapsibleCard>
          </div>
        </>
      )}
    </main>
  )
}
