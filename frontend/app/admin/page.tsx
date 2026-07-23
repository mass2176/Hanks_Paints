'use client'

import { useEffect, useState } from 'react'
import { apiBaseUrl } from '../../lib/config'
import {
  clearShopSession,
  loadCurrentShopUser,
  shopFetch,
  storeShopSession,
  type ShopUser,
} from '../../lib/shopAuth'

export default function Admin() {
  const [user, setUser] = useState<ShopUser | null>(null)
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [search, setSearch] = useState<any>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shopUsers, setShopUsers] = useState<any[]>([])
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'admin' | 'employee'>('employee')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCurrentShopUser()
      .then((currentUser) => {
        setUser(currentUser)
        return Promise.all([
          loadDashboard(),
          currentUser.role === 'admin' ? loadShopUsers() : Promise.resolve(),
        ])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function loadDashboard() {
    const res = await shopFetch('/dashboard')
    const body = await res.json()
    if (!res.ok) throw new Error(body.detail || 'Dashboard load failed')
    setRows(body)
  }

  async function loadShopUsers() {
    const res = await shopFetch('/shop-users')
    const body = await res.json()
    if (!res.ok) throw new Error(body.detail || 'Shop users load failed')
    setShopUsers(body)
  }

  async function runSearch() {
    const res = await shopFetch(`/search?q=${encodeURIComponent(q)}`)
    const body = await res.json()
    if (!res.ok) throw new Error(body.detail || 'Search failed')
    setSearch(body)
  }

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setNotice('')

    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.detail || 'Login failed')
      storeShopSession(body.access_token, body.user)
      setUser(body.user)
      setEmail('')
      setPassword('')
      await loadDashboard()
      if (body.user.role === 'admin') {
        await loadShopUsers()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function createShopUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setNotice('')

    try {
      const res = await shopFetch('/shop-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          full_name: newUserName,
          password: newUserPassword,
          role: newUserRole,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.detail || 'User creation failed')
      setNewUserName('')
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserRole('employee')
      setNotice(`Created ${body.role} login for ${body.full_name}.`)
      await loadShopUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  function logout() {
    clearShopSession()
    setUser(null)
    setRows([])
    setSearch(null)
    setShopUsers([])
    setNotice('Logged out.')
  }

  async function deleteQuote(id: number) {
    const confirmed = window.confirm(
      `Delete quote #${id}? This permanently removes the quote, related messages, appointments, estimates, jobs, invoices, payments, timeline entries, and uploaded media.`
    )

    if (!confirmed) return

    setNotice('')
    setError('')

    try {
      const res = await shopFetch(`/quotes/${id}`, { method: 'DELETE' })
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

      {loading && <p className="muted">Checking shop login...</p>}

      {!loading && !user && (
        <div className="form">
          <h2>Shop Login</h2>
          <p className="muted">Admin and employee access for the Hanks Paints shop dashboard.</p>
          <form onSubmit={login}>
            <div className="field">
              <label>Email</label>
              <input
                autoComplete="username"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn" type="submit">
              Log In
            </button>
          </form>
        </div>
      )}

      {user && (
        <>
          <div className="btns">
            <p className="muted">
              Logged in as {user.full_name} ({user.role})
            </p>
            <button className="btn secondary" type="button" onClick={logout}>
              Log Out
            </button>
          </div>
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
            <button className="btn" onClick={() => runSearch().catch((err) => setError(err.message))}>
              Search
            </button>
          </div>

          {search && (
            <div className="card">
              <h2>Search Results</h2>
              <pre>{JSON.stringify(search, null, 2)}</pre>
            </div>
          )}

          {user.role === 'admin' && (
            <div className="card">
              <h2>Shop Users</h2>
              <div className="user-list">
                {shopUsers.map((item) => (
                  <div className="user-row" key={item.id}>
                    <p>
                      <b>{item.full_name}</b>
                      <br />
                      <span className="muted">{item.email}</span>
                    </p>
                    <p>
                      <b>{item.role}</b>
                    </p>
                  </div>
                ))}
              </div>
              <form onSubmit={createShopUser} style={{ marginTop: 18 }}>
                <div className="row">
                  <div className="field">
                    <label>Full Name</label>
                    <input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label>Role</label>
                    <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'employee')}>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Temporary Password</label>
                    <input
                      type="password"
                      minLength={8}
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button className="btn" type="submit">
                  Create Shop User
                </button>
              </form>
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
                {user.role === 'admin' && (
                  <button className="btn danger" type="button" onClick={() => deleteQuote(row.id)}>
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
