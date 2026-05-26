/**
 * AuthContext
 * ===========
 * Provides authentication state to the entire app.
 * Stores user info + tokens in localStorage for persistence.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const isAuthenticated = !!user && !!localStorage.getItem('access_token')

  // ── Login ─────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await authService.login({ email, password })
      localStorage.setItem('access_token', data.tokens.access)
      localStorage.setItem('refresh_token', data.tokens.refresh)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.username}!`)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.'
      toast.error(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Register ──────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    setLoading(true)
    try {
      const { data } = await authService.register(formData)
      localStorage.setItem('access_token', data.tokens.access)
      localStorage.setItem('refresh_token', data.tokens.refresh)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      toast.success('Account created! Welcome to QuizAI.')
      return { success: true }
    } catch (err) {
      const errors = err.response?.data?.errors || {}
      const msg = err.response?.data?.message || 'Registration failed.'
      // Show first field error if available
      const firstError = Object.values(errors)[0]
      toast.error(Array.isArray(firstError) ? firstError[0] : msg)
      return { success: false, error: msg, errors }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) await authService.logout(refresh)
    } catch { /* silent */ } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
      toast.success('Logged out successfully.')
    }
  }, [])

  // ── Refresh user data ─────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authService.getProfile()
      localStorage.setItem('user', JSON.stringify(data))
      setUser(data)
    } catch { /* silent */ }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
