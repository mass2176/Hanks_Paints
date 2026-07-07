import { products } from '../../lib/products'

export default function Page() {
  return (
    <main className="section">
      <h1>Hanks Paints Products</h1>
      <p className="muted">
        Shop Hanks Paints detailing products for quick cleanup, glass, and interior care.
      </p>

      <div className="grid" style={{ marginTop: 28 }}>
        {products.map((product) => (
          <div className="card product-card" key={product.slug}>
            <div className="product-art" aria-label={`${product.name} product image placeholder`}>
              <span>{product.name}</span>
            </div>
            <h3>{product.name}</h3>
            <p>{product.summary}</p>
            <p className="muted">{product.details}</p>
            {product.checkoutUrl ? (
              <a className="btn" href={product.checkoutUrl}>
                Buy Now
              </a>
            ) : (
              <>
                <a className="btn secondary" href="/contact">
                  Contact to Buy
                </a>
                <p className="muted">Online checkout will be available after Stripe links are added.</p>
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
