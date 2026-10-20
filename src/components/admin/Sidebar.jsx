
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ReceiptText,
  RotateCcw,
  Users,
  Truck,
  BookOpen,
  ChartNoAxesCombined,
  Settings,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Store,
  Wallet,
  Tags,
} from 'lucide-react'

import { logoutUser } from '../../services/authService'

const navigation = [
  {
    title: 'OVERVIEW',
    items: [
      {
        name: 'Dashboard',
        path: '/admin',
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    title: 'INVENTORY',
    items: [
      {
        name: 'Products',
        path: '/admin/products',
        icon: Package,
      },
      {
        name: 'Categories',
        path: '/admin/categories',
        icon: Tags,
      },
    ],
  },
  {
    title: 'PURCHASING',
    items: [
      {
        name: 'Suppliers',
        path: '/admin/suppliers',
        icon: Truck,
      },
      {
        name: 'Purchases',
        path: '/admin/purchases',
        icon: ShoppingBag,
      },
      {
        name: 'Supplier Ledger',
        path: '/admin/supplier-ledger',
        icon: BookOpen,
      },
    ],
  },
  {
    title: 'SALES & BILLING',
    items: [
      {
        name: 'Billing',
        path: '/admin/billing',
        icon: ShoppingCart,
      },
      {
        name: 'Sales History',
        path: '/admin/sales-history',
        icon: ReceiptText,
      },
      {
        name: 'Returns',
        path: '/admin/returns',
        icon: RotateCcw,
      },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      {
        name: 'Transactions',
        path: '/admin/transactions',
        icon: ReceiptText,
      },
      {
        name: 'Staff',
        path: '/admin/staff',
        icon: Users,
      },
      {
        name: 'Ledger',
        path: '/admin/ledger',
        icon: BookOpen,
      },
      {
        name: 'Reports',
        path: '/admin/reports',
        icon: ChartNoAxesCombined,
      },
    ],
  },
]

function Sidebar({
  mobileOpen = false,
  onClose,
  onNavigate,
}) {
  const navigate = useNavigate()

  const [collapsed, setCollapsed] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  let user = null

  try {
    user = JSON.parse(
      sessionStorage.getItem('threadpos_user') || 'null'
    )
  } catch {
    user = null
  }

  const isAdmin = user?.role === 'admin'
  const homePath = isAdmin ? '/admin' : '/admin/billing'

  // Staff only see billing; admins see the full navigation.
  const visibleNavigation = isAdmin
    ? navigation
    : [
        {
          title: 'SALES & BILLING',
          items: [
            {
              name: 'Billing',
              path: '/admin/billing',
              icon: ShoppingCart,
            },
          ],
        },
      ]

  const closeMobile = () => {
    onClose?.()
  }

  const handleNavigation = () => {
    closeMobile()
    onNavigate?.()
  }

  const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await logoutUser()
    } catch (error) {
      console.error('Logout request failed:', error.message)
    } finally {
      sessionStorage.removeItem('threadpos_user')
      setLoggingOut(false)
      navigate('/login', { replace: true })
    }
  }

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-green-700 text-white shadow-md shadow-green-950/20'
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    } ${collapsed ? 'justify-center' : ''}`

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-[#101b16] text-white transition-all duration-300 ${
          collapsed ? 'w-[84px]' : 'w-[270px]'
        } ${
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div
          className={`flex h-[82px] shrink-0 items-center border-b border-white/10 ${
            collapsed ? 'justify-center px-3' : 'justify-between px-5'
          }`}
        >
          <Link
            to={homePath}
            onClick={handleNavigation}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-900/30">
              <ShoppingBag size={23} strokeWidth={2.2} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold tracking-tight">
                  Thread<span className="text-green-400">POS</span>
                </h1>

                <p className="mt-0.5 text-[9px] font-semibold tracking-[0.2em] text-gray-500">
                  {isAdmin ? 'ADMIN WORKSPACE' : 'STAFF WORKSPACE'}
                </p>
              </div>
            )}
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={closeMobile}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Store indicator */}
        {!collapsed && (
          <div className="mx-4 mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
              <Store size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-100">
                ThreadPOS Store
              </p>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                <span className="text-[11px] text-gray-500">
                  {isAdmin ? 'Admin panel' : 'Billing counter'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
          {visibleNavigation.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-gray-500">
                  {section.title}
                </p>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      title={collapsed ? item.name : undefined}
                      onClick={handleNavigation}
                      className={linkClass}
                    >
                      <Icon
                        size={19}
                        strokeWidth={1.8}
                        className="shrink-0"
                      />

                      {!collapsed && (
                        <span className="flex-1">{item.name}</span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Admin settings */}
          {isAdmin && (
            <div>
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-gray-500">
                  PREFERENCES
                </p>
              )}

              <button
                type="button"
                title={collapsed ? 'Settings' : undefined}
                onClick={() => {
                  if (collapsed) {
                    navigate('/admin/settings')
                    handleNavigation()
                  } else {
                    setSettingsOpen((previous) => !previous)
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <Settings size={19} className="shrink-0" />

                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Settings</span>

                    {settingsOpen ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </>
                )}
              </button>

              {settingsOpen && !collapsed && (
                <div className="ml-6 mt-1 border-l border-white/10 pl-4">
                  <NavLink
                    to="/admin/settings"
                    onClick={handleNavigation}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2.5 text-sm transition ${
                        isActive
                          ? 'text-green-400'
                          : 'text-gray-500 hover:text-white'
                      }`
                    }
                  >
                    Store settings
                  </NavLink>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50 ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Log out' : undefined}
          >
            <LogOut size={19} className="shrink-0" />

            {!collapsed && (
              <span>{loggingOut ? 'Logging out...' : 'Log out'}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((previous) => !previous)}
            className="mt-2 hidden w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white lg:flex"
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <>
                <PanelLeftClose size={17} />
                Collapse sidebar
              </>
            )}
          </button>

          {!collapsed && (
            <div className="mt-4 flex items-center gap-2 px-2 pb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600/20 text-xs font-bold text-green-400">
                TP
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-300">
                  ThreadPOS
                </p>

                <p className="mt-0.5 text-[10px] text-gray-600">
                  {isAdmin ? 'Retail management' : 'Point of sale'}
                </p>
              </div>

              <Wallet size={16} className="ml-auto text-gray-600" />
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar
