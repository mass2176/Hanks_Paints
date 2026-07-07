export type StoreProduct = {
  slug: string
  name: string
  summary: string
  details: string
  checkoutUrl?: string
}

export const products: StoreProduct[] = [
  {
    slug: 'detail-spray',
    name: "Hank's Detail Spray",
    summary: 'Quick gloss and wipe-down spray for a clean finish between washes.',
    details: 'Made for light cleanup, gloss, and final touch work on painted exterior surfaces.',
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_DETAIL_SPRAY_LINK,
  },
  {
    slug: 'interior-spray',
    name: "Hank's Interior Spray",
    summary: 'Interior cleaner for everyday dust, smudges, and shop-life grime.',
    details: 'Use on common interior hard surfaces like dash, console, door panels, and trim.',
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_INTERIOR_SPRAY_LINK,
  },
  {
    slug: 'glass-cleaner',
    name: "Hank's Glass Cleaner",
    summary: 'Glass cleaner for windshields, mirrors, and clear final presentation.',
    details: 'Built for a clean, finished look on automotive glass before delivery or daily driving.',
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_GLASS_CLEANER_LINK,
  },
]
