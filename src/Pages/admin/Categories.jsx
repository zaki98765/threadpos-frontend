import { useCallback, useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Tags,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Package,
  AlertCircle,
} from 'lucide-react'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/categoryServices'

const emptyForm = { name: '', description: '' }

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getCategories()
      setCategories(response.categories || [])
    } catch (err) {
      setError(err.message || 'Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setNotice('')
    setError('')
    setModalOpen(true)
  }

  const openEdit = (category) => {
    setEditing(category)
    setForm({
      name: category.name || '',
      description: category.description || '',
    })
    setNotice('')
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (editing) {
        await updateCategory(editing._id, form)
        setNotice('Category updated successfully.')
      } else {
        await createCategory(form)
        setNotice('Category created successfully.')
      }

      setModalOpen(false)
      setEditing(null)
      setForm(emptyForm)
      await loadCategories()
    } catch (err) {
      setError(err.message || 'Unable to save category.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete the "${category.name}" category?`
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      await deleteCategory(category._id)
      setNotice('Category deleted successfully.')
      await loadCategories()
    } catch (err) {
      setError(err.message || 'Unable to delete category.')
    }
  }

  const filteredCategories = categories.filter((category) => {
    const query = search.trim().toLowerCase()
    return (
      category.name.toLowerCase().includes(query) ||
      (category.description || '').toLowerCase().includes(query)
    )
  })

  const inputClass =
    'mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10'

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Categories management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Organize your inventory into manageable categories.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          <Plus size={18} />
          Add category
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total categories</span>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
              <Tags size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">
            {categories.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Search results</span>
            <span className="rounded-xl bg-blue-50 p-2 text-blue-700">
              <Search size={20} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">
            {filteredCategories.length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            />
          </div>

          <button
            type="button"
            onClick={loadCategories}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
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
            <h3 className="font-bold text-gray-900">All categories</h3>
            <p className="mt-1 text-xs text-gray-500">
              Browse and manage your categories.
            </p>
          </div>
          <span className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-500">
            {filteredCategories.length} records
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-gray-500">
            <RefreshCw size={20} className="animate-spin text-emerald-700" />
            Loading categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl bg-gray-50 p-4 text-gray-400">
              <Tags size={30} />
            </div>
            <h3 className="mt-4 font-bold text-gray-900">
              {search ? 'No matching categories' : 'No categories yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {search
                ? 'Try another search term.'
                : 'Create your first category to organize products.'}
            </p>
            {!search && (
              <button
                type="button"
                onClick={openAdd}
                className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Create category
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[600px] text-left">
                <thead className="bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Category</th>
                    <th className="px-5 py-4 font-semibold">Description</th>
                    <th className="px-5 py-4 font-semibold">Created</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCategories.map((category) => (
                    <tr key={category._id} className="transition hover:bg-gray-50/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <Tags size={19} />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {category.name}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-xs px-5 py-4 text-sm text-gray-500">
                        <span className="line-clamp-2">
                          {category.description || 'No description'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {category.createdAt
                          ? new Date(category.createdAt).toLocaleDateString('en-IN')
                          : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(category)}
                            aria-label={`Edit ${category.name}`}
                            className="rounded-lg border border-gray-200 p-2.5 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            aria-label={`Delete ${category.name}`}
                            className="rounded-lg border border-gray-200 p-2.5 text-gray-600 hover:bg-red-50 hover:text-red-700"
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
              {filteredCategories.map((category) => (
                <article
                  key={category._id}
                  className="rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Tags size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="break-words text-sm font-bold text-gray-900">
                        {category.name}
                      </h4>
                      <p className="mt-1 break-words text-sm text-gray-500">
                        {category.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(category)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-700"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
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
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false)
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-dialog-title"
            className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Inventory organization
                </p>
                <h2
                  id="category-dialog-title"
                  className="mt-2 text-2xl font-bold text-gray-900"
                >
                  {editing ? 'Edit category' : 'Add category'}
                </h2>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
                className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-sm font-semibold text-gray-700">
                Category name *
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. Shirts"
                  maxLength={60}
                  required
                  autoFocus
                />
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Description
                <textarea
                  className={inputClass}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Brief description of this category"
                  rows={3}
                  maxLength={300}
                />
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {saving && <RefreshCw size={16} className="animate-spin" />}
                  {saving
                    ? 'Saving...'
                    : editing
                      ? 'Save changes'
                      : 'Create category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
