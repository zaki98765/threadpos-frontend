
import { apiRequest } from './api'

export const getSuppliers = async (params = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })

  const queryString = query.toString()

  return apiRequest(
    `/api/suppliers${queryString ? `?${queryString}` : ''}`
  )
}

export const getSupplierById = async (id) =>
  apiRequest(`/api/suppliers/${id}`)

export const createSupplier = async (supplierData) =>
  apiRequest('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplierData),
  })

export const updateSupplier = async (id, supplierData) =>
  apiRequest(`/api/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplierData),
  })

export const deleteSupplier = async (id) =>
  apiRequest(`/api/suppliers/${id}`, {
    method: 'DELETE',
  })
