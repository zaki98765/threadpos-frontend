
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  RefreshCw,
  Download,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  ReceiptText,
  ShoppingBag,
  CreditCard,
  RotateCcw,
  CalendarDays,
  AlertCircle,
  ArrowLeftRight,
} from 'lucide-react'
import { apiRequest } from '../../services/api'

const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const transactionTypes = [
  { value: 'all', label: 'All transactions' },
  { value: 'sale', label: 'Sales' },
  { value: 'purchase', label: 'Purchases' },
  { value: 'supplier_payment', label: 'Supplier payments' },
  { value: 'return', label: 'Refunds / returns' },
]

const typeLabels = {
  sale: 'Sale',
  purchase: 'Purchase',
  supplier_payment: 'Supplier payment',
  return: 'Refund / return',
}

const typeStyles = {
  sale: 'bg-emerald-50 text-emerald-700',
  purchase: 'bg-blue-50 text-blue-700',
  supplier_payment: 'bg-violet-50 text-violet-700',
  return: 'bg-rose-50 text-rose-700',
}

const statusStyles = {
  paid: 'bg-emerald-50 text-emerald-700',
  received: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  credit: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
}

function SummaryCard({ title, amount, icon: Icon, tone, subtitle }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 break-words text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {currency(amount)}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${tone}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ value }) {
  const normalized = String(value || 'unknown').toLowerCase()
  const style = statusStyles[normalized] || 'bg-gray-100 text-gray-600'

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${style}`}
    >
      {String(value || 'Unknown').replaceAll('_', ' ')}
    </span>
  )
}

function TypeBadge({ type }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${typeStyles[type] || 'bg-gray-100 text-gray-600'}`}
    >
      {typeLabels[type] || type}
    </span>
  )
}

function escapeCsv(value) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

function exportCsv(transactions) {
  const headers = [
    'Date',
    'Type',
    'Reference',
    'Description',
    'Party',
    'Payment Method',
    'Status',
    'Amount (INR)',
    'Direction',
    'Notes',
  ]

  const rows = transactions.map((item) => [
    formatDate(item.date),
    typeLabels[item.type] || item.type,
    item.reference,
    item.description,
    item.party,
    item.method,
    item.status,
    item.amount,
    item.direction,
    item.notes,
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\r\n')

  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `threadpos-transactions-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function TransactionDetails({ transaction, onClose }) {
  useEffect(() => {
    if (!transaction) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [transaction, onClose])

  if (!transaction) return null

  const details = transaction.details || {}
  const items = details.items || []

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-details-title"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <TypeBadge type={transaction.type} />
            <h2
              id="transaction-details-title"
              className="mt-3 break-words text-xl font-bold text-gray-900"
            >
              {transaction.reference || 'Transaction details'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {formatDate(transaction.date)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close transaction details"
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Description</p>
            <p className="mt-1 break-words text-sm font-semibold text-gray-900">
              {transaction.description || '—'}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Customer / supplier</p>
            <p className="mt-1 break-words text-sm font-semibold text-gray-900">
              {transaction.party || '—'}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Payment method</p>
            <p className="mt-1 text-sm font-semibold capitalize text-gray-900">
              {String(transaction.method || '—').replaceAll('_', ' ')}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Status</p>
            <div className="mt-2">
              <StatusBadge value={transaction.status} />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Transaction amount</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {currency(transaction.amount)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {transaction.direction === 'in' ? 'Money received' : 'Money paid / refunded'}
          </p>
        </div>

        {details.items?.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-semibold text-gray-900">Items</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Unit price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <tr key={`${item.sku || item.name}-${index}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.sku && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            SKU: {item.sku}
                          </p>
                        )}
                        {item.reason && (
                          <p className="mt-1 text-xs text-gray-500">
                            Reason: {item.reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        {currency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {currency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(details.subtotal !== undefined ||
          details.discount !== undefined ||
          details.taxAmount !== undefined) && (
          <div className="mt-5 space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
            {details.subtotal !== undefined && (
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Subtotal</span>
                <span>{currency(details.subtotal)}</span>
              </div>
            )}
            {details.discount !== undefined && (
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Discount</span>
                <span>{currency(details.discount)}</span>
              </div>
            )}
            {details.taxAmount !== undefined && (
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Tax</span>
                <span>{currency(details.taxAmount)}</span>
              </div>
            )}
            {details.amountReceived !== undefined && (
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Amount received</span>
                <span>{currency(details.amountReceived)}</span>
              </div>
            )}
            {details.changeDue !== undefined && (
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Change due</span>
                <span>{currency(details.changeDue)}</span>
              </div>
            )}
          </div>
        )}

        {transaction.notes && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Notes
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-700">
              {transaction.notes}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Close details
        </button>
      </section>
    </div>
  )
}

export default function Transactions() {
  const today = new Date().toISOString().slice(0, 10)

  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({
    count: 0,
    sales: 0,
    purchases: 0,
    supplierPayments: 0,
    refunds: 0,
    netSales: 0,
  })
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  })
  const [type, setType] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        type,
        page: String(page),
        limit: '20',
      })

      if (search) params.set('search', search)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const result = await apiRequest(`/api/transactions?${params.toString()}`)

      setTransactions(result.transactions || [])
      setSummary(
        result.summary || {
          count: 0,
          sales: 0,
          purchases: 0,
          supplierPayments: 0,
          refunds: 0,
          netSales: 0,
        }
      )
      setPagination(
        result.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          pages: 0,
        }
      )
    } catch (err) {
      setError(err.message || 'Unable to load transactions.')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [type, page, search, startDate, endDate])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const visibleRange = useMemo(() => {
    if (!pagination.total) return '0 transactions'
    const first = (pagination.page - 1) * pagination.limit + 1
    const last = Math.min(
      pagination.page * pagination.limit,
      pagination.total
    )
    return `${first}–${last} of ${pagination.total}`
  }, [pagination])

  const applySearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const resetFilters = () => {
    setType('all')
    setSearchInput('')
    setSearch('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const setToday = () => {
    setStartDate(today)
    setEndDate(today)
    setPage(1)
  }

  const setThisMonth = () => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    setStartDate(
      `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-${String(first.getDate()).padStart(2, '0')}`
    )
    setEndDate(today)
    setPage(1)
  }

  const exportCurrentPage = () => {
    if (!transactions.length) return
    exportCsv(transactions)
  }

  const exportAllFiltered = async () => {
    try {
      setError('')
      const params = new URLSearchParams({
        type,
        page: '1',
        limit: '100',
      })
      if (search) params.set('search', search)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const firstResult = await apiRequest(
        `/api/transactions?${params.toString()}`
      )
      const allTransactions = [...(firstResult.transactions || [])]
      const pages = firstResult.pagination?.pages || 1

      for (let currentPage = 2; currentPage <= pages; currentPage += 1) {
        params.set('page', String(currentPage))
        const result = await apiRequest(
          `/api/transactions?${params.toString()}`
        )
        allTransactions.push(...(result.transactions || []))
      }

      if (!allTransactions.length) {
        setError('There are no transactions to export for these filters.')
        return
      }

      exportCsv(allTransactions)
    } catch (err) {
      setError(err.message || 'Unable to export transactions.')
    }
  }

  return (
    <div className="min-w-0 space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
              <ArrowLeftRight size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Transactions
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Review sales, purchases, supplier payments and refunds in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadTransactions}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportAllFiltered}
            disabled={loading || pagination.total === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export filtered CSV
          </button>
        </div>
      </div>

      {error && (
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total sales"
          amount={summary.sales}
          icon={ArrowDownLeft}
          tone="bg-emerald-50 text-emerald-700"
          subtitle="Recorded sale transactions"
        />
        <SummaryCard
          title="Purchases"
          amount={summary.purchases}
          icon={ShoppingBag}
          tone="bg-blue-50 text-blue-700"
          subtitle="Purchase records, including credit"
        />
        <SummaryCard
          title="Supplier payments"
          amount={summary.supplierPayments}
          icon={CreditCard}
          tone="bg-violet-50 text-violet-700"
          subtitle="Payments actually recorded"
        />
        <SummaryCard
          title="Refunds"
          amount={summary.refunds}
          icon={RotateCcw}
          tone="bg-rose-50 text-rose-700"
          subtitle="Completed customer refunds"
        />
        <SummaryCard
          title="Net sales"
          amount={summary.netSales}
          icon={ReceiptText}
          tone="bg-teal-50 text-teal-700"
          subtitle="Sales minus recorded refunds"
        />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Matching transactions
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {summary.count}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Based on your current filters
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
              <CalendarDays size={21} />
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-gray-900">Transaction history</h2>
            <p className="mt-1 text-xs text-gray-500">
              Search and filter the records shown below.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={setToday}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Today
            </button>
            <button
              type="button"
              onClick={setThisMonth}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              This month
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100"
            >
              Clear filters
            </button>
          </div>
        </div>

        <form
          onSubmit={applySearch}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
        >
          <div className="relative sm:col-span-2 xl:col-span-2">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search reference, party, method..."
              maxLength={100}
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value)
              setPage(1)
            }}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500"
          >
            {transactionTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => {
              setStartDate(event.target.value)
              setPage(1)
            }}
            aria-label="Start date"
            className="w-full min-w-0 rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
          />

          <div className="flex min-w-0 gap-2">
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => {
                setEndDate(event.target.value)
                setPage(1)
              }}
              aria-label="End date"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Search
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-800">{visibleRange}</span>
          </p>
          <button
            type="button"
            onClick={exportCurrentPage}
            disabled={!transactions.length}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <Download size={15} />
            Export current page
          </button>
        </div>

        <div className="relative mt-2">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/70 pt-12 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
                <RefreshCw size={16} className="animate-spin" />
                Loading transactions...
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="rounded-l-xl px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Party</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="rounded-r-xl px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!loading && transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="rounded-2xl bg-gray-100 p-4 text-gray-400">
                          <ReceiptText size={28} />
                        </div>
                        <p className="mt-4 font-semibold text-gray-800">
                          No transactions found
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Try changing the date range or clearing the filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="transition hover:bg-gray-50/80">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">
                        {transaction.reference || '—'}
                      </p>
                      <div className="mt-1">
                        <TypeBadge type={transaction.type} />
                      </div>
                      <p className="mt-1 max-w-[230px] truncate text-xs text-gray-500">
                        {transaction.description}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="max-w-[180px] px-4 py-4">
                      <p className="truncate font-medium text-gray-800">
                        {transaction.party || '—'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 capitalize text-gray-600">
                      {String(transaction.method || '—').replaceAll('_', ' ')}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={transaction.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div
                        className={`inline-flex items-center justify-end gap-1.5 font-bold ${
                          transaction.direction === 'in'
                            ? 'text-emerald-700'
                            : 'text-gray-800'
                        }`}
                      >
                        {transaction.direction === 'in' ? (
                          <ArrowDownLeft size={15} />
                        ) : (
                          <ArrowUpRight size={15} />
                        )}
                        {currency(transaction.amount)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTransaction(transaction)}
                        aria-label={`View details for ${transaction.reference}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {Math.max(1, pagination.pages)}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              type="button"
              disabled={
                loading ||
                pagination.pages === 0 ||
                pagination.page >= pagination.pages
              }
              onClick={() =>
                setPage((current) => Math.min(pagination.pages, current + 1))
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <TransactionDetails
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  )
}
