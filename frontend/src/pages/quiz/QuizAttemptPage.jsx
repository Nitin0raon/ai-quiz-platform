import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { quizService } from '../../services/quizService'
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'

function Timer({ totalSeconds, onExpire }) {
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => {
    if (totalSeconds <= 0) return
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(id); onExpire(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [totalSeconds, onExpire])

  if (totalSeconds <= 0) return null

  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const pct = (remaining / totalSeconds) * 100
  const urgent = pct < 25

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-medium ${
      urgent ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'
    }`}>
      <Clock className={`w-4 h-4 ${urgent ? 'text-red-500' : 'text-slate-500'} ${urgent ? 'animate-pulse' : ''}`} />
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  )
}

export default function QuizAttemptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const startTime = useState(() => Date.now())[0]

  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: 'A' | 'B' | 'C' | 'D' }
  const [submitted, setSubmitted] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => quizService.get(id).then(r => r.data.quiz),
    staleTime: Infinity,
  })

  const submitMut = useMutation({
    mutationFn: (payload) => quizService.submit(id, payload),
    onSuccess: (res) => {
      navigate(`/quizzes/result/${res.data.result.id}`)
    },
    onError: () => toast.error('Submission failed. Try again.'),
  })

  const handleSubmit = useCallback(() => {
    if (submitted) return
    setSubmitted(true)
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    const answersArr = Object.entries(answers).map(([question_id, selected_option]) => ({
      question_id, selected_option,
    }))
    submitMut.mutate({ answers: answersArr, time_taken_seconds: timeTaken })
  }, [submitted, answers, startTime, submitMut])

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )
  if (error || !data) return (
    <div className="text-center py-20">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
      <p className="text-slate-600">Quiz not found.</p>
    </div>
  )

  const questions = data.questions || []
  const q = questions[current]
  const answered = Object.keys(answers).length
  const total = questions.length
  const OPTIONS = ['A', 'B', 'C', 'D']

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-lg font-700 text-slate-900 truncate">{data.title}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {answered}/{total} answered • <span className={`badge ${
              data.difficulty === 'easy' ? 'badge-easy' :
              data.difficulty === 'medium' ? 'badge-medium' : 'badge-hard'
            }`}>{data.difficulty}</span>
          </p>
        </div>
        <Timer
          totalSeconds={data.time_limit_minutes ? data.time_limit_minutes * 60 : 0}
          onExpire={handleSubmit}
        />
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all"
          style={{ width: `${(answered / total) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="card p-6 mb-4">
        <div className="flex items-start gap-3 mb-6">
          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-brand-100 text-brand-700 text-xs
                           font-bold flex items-center justify-center mt-0.5">
            {current + 1}
          </span>
          <p className="text-slate-800 font-medium leading-relaxed">{q?.question_text}</p>
        </div>

        <div className="space-y-2.5">
          {OPTIONS.map((opt) => {
            const optText = q?.[`option_${opt.toLowerCase()}`]
            const selected = answers[q?.id] === opt
            return (
              <button
                key={opt}
                onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border-2
                  transition-all duration-150 ${
                  selected
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 text-slate-700'
                }`}
              >
                <span className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center
                  text-xs font-bold transition-colors ${
                  selected
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-slate-300 text-slate-400'
                }`}>
                  {opt}
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{optText}</span>
                {selected && <CheckCircle className="w-4 h-4 text-brand-500 ml-auto flex-shrink-0 mt-0.5" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="btn-ghost"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <div className="flex gap-1.5 flex-wrap justify-center">
          {questions.map((q, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                i === current ? 'bg-brand-600 text-white' :
                answers[q.id] ? 'bg-brand-100 text-brand-700' :
                'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {current < total - 1 ? (
          <button onClick={() => setCurrent(current + 1)} className="btn-secondary">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitMut.isPending}
            className="btn-primary"
          >
            {submitMut.isPending ? <Spinner size="sm" /> : 'Submit Quiz'}
          </button>
        )}
      </div>

      {/* Submit button (always visible) */}
      {answered > 0 && (
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={submitMut.isPending}
            className="btn-primary btn-lg"
          >
            {submitMut.isPending ? (
              <><Spinner size="sm" /> Submitting…</>
            ) : (
              `Submit Quiz (${answered}/${total} answered)`
            )}
          </button>
          {answered < total && (
            <p className="text-xs text-slate-400 mt-2">
              {total - answered} question{total - answered !== 1 ? 's' : ''} unanswered — they'll be marked incorrect
            </p>
          )}
        </div>
      )}
    </div>
  )
}
