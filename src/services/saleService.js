
import { apiRequest } from './api'

export const getSales = (params = {}) => {
  const query = new URLSearchParams(params).toString()

  return apiRequest(`/api/sales${query ? `?${query}` : ''}`)
}

export const getSaleById = (id) =>
  apiRequest(`/api/sales/${id}`)

export const getSaleByInvoice = (invoiceNumber) =>
  apiRequest(
    `/api/sales/invoice/${encodeURIComponent(invoiceNumber)}`
  )

export const createSale = (saleData) =>
  apiRequest('/api/sales', {
    method: 'POST',
    body: JSON.stringify(saleData),
  })

export default {
  getSales,
  getSaleById,
  getSaleByInvoice,
  createSale,
}
