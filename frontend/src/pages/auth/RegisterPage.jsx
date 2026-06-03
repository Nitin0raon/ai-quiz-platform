import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Brain, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import Spinner from '../../components/common/Spinner'

const PERKS = [
  'Upload unlimited study PDFs',
  'Generate AI-powered MCQ quizzes',
  'Track performance with analytics',
  'Compete on the leaderboard',
]

function Field({
  name,
  label,
  type = 'text',
  placeholder,
  half,
  form,
  errors,
  handleChange,
  showPw,
  setShowPw,
}) {
  return (
    <div className={half ? '' : 'col-span-2'}>
      <label className="label">{label}</label>

      <div className="relative">
        <input
          type={name.includes('password') && !showPw ? 'password' : type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete="off"
          className={`input ${errors[name] ? 'input-error' : ''} ${
            name === 'password' || name === 'password_confirm'
              ? 'pr-12'
              : ''
          }`}
        />

        {name === 'password' && (
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPw ? (
              <EyeOff className="w-4.5 h-4.5" />
            ) : (
              <Eye className="w-4.5 h-4.5" />
            )}
          </button>
        )}
      </div>

      {errors[name] && (
        <p className="text-xs text-danger-500 mt-1">
          {errors[name]}
        </p>
      )}
    </div>
  )
}

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
  })

  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validate = () => {
    const e = {}

    if (!form.username.trim()) {
      e.username = 'Username is required'
    }

    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      e.email = 'Valid email required'
    }

    if (!form.password || form.password.length < 8) {
      e.password = 'Password must be at least 8 characters'
    }

    if (form.password !== form.password_confirm) {
      e.password_confirm = 'Passwords do not match'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    const result = await register(form)

    if (result.success) {
      navigate('/home')
    } else if (result.errors) {
      setErrors(result.errors)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Left — branding */}
      <div
        className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-brand-950 via-brand-900 to-indigo-900
        relative overflow-hidden flex-col justify-between p-12"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute bottom-20 left-0 w-72 h-72 rounded-full bg-indigo-600/20 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-800 text-white text-xl">
              QuizAI
            </span>
          </div>

          <h2 className="font-display text-3xl font-800 text-white leading-tight mb-3">
            Your smartest
            <br />
            study partner
          </h2>

          <p className="text-brand-200 text-sm mb-10">
            Join thousands of learners preparing smarter, not harder.
          </p>

          <div className="space-y-3">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-success-500/20 flex items-center justify-center flex-shrink-0">
                  <Check
                    className="w-3 h-3 text-success-400"
                    strokeWidth={3}
                  />
                </div>
                <span className="text-brand-100 text-sm">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-brand-400 text-xs">
          Free forever · No credit card required
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-lg animate-slide-up">
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-700 text-slate-900">
              QuizAI
            </span>
          </div>

          <h1 className="font-display text-2xl font-700 text-slate-900 mb-1">
            Create your account
          </h1>

          <p className="text-slate-500 text-sm mb-7">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-brand-600 font-medium hover:text-brand-700"
            >
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Field
                name="first_name"
                label="First name"
                placeholder="Alex"
                half
                form={form}
                errors={errors}
                handleChange={handleChange}
                showPw={showPw}
                setShowPw={setShowPw}
              />

              <Field
                name="last_name"
                label="Last name"
                placeholder="Kim"
                half
                form={form}
                errors={errors}
                handleChange={handleChange}
                showPw={showPw}
                setShowPw={setShowPw}
              />

              <Field
                name="username"
                label="Username"
                placeholder="alexkim"
                form={form}
                errors={errors}
                handleChange={handleChange}
                showPw={showPw}
                setShowPw={setShowPw}
              />

              <Field
                name="email"
                label="Email address"
                type="email"
                placeholder="alex@example.com"
                form={form}
                errors={errors}
                handleChange={handleChange}
                showPw={showPw}
                setShowPw={setShowPw}
              />

              <Field
                name="password"
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                form={form}
                errors={errors}
                handleChange={handleChange}
                showPw={showPw}
                setShowPw={setShowPw}
              />

              <Field
                name="password_confirm"
                label="Confirm password"
                type="password"
                placeholder="Repeat password"
                form={form}
                errors={errors}
                handleChange={handleChange}
                showPw={showPw}
                setShowPw={setShowPw}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-lg w-full mt-6"
            >
              {loading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-6">
            By creating an account, you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  )
}