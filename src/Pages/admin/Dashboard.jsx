
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  IndianRupee,
  ReceiptText,
  Package,
  TriangleAlert,
  ShoppingBag,
  Clock3,
  ArrowRight,
  CircleDollarSign,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../services/api'

const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const getArray = (data, keys) => {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}

const getSaleAmount = (sale) =>
  Number(sale.totalAmount ?? sale.total ?? sale.grandTotal ?? 0)

const getSaleDate = (sale) =>
  sale.createdAt || sale.saleDate || sale.date

function StatCard({ title, value, description, icon: Icon, iconStyle }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-3 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
            {value}
          </h3>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}>
          <Icon size={22} />
        </div>
      </div>
      <p className="mt-5 text-xs text-gray-400">{description}</p>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <Icon size={23} />
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-gray-400">
        {description}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [salesResult, productsResult] = await Promise.all([
        apiRequest('/api/sales?page=1&limit=100'),
        apiRequest('/api/products?page=1&limit=100'),
      ])

      setSales(
        getArray(salesResult, ['sales', 'data', 'transactions'])
      )
      setProducts(
        getArray(productsResult, ['products', 'data', 'items'])
      )
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive !== false),
    [products]
  )

  const lowStockProducts = useMemo(
    () =>
      activeProducts
        .filter((product) => {
          const stock = Number(product.stock || 0)
          const threshold = Number(product.lowStockThreshold ?? 5)
          return stock <= threshold
        })
        .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
        .slice(0, 6),
    [activeProducts]
  )

  const todaySales = useMemo(() => {
    const now = new Date()
    return sales.filter((sale) => {
      const date = new Date(getSaleDate(sale))
      return (
        !Number.isNaN(date.getTime()) &&
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      )
    })
  }, [sales])

  const todayRevenue = todaySales.reduce(
    (sum, sale) => sum + getSaleAmount(sale),
    0
  )

  const chartData = useMemo(() => {
    const days = []

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - offset)

      days.push({
        key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
        date: date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        }),
        sales: 0,
      })
    }

    const lookup = new Map(days.map((day) => [day.key, day]))

    sales.forEach((sale) => {
      const date = new Date(getSaleDate(sale))
      if (Number.isNaN(date.getTime())) return

      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      const day = lookup.get(key)

      if (day) day.sales += getSaleAmount(sale)
    })

    return days
  }, [sales])

  const recentTransactions = useMemo(
    () =>
      [...sales]
        .sort(
          (a, b) =>
            new Date(getSaleDate(b)).getTime() -
            new Date(getSaleDate(a)).getTime()
        )
        .slice(0, 6),
    [sales]
  )

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="min-w-0 space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-950 via-green-900 to-green-700 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-36 right-28 h-72 w-72 rounded-full border border-white/10" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-green-100">
              <span className="h-2 w-2 rounded-full bg-green-300" />
              Store overview
            </span>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome to ThreadPOS
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-green-100/80">
              Monitor your sales, inventory and daily business activity.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3">
            <Clock3 size={19} className="text-green-200" />
            <div>
              <p className="text-xs text-green-100/70">Today</p>
              <p className="mt-0.5 text-sm font-semibold">{formattedDate}</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} />
          <span className="min-w-0 flex-1">{error}</span>
          <button
            type="button"
            onClick={loadDashboard}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Business overview</h2>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? 'Updating your store metrics...' : 'Metrics from your store records.'}
          </p>
        </div>
        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={currency(todayRevenue)}
          description={`${todaySales.length} bills recorded today`}
          icon={IndianRupee}
          iconStyle="bg-green-50 text-green-700"
        />
        <StatCard
          title="Transactions"
          value={sales.length.toLocaleString('en-IN')}
          description="Sales returned by the API"
          icon={ReceiptText}
          iconStyle="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Active Products"
          value={activeProducts.length.toLocaleString('en-IN')}
          description="Active inventory products"
          icon={Package}
          iconStyle="bg-violet-50 text-violet-700"
        />
        <StatCard
          title="Low Stock"
          value={lowStockProducts.length.toLocaleString('en-IN')}
          description="Products at or below their stock threshold"
          icon={TriangleAlert}
          iconStyle="bg-amber-50 text-amber-700"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900">Sales overview</h2>
              <p className="mt-1 text-sm text-gray-500">
                Revenue across the last seven days.
              </p>
            </div>
            <span className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500">
              Last 7 days
            </span>
          </div>

          <div className="mt-6 h-[260px] w-full">
            {chartData.some((day) => day.sales > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="threadSalesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                    width={65}
                  />
                  <Tooltip
                    formatter={(value) => [currency(value), 'Sales']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    fill="url(#threadSalesGradient)"
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={CircleDollarSign}
                title={loading ? 'Loading sales...' : 'No sales in the last 7 days'}
                description="Completed sales will appear here when the sales API returns their records."
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900">Low-stock alerts</h2>
              <p className="mt-1 text-sm text-gray-500">Products that need attention.</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
              <TriangleAlert size={19} />
            </div>
          </div>

          {lowStockProducts.length > 0 ? (
            <div className="mt-5 space-y-4">
              {lowStockProducts.map((product) => (
                <div key={product._id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">{product.name}</p>
                    <p className="mt-1 text-xs text-gray-400">SKU: {product.sku || '—'}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
                    {Number(product.stock || 0)} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title={loading ? 'Loading inventory...' : 'No stock alerts'}
              description="Products at or below their stock threshold will appear here."
            />
          )}

          <Link
            to="/admin/products"
            className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-800"
          >
            View inventory <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-bold text-gray-900">Recent transactions</h2>
            <p className="mt-1 text-sm text-gray-500">Latest sales returned by the API.</p>
          </div>
          <Link
            to="/admin/transactions"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-green-800 hover:bg-green-50"
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={ShoppingBag}
                      title="No transactions yet"
                      description="Completed bills will appear here."
                    />
                  </td>
                </tr>
              )}

              {recentTransactions.map((sale, index) => (
                <tr key={sale._id || sale.invoiceNumber || index} className="hover:bg-gray-50/70">
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {sale.invoiceNumber || '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {sale.customerName || 'Walk-in Customer'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                    {getSaleDate(sale)
                      ? new Date(getSaleDate(sale)).toLocaleDateString('en-IN')
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-gray-800">
                    {currency(getSaleAmount(sale))}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                      {sale.paymentStatus || sale.status || 'Completed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
