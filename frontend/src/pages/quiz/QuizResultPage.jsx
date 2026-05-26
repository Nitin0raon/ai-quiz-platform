import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { quizService } from '../../services/quizService'
import { CheckCircle, XCircle, Trophy, Clock, Zap, RotateCcw, BarChart2 } from 'lucide-react'
import Spinner from '../../components/common/Spinner'
import { formatTime, accuracyBg } from '../../utils/helpers'

function ScoreRing({ pct }) {
  const r = 52, c = 2 * Math.PI * r
  const dash = (pct / 100) * c

  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444'
  const label = pct >= 80 ? '🏆 Excellent!' : pct >= 60 ? '👍 Good job!' : '📚 Keep studying!'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${c}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-800 text-slate-900">{pct}%</span>
          <span className="text-xs text-slate-400">accuracy</span>
        </div>
      </div>
      <p className="text-slate-600 text-sm font-medium mt-2">{label}</p>
    </div>
  )
}

export default function QuizResultPage() {
  const { id } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['attempt', id],
    queryFn: () => quizService.getAttempt(id).then(r => r.data.attempt),
    staleTime: Infinity,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  )
  if (!data) return <p className="text-center text-slate-500 py-20">Result not found.</p>

  const pct = Math.round(data.accuracy)

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Result summary card */}
      <div className="card p-8 mb-6 text-center">
        <h1 className="font-display text-2xl font-700 text-slate-900 mb-1">{data.quiz_title}</h1>
        <p className="text-slate-400 text-sm mb-8 badge badge-brand capitalize">{data.quiz_difficulty}</p>

        <ScoreRing pct={pct} />

        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div>
            <p className="font-display text-2xl font-700 text-slate-900">{data.score}/{data.total_questions}</p>
            <p className="text-xs text-slate-400 mt-0.5">Score</p>
          </div>
          <div>
            <p className="font-display text-2xl font-700 text-slate-900 flex items-center justify-center gap-1">
              <Trophy className="w-5 h-5 text-amber-400" /> {data.points_earned}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Points earned</p>
          </div>
          <div>
            <p className="font-display text-2xl font-700 text-slate-900 flex items-center justify-center gap-1">
              <Clock className="w-5 h-5 text-brand-400" /> {formatTime(data.time_taken_seconds)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Time taken</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-8">
        <Link to="/quizzes/generate" className="btn-primary flex-1">
          <Zap className="w-4 h-4" /> New Quiz
        </Link>
        <Link to="/analytics" className="btn-secondary flex-1">
          <BarChart2 className="w-4 h-4" /> Analytics
        </Link>
        <Link to="/quizzes" className="btn-ghost flex-1">
          <RotateCcw className="w-4 h-4" /> All Quizzes
        </Link>
      </div>

      {/* Answer review */}
      <h2 className="section-title mb-4">Answer Review</h2>
      <div className="space-y-4">
        {(data.answers || []).map((a, i) => (
          <div key={i} className={`card p-5 border-l-4 ${a.is_correct ? 'border-green-400' : 'border-red-400'}`}>
            <div className="flex items-start gap-3 mb-3">
              {a.is_correct
                ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              }
              <p className="text-slate-800 font-medium text-sm leading-relaxed">
                <span className="text-xs text-slate-400 font-normal">Q{i + 1}. </span>
                {a.question_text}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 ml-8">
              {['a', 'b', 'c', 'd'].map((opt) => {
                const letter = opt.toUpperCase()
                const isCorrect = letter === a.correct_answer
                const isSelected = letter === a.selected_option
                const text = a[`option_${opt}`]
                return (
                  <div
                    key={opt}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                      isCorrect ? 'bg-green-50 text-green-800 border border-green-200' :
                      isSelected && !isCorrect ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="font-bold">{letter}.</span>
                    <span className="flex-1">{text}</span>
                    {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                    {isSelected && !isCorrect && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                  </div>
                )
              })}
            </div>

            {a.explanation && (
              <div className="ml-8 p-3 rounded-lg bg-brand-50 border border-brand-100">
                <p className="text-xs font-semibold text-brand-700 mb-0.5">Explanation</p>
                <p className="text-xs text-brand-800 leading-relaxed">{a.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
