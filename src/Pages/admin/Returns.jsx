
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  RefreshCw,
  RotateCcw,
  PackageCheck,
  Wallet,
  ReceiptText,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  X,
  ChevronLeft,
  ChevronRight,
  History,
} from 'lucide-react'

import { getSaleByInvoice } from '../../services/saleService'
import {
  getReturns,
  createReturn,
} from '../../services/returnService'

const money = (value = 0) =>
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
    : date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
}

function Returns() {
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [sale, setSale] = useState(null)
  const [returnedQuantities, setReturnedQuantities] = useState({})
  const [returnItems, setReturnItems] = useState({})
  const [refundMethod, setRefundMethod] = useState('cash')
  const [notes, setNotes] = useState('')

  const [history, setHistory] = useState([])
  const [historySearch, setHistorySearch] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPages, setHistoryPages] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [totalRefunds, setTotalRefunds] = useState(0)

  const [loadingSale, setLoadingSale] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadHistory(1)
  }, [])

  async function loadHistory(page = historyPage, search = historySearch) {
    setLoadingHistory(true)

    try {
      const response = await getReturns({
        page: String(page),
        limit: '10',
        ...(search.trim() ? { search: search.trim() } : {}),
      })

      const payload = response.data || response

      setHistory(Array.isArray(payload.returns) ? payload.returns : [])
      setHistoryPage(Number(payload.pagination?.page || page))
      setHistoryPages(Math.max(1, Number(payload.pagination?.pages || 1)))
      setHistoryTotal(Number(payload.pagination?.total || 0))
      setTotalRefunds(Number(payload.summary?.totalRefunds || 0))
    } catch (err) {
      setError(err.message || 'Unable to load return history.')
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  async function lookupInvoice(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSale(null)
    setReturnedQuantities({})
    setReturnItems({})

    const number = invoiceNumber.trim()

    if (!number) {
      setError('Enter an invoice number.')
      return
    }

    setLoadingSale(true)

    try {
      const response = await getSaleByInvoice(number)
      const payload = response.data || response
      const foundSale = payload.sale || payload

      if (!foundSale?._id || !Array.isArray(foundSale.items)) {
        throw new Error('The invoice response is missing sale details.')
      }

      setSale(foundSale)

      // Retrieve previous returns for this invoice to calculate remaining quantities.
      const returnResponse = await getReturns({
        search: foundSale.invoiceNumber,
        page: '1',
        limit: '100',
      })

      const returnPayload = returnResponse.data || returnResponse
      const previousReturns = Array.isArray(returnPayload.returns)
        ? returnPayload.returns
        : []

      const returned = {}

      for (const record of previousReturns) {
        if (record.invoiceNumber !== foundSale.invoiceNumber) continue

        for (const item of record.items || []) {
          const productId =
            typeof item.product === 'object'
              ? item.product?._id
              : item.product

          if (!productId) continue

          returned[String(productId)] =
            (returned[String(productId)] || 0) + Number(item.quantity || 0)
        }
      }

      setReturnedQuantities(returned)

      const initialItems = {}

      for (const item of foundSale.items) {
        const productId =
          typeof item.product === 'object'
            ? item.product?._id
            : item.product

        if (!productId) continue

        initialItems[String(productId)] = {
          quantity: 0,
          restock: true,
          reason: '',
        }
      }

      setReturnItems(initialItems)
    } catch (err) {
      setError(err.message || 'Invoice not found.')
    } finally {
      setLoadingSale(false)
    }
  }

  function updateItem(productId, field, value) {
    setReturnItems((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        [field]: value,
      },
    }))
  }

  const selectedItems = useMemo(() => {
    if (!sale) return []

    return sale.items
      .map((item) => {
        const productId =
          typeof item.product === 'object'
            ? item.product?._id
            : item.product

        if (!productId) return null

        const selected = returnItems[String(productId)] || {}
        const soldQuantity = Number(item.quantity || 0)
        const alreadyReturned = Number(returnedQuantities[String(productId)] || 0)
        const remaining = Math.max(0, soldQuantity - alreadyReturned)
        const quantity = Number(selected.quantity || 0)

        return {
          productId: String(productId),
          productName: item.productName,
          sku: item.sku,
          unitPrice: Number(item.unitPrice || 0),
          soldQuantity,
          alreadyReturned,
          remaining,
          quantity,
          restock: selected.restock !== false,
          reason: selected.reason || '',
          refundAmount: Math.round(Number(item.unitPrice || 0) * quantity * 100) / 100,
        }
      })
      .filter(Boolean)
  }, [sale, returnItems, returnedQuantities])

  const chosenItems = selectedItems.filter((item) => item.quantity > 0)

  const refundTotal = chosenItems.reduce(
    (sum, item) => sum + item.refundAmount,
    0
  )

  async function submitReturn(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!sale) {
      setError('Look up an original invoice first.')
      return
    }

    if (chosenItems.length === 0) {
      setError('Select at least one item and quantity to return.')
      return
    }

    for (const item of chosenItems) {
      if (!Number.isInteger(item.quantity) || item.quantity > item.remaining) {
        setError(
          `Check the return quantity for ${item.productName}. Only ${item.remaining} unit(s) remain eligible.`
        )
        return
      }
    }

    setSubmitting(true)

    try {
      const response = await createReturn({
        saleId: sale._id,
        items: chosenItems.map((item) => ({
          product: item.productId,
          quantity: item.quantity,
          restock: item.restock,
          reason: item.reason,
        })),
        refundMethod,
        notes: notes.trim(),
      })

      const payload = response.data || response
      const record = payload.return

      setSuccess(
        `Return recorded successfully${record?.returnNumber ? `: ${record.returnNumber}` : ''}.`
      )
      setInvoiceNumber('')
      setSale(null)
      setReturnItems({})
      setReturnedQuantities({})
      setNotes('')

      await loadHistory(1, historySearch)
    } catch (err) {
      setError(err.message || 'Unable to process this return.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <RotateCcw size={16} />
            Sales / Returns
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Returns & Refunds
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Process returned items against original invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadHistory(historyPage)}
          disabled={loadingHistory}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw size={16} className={loadingHistory ? 'animate-spin' : ''} />
          Refresh history
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={19} />
          <span className="flex-1">{success}</span>
          <button type="button" onClick={() => setSuccess('')} aria-label="Dismiss success">
            <X size={17} />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Total refund value</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {money(totalRefunds)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Based on the current history filters
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
              <Wallet size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Return records</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {historyTotal.toLocaleString('en-IN')}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Completed returns matching the filters
              </p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <History size={22} />
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="font-bold text-slate-900">Find original invoice</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter the exact invoice number from Sales History.
          </p>
        </div>

        <form onSubmit={lookupInvoice} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
              placeholder="Example: INV-20261020-ABC12345"
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            type="submit"
            disabled={loadingSale}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loadingSale ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Search size={17} />
            )}
            Find invoice
          </button>
        </form>
      </section>

      {sale && (
        <form onSubmit={submitReturn} className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-bold text-slate-900">
                  <ReceiptText size={19} className="text-indigo-600" />
                  Invoice {sale.invoiceNumber}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {sale.customerName || 'Walk-in Customer'} · {formatDate(sale.createdAt)}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-500">Original total</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {money(sale.totalAmount)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Product</th>
                    <th className="px-4 py-4 text-right font-semibold">Sold</th>
                    <th className="px-4 py-4 text-right font-semibold">Returned</th>
                    <th className="px-4 py-4 text-right font-semibold">Available</th>
                    <th className="px-4 py-4 font-semibold">Return quantity</th>
                    <th className="px-5 py-4 text-right font-semibold">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedItems.map((item) => (
                    <tr key={item.productId} className="align-top hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {item.productName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          SKU: {item.sku}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Unit price: {money(item.unitPrice)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right">{item.soldQuantity}</td>
                      <td className="px-4 py-4 text-right">{item.alreadyReturned}</td>
                      <td className="px-4 py-4 text-right font-semibold">
                        {item.remaining}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-36 flex-col gap-2">
                          <input
                            type="number"
                            min="0"
                            max={item.remaining}
                            step="1"
                            value={returnItems[item.productId]?.quantity ?? 0}
                            disabled={item.remaining === 0}
                            onChange={(event) =>
                              updateItem(
                                item.productId,
                                'quantity',
                                event.target.value === ''
                                  ? ''
                                  : Number(event.target.value)
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100"
                          />
                          <label className="flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={item.restock}
                              onChange={(event) =>
                                updateItem(
                                  item.productId,
                                  'restock',
                                  event.target.checked
                                )
                              }
                            />
                            Restock item
                          </label>
                          <input
                            value={item.reason}
                            onChange={(event) =>
                              updateItem(item.productId, 'reason', event.target.value)
                            }
                            maxLength={300}
                            placeholder="Reason (optional)"
                            className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-indigo-500"
                          />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-emerald-700">
                        {money(item.refundAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 border-t border-slate-100 bg-slate-50/70 p-5 md:grid-cols-[1fr_260px]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Return notes
                </label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Optional notes about this return..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Refund method
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(event) => setRefundMethod(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">Refund total</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">
                    {money(refundTotal)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {chosenItems.length} product line(s) selected
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || chosenItems.length === 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <PackageCheck size={18} />
                  )}
                  {submitting ? 'Processing...' : 'Confirm return'}
                </button>
              </div>
            </div>
          </section>
        </form>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <History size={19} className="text-indigo-600" />
              Return history
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review completed returns and refund records.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              loadHistory(1, historySearch)
            }}
            className="flex gap-2"
          >
            <input
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Return or invoice number"
              className="min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 sm:w-64"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Search
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Return number</th>
                <th className="px-5 py-4 font-semibold">Original invoice</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Refund method</th>
                <th className="px-5 py-4 text-right font-semibold">Refund amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingHistory ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-slate-500">
                    <LoaderCircle size={22} className="mx-auto animate-spin" />
                    <p className="mt-3">Loading returns...</p>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-slate-500">
                    No return records found.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {record.returnNumber}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {record.invoiceNumber}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {formatDate(record.createdAt)}
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-600">
                      {String(record.refundMethod || '').replaceAll('_', ' ')}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-emerald-700">
                      {money(record.totalRefund)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-500">
            Page {historyPage} of {historyPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loadingHistory || historyPage <= 1}
              onClick={() => loadHistory(historyPage - 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              disabled={loadingHistory || historyPage >= historyPages}
              onClick={() => loadHistory(historyPage + 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Returns
