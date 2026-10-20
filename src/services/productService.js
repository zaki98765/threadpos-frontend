
import { apiRequest } from './api'

export const getProducts = async (params = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })

  const queryString = query.toString()

  return apiRequest(
    `/api/products${queryString ? `?${queryString}` : ''}`
  )
}

export const createProduct = async (productData) => {
  return apiRequest('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  })
}

export const updateProduct = async (id, productData) => {
  return apiRequest(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  })
}

export const deleteProduct = async (id) => {
  return apiRequest(`/api/products/${id}`, {
    method: 'DELETE',
  })
}
