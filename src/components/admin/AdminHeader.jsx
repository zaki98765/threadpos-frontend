
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  UserRound,
  Settings,
  LogOut,
  CircleHelp,
  Check,
  X,
  LoaderCircle,
  Package,
  AlertCircle,
} from 'lucide-react'

import { logoutUser } from '../../services/authService'
import { getProducts } from '../../services/productService'

const money = (value = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

function AdminHeader({ onMenuClick }) {
  const navigate = useNavigate()
  const searchRef = useRef(null)
  const requestRef = useRef(0)

  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const query = search.trim()
    const requestId = ++requestRef.current

    if (!query) {
      setResults([])
      setSearching(false)
      setSearchError('')
      return
    }

    let cancelled = false

    const timer = setTimeout(async () => {
      setSearching(true)
      setSearchError('')

      try {
        // Request a broad first page; filter locally as a fallback.
        const response = await getProducts({
          search: query,
          page: 1,
          limit: 20,
        })

        if (cancelled || requestId !== requestRef.current) return

        const payload = response.data || response
        const products = Array.isArray(payload.products)
          ? payload.products
          : Array.isArray(payload.data)
            ? payload.data
            : Array.isArray(payload)
              ? payload
              : []

        const normalizedQuery = query.toLowerCase()

        // Local filtering also works if the API ignores the search parameter.
        const matched = products.filter((product) => {
          const searchable = [
            product.name,
            product.productName,
            product.sku,
            product.barcode,
            product.category?.name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return searchable.includes(normalizedQuery)
        })

        setResults(matched.slice(0, 8))
      } catch (error) {
        if (cancelled || requestId !== requestRef.current) return
        setResults([])
        setSearchError(error.message || 'Unable to search products.')
      } finally {
        if (!cancelled && requestId === requestRef.current) {
          setSearching(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search])

  const openProducts = () => {
    const query = search.trim()
    if (!query) return

    setShowSearch(false)
    navigate(`/admin/products?search=${encodeURIComponent(query)}`)
  }

  const openProduct = (product) => {
    setShowSearch(false)

    // Open the Products page with the selected product's name or SKU.
    const query = product.name || product.productName || product.sku || search
    navigate(`/admin/products?search=${encodeURIComponent(query)}`)
  }

  const handleLogout = async () => {
    setLoggingOut(true)

    try {
      await logoutUser()
    } catch (error) {
      console.error('Logout request failed:', error.message)
    } finally {
      setLoggingOut(false)
      sessionStorage.removeItem('threadpos_user')
      navigate('/login', { replace: true })
    }
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!searchRef.current?.contains(event.target)) {
        setShowSearch(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">
      <div className="flex min-h-[76px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-xl p-2.5 text-gray-600 transition hover:bg-gray-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        {/* Live product search */}
        <div ref={searchRef} className="relative flex min-w-0 max-w-xl flex-1 items-center">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              openProducts()
            }}
            className="flex w-full items-center"
          >
            <div className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3.5 transition focus-within:border-green-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-green-500/10 sm:max-w-md">
              {searching ? (
                <LoaderCircle size={19} className="shrink-0 animate-spin text-green-700" />
              ) : (
                <Search size={19} className="shrink-0 text-gray-400 group-focus-within:text-green-700" />
              )}

              <input
                ref={undefined}
                type="search"
                value={search}
                onFocus={() => setShowSearch(true)}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setShowSearch(true)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setShowSearch(false)
                }}
                placeholder="Search products or SKU..."
                aria-label="Search products"
                aria-expanded={showSearch && Boolean(search.trim())}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearch('')
                    setShowSearch(false)
                  }}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              )}

              <kbd className="hidden rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-400 sm:inline">
                Enter
              </kbd>
            </div>
          </form>

          {showSearch && search.trim() && (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-[60] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10 sm:w-[440px]">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Product results
                </p>
                {!searching && (
                  <span className="text-xs text-gray-400">
                    {results.length} found
                  </span>
                )}
              </div>

              {searching ? (
                <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-gray-500">
                  <LoaderCircle size={18} className="animate-spin" />
                  Searching products...
                </div>
              ) : searchError ? (
                <div className="px-4 py-6 text-center">
                  <AlertCircle size={22} className="mx-auto mb-2 text-red-500" />
                  <p className="text-sm text-red-600">{searchError}</p>
                  <button
                    type="button"
                    onClick={openProducts}
                    className="mt-3 text-sm font-semibold text-green-700 hover:underline"
                  >
                    Open Products page
                  </button>
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Package size={25} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-700">
                    No matching products
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Try another product name, SKU, or barcode.
                  </p>
                  <button
                    type="button"
                    onClick={openProducts}
                    className="mt-3 text-sm font-semibold text-green-700 hover:underline"
                  >
                    Search on Products page
                  </button>
                </div>
              ) : (
                <>
                  <div className="max-h-[min(360px,60vh)] overflow-y-auto">
                    {results.map((product) => {
                      const id = product._id || product.id
                      const name = product.name || product.productName || 'Unnamed product'
                      const stock = Number(product.stock ?? product.quantity ?? 0)

                      return (
                        <button
                          type="button"
                          key={id || `${name}-${product.sku}`}
                          onClick={() => openProduct(product)}
                          className="flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-green-50"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                            <Package size={19} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {name}
                            </p>
                            <p className="mt-1 truncate text-xs text-gray-500">
                              SKU: {product.sku || '—'}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold text-gray-900">
                              {money(product.sellingPrice ?? product.price)}
                            </p>
                            <p className={`mt-1 text-xs ${stock <= 5 ? 'text-amber-600' : 'text-gray-500'}`}>
                              Stock: {stock}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={openProducts}
                    className="w-full border-t border-gray-100 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50"
                  >
                    View all matching products →
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => window.open('mailto:support@threadpos.local', '_self')}
            aria-label="Contact support"
            title="Contact support"
            className="hidden rounded-xl p-2.5 text-gray-500 transition hover:bg-gray-100 hover:text-green-700 sm:flex"
          >
            <CircleHelp size={20} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={showNotifications}
              onClick={() => {
                setShowNotifications((previous) => !previous)
                setShowProfile(false)
                setShowSearch(false)
              }}
              className={`relative rounded-xl p-2.5 transition ${
                showNotifications
                  ? 'bg-green-50 text-green-800'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Bell size={20} />
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-14 z-50 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                    <p className="mt-0.5 text-xs text-gray-500">Store updates</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Close notifications"
                    onClick={() => setShowNotifications(false)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="px-4 py-8 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-700">
                    <Check size={21} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">You're all caught up</p>
                  <p className="mt-1 text-xs text-gray-500">
                    New store alerts will appear here when available.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="hidden h-8 w-px bg-gray-200 sm:block" />

          {/* Profile */}
          <div className="relative">
            <button
              type="button"
              aria-expanded={showProfile}
              onClick={() => {
                setShowProfile((previous) => !previous)
                setShowNotifications(false)
                setShowSearch(false)
              }}
              className="flex items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-gray-50 sm:gap-3 sm:px-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-sm font-bold text-green-800">
                <UserRound size={21} />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-gray-900">Administrator</p>
                <p className="mt-0.5 text-xs text-gray-500">Store manager</p>
              </div>
              <ChevronDown size={16} className="hidden text-gray-400 sm:block" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-gray-900/10">
                <div className="border-b border-gray-100 px-3 py-3">
                  <p className="text-sm font-semibold text-gray-900">Administrator</p>
                  <p className="mt-1 text-xs text-gray-500">ThreadPOS Admin</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false)
                    navigate('/admin/settings')
                  }}
                  className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Settings size={17} />
                  Settings
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <LogOut size={17} />
                  {loggingOut ? 'Logging out...' : 'Log out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
