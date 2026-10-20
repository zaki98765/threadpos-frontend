
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Download,
  RefreshCw,
  IndianRupee,
  ReceiptText,
  RotateCcw,
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  CreditCard,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'
import { apiRequest } from '../../services/api'

const todayString = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const monthStartString = () => `${todayString().slice(0, 7)}-01`

const money = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const number = (value) => Number(value || 0).toLocaleString('en-IN')

const dateLabel = (value) => {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
}

const paymentLabels = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Bank transfer',
  other: 'Other',
}

const downloadCsv = (report, startDate, endDate) => {
  const rows = [
    ['ThreadPOS Reports & Analytics'],
    ['Period', startDate, 'to', endDate],
    [],
    ['Sales Summary', 'Value'],
    ['Total sales', report.summary.totalSales],
    ['Net sales after recorded refunds', report.summary.netSales],
    ['Transactions', report.summary.transactions],
    ['Average bill value', report.summary.averageBillValue],
    ['Subtotal', report.summary.subtotal],
    ['Discounts', report.summary.discounts],
    ['Tax collected on sales', report.summary.taxes],
    ['Recorded refunds', report.summary.totalRefunds],
    ['Returns count', report.summary.returnCount],
    ['Cost of goods sold', report.summary.costOfGoods],
    [
      'Estimated gross profit before refunds',
      report.summary.estimatedGrossProfitBeforeRefunds,
    ],
    [],
    ['Daily Sales'],
    ['Date', 'Sales', 'Transactions'],
    ...report.dailySales.map((item) => [
      item.date,
      item.sales,
      item.transactions,
    ]),
    [],
    ['Payment Breakdown'],
    ['Method', 'Amount', 'Transactions'],
    ...report.paymentBreakdown.map((item) => [
      paymentLabels[item.method] || item.method,
      item.amount,
      item.count,
    ]),
    [],
    ['Best-selling Products'],
    ['Product', 'SKU', 'Quantity sold', 'Revenue', 'Estimated gross profit before discount'],
    ...report.topProducts.map((item) => [
      item.name,
      item.sku,
      item.quantitySold,
      item.revenue,
      item.estimatedGrossProfitBeforeDiscount,
    ]),
    [],
    ['Inventory'],
    ['Total products', report.inventory.totalProducts],
    ['Active products', report.inventory.activeProducts],
    ['Units in stock', report.inventory.stockUnits],
    ['Inventory cost value', report.inventory.inventoryCostValue],
    ['Inventory retail value', report.inventory.inventoryRetailValue],
    [],
    ['Received Purchases'],
    ['Purchase value', report.purchases.receivedPurchaseValue],
    ['Purchase count', report.purchases.receivedPurchaseCount],
  ]

  const csvCell = (value) => {
    const text = String(value ?? '')
    return `"${text.replace(/"/g, '""')}"`
  }

  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF', csv], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `threadpos-report-${startDate}-to-${endDate}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function MetricCard({ title, value, subtitle, icon: Icon, color = 'green' }) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
    rose: 'bg-rose-50 text-rose-700',
  }

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{subtitle}</p>
        </div>
        <div className={`shrink-0 rounded-xl p-3 ${styles[color] || styles.green}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  )
}

function Panel({ title, subtitle, icon: Icon, children, action }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
              <Icon size={19} />
            </div>
          )}
          <div>
            <h2 className="font-bold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  )
}

function EmptyChart({ message = 'No data for this period.' }) {
  return (
    <div className="flex h-full min-h-52 flex-col items-center justify-center text-center">
      <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
        <BarChart3 size={27} />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">Nothing to chart yet</p>
      <p className="mt-1 text-xs text-slate-500">{message}</p>
    </div>
  )
}

function Reports() {
  const [startDate, setStartDate] = useState(monthStartString)
  const [endDate, setEndDate] = useState(todayString)
  const [appliedRange, setAppliedRange] = useState({
    startDate: monthStartString(),
    endDate: todayString(),
  })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadReport = useCallback(async (range, isRefresh = false) => {
    setError('')
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const query = new URLSearchParams({
        startDate: range.startDate,
        endDate: range.endDate,
      })
      const result = await apiRequest(`/api/reports/overview?${query.toString()}`)
      setReport(result)
      setAppliedRange(range)
    } catch (err) {
      setError(err.message || 'Unable to load reports.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadReport(appliedRange)
  }, []) // Initial report only; date filters are applied manually.

  useEffect(() => {
    if (!notice) return undefined
    const timeout = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(timeout)
  }, [notice])

  const applyPreset = (preset) => {
    const today = todayString()
    const date = new Date()
    let start = today
    let end = today

    if (preset === 'month') {
      start = `${today.slice(0, 7)}-01`
    } else if (preset === 'last30') {
      date.setDate(date.getDate() - 29)
      start = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    } else if (preset === 'year') {
      start = `${date.getFullYear()}-01-01`
    }

    setStartDate(start)
    setEndDate(end)
    loadReport({ startDate: start, endDate: end })
  }

  const handleApply = (event) => {
    event.preventDefault()

    if (!startDate || !endDate || startDate > endDate) {
      setError('Choose a valid date range. The start date must not be after the end date.')
      return
    }

    loadReport({ startDate, endDate })
  }

  const chartData = useMemo(
    () =>
      (report?.dailySales || []).map((item) => ({
        ...item,
        label: dateLabel(item.date),
      })),
    [report]
  )

  const handleExport = () => {
    if (!report) return
    downloadCsv(report, appliedRange.startDate, appliedRange.endDate)
    setNotice('CSV report exported.')
  }

  return (
    <div className="min-w-0 space-y-6 bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <BarChart3 size={14} />
            BUSINESS INTELLIGENCE
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Reports &amp; Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Understand sales, refunds, product performance and inventory using your recorded business data.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset('today')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => applyPreset('month')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            This month
          </button>
          <button
            type="button"
            onClick={() => applyPreset('last30')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Last 30 days
          </button>
          <button
            type="button"
            onClick={() => applyPreset('year')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            This year
          </button>
        </div>
      </div>

      <form
        onSubmit={handleApply}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto]">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Start date
            </span>
            <span className="relative block">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                required
                value={startDate}
                max={endDate || todayString()}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              End date
            </span>
            <span className="relative block">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                required
                value={endDate}
                min={startDate}
                max={todayString()}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              />
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || refreshing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
          >
            <CalendarDays size={17} />
            Apply dates
          </button>

          <button
            type="button"
            onClick={() => loadReport(appliedRange, true)}
            disabled={loading || refreshing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Reporting period: {appliedRange.startDate} to {appliedRange.endDate} (India calendar dates)
        </p>
      </form>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">{error}</div>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}

      {loading && !report ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white">
          <LoaderCircle size={32} className="animate-spin text-emerald-700" />
          <p className="text-sm text-slate-500">Generating reports…</p>
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total sales"
              value={money(report.summary.totalSales)}
              subtitle={`${number(report.summary.transactions)} paid transactions`}
              icon={IndianRupee}
              color="green"
            />
            <MetricCard
              title="Net sales"
              value={money(report.summary.netSales)}
              subtitle="Total sales minus recorded refunds"
              icon={TrendingUp}
              color="blue"
            />
            <MetricCard
              title="Recorded refunds"
              value={money(report.summary.totalRefunds)}
              subtitle={`${number(report.summary.returnCount)} completed returns`}
              icon={RotateCcw}
              color="rose"
            />
            <MetricCard
              title="Average bill"
              value={money(report.summary.averageBillValue)}
              subtitle="Average value per paid transaction"
              icon={ReceiptText}
              color="violet"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <Panel
                title="Sales trend"
                subtitle="Daily paid sales for the selected period"
                icon={TrendingUp}
                action={
                  <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                    {chartData.length} days with sales
                  </span>
                }
              >
                <div className="h-72 w-full">
                  {chartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 4, bottom: 4 }}>
                        <defs>
                          <linearGradient id="reportSalesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={20}
                        />
                        <YAxis
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={72}
                          tickFormatter={(value) =>
                            value >= 100000
                              ? `₹${(value / 100000).toFixed(1)}L`
                              : value >= 1000
                                ? `₹${(value / 1000).toFixed(1)}k`
                                : `₹${value}`
                          }
                        />
                        <Tooltip
                          formatter={(value) => [money(value), 'Sales']}
                          labelFormatter={(label) => `Date: ${label}`}
                          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="sales"
                          stroke="#059669"
                          strokeWidth={2.5}
                          fill="url(#reportSalesGradient)"
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="Paid sales will appear here when recorded in the selected period." />
                  )}
                </div>
              </Panel>
            </div>

            <Panel
              title="Payment methods"
              subtitle="Paid sales grouped by payment method"
              icon={CreditCard}
            >
              {report.paymentBreakdown.length ? (
                <div className="space-y-5">
                  {report.paymentBreakdown.map((item) => {
                    const percentage = report.summary.totalSales
                      ? Math.min(100, (item.amount / report.summary.totalSales) * 100)
                      : 0

                    return (
                      <div key={item.method}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-700">
                            {paymentLabels[item.method] || item.method}
                          </span>
                          <span className="text-right text-sm font-bold text-slate-900">
                            {money(item.amount)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500">
                          {percentage.toFixed(1)}% · {number(item.count)} bills
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyChart message="Payment breakdown will appear after sales are recorded." />
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel
              title="Best-selling products"
              subtitle="Ranked by quantity sold in the selected period"
              icon={ShoppingCart}
              action={
                <span className="text-xs text-slate-500">
                  Top {report.topProducts.length}
                </span>
              }
            >
              {report.topProducts.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[450px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                        <th className="pb-3 pr-4">Product</th>
                        <th className="pb-3 pr-4 text-right">Qty</th>
                        <th className="pb-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.topProducts.map((item, index) => (
                        <tr key={`${item.productId || item.sku}-${index}`}>
                          <td className="py-4 pr-4">
                            <p className="font-semibold text-slate-800">{item.name}</p>
                            <p className="mt-1 text-xs text-slate-400">{item.sku || 'No SKU'}</p>
                          </td>
                          <td className="py-4 pr-4 text-right font-semibold text-slate-700">
                            {number(item.quantitySold)}
                          </td>
                          <td className="py-4 text-right font-semibold text-slate-900">
                            {money(item.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyChart message="Product rankings will appear after sales are recorded." />
              )}
            </Panel>

            <Panel
              title="Inventory overview"
              subtitle="Current inventory, independent of the selected date range"
              icon={Package}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Total products</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {number(report.inventory.totalProducts)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Active products</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {number(report.inventory.activeProducts)}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-medium text-emerald-800">Inventory cost value</p>
                  <p className="mt-2 break-words text-lg font-bold text-emerald-900">
                    {money(report.inventory.inventoryCostValue)}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs font-medium text-blue-800">Retail value at list price</p>
                  <p className="mt-2 break-words text-lg font-bold text-blue-900">
                    {money(report.inventory.inventoryRetailValue)}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Units currently in stock</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {number(report.inventory.stockUnits)}
                </p>
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel
              title="Financial summary"
              subtitle="Selected period · values in INR"
              icon={IndianRupee}
            >
              <div className="space-y-4">
                <FinancialRow label="Sales subtotal" value={money(report.summary.subtotal)} />
                <FinancialRow label="Discounts" value={`− ${money(report.summary.discounts)}`} />
                <FinancialRow label="Tax recorded on sales" value={money(report.summary.taxes)} />
                <FinancialRow label="Total paid sales" value={money(report.summary.totalSales)} strong />
                <FinancialRow label="Recorded refunds" value={`− ${money(report.summary.totalRefunds)}`} />
                <div className="border-t border-slate-200 pt-4">
                  <FinancialRow label="Net sales after refunds" value={money(report.summary.netSales)} strong />
                </div>
                <FinancialRow label="Recorded cost of goods sold" value={money(report.summary.costOfGoods)} />
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Estimated gross profit before refunds
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-950">
                    {money(report.summary.estimatedGrossProfitBeforeRefunds)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-amber-800">
                    Calculated from subtotal minus discounts and recorded product costs. This is an estimate before returns, excludes operating expenses, and is not final accounting profit.
                  </p>
                </div>
              </div>
            </Panel>

            <Panel
              title="Received purchases"
              subtitle="Purchases marked as received during the selected period"
              icon={ShoppingCart}
            >
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Received purchase value
                </p>
                <p className="mt-3 break-words text-3xl font-bold text-slate-900">
                  {money(report.purchases.receivedPurchaseValue)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {number(report.purchases.receivedPurchaseCount)} received purchases
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <p className="text-sm leading-6 text-slate-600">
                  Purchase value is shown separately from sales. It is not subtracted from sales to calculate profit because purchase receipts and cost of goods sold represent different accounting measures.
                </p>
              </div>
            </Panel>
          </div>

          <Panel
            title="Low-stock alerts"
            subtitle="Current active products at or below their configured stock threshold"
            icon={AlertTriangle}
            action={
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                {report.lowStockProducts.length} shown
              </span>
            }
          >
            {report.lowStockProducts.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[450px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-3 pr-4">Product</th>
                      <th className="pb-3 pr-4 text-right">Stock</th>
                      <th className="pb-3 pr-4 text-right">Threshold</th>
                      <th className="pb-3 text-right">SKU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.lowStockProducts.map((product) => (
                      <tr key={product._id}>
                        <td className="py-4 pr-4 font-semibold text-slate-800">
                          {product.name}
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 font-bold text-amber-800">
                            {number(product.stock)}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-right text-slate-600">
                          {number(product.lowStockThreshold)}
                        </td>
                        <td className="py-4 text-right text-slate-500">
                          {product.sku}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <Package size={30} className="text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  No low-stock products found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Active products at or below their stock threshold will appear here.
                </p>
              </div>
            )}
          </Panel>

          <Panel
            title="Recent sales"
            subtitle="Latest paid sales within the selected period"
            icon={ReceiptText}
            action={
              <span className="text-xs text-slate-500">
                {report.recentSales.length} shown
              </span>
            }
          >
            {report.recentSales.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-3 pr-4">Invoice</th>
                      <th className="pb-3 pr-4">Customer</th>
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Method</th>
                      <th className="pb-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.recentSales.map((sale) => (
                      <tr key={sale._id}>
                        <td className="py-4 pr-4 font-semibold text-emerald-800">
                          {sale.invoiceNumber}
                        </td>
                        <td className="py-4 pr-4 text-slate-600">
                          {sale.customerName || 'Walk-in Customer'}
                        </td>
                        <td className="py-4 pr-4 whitespace-nowrap text-slate-500">
                          {formatDateTime(sale.createdAt)}
                        </td>
                        <td className="py-4 pr-4 text-slate-600">
                          {paymentLabels[sale.paymentMethod] || sale.paymentMethod}
                        </td>
                        <td className="py-4 text-right font-bold text-slate-900">
                          {money(sale.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyChart message="Paid invoices will appear here for the selected period." />
            )}
          </Panel>

          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 className="font-bold text-slate-900">Export report</h2>
              <p className="mt-1 text-sm text-slate-500">
                Download the selected period's summary and breakdowns as a CSV file.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              <Download size={17} />
              Export CSV
            </button>
          </div>
        </>
      ) : !loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <AlertCircle className="mx-auto text-slate-400" size={30} />
          <p className="mt-3 font-semibold text-slate-800">Report unavailable</p>
          <p className="mt-1 text-sm text-slate-500">
            Check the API error above, then refresh the report.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function FinancialRow({ label, value, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className={`text-sm ${strong ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
        {label}
      </span>
      <span className={`text-right text-sm ${strong ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
        {value}
      </span>
    </div>
  )
}

export default Reports
