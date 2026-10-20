
import { Navigate, Outlet, useLocation } from 'react-router-dom'

function ProtectedRoute({ allowedRoles }) {
  const location = useLocation()

  const userData = sessionStorage.getItem('threadpos_user')

  let user = null

  try {
    user = userData ? JSON.parse(userData) : null
  } catch {
    user = null
  }

  if (!user?.role) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : '/admin/billing'}
        replace
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute
