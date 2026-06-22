import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Brain, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import Spinner from '../../components/common/Spinner'

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
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50 px-4 py-10 relative overflow-hidden">
    {/* Background Effects */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-200 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-30" />
    </div>

    {/* Home Button */}
    <div className="absolute top-6 left-6 z-20">
      <Link
        to="/LandingPage"
        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl shadow-md hover:shadow-lg hover:bg-white transition-all duration-200 text-slate-700 font-medium"
      >
        Home
      </Link>
    </div>

    {/* Register Card */}
    <div className="relative z-10 w-full max-w-2xl">
      <div className="bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-3xl p-8 md:p-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Create Account
          </h1>

          <p className="text-slate-500 mt-2">
            Start your AI-powered learning journey
          </p>

          <p className="text-sm text-slate-500 mt-3">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-brand-600 font-semibold hover:text-brand-700"
            >
              Sign In
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-5">
            <Field
              name="first_name"
              label="First Name"
              placeholder="John"
              half
              form={form}
              errors={errors}
              handleChange={handleChange}
              showPw={showPw}
              setShowPw={setShowPw}
            />

            <Field
              name="last_name"
              label="Last Name"
              placeholder="Doe"
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
              placeholder="johndoe"
              form={form}
              errors={errors}
              handleChange={handleChange}
              showPw={showPw}
              setShowPw={setShowPw}
            />

            <Field
              name="email"
              label="Email Address"
              type="email"
              placeholder="john@example.com"
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
              placeholder="Minimum 8 characters"
              form={form}
              errors={errors}
              handleChange={handleChange}
              showPw={showPw}
              setShowPw={setShowPw}
            />

            <Field
              name="password_confirm"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
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
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition flex items-center justify-center gap-2 shadow-lg mt-6"
          >
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          By creating an account, you agree to our Terms of Service and
          Privacy Policy.
        </p>
      </div>
    </div>
  </div>
)
}