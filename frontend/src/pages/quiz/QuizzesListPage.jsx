import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { quizService } from '../../services/quizService'
import { Zap, Plus, Clock, ChevronRight, BookOpen } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import SkeletonCard from '../../components/common/SkeletonCard'
import EmptyState from '../../components/common/EmptyState'
import { formatDate } from '../../utils/helpers'

export default function QuizzesListPage() {
  const [tab, setTab] = useState('quizzes') // 'quizzes' | 'attempts'

  const { data: quizzesData, isLoading: qLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => quizService.list().then(r => r.data),
    enabled: tab === 'quizzes',
  })

  const { data: attemptsData, isLoading: aLoading } = useQuery({
    queryKey: ['attempts'],
    queryFn: () => quizService.attempts().then(r => r.data),
    enabled: tab === 'attempts',
  })

  const quizzes  = quizzesData?.results  || []
  const attempts = attemptsData?.results || []

  return (
    <div>
      <PageHeader
        title="Quizzes"
        subtitle="Manage your quizzes and view attempt history"
        action={
          <Link to="/quizzes/generate" className="btn-primary">
            <Plus className="w-4 h-4" /> New Quiz
          </Link>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
        {[['quizzes', 'My Quizzes'], ['attempts', 'Attempt History']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTab(val)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === val ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Quizzes list */}
      {tab === 'quizzes' && (
        qLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No quizzes yet"
            description="Generate your first AI quiz from an uploaded PDF."
            action={<Link to="/quizzes/generate" className="btn-primary btn-sm"><Plus className="w-3.5 h-3.5" /> Generate Quiz</Link>}
          />
        ) : (
          <div className="space-y-3">
            {quizzes.map((q) => (
              <div key={q.id} className="card-hover p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{q.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`badge ${
                      q.difficulty === 'easy' ? 'badge-easy' :
                      q.difficulty === 'medium' ? 'badge-medium' : 'badge-hard'
                    }`}>{q.difficulty}</span>
                    <span className="text-xs text-slate-400">{q.total_questions} questions</span>
                    {q.time_limit_minutes > 0 && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {q.time_limit_minutes}m
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{formatDate(q.created_at)}</span>
                  </div>
                </div>
                <Link to={`/quizzes/${q.id}`} className="btn-primary btn-sm flex-shrink-0">
                  Take Quiz <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )
      )}

      {/* Attempts list */}
      {tab === 'attempts' && (
        aLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : attempts.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No attempts yet"
            description="Take a quiz to start building your history."
          />
        ) : (
          <div className="space-y-3">
            {attempts.map((a) => (
              <Link key={a.id} to={`/quizzes/result/${a.id}`}
                className="card-hover p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${a.accuracy >= 80 ? 'bg-green-100 text-green-700' :
                    a.accuracy >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                  <span className="font-display font-700 text-sm">{Math.round(a.accuracy)}%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{a.quiz_title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`badge ${
                      a.quiz_difficulty === 'easy' ? 'badge-easy' :
                      a.quiz_difficulty === 'medium' ? 'badge-medium' : 'badge-hard'
                    }`}>{a.quiz_difficulty}</span>
                    <span className="text-xs text-slate-500">{a.score}/{a.total_questions} correct</span>
                    <span className="text-xs text-slate-400">{formatDate(a.started_at)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
