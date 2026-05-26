import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import { useMutation } from '@tanstack/react-query'
import { User, Mail, Shield, Flame, Trophy, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import Spinner from '../../components/common/Spinner'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    bio:        user?.bio        || '',
    username:   user?.username   || '',
  })
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', new_password_confirm: '' })
  const [pwErrors, setPwErrors] = useState({})

  const updateMut = useMutation({
    mutationFn: (data) => authService.updateProfile(data),
    onSuccess: () => { refreshUser(); toast.success('Profile updated!') },
    onError: () => toast.error('Update failed.'),
  })

  const pwMut = useMutation({
    mutationFn: (data) => authService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed!')
      setPwForm({ old_password: '', new_password: '', new_password_confirm: '' })
    },
    onError: (err) => {
      const errs = err.response?.data?.errors || {}
      setPwErrors(errs)
      toast.error(err.response?.data?.message || 'Password change failed.')
    },
  })

  const handleUpdate = (e) => {
    e.preventDefault()
    updateMut.mutate(form)
  }

  const handlePw = (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.new_password_confirm) {
      setPwErrors({ new_password_confirm: ['Passwords do not match.'] })
      return
    }
    setPwErrors({})
    pwMut.mutate(pwForm)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile" subtitle="Manage your account information" />

      {/* Avatar + stats */}
      <div className="card p-6 flex items-center gap-5 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl
                        flex items-center justify-center text-white font-display font-700 text-2xl shadow-glow flex-shrink-0">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-lg font-700 text-slate-900">{user?.username}</h2>
          <p className="text-slate-400 text-sm truncate">{user?.email}</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="font-display font-700 text-xl text-slate-900 flex items-center gap-1">
              <Trophy className="w-4.5 h-4.5 text-amber-400" />{user?.total_points || 0}
            </p>
            <p className="text-xs text-slate-400">Points</p>
          </div>
          <div className="text-center">
            <p className="font-display font-700 text-xl text-slate-900 flex items-center gap-1">
              <Flame className="w-4.5 h-4.5 text-orange-400" />{user?.streak_days || 0}d
            </p>
            <p className="text-xs text-slate-400">Streak</p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card p-6 mb-6">
        <h3 className="font-display font-600 text-slate-800 flex items-center gap-2 mb-5">
          <User className="w-4.5 h-4.5 text-brand-500" /> Personal Information
        </h3>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'first_name', label: 'First Name' },
              { name: 'last_name',  label: 'Last Name' },
            ].map(({ name, label }) => (
              <div key={name}>
                <label className="label">{label}</label>
                <input
                  type="text" value={form[name]}
                  onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                  className="input"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="label">Username</label>
            <input
              type="text" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">{user?.email}</span>
              <span className="ml-auto badge badge-brand text-xs">Cannot change</span>
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea
              value={form.bio} rows={3}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell us about yourself…"
              className="input resize-none"
            />
          </div>
          <button type="submit" disabled={updateMut.isPending} className="btn-primary">
            {updateMut.isPending ? <Spinner size="sm" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="card p-6">
        <h3 className="font-display font-600 text-slate-800 flex items-center gap-2 mb-5">
          <Shield className="w-4.5 h-4.5 text-brand-500" /> Change Password
        </h3>
        <form onSubmit={handlePw} className="space-y-4">
          {[
            { name: 'old_password', label: 'Current Password' },
            { name: 'new_password', label: 'New Password' },
            { name: 'new_password_confirm', label: 'Confirm New Password' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="label">{label}</label>
              <input
                type="password" value={pwForm[name]}
                onChange={(e) => setPwForm({ ...pwForm, [name]: e.target.value })}
                className={`input ${pwErrors[name] ? 'input-error' : ''}`}
              />
              {pwErrors[name] && (
                <p className="text-xs text-danger-500 mt-1">
                  {Array.isArray(pwErrors[name]) ? pwErrors[name][0] : pwErrors[name]}
                </p>
              )}
            </div>
          ))}
          <button type="submit" disabled={pwMut.isPending} className="btn-secondary">
            {pwMut.isPending ? <Spinner size="sm" /> : <><Shield className="w-4 h-4" /> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  )
}
