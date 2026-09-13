'use client'

import { useEffect, useState } from 'react'
import WorkflowMap from '../../../components/WorkflowMap'
import { loadCurrentShopUser, type ShopUser } from '../../../lib/shopAuth'

export default function AdminWorkflowPage() {
  const [user, setUser] = useState<ShopUser | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCurrentShopUser()
      .then((currentUser) => setUser(currentUser))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="section">
        <p className="muted">Loading workflow map...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="section">
        <div className="card">
          <h1>Shop Login Required</h1>
          <p className="muted">
            Log in on the shop dashboard before opening the admin workflow map.
          </p>
          {error && <p className="muted">Error: {error}</p>}
          <a className="btn" href="/admin">
            Go to Shop Login
          </a>
        </div>
      </main>
    )
  }

  return <WorkflowMap adminMode />
}
