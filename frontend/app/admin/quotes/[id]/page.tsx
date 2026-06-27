'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import { apiBaseUrl } from '../../../../lib/config'

export default function QuoteDetail() {
  const params = useParams()
  const id = params.id as string
  const [timeline, setTimeline] = useState<any[]>([])

  function load() {
    fetch(`${apiBaseUrl}/quotes/${id}/timeline`)
      .then((r) => r.json())
      .then(setTimeline)
  }

  useEffect(() => {
    if (id) load()
  }, [id])

  return (
    <main className="section">
      <h1>Quote #{id}</h1>

      <div className="btns">
        <button
          className="btn"
          onClick={() =>
            fetch(`${apiBaseUrl}/quotes/${id}/start-quotation`, { method: 'POST' }).then(load)
          }
        >
          Start Quotation
        </button>

        <button
          className="btn secondary"
          onClick={() =>
            fetch(`${apiBaseUrl}/quotes/${id}/inspection-complete`, { method: 'POST' }).then(load)
          }
        >
          Mark Inspection Complete
        </button>
      </div>

      <div className="card">
        <h2>Timeline</h2>
        {timeline.map((t, i) => (
          <p key={i}>
            <b>{t.event}</b> — {t.actor}
            <br />
            <span className="muted">
              {new Date(t.created_at).toLocaleString()} {t.detail || ''}
            </span>
          </p>
        ))}
      </div>
    </main>
  )
}
