import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { documentService } from '../../services/documentService'
import { quizService } from '../../services/quizService'
import { Zap, ChevronDown, Brain, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import Spinner from '../../components/common/Spinner'

const DIFFICULTIES = [
  { value: 'easy',   label: 'Easy',   desc: 'Factual recall',          color: 'border-green-400 bg-green-50 text-green-700' },
  { value: 'medium', label: 'Medium', desc: 'Application & reasoning', color: 'border-amber-400 bg-amber-50 text-amber-700' },
  { value: 'hard',   label: 'Hard',   desc: 'Analysis & synthesis',    color: 'border-red-400 bg-red-50 text-red-600' },
]

export default function GenerateQuizPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const preselectedDoc = params.get('doc') || ''

  const [form, setForm] = useState({
    document_id: preselectedDoc,
    topic: '',
    difficulty: 'medium',
    num_questions: 10,
    title: '',
    time_limit_minutes: 0,
  })

  const { data: docsData } = useQuery({
    queryKey: ['documents', 'processed'],
    queryFn: () => documentService.list({ status: 'processed' }).then(r => r.data),
  })

  const generateMut = useMutation({
    mutationFn: quizService.generate,
    onSuccess: (res) => {
      toast.success(`Quiz generated with ${res.data.quiz.total_questions} questions!`)
      navigate(`/quizzes/${res.data.quiz.id}`)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Generation failed. Try again.')
    },
  })

  const docs = docsData?.results || []

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.document_id) { toast.error('Please select a document.'); return }
    if (!form.topic.trim()) { toast.error('Please enter a topic.'); return }
    generateMut.mutate(form)
  }

  return (
    <div>
      <PageHeader
        title="Generate Quiz"
        subtitle="Let AI create a targeted quiz from your study material"
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Document select */}
          <div className="card p-5">
            <label className="label flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-500" /> Select Document
            </label>
            {docs.length === 0 ? (
              <p className="text-sm text-slate-500 mt-2">
                No processed documents.{' '}
                <a href="/documents/upload" className="text-brand-600 font-medium">Upload a PDF first →</a>
              </p>
            ) : (
              <div className="relative">
                <select
                  value={form.document_id}
                  onChange={(e) => setForm({ ...form, document_id: e.target.value })}
                  className="input appearance-none pr-10"
                >
                  <option value="">— Choose a document —</option>
                  {docs.map((d) => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Topic & title */}
          <div className="card p-5 space-y-4">
            <div>
              <label className="label flex items-center gap-2">
                <Brain className="w-4 h-4 text-brand-500" /> Quiz Topic
              </label>
              <input
                type="text" value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="e.g. Machine Learning algorithms, World War 2, Python OOP…"
                className="input"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Be specific — the AI retrieves relevant sections from your document
              </p>
            </div>

            <div>
              <label className="label">Quiz Title (optional)</label>
              <input
                type="text" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Leave blank to auto-generate"
                className="input"
              />
            </div>
          </div>

          {/* Difficulty */}
          <div className="card p-5">
            <label className="label">Difficulty Level</label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value} type="button"
                  onClick={() => setForm({ ...form, difficulty: d.value })}
                  className={`p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                    form.difficulty === d.value ? d.color + ' border-opacity-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-sm">{d.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Settings row */}
          <div className="card p-5 grid grid-cols-2 gap-4">
            <div>
              <label className="label">Number of Questions</label>
              <input
                type="number" min={5} max={20} value={form.num_questions}
                onChange={(e) => setForm({ ...form, num_questions: Number(e.target.value) })}
                className="input"
              />
              <p className="text-xs text-slate-400 mt-1">5 – 20 questions</p>
            </div>
            <div>
              <label className="label">Time Limit (minutes)</label>
              <input
                type="number" min={0} max={180} value={form.time_limit_minutes}
                onChange={(e) => setForm({ ...form, time_limit_minutes: Number(e.target.value) })}
                className="input"
              />
              <p className="text-xs text-slate-400 mt-1">0 = no limit</p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={generateMut.isPending || !form.document_id || !form.topic.trim()}
            className="btn-primary btn-lg w-full"
          >
            {generateMut.isPending ? (
              <>
                <Spinner size="sm" />
                <span>AI is generating your quiz…</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Generate Quiz
              </>
            )}
          </button>

          {generateMut.isPending && (
            <p className="text-center text-sm text-slate-400">
              This takes 10–20 seconds. Hang tight! ✨
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
