import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { analyticsService } from '../../services/analyticsService'
import { quizService } from '../../services/quizService'
import { documentService } from '../../services/documentService'
import {
  Zap, FileText, BarChart2, Trophy, Flame, ArrowRight,
  Plus, Clock, Target, TrendingUp, BookOpen, Star,
  ChevronRight, Brain, Sparkles, Award, CheckCircle
} from 'lucide-react'
import SkeletonCard from '../../components/common/SkeletonCard'
import { formatDate, formatTime, accuracyBg } from '../../utils/helpers'

// ── Greeting based on time ────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good morning', emoji: '☀️' }
  if (h < 17) return { text: 'Good afternoon', emoji: '👋' }
  return { text: 'Good evening', emoji: '🌙' }
}

// ── Motivational message based on streak ─────────────────
function getMotivation(streak, accuracy) {
  if (streak >= 7) return "You're on fire! 7+ day streak is incredible. 🔥"
  if (streak >= 3) return "Great momentum! Keep the streak alive. ⚡"
  if (accuracy >= 80) return "Excellent accuracy! You're mastering this. 🎯"
  if (accuracy >= 60) return "Good progress! A little more practice goes a long way. 📈"
  return "Every quiz makes you sharper. Let's go! 💪"
}

// ── Quick action card ─────────────────────────────────────
function QuickAction({ icon: Icon, title, desc, to, color, badge }) {
  return (
    <Link to={to} className="card-hover p-5 flex items-start gap-4 group">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-800 group-hover:text-brand-700 transition-colors">
            {title}
          </p>
          {badge && (
            <span className="badge badge-brand text-xs">{badge}</span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-400 flex-shrink-0
                               mt-0.5 transition-colors group-hover:translate-x-0.5 transform duration-150" />
    </Link>
  )
}

// ── Stat card ─────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-card border border-slate-100">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="font-display font-700 text-slate-900 text-lg leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const greeting = getGreeting()

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsService.dashboard().then(r => r.data),
    staleTime: 60_000,
  })

  const { data: quizzesData, isLoading: quizLoading } = useQuery({
    queryKey: ['quizzes', 'recent'],
    queryFn: () => quizService.list({ page_size: 3 }).then(r => r.data),
    staleTime: 60_000,
  })

  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ['documents', 'recent'],
    queryFn: () => documentService.list({ page_size: 3 }).then(r => r.data),
    staleTime: 60_000,
  })

  const summary  = dashboard?.summary || {}
  const recentAttempts = dashboard?.recent_attempts || []
  const quizzes  = quizzesData?.results || []
  const docs     = docsData?.results || []
  const isNewUser = summary.total_quizzes_taken === 0

  const motivation = getMotivation(
    dashboard?.user?.streak_days || 0,
    summary.average_accuracy || 0
  )

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── HERO GREETING ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-7 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute top-4 right-1/4 w-20 h-20 bg-brand-400/20 rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="text-brand-200 text-sm font-medium mb-1">
              {greeting.text} {greeting.emoji}
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-800 mb-2">
              {user?.first_name ? `Hey, ${user.first_name}!` : `Hey, ${user?.username}!`}
            </h1>
            <p className="text-brand-100 text-sm max-w-sm leading-relaxed">
              {motivation}
            </p>

            {/* Mini stats strip */}
            <div className="flex gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span className="font-semibold">{dashboard?.user?.total_points || 0}</span>
                <span className="text-brand-200">points</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Flame className="w-4 h-4 text-orange-300" />
                <span className="font-semibold">{dashboard?.user?.streak_days || 0}</span>
                <span className="text-brand-200">day streak</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Target className="w-4 h-4 text-green-300" />
                <span className="font-semibold">{summary.average_accuracy || 0}%</span>
                <span className="text-brand-200">avg accuracy</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Link to="/quizzes/generate" className="btn bg-white text-brand-700 hover:bg-brand-50
                                                    font-semibold shadow-lg px-5 py-2.5 rounded-xl">
              <Sparkles className="w-4 h-4" />
              Generate Quiz
            </Link>
          </div>
        </div>
      </div>

      {/* ── NEW USER ONBOARDING ─────────────────────────── */}
      {isNewUser && !dashLoading && (
        <div className="card p-6 border-2 border-dashed border-brand-200 bg-brand-50/50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-brand-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-700 text-slate-900 mb-1">
                Welcome to QuizAI! Let's get you started 🎉
              </h2>
              <p className="text-sm text-slate-500 mb-5">
                Follow these 3 steps to generate your first AI quiz.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { num: '1', title: 'Upload a PDF', desc: 'Any study material works', to: '/documents', icon: FileText },
                  { num: '2', title: 'Generate a quiz', desc: 'Pick a topic & difficulty', to: '/quizzes/generate', icon: Zap },
                  { num: '3', title: 'Track progress', desc: 'See your analytics', to: '/analytics', icon: BarChart2 },
                ].map((step) => (
                  <Link key={step.num} to={step.to}
                    className="bg-white rounded-xl p-4 border border-brand-100 hover:border-brand-300
                               hover:shadow-card transition-all group">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-brand-600 text-white text-xs font-bold
                                       flex items-center justify-center">{step.num}</span>
                      <step.icon className="w-4 h-4 text-brand-500" />
                    </div>
                    <p className="font-semibold text-slate-800 text-sm group-hover:text-brand-700">{step.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STATS ROW ───────────────────────────────────── */}
      {!isNewUser && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {dashLoading ? (
            [...Array(4)].map((_, i) => <SkeletonCard key={i} lines={1} />)
          ) : (
            <>
              <StatPill icon={Zap}       label="Quizzes Taken"  value={summary.total_quizzes_taken || 0}    color="bg-brand-50 text-brand-600" />
              <StatPill icon={Target}    label="Avg Accuracy"   value={`${summary.average_accuracy || 0}%`} color="bg-green-50 text-green-600" />
              <StatPill icon={Trophy}    label="Total Points"   value={dashboard?.user?.total_points || 0}  color="bg-amber-50 text-amber-600" />
              <StatPill icon={BookOpen}  label="Docs Uploaded"  value={docsData?.count || 0}                color="bg-purple-50 text-purple-600" />
            </>
          )}
        </div>
      )}

      {/* ── MAIN GRID ───────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left col — quick actions + recent activity */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick actions */}
          <div>
            <h2 className="section-title mb-3">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <QuickAction
                icon={Zap}
                title="Generate New Quiz"
                desc="Pick a document, topic & difficulty"
                to="/quizzes/generate"
                color="bg-brand-50 text-brand-600"
                badge="AI"
              />
              <QuickAction
                icon={FileText}
                title="Upload PDF"
                desc="Add new study material"
                to="/documents"
                color="bg-blue-50 text-blue-600"
              />
              <QuickAction
                icon={BookOpen}
                title="My Quizzes"
                desc="Browse and retake past quizzes"
                to="/quizzes"
                color="bg-purple-50 text-purple-600"
              />
              <QuickAction
                icon={BarChart2}
                title="View Analytics"
                desc="Charts, trends and leaderboard"
                to="/analytics"
                color="bg-green-50 text-green-600"
              />
            </div>
          </div>

          {/* Recent attempts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Recent Attempts</h2>
              <Link to="/quizzes/attempts"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                All history <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {dashLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <SkeletonCard key={i} lines={1} />)}</div>
            ) : recentAttempts.length === 0 ? (
              <div className="card p-6 text-center">
                <BookOpen className="w-9 h-9 text-brand-200 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600 mb-1">No attempts yet</p>
                <p className="text-xs text-slate-400 mb-3">Generate a quiz to see your history here</p>
                <Link to="/quizzes/generate" className="btn-primary btn-sm inline-flex">
                  <Plus className="w-3.5 h-3.5" /> Generate Quiz
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAttempts.slice(0, 4).map((a) => (
                  <div key={a.id} className="card-hover px-4 py-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                                    font-display font-700 text-sm ${accuracyBg(a.accuracy)}`}>
                      {Math.round(a.accuracy)}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.quiz__title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`badge text-xs ${
                          a.quiz__difficulty === 'easy' ? 'badge-easy' :
                          a.quiz__difficulty === 'medium' ? 'badge-medium' : 'badge-hard'
                        }`}>{a.quiz__difficulty}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{formatTime(a.time_taken_seconds)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-700">{a.score}/{a.total_questions}</p>
                      <p className="text-xs text-slate-400">{formatDate(a.started_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col — documents + topic performance */}
        <div className="space-y-6">

          {/* Recent documents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Your Documents</h2>
              <Link to="/documents"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {docsLoading ? (
              <SkeletonCard lines={3} />
            ) : docs.length === 0 ? (
              <div className="card p-5 text-center">
                <FileText className="w-8 h-8 text-brand-200 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-3">No documents yet</p>
                <Link to="/documents" className="btn-secondary btn-sm inline-flex">
                  <Plus className="w-3.5 h-3.5" /> Upload PDF
                </Link>
              </div>
            ) : (
              <div className="card divide-y divide-slate-100">
                {docs.map((doc) => (
                  <div key={doc.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{doc.title}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${
                          doc.status === 'processed' ? 'text-green-600' :
                          doc.status === 'failed' ? 'text-red-500' : 'text-amber-500'
                        }`}>
                          {doc.status === 'processed' ? '✓ Ready' :
                           doc.status === 'failed' ? '✗ Failed' : '⟳ Processing'}
                        </span>
                        <span className="text-xs text-slate-400">{doc.file_size_mb}MB</span>
                      </div>
                    </div>
                    {doc.status === 'processed' && (
                      <Link to={`/quizzes/generate?doc=${doc.id}`}
                        className="btn-primary btn-sm flex-shrink-0">
                        <Zap className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Topic performance */}
          {!isNewUser && (
            <div>
              <h2 className="section-title mb-3">Topic Performance</h2>
              {dashLoading ? (
                <SkeletonCard lines={4} />
              ) : (dashboard?.topic_performance || []).length === 0 ? (
                <div className="card p-5 text-center text-sm text-slate-400">
                  <TrendingUp className="w-7 h-7 mx-auto mb-2 text-brand-200" />
                  Take more quizzes to see topic insights
                </div>
              ) : (
                <div className="card p-4 space-y-3">
                  {(dashboard.topic_performance || []).slice(0, 5).map((t) => (
                    <div key={t.quiz__topic}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-700 font-medium truncate pr-2">
                          {t.quiz__topic}
                        </span>
                        <span className={`font-semibold flex-shrink-0 ${
                          t.avg_accuracy >= 80 ? 'text-green-600' :
                          t.avg_accuracy >= 60 ? 'text-amber-600' : 'text-red-500'
                        }`}>
                          {Math.round(t.avg_accuracy)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            t.avg_accuracy >= 80 ? 'bg-green-400' :
                            t.avg_accuracy >= 60 ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${t.avg_accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <Link to="/analytics"
                    className="flex items-center justify-center gap-1.5 text-xs text-brand-600
                               hover:text-brand-700 font-medium pt-1">
                    Full analytics <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* My quizzes list */}
          {quizzes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title">Recent Quizzes</h2>
                <Link to="/quizzes"
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                  All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="card divide-y divide-slate-100">
                {quizzes.map((q) => (
                  <Link key={q.id} to={`/quizzes/${q.id}`}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{q.title}</p>
                      <span className={`badge text-xs ${
                        q.difficulty === 'easy' ? 'badge-easy' :
                        q.difficulty === 'medium' ? 'badge-medium' : 'badge-hard'
                      }`}>{q.difficulty}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
