export type StoreProduct = {
  slug: string
  name: string
  imageUrl: string
  price: string
  size: string
  fulfillment: string
  summary: string
  details: string
}

export const products: StoreProduct[] = [
  {
    slug: 'detail-spray',
    name: "Hank's Detail Spray",
    imageUrl: '/images/products/detail-spray.png',
    price: '$12',
    size: '16 oz',
    fulfillment: 'Shipping only',
    summary: 'Quick gloss and wipe-down spray for a clean finish between washes.',
    details: 'Made for light cleanup, gloss, and final touch work on painted exterior surfaces.',
  },
  {
    slug: 'interior-spray',
    name: "Hank's Interior Spray",
    imageUrl: '/images/products/interior-cleaner.png',
    price: '$12',
    size: '16 oz',
    fulfillment: 'Shipping only',
    summary: 'Interior cleaner for everyday dust, smudges, and shop-life grime.',
    details: 'Use on common interior hard surfaces like dash, console, door panels, and trim.',
  },
  {
    slug: 'glass-cleaner',
    name: "Hank's Glass Cleaner",
    imageUrl: '/images/products/glass-cleaner.png',
    price: '$12',
    size: '16 oz',
    fulfillment: 'Shipping only',
    summary: 'Glass cleaner for windshields, mirrors, and clear final presentation.',
    details: 'Built for a clean, finished look on automotive glass before delivery or daily driving.',
  },
]
