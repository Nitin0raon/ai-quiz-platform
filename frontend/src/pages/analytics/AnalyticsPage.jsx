import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../../services/analyticsService'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TrendingUp, Award, Users, Target } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SkeletonCard from '../../components/common/SkeletonCard'

const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-card p-3 text-xs">
        <p className="text-slate-500 mb-1">{label}</p>

        {payload.map((p) => (
          <p
            key={p.name}
            className="font-semibold"
            style={{ color: p.color }}
          >
            {p.name}:{' '}
            {typeof p.value === 'number'
              ? `${Math.round(p.value)}${
                  p.name.includes('ccuracy') ? '%' : ''
                }`
              : p.value}
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
    queryFn: () => analyticsService.dashboard().then((r) => r.data),
    staleTime: 60000,
  })

  const { data: accuracy, isLoading: aLoading } = useQuery({
    queryKey: ['accuracy', days],
    queryFn: () => analyticsService.accuracy(days).then((r) => r.data),
    staleTime: 60000,
  })

  const summary = dashboard?.summary || {}

  const topicData = (dashboard?.topic_performance || [])
    .slice(0, 8)
    .map((t) => ({
      name:
        t.quiz__topic?.length > 16
          ? `${t.quiz__topic.slice(0, 16)}…`
          : t.quiz__topic,
      accuracy: Math.round(t.avg_accuracy),
      attempts: t.attempts,
    }))

  const accuracyData = (accuracy?.data || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    accuracy: Math.round(d.avg_accuracy),
    attempts: d.attempts,
  }))

  const statCards = [
    {
      icon: Target,
      label: 'Avg. Accuracy',
      value: `${summary.average_accuracy || 0}%`,
      color: 'text-brand-600 bg-brand-50',
    },
    {
      icon: TrendingUp,
      label: 'Best Accuracy',
      value: `${summary.best_accuracy || 0}%`,
      color: 'text-green-600 bg-green-50',
    },
    {
      icon: Award,
      label: 'Total Points',
      value: summary.total_points_earned || 0,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      icon: Users,
      label: 'Quizzes Taken',
      value: summary.total_quizzes_taken || 0,
      color: 'text-purple-600 bg-purple-50',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Track your performance and progress over time"
      />
{/* Summary Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
  {dLoading
    ? [...Array(4)].map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))
    : statCards.map(({ icon: Icon, label, value, color }) => (
        <div
          key={label}
          className="card p-6 flex items-center gap-5 border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300"
        >
          <div
            className={`p-4 rounded-2xl flex items-center justify-center ${color}`}
          >
            <Icon className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <h3 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-none">
              {value}
            </h3>

            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {label}
            </p>
          </div>
        </div>
      ))}
</div>

      {/* Charts */}
      <div className="grid xl:grid-cols-2 gap-6">

        {/* Accuracy Trend */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title text-lg">
              Accuracy Trend
            </h2>

            <div className="flex gap-2">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    days === d
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {aLoading ? (
            <div className="shimmer h-72 rounded-xl" />
          ) : accuracyData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
              No data available for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={accuracyData}>
                <defs>
                  <linearGradient
                    id="accGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#6366f1"
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="95%"
                      stopColor="#6366f1"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                />

                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey="accuracy"
                  name="Accuracy"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#accGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Topic Performance */}
        <div className="card p-6">
          <h2 className="section-title text-lg mb-5">
            Topic Performance
          </h2>

          {dLoading ? (
            <div className="shimmer h-72 rounded-xl" />
          ) : topicData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
              Take quizzes to view topic-wise performance.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={topicData}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip content={<CustomTooltip />} />

                <Bar
                  dataKey="accuracy"
                  name="Accuracy"
                  radius={[0, 8, 8, 0]}
                >
                  {topicData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}