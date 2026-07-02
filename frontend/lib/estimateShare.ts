type EstimateShareInput = {
  quoteId: number | string
  estimateType?: string
  total?: number
}

function money(value?: number) {
  return `$${Number(value || 0).toFixed(2)}`
}

function estimateLabel(estimateType?: string) {
  return estimateType === 'final' ? 'Final Estimate' : 'Preliminary Photo Estimate'
}

export function estimatePortalUrl(quoteId: number | string) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  return `${origin}/portal?quote=${encodeURIComponent(String(quoteId))}`
}

export function estimateShareText({ quoteId, estimateType, total }: EstimateShareInput) {
  return [
    `Hanks Paints ${estimateLabel(estimateType)} for Quote #${quoteId}.`,
    `Estimate total: ${money(total)}.`,
    'Open the customer portal and use your phone or email to view private details.',
  ].join(' ')
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  window.prompt('Copy this estimate link:', text)
}

export async function shareEstimate(input: EstimateShareInput) {
  const url = estimatePortalUrl(input.quoteId)
  const text = estimateShareText(input)
  const title = `Hanks Paints ${estimateLabel(input.estimateType)}`

  if (navigator.share) {
    await navigator.share({ title, text, url })
    return 'Estimate share options opened.'
  }

  await copyText(`${text}\n${url}`)
  return 'Estimate link copied.'
}

export async function copyEstimateLink(quoteId: number | string) {
  await copyText(estimatePortalUrl(quoteId))
  return 'Estimate link copied.'
}

export function printEstimate() {
  window.print()
}
