import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../../services/analyticsService'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { TrendingUp, Trophy, Users, Target } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SkeletonCard from '../../components/common/SkeletonCard'
import { formatDate } from '../../utils/helpers'

const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-card p-3 text-xs">
        <p className="text-slate-500 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="font-semibold" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? `${Math.round(p.value)}${p.name.includes('ccuracy') ? '%' : ''}` : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)

  const { data: dashboard, isLoading: dLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsService.dashboard().then(r => r.data),
    staleTime: 60_000,
  })

  const { data: accuracy, isLoading: aLoading } = useQuery({
    queryKey: ['accuracy', days],
    queryFn: () => analyticsService.accuracy(days).then(r => r.data),
    staleTime: 60_000,
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => analyticsService.leaderboard().then(r => r.data),
    staleTime: 300_000,
  })

  const summary = dashboard?.summary || {}
  const topicData = (dashboard?.topic_performance || []).slice(0, 8).map(t => ({
    name: t.quiz__topic?.length > 16 ? t.quiz__topic.slice(0, 16) + '…' : t.quiz__topic,
    accuracy: Math.round(t.avg_accuracy),
    attempts: t.attempts,
  }))

  const accuracyData = (accuracy?.data || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    accuracy: Math.round(d.avg_accuracy),
    attempts: d.attempts,
  }))

  const lb = leaderboard?.leaderboard || []

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Track your performance and progress over time" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {dLoading ? (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} lines={2} />)
        ) : [
          { icon: Target, label: 'Avg. Accuracy', value: `${summary.average_accuracy || 0}%`, color: 'text-brand-600 bg-brand-50' },
          { icon: TrendingUp, label: 'Best Accuracy', value: `${summary.best_accuracy || 0}%`, color: 'text-green-600 bg-green-50' },
          { icon: Trophy, label: 'Total Points', value: summary.total_points_earned || 0, color: 'text-amber-600 bg-amber-50' },
          { icon: Users, label: 'Quizzes Taken', value: summary.total_quizzes_taken || 0, color: 'text-purple-600 bg-purple-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-5 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="font-display font-700 text-xl text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">

        {/* Accuracy trend */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title text-base">Accuracy Trend</h2>
            <div className="flex gap-1">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`btn-sm px-2.5 py-1 rounded-lg text-xs ${
                    days === d ? 'bg-brand-600 text-white' : 'btn-ghost'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {aLoading ? (
            <div className="shimmer h-48 rounded-xl" />
          ) : accuracyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No data for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={accuracyData}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="accuracy" name="Accuracy"
                  stroke="#6366f1" strokeWidth={2} fill="url(#accGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Topic performance */}
        <div className="card p-5">
          <h2 className="section-title text-base mb-4">Topic Performance</h2>
          {dLoading ? (
            <div className="shimmer h-48 rounded-xl" />
          ) : topicData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Take quizzes across different topics to see performance data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topicData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false} axisLine={false} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accuracy" name="Accuracy" radius={[0, 4, 4, 0]}>
                  {topicData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="section-title text-base">Leaderboard</h2>
          {leaderboard?.your_rank && (
            <span className="ml-auto badge badge-brand">
              Your rank: #{leaderboard.your_rank}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {lb.slice(0, 10).map((u) => (
            <div key={u.rank} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                ${u.rank === 1 ? 'bg-amber-100 text-amber-700' :
                  u.rank === 2 ? 'bg-slate-200 text-slate-700' :
                  u.rank === 3 ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-500'}`}>
                {u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : u.rank === 3 ? '🥉' : u.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{u.display_name}</p>
                <p className="text-xs text-slate-400">{u.total_quizzes} quizzes · {Math.round(u.avg_accuracy)}% avg</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-brand-600">{u.total_points}</p>
                <p className="text-xs text-slate-400">pts</p>
              </div>
            </div>
          ))}
          {lb.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-6">No leaderboard data yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
