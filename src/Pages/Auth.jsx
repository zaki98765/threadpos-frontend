
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  ArrowRight,
  ShieldCheck,
  UserRound,
  CheckCircle2,
  LoaderCircle,
} from 'lucide-react'

import { loginUser, registerUser } from '../services/authService'

function Auth() {
  const navigate = useNavigate()

  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    setError('')
    setSuccess('')
  }

  const switchMode = () => {
    setIsRegister((previous) => !previous)
    setShowPassword(false)
    setError('')
    setSuccess('')

    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const email = formData.email.trim().toLowerCase()
    const password = formData.password

    if (isRegister && !formData.name.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (!email) {
      setError('Please enter your email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (isRegister && password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const data = isRegister
        ? await registerUser({
          name: formData.name.trim(),
          email,
          password,
        })
        : await loginUser({
          email,
          password,
        })

      if (isRegister) {
        setIsRegister(false)
        setFormData({
          name: '',
          email,
          password: '',
          confirmPassword: '',
        })
        setSuccess('Account created successfully. Please sign in.')
        return
      }

      console.log('Logged-in user:', data.user)
      console.log('User role:', data.user.role)

      if (!data?.user?.role) {
        throw new Error('Invalid login response received from the server.')
      }
      sessionStorage.setItem('threadpos_user', JSON.stringify(data.user))

      if (data.user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (data.user.role === 'staff') {
        navigate('/admin/billing', { replace: true })
      } else {
        throw new Error('Your account does not have an authorized role.')
      }
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the server. Check your backend and API URL.'
          : err.message || 'Unable to complete your request.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f7f3] p-3 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-green-950/10 md:min-h-[650px] md:grid-cols-2">
        {/* Branding panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-green-700 p-10 text-white md:flex lg:p-12">
          <div className="pointer-events-none absolute -right-24 -top-20 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full border border-white/10" />

          <Link to="/" className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-green-800 shadow-lg">
              <ShoppingBag size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Thread<span className="text-green-300">POS</span>
              </h1>
              <p className="text-[10px] font-medium tracking-[0.22em] text-green-100">
                RETAIL MANAGEMENT
              </p>
            </div>
          </Link>

          <div className="relative my-10">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-green-100">
              <span className="h-2 w-2 rounded-full bg-green-300" />
              Your business, simplified
            </span>

            <h2 className="max-w-md text-4xl font-bold leading-tight lg:text-5xl">
              Smarter billing.
              <br />
              Better business.
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-7 text-green-100/80 lg:text-base">
              Manage inventory, simplify checkout, and understand your
              retail performance with one connected platform.
            </p>

            <div className="mt-9 space-y-5">
              {[
                'Fast and accurate billing',
                'Inventory and stock tracking',
                'Sales insights and reports',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-400/15 text-green-200">
                    <CheckCircle2 size={16} />
                  </span>
                  <span className="text-sm text-green-50">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-green-100/60">
            © {new Date().getFullYear()} ThreadPOS. All rights reserved.
          </p>
        </section>

        {/* Authentication panel */}
        <section className="flex items-center justify-center p-5 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <Link to="/" className="mb-8 flex items-center gap-3 md:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-800 text-white">
                <ShoppingBag size={23} />
              </div>
              <h1 className="text-2xl font-extrabold text-green-950">
                Thread<span className="text-green-600">POS</span>
              </h1>
            </Link>

            <div className="mb-8">
              <span className="mb-4 inline-flex rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-green-800">
                {isRegister ? 'Get started' : 'Welcome back'}
              </span>

              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {isRegister ? 'Create an account' : 'Sign in to ThreadPOS'}
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                {isRegister
                  ? 'Enter your details to create your account.'
                  : 'Enter your credentials to access your workspace.'}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Full name
                  </label>

                  <div className="relative">
                    <UserRound
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required={isRegister}
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10 disabled:opacity-60"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    placeholder={
                      isRegister ? 'At least 8 characters' : 'Enter your password'
                    }
                    value={formData.password}
                    onChange={handleChange}
                    minLength={8}
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-green-700"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      minLength={8}
                      required={isRegister}
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10 disabled:opacity-60"
                    />
                  </div>
                </div>
              )}

              {!isRegister && (
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-green-800 transition hover:text-green-600"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-green-800 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-900/15 transition hover:-translate-y-0.5 hover:bg-green-900 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {isRegister ? 'Create account' : 'Sign in'}
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[10px] font-semibold tracking-widest text-gray-400">
                SECURE ACCESS
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <p className="text-center text-sm text-gray-500">
              {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
              <button
                type="button"
                onClick={switchMode}
                disabled={loading}
                className="font-semibold text-green-800 transition hover:text-green-600 disabled:opacity-50"
              >
                {isRegister ? 'Sign in' : 'Register'}
              </button>
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
              <ShieldCheck size={15} />
              Protected access for authorized personnel
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Auth
