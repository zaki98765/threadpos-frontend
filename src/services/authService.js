
import { apiRequest } from './api'

export const loginUser = (credentials) =>
  apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

export const registerUser = (userData) =>
  apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  })

export const logoutUser = () =>
  apiRequest('/api/auth/logout', {
    method: 'POST',
  })
