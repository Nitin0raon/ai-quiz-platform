import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Brain, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Spinner from '../../components/common/Spinner'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
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
    <div className="min-h-screen bg-surface-50 flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-950 relative overflow-hidden flex-col justify-between p-12">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-800/40 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-indigo-700/30 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-800 text-white text-xl tracking-tight">QuizAI</span>
          </div>

          <h2 className="font-display text-4xl font-800 text-white leading-[1.15] mb-4">
            Ace every<br />interview with<br />
            <span className="text-brand-400">AI-powered</span> prep
          </h2>
          <p className="text-brand-200 text-base leading-relaxed max-w-xs">
            Upload your study material, generate targeted quizzes, and track your progress with deep analytics.
          </p>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: 'Quizzes Generated', value: '50K+' },
            { label: 'Topics Covered', value: '200+' },
            { label: 'Avg. Score Lift', value: '+35%' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <p className="font-display text-2xl font-800 text-white">{s.value}</p>
              <p className="text-brand-300 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-700 text-slate-900 text-lg">
              Quiz<span className="text-brand-600">AI</span>
            </span>
          </div>

          <h1 className="font-display text-2xl font-700 text-slate-900 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:text-brand-700">
              Create one free
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
              />
              {errors.email && <p className="text-xs text-danger-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  className={`input pr-12 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger-500 mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary btn-lg w-full mt-2">
              {loading ? <Spinner size="sm" /> : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
