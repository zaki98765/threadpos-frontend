
import { useEffect, useState } from 'react'
import {
  Store,
  ReceiptText,
  Percent,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react'

const STORAGE_KEY = 'threadpos_shop_settings'

const defaultSettings = {
  shopName: 'ThreadPOS Store',
  ownerName: '',
  phone: '',
  email: '',
  address: '',
  currency: 'INR',
  taxRate: '0',
  taxLabel: 'GST',
  receiptFooter: 'Thank you for shopping with us!',
  showAddress: true,
  showPhone: true,
  showTax: true,
  showLogo: false,
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : { ...defaultSettings }
  } catch {
    return { ...defaultSettings }
  }
}

function SettingsField({ label, children, description }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      {children}
      {description && (
        <p className="text-xs leading-5 text-gray-400">{description}</p>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100'

function Settings() {
  const [settings, setSettings] = useState(loadSettings)
  const [savedMessage, setSavedMessage] = useState('')
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (!savedMessage) return undefined
    const timeout = window.setTimeout(() => setSavedMessage(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [savedMessage])

  const updateField = (event) => {
    const { name, value, type, checked } = event.target
    setSettings((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setSavedMessage('')
    setError('')
  }

  const saveSettings = (event) => {
    event.preventDefault()

    const rate = Number(settings.taxRate)

    if (
      !Number.isFinite(rate) ||
      rate < 0 ||
      rate > 100 ||
      settings.taxRate.trim() === ''
    ) {
      setError('Enter a valid tax rate between 0 and 100.')
      return
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      setSavedMessage('Settings saved successfully on this browser.')
      setError('')
    } catch {
      setError('Unable to save settings. Check your browser storage.')
    }
  }

  const resetSettings = () => {
    if (!window.confirm('Reset all shop settings to their defaults?')) return

    localStorage.removeItem(STORAGE_KEY)
    setSettings({ ...defaultSettings })
    setSavedMessage('Settings reset to defaults.')
    setError('')
  }

  const money = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: settings.currency,
      maximumFractionDigits: 2,
    }).format(amount)

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Configure your shop information, tax and receipt preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPreview((previous) => !previous)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Eye size={17} />
          {showPreview ? 'Hide receipt preview' : 'Preview receipt'}
        </button>
      </div>

      {savedMessage && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 size={18} />
          {savedMessage}
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={saveSettings} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-green-50 p-3 text-green-700">
                <Store size={21} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Shop information</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Information displayed on your receipts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <SettingsField label="Shop name">
                <input
                  name="shopName"
                  value={settings.shopName}
                  onChange={updateField}
                  required
                  maxLength={150}
                  className={inputClass}
                  placeholder="Enter shop name"
                />
              </SettingsField>

              <SettingsField label="Owner / manager name">
                <input
                  name="ownerName"
                  value={settings.ownerName}
                  onChange={updateField}
                  maxLength={150}
                  className={inputClass}
                  placeholder="Enter owner name"
                />
              </SettingsField>

              <SettingsField label="Phone number">
                <input
                  type="tel"
                  name="phone"
                  value={settings.phone}
                  onChange={updateField}
                  maxLength={30}
                  className={inputClass}
                  placeholder="Shop contact number"
                />
              </SettingsField>

              <SettingsField label="Email address">
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={updateField}
                  maxLength={254}
                  className={inputClass}
                  placeholder="shop@example.com"
                />
              </SettingsField>

              <div className="sm:col-span-2">
                <SettingsField label="Shop address">
                  <textarea
                    name="address"
                    value={settings.address}
                    onChange={updateField}
                    rows={3}
                    maxLength={500}
                    className={inputClass}
                    placeholder="Enter your complete shop address"
                  />
                </SettingsField>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                <Percent size={21} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Tax and currency</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Configure the values used in the receipt preview.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <SettingsField label="Currency">
                <select
                  name="currency"
                  value={settings.currency}
                  onChange={updateField}
                  className={inputClass}
                >
                  <option value="INR">Indian Rupee (INR ₹)</option>
                  <option value="USD">US Dollar (USD $)</option>
                  <option value="AED">UAE Dirham (AED)</option>
                  <option value="GBP">British Pound (GBP £)</option>
                </select>
              </SettingsField>

              <SettingsField label="Tax label">
                <input
                  name="taxLabel"
                  value={settings.taxLabel}
                  onChange={updateField}
                  maxLength={30}
                  className={inputClass}
                  placeholder="GST"
                />
              </SettingsField>

              <div className="sm:col-span-2">
                <SettingsField
                  label="Tax rate (%)"
                  description="This value updates the preview only. It does not change your billing calculations."
                >
                  <input
                    type="number"
                    name="taxRate"
                    value={settings.taxRate}
                    onChange={updateField}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    className={inputClass}
                  />
                </SettingsField>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                <ReceiptText size={21} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Receipt settings</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Choose which shop details appear in the preview.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                ['showAddress', 'Show shop address'],
                ['showPhone', 'Show shop phone number'],
                ['showTax', 'Show tax breakdown'],
              ].map(([name, label]) => (
                <label
                  key={name}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-100 p-4 hover:bg-gray-50"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {label}
                  </span>
                  <input
                    type="checkbox"
                    name={name}
                    checked={settings[name]}
                    onChange={updateField}
                    className="h-4 w-4 accent-green-600"
                  />
                </label>
              ))}

              <SettingsField label="Receipt footer message">
                <textarea
                  name="receiptFooter"
                  value={settings.receiptFooter}
                  onChange={updateField}
                  rows={2}
                  maxLength={300}
                  className={inputClass}
                  placeholder="Thank you for shopping with us!"
                />
              </SettingsField>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={resetSettings}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              <RotateCcw size={17} />
              Reset defaults
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
            >
              <Save size={17} />
              Save settings
            </button>
          </div>
        </div>

        <aside className="xl:sticky xl:top-6">
          {showPreview ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 font-bold text-gray-900">Receipt preview</h2>

              <div className="mx-auto max-w-sm border border-dashed border-gray-300 bg-white p-5 text-center">
                <h3 className="break-words text-lg font-bold text-gray-900">
                  {settings.shopName || 'Your Shop'}
                </h3>

                {settings.ownerName && (
                  <p className="mt-1 text-xs text-gray-500">
                    {settings.ownerName}
                  </p>
                )}

                {settings.showAddress && settings.address && (
                  <p className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-500">
                    {settings.address}
                  </p>
                )}

                {settings.showPhone && settings.phone && (
                  <p className="mt-1 text-xs text-gray-500">
                    Phone: {settings.phone}
                  </p>
                )}

                {settings.email && (
                  <p className="mt-1 break-words text-xs text-gray-500">
                    {settings.email}
                  </p>
                )}

                <div className="my-4 border-t border-dashed border-gray-300" />

                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-gray-500">Sample item</span>
                  <span className="font-medium">{money(100)}</span>
                </div>

                {settings.showTax && (
                  <div className="mt-3 flex justify-between gap-2 text-sm">
                    <span className="text-gray-500">
                      {settings.taxLabel || 'Tax'} ({Number(settings.taxRate || 0)}%)
                    </span>
                    <span>
                      {money(100 * Number(settings.taxRate || 0) / 100)}
                    </span>
                  </div>
                )}

                <div className="my-4 border-t border-dashed border-gray-300" />

                <div className="flex justify-between gap-2 font-bold">
                  <span>Total</span>
                  <span>
                    {money(
                      100 +
                      (settings.showTax
                        ? 100 * Number(settings.taxRate || 0) / 100
                        : 0)
                    )}
                  </span>
                </div>

                <p className="mt-6 whitespace-pre-wrap text-xs text-gray-500">
                  {settings.receiptFooter}
                </p>
              </div>

              <p className="mt-4 text-xs leading-5 text-amber-700">
                Preview only. These settings are not yet connected to the
                billing engine or printed receipt template.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="rounded-xl bg-green-50 p-3 text-green-700 w-fit">
                <Store size={22} />
              </div>
              <h2 className="mt-4 font-bold text-gray-900">
                Shop configuration
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Keep your shop information and receipt preferences updated
                for consistent business records.
              </p>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
              >
                <Eye size={16} />
                Preview receipt
              </button>
            </div>
          )}
        </aside>
      </form>
    </div>
  )
}

export default Settings
