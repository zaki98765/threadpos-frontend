
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Download,
  FileText,
  RefreshCw,
  Search,
  Wallet,
  X,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react'
import { apiRequest } from '../../services/api'

const currency = (value = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
}

const getArray = (data) => {
  if (Array.isArray(data)) return data

  for (const key of [
    'transactions',
    'entries',
    'data',
    'results',
    'items',
    'ledger',
  ]) {
    if (Array.isArray(data?.[key])) return data[key]
  }

  if (Array.isArray(data?.data?.transactions)) {
    return data.data.transactions
  }

  if (Array.isArray(data?.data?.entries)) {
    return data.data.entries
  }

  return []
}

const getType = (item) =>
  String(item.type || item.transactionType || item.source || 'other')
    .toLowerCase()
    .replaceAll('_', ' ')

const getAmount = (item) =>
  Number(
    item.amount ??
      item.totalAmount ??
      item.grandTotal ??
      item.total ??
      item.debit ??
      item.credit ??
      0
  )

const getTransactionDate = (item) =>
  item.date ||
  item.transactionDate ||
  item.paymentDate ||
  item.saleDate ||
  item.createdAt ||
  item.receivedAt ||
  null

function SummaryCard({ title, value, description, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 break-words text-xl font-bold text-slate-900 sm:text-2xl">
            {currency(value)}
          </h3>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  )
}

function Ledger() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await apiRequest(
        '/api/transactions?page=1&limit=100'
      )
      const payload = response.data || response
      setTransactions(getArray(payload))
    } catch (err) {
      setTransactions([])
      setError(err.message || 'Unable to load ledger transactions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const normalized = useMemo(
    () =>
      transactions.map((item, index) => {
        const type = getType(item)
        const amount = getAmount(item)
        const date = getTransactionDate(item)

        const isSale =
          type.includes('sale') ||
          type.includes('sales') ||
          type.includes('income')

        const isRefund =
          type.includes('return') ||
          type.includes('refund')

        const isPurchase =
          type.includes('purchase') ||
          type.includes('supplier payment') ||
          type.includes('expense')

        const debit = Number(item.debit ?? (isSale ? 0 : amount))
        const credit = Number(item.credit ?? (isSale ? amount : 0))

        return {
          id: item._id || item.id || `${type}-${index}`,
          date,
          type,
          reference:
            item.reference ||
            item.referenceNumber ||
            item.saleNumber ||
            item.purchaseNumber ||
            item.transactionNumber ||
            item._id ||
            '—',
          description:
            item.description ||
            item.notes ||
            `${type.charAt(0).toUpperCase()}${type.slice(1)}`,
          debit,
          credit,
          amount,
          isSale,
          isRefund,
          isPurchase,
        }
      }),
    [transactions]
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return normalized
      .filter((item) => {
        const matchesSearch =
          !query ||
          [
            item.type,
            item.reference,
            item.description,
          ].some((value) =>
            String(value || '').toLowerCase().includes(query)
          )

        const date = item.date ? new Date(item.date) : null
        const matchesFrom =
          !fromDate ||
          (date &&
            !Number.isNaN(date.getTime()) &&
            date >= new Date(`${fromDate}T00:00:00`))

        const matchesTo =
          !toDate ||
          (date &&
            !Number.isNaN(date.getTime()) &&
            date <= new Date(`${toDate}T23:59:59.999`))

        const matchesType =
          typeFilter === 'all' ||
          (typeFilter === 'sales' && item.isSale) ||
          (typeFilter === 'purchases' &&
            item.type.includes('purchase')) ||
          (typeFilter === 'payments' &&
            item.type.includes('payment')) ||
          (typeFilter === 'returns' && item.isRefund)

        return (
          matchesSearch &&
          matchesFrom &&
          matchesTo &&
          matchesType
        )
      })
      .sort(
        (a, b) =>
          new Date(b.date || 0).getTime() -
          new Date(a.date || 0).getTime()
      )
  }, [normalized, search, fromDate, toDate, typeFilter])

  const totals = useMemo(() => {
    const income = filtered.reduce(
      (sum, item) => sum + (item.isSale ? item.amount : 0),
      0
    )

    const expenses = filtered.reduce(
      (sum, item) =>
        sum +
        (item.isSale ? 0 : Math.max(item.debit, item.amount)),
      0
    )

    const debit = filtered.reduce((sum, item) => sum + item.debit, 0)
    const credit = filtered.reduce((sum, item) => sum + item.credit, 0)

    return {
      income,
      expenses,
      net: income - expenses,
      debit,
      credit,
    }
  }, [filtered])

  const exportCSV = () => {
    const escape = (value) =>
      `"${String(value ?? '').replaceAll('"', '""')}"`

    const rows = [
      ['Date', 'Reference', 'Type', 'Description', 'Debit', 'Credit'],
      ...filtered.map((item) => [
        item.date ? new Date(item.date).toISOString().slice(0, 10) : '',
        item.reference,
        item.type,
        item.description,
        item.debit,
        item.credit,
      ]),
    ]

    const csv = rows.map((row) => row.map(escape).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'threadpos-general-ledger.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setFromDate('')
    setToDate('')
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Activity size={16} />
            <span>Finance / General Ledger</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            General Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review financial activity recorded in ThreadPOS.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadTransactions}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Sales Income"
          value={totals.income}
          description="Sales in the filtered records"
          icon={ArrowDownLeft}
          color="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          title="Outflows"
          value={totals.expenses}
          description="Purchases, payments and other outflows"
          icon={ArrowUpRight}
          color="bg-rose-50 text-rose-600"
        />
        <SummaryCard
          title="Net Movement"
          value={totals.net}
          description="Income minus outflows"
          icon={Wallet}
          color="bg-indigo-50 text-indigo-600"
        />
        <SummaryCard
          title="Transactions"
          value={filtered.length}
          description="Visible matching records"
          icon={FileText}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Search transactions
            </label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Reference or description..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Transaction type
            </label>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500"
            >
              <option value="all">All transactions</option>
              <option value="sales">Sales</option>
              <option value="purchases">Purchases</option>
              <option value="payments">Payments</option>
              <option value="returns">Returns / refunds</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              From date
            </label>
            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              To date
            </label>
            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Showing <strong className="text-slate-800">{filtered.length}</strong>{' '}
            of {normalized.length} loaded records
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Clear filters
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-900">Ledger Transactions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Debit and credit entries from the transactions API.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
            <LoaderCircle size={22} className="animate-spin" />
            Loading ledger...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Reference</th>
                  <th className="px-5 py-4 font-semibold">Description</th>
                  <th className="px-5 py-4 font-semibold">Type</th>
                  <th className="px-5 py-4 text-right font-semibold">Debit</th>
                  <th className="px-5 py-4 text-right font-semibold">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <FileText
                        size={30}
                        className="mx-auto text-slate-300"
                      />
                      <p className="mt-3 font-semibold text-slate-700">
                        No ledger transactions found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try clearing your filters or record a sale or purchase first.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {item.reference}
                      </td>
                      <td className="max-w-xs px-5 py-4 text-slate-600">
                        <span className="block truncate">
                          {item.description}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                          {item.type}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-rose-700">
                        {item.debit > 0 ? currency(item.debit) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-emerald-700">
                        {item.credit > 0 ? currency(item.credit) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-4 font-bold text-slate-900"
                    >
                      Filtered totals
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-rose-700">
                      {currency(totals.debit)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-emerald-700">
                      {currency(totals.credit)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Note: This is an operational transaction ledger, not a formal
        double-entry accounting ledger. The page displays up to the 100 records
        requested from the API and calculates its summaries from the loaded,
        filtered records.
      </p>
    </div>
  )
}

export default Ledger
