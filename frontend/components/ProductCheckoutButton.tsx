'use client'

import { useState } from 'react'
import { apiBaseUrl } from '../lib/config'

export default function ProductCheckoutButton({ productSlug }: { productSlug: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function startCheckout() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${apiBaseUrl}/products/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_slug: productSlug, quantity: 1 }),
      })
      const body = await res.json()

      if (!res.ok) {
        throw new Error(body.detail || 'Checkout could not be started.')
      }
      if (!body.checkout_url) {
        throw new Error('Stripe did not return a checkout link.')
      }

      window.location.href = body.checkout_url
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn" type="button" disabled={loading} onClick={startCheckout}>
        {loading ? 'Opening Checkout...' : 'Buy Now'}
      </button>
      {error && <p className="muted">Checkout error: {error}</p>}
    </>
  )
}
