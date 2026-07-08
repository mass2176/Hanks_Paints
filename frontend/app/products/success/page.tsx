export default function Page() {
  return (
    <main className="section">
      <h1>Order Received</h1>
      <p className="muted">
        Thanks for ordering from Hanks Paints. Stripe has received the checkout, and the shop will use
        the shipping details from the order.
      </p>
      <div className="btns">
        <a className="btn" href="/products">
          Back to Products
        </a>
        <a className="btn secondary" href="/contact">
          Contact Hanks Paints
        </a>
      </div>
    </main>
  )
}
