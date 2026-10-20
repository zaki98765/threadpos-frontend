
import { Routes, Route, Navigate } from 'react-router-dom'

import Auth from './Pages/Auth'
import ProtectedRoute from './components/ProtectedRoute'

import AdminLayout from './components/admin/AdminLayout'
import Dashboard from './Pages/admin/Dashboard'
import Products from './Pages/admin/Products'
import Categories from './Pages/admin/Categories'
import Suppliers from './Pages/admin/Suppliers'
import Purchases from './Pages/admin/Purchases'
import SupplierLedger from './Pages/admin/SupplierLedger'
import Billing from './Pages/admin/Billing'
import SalesHistory from './Pages/admin/SalesHistory'
import Returns from './Pages/admin/Returns'
import Staff from './components/admin/Staff'
import Reports from './Pages/admin/Reports'
import Transactions from './Pages/admin/Transactions'
import Settings from './Pages/admin/Settings'
import Ledger from './Pages/admin/Ledger'
function App() {
  return (
    <Routes>
      {/* Public login */}
      <Route path="/login" element={<Auth />} />

      {/* Admin-only pages */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />

          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="supplier-ledger" element={<SupplierLedger />} />
          <Route path="sales-history" element={<SalesHistory />} />
          <Route path="returns" element={<Returns />} />

          <Route path="transactions" element={<Transactions />} />
          <Route path="staff" element={<Staff />} />
          <Route
            path="ledger"
            element={<Ledger/>}
          />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Billing for admins and staff */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
        <Route path="/billing" element={<Navigate to="/admin/billing" replace />} />

        <Route path="/admin/billing" element={<AdminLayout />}>
          <Route index element={<Billing />} />
        </Route>
      </Route>

      {/* Default navigation */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function PlaceholderPage({ title }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">
        This module will be implemented next.
      </p>
    </div>
  )
}

export default App
