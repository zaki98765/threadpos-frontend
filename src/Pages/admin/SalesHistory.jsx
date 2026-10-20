
import { useEffect, useState } from 'react'
import {
  Search,
  RefreshCw,
  ReceiptText,
  IndianRupee,
  ShoppingBag,
  Eye,
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CreditCard,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react'

import { getSales, getSaleById } from '../../services/saleService'

const money = (value = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const formatDate = (value) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const today = () => new Date().toISOString().slice(0, 10)

function SummaryCard({ title, value, icon: Icon, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </h3>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>
        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  )
}

function SalesHistory() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [totalInvoices, setTotalInvoices] = useState(0)
  const [totalSales, setTotalSales] = useState(0)

  const [selectedSale, setSelectedSale] = useState(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)

  async function loadSales(nextPage = page) {
    setLoading(true)
    setError('')

    try {
      const params = {
        page: String(nextPage),
        limit: '10',
      }

      if (search.trim()) params.search = search.trim()
      if (paymentMethod) params.paymentMethod = paymentMethod
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const response = await getSales(params)
      const payload = response.data || response

      setSales(Array.isArray(payload.sales) ? payload.sales : [])
      setPage(Number(payload.pagination?.page || nextPage))
      setPages(Math.max(1, Number(payload.pagination?.pages || 1)))
      setTotalInvoices(Number(payload.summary?.totalInvoices ?? payload.pagination?.total ?? 0))
      setTotalSales(Number(payload.summary?.totalSales || 0))
    } catch (err) {
      setError(err.message || 'Unable to load sales history.')
      setSales([])
      setTotalInvoices(0)
      setTotalSales(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSales(1)
    // Load initial history once.
    // Filters are applied when the user submits them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function viewInvoice(sale) {
    setLoadingInvoice(true)
    setError('')

    try {
      const response = await getSaleById(sale._id)
      const payload = response.data || response
      setSelectedSale(payload.sale || payload)
    } catch (err) {
      setError(err.message || 'Unable to load invoice details.')
    } finally {
      setLoadingInvoice(false)
    }
  }

  function applyFilters(event) {
    event.preventDefault()

    if (startDate && endDate && startDate > endDate) {
      setError('Start date cannot be later than end date.')
      return
    }

    setPage(1)
    loadSales(1)
  }

  function clearFilters() {
    setSearch('')
    setPaymentMethod('')
    setStartDate('')
    setEndDate('')
    setPage(1)

    setTimeout(() => {
      // Explicitly request an unfiltered page.
      getSales({ page: '1', limit: '10' })
        .then((response) => {
          const payload = response.data || response
          setSales(Array.isArray(payload.sales) ? payload.sales : [])
          setPage(Number(payload.pagination?.page || 1))
          setPages(Math.max(1, Number(payload.pagination?.pages || 1)))
          setTotalInvoices(Number(payload.summary?.totalInvoices ?? payload.pagination?.total ?? 0))
          setTotalSales(Number(payload.summary?.totalSales || 0))
          setError('')
        })
        .catch((err) => setError(err.message || 'Unable to load sales history.'))
    }, 0)
  }

  function printInvoice() {
    if (!selectedSale) return

    window.print()
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .sales-print-area,
          .sales-print-area * {
            visibility: visible !important;
          }
          .sales-print-area {
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
            Sales / History
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Sales History
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Search completed transactions and manage invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadSales(page)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
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

      <div className="no-print grid gap-4 sm:grid-cols-2">
        <SummaryCard
          title="Sales in Results"
          value={money(totalSales)}
          icon={IndianRupee}
          description="Total value for the current filters"
        />
        <SummaryCard
          title="Invoice Count"
          value={totalInvoices.toLocaleString('en-IN')}
          icon={ShoppingBag}
          description="Matching completed sales"
        />
      </div>

      <form
        onSubmit={applyFilters}
        className="no-print space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Search invoices
            </label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Invoice number, customer name, phone..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Payment method
            </label>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All methods</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              max={endDate || today()}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              max={today()}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear filters
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Search size={16} />
            Apply filters
          </button>
        </div>
      </form>

      <section className="no-print overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Completed invoices</h2>
            <p className="mt-1 text-sm text-slate-500">
              Select an invoice to view and print its details.
            </p>
          </div>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Page {page} of {pages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Invoice</th>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Payment</th>
                <th className="px-5 py-4 text-right font-semibold">Amount</th>
                <th className="px-5 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                    <LoaderCircle size={22} className="mx-auto animate-spin" />
                    <p className="mt-3">Loading sales...</p>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <ReceiptText size={30} className="mx-auto text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-800">
                      No invoices found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your search or date filters.
                    </p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {sale.invoiceNumber}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {(sale.items || []).reduce(
                          (sum, item) => sum + Number(item.quantity || 0),
                          0
                        )}{' '}
                        item units
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {sale.customerName || 'Walk-in Customer'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {sale.customerPhone || 'No phone'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                        {String(sale.paymentMethod || '').replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-900">
                      {money(sale.totalAmount)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => viewInvoice(sale)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <Eye size={15} />
                        View invoice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-500">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => loadSales(page - 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              disabled={loading || page >= pages}
              onClick={() => loadSales(page + 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="no-print flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Invoice details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedSale.invoiceNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close invoice"
              >
                <X size={20} />
              </button>
            </div>

            <div className="sales-print-area overflow-y-auto p-5 sm:p-8">
              <div className="border-b-2 border-slate-900 pb-5 text-center">
                <h1 className="text-2xl font-extrabold tracking-wide text-slate-900">
                  THREADPOS
                </h1>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                  Sales invoice
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Invoice: {selectedSale.invoiceNumber}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Date: {formatDate(selectedSale.createdAt)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 py-5 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Customer</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedSale.customerName || 'Walk-in Customer'}
                  </p>
                  {selectedSale.customerPhone && (
                    <p className="mt-1 text-slate-600">
                      {selectedSale.customerPhone}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Payment method</p>
                  <p className="mt-1 font-semibold capitalize text-slate-900">
                    {String(selectedSale.paymentMethod || '').replaceAll('_', ' ')}
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
                    {(selectedSale.items || []).map((item, index) => (
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
                  <span>{money(selectedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Discount</span>
                  <span>− {money(selectedSale.discount)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">
                    Tax ({Number(selectedSale.taxRate || 0)}%)
                  </span>
                  <span>{money(selectedSale.taxAmount)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-300 pt-3 text-base font-extrabold">
                  <span>Total</span>
                  <span>{money(selectedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Received</span>
                  <span>{money(selectedSale.amountReceived)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Change</span>
                  <span>{money(selectedSale.changeDue)}</span>
                </div>
              </div>

              {selectedSale.notes && (
                <p className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
                  Notes: {selectedSale.notes}
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

            <div className="no-print flex flex-col-reverse gap-3 border-t border-slate-100 p-4 sm:flex-row sm:justify-end sm:p-5">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
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
                Print / Reprint
              </button>
            </div>
          </div>
        </div>
      )}

      {loadingInvoice && (
        <div className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/30">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-xl">
            <LoaderCircle size={20} className="animate-spin" />
            Loading invoice...
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesHistory
