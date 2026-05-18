import type { QuotationData } from '@/components/quotation/quotation-types'

export async function downloadQuotationPDF(data: QuotationData, filename: string) {
  const { pdf } = await import('@react-pdf/renderer')
  const { QuotationPDF } = await import('@/components/quotation/quotation-pdf')
  const React = await import('react')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(QuotationPDF, { data }) as any
  const blob = await pdf(element).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
