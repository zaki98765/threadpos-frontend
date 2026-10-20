
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  RefreshCw,
  ReceiptText,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  PackageSearch,
  UserRound,
} from 'lucide-react'

import { apiRequest } from '../../services/api'
import { createSale } from '../../services/saleService'

const money = (value = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const formatDate = (value = new Date()) =>
  new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

function extractProducts(response) {
  if (Array.isArray(response?.products)) return response.products
  if (Array.isArray(response?.data?.products)) return response.data.products
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response)) return response
  return []
}

const paymentOptions = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'bank_transfer', label: 'Bank transfer', icon: ReceiptText },
]

function Billing() {
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState('0')
  const [taxRate, setTaxRate] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountReceived, setAmountReceived] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lastSale, setLastSale] = useState(null)

  const [showInvoice, setShowInvoice] = useState(false)

  async function loadProducts() {
    setLoadingProducts(true)
    setError('')

    try {
      const response = await apiRequest('/api/products?limit=1000')
      setProducts(extractProducts(response))
    } catch (err) {
      setError(err.message || 'Unable to load products.')
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const categories = useMemo(() => {
    return [
      ...new Set(
        products
          .filter((product) => product.isActive !== false)
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ].sort((a, b) => String(a).localeCompare(String(b)))
  }, [products])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return products.filter((product) => {
      if (product.isActive === false) return false
      if (category !== 'all' && product.category !== category) return false

      const matchesSearch =
        !query ||
        [product.name, product.sku, product.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))

      return matchesSearch
    })
  }, [products, search, category])

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + Number(item.sellingPrice) * item.quantity,
        0
      ),
    [cart]
  )

  const safeDiscount = Math.min(
    subtotal,
    Math.max(0, Number(discount) || 0)
  )

  const taxableAmount = Math.max(0, subtotal - safeDiscount)

  const taxAmount =
    Math.round(
      taxableAmount * Math.max(0, Number(taxRate) || 0) * 100
    ) / 10000

  const total = Math.round((taxableAmount + taxAmount) * 100) / 100

  const received = Math.max(0, Number(amountReceived) || 0)
  const change = Math.max(0, received - total)

  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0)

  function addToCart(product) {
    setError('')
    setSuccess('')

    if (Number(product.stock) < 1) {
      setError(`${product.name} is out of stock.`)
      return
    }

    setCart((current) => {
      const existing = current.find((item) => item._id === product._id)

      if (existing) {
        if (existing.quantity >= Number(product.stock)) {
          setError(`Only ${product.stock} units of ${product.name} are available.`)
          return current
        }

        return current.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...current,
        {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          sellingPrice: Number(product.sellingPrice),
          costPrice: Number(product.costPrice || 0),
          stock: Number(product.stock),
          imageUrl: product.imageUrl || '',
          quantity: 1,
        },
      ]
    })

    setAmountReceived('')
  }

  function updateQuantity(productId, nextQuantity) {
    const item = cart.find((entry) => entry._id === productId)
    if (!item) return

    if (nextQuantity < 1) {
      removeFromCart(productId)
      return
    }

    if (nextQuantity > item.stock) {
      setError(`Only ${item.stock} units of ${item.name} are available.`)
      return
    }

    setError('')
    setCart((current) =>
      current.map((entry) =>
        entry._id === productId
          ? { ...entry, quantity: nextQuantity }
          : entry
      )
    )
    setAmountReceived('')
  }

  function removeFromCart(productId) {
    setCart((current) => current.filter((item) => item._id !== productId))
    setAmountReceived('')
  }

  function resetCheckout() {
    setCart([])
    setDiscount('0')
    setTaxRate('0')
    setPaymentMethod('cash')
    setAmountReceived('')
    setCustomerName('')
    setCustomerPhone('')
    setNotes('')
  }

  async function handleCheckout(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (cart.length === 0) {
      setError('Add at least one product to the cart.')
      return
    }

    if (Number(discount) < 0 || Number(discount) > subtotal) {
      setError('Discount must be between zero and the subtotal.')
      return
    }

    if (Number(taxRate) < 0 || Number(taxRate) > 100) {
      setError('Tax rate must be between 0 and 100.')
      return
    }

    if (received < total) {
      setError(`Amount received must be at least ${money(total)}.`)
      return
    }

    setSubmitting(true)

    try {
      const response = await createSale({
        items: cart.map((item) => ({
          product: item._id,
          quantity: item.quantity,
        })),
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        discount: safeDiscount,
        taxRate: Number(taxRate) || 0,
        paymentMethod,
        amountReceived: received,
        notes: notes.trim(),
      })

      const sale = response.sale || response.data?.sale

      if (!sale) {
        throw new Error(
          'The server did not return the invoice. Check the sales API response.'
        )
      }

      setLastSale(sale)
      setShowInvoice(true)
      setSuccess(`Sale completed: ${sale.invoiceNumber}`)
      resetCheckout()

      // Refresh stock from the server after the sale.
      await loadProducts()
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function printInvoice() {
    window.print()
  }

  return (
    <div className="min-h-screen space-y-5 bg-slate-50 p-4 sm:p-6 lg:p-8">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .threadpos-invoice,
          .threadpos-invoice * {
            visibility: visible !important;
          }
          .threadpos-invoice {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            max-width: none !important;
            padding: 24px !important;
            background: white !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="no-print flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <ReceiptText size={16} />
            Sales / Point of Sale
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Billing / POS
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a sale, collect payment, and print the invoice.
          </p>
        </div>

        <button
          type="button"
          onClick={loadProducts}
          disabled={loadingProducts}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={loadingProducts ? 'animate-spin' : ''}
          />
          Refresh products
        </button>
      </div>

      {error && (
        <div className="no-print flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="no-print flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={19} />
          <span className="flex-1">{success}</span>
          <button type="button" onClick={() => setSuccess('')} aria-label="Dismiss success">
            <X size={17} />
          </button>
        </div>
      )}

      <div className="no-print grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        {/* Product selection */}
        <section className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product name or scan/type SKU..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:max-w-52"
              >
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-slate-500">
                {filteredProducts.length} products found
              </p>
              <p className="font-medium text-slate-600">
                {totalUnits} item{totalUnits === 1 ? '' : 's'} in cart
              </p>
            </div>
          </div>

          {loadingProducts ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-20 text-slate-500">
              <LoaderCircle size={22} className="animate-spin" />
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <PackageSearch size={32} className="mx-auto text-slate-400" />
              <h3 className="mt-3 font-semibold text-slate-900">
                No products found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try another search or check your product inventory.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item._id === product._id)
                const outOfStock = Number(product.stock) < 1
                const reachedStock =
                  inCart && inCart.quantity >= Number(product.stock)

                return (
                  <button
                    type="button"
                    key={product._id}
                    disabled={outOfStock || reachedStock}
                    onClick={() => addToCart(product)}
                    className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:flex-col sm:items-stretch sm:p-4"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-20 w-20 shrink-0 rounded-xl bg-slate-100 object-cover sm:h-36 sm:w-full"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 sm:h-36 sm:w-full">
                        <PackageSearch size={30} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 sm:w-full">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {product.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        SKU: {product.sku || '—'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {product.category && (
                          <span className="max-w-full truncate rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            {product.category}
                          </span>
                        )}
                        <span
                          className={`text-xs font-medium ${
                            outOfStock
                              ? 'text-red-600'
                              : Number(product.stock) <=
                                  Number(product.lowStockThreshold || 5)
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                          }`}
                        >
                          Stock: {product.stock}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-base font-bold text-slate-900">
                          {money(product.sellingPrice)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-2 text-xs font-semibold text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white">
                          <Plus size={14} />
                          Add
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Cart and checkout */}
        <aside className="min-w-0 space-y-4 xl:sticky xl:top-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <ShoppingCart size={19} className="text-indigo-600" />
                  Current order
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {cart.length} product line{cart.length === 1 ? '' : 's'}
                </p>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCart([])
                    setAmountReceived('')
                  }}
                  className="text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Clear cart
                </button>
              )}
            </div>

            <div className="max-h-[360px] space-y-4 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="py-10 text-center">
                  <ShoppingCart size={30} className="mx-auto text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Your cart is empty
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Select a product to start a sale.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item._id} className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <PackageSearch size={19} className="text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {money(item.sellingPrice)} each
                      </p>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="rounded-md p-1 hover:bg-slate-100"
                            aria-label={`Decrease ${item.name} quantity`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-5 text-center text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={item.quantity >= item.stock}
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="rounded-md p-1 hover:bg-slate-100 disabled:opacity-40"
                            aria-label={`Increase ${item.name} quantity`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <span className="text-sm font-bold text-slate-900">
                          {money(item.sellingPrice * item.quantity)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item._id)}
                      className="self-start rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-800">{money(subtotal)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    step="0.01"
                    value={discount}
                    onChange={(event) => {
                      setDiscount(event.target.value)
                      setAmountReceived('')
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Tax rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxRate}
                    onChange={(event) => {
                      setTaxRate(event.target.value)
                      setAmountReceived('')
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Tax amount</span>
                <span className="font-medium text-slate-800">{money(taxAmount)}</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-900">Total payable</span>
                <span className="text-xl font-extrabold text-indigo-700">
                  {money(total)}
                </span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleCheckout}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <UserRound size={18} className="text-indigo-600" />
              Customer & payment
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Customer name
                </label>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  maxLength={150}
                  placeholder="Walk-in Customer"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  maxLength={30}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Payment method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {paymentOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      paymentMethod === value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Amount received (₹)
              </label>
              <input
                type="number"
                min={total}
                step="0.01"
                value={amountReceived}
                onChange={(event) => setAmountReceived(event.target.value)}
                placeholder={total.toFixed(2)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500"
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setAmountReceived(total.toFixed(2))}
                  className="font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Exact amount
                </button>
                <span className="text-slate-500">
                  Change: <strong className="text-slate-800">{money(change)}</strong>
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Notes
              </label>
              <textarea
                rows={2}
                maxLength={1000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes..."
                className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || loadingProducts || cart.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              {submitting ? 'Processing sale...' : `Complete Sale · ${money(total)}`}
            </button>

            <p className="text-center text-xs text-slate-500">
              Stock is updated by the backend after a successful checkout.
            </p>
          </form>
        </aside>
      </div>

      {/* Printable invoice */}
      {showInvoice && lastSale && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="no-print flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Sale completed
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Invoice {lastSale.invoiceNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoice(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close invoice"
              >
                <X size={20} />
              </button>
            </div>

            <div className="threadpos-invoice overflow-y-auto p-5 sm:p-8">
              <div className="border-b-2 border-slate-900 pb-5 text-center">
                <h1 className="text-2xl font-extrabold tracking-wide text-slate-900">
                  THREADPOS
                </h1>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  Sales invoice
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Invoice: {lastSale.invoiceNumber}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Date: {formatDate(lastSale.createdAt)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 py-5 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Customer</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {lastSale.customerName || 'Walk-in Customer'}
                  </p>
                  {lastSale.customerPhone && (
                    <p className="mt-1 text-slate-600">
                      {lastSale.customerPhone}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Payment method</p>
                  <p className="mt-1 font-semibold capitalize text-slate-900">
                    {String(lastSale.paymentMethod || '').replaceAll('_', ' ')}
                  </p>
                  <p className="mt-1 text-slate-600">Status: Paid</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="py-3 pr-2">Item</th>
                      <th className="px-2 py-3 text-right">Qty</th>
                      <th className="px-2 py-3 text-right">Price</th>
                      <th className="py-3 pl-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(lastSale.items || []).map((item, index) => (
                      <tr key={`${item.product}-${index}`}>
                        <td className="py-3 pr-2">
                          <p className="font-semibold text-slate-900">
                            {item.productName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.sku}
                          </p>
                        </td>
                        <td className="px-2 py-3 text-right">{item.quantity}</td>
                        <td className="whitespace-nowrap px-2 py-3 text-right">
                          {money(item.unitPrice)}
                        </td>
                        <td className="whitespace-nowrap py-3 pl-2 text-right font-semibold">
                          {money(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ml-auto mt-5 max-w-xs space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Subtotal</span>
                  <span>{money(lastSale.subtotal)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Discount</span>
                  <span>− {money(lastSale.discount)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Tax ({Number(lastSale.taxRate || 0)}%)
                  </span>
                  <span>{money(lastSale.taxAmount)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-300 pt-3 text-base font-extrabold">
                  <span>Total</span>
                  <span>{money(lastSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Received</span>
                  <span>{money(lastSale.amountReceived)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Change</span>
                  <span>{money(lastSale.changeDue)}</span>
                </div>
              </div>

              {lastSale.notes && (
                <p className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
                  Notes: {lastSale.notes}
                </p>
              )}

              <div className="mt-8 border-t border-dashed border-slate-300 pt-5 text-center">
                <p className="font-semibold text-slate-900">
                  Thank you for shopping with us!
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Please retain this invoice for your records.
                </p>
              </div>
            </div>

            <div className="no-print flex flex-col-reverse gap-3 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-end sm:p-5">
              <button
                type="button"
                onClick={() => setShowInvoice(false)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={printInvoice}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Printer size={17} />
                Print invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Billing
