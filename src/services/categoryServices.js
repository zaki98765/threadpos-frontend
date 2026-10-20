
import { apiRequest } from './api'

export const getCategories = async () => {
  return apiRequest('/api/categories')
}

export const createCategory = async (categoryData) => {
  return apiRequest('/api/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  })
}

export const updateCategory = async (id, categoryData) => {
  return apiRequest(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData),
  })
}

export const deleteCategory = async (id) => {
  return apiRequest(`/api/categories/${id}`, {
    method: 'DELETE',
  })
}
