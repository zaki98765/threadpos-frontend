
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  X,
  ShieldCheck,
  KeyRound,
  Power,
  Mail,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
} from 'lucide-react'
import { apiRequest } from '../../services/api'

const initialForm = { name: '', email: '', password: '' }

function formatDate(date) {
  if (!date) return '—'

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '—'

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function Modal({ title, subtitle, icon: Icon, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <Icon size={21} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </section>
    </div>
  )
}

function Staff() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadStaff = useCallback(async (isRefresh = false) => {
    setError('')
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const result = await apiRequest('/api/staff')
      setStaff(Array.isArray(result.staff) ? result.staff : [])
    } catch (err) {
      setError(err.message || 'Unable to load staff accounts.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadStaff()
  }, [loadStaff])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(timeout)
  }, [notice])

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase()

    return staff.filter((person) => {
      const matchesSearch =
        !query ||
        person.name?.toLowerCase().includes(query) ||
        person.email?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && person.isActive) ||
        (statusFilter === 'inactive' && !person.isActive)

      return matchesSearch && matchesStatus
    })
  }, [staff, search, statusFilter])

  const activeCount = staff.filter((person) => person.isActive).length
  const inactiveCount = staff.length - activeCount

  const openAddModal = () => {
    setForm(initialForm)
    setError('')
    setModal({ type: 'add' })
  }

  const openPasswordModal = (person) => {
    setNewPassword('')
    setError('')
    setModal({ type: 'password', person })
  }

  const closeModal = () => {
    if (submitting) return
    setModal(null)
    setError('')
  }

  const handleCreateStaff = async (event) => {
    event.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    setSubmitting(true)

    try {
      const result = await apiRequest('/api/staff', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      })

      if (result.staff) {
        setStaff((current) => [
          result.staff,
          ...current.filter((person) => person.id !== result.staff.id),
        ])
      } else {
        await loadStaff()
      }

      setModal(null)
      setForm(initialForm)
      setNotice(result.message || 'Staff account created successfully.')
    } catch (err) {
      setError(err.message || 'Unable to create staff account.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (person) => {
    const nextStatus = !person.isActive
    const action = nextStatus ? 'activate' : 'deactivate'

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${person.name}'s account?`
      )
    ) {
      return
    }

    setError('')
    setActionId(person.id)

    try {
      const result = await apiRequest(`/api/staff/${person.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextStatus }),
      })

      if (result.staff) {
        setStaff((current) =>
          current.map((item) =>
            item.id === person.id ? result.staff : item
          )
        )
      } else {
        await loadStaff()
      }

      setNotice(result.message || 'Staff status updated successfully.')
    } catch (err) {
      setError(err.message || 'Unable to update staff status.')
    } finally {
      setActionId(null)
    }
  }

  const handlePasswordReset = async (event) => {
    event.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('New password must contain at least 8 characters.')
      return
    }

    setSubmitting(true)

    try {
      const result = await apiRequest(
        `/api/staff/${modal.person.id}/password`,
        {
          method: 'PATCH',
          body: JSON.stringify({ password: newPassword }),
        }
      )

      setModal(null)
      setNewPassword('')
      setNotice(result.message || 'Staff password reset successfully.')
    } catch (err) {
      setError(err.message || 'Unable to reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck size={16} className="text-emerald-700" />
            Administration / Staff
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Staff Management
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
            Manage employee accounts, access status and passwords from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => loadStaff(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <Plus size={18} />
            Add staff
          </button>
        </div>
      </div>

      {/* Feedback */}
      {error && !modal && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">{error}</div>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          <CheckCircle2 size={19} className="shrink-0" />
          {notice}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total staff"
          value={loading ? '—' : staff.length}
          description="Registered staff accounts"
          icon={Users}
          iconStyle="bg-blue-50 text-blue-700"
        />
        <SummaryCard
          title="Active accounts"
          value={loading ? '—' : activeCount}
          description="Accounts currently enabled"
          icon={UserCheck}
          iconStyle="bg-emerald-50 text-emerald-700"
        />
        <SummaryCard
          title="Inactive accounts"
          value={loading ? '—' : inactiveCount}
          description="Accounts currently disabled"
          icon={UserX}
          iconStyle="bg-amber-50 text-amber-700"
        />
      </div>

      {/* Staff table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Team members</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? 'Loading staff accounts…'
                : `${filteredStaff.length} of ${staff.length} staff members`}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <div className="relative min-w-0 flex-1 sm:min-w-64">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email..."
                aria-label="Search staff"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter staff by status"
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <LoaderCircle size={30} className="animate-spin text-emerald-700" />
            <p className="text-sm">Loading staff accounts…</p>
          </div>
        ) : error && staff.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <AlertCircle size={34} className="mb-3 text-red-500" />
            <p className="font-semibold text-slate-800">
              Could not load staff accounts
            </p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => loadStaff()}
              className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Try again
            </button>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
              <Users size={30} />
            </div>
            <p className="mt-4 font-semibold text-slate-800">
              {staff.length === 0 ? 'No staff members yet' : 'No matching staff'}
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {staff.length === 0
                ? 'Add your first staff member to start managing employee access.'
                : 'Try a different search term or change the status filter.'}
            </p>
            {staff.length === 0 && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                <Plus size={17} />
                Add staff member
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile staff cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredStaff.map((person) => (
                <StaffMobileCard
                  key={person.id}
                  person={person}
                  actionId={actionId}
                  onStatusChange={handleStatusChange}
                  onPasswordReset={openPasswordModal}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Staff member</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((person) => (
                    <tr key={person.id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-800">
                            {getInitials(person.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {person.name}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500">
                              <Mail size={14} />
                              {person.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                          <ShieldCheck size={14} />
                          Staff
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <span className="flex items-center gap-2">
                          <CalendarDays size={15} className="text-slate-400" />
                          {formatDate(person.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge active={person.isActive} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openPasswordModal(person)}
                            title="Reset password"
                            aria-label={`Reset password for ${person.name}`}
                            className="rounded-lg border border-slate-200 p-2.5 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <KeyRound size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={actionId === person.id}
                            onClick={() => handleStatusChange(person)}
                            title={person.isActive ? 'Deactivate account' : 'Activate account'}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition disabled:opacity-50 ${
                              person.isActive
                                ? 'border-red-200 text-red-700 hover:bg-red-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {actionId === person.id ? (
                              <LoaderCircle size={15} className="animate-spin" />
                            ) : (
                              <Power size={15} />
                            )}
                            {person.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Add staff modal */}
      {modal?.type === 'add' && (
        <Modal
          title="Add staff member"
          subtitle="Create a new employee account."
          icon={Users}
          onClose={closeModal}
        >
          <form onSubmit={handleCreateStaff} className="space-y-5">
            {error && <FormError message={error} />}

            <FormField label="Full name">
              <input
                autoFocus
                required
                maxLength={100}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Enter full name"
                className={inputClass}
              />
            </FormField>

            <FormField label="Email address">
              <input
                type="email"
                required
                maxLength={254}
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="employee@example.com"
                className={inputClass}
              />
            </FormField>

            <FormField label="Temporary password">
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                placeholder="At least 8 characters"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Share this password securely with the employee.
              </p>
            </FormField>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {submitting && <LoaderCircle size={17} className="animate-spin" />}
                Create account
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Password reset modal */}
      {modal?.type === 'password' && (
        <Modal
          title="Reset staff password"
          subtitle={`Set a new password for ${modal.person.name}.`}
          icon={KeyRound}
          onClose={closeModal}
        >
          <form onSubmit={handlePasswordReset} className="space-y-5">
            {error && <FormError message={error} />}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">
                {modal.person.name}
              </p>
              <p className="mt-1 break-all text-sm text-slate-500">
                {modal.person.email}
              </p>
            </div>

            <FormField label="New password">
              <input
                autoFocus
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                className={inputClass}
              />
            </FormField>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {submitting && <LoaderCircle size={17} className="animate-spin" />}
                Save new password
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10'

function SummaryCard({ title, value, description, icon: Icon, iconStyle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">{description}</p>
        </div>
        <div className={`rounded-xl p-3 ${iconStyle}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-600' : 'bg-slate-400'
        }`}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function FormError({ message }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      <AlertCircle size={17} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

function StaffMobileCard({
  person,
  actionId,
  onStatusChange,
  onPasswordReset,
}) {
  return (
    <article className="space-y-4 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-800">
          {getInitials(person.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold text-slate-900">
            {person.name}
          </p>
          <p className="mt-1 break-all text-sm text-slate-500">
            {person.email}
          </p>
          <div className="mt-2">
            <StatusBadge active={person.isActive} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={14} />
          Joined {formatDate(person.createdAt)}
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck size={14} />
          Staff
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => onPasswordReset(person)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <KeyRound size={15} />
          Reset password
        </button>
        <button
          type="button"
          disabled={actionId === person.id}
          onClick={() => onStatusChange(person)}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold disabled:opacity-50 ${
            person.isActive
              ? 'border-red-200 text-red-700 hover:bg-red-50'
              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          {actionId === person.id ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Power size={15} />
          )}
          {person.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </article>
  )
}

export default Staff
