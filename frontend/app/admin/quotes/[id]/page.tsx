'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { PrintableEstimate, PrintableInvoice } from '../../../../components/PrintableDocuments'
import { apiBaseUrl } from '../../../../lib/config'
import { copyEstimateLink, printEstimate, shareEstimate } from '../../../../lib/estimateShare'
import { loadCurrentShopUser, shopFetch, type ShopUser } from '../../../../lib/shopAuth'

function money(value: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function formatUsPhone(value: string) {
  const digits = (value || '').replace(/\D/g, '')
  const tenDigits = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits

  if (tenDigits.length !== 10) return value

  return `(${tenDigits.slice(0, 3)})-${tenDigits.slice(3, 6)}-${tenDigits.slice(6)}`
}

function emptyLineItem() {
  return { description: '', amount: '' }
}

function CollapsibleCard({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="card">
      <button
        aria-expanded={open}
        className="muted"
        onClick={() => setOpen((current) => !current)}
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 0,
          color: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          font: 'inherit',
          justifyContent: 'space-between',
          padding: 0,
          textAlign: 'left',
          width: '100%',
        }}
        type="button"
      >
        <h2 style={{ margin: 0 }}>{title}</h2>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  )
}

export default function QuoteDetail() {
  const params = useParams()
  const id = params.id as string
  const [user, setUser] = useState<ShopUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
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
  const [inspectionSlots, setInspectionSlots] = useState<any[]>([])
  const [selectedInspectionSlot, setSelectedInspectionSlot] = useState('')
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('')
  const [rescheduleSlotByAppointment, setRescheduleSlotByAppointment] = useState<Record<string, string>>({})
  const [rescheduleNotesByAppointment, setRescheduleNotesByAppointment] = useState<Record<string, string>>({})
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  async function load() {
    const res = await shopFetch(`/quotes/${id}`)
    const body = await res.json()
    if (!res.ok) throw new Error(body.detail || 'Quote load failed')
    setData(body)

    const slotsRes = await fetch(`${apiBaseUrl}/quotes/${id}/inspection-slots`)
    const slotsBody = await slotsRes.json()
    setInspectionSlots(slotsRes.ok ? slotsBody : [])
  }

  async function loadMessages() {
    const res = await shopFetch(`/quotes/${id}/messages`)
    const body = await res.json()
    if (!res.ok) throw new Error(body.detail || 'Message load failed')
    setData((current: any) => current ? { ...current, messages: body } : current)
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
      const res = await shopFetch(`/quotes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      window.location.href = '/admin'
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (id) {
      loadCurrentShopUser()
        .then((currentUser) => {
          setUser(currentUser)
          return load()
        })
        .catch((err) => setError(err.message))
        .finally(() => setAuthChecked(true))
    }
  }, [id])

  useEffect(() => {
    if (!user || !data) return

    const timer = window.setInterval(() => {
      loadMessages().catch((err) => setError(err.message))
    }, 5000)

    return () => window.clearInterval(timer)
  }, [user, data?.quote?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' })
  }, [data?.messages?.length])

  const latestJob = data?.jobs?.[0]
  const latestInvoice = latestJob?.invoices?.[0]
  const existingEstimate = data?.estimates?.[0]
  const showEstimateForm = !existingEstimate || editingEstimateId !== null
  const quoteStatus = data?.quote?.status || ''
  const quotationComplete = quoteStatus === 'Preliminary Estimate Ready' || quoteStatus === 'Final Estimate Ready'
  const quoteApproved = quoteStatus === 'Final Estimate Approved'
  const quoteConverted = quoteStatus === 'Converted to Job'
  const inspectionComplete = Boolean(data?.quote?.physical_inspection_completed)
  const inspectionLocked = quotationComplete || quoteApproved || quoteConverted
  const activeAppointments = data?.appointments?.filter((item: any) => (
    item.status === 'Appointment Requested' || item.status === 'Appointment Confirmed'
  )) || []
  const estimateStatus = existingEstimate
    ? `${existingEstimate.estimate_type === 'final' ? 'Final Estimate' : 'Preliminary Photo Estimate'}`
    : 'Not Created'
  const requestStatus = quoteStatus === 'Preliminary Estimate Ready'
    ? 'Ready for Customer Review'
    : quoteStatus === 'Final Estimate Ready'
      ? 'Ready for Customer Approval'
      : quoteStatus
  const workflowButtonText = quoteStatus === 'Request Received'
    ? 'Start Review'
    : quotationComplete
      ? 'Reopen Quotation'
      : quoteApproved
        ? 'Convert to Active Job'
        : existingEstimate
          ? 'Complete Quotation'
          : ''
  const workflowButtonDisabled = !data || quoteConverted
  const showWorkflowButton = Boolean(workflowButtonText) || quoteConverted
  const finalWorkflowLabel = quoteConverted ? 'Converted to Job' : workflowButtonText

  async function runWorkflowAction() {
    if (quoteStatus === 'Request Received') {
      await run(async () => {
        const res = await shopFetch(`/quotes/${id}/start-quotation`, { method: 'POST' })
        if (!res.ok) throw new Error(await res.text())
      }, 'Review started.')
      return
    }

    if (quotationComplete) {
      const confirmed = window.confirm('Reopen this quote for changes? This will move it back to Under Review.')
      if (!confirmed) return

      await run(async () => {
        const res = await shopFetch(`/quotes/${id}/reopen-quotation`, { method: 'POST' })
        if (!res.ok) throw new Error(await res.text())
      }, 'Quotation reopened.')
      return
    }

    if (quoteApproved) {
      await run(async () => {
        const res = await shopFetch(`/quotes/${id}/convert-to-job`, { method: 'POST' })
        if (!res.ok) throw new Error(await res.text())
      }, 'Quote converted to active job.')
      return
    }

    if (existingEstimate) {
      await run(async () => {
        const res = await shopFetch(`/quotes/${id}/quotation-complete`, { method: 'POST' })
        if (!res.ok) throw new Error(await res.text())
      }, 'Quotation marked complete.')
    }
  }

  async function markInspectionComplete() {
    const confirmed = window.confirm('Confirm that this vehicle has been physically inspected in person?')
    if (!confirmed) return

    const notes = window.prompt('Enter inspection notes. Include who inspected the vehicle and any key findings.')
    if (notes === null) return

    const trimmedNotes = notes.trim()
    if (!trimmedNotes) {
      setError('Inspection notes are required before marking inspection complete.')
      return
    }

    await run(async () => {
      const res = await shopFetch(`/quotes/${id}/inspection-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: trimmedNotes }),
      })
      if (!res.ok) throw new Error(await res.text())
    }, 'Inspection marked complete.')
  }

  async function requestInspectionAction() {
    const phone = formatUsPhone(data?.customer?.phone || '')
    const confirmed = window.confirm(`Text inspection scheduling link to ${phone}?`)
    if (!confirmed) return

    await run(async () => {
      const res = await shopFetch(`/quotes/${id}/request-inspection`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
    }, `Inspection scheduling text sent to ${phone}.`)
  }

  async function scheduleInspectionAction(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (activeAppointments.length) {
      const activeAppointment = activeAppointments[0]
      setSelectedAppointmentId(String(activeAppointment.id))
      window.alert('This quote already has an active inspection appointment. Use Reschedule to choose a new time, or Cancel the existing appointment before scheduling another one.')
      return
    }

    await run(async () => {
      const res = await shopFetch(`/quotes/${id}/shop-appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requested_start: selectedInspectionSlot,
          notes: inspectionNotes || 'Scheduled by shop',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSelectedInspectionSlot('')
      setInspectionNotes('')
    }, 'Inspection appointment scheduled.')
  }

  async function rescheduleInspectionAction(appointmentId: number) {
    const appointmentKey = String(appointmentId)
    const selectedSlot = rescheduleSlotByAppointment[appointmentKey]
    if (!selectedSlot) {
      setError('Select a new inspection time before rescheduling.')
      return
    }

    await run(async () => {
      const res = await shopFetch(`/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requested_start: selectedSlot,
          notes: rescheduleNotesByAppointment[appointmentKey] || 'Rescheduled by shop',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSelectedAppointmentId('')
      setRescheduleSlotByAppointment((current) => {
        const next = { ...current }
        delete next[appointmentKey]
        return next
      })
      setRescheduleNotesByAppointment((current) => {
        const next = { ...current }
        delete next[appointmentKey]
        return next
      })
    }, 'Inspection appointment rescheduled.')
  }

  async function updateAppointmentStatus(appointmentId: number, action: 'cancel' | 'no-show') {
    const label = action === 'no-show' ? 'mark this inspection as a no-show' : 'cancel this inspection'
    const confirmed = window.confirm(`Are you sure you want to ${label}?`)
    if (!confirmed) return

    const notes = window.prompt('Optional note for the appointment history:', '') ?? ''
    await run(async () => {
      const res = await shopFetch(`/appointments/${appointmentId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error(await res.text())
    }, action === 'no-show' ? 'Inspection marked no-show.' : 'Inspection canceled.')
  }

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

  async function shareEstimateAction(estimate: any) {
    setError('')
    setNotice('')

    try {
      const message = await shareEstimate({
        quoteId: id,
        estimateType: estimate.estimate_type,
        total: estimate.total,
      })
      setNotice(message)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      }
    }
  }

  async function copyEstimateAction() {
    setError('')
    setNotice('')

    try {
      setNotice(await copyEstimateLink(id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function textInvoiceAction(invoice: any) {
    const phone = formatUsPhone(data?.customer?.phone || '')
    const confirmed = window.confirm(`Text invoice #${invoice.id} to ${phone}?`)
    if (!confirmed) return

    await run(async () => {
      const res = await shopFetch(`/invoices/${invoice.id}/send-sms`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
    }, `Invoice #${invoice.id} text sent to ${phone}.`)
  }

  async function textEstimateAction(estimate: any) {
    const phone = formatUsPhone(data?.customer?.phone || '')
    const confirmed = window.confirm(`Text estimate #${estimate.id} to ${phone}?`)
    if (!confirmed) return

    await run(async () => {
      const res = await shopFetch(`/estimates/${estimate.id}/send-sms`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
    }, `Estimate #${estimate.id} text sent to ${phone}.`)
  }

  async function sendShopMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const body = shopMessage.trim()
    if (!body) return

    await run(async () => {
      const res = await shopFetch(`/quotes/${id}/shop-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_type: 'shop', body }),
      })
      if (!res.ok) throw new Error(await res.text())
      setShopMessage('')
    }, 'Message texted to customer.')
  }

  return (
    <main className="section">
      <h1>Quote #{id}</h1>
      {error && <p className="muted">Error: {error}</p>}
      {notice && <p className="muted">{notice}</p>}
      {!authChecked && <p className="muted">Checking shop login...</p>}
      {authChecked && !user && (
        <div className="card">
          <h2>Shop Login Required</h2>
          <p className="muted">Log in before opening shop quote records.</p>
          <a className="btn" href="/admin">
            Go to Shop Login
          </a>
        </div>
      )}

      {user && data && (
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
              <p className="muted">{formatUsPhone(data.customer.phone)} / {data.customer.email}</p>
              <p className="muted">{data.quote.damage_description}</p>
            </div>

            <CollapsibleCard title="Workflow" defaultOpen>
              <p className="muted">
                Request Status: {requestStatus}
              </p>
              <p className="muted">
                Estimate Type: {estimateStatus}
              </p>
              <p className="muted">
                Inspection: {inspectionComplete ? 'Completed' : 'Not Completed'}
              </p>
              {!existingEstimate && quoteStatus !== 'Request Received' && (
                <p className="muted">Create an estimate before completing quotation.</p>
              )}
              <div className="btns">
                {showWorkflowButton && (
                  <button
                    className="btn"
                    disabled={workflowButtonDisabled}
                    onClick={runWorkflowAction}
                  >
                    {finalWorkflowLabel}
                  </button>
                )}
                {!inspectionComplete && !inspectionLocked && (
                  <button
                    className="btn secondary"
                    onClick={markInspectionComplete}
                  >
                    Mark Inspection Complete
                  </button>
                )}
                {!inspectionComplete && !inspectionLocked && (
                  <button
                    className="btn secondary"
                    onClick={requestInspectionAction}
                    type="button"
                  >
                    Request On-Site Inspection
                  </button>
                )}
              </div>
            </CollapsibleCard>

            {user.role === 'admin' && (
              <CollapsibleCard title="Admin Actions">
                <div className="btns">
                  <button className="btn danger" type="button" onClick={deleteQuote}>
                    Delete Quote
                  </button>
                </div>
              </CollapsibleCard>
            )}
          </div>

          <div className="grid" style={{ marginTop: 18 }}>
            {showEstimateForm ? (
              <CollapsibleCard title={editingEstimateId ? `Edit Estimate #${editingEstimateId}` : 'Create Estimate'} defaultOpen>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    run(async () => {
                      const endpoint = editingEstimateId
                        ? `/estimates/${editingEstimateId}`
                        : `/quotes/${id}/estimates`
                      const res = await shopFetch(endpoint, {
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
              </CollapsibleCard>
            ) : (
              <CollapsibleCard title="Estimate" defaultOpen>
                <p>
                  <b>#{existingEstimate.id} {existingEstimate.estimate_type}</b> - {existingEstimate.status} - {money(existingEstimate.total)}
                </p>
                {existingEstimate.line_items.map((item: any) => (
                  <p className="muted" key={item.id}>
                    {item.description}: {money(item.amount)}
                  </p>
                ))}
                {existingEstimate.customer_notes && (
                  <p className="muted">Customer Notes: {existingEstimate.customer_notes}</p>
                )}
                {existingEstimate.internal_notes && (
                  <p className="muted">Internal Notes: {existingEstimate.internal_notes}</p>
                )}
                <div className="btns">
                  <button className="btn secondary" type="button" onClick={() => shareEstimateAction(existingEstimate)}>
                    Share Estimate
                  </button>
                  <button className="btn secondary" type="button" onClick={() => textEstimateAction(existingEstimate)}>
                    Text Estimate
                  </button>
                  <button className="btn secondary" type="button" onClick={() => printEstimate(`estimate-print-${existingEstimate.id}`)}>
                    Print Estimate
                  </button>
                  <button className="btn secondary" type="button" onClick={copyEstimateAction}>
                    Copy Link
                  </button>
                  <button className="btn secondary" type="button" onClick={() => editEstimate(existingEstimate)}>
                    Edit Estimate
                  </button>
                </div>
                <PrintableEstimate
                  data={data}
                  estimate={existingEstimate}
                  id={`estimate-print-${existingEstimate.id}`}
                />
              </CollapsibleCard>
            )}

            <CollapsibleCard title="Upload Shop Media">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  run(async () => {
                    if (!files?.length) return
                    for (const file of Array.from(files)) {
                      const body = new FormData()
                      body.append('file', file)
                      const res = await shopFetch(
                        `/quotes/${id}/media?visibility=${mediaVisibility}&uploaded_by=employee`,
                        { method: 'POST', body }
                      )
                      if (!res.ok) throw new Error(await res.text())
                    }
                    setFiles(null)
                  }, 'Shop media uploaded.')
                }}
              >
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
            </CollapsibleCard>

            <CollapsibleCard title="Message Customer">
              <div
                aria-live="polite"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxHeight: 360,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {data.messages.length ? data.messages.map((item: any) => {
                  const isShop = item.sender_type === 'shop'
                  return (
                    <div
                      key={item.id}
                      style={{
                        alignSelf: isShop ? 'flex-end' : 'flex-start',
                        background: isShop ? 'rgba(0, 191, 255, 0.16)' : 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: 8,
                        maxWidth: '85%',
                        padding: '10px 12px',
                      }}
                    >
                      <p style={{ margin: 0 }}>{item.body}</p>
                      <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>
                        {isShop ? 'Shop' : 'Customer'} - {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  )
                }) : (
                  <p className="muted">No customer messages yet.</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendShopMessage} style={{ marginTop: 16 }}>
                <div className="field">
                  <label>Text Message</label>
                  <textarea
                    placeholder="Type a service-related message for this customer..."
                    rows={4}
                    value={shopMessage}
                    onChange={(e) => setShopMessage(e.target.value)}
                    required
                  />
                </div>
                <button className="btn" type="submit">
                  Text Customer
                </button>
              </form>
            </CollapsibleCard>
          </div>

          <div className="grid" style={{ marginTop: 18 }}>
            <CollapsibleCard title="Appointments">
              <form onSubmit={scheduleInspectionAction}>
                {activeAppointments.length > 0 && (
                  <p className="form-alert">
                    An inspection is already active for this quote. Reschedule or cancel the existing appointment before adding another one.
                  </p>
                )}
                <div className="field">
                  <label>Available Inspection Time</label>
                  <select
                    disabled={activeAppointments.length > 0}
                    required={!activeAppointments.length}
                    value={selectedInspectionSlot}
                    onChange={(e) => setSelectedInspectionSlot(e.target.value)}
                  >
                    <option value="">Select an available time</option>
                    {inspectionSlots.map((slot) => (
                      <option key={slot.start} value={slot.start}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Appointment Notes</label>
                  <textarea rows={3} value={inspectionNotes} onChange={(e) => setInspectionNotes(e.target.value)} />
                </div>
                {!inspectionSlots.length && (
                  <p className="muted">No inspection availability is configured or all upcoming slots are booked.</p>
                )}
                <button className="btn" disabled={!activeAppointments.length && (!selectedInspectionSlot || !inspectionSlots.length)} type="submit">
                  Schedule Inspection
                </button>
              </form>

              <div className="user-list" style={{ marginTop: 18 }}>
                {data.appointments.length ? data.appointments.map((item: any) => (
                  <div className="appointment-row" key={item.id}>
                    <div className="user-row">
                      <p>
                        <b>{item.status}</b>
                        <br />
                        <span className="muted">
                          #{item.id} - {new Date(item.confirmed_start || item.requested_start).toLocaleString()}
                          {item.notes ? ` - ${item.notes}` : ''}
                        </span>
                      </p>
                      <div className="btns" style={{ marginTop: 0 }}>
                        {item.status !== 'Appointment Confirmed' && item.status !== 'Canceled' && item.status !== 'No-Show' && (
                          <button
                            className="btn secondary"
                            onClick={() =>
                              run(async () => {
                                const res = await shopFetch(`/appointments/${item.id}/confirm`, { method: 'POST' })
                                if (!res.ok) throw new Error(await res.text())
                              }, 'Appointment confirmed.')
                            }
                            type="button"
                          >
                            Confirm
                          </button>
                        )}
                        {(item.status === 'Appointment Requested' || item.status === 'Appointment Confirmed') && (
                          <>
                            <button
                              className="btn secondary"
                              onClick={() => {
                                setSelectedAppointmentId(selectedAppointmentId === String(item.id) ? '' : String(item.id))
                                setRescheduleNotesByAppointment((current) => ({
                                  ...current,
                                  [item.id]: current[item.id] ?? 'Rescheduled by shop',
                                }))
                              }}
                              type="button"
                            >
                              Reschedule
                            </button>
                            <button
                              className="btn secondary"
                              onClick={() => updateAppointmentStatus(item.id, 'no-show')}
                              type="button"
                            >
                              No-Show
                            </button>
                            <button
                              className="btn danger"
                              onClick={() => updateAppointmentStatus(item.id, 'cancel')}
                              type="button"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {selectedAppointmentId === String(item.id) && (
                      <div className="appointment-reschedule">
                        <div className="field">
                          <label>New Inspection Time</label>
                          <select
                            value={rescheduleSlotByAppointment[item.id] || ''}
                            onChange={(e) => setRescheduleSlotByAppointment((current) => ({
                              ...current,
                              [item.id]: e.target.value,
                            }))}
                            required
                          >
                            <option value="">Select a new available time</option>
                            {inspectionSlots.map((slot) => (
                              <option key={slot.start} value={slot.start}>
                                {slot.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="field">
                          <label>Reschedule Notes</label>
                          <textarea
                            rows={2}
                            value={rescheduleNotesByAppointment[item.id] || ''}
                            onChange={(e) => setRescheduleNotesByAppointment((current) => ({
                              ...current,
                              [item.id]: e.target.value,
                            }))}
                          />
                        </div>
                        <div className="btns" style={{ marginTop: 0 }}>
                          <button
                            className="btn"
                            disabled={!rescheduleSlotByAppointment[item.id]}
                            onClick={() => rescheduleInspectionAction(item.id)}
                            type="button"
                          >
                            Confirm Reschedule
                          </button>
                          <button
                            className="btn secondary"
                            onClick={() => setSelectedAppointmentId('')}
                            type="button"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )) : (
                  <p className="muted">No inspection appointments yet.</p>
                )}
              </div>
            </CollapsibleCard>

            <CollapsibleCard title="Media">
              {data.media.map((item: any) => (
                <p className="muted" key={item.id}>
                  <a href={`${apiBaseUrl.replace('/api', '')}${item.media_url}`} target="_blank">
                    {item.original_name}
                  </a>{' '}
                  - {item.visibility} - {item.uploaded_by}
                </p>
              ))}
            </CollapsibleCard>
          </div>

          {latestJob && (
            <div className="grid" style={{ marginTop: 18 }}>
              <CollapsibleCard title="Supplement">
                <p className="muted">Job #{latestJob.id} - {latestJob.status}</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    run(async () => {
                      const res = await shopFetch(
                        `/jobs/${latestJob.id}/supplements?reason=${encodeURIComponent(supplementReason)}&amount=${encodeURIComponent(supplementAmount || '0')}`,
                        { method: 'POST' }
                      )
                      if (!res.ok) throw new Error(await res.text())
                      setSupplementReason('')
                      setSupplementAmount('')
                    }, 'Supplement created.')
                  }}
                >
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
              </CollapsibleCard>

              <CollapsibleCard title="Invoice">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    run(async () => {
                      const res = await shopFetch(
                        `/jobs/${latestJob.id}/invoice?total_due=${encodeURIComponent(invoiceTotal)}`,
                        { method: 'POST' }
                      )
                      if (!res.ok) throw new Error(await res.text())
                      setInvoiceTotal('')
                    }, 'Invoice created.')
                  }}
                >
                  <div className="field">
                    <label>Total Due</label>
                    <input type="number" min="0" step="0.01" value={invoiceTotal} onChange={(e) => setInvoiceTotal(e.target.value)} required />
                  </div>
                  <button className="btn" type="submit">
                    Create Invoice
                  </button>
                </form>
              </CollapsibleCard>

              {latestInvoice && (
                <CollapsibleCard title="Record Payment">
                  <p className="muted">Invoice #{latestInvoice.id}: {latestInvoice.status}, balance {money(latestInvoice.balance_due)}</p>
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() => printEstimate(`invoice-print-${latestInvoice.id}`)}
                  >
                    Print Invoice
                  </button>
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() => textInvoiceAction(latestInvoice)}
                  >
                    Text Invoice
                  </button>
                  <form
                    onSubmit={(e) => {
                    e.preventDefault()
                    run(async () => {
                        const res = await shopFetch(`/invoices/${latestInvoice.id}/payments`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ amount: Number(paymentAmount), method: paymentMethod, note: 'Recorded in admin portal' }),
                        })
                        if (!res.ok) throw new Error(await res.text())
                        setPaymentAmount('')
                      }, 'Payment recorded.')
                    }}
                  >
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
                  <PrintableInvoice
                    data={data}
                    id={`invoice-print-${latestInvoice.id}`}
                    invoice={latestInvoice}
                  />
                </CollapsibleCard>
              )}
            </div>
          )}

          <div className="grid" style={{ marginTop: 18 }}>
            <CollapsibleCard title="Supplements">
              {data.jobs.flatMap((job: any) => job.supplements).map((item: any) => (
                <p className="muted" key={item.id}>
                  #{item.id} {item.status} - {item.reason} - {money(item.amount)}
                </p>
              ))}
            </CollapsibleCard>

            <CollapsibleCard title="Messages">
              {data.messages.map((item: any) => (
                <p className="muted" key={item.id}>
                  <b>{item.sender_type}:</b> {item.body}
                </p>
              ))}
            </CollapsibleCard>

            <CollapsibleCard title="Timeline">
              {data.timeline.map((item: any, index: number) => (
                <p className="muted" key={`${item.event}-${index}`}>
                  <b>{item.event}</b> - {item.actor}
                  <br />
                  {new Date(item.created_at).toLocaleString()} {item.detail || ''}
                </p>
              ))}
            </CollapsibleCard>
          </div>
        </>
      )}
    </main>
  )
}
