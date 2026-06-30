'use client'

import { useEffect, useState } from 'react'
import { apiBaseUrl } from '../../lib/config'

export default function Admin() {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [search, setSearch] = useState<any>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${apiBaseUrl}/dashboard`)
      .then((r) => r.json())
      .then(setRows)
      .catch(() => {})
  }, [])

  async function deleteQuote(id: number) {
    const confirmed = window.confirm(
      `Delete quote #${id}? This permanently removes the quote, related messages, appointments, estimates, jobs, invoices, payments, timeline entries, and uploaded media.`
    )

    if (!confirmed) return

    setNotice('')
    setError('')

    try {
      const res = await fetch(`${apiBaseUrl}/quotes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      setRows((current) => current.filter((row) => row.id !== id))
      setNotice(`Quote #${id} deleted.`)
    } catch (err: any) {
      setError(`Quote #${id} delete failed: ${err.message}`)
    }
  }

  return (
    <main className="section">
      <h1>Shop Dashboard</h1>
      {error && <p className="muted">Error: {error}</p>}
      {notice && <p className="muted">{notice}</p>}
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
            <button className="btn danger" type="button" onClick={() => deleteQuote(row.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
