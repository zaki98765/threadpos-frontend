
import { useEffect, useMemo, useState } from 'react'
import {
    Search,
    RefreshCw,
    Wallet,
    TrendingUp,
    TrendingDown,
    ReceiptText,
    CreditCard,
    Plus,
    X,
    LoaderCircle,
    AlertCircle,
    CalendarDays,
    FileText,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'

import { getSuppliers } from '../../services/supplierService'
import {
    getSupplierLedger,
    getSupplierPayments,
    recordSupplierPayment,
} from '../../services/supplierPaymentService'

const currency = (amount = 0) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(Number(amount) || 0)

const dateFormat = (date) => {
    if (!date) return '—'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return '—'
    return parsed.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

const initialForm = {
    purchase: '',
    amount: '',
    paymentMethod: 'cash',
    referenceNumber: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: '',
}

function SummaryCard({ title, value, icon: Icon, color, description }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
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

function SupplierLedger() {
    const [suppliers, setSuppliers] = useState([])
    const [supplierId, setSupplierId] = useState('')
    const [ledger, setLedger] = useState(null)
    const [payments, setPayments] = useState([])
    const [paymentPage, setPaymentPage] = useState(1)
    const [paymentPages, setPaymentPages] = useState(1)

    const [search, setSearch] = useState('')
    const [loadingSuppliers, setLoadingSuppliers] = useState(true)
    const [loadingLedger, setLoadingLedger] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [formError, setFormError] = useState('')
    const [form, setForm] = useState(initialForm)

    const [paymentSummary, setPaymentSummary] = useState({
        totalPaid: 0,
        total: 0,
    })

    useEffect(() => {
        loadSuppliers()
    }, [])

    useEffect(() => {
        if (supplierId) {
            loadLedger(supplierId)
            loadPayments(supplierId, 1)
        } else {
            setLedger(null)
            setPayments([])
            setPaymentPage(1)
            setPaymentPages(1)
        }
    }, [supplierId])

    async function loadSuppliers() {
        setLoadingSuppliers(true)
        setError('')

        try {
            const response = await getSuppliers({ limit: 1000 })
            const list = Array.isArray(response.suppliers)
                ? response.suppliers
                : Array.isArray(response.data?.suppliers)
                    ? response.data.suppliers
                    : Array.isArray(response.data)
                        ? response.data
                        : []

            setSuppliers(list)
        } catch (err) {
            setError(err.message || 'Unable to load suppliers.')
        } finally {
            setLoadingSuppliers(false)
        }
    }


    async function loadLedger(id = supplierId) {
        if (!id) return

        setLoadingLedger(true)
        setError('')

        try {
            const response = await getSupplierLedger(id)
            const data = response.data || response

            const entries = data.ledger || data.entries || data.transactions || []

            const purchases = entries
                .filter((entry) => entry.type === 'purchase')
                .map((entry) => ({
                    ...entry,
                    _id: entry.purchaseId || entry._id,
                    purchaseNumber: entry.purchaseNumber || entry.reference || '',
                    totalAmount: Number(entry.totalAmount ?? entry.debit ?? 0),
                }))

            setLedger({
                ...data,
                entries,
                purchases,
                totalPurchases:
                    data.summary?.totalPurchases ?? data.totalPurchases ?? 0,
                totalPaid: data.summary?.totalPaid ?? data.totalPaid ?? 0,
                outstandingBalance:
                    data.summary?.outstandingBalance ?? data.outstandingBalance ?? 0,
            })
        } catch (err) {
            setLedger(null)
            setError(err.message || 'Unable to load supplier ledger.')
        } finally {
            setLoadingLedger(false)
        }
    }


    async function loadPayments(id = supplierId, page = 1) {
        if (!id) return

        try {
            const response = await getSupplierPayments(id, page, 10)
            const payload = response.data || response

            setPayments(
                Array.isArray(payload.payments) ? payload.payments : []
            )

            setPaymentSummary({
                totalPaid: Number(payload.totalPaid || 0),
                total: Number(payload.pagination?.total || payload.total || 0),
            })

            setPaymentPage(Number(payload.pagination?.page || page))
            setPaymentPages(Number(payload.pagination?.pages || 1))
        } catch (err) {
            setPayments([])
            setPaymentSummary({ totalPaid: 0, total: 0 })
            setError(err.message || 'Unable to load payment history.')
        }
    }

    const selectedSupplier = suppliers.find(
        (supplier) => supplier._id === supplierId
    )

    const filteredSuppliers = useMemo(() => {
        const query = search.trim().toLowerCase()

        if (!query) return suppliers

        return suppliers.filter((supplier) =>
            [
                supplier.name,
                supplier.companyName,
                supplier.phone,
                supplier.email,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        )
    }, [suppliers, search])


    const purchases = useMemo(() => {
        const list =
            ledger?.purchases ||
            ledger?.transactions?.filter((item) => item.type === 'purchase') ||
            ledger?.ledger?.filter((item) => item.type === 'purchase') ||
            []

        return list.map((purchase) => ({
            ...purchase,
            _id: purchase._id || purchase.purchaseId,
            purchaseNumber:
                purchase.purchaseNumber || purchase.reference || '',
            totalAmount: Number(
                purchase.totalAmount ?? purchase.debit ?? 0
            ),
        }))
    }, [ledger])


    const ledgerEntries = useMemo(() => {
        const explicitEntries = ledger?.entries || ledger?.transactions

        if (Array.isArray(explicitEntries)) {
            return [...explicitEntries].sort(
                (a, b) =>
                    new Date(a.date || a.createdAt || 0) -
                    new Date(b.date || b.createdAt || 0)
            )
        }

        const entries = []

        for (const purchase of purchases) {
            entries.push({
                _id: `purchase-${purchase._id}`,
                date: purchase.createdAt || purchase.receivedAt,
                reference: purchase.purchaseNumber || purchase._id,
                description: `Purchase ${purchase.purchaseNumber || ''}`.trim(),
                type: 'purchase',
                debit: Number(purchase.totalAmount || 0),
                credit: 0,
            })
        }

        for (const payment of ledger?.payments || []) {
            entries.push({
                _id: payment._id,
                date: payment.paymentDate || payment.createdAt,
                reference: payment.referenceNumber || payment._id,
                description: 'Supplier payment',
                type: 'payment',
                debit: 0,
                credit: Number(payment.amount || 0),
            })
        }

        return entries.sort(
            (a, b) =>
                new Date(a.date || 0) - new Date(b.date || 0)
        )
    }, [ledger, purchases])

    const totals = useMemo(() => {
        const totalPurchases = Number(
            ledger?.totalPurchases ??
            ledger?.summary?.totalPurchases ??
            purchases.reduce(
                (sum, purchase) => sum + Number(purchase.totalAmount || 0),
                0
            )
        )

        const totalPaid = Number(
            ledger?.totalPaid ??
            ledger?.summary?.totalPaid ??
            0
        )

        const outstanding = Number(
            ledger?.outstandingBalance ??
            ledger?.summary?.outstandingBalance ??
            Math.max(0, totalPurchases - totalPaid)
        )

        return { totalPurchases, totalPaid, outstanding }
    }, [ledger, purchases])

    function openPaymentModal() {
        setForm(initialForm)
        setFormError('')
        setShowPaymentModal(true)
    }

    function updateForm(event) {
        const { name, value } = event.target

        setForm((current) => ({
            ...current,
            [name]: value,
        }))
    }

    async function handlePaymentSubmit(event) {
        event.preventDefault()
        setFormError('')
        setSuccess('')

        if (!supplierId) {
            setFormError('Select a supplier first.')
            return
        }

        if (!form.purchase) {
            setFormError('Select a purchase to pay against.')
            return
        }

        const amount = Number(form.amount)

        if (!Number.isFinite(amount) || amount <= 0) {
            setFormError('Enter a payment amount greater than zero.')
            return
        }

        setSubmitting(true)

        try {
            await recordSupplierPayment({
                supplier: supplierId,
                purchase: form.purchase,
                amount,
                paymentMethod: form.paymentMethod,
                referenceNumber: form.referenceNumber.trim(),
                paymentDate: form.paymentDate,
                notes: form.notes.trim(),
            })

            setShowPaymentModal(false)
            setSuccess('Supplier payment recorded successfully.')

            await Promise.all([
                loadLedger(supplierId),
                loadPayments(supplierId, 1),
            ])
        } catch (err) {
            setFormError(err.message || 'Unable to record payment.')
        } finally {
            setSubmitting(false)
        }
    }

    const payablePurchases = purchases.filter((purchase) => {
        const paymentStatus = String(purchase.paymentStatus || '').toLowerCase()
        const purchaseStatus = String(purchase.purchaseStatus || '').toLowerCase()

        return (
            purchaseStatus === 'received' &&
            paymentStatus !== 'paid' &&
            Number(purchase.totalAmount || 0) > 0
        )
    })

    const selectedPurchase = payablePurchases.find(
        (purchase) => purchase._id === form.purchase
    )

    const purchaseTotal = Number(selectedPurchase?.totalAmount || 0)

    return (
        <div className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <ReceiptText size={16} />
                        <span>Purchases / Supplier Ledger</span>
                    </div>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Supplier Ledger
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Track supplier purchases, payments, and outstanding balances.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            if (supplierId) {
                                loadLedger()
                                loadPayments(supplierId, paymentPage)
                            } else {
                                loadSuppliers()
                            }
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={openPaymentModal}
                        disabled={!supplierId || payablePurchases.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Plus size={17} />
                        Record Payment
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

            {success && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <span>{success}</span>
                    <button
                        type="button"
                        onClick={() => setSuccess('')}
                        aria-label="Dismiss message"
                    >
                        <X size={17} />
                    </button>
                </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Search suppliers
                        </label>
                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Name, company, phone..."
                                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Select supplier
                        </label>
                        <select
                            value={supplierId}
                            onChange={(event) => {
                                setSupplierId(event.target.value)
                                setSuccess('')
                                setError('')
                            }}
                            disabled={loadingSuppliers}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >
                            <option value="">
                                {loadingSuppliers ? 'Loading suppliers...' : 'Choose a supplier'}
                            </option>
                            {filteredSuppliers.map((supplier) => (
                                <option key={supplier._id} value={supplier._id}>
                                    {supplier.name}
                                    {supplier.companyName ? ` — ${supplier.companyName}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedSupplier && (
                    <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <p className="text-slate-500">Supplier</p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {selectedSupplier.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500">Company</p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {selectedSupplier.companyName || '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500">Phone</p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {selectedSupplier.phone || '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500">Email</p>
                            <p className="mt-1 break-all font-semibold text-slate-900">
                                {selectedSupplier.email || '—'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {!supplierId ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <Wallet size={27} />
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-slate-900">
                        Select a supplier
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                        Choose a supplier above to view their ledger, purchase history,
                        payments, and outstanding balance.
                    </p>
                </div>
            ) : loadingLedger && !ledger ? (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-slate-500">
                    <LoaderCircle size={22} className="animate-spin" />
                    Loading supplier ledger...
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <SummaryCard
                            title="Total Purchases"
                            value={totals.totalPurchases}
                            icon={ReceiptText}
                            color="bg-blue-50 text-blue-600"
                            description="Received purchase value"
                        />
                        <SummaryCard
                            title="Total Payments"
                            value={totals.totalPaid}
                            icon={TrendingDown}
                            color="bg-emerald-50 text-emerald-600"
                            description="Payments applied to purchases"
                        />
                        <SummaryCard
                            title="Outstanding Balance"
                            value={totals.outstanding}
                            icon={TrendingUp}
                            color="bg-amber-50 text-amber-600"
                            description="Amount still payable"
                        />
                    </div>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900">Ledger Transactions</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Purchase debits and payment credits.
                                </p>
                            </div>
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                {ledgerEntries.length} transactions
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">Date</th>
                                        <th className="px-5 py-4 font-semibold">Reference</th>
                                        <th className="px-5 py-4 font-semibold">Description</th>
                                        <th className="px-5 py-4 text-right font-semibold">Debit</th>
                                        <th className="px-5 py-4 text-right font-semibold">Credit</th>
                                        <th className="px-5 py-4 text-right font-semibold">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {ledgerEntries.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                                                No ledger transactions found for this supplier.
                                            </td>
                                        </tr>
                                    ) : (
                                        ledgerEntries.map((entry, index) => (
                                            <tr key={entry._id || index} className="hover:bg-slate-50">
                                                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                    {dateFormat(entry.date || entry.createdAt)}
                                                </td>
                                                <td className="px-5 py-4 font-medium text-slate-800">
                                                    {entry.reference || entry.purchaseNumber || '—'}
                                                </td>
                                                <td className="px-5 py-4 text-slate-600">
                                                    {entry.description ||
                                                        entry.type ||
                                                        entry.notes ||
                                                        'Transaction'}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-slate-800">
                                                    {Number(entry.debit || 0) > 0
                                                        ? currency(entry.debit)
                                                        : '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-emerald-700">
                                                    {Number(entry.credit || 0) > 0
                                                        ? currency(entry.credit)
                                                        : '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-900">
                                                    {entry.balance !== undefined
                                                        ? currency(entry.balance)
                                                        : '—'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900">Payment History</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Recorded payments for this supplier.
                                </p>
                            </div>
                            <div className="text-sm text-slate-500">
                                {paymentSummary.total} records
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">Date</th>
                                        <th className="px-5 py-4 font-semibold">Purchase</th>
                                        <th className="px-5 py-4 font-semibold">Method</th>
                                        <th className="px-5 py-4 font-semibold">Reference</th>
                                        <th className="px-5 py-4 text-right font-semibold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                                                No recorded payments found.
                                            </td>
                                        </tr>
                                    ) : (
                                        payments.map((payment) => (
                                            <tr key={payment._id} className="hover:bg-slate-50">
                                                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                    {dateFormat(payment.paymentDate)}
                                                </td>
                                                <td className="px-5 py-4 font-medium text-slate-800">
                                                    {payment.purchase?.purchaseNumber ||
                                                        payment.purchaseNumber ||
                                                        '—'}
                                                </td>
                                                <td className="px-5 py-4 capitalize text-slate-600">
                                                    {String(payment.paymentMethod || 'cash').replaceAll('_', ' ')}
                                                </td>
                                                <td className="px-5 py-4 text-slate-600">
                                                    {payment.referenceNumber || '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-emerald-700">
                                                    {currency(payment.amount)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {paymentPages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                                <p className="text-xs text-slate-500">
                                    Page {paymentPage} of {paymentPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={paymentPage <= 1}
                                        onClick={() => loadPayments(supplierId, paymentPage - 1)}
                                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={paymentPage >= paymentPages}
                                        onClick={() => loadPayments(supplierId, paymentPage + 1)}
                                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </>
            )}

            {showPaymentModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !submitting) {
                            setShowPaymentModal(false)
                        }
                    }}
                >
                    <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
                        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Record Supplier Payment
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {selectedSupplier?.name || 'Selected supplier'}
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setShowPaymentModal(false)}
                                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                                aria-label="Close payment modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="space-y-4 p-5">
                            {formError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {formError}
                                </div>
                            )}

                            {payablePurchases.length === 0 ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                    This supplier has no received purchases available for payment.
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Purchase *
                                        </label>
                                        <select
                                            name="purchase"
                                            value={form.purchase}
                                            onChange={updateForm}
                                            required
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        >
                                            <option value="">Choose an outstanding purchase</option>
                                            {payablePurchases.map((purchase) => (
                                                <option key={purchase._id} value={purchase._id}>
                                                    {purchase.purchaseNumber || purchase._id} —{' '}
                                                    {currency(purchase.totalAmount)}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedPurchase && (
                                            <p className="mt-2 text-xs text-slate-500">
                                                Purchase total: {currency(purchaseTotal)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                                Amount *
                                            </label>
                                            <input
                                                type="number"
                                                name="amount"
                                                value={form.amount}
                                                onChange={updateForm}
                                                min="0.01"
                                                step="0.01"
                                                required
                                                placeholder="0.00"
                                                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                                Payment date *
                                            </label>
                                            <input
                                                type="date"
                                                name="paymentDate"
                                                value={form.paymentDate}
                                                onChange={updateForm}
                                                required
                                                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Payment method *
                                        </label>
                                        <select
                                            name="paymentMethod"
                                            value={form.paymentMethod}
                                            onChange={updateForm}
                                            required
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="upi">UPI</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="cheque">Cheque</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Reference number
                                        </label>
                                        <input
                                            name="referenceNumber"
                                            value={form.referenceNumber}
                                            onChange={updateForm}
                                            placeholder="Transaction ID or cheque number"
                                            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Notes
                                        </label>
                                        <textarea
                                            name="notes"
                                            value={form.notes}
                                            onChange={updateForm}
                                            rows={3}
                                            placeholder="Optional payment notes..."
                                            className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowPaymentModal(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || payablePurchases.length === 0}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <LoaderCircle size={17} className="animate-spin" />
                                    ) : (
                                        <CreditCard size={17} />
                                    )}
                                    {submitting ? 'Saving...' : 'Save Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SupplierLedger
