import { products } from '../../lib/products'
import ProductCheckoutButton from '../../components/ProductCheckoutButton'

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
            <img className="product-photo" src={product.imageUrl} alt={product.name} />
            <h3>{product.name}</h3>
            <p>
              <b>{product.price}</b> - {product.size} - {product.fulfillment}
            </p>
            <p>{product.summary}</p>
            <p className="muted">{product.details}</p>
            <ProductCheckoutButton productSlug={product.slug} />
          </div>
        ))}
      </div>
    </main>
  )
}
