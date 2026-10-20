
import { apiRequest } from './api'

export const recordSupplierPayment = (paymentData) =>
  apiRequest('/api/supplier-payments', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  })

export const getSupplierPayments = (
  supplierId,
  page = 1,
  limit = 10
) =>
  apiRequest(
    `/api/supplier-payments/supplier/${supplierId}/payments?page=${page}&limit=${limit}`
  )

export const getSupplierLedger = (supplierId) =>
  apiRequest(
    `/api/supplier-payments/supplier/${supplierId}/ledger`
  )

export const getPurchasePayments = (purchaseId) =>
  apiRequest(
    `/api/supplier-payments/purchase/${purchaseId}/payments`
  )

export default {
  recordSupplierPayment,
  getSupplierPayments,
  getSupplierLedger,
  getPurchasePayments,
}
