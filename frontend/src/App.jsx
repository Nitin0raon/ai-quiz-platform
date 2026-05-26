import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'

import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute'

import DashboardLayout  from './layouts/DashboardLayout'

// Auth pages
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Dashboard pages
import DashboardPage from './pages/dashboard/DashboardPage'
import DocumentsPage from './pages/dashboard/DocumentsPage'
import ProfilePage   from './pages/dashboard/ProfilePage'

// Quiz pages
import QuizzesListPage  from './pages/quiz/QuizzesListPage'
import GenerateQuizPage from './pages/quiz/GenerateQuizPage'
import QuizAttemptPage  from './pages/quiz/QuizAttemptPage'
import QuizResultPage   from './pages/quiz/QuizResultPage'

// Analytics
import AnalyticsPage from './pages/analytics/AnalyticsPage'

// React Query client — global config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,       // data is fresh for 30s
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#fff',
                color: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px -2px rgba(99,102,241,0.12)',
                fontSize: '14px',
                fontFamily: 'DM Sans, sans-serif',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />

          <Routes>
            {/* ── Public routes (redirect to /dashboard if logged in) ── */}
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            {/* ── Protected routes (redirect to /login if logged out) ── */}
            <Route
              path="/"
              element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
            >
              {/* Default redirect */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard */}
              <Route path="dashboard"  element={<DashboardPage />} />

              {/* Documents */}
              <Route path="documents"        element={<DocumentsPage />} />
              <Route path="documents/upload" element={<DocumentsPage />} />

              {/* Quizzes */}
              <Route path="quizzes"               element={<QuizzesListPage />} />
              <Route path="quizzes/generate"      element={<GenerateQuizPage />} />
              <Route path="quizzes/attempts"      element={<QuizzesListPage />} />
              <Route path="quizzes/:id"           element={<QuizAttemptPage />} />
              <Route path="quizzes/result/:id"    element={<QuizResultPage />} />

              {/* Analytics */}
              <Route path="analytics" element={<AnalyticsPage />} />

              {/* Profile */}
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all → dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

        </AuthProvider>
      </BrowserRouter>

      {/* React Query devtools (only in development) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
