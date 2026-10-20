
import { apiRequest } from './api'

export const getPurchases = async (params = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })

  const queryString = query.toString()

  return apiRequest(
    `/api/purchases${queryString ? `?${queryString}` : ''}`
  )
}

export const getPurchaseById = async (id) =>
  apiRequest(`/api/purchases/${id}`)

export const createPurchase = async (purchaseData) =>
  apiRequest('/api/purchases', {
    method: 'POST',
    body: JSON.stringify(purchaseData),
  })

export const receivePurchase = async (id) =>
  apiRequest(`/api/purchases/${id}/receive`, {
    method: 'PATCH',
  })

export const cancelPurchase = async (id) =>
  apiRequest(`/api/purchases/${id}/cancel`, {
    method: 'PATCH',
  })
