
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  ShoppingCart,
  Package,
  Truck,
  X,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Ban,
  AlertCircle,
  Eye,
  RotateCcw,
} from 'lucide-react'

import { getProducts } from '../../services/productService'
import { getSuppliers } from '../../services/supplierService'
import {
  getPurchases,
  createPurchase,
  receivePurchase,
  cancelPurchase,
  getPurchaseById,
} from '../../services/purchaseServices'

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const dateFormat = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const emptyItem = () => ({
  product: '',
  quantity: '1',
  unitCost: '',
})

const emptyForm = () => ({
  supplier: '',
  items: [emptyItem()],
  discount: '0',
  paymentStatus: 'credit',
  notes: '',
})

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    received: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    credit: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  }

  const labels = {
    pending: 'Pending receipt',
    received: 'Received',
    cancelled: 'Cancelled',
    paid: 'Paid',
    credit: 'Credit',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
        styles[status] || 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      {labels[status] || status || 'Unknown'}
    </span>
  )
}

function PurchaseModal({ onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm)
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadOptions = async () => {
      setLoadingOptions(true)
      setError('')

      try {
        const [productData, supplierData] = await Promise.all([
          getProducts({ limit: 100 }),
          getSuppliers({ limit: 100 }),
        ])

        if (!active) return

        setProducts(productData.products || [])
        setSuppliers(supplierData.suppliers || [])
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load products and suppliers.')
        }
      } finally {
        if (active) setLoadingOptions(false)
      }
    }

    loadOptions()

    return () => {
      active = false
    }
  }, [])

  const subtotal = useMemo(
    () =>
      form.items.reduce((total, item) => {
        const quantity = Number(item.quantity) || 0
        const price = Number(item.unitCost) || 0
        return total + quantity * price
      }, 0),
    [form.items]
  )

  const discount = Number(form.discount) || 0
  const total = Math.max(0, subtotal - discount)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      ),
    }))
  }

  const selectProduct = (index, productId) => {
    const product = products.find((item) => item._id === productId)

    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              product: productId,
              unitCost:
                product && product.costPrice != null
                  ? String(product.costPrice)
                  : '',
            }
          : item
      ),
    }))
  }

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, emptyItem()],
    }))
  }

  const removeItem = (index) => {
    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? [emptyItem()]
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.supplier) {
      setError('Please select a supplier.')
      return
    }

    if (!form.items.length || form.items.some((item) => !item.product)) {
      setError('Select a product for every purchase item.')
      return
    }

    if (
      form.items.some(
        (item) =>
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) < 1
      )
    ) {
      setError('Every quantity must be a positive whole number.')
      return
    }

    if (
      form.items.some(
        (item) =>
          item.unitCost === '' ||
          !Number.isFinite(Number(item.unitCost)) ||
          Number(item.unitCost) < 0
      )
    ) {
      setError('Enter a valid purchase price for every product.')
      return
    }

    if (
      !Number.isFinite(Number(form.discount)) ||
      discount < 0 ||
      discount > subtotal
    ) {
      setError('Discount must be between zero and the subtotal.')
      return
    }

    setSaving(true)

    try {
      await createPurchase({
        supplier: form.supplier,
        items: form.items.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
        discount,
        paymentStatus: form.paymentStatus,
        notes: form.notes.trim(),
      })

      await onCreated()
    } catch (err) {
      setError(err.message || 'Unable to create purchase.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-modal-title"
        className="flex max-h-[95dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
          <div>
            <h2
              id="purchase-modal-title"
              className="text-xl font-bold text-slate-900"
            >
              Create purchase
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Record supplier stock and payment terms.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close purchase form"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto">
          <div className="space-y-6 p-5 sm:p-7">
            {loadingOptions ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                <RefreshCw size={18} className="animate-spin" />
                Loading products and suppliers...
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.supplier}
                    onChange={(event) =>
                      updateField('supplier', event.target.value)
                    }
                    required
                    className={inputClass}
                  >
                    <option value="">Choose a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                        {supplier.companyName
                          ? ` — ${supplier.companyName}`
                          : ''}
                      </option>
                    ))}
                  </select>

                  {suppliers.length === 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      No active suppliers found. Add a supplier before creating a purchase.
                    </p>
                  )}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="flex flex-col gap-3 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Purchase items
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Enter quantities and the supplier's unit price.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                    >
                      <Plus size={16} />
                      Add item
                    </button>
                  </div>

                  <div className="space-y-4 p-4">
                    {form.items.map((item, index) => {
                      const selectedProduct = products.find(
                        (product) => product._id === item.product
                      )

                      return (
                        <div
                          key={index}
                          className="rounded-xl border border-slate-200 p-3 sm:p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-700">
                              Item {index + 1}
                            </p>

                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              aria-label={`Remove item ${index + 1}`}
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="sm:col-span-2 lg:col-span-2">
                              <label className="text-xs font-medium text-slate-600">
                                Product
                              </label>
                              <select
                                value={item.product}
                                onChange={(event) =>
                                  selectProduct(index, event.target.value)
                                }
                                className={inputClass}
                                required
                              >
                                <option value="">Select product</option>
                                {products.map((product) => (
                                  <option
                                    key={product._id}
                                    value={product._id}
                                  >
                                    {product.name}
                                    {product.sku ? ` (${product.sku})` : ''}
                                  </option>
                                ))}
                              </select>

                              {selectedProduct && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Current stock: {selectedProduct.stock ?? 0}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="text-xs font-medium text-slate-600">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                required
                                value={item.quantity}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    'quantity',
                                    event.target.value
                                  )
                                }
                                className={inputClass}
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-slate-600">
                                Unit cost (₹)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={item.unitCost}
                                onChange={(event) =>
                                  updateItem(
                                    index,
                                    'unitCost',
                                    event.target.value
                                  )
                                }
                                placeholder="0.00"
                                className={inputClass}
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                            <p className="text-sm text-slate-500">
                              Line total:{' '}
                              <span className="font-bold text-slate-900">
                                {money(
                                  (Number(item.quantity) || 0) *
                                    (Number(item.unitCost) || 0)
                                )}
                              </span>
                            </p>
                          </div>
                        </div>
                      )
                    })}

                    {products.length === 0 && (
                      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                        No active products found. Add products before creating a purchase.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">
                        Payment type
                      </label>

                      <div className="mt-2 grid grid-cols-2 gap-3">
                        {[
                          {
                            value: 'paid',
                            title: 'Fully paid',
                            description: 'Paid in full',
                          },
                          {
                            value: 'credit',
                            title: 'Credit',
                            description: 'Payment outstanding',
                          },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              updateField('paymentStatus', option.value)
                            }
                            className={`rounded-xl border p-3 text-left transition ${
                              form.paymentStatus === option.value
                                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <p className="text-sm font-semibold text-slate-900">
                              {option.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {option.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">
                        Notes
                      </label>
                      <textarea
                        value={form.notes}
                        onChange={(event) =>
                          updateField('notes', event.target.value)
                        }
                        rows={3}
                        maxLength={1000}
                        placeholder="Invoice number or purchase notes..."
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <h3 className="font-semibold text-slate-900">
                      Purchase summary
                    </h3>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-3 text-slate-600">
                        <span>Subtotal</span>
                        <span>{money(subtotal)}</span>
                      </div>

                      <div>
                        <label className="text-slate-600">
                          Discount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={subtotal}
                          step="0.01"
                          value={form.discount}
                          onChange={(event) =>
                            updateField('discount', event.target.value)
                          }
                          className={inputClass}
                        />
                      </div>

                      <div className="flex justify-between gap-3 border-t border-slate-200 pt-3 font-bold text-slate-900">
                        <span>Total amount</span>
                        <span className="text-lg text-emerald-700">
                          {money(total)}
                        </span>
                      </div>

                      <div className="rounded-xl bg-white p-3 text-xs leading-5 text-slate-500">
                        Stock is not updated when this purchase is created.
                        Use Receive Stock after the goods arrive.
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white p-5 sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                loadingOptions ||
                suppliers.length === 0 ||
                products.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <RefreshCw size={16} className="animate-spin" />}
              {saving ? 'Creating...' : 'Create purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PurchaseDetailsModal({ purchase, onClose }) {
  if (!purchase) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-details-title"
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Purchase details
            </p>
            <h2
              id="purchase-details-title"
              className="mt-1 break-all text-xl font-bold text-slate-900"
            >
              {purchase.purchaseNumber}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Created {dateFormat(purchase.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close purchase details"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge status={purchase.purchaseStatus} />
          <StatusBadge status={purchase.paymentStatus} />
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Supplier</p>
          <p className="mt-1 font-semibold text-slate-900">
            {purchase.supplier?.name || purchase.supplierName || 'Supplier'}
          </p>
          {purchase.supplier?.phone && (
            <p className="mt-1 text-sm text-slate-500">
              {purchase.supplier.phone}
            </p>
          )}
        </div>

        <div className="mt-5">
          <h3 className="font-semibold text-slate-900">Items</h3>
          <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {(purchase.items || []).map((item, index) => (
              <div
                key={`${item.product || item.productName}-${index}`}
                className="flex items-start justify-between gap-4 p-3"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-800">
                    {item.productName}
                  </p>
                  {item.sku && (
                    <p className="mt-1 text-xs text-slate-500">
                      SKU: {item.sku}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {item.quantity} × {money(item.unitCost)}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold text-slate-900">
                  {money(item.lineTotal)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 p-4 text-sm">
          <div className="flex justify-between gap-3 text-slate-600">
            <span>Subtotal</span>
            <span>{money(purchase.subtotal)}</span>
          </div>
          <div className="flex justify-between gap-3 text-slate-600">
            <span>Discount</span>
            <span>{money(purchase.discount)}</span>
          </div>
          <div className="flex justify-between gap-3 border-t border-slate-100 pt-3 font-bold text-slate-900">
            <span>Total</span>
            <span className="text-lg text-emerald-700">
              {money(purchase.totalAmount)}
            </span>
          </div>
        </div>

        {purchase.notes && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {purchase.notes}
            </p>
          </div>
        )}

        {purchase.receivedAt && (
          <p className="mt-4 text-xs text-slate-500">
            Received on {dateFormat(purchase.receivedAt)}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  })

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [actionId, setActionId] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [viewingPurchase, setViewingPurchase] = useState(null)

  const loadPurchases = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getPurchases({
        search,
        status,
        paymentStatus,
        page,
        limit: 10,
      })

      setPurchases(data.purchases || [])
      setPagination(
        data.pagination || {
          total: 0,
          page: 1,
          pages: 1,
          limit: 10,
        }
      )
    } catch (err) {
      setError(err.message || 'Failed to load purchases.')
    } finally {
      setLoading(false)
    }
  }, [search, status, paymentStatus, page])

  useEffect(() => {
    loadPurchases()
  }, [loadPurchases])

  const handleSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const refreshAfterCreate = async () => {
    setShowCreate(false)
    setNotice('Purchase created. Receive the goods when they arrive.')
    setPage(1)
    setSearch('')
    setSearchInput('')
    setStatus('')
    setPaymentStatus('')
  }

  const handleReceive = async (purchase) => {
    const confirmed = window.confirm(
      `Confirm that all items in ${purchase.purchaseNumber} have arrived? This will increase inventory stock.`
    )

    if (!confirmed) return

    setActionId(purchase._id)
    setError('')
    setNotice('')

    try {
      await receivePurchase(purchase._id)
      setNotice(`${purchase.purchaseNumber} received. Inventory has been updated.`)
      await loadPurchases()
    } catch (err) {
      setError(err.message || 'Unable to receive this purchase.')
    } finally {
      setActionId('')
    }
  }

  const handleCancel = async (purchase) => {
    const confirmed = window.confirm(
      `Cancel ${purchase.purchaseNumber}? Only pending purchases can be cancelled.`
    )

    if (!confirmed) return

    setActionId(purchase._id)
    setError('')
    setNotice('')

    try {
      await cancelPurchase(purchase._id)
      setNotice(`${purchase.purchaseNumber} cancelled successfully.`)
      await loadPurchases()
    } catch (err) {
      setError(err.message || 'Unable to cancel this purchase.')
    } finally {
      setActionId('')
    }
  }

  const handleView = async (purchase) => {
    setError('')

    try {
      const data = await getPurchaseById(purchase._id)
      setViewingPurchase(data.purchase)
    } catch (err) {
      setError(err.message || 'Unable to load purchase details.')
    }
  }

  const totalOnPage = purchases.reduce(
    (sum, purchase) => sum + (Number(purchase.totalAmount) || 0),
    0
  )

  const pendingCount = purchases.filter(
    (purchase) => purchase.purchaseStatus === 'pending'
  ).length

  const creditTotal = purchases.reduce(
    (sum, purchase) =>
      purchase.paymentStatus === 'credit' &&
      purchase.purchaseStatus !== 'cancelled'
        ? sum + (Number(purchase.totalAmount) || 0)
        : sum,
    0
  )

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
            <ShoppingCart size={17} />
            Inventory management
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Purchases
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Record supplier purchases, monitor payments, and receive stock.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus size={19} />
          New purchase
        </button>
      </div>

      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p className="flex-1">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Dismiss notification"
            className="rounded p-1 hover:bg-emerald-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="flex-1">{error}</p>
          <button
            type="button"
            onClick={loadPurchases}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total purchases
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {pagination.total}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Matching current filters
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <ShoppingCart size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Pending receipt
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {pendingCount}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Pending on this page
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Clock3 size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Credit purchase total
              </p>
              <h3 className="mt-2 break-words text-xl font-bold text-slate-900 sm:text-2xl">
                {money(creditTotal)}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Credit purchases on this page, excluding cancelled
              </p>
            </div>
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <IndianRupee size={21} />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">
                  Purchase history
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {pagination.total} record
                  {pagination.total === 1 ? '' : 's'} found
                </p>
              </div>

              <button
                type="button"
                onClick={loadPurchases}
                disabled={loading}
                aria-label="Refresh purchases"
                className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <RotateCcw
                  size={17}
                  className={loading ? 'animate-spin' : ''}
                />
              </button>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-2 lg:flex-row"
            >
              <div className="relative min-w-0 flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search purchase number, supplier, product..."
                  aria-label="Search purchases"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value)
                  setPage(1)
                }}
                aria-label="Filter purchase status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="">All receipt statuses</option>
                <option value="pending">Pending receipt</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={paymentStatus}
                onChange={(event) => {
                  setPaymentStatus(event.target.value)
                  setPage(1)
                }}
                aria-label="Filter payment status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="">All payment types</option>
                <option value="paid">Fully paid</option>
                <option value="credit">Credit</option>
              </select>

              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw size={25} className="animate-spin text-emerald-600" />
            <p className="text-sm">Loading purchase history...</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
              <Package size={30} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              No purchases found
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Create a purchase to start recording incoming stock.
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus size={17} />
              Create purchase
            </button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1000px] text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4 font-semibold">Purchase</th>
                    <th className="px-5 py-4 font-semibold">Supplier</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Total</th>
                    <th className="px-5 py-4 font-semibold">Payment</th>
                    <th className="px-5 py-4 font-semibold">Receipt</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {purchases.map((purchase) => (
                    <tr
                      key={purchase._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {purchase.purchaseNumber}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {(purchase.items || []).length} item line(s)
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {purchase.supplier?.name ||
                            purchase.supplierName ||
                            'Supplier'}
                        </p>
                        {purchase.supplier?.companyName && (
                          <p className="mt-1 text-xs text-slate-500">
                            {purchase.supplier.companyName}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        <span className="flex items-center gap-2">
                          <CalendarDays
                            size={15}
                            className="text-slate-400"
                          />
                          {dateFormat(purchase.createdAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {money(purchase.totalAmount)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={purchase.paymentStatus} />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={purchase.purchaseStatus} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleView(purchase)}
                            title="View purchase"
                            aria-label={`View ${purchase.purchaseNumber}`}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                          >
                            <Eye size={16} />
                          </button>

                          {purchase.purchaseStatus === 'pending' && (
                            <>
                              <button
                                type="button"
                                disabled={actionId === purchase._id}
                                onClick={() => handleReceive(purchase)}
                                title="Receive stock"
                                aria-label={`Receive ${purchase.purchaseNumber}`}
                                className="rounded-lg border border-emerald-100 p-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                              >
                                {actionId === purchase._id ? (
                                  <RefreshCw
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <CheckCircle2 size={16} />
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={actionId === purchase._id}
                                onClick={() => handleCancel(purchase)}
                                title="Cancel purchase"
                                aria-label={`Cancel ${purchase.purchaseNumber}`}
                                className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Ban size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {purchases.map((purchase) => (
                <div key={purchase._id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all font-semibold text-slate-900">
                        {purchase.purchaseNumber}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-600">
                        {purchase.supplier?.name ||
                          purchase.supplierName ||
                          'Supplier'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {dateFormat(purchase.createdAt)}
                      </p>
                    </div>

                    <p className="shrink-0 font-bold text-slate-900">
                      {money(purchase.totalAmount)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={purchase.paymentStatus} />
                    <StatusBadge status={purchase.purchaseStatus} />
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => handleView(purchase)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                      <Eye size={15} />
                      View
                    </button>

                    {purchase.purchaseStatus === 'pending' && (
                      <>
                        <button
                          type="button"
                          disabled={actionId === purchase._id}
                          onClick={() => handleReceive(purchase)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 size={15} />
                          Receive
                        </button>

                        <button
                          type="button"
                          disabled={actionId === purchase._id}
                          onClick={() => handleCancel(purchase)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
                        >
                          <Ban size={15} />
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-sm text-slate-500">
                  Showing{' '}
                  {(pagination.page - 1) * pagination.limit + 1}
                  {'–'}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{' '}
                  of {pagination.total}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Current page total: {money(totalOnPage)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="min-w-16 text-center text-sm font-medium text-slate-600">
                  {pagination.page} / {Math.max(1, pagination.pages)}
                </span>

                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <PurchaseModal
          onClose={() => setShowCreate(false)}
          onCreated={refreshAfterCreate}
        />
      )}

      {viewingPurchase && (
        <PurchaseDetailsModal
          purchase={viewingPurchase}
          onClose={() => setViewingPurchase(null)}
        />
      )}
    </div>
  )
}
