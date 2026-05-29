import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Brain, Zap, FileText, BarChart2, Trophy, Shield,
  ArrowRight, Check, Star, ChevronRight, Sparkles,
  Target, Clock, TrendingUp, Users, BookOpen, Award
} from 'lucide-react'

const FEATURES = [
  {
    icon: FileText,
    title: 'Upload Any PDF',
    desc: 'Upload your study material, textbooks, or notes. Our system extracts and understands the content automatically.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Brain,
    title: 'AI Quiz Generation',
    desc: 'Gemini AI reads your document and generates targeted MCQs at your chosen difficulty level in seconds.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Clock,
    title: 'Timed Practice',
    desc: 'Set custom time limits to simulate real exam conditions. Track how fast you answer each question.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: BarChart2,
    title: 'Deep Analytics',
    desc: 'Track accuracy trends, identify weak topics, and measure improvement over time with rich charts.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Trophy,
    title: 'Leaderboard',
    desc: 'Compete with other learners, earn points for every correct answer, and climb the global rankings.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Target,
    title: 'Smart Retrieval',
    desc: 'RAG pipeline finds the most relevant sections of your document for each quiz topic automatically.',
    color: 'bg-red-50 text-red-600',
  },
]

const STEPS = [
  { step: '01', title: 'Upload your PDF', desc: 'Drop in any study material — textbooks, notes, articles.' },
  { step: '02', title: 'Choose a topic', desc: 'Tell the AI what topic to focus on and pick your difficulty.' },
  { step: '03', title: 'Take the quiz', desc: 'Answer AI-generated MCQs with a timer if you want.' },
  { step: '04', title: 'Review & improve', desc: 'See detailed explanations and track your progress over time.' },
]

const STATS = [
  { value: '10x', label: 'Faster than manual flashcards' },
  { value: '94%', label: 'Users improved their scores' },
  { value: '50K+', label: 'Quizzes generated' },
  { value: '200+', label: 'Topics supported' },
]

const TESTIMONIALS = [
  {
    name: 'Priya S.',
    role: 'Medical Student',
    text: 'I uploaded my anatomy notes and got 10 perfect MCQs in 15 seconds. This is insane.',
    rating: 5,
  },
  {
    name: 'Rahul M.',
    role: 'Software Engineer',
    text: 'Used it to prep for system design interviews. The AI actually understands context, not just keywords.',
    rating: 5,
  },
  {
    name: 'Ananya K.',
    role: 'UPSC Aspirant',
    text: 'Finally a tool that turns my 200-page PDFs into focused practice. My accuracy went from 60% to 84%.',
    rating: 5,
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: ['5 PDF uploads', '50 quizzes/month', 'Basic analytics', 'Community leaderboard'],
    cta: 'Get started free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '₹299',
    period: '/month',
    features: ['Unlimited PDFs', 'Unlimited quizzes', 'Advanced analytics', 'Priority AI generation', 'Export results'],
    cta: 'Start Pro trial',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Team',
    price: '₹999',
    period: '/month',
    features: ['Everything in Pro', 'Up to 10 users', 'Team analytics', 'Shared quiz library', 'Priority support'],
    cta: 'Contact us',
    highlighted: false,
  },
]

function Navbar() {
  const { isAuthenticated } = useAuth()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
            <Brain className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-700 text-slate-900 text-lg tracking-tight">
            Quiz<span className="text-brand-600">AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link to="/home" className="btn-primary btn-sm">
              Go to App <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn-primary btn-sm">
                Get started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-5 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-100/60 blur-3xl" />
          <div className="absolute top-60 -left-40 w-[400px] h-[400px] rounded-full bg-indigo-100/40 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered quiz generation is here
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-800 text-slate-900 leading-[1.1] mb-6">
            Turn any PDF into a{' '}
            <span className="text-brand-600 relative">
              smart quiz
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 10 Q75 2 150 8 Q225 14 298 6" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" fill="none"/>
              </svg>
            </span>
            {' '}in seconds
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your study material. Choose a topic. Let AI generate targeted MCQ quizzes
            with explanations. Track your progress and ace every exam.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link to="/register" className="btn-primary btn-lg text-base px-8">
              Start for free <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#how-it-works" className="btn-secondary btn-lg text-base px-8">
              See how it works
            </a>
          </div>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-6 text-sm text-slate-400 flex-wrap">
            {['No credit card required', 'Free forever plan', 'Setup in 2 minutes'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-green-500" strokeWidth={3} />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Hero image / mockup */}
        <div className="max-w-4xl mx-auto mt-16 relative">
          <div className="card shadow-2xl shadow-brand-100 overflow-hidden border border-slate-200/80">
            {/* Fake browser bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 bg-white rounded-lg px-3 py-1 text-xs text-slate-400 border border-slate-200">
                quizai.app/dashboard
              </div>
            </div>

            {/* Mock dashboard UI */}
            <div className="bg-surface-50 p-6">
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Quizzes Taken', val: '24', color: 'bg-brand-50 text-brand-600' },
                  { label: 'Avg. Accuracy', val: '78%', color: 'bg-green-50 text-green-600' },
                  { label: 'Total Points', val: '1,240', color: 'bg-amber-50 text-amber-600' },
                  { label: 'Day Streak', val: '7d 🔥', color: 'bg-purple-50 text-purple-600' },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                    <p className={`text-lg font-display font-700 ${s.color.split(' ')[1]}`}>{s.val}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <p className="text-xs font-semibold text-slate-600 mb-3">Accuracy Trend</p>
                  <div className="flex items-end gap-1 h-16">
                    {[40,55,48,65,72,68,78,74,82,79,85,88].map((h,i) => (
                      <div key={i} className="flex-1 bg-brand-100 rounded-sm relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 right-0 bg-brand-500 rounded-sm"
                          style={{height: `${h}%`}} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <p className="text-xs font-semibold text-slate-600 mb-3">Top Topics</p>
                  <div className="space-y-2">
                    {[['Physics', 88], ['History', 74], ['Biology', 62]].map(([t, v]) => (
                      <div key={t}>
                        <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                          <span>{t}</span><span>{v}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full">
                          <div className="h-full bg-brand-500 rounded-full" style={{width: `${v}%`}} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section className="py-14 bg-brand-950">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-800 text-white mb-1">{s.value}</p>
              <p className="text-brand-300 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="features" className="py-20 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-sm mb-2 tracking-wide uppercase">Features</p>
            <h2 className="font-display text-3xl md:text-4xl font-700 text-slate-900 mb-3">
              Everything you need to study smarter
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              One platform for uploading, generating, practicing, and tracking — no more juggling tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-hover p-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-600 text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-5 bg-surface-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-sm mb-2 tracking-wide uppercase">How it works</p>
            <h2 className="font-display text-3xl md:text-4xl font-700 text-slate-900 mb-3">
              From PDF to quiz in 4 steps
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-brand-200 z-0" />
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-brand-200 flex items-center
                                justify-center mx-auto mb-4 shadow-card">
                  <span className="font-display font-800 text-brand-600 text-lg">{s.step}</span>
                </div>
                <h3 className="font-display font-600 text-slate-900 mb-1.5">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-sm mb-2 tracking-wide uppercase">Testimonials</p>
            <h2 className="font-display text-3xl font-700 text-slate-900">
              Loved by learners
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
                    <span className="font-bold text-brand-700 text-sm">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-5 bg-surface-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-sm mb-2 tracking-wide uppercase">Pricing</p>
            <h2 className="font-display text-3xl font-700 text-slate-900 mb-3">Simple, honest pricing</h2>
            <p className="text-slate-500">Start free, upgrade when you're ready.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((p) => (
              <div key={p.name} className={`card p-6 relative ${
                p.highlighted ? 'border-2 border-brand-500 shadow-glow' : ''
              }`}>
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white
                                   text-xs font-semibold px-3 py-1 rounded-full">
                    {p.badge}
                  </span>
                )}
                <h3 className="font-display font-700 text-slate-900 mb-1">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="font-display text-3xl font-800 text-slate-900">{p.price}</span>
                  <span className="text-slate-400 text-sm">{p.period}</span>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={p.highlighted ? 'btn-primary w-full' : 'btn-secondary w-full'}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-brand-950 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-700/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-700/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="font-display text-3xl md:text-4xl font-800 text-white mb-4">
            Ready to study smarter?
          </h2>
          <p className="text-brand-200 mb-8">
            Join thousands of students and professionals who use QuizAI to prepare faster and score higher.
          </p>
          <Link to="/register" className="btn-primary btn-lg text-base px-10">
            Create free account <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-brand-400 text-sm mt-4">No credit card · Free forever plan</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-100 py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-700 text-slate-800">
              Quiz<span className="text-brand-600">AI</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm">© 2025 QuizAI. Built with ❤️ for learners everywhere.</p>
          <div className="flex gap-5 text-sm text-slate-400">
            <a href="#" className="hover:text-slate-600">Privacy</a>
            <a href="#" className="hover:text-slate-600">Terms</a>
            <a href="#" className="hover:text-slate-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
