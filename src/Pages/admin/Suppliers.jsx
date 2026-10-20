
import { useCallback, useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Truck,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  MapPin,
  Building2,
  IndianRupee,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  AlertCircle,
} from 'lucide-react'

import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../../services/supplierService'

const emptyForm = {
  name: '',
  companyName: '',
  phone: '',
  email: '',
  gstNumber: '',
  address: '',
  openingBalance: '0',
  notes: '',
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

function StatCard({ icon: Icon, label, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  )
}

function SupplierModal({
  supplier,
  onClose,
  onSave,
  saving,
}) {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...(supplier
      ? {
          ...supplier,
          openingBalance: String(supplier.openingBalance ?? 0),
        }
      : {}),
  }))

  const [formError, setFormError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!form.name.trim()) {
      setFormError('Please enter the supplier name.')
      return
    }

    if (!form.phone.trim()) {
      setFormError('Please enter a phone number.')
      return
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      setFormError('Please enter a valid email address.')
      return
    }

    const openingBalance = Number(form.openingBalance)

    if (!Number.isFinite(openingBalance) || openingBalance < 0) {
      setFormError('Opening balance must be a valid non-negative amount.')
      return
    }

    try {
      await onSave({
        name: form.name.trim(),
        companyName: form.companyName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        gstNumber: form.gstNumber.trim().toUpperCase(),
        address: form.address.trim(),
        openingBalance,
        notes: form.notes.trim(),
      })
    } catch (error) {
      setFormError(error.message || 'Unable to save supplier.')
    }
  }

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'

  const labelClass = 'text-sm font-medium text-slate-700'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-modal-title"
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-7">
          <div>
            <h2
              id="supplier-modal-title"
              className="text-xl font-bold text-slate-900"
            >
              {supplier ? 'Edit supplier' : 'Add new supplier'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Maintain your supplier contact and account details.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                Supplier name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Mohammed Ali"
                maxLength={100}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Company name</label>
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="e.g. Ali Textiles"
                maxLength={150}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Phone number <span className="text-red-500">*</span>
              </label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                maxLength={20}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Email address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="supplier@example.com"
                maxLength={150}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>GST number</label>
              <input
                name="gstNumber"
                value={form.gstNumber}
                onChange={handleChange}
                placeholder="Enter GSTIN"
                maxLength={15}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Opening balance (₹)</label>
              <input
                name="openingBalance"
                type="number"
                min="0"
                step="0.01"
                value={form.openingBalance}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Street, city, state, PIN code"
                rows={2}
                maxLength={500}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Payment terms or other useful information"
                rows={2}
                maxLength={1000}
                className={inputClass}
              />
            </div>
          </div>

          {formError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{formError}</p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <RefreshCw size={16} className="animate-spin" />}
              {saving
                ? 'Saving...'
                : supplier
                  ? 'Save changes'
                  : 'Add supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SupplierDetailsModal({ supplier, onClose }) {
  if (!supplier) return null

  const detailRows = [
    { icon: Building2, label: 'Company', value: supplier.companyName },
    { icon: Phone, label: 'Phone', value: supplier.phone },
    { icon: Mail, label: 'Email', value: supplier.email },
    { icon: FileText, label: 'GST number', value: supplier.gstNumber },
    { icon: MapPin, label: 'Address', value: supplier.address },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-details-title"
        className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Supplier profile
            </p>
            <h2
              id="supplier-details-title"
              className="mt-1 text-2xl font-bold text-slate-900"
            >
              {supplier.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {supplier.companyName || 'No company name provided'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close supplier details"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {detailRows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex gap-3">
              <div className="h-fit rounded-lg bg-slate-100 p-2 text-slate-600">
                <Icon size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-0.5 break-words text-sm font-medium text-slate-800">
                  {value || 'Not provided'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">Opening balance</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">
            {formatCurrency(supplier.openingBalance)}
          </p>
        </div>

        {supplier.notes && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {supplier.notes}
            </p>
          </div>
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

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
  })

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [viewingSupplier, setViewingSupplier] = useState(null)

  const loadSuppliers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getSuppliers({
        search,
        page,
        limit: 10,
      })

      setSuppliers(data.suppliers || [])
      setPagination(
        data.pagination || {
          total: 0,
          page: 1,
          pages: 1,
          limit: 10,
        }
      )
    } catch (err) {
      setError(err.message || 'Failed to load suppliers.')
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  const handleSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const openAddModal = () => {
    setEditingSupplier(null)
    setShowForm(true)
    setNotice('')
  }

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier)
    setShowForm(true)
    setNotice('')
  }

  const handleSave = async (formData) => {
    setSaving(true)
    setNotice('')

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier._id, formData)
        setNotice('Supplier updated successfully.')
      } else {
        await createSupplier(formData)
        setNotice('Supplier added successfully.')
        setPage(1)
      }

      setShowForm(false)
      setEditingSupplier(null)

      if (!editingSupplier) {
        setSearch('')
        setSearchInput('')
      }

      await loadSuppliers()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (supplier) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${supplier.name}"?`
    )

    if (!confirmed) return

    setNotice('')
    setError('')

    try {
      await deleteSupplier(supplier._id)
      setNotice(`${supplier.name} was removed successfully.`)

      if (suppliers.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await loadSuppliers()
      }
    } catch (err) {
      setError(err.message || 'Unable to delete supplier.')
    }
  }

  const totalOpeningBalance = suppliers.reduce(
    (total, supplier) => total + (Number(supplier.openingBalance) || 0),
    0
  )

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
            <Truck size={17} />
            Inventory management
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Suppliers
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Manage supplier contacts and opening balances in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus size={19} />
          Add supplier
        </button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Users size={17} />
          {notice}
          <button
            type="button"
            onClick={() => setNotice('')}
            className="ml-auto rounded p-1 hover:bg-emerald-100"
            aria-label="Dismiss notification"
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
            onClick={loadSuppliers}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total suppliers"
          value={pagination.total}
          subtitle="Active suppliers matching your search"
        />

        <StatCard
          icon={IndianRupee}
          label="Opening balance"
          value={formatCurrency(totalOpeningBalance)}
          subtitle="Across suppliers on this page"
        />

        <StatCard
          icon={Building2}
          label="Current page"
          value={`${pagination.page} / ${Math.max(1, pagination.pages)}`}
          subtitle="Supplier directory pagination"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Supplier directory</h2>
            <p className="mt-1 text-sm text-slate-500">
              {pagination.total} supplier
              {pagination.total === 1 ? '' : 's'} found
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex w-full gap-2 lg:max-w-md"
          >
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search name, company, phone..."
                aria-label="Search suppliers"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw size={26} className="animate-spin text-emerald-600" />
            <p className="text-sm">Loading suppliers...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
              <Truck size={30} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              {search ? 'No matching suppliers' : 'No suppliers yet'}
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {search
                ? 'Try another search term or clear the search.'
                : 'Add your first supplier to keep your supplier information organized.'}
            </p>

            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setSearchInput('')
                  setPage(1)
                }}
                className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Clear search
              </button>
            ) : (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Plus size={17} />
                Add first supplier
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4 font-semibold">Supplier</th>
                    <th className="px-5 py-4 font-semibold">Contact</th>
                    <th className="px-5 py-4 font-semibold">GST number</th>
                    <th className="px-5 py-4 font-semibold">Opening balance</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {suppliers.map((supplier) => (
                    <tr
                      key={supplier._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setViewingSupplier(supplier)}
                          className="flex items-center gap-3 text-left"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">
                            {supplier.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900 hover:text-emerald-700">
                              {supplier.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {supplier.companyName || 'Independent supplier'}
                            </p>
                          </div>
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <p className="flex items-center gap-2 text-sm text-slate-700">
                          <Phone size={14} className="text-slate-400" />
                          {supplier.phone}
                        </p>
                        {supplier.email && (
                          <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <Mail size={13} />
                            {supplier.email}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {supplier.gstNumber || '—'}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                        {formatCurrency(supplier.openingBalance)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingSupplier(supplier)}
                            title="View details"
                            aria-label={`View ${supplier.name}`}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                          >
                            <FileText size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(supplier)}
                            title="Edit supplier"
                            aria-label={`Edit ${supplier.name}`}
                            className="rounded-lg border border-slate-200 p-2 text-emerald-700 hover:bg-emerald-50"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(supplier)}
                            title="Remove supplier"
                            aria-label={`Remove ${supplier.name}`}
                            className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50"
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

            <div className="divide-y divide-slate-100 md:hidden">
              {suppliers.map((supplier) => (
                <div key={supplier._id} className="space-y-4 p-4">
                  <button
                    type="button"
                    onClick={() => setViewingSupplier(supplier)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">
                      {supplier.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {supplier.name}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {supplier.companyName || 'Independent supplier'}
                      </p>
                    </div>

                    <ChevronRight size={18} className="text-slate-400" />
                  </button>

                  <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2 break-all">
                      <Phone size={15} className="shrink-0 text-slate-400" />
                      {supplier.phone}
                    </p>

                    {supplier.email && (
                      <p className="flex items-center gap-2 break-all">
                        <Mail size={15} className="shrink-0 text-slate-400" />
                        {supplier.email}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-xs text-slate-500">
                        Opening balance
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(supplier.openingBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setViewingSupplier(supplier)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700"
                    >
                      <FileText size={15} />
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(supplier)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-100 py-2 text-sm font-medium text-emerald-700"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(supplier)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-100 py-2 text-sm font-medium text-red-600"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm text-slate-500">
                Showing{' '}
                {pagination.total === 0
                  ? 0
                  : (pagination.page - 1) * pagination.limit + 1}
                {'–'}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{' '}
                of {pagination.total}
              </p>

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

      {showForm && (
        <SupplierModal
          supplier={editingSupplier}
          saving={saving}
          onClose={() => {
            if (!saving) {
              setShowForm(false)
              setEditingSupplier(null)
            }
          }}
          onSave={handleSave}
        />
      )}

      {viewingSupplier && (
        <SupplierDetailsModal
          supplier={viewingSupplier}
          onClose={() => setViewingSupplier(null)}
        />
      )}
    </div>
  )
}
