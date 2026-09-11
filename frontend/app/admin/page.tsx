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

const statusHelp: Record<string, string> = {
  'Unverified / Pending Verification':
    'The request was created but customer verification is not complete. Next step: confirm one contact method before relying on private quote details.',
  'Request Received':
    'A customer submitted a new estimate request. Next step: open the quote, review the intake details and photos, then start review.',
  'Under Review':
    'The shop has started reviewing the request. Next step: decide whether photos are enough for a preliminary estimate or whether an in-person inspection is needed.',
  'More Info Needed':
    'The shop needs additional details from the customer. Next step: message the customer or request more photos/details.',
  'In-Person Inspection Needed':
    'Photos are not enough to finalize pricing. Next step: have the customer request an inspection time and confirm the appointment.',
  'Appointment Requested':
    'The customer requested an inspection appointment. Next step: confirm the requested time or coordinate a new time.',
  'Appointment Confirmed':
    'The inspection appointment is scheduled. Next step: complete the physical inspection before creating a final estimate.',
  'Physical Inspection Completed':
    'The vehicle has been inspected in person. Next step: create or update the final line-item estimate.',
  'Preliminary Estimate Ready':
    'A photo-based preliminary estimate is ready. This does not authorize repairs. Next step: share it with the customer or require inspection for a final estimate.',
  'Final Estimate Ready':
    'The final estimate is ready for customer approval. Next step: customer reviews and signs the final estimate in the portal.',
  'Final Estimate Approved':
    'The customer signed and approved the final estimate. Next step: convert the approved quote to an active job.',
  'Converted to Job':
    'The approved quote is now an active repair job. Next step: manage repair progress, supplements, invoice, and payment tracking.',
}

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function formatTime(value: string) {
  const [hourRaw, minute = '00'] = value.split(':')
  const hour = Number(hourRaw)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minute} ${suffix}`
}

function StatusHelp({ status }: { status: string }) {
  const helpText = statusHelp[status] || 'Open the quote to review the current workflow state and available next actions.'

  return (
    <span className="status-help-wrap">
      <button className="status-help" type="button" aria-label={`What ${status} means`}>
        ?
      </button>
      <span className="status-tooltip" role="tooltip">
        {helpText}
      </span>
    </span>
  )
}

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
  const [availability, setAvailability] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [availabilityDay, setAvailabilityDay] = useState('weekdays')
  const [availabilityStart, setAvailabilityStart] = useState('15:00')
  const [availabilityEnd, setAvailabilityEnd] = useState('17:00')
  const [availabilitySlotMinutes, setAvailabilitySlotMinutes] = useState('30')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCurrentShopUser()
      .then((currentUser) => {
        setUser(currentUser)
        return Promise.all([
          loadDashboard(),
          loadAppointments(),
          loadAvailability(),
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

  async function loadAvailability() {
    const res = await shopFetch('/inspection-availability')
    const body = await res.json()
    if (!res.ok) throw new Error(body.detail || 'Inspection availability load failed')
    setAvailability(body)
  }

  async function loadAppointments() {
    const res = await shopFetch('/inspection-appointments')
    const body = await res.json()
    if (!res.ok) throw new Error(body.detail || 'Inspection appointments load failed')
    setAppointments(body)
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
      await loadAppointments()
      await loadAvailability()
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

  async function createAvailability(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setNotice('')

    try {
      const days = availabilityDay === 'weekdays'
        ? [0, 1, 2, 3, 4]
        : [Number(availabilityDay)]

      for (const weekday of days) {
        const res = await shopFetch('/inspection-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weekday,
            start_time: availabilityStart,
            end_time: availabilityEnd,
            slot_minutes: Number(availabilitySlotMinutes),
            active: true,
          }),
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.detail || 'Availability creation failed')
      }

      setNotice('Inspection availability added.')
      await loadAvailability()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function deleteAvailability(id: number) {
    setError('')
    setNotice('')

    try {
      const res = await shopFetch(`/inspection-availability/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      setAvailability((current) => current.filter((item) => item.id !== id))
      setNotice('Inspection availability removed.')
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
    setAvailability([])
    setAppointments([])
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

          {user.role === 'admin' && (
            <div className="card">
              <h2>Inspection Availability</h2>
              <p className="muted">
                These windows create customer-selectable inspection times in the portal.
              </p>
              <form onSubmit={createAvailability}>
                <div className="row">
                  <div className="field">
                    <label>Day</label>
                    <select value={availabilityDay} onChange={(e) => setAvailabilityDay(e.target.value)}>
                      <option value="weekdays">Monday-Friday</option>
                      {weekdays.map((day, index) => (
                        <option key={day} value={index}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Slot Length</label>
                    <select value={availabilitySlotMinutes} onChange={(e) => setAvailabilitySlotMinutes(e.target.value)}>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                    </select>
                  </div>
                </div>
                <div className="row">
                  <div className="field">
                    <label>Start Time</label>
                    <input type="time" value={availabilityStart} onChange={(e) => setAvailabilityStart(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>End Time</label>
                    <input type="time" value={availabilityEnd} onChange={(e) => setAvailabilityEnd(e.target.value)} required />
                  </div>
                </div>
                <button className="btn" type="submit">
                  Add Availability
                </button>
              </form>
              <div className="user-list" style={{ marginTop: 18 }}>
                {availability.length ? availability.map((item) => (
                  <div className="user-row" key={item.id}>
                    <p>
                      <b>{weekdays[item.weekday]}</b>
                      <br />
                      <span className="muted">
                        {formatTime(item.start_time)}-{formatTime(item.end_time)} every {item.slot_minutes} minutes
                      </span>
                    </p>
                    <button className="btn danger" type="button" onClick={() => deleteAvailability(item.id)}>
                      Remove
                    </button>
                  </div>
                )) : (
                  <p className="muted">No inspection availability has been configured yet.</p>
                )}
              </div>
            </div>
          )}

          <div className="card">
            <h2>Inspection Calendar</h2>
            <div className="user-list">
              {appointments.length ? appointments.map((appointment) => (
                <div className="user-row" key={appointment.id}>
                  <p>
                    <b>{appointment.display_start}</b>
                    <br />
                    <span className="muted">
                      Quote #{appointment.quote_id} - {appointment.customer_name} - {appointment.vehicle}
                    </span>
                  </p>
                  <a className="btn secondary" href={`/admin/quotes/${appointment.quote_id}`}>
                    Open
                  </a>
                </div>
              )) : (
                <p className="muted">No upcoming inspection appointments.</p>
              )}
            </div>
          </div>

          <h2>Recent Quote Requests</h2>
          <div className="grid">
            {rows.map((row) => (
              <div className="card" key={row.id}>
                <h3>Quote #{row.id}</h3>
                <p className="muted quote-customer">{row.customer_name || 'Unknown Customer'}</p>
                <p>{row.service_type}</p>
                <p className="muted">{row.payment_type}</p>
                <p className="quote-status">
                  <b>{row.status}</b>
                  <StatusHelp status={row.status} />
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
