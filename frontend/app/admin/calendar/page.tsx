'use client'

import { useEffect, useMemo, useState } from 'react'
import { loadCurrentShopUser, shopFetch, type ShopUser } from '../../../lib/shopAuth'

type InspectionAppointment = {
  id: number
  quote_id: number
  customer_name: string
  customer_phone: string
  vehicle: string
  requested_start: string
  confirmed_start: string | null
  display_start: string
  status: string
  notes: string | null
}

type ShopNotification = {
  id: number
  quote_id: number
  customer_name: string
  customer_phone: string
  vehicle: string
  service_type: string
  status: string
  body: string
  created_at: string
  display_created_at: string
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function startOfWeek(value: Date) {
  const date = new Date(value)
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + mondayOffset)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(value: Date, days: number) {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
  )
}

function appointmentDate(appointment: InspectionAppointment) {
  return new Date(appointment.confirmed_start || appointment.requested_start)
}

function appointmentTime(appointment: InspectionAppointment) {
  return appointmentDate(appointment).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function dateLabel(value: Date) {
  return value.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

export default function InspectionCalendar() {
  const [user, setUser] = useState<ShopUser | null>(null)
  const [appointments, setAppointments] = useState<InspectionAppointment[]>([])
  const [notifications, setNotifications] = useState<ShopNotification[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function loadAppointments() {
    const res = await shopFetch('/inspection-appointments')
    const body = await res.json()
    if (!res.ok) throw new Error(body.detail || 'Inspection calendar load failed')
    setAppointments(body)
    setLastUpdated(new Date())
  }

  async function loadNotifications() {
    const res = await shopFetch('/shop-notifications')
    const body = await res.json()
    if (!res.ok) throw new Error(body.detail || 'Shop notifications load failed')
    setNotifications(body)
    setLastUpdated(new Date())
  }

  async function loadBoard() {
    await Promise.all([loadAppointments(), loadNotifications()])
  }

  useEffect(() => {
    loadCurrentShopUser()
      .then((currentUser) => {
        setUser(currentUser)
        return loadBoard()
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))

    const interval = window.setInterval(() => {
      loadBoard().catch((err) => setError(err.message))
    }, 15000)

    return () => window.clearInterval(interval)
  }, [])

  const weekStart = useMemo(() => startOfWeek(new Date()), [])
  const weekDays = useMemo(() => dayNames.map((_, index) => addDays(weekStart, index)), [weekStart])
  const todaysAppointments = appointments.filter((appointment) => sameDay(appointmentDate(appointment), new Date()))
  const upcomingAppointments = appointments
    .filter((appointment) => appointmentDate(appointment) >= new Date())
    .slice(0, 12)

  return (
    <main className="calendar-board">
      <header className="calendar-header">
        <div>
          <p className="calendar-kicker">Hanks Paints</p>
          <h1>Inspection Calendar</h1>
        </div>
        <div className="calendar-meta">
          <p>{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
        </div>
      </header>

      {loading && <p className="muted">Loading calendar...</p>}

      {!loading && !user && (
        <div className="calendar-empty">
          <h2>Shop Login Required</h2>
          <p className="muted">Log in on the shop dashboard before opening the office calendar.</p>
          <a className="btn" href="/admin">
            Go to Shop Login
          </a>
        </div>
      )}

      {error && <p className="muted">Error: {error}</p>}

      {user && (
        <>
          <section className="today-strip">
            <div>
              <p className="calendar-kicker">Today</p>
              <h2>{todaysAppointments.length} Scheduled Inspection{todaysAppointments.length === 1 ? '' : 's'}</h2>
            </div>
            <div className={`notification-count ${notifications.length ? 'notification-count-active' : ''}`}>
              <span>{notifications.length}</span>
              <small>Need Response</small>
            </div>
            <a className="btn secondary" href="/admin">
              Dashboard
            </a>
          </section>

          <section className="calendar-grid">
            {weekDays.map((day, index) => {
              const dayAppointments = appointments.filter((appointment) => sameDay(appointmentDate(appointment), day))
              return (
                <div className={`calendar-day ${sameDay(day, new Date()) ? 'calendar-day-today' : ''}`} key={day.toISOString()}>
                  <div className="calendar-day-heading">
                    <span>{dayNames[index]}</span>
                    <b>{dateLabel(day)}</b>
                  </div>
                  <div className="calendar-day-events">
                    {dayAppointments.length ? dayAppointments.map((appointment) => (
                      <a
                        className="calendar-event"
                        href={`/admin/quotes/${appointment.quote_id}`}
                        key={appointment.id}
                      >
                        <span>{appointmentTime(appointment)}</span>
                        <b>Quote #{appointment.quote_id}</b>
                        <small>{appointment.customer_name}</small>
                        <small>{appointment.vehicle}</small>
                      </a>
                    )) : (
                      <p className="calendar-no-events">No inspections</p>
                    )}
                  </div>
                </div>
              )
            })}
          </section>

          <section className="calendar-upcoming">
            <h2>Needs Response</h2>
            <div className="notification-list">
              {notifications.length ? notifications.map((notification) => (
                <a className="notification-row" href={`/admin/quotes/${notification.quote_id}`} key={notification.id}>
                  <div>
                    <b>Quote #{notification.quote_id} - {notification.customer_name}</b>
                    <span>{notification.vehicle || notification.service_type}</span>
                    <small>{notification.display_created_at}</small>
                  </div>
                  <p>{notification.body}</p>
                </a>
              )) : (
                <p className="calendar-no-events">No customer messages are waiting on a shop response.</p>
              )}
            </div>
          </section>

          <section className="calendar-upcoming">
            <h2>Upcoming</h2>
            <div className="calendar-upcoming-list">
              {upcomingAppointments.length ? upcomingAppointments.map((appointment) => (
                <a className="calendar-upcoming-row" href={`/admin/quotes/${appointment.quote_id}`} key={appointment.id}>
                  <span>{appointment.display_start}</span>
                  <b>Quote #{appointment.quote_id}</b>
                  <span>{appointment.customer_name}</span>
                  <span>{appointment.vehicle}</span>
                  <span>{appointment.status}</span>
                </a>
              )) : (
                <p className="calendar-no-events">No upcoming inspections are scheduled.</p>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
