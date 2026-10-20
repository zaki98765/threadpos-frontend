
import { apiRequest } from './api'

export const getReturns = (params = {}) => {
  const query = new URLSearchParams(params).toString()

  return apiRequest(`/api/returns${query ? `?${query}` : ''}`)
}

export const getReturnById = (id) =>
  apiRequest(`/api/returns/${id}`)

export const createReturn = (returnData) =>
  apiRequest('/api/returns', {
    method: 'POST',
    body: JSON.stringify(returnData),
  })

export default {
  getReturns,
  getReturnById,
  createReturn,
}
