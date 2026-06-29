'use client'

import { useEffect, useState } from 'react'
import { apiBaseUrl } from '../../lib/config'

function money(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

export default function Page() {
  const [quoteId, setQuoteId] = useState('')
  const [contact, setContact] = useState('')
  const [data, setData] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [appointment, setAppointment] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const quote = params.get('quote')
    const contactParam = params.get('contact')
    if (quote) setQuoteId(quote)
    if (contactParam) setContact(contactParam)
  }, [])

  async function load(e?: React.FormEvent) {
    e?.preventDefault()
    if (!quoteId || !contact) return

    setError('')
    setNotice('')
    setLoading(true)

    try {
      const res = await fetch(
        `${apiBaseUrl}/portal/quotes/${encodeURIComponent(quoteId)}?contact=${encodeURIComponent(contact)}`
      )
      const body = await res.json()

      if (!res.ok) {
        throw new Error(body.detail || 'Portal lookup failed')
      }

      setData(body)
    } catch (err: any) {
      setData(null)
      setError(err.message)
    } finally {
      setLoading(false)
    }
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

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    await run(async () => {
      const res = await fetch(`${apiBaseUrl}/quotes/${data.quote.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_type: 'customer', body: message }),
      })
      if (!res.ok) throw new Error(await res.text())
      setMessage('')
    }, 'Message sent.')
  }

  async function requestAppointment(e: React.FormEvent) {
    e.preventDefault()
    await run(async () => {
      const res = await fetch(`${apiBaseUrl}/quotes/${data.quote.id}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requested_start: new Date(appointment).toISOString(),
          notes: 'Requested from customer portal',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setAppointment('')
    }, 'Inspection appointment requested.')
  }

  async function uploadMedia(e: React.FormEvent) {
    e.preventDefault()
    await run(async () => {
      if (!files?.length) return

      for (const file of Array.from(files)) {
        const body = new FormData()
        body.append('file', file)
        const res = await fetch(
          `${apiBaseUrl}/quotes/${data.quote.id}/media?visibility=customer_visible&uploaded_by=customer`,
          { method: 'POST', body }
        )
        if (!res.ok) throw new Error(await res.text())
      }

      setFiles(null)
    }, 'Media uploaded.')
  }

  const finalEstimate = data?.estimates?.find(
    (estimate: any) => estimate.estimate_type === 'final' && estimate.status !== 'approved'
  )
  const pendingSupplement = data?.jobs
    ?.flatMap((job: any) => job.supplements)
    .find((supplement: any) => supplement.status !== 'approved')

  return (
    <main className="section">
      <h1>Customer Portal</h1>
      <p className="muted">
        View status, upload requested media, message the shop, request inspection time, and approve
        final estimates or supplements.
      </p>

      <form className="form" onSubmit={load}>
        <div className="row">
          <div className="field">
            <label>Quote Number</label>
            <input value={quoteId} onChange={(e) => setQuoteId(e.target.value)} required />
          </div>
          <div className="field">
            <label>Phone or Email</label>
            <input value={contact} onChange={(e) => setContact(e.target.value)} required />
          </div>
        </div>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Open Portal'}
        </button>
        {error && <p className="muted">Error: {error}</p>}
        {notice && <p className="muted">{notice}</p>}
      </form>

      {data && (
        <>
          <div className="grid">
            <div className="card">
              <h2>Quote #{data.quote.id}</h2>
              <p>
                <b>{data.quote.status}</b>
              </p>
              <p className="muted">
                {data.vehicle.year} {data.vehicle.make} {data.vehicle.model}
              </p>
              <p className="muted">{data.quote.damage_description}</p>
            </div>

            <div className="card">
              <h2>Approvals</h2>
              {finalEstimate ? (
                <>
                  <p>
                    Final estimate total: <b>{money(finalEstimate.total)}</b>
                  </p>
                  <button
                    className="btn"
                    onClick={() =>
                      run(async () => {
                        const res = await fetch(
                          `${apiBaseUrl}/estimates/${finalEstimate.id}/approve?typed_signature=${encodeURIComponent(data.customer.full_name)}`,
                          { method: 'POST' }
                        )
                        if (!res.ok) throw new Error(await res.text())
                      }, 'Final estimate approved.')
                    }
                  >
                    Approve Final Estimate & Authorize Repairs
                  </button>
                </>
              ) : (
                <p className="muted">No final estimate is waiting for approval.</p>
              )}

              {pendingSupplement && (
                <div style={{ marginTop: 18 }}>
                  <p>
                    Supplement: {pendingSupplement.reason} ({money(pendingSupplement.amount)})
                  </p>
                  <button
                    className="btn secondary"
                    onClick={() =>
                      run(async () => {
                        const res = await fetch(
                          `${apiBaseUrl}/supplements/${pendingSupplement.id}/approve?typed_signature=${encodeURIComponent(data.customer.full_name)}`,
                          { method: 'POST' }
                        )
                        if (!res.ok) throw new Error(await res.text())
                      }, 'Supplement approved.')
                    }
                  >
                    Approve Supplement
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid" style={{ marginTop: 18 }}>
            <form className="card" onSubmit={uploadMedia}>
              <h2>Upload More Media</h2>
              <p className="muted">Photos, videos, PDFs, or additional requested files.</p>
              <div className="field">
                <div className="upload-grid">
                  <div className="upload-card">
                    <span>Take Photo Now</span>
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => setFiles(e.target.files)} />
                  </div>
                  <div className="upload-card">
                    <span>Choose From Device</span>
                    <input type="file" accept="image/*,video/*,.pdf" multiple onChange={(e) => setFiles(e.target.files)} />
                  </div>
                </div>
              </div>
              <button className="btn" type="submit">
                Upload Files
              </button>
            </form>

            <form className="card" onSubmit={requestAppointment}>
              <h2>Request Inspection</h2>
              <div className="field">
                <label>Preferred Date / Time</label>
                <input type="datetime-local" value={appointment} onChange={(e) => setAppointment(e.target.value)} required />
              </div>
              <button className="btn" type="submit">
                Request Appointment
              </button>
            </form>

            <form className="card" onSubmit={sendMessage}>
              <h2>Message Shop</h2>
              <div className="field">
                <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required />
              </div>
              <button className="btn" type="submit">
                Send Message
              </button>
            </form>
          </div>

          <div className="grid" style={{ marginTop: 18 }}>
            <div className="card">
              <h2>Media</h2>
              {data.media.map((item: any) => (
                <p className="muted" key={item.id}>
                  <a href={`${apiBaseUrl.replace('/api', '')}${item.media_url}`} target="_blank">
                    {item.original_name}
                  </a>{' '}
                  - {item.content_type}
                </p>
              ))}
            </div>

            <div className="card">
              <h2>Estimates</h2>
              {data.estimates.map((estimate: any) => (
                <div key={estimate.id}>
                  <p>
                    <b>{estimate.estimate_type}</b> - {estimate.status} - {money(estimate.total)}
                  </p>
                  {estimate.line_items.map((item: any) => (
                    <p className="muted" key={item.id}>
                      {item.description}: {money(item.amount)}
                    </p>
                  ))}
                </div>
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
          </div>
        </>
      )}
    </main>
  )
}
