'use client'

import { useEffect, useRef, useState } from 'react'

import MediaPicker, { validateMediaFiles } from '../../components/MediaPicker'
import { apiBaseUrl } from '../../lib/config'

const serviceOptions = [
  'Rust Repair',
  'Panel Replacement',
  'Collision / Body Repair',
  'Paint Repair',
  'Custom Paint',
  'Full Color Change',
  'Coatings',
  'Spray PPF',
  'Other / Not Sure',
]

function formatUsPhone(value: string) {
  const digitsOnly = value.replace(/\D/g, '')
  const localDigits =
    digitsOnly.length === 11 && digitsOnly.startsWith('1') ? digitsOnly.slice(1) : digitsOnly
  const digits = localDigits.slice(0, 10)

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export default function Estimate() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [mediaValidationError, setMediaValidationError] = useState<string>('')
  const [uploadSummary, setUploadSummary] = useState<string>('')
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [phone, setPhone] = useState('')
  const [selectedService, setSelectedService] = useState(serviceOptions[0])
  const [loading, setLoading] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const mediaFieldRef = useRef<HTMLDivElement>(null)
  const validationHighlightTimer = useRef<number | null>(null)

  useEffect(() => {
    const requestedService = new URLSearchParams(window.location.search).get('service')

    if (requestedService && serviceOptions.includes(requestedService)) {
      setSelectedService(requestedService)
    }
  }, [])

  function highlightValidationTarget(target?: HTMLElement | null) {
    const targetElement = target || errorRef.current
    const highlightElement =
      targetElement instanceof HTMLInputElement ||
      targetElement instanceof HTMLSelectElement ||
      targetElement instanceof HTMLTextAreaElement
        ? targetElement.closest('.field')
        : targetElement

    if (!(highlightElement instanceof HTMLElement)) return

    highlightElement.classList.add('validation-highlight')

    if (validationHighlightTimer.current) {
      window.clearTimeout(validationHighlightTimer.current)
    }

    validationHighlightTimer.current = window.setTimeout(() => {
      highlightElement.classList.remove('validation-highlight')
      validationHighlightTimer.current = null
    }, 3200)
  }

  function scrollValidationTarget(
    target?: HTMLElement | null,
    block: ScrollLogicalPosition = 'start',
    shouldFocus = false
  ) {
    window.setTimeout(() => {
      const targetElement = target || errorRef.current

      targetElement?.scrollIntoView({ behavior: 'smooth', block })
      highlightValidationTarget(targetElement)

      if (shouldFocus) {
        targetElement?.focus({ preventScroll: true })
      }
    }, 0)
  }

  function showSubmissionError(
    message: string,
    target?: HTMLElement | null,
    block: ScrollLogicalPosition = 'start',
    shouldFocus = false
  ) {
    setError(message)
    scrollValidationTarget(target, block, shouldFocus)
  }

  function showRequiredFieldError(target: HTMLElement) {
    setMediaValidationError('')
    setError('Please complete the required field highlighted below before submitting your estimate request.')
    scrollValidationTarget(target, 'center')
  }

  function handleMediaFilesChange(nextFiles: File[]) {
    setMediaFiles(nextFiles)

    if (nextFiles.length && mediaValidationError) {
      setMediaValidationError('')
      setError('')
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setMediaValidationError('')
    setUploadSummary('')

    const form = e.currentTarget
    const firstInvalidField = form.querySelector(':invalid')

    if (firstInvalidField instanceof HTMLElement) {
      showRequiredFieldError(firstInvalidField)
      return
    }

    setLoading(true)

    try {
      const f = new FormData(form)
      const files = mediaFiles.filter((file) => file.size > 0)

      if (!files.length) {
        const message = 'Please add at least one vehicle photo before submitting your estimate request.'
        setMediaValidationError(message)
        showSubmissionError(message, mediaFieldRef.current, 'center')
        return
      }

      const mediaError = validateMediaFiles(files)
      if (mediaError) {
        setMediaValidationError(mediaError)
        showSubmissionError(mediaError, mediaFieldRef.current, 'center')
        return
      }

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
        sms_consent: f.get('sms_consent') === 'on',
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
      showSubmissionError(`Quote submit failed. API URL: ${apiBaseUrl}. Error: ${err.message}`)
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
        <div
          ref={errorRef}
          className="card form-alert"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          style={{ borderColor: '#ff4d4d' }}
        >
          <h2>Submission Error</h2>
          <p>{error}</p>
        </div>
      )}

      {result ? (
        <div className="card">
          <h2>Request Received</h2>
          <p>
            Quote #{result.id} has been received by Hanks Paints.
          </p>
          {uploadSummary && <p className="muted">{uploadSummary}</p>}
          <p className="muted">
            Save this quote number for status checks and portal access: <b>{result.id}</b>
          </p>
          <p className="muted">
            Use your quote number with the phone or email from this request to check status, upload
            more files, request inspection time, and message the shop.
          </p>
          <div className="btns">
            <a className="btn" href={`/portal?quote=${result.id}`}>
              Open Customer Portal
            </a>
            <a className="btn secondary" href="/status">
              Check Status Later
            </a>
          </div>
        </div>
      ) : (
        <form className="form" onSubmit={submit} noValidate>
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
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(123) 456-7890"
                value={phone}
                onChange={(e) => setPhone(formatUsPhone(e.target.value))}
                pattern={String.raw`\(\d{3}\) \d{3}-\d{4}`}
                title="Enter a 10-digit US phone number."
                required
              />
            </div>
            <div className="field">
              <label>Email *</label>
              <input name="email" type="email" required />
            </div>
          </div>

          <div className="card">
            <label>
              <input name="sms_consent" type="checkbox" /> I agree to receive service-related text
              messages from Hanks Paints about my estimate request, quote review, inspection
              scheduling, customer messages, approvals, repair status updates, invoices, pickup
              reminders, and payment reminders.
            </label>
            <p className="muted">
              Message frequency varies. Message and data rates may apply. Reply STOP to opt out.
              Reply HELP for help. Consent is not required to purchase goods or services. View our{' '}
              <a href="/privacy" target="_blank">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="/terms" target="_blank">
                Terms
              </a>
              .
            </p>
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
            <select
              name="service_type"
              required
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              {serviceOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
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
            Upload damage photos and one short walkaround video that help
            the shop review the request. A final estimate still requires a physical inspection.
          </p>

          <div ref={mediaFieldRef} className="field validation-target" tabIndex={-1}>
            <label>Vehicle Photos / Videos *</label>
            <MediaPicker
              files={mediaFiles}
              invalid={Boolean(mediaValidationError)}
              onChange={handleMediaFilesChange}
              required
            />
            {mediaValidationError && (
              <p className="upload-error" role="alert">
                {mediaValidationError}
              </p>
            )}
            <p className="muted">
              Choose existing photos and videos from your phone, tablet, or computer.
            </p>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Quote Request'}
          </button>
        </form>
      )}
    </main>
  )
}
