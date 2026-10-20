
import { useCallback, useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Package,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  Boxes,
  IndianRupee,
  Filter,
} from 'lucide-react'

import { getCategories } from '../../services/categoryServices'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../services/productService'

const initialForm = {
  name: '',
  sku: '',
  category: '',
  sellingPrice: '',
  costPrice: '',
  stock: '',
  lowStockThreshold: '5',
  description: '',
  imageUrl: '',
}

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

function StockBadge({ product }) {
  if (Number(product.stock) === 0) {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        Out of stock
      </span>
    )
  }

  if (Number(product.stock) <= Number(product.lowStockThreshold ?? 5)) {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        Low stock
      </span>
    )
  }

  return (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      In stock
    </span>
  )
}

function ProductModal({
  product,
  categories,
  onClose,
  onSave,
  saving,
}) {
  const [form, setForm] = useState(() =>
    product
      ? {
          name: product.name ?? '',
          sku: product.sku ?? '',
          category: product.category ?? '',
          sellingPrice: String(product.sellingPrice ?? ''),
          costPrice: String(product.costPrice ?? ''),
          stock: String(product.stock ?? ''),
          lowStockThreshold: String(product.lowStockThreshold ?? 5),
          description: product.description ?? '',
          imageUrl: product.imageUrl ?? '',
        }
      : { ...initialForm }
  )

  const [formError, setFormError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!form.name.trim() || !form.sku.trim() || !form.category.trim()) {
      setFormError('Please enter the product name, SKU, and category.')
      return
    }

    const sellingPrice = Number(form.sellingPrice)
    const costPrice = Number(form.costPrice || 0)
    const stock = Number(form.stock)
    const lowStockThreshold = Number(
      form.lowStockThreshold === '' ? 5 : form.lowStockThreshold
    )

    if (
      form.sellingPrice === '' ||
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0 ||
      !Number.isFinite(costPrice) ||
      costPrice < 0 ||
      form.stock === '' ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isInteger(lowStockThreshold) ||
      lowStockThreshold < 0
    ) {
      setFormError(
        'Enter valid prices and non-negative whole-number quantities.'
      )
      return
    }

    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        category: form.category.trim(),
        sellingPrice,
        costPrice,
        stock,
        lowStockThreshold,
      })
    } catch (error) {
      setFormError(error.message || 'Unable to save product.')
    }
  }

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10'

  const currentCategoryExists = categories.some(
    (category) => category.name === form.category
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        className="max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-7"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              Inventory management
            </p>
            <h2
              id="product-modal-title"
              className="mt-2 text-2xl font-bold tracking-tight text-gray-900"
            >
              {product ? 'Edit product' : 'Add new product'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter the product details below.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-gray-700">
              Product name *
              <input
                className={inputClass}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Cotton Shirt"
                required
                maxLength={120}
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              SKU *
              <input
                className={inputClass}
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g. TSH-001"
                required
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Category *
              <select
                className={inputClass}
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>

                {product &&
                  form.category &&
                  !currentCategoryExists && (
                    <option value={form.category}>
                      {form.category} (existing)
                    </option>
                  )}

                {categories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>

              {categories.length === 0 && (
                <span className="mt-1 block text-xs font-normal text-amber-700">
                  No categories available. Create a category first.
                </span>
              )}
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Selling price (₹) *
              <input
                className={inputClass}
                type="number"
                name="sellingPrice"
                value={form.sellingPrice}
                onChange={handleChange}
                placeholder="799"
                min="0"
                step="0.01"
                required
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Cost price (₹)
              <input
                className={inputClass}
                type="number"
                name="costPrice"
                value={form.costPrice}
                onChange={handleChange}
                placeholder="450"
                min="0"
                step="0.01"
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Stock quantity *
              <input
                className={inputClass}
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="25"
                min="0"
                step="1"
                required
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Low-stock threshold
              <input
                className={inputClass}
                type="number"
                name="lowStockThreshold"
                value={form.lowStockThreshold}
                onChange={handleChange}
                min="0"
                step="1"
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Image URL
              <input
                className={inputClass}
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/product.jpg"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-gray-700">
            Description
            <textarea
              className={inputClass}
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              maxLength={1000}
              placeholder="Product details..."
            />
          </label>

          {formError && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || categories.length === 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <RefreshCw size={16} className="animate-spin" />}
              {saving
                ? 'Saving...'
                : product
                  ? 'Save changes'
                  : 'Add product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0,
    limit: 20,
  })

  const [search, setSearch] = useState('')
  const [stockStatus, setStockStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const loadCategories = useCallback(async () => {
    try {
      const response = await getCategories()
      setCategories(response.categories || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }, [])

  const loadProducts = useCallback(
    async (page = 1) => {
      setLoading(true)
      setPageError('')

      try {
        const response = await getProducts({
          search: search.trim(),
          stockStatus,
          page,
          limit: 20,
        })

        setProducts(response.products || [])
        setPagination(
          response.pagination || {
            total: response.products?.length || 0,
            page: 1,
            pages: 1,
            limit: 20,
          }
        )
      } catch (error) {
        setPageError(error.message || 'Unable to load products.')
      } finally {
        setLoading(false)
      }
    },
    [search, stockStatus]
  )

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(1), 300)
    return () => clearTimeout(timer)
  }, [loadProducts])

  const openAddModal = () => {
    setEditingProduct(null)
    setModalOpen(true)
    setNotice('')
    setPageError('')
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setModalOpen(true)
    setNotice('')
    setPageError('')
  }

  const handleSave = async (formData) => {
    setSaving(true)
    setNotice('')
    setPageError('')

    try {
      if (editingProduct) {
        await updateProduct(editingProduct._id, formData)
        setNotice('Product updated successfully.')
      } else {
        await createProduct(formData)
        setNotice('Product added successfully.')
      }

      setModalOpen(false)
      setEditingProduct(null)
      await loadProducts(1)
    } catch (error) {
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Remove "${product.name}" from active inventory?`
    )

    if (!confirmed) return

    setNotice('')
    setPageError('')

    try {
      await deleteProduct(product._id)
      setNotice(`${product.name} removed from inventory.`)
      await loadProducts(pagination.page)
    } catch (error) {
      setPageError(error.message || 'Unable to delete product.')
    }
  }

  const lowStockCount = products.filter(
    (product) =>
      Number(product.stock) > 0 &&
      Number(product.stock) <= Number(product.lowStockThreshold ?? 5)
  ).length

  const outOfStockCount = products.filter(
    (product) => Number(product.stock) === 0
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage products, prices, and available stock.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          <Plus size={18} />
          Add product
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              Total matching products
            </span>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
              <Package size={19} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">
            {pagination.total}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              Low stock on this page
            </span>
            <span className="rounded-xl bg-amber-50 p-2 text-amber-700">
              <AlertTriangle size={19} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">
            {lowStockCount}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              Out of stock on this page
            </span>
            <span className="rounded-xl bg-red-50 p-2 text-red-700">
              <Boxes size={19} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">
            {outOfStockCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product name, SKU, or category..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            />
          </div>

          <div className="relative">
            <Filter
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <select
              value={stockStatus}
              onChange={(event) => setStockStatus(event.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-9 pr-8 text-sm outline-none focus:border-emerald-600 sm:w-48"
            >
              <option value="">All stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => loadProducts(1)}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {pageError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{pageError}</p>
          <button
            type="button"
            onClick={() => loadProducts(pagination.page)}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p>{notice}</p>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="font-bold text-gray-900">All products</h3>
            <p className="mt-1 text-xs text-gray-500">
              {pagination.total} matching records
            </p>
          </div>
          <span className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500">
            Page {pagination.page} of {Math.max(1, pagination.pages)}
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-gray-500">
            <RefreshCw size={25} className="animate-spin text-emerald-700" />
            <p className="text-sm">Loading inventory...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl bg-gray-50 p-4 text-gray-400">
              <Package size={30} />
            </div>
            <h3 className="mt-4 font-bold text-gray-900">No products found</h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Add your first product or try changing the search and stock filters.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              <Plus size={16} />
              Add your first product
            </button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Product</th>
                    <th className="px-5 py-4 font-semibold">SKU / Category</th>
                    <th className="px-5 py-4 font-semibold">Selling price</th>
                    <th className="px-5 py-4 font-semibold">Stock</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr
                      key={product._id}
                      className="transition hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-11 w-11 rounded-xl border border-gray-100 object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                              <Package size={20} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="max-w-48 truncate text-sm font-semibold text-gray-900">
                              {product.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              Added{' '}
                              {product.createdAt
                                ? new Date(product.createdAt).toLocaleDateString('en-IN')
                                : '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-700">
                          {product.sku}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {product.category}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        {currency(product.sellingPrice)}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-gray-900">
                          {product.stock}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">units</p>
                      </td>

                      <td className="px-5 py-4">
                        <StockBadge product={product} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            aria-label={`Edit ${product.name}`}
                            className="rounded-lg border border-gray-200 p-2.5 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            aria-label={`Delete ${product.name}`}
                            className="rounded-lg border border-gray-200 p-2.5 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {products.map((product) => (
                <article
                  key={product._id}
                  className="rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-start gap-3">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-12 w-12 rounded-xl border border-gray-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <Package size={20} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-gray-900">
                        {product.name}
                      </h4>
                      <p className="mt-1 text-xs text-gray-500">
                        {product.sku} · {product.category}
                      </p>
                      <div className="mt-2">
                        <StockBadge product={product} />
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {currency(product.sellingPrice)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Stock: {product.stock}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-700"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-100 py-2.5 text-sm font-semibold text-red-700"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {pagination.pages > 1 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading || pagination.page <= 1}
                onClick={() => loadProducts(pagination.page - 1)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={loading || pagination.page >= pagination.pages}
                onClick={() => loadProducts(pagination.page + 1)}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <IndianRupee size={18} className="mt-0.5 shrink-0" />
        <p>
          Product prices are displayed in INR. Inventory changes are saved
          through the backend API. Stock shown here reflects the current
          inventory records.
        </p>
      </div>

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            if (!saving) {
              setModalOpen(false)
              setEditingProduct(null)
            }
          }}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}
