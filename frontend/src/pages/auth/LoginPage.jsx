import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Brain, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Spinner from '../../components/common/Spinner'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/home'

  const [form, setForm] = useState({
  email: 'test@example.com',
  password: 'MyPassword123!',
})
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const result = await login(form.email, form.password)
    if (result.success) navigate(from, { replace: true })
  }

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50 px-4">
    {/* Background Blur Effects */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-200 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-30" />
    </div>

    {/* Home Button */}
<div className="absolute top-6 left-6">
  <Link
    to="/landingPage"
    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl shadow-md hover:shadow-lg hover:bg-white transition-all duration-200 text-slate-700 font-medium"
  >
    ← Home
  </Link>
</div>
    {/* Login Card */}
    <div className="relative w-full max-w-md">
      <div className="bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-3xl p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Welcome Back
          </h1>

          <p className="text-slate-500 text-sm mt-2">
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
                errors.email
                  ? 'border-red-500'
                  : 'border-slate-200'
              }`}
            />

            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-700">
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-3 pr-12 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
                  errors.password
                    ? 'border-red-500'
                    : 'border-slate-200'
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Signup */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-brand-600 font-semibold hover:text-brand-700"
            >
              Create Account
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t pt-5">
          <p className="text-center text-xs text-slate-400">
            By signing in, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  </div>
)
}
