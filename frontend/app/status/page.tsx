'use client'

import { useState } from 'react'
import { apiBaseUrl } from '../../lib/config'

export default function Page() {
  const [quoteId, setQuoteId] = useState('')
  const [contact, setContact] = useState('')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load(e?: React.FormEvent) {
    e?.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(
        `${apiBaseUrl}/portal/quotes/${encodeURIComponent(quoteId)}?contact=${encodeURIComponent(contact)}`
      )
      const body = await res.json()

      if (!res.ok) {
        throw new Error(body.detail || 'Status lookup failed')
      }

      setData(body)
    } catch (err: any) {
      setData(null)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="section">
      <h1>Check Quote / Job Status</h1>
      <p className="muted">
        Enter your quote number and the phone number or email used on the request.
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
          {loading ? 'Checking...' : 'Check Status'}
        </button>
        {error && <p className="muted">Lookup error: {error}</p>}
      </form>

      {data && (
        <div className="grid">
          <div className="card">
            <h2>Quote #{data.quote.id}</h2>
            <p>
              <b>{data.quote.status}</b>
            </p>
            <p className="muted">
              {data.vehicle.year} {data.vehicle.make} {data.vehicle.model}
            </p>
            <p className="muted">{data.quote.service_type}</p>
            <a className="btn secondary" href={`/portal?quote=${data.quote.id}&contact=${encodeURIComponent(contact)}`}>
              Open Portal
            </a>
          </div>

          <div className="card">
            <h2>Next Records</h2>
            <p className="muted">Media uploaded: {data.media.length}</p>
            <p className="muted">Appointments: {data.appointments.length}</p>
            <p className="muted">Estimates: {data.estimates.length}</p>
            <p className="muted">Jobs: {data.jobs.length}</p>
          </div>
        </div>
      )}
    </main>
  )
}
