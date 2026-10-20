
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import AdminHeader from './AdminHeader'

const pageTitles = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/billing': 'Billing',
  '/admin/transactions': 'Transactions',
  '/admin/returns': 'Returns',
  '/admin/staff': 'Staff Management',
  '/admin/suppliers': 'Suppliers',
  '/admin/ledger': 'Ledger',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Settings',
}

function AdminLayout() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const pageTitle = pageTitles[location.pathname] || 'Admin Workspace'

  return (
    <div className="min-h-screen bg-[#f7f9f7]">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <div className="min-h-screen min-w-0 lg:pl-[270px]">
        <AdminHeader
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {/* Page heading */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-green-700">
                ThreadPOS / Administration
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {pageTitle}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your store operations from one place.
              </p>
            </div>

            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
