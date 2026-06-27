'use client'

import { useEffect, useState } from 'react'
import { apiBaseUrl } from '../../lib/config'

export default function Admin() {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [search, setSearch] = useState<any>(null)

  useEffect(() => {
    fetch(`${apiBaseUrl}/dashboard`)
      .then((r) => r.json())
      .then(setRows)
      .catch(() => {})
  }, [])

  return (
    <main className="section">
      <h1>Shop Dashboard</h1>
      <p className="muted">
        Review incoming requests, search customer and vehicle records, and open a quote to manage
        estimates, appointments, media, messages, supplements, invoices, and payments.
      </p>

      <div className="card">
        <div className="field">
          <label>Global Search</label>
          <input
            style={{ width: '100%', padding: 12, borderRadius: 10 }}
            aria-label="Search customers, vehicles, jobs, VIN, phone, or plate"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button
          className="btn"
          onClick={() =>
            fetch(`${apiBaseUrl}/search?q=${encodeURIComponent(q)}`)
              .then((r) => r.json())
              .then(setSearch)
          }
        >
          Search
        </button>
      </div>

      {search && (
        <div className="card">
          <h2>Search Results</h2>
          <pre>{JSON.stringify(search, null, 2)}</pre>
        </div>
      )}

      <h2>Recent Quote Requests</h2>
      <div className="grid">
        {rows.map((row) => (
          <div className="card" key={row.id}>
            <h3>Quote #{row.id}</h3>
            <p>{row.service_type}</p>
            <p className="muted">{row.payment_type}</p>
            <p>
              <b>{row.status}</b>
            </p>
            <a className="btn secondary" href={`/admin/quotes/${row.id}`}>
              Open
            </a>
          </div>
        ))}
      </div>
    </main>
  )
}
