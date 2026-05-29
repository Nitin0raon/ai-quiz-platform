import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, FileText, Zap, BarChart2,
  User, LogOut, Menu, X, ChevronRight, Brain,
  TrendingUp,   // ← add this
} from 'lucide-react'

const NAV = [
  { to: '/home',      label: 'Home',      icon: LayoutDashboard },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/quizzes',   label: 'Quizzes',   icon: Zap },
  { to: '/analytics', label: 'Analytics', icon: TrendingUp },
  { to: '/profile',   label: 'Profile',   icon: User },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
  await logout()
  navigate('/')   // ← was '/login'
}

  const Sidebar = ({ mobile = false }) => (
    <aside className={`
      flex flex-col h-full bg-white border-r border-slate-100
      ${mobile ? 'w-72' : 'w-64'}
    `}>
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-slate-100">
        <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center shadow-glow">
          <Brain className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-display font-700 text-slate-900 text-lg tracking-tight">
          Quiz<span className="text-brand-600">AI</span>
        </span>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-700 font-bold text-sm">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.username}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500
                     hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 flex-shrink-0 animate-slide-up">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-700 text-slate-900">
            Quiz<span className="text-brand-600">AI</span>
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-5 lg:p-8">
          <div className="max-w-6xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
