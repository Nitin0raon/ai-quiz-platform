import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { documentService } from '../../services/documentService'
import {
  Upload, FileText, Trash2, RefreshCw, Zap,
  CheckCircle, AlertCircle, Clock, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import SkeletonCard from '../../components/common/SkeletonCard'
import EmptyState from '../../components/common/EmptyState'
import { formatDate, formatFileSize } from '../../utils/helpers'

const STATUS_ICON = {
  uploaded:   <Clock className="w-3.5 h-3.5 text-slate-400" />,
  extracting: <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />,
  extracted:  <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />,
  chunking:   <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />,
  processed:  <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
  failed:     <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
}
const STATUS_LABEL = {
  uploaded: 'Uploaded', extracting: 'Extracting text…',
  extracted: 'Chunking…', chunking: 'Indexing…',
  processed: 'Ready', failed: 'Failed',
}

function UploadZone({ onUpload }) {
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(null)
  const fileRef = useRef()

  const handleFile = useCallback(async (file) => {
    if (!file) return
    if (file.type !== 'application/pdf') { toast.error('Only PDF files are allowed.'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB.'); return }

    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', file.name.replace('.pdf', ''))

    try {
      setProgress(0)
      await documentService.upload(fd, (e) => {
        setProgress(Math.round((e.loaded / e.total) * 100))
      })
      toast.success('PDF uploaded and processed!')
      onUpload()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.')
    } finally {
      setProgress(null)
    }
  }, [onUpload])

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => progress === null && fileRef.current.click()}
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
        ${dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'}`}
    >
      <input ref={fileRef} type="file" accept=".pdf" className="hidden"
        onChange={(e) => handleFile(e.target.files[0])} />

      {progress !== null ? (
        <div className="space-y-3">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto" />
          <p className="text-brand-700 font-semibold">Uploading… {progress}%</p>
          <div className="h-2 bg-brand-100 rounded-full overflow-hidden max-w-xs mx-auto">
            <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7 text-brand-500" />
          </div>
          <p className="font-semibold text-slate-700 mb-1">Drop your PDF here</p>
          <p className="text-sm text-slate-400 mb-3">or click to browse • Max 10 MB</p>
          <span className="btn-secondary btn-sm pointer-events-none">Choose PDF</span>
        </>
      )}
    </div>
  )
}

export default function DocumentsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.list().then(r => r.data),
    refetchInterval: (d) => {
      const docs = d?.state?.data?.results || []
      const processing = docs.some(d => ['extracting','extracted','chunking'].includes(d.status))
      return processing ? 4000 : false
    },
  })

  const deleteMut = useMutation({
    mutationFn: documentService.delete,
    onSuccess: () => { qc.invalidateQueries(['documents']); toast.success('Document deleted.') },
    onError: () => toast.error('Delete failed.'),
  })

  const reprocessMut = useMutation({
    mutationFn: documentService.reprocess,
    onSuccess: () => { qc.invalidateQueries(['documents']); toast.success('Reprocessing started.') },
    onError: () => toast.error('Reprocess failed.'),
  })

  const docs = data?.results || []

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Upload PDFs to generate AI quizzes from your study material"
      />

      <UploadZone onUpload={() => qc.invalidateQueries(['documents'])} />

      <div className="mt-8">
        <h2 className="section-title mb-4">Your Documents ({data?.count || 0})</h2>

        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Upload a PDF above to get started generating quizzes."
          />
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div key={doc.id} className="card p-4 flex items-center gap-4 flex-wrap">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-brand-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{doc.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      {STATUS_ICON[doc.status]}
                      {STATUS_LABEL[doc.status]}
                    </span>
                    <span className="text-xs text-slate-400">{doc.file_size_mb} MB</span>
                    {doc.page_count > 0 && (
                      <span className="text-xs text-slate-400">{doc.page_count} pages</span>
                    )}
                    <span className="text-xs text-slate-400">{formatDate(doc.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.status === 'processed' && (
                    <Link
                      to={`/quizzes/generate?doc=${doc.id}`}
                      className="btn-primary btn-sm"
                    >
                      <Zap className="w-3.5 h-3.5" /> Quiz
                    </Link>
                  )}
                  {doc.status === 'failed' && (
                    <button
                      onClick={() => reprocessMut.mutate(doc.id)}
                      disabled={reprocessMut.isPending}
                      className="btn-secondary btn-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Delete this document and all associated quizzes?'))
                        deleteMut.mutate(doc.id)
                    }}
                    disabled={deleteMut.isPending}
                    className="btn-ghost btn-sm text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
