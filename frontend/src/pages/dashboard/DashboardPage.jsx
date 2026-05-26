import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { analyticsService } from '../../services/analyticsService'
import {
  Zap, FileText, Trophy, TrendingUp, ArrowRight,
  Clock, Target, Flame, Plus,
} from 'lucide-react'
import SkeletonCard from '../../components/common/SkeletonCard'
import { formatDate, formatTime, accuracyBg } from '../../utils/helpers'

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand:   'bg-brand-50 text-brand-600',
    orange:  'bg-orange-50 text-orange-500',
    green:   'bg-green-50 text-green-600',
    purple:  'bg-purple-50 text-purple-600',
  }
  return (
    <div className="card p-5 flex items-start gap-4 hover:shadow-card-hover transition-shadow">
      <div className={`p-2.5 rounded-xl ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-display font-700 text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsService.dashboard().then(r => r.data),
    staleTime: 60_000,
  })

  const summary = data?.summary || {}
  const recent  = data?.recent_attempts || []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-700 text-slate-900">
          {greeting}, {user?.first_name || user?.username} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Here's your study progress at a glance.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-8 sm:flex sm:gap-3">
        <Link to="/quizzes/generate" className="btn-primary text-sm py-2.5 px-4 rounded-xl flex-1 sm:flex-none">
          <Plus className="w-4 h-4" /> Generate Quiz
        </Link>
        <Link to="/documents/upload" className="btn-secondary text-sm py-2.5 px-4 rounded-xl flex-1 sm:flex-none">
          <FileText className="w-4 h-4" /> Upload PDF
        </Link>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Zap}       label="Quizzes Taken"   value={summary.total_quizzes_taken || 0}    color="brand"  />
          <StatCard icon={Target}    label="Avg. Accuracy"   value={`${summary.average_accuracy || 0}%`} color="green"  sub="across all quizzes" />
          <StatCard icon={Trophy}    label="Total Points"    value={data?.user?.total_points || 0}        color="orange" />
          <StatCard icon={Flame}     label="Day Streak"      value={`${data?.user?.streak_days || 0}d`}  color="purple" sub="keep it up!" />
        </div>
      )}

      {/* Recent attempts + topic performance */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent attempts */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Attempts</h2>
            <Link to="/quizzes/attempts" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <SkeletonCard key={i} lines={2} />)}</div>
          ) : recent.length === 0 ? (
            <div className="card p-8 text-center">
              <Zap className="w-10 h-10 text-brand-200 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 mb-1">No attempts yet</p>
              <p className="text-sm text-slate-400 mb-4">Generate and take your first quiz!</p>
              <Link to="/quizzes/generate" className="btn-primary btn-sm">
                <Plus className="w-3.5 h-3.5" /> Start Now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((a) => (
                <div key={a.id} className="card-hover p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                                  ${accuracyBg(a.accuracy)}`}>
                    <span className="font-display font-700 text-sm">{Math.round(a.accuracy)}%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{a.quiz__title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`badge ${
                        a.quiz__difficulty === 'easy' ? 'badge-easy' :
                        a.quiz__difficulty === 'medium' ? 'badge-medium' : 'badge-hard'
                      }`}>{a.quiz__difficulty}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTime(a.time_taken_seconds)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-700">{a.score}/{a.total_questions}</p>
                    <p className="text-xs text-slate-400">{formatDate(a.started_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Topic performance */}
        <div className="lg:col-span-2">
          <h2 className="section-title mb-4">Topic Performance</h2>
          {isLoading ? (
            <SkeletonCard lines={5} />
          ) : (data?.topic_performance || []).length === 0 ? (
            <div className="card p-6 text-center text-slate-400 text-sm">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-brand-200" />
              Take more quizzes to see topic insights.
            </div>
          ) : (
            <div className="card p-4 space-y-4">
              {(data.topic_performance || []).slice(0, 6).map((t) => (
                <div key={t.quiz__topic}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium truncate pr-2">{t.quiz__topic}</span>
                    <span className="text-slate-500 flex-shrink-0">{Math.round(t.avg_accuracy)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all"
                      style={{ width: `${t.avg_accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
