'use client'

import { useState } from 'react'

import { apiBaseUrl } from '../../lib/config'

export default function Estimate() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [uploadSummary, setUploadSummary] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
      setError('')
      setUploadSummary('')
      setLoading(true)

    try {
      const f = new FormData(e.currentTarget)

      const payload = {
        customer: {
          full_name: String(f.get('full_name') || ''),
          street_address: String(f.get('street_address') || ''),
          city: String(f.get('city') || ''),
          state: String(f.get('state') || ''),
          zip_code: String(f.get('zip_code') || ''),
          phone: String(f.get('phone') || ''),
          email: String(f.get('email') || ''),
          preferred_contact: String(f.get('preferred_contact') || 'text'),
        },
        vehicle: {
          vin: f.get('vin') ? String(f.get('vin')) : null,
          year: String(f.get('year') || ''),
          make: String(f.get('make') || ''),
          model: String(f.get('model') || ''),
          trim: f.get('trim') ? String(f.get('trim')) : null,
          color: f.get('color') ? String(f.get('color')) : null,
          plate: f.get('plate') ? String(f.get('plate')) : null,
        },
        service_type: String(f.get('service_type') || ''),
        payment_type: String(f.get('payment_type') || ''),
        insurance_company: f.get('insurance_company') ? String(f.get('insurance_company')) : null,
        claim_number: f.get('claim_number') ? String(f.get('claim_number')) : null,
        damage_description: String(f.get('damage_description') || ''),
      }

      const res = await fetch(`${apiBaseUrl}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      let data: any = {}

      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = { raw: text }
      }

      if (!res.ok) {
        throw new Error(JSON.stringify(data))
      }

      const files = f.getAll('media').filter((file): file is File => file instanceof File && file.size > 0)
      let uploaded = 0

      for (const file of files) {
        const uploadBody = new FormData()
        uploadBody.append('file', file)

        const uploadRes = await fetch(
          `${apiBaseUrl}/quotes/${data.id}/media?visibility=customer_visible&uploaded_by=customer`,
          {
            method: 'POST',
            body: uploadBody,
          }
        )

        if (!uploadRes.ok) {
          const uploadText = await uploadRes.text()
          throw new Error(`Quote created, but media upload failed for ${file.name}: ${uploadText}`)
        }

        uploaded += 1
      }

      setUploadSummary(uploaded ? `${uploaded} file${uploaded === 1 ? '' : 's'} uploaded.` : '')
      setResult(data)
    } catch (err: any) {
      setError(`Quote submit failed. API URL: ${apiBaseUrl}. Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="section">
      <h1>Start a Free Estimate</h1>
      <p className="muted">
        Photo submissions help us understand the request. Final pricing requires an in-person
        inspection before work is scheduled or started.
      </p>

      {error && (
        <div className="card" style={{ borderColor: '#ff4d4d' }}>
          <h2>Submission Error</h2>
          <p>{error}</p>
        </div>
      )}

      {result ? (
        <div className="card">
          <h2>Request Created</h2>
          <p>Quote #{result.id} was created as pending verification.</p>
          {uploadSummary && <p className="muted">{uploadSummary}</p>}
          <p className="muted">
            Save this quote number for status checks and portal access: <b>{result.id}</b>
          </p>
          <button
            type="button"
            className="btn"
            onClick={async () => {
              await fetch(`${apiBaseUrl}/quotes/${result.id}/verify?method=phone`, { method: 'POST' })
              alert('Verified for MVP demo')
            }}
          >
            Demo Verify by Text
          </button>
        </div>
      ) : (
        <form className="form" onSubmit={submit}>
          <h2>Customer Information</h2>

          <div className="field">
            <label>Full Name *</label>
            <input name="full_name" required />
          </div>

          <div className="field">
            <label>Street Address *</label>
            <input name="street_address" required />
          </div>

          <div className="row">
            <div className="field">
              <label>City *</label>
              <input name="city" required />
            </div>
            <div className="field">
              <label>State *</label>
              <input name="state" required defaultValue="IN" />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>ZIP *</label>
              <input name="zip_code" required />
            </div>
            <div className="field">
              <label>Preferred Contact</label>
              <select name="preferred_contact">
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Phone *</label>
              <input name="phone" required />
            </div>
            <div className="field">
              <label>Email *</label>
              <input name="email" type="email" required />
            </div>
          </div>

          <h2>Vehicle</h2>

          <div className="field">
            <label>VIN optional</label>
            <input name="vin" maxLength={17} />
          </div>

          <div className="row">
            <div className="field">
              <label>Year *</label>
              <input name="year" required />
            </div>
            <div className="field">
              <label>Make *</label>
              <input name="make" required />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Model *</label>
              <input name="model" required />
            </div>
            <div className="field">
              <label>Color</label>
              <input name="color" />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Trim / Body Style</label>
              <input name="trim" />
            </div>
            <div className="field">
              <label>License Plate</label>
              <input name="plate" />
            </div>
          </div>

          <h2>Repair Request</h2>

          <div className="field">
            <label>Main Service *</label>
            <select name="service_type" required>
              <option>Rust Repair</option>
              <option>Panel Replacement</option>
              <option>Collision / Body Repair</option>
              <option>Paint Repair</option>
              <option>Custom Paint</option>
              <option>Full Color Change</option>
              <option>Coatings</option>
              <option>Spray PPF</option>
              <option>Other / Not Sure</option>
            </select>
          </div>

          <div className="field">
            <label>Payment Type *</label>
            <select name="payment_type" required>
              <option>Customer Pay</option>
              <option>Insurance Claim</option>
              <option>Not Sure Yet</option>
            </select>
          </div>

          <div className="row">
            <div className="field">
              <label>Insurance Company</label>
              <input name="insurance_company" />
            </div>
            <div className="field">
              <label>Claim Number</label>
              <input name="claim_number" />
            </div>
          </div>

          <div className="field">
            <label>Describe the work needed *</label>
            <textarea name="damage_description" rows={5} required />
          </div>

          <p className="muted">
            Upload damage photos, walkaround videos, insurance documents, or other files that help
            the shop review the request. A final estimate still requires a physical inspection.
          </p>

          <div className="field">
            <label>Vehicle Photos / Videos *</label>
            <input name="media" type="file" accept="image/*,video/*,.pdf" multiple required />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Quote Request'}
          </button>
        </form>
      )}
    </main>
  )
}
