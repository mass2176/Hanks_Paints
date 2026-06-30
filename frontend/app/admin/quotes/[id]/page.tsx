'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiBaseUrl } from '../../../../lib/config'

function money(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function emptyLineItem() {
  return { description: '', amount: '' }
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

            <div className="card">
              <h2>Workflow</h2>
              <div className="btns">
                <button
                  className="btn"
                  onClick={() =>
                    run(async () => {
                      const res = await fetch(`${apiBaseUrl}/quotes/${id}/start-quotation`, { method: 'POST' })
                      if (!res.ok) throw new Error(await res.text())
                    }, 'Quotation started.')
                  }
                >
                  Start Quotation
                </button>
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
                <button className="btn danger" type="button" onClick={deleteQuote}>
                  Delete Quote
                </button>
              </div>
            </div>
          </div>

          <div className="grid" style={{ marginTop: 18 }}>
            <form
              className="card"
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
              <h2>{editingEstimateId ? `Edit Estimate #${editingEstimateId}` : 'Create Estimate'}</h2>
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

            <form
              className="card"
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
              <h2>Upload Shop Media</h2>
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

            <form
              className="card"
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
              <h2>Message Customer</h2>
              <div className="field">
                <textarea rows={5} value={shopMessage} onChange={(e) => setShopMessage(e.target.value)} required />
              </div>
              <button className="btn" type="submit">
                Send Message
              </button>
            </form>
          </div>

          <div className="grid" style={{ marginTop: 18 }}>
            <div className="card">
              <h2>Appointments</h2>
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
            </div>

            <div className="card">
              <h2>Estimates</h2>
              {data.estimates.map((estimate: any) => (
                <div key={estimate.id}>
                  <p>
                    <b>#{estimate.id} {estimate.estimate_type}</b> - {estimate.status} - {money(estimate.total)}
                  </p>
                  <button className="btn secondary" type="button" onClick={() => editEstimate(estimate)}>
                    Edit
                  </button>
                  {estimate.line_items.map((item: any) => (
                    <p className="muted" key={item.id}>
                      {item.description}: {money(item.amount)}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <div className="card">
              <h2>Media</h2>
              {data.media.map((item: any) => (
                <p className="muted" key={item.id}>
                  <a href={`${apiBaseUrl.replace('/api', '')}${item.media_url}`} target="_blank">
                    {item.original_name}
                  </a>{' '}
                  - {item.visibility} - {item.uploaded_by}
                </p>
              ))}
            </div>
          </div>

          {latestJob && (
            <div className="grid" style={{ marginTop: 18 }}>
              <form
                className="card"
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
                <h2>Supplement</h2>
                <p className="muted">Job #{latestJob.id} - {latestJob.status}</p>
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

              <form
                className="card"
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
                <h2>Invoice</h2>
                <div className="field">
                  <label>Total Due</label>
                  <input type="number" min="0" step="0.01" value={invoiceTotal} onChange={(e) => setInvoiceTotal(e.target.value)} required />
                </div>
                <button className="btn" type="submit">
                  Create Invoice
                </button>
              </form>

              {latestInvoice && (
                <form
                  className="card"
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
                  <h2>Record Payment</h2>
                  <p className="muted">Invoice #{latestInvoice.id}: {latestInvoice.status}, balance {money(latestInvoice.balance_due)}</p>
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
              )}
            </div>
          )}

          <div className="grid" style={{ marginTop: 18 }}>
            <div className="card">
              <h2>Supplements</h2>
              {data.jobs.flatMap((job: any) => job.supplements).map((item: any) => (
                <p className="muted" key={item.id}>
                  #{item.id} {item.status} - {item.reason} - {money(item.amount)}
                </p>
              ))}
            </div>

            <div className="card">
              <h2>Messages</h2>
              {data.messages.map((item: any) => (
                <p className="muted" key={item.id}>
                  <b>{item.sender_type}:</b> {item.body}
                </p>
              ))}
            </div>

            <div className="card">
              <h2>Timeline</h2>
              {data.timeline.map((item: any, index: number) => (
                <p className="muted" key={`${item.event}-${index}`}>
                  <b>{item.event}</b> - {item.actor}
                  <br />
                  {new Date(item.created_at).toLocaleString()} {item.detail || ''}
                </p>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
