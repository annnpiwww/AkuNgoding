'use client'

import { useState, useEffect, useRef, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useToast } from '@/components/Toast'
import { exportAsMd } from '@/lib/export'
import { extractSections } from '@/lib/markdown-parser'

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [projectTitle, setProjectTitle] = useState('')
  const [content, setContent] = useState('')
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('split')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null)
  const [reviseOpen, setReviseOpen] = useState(false)
  const [reviseSection, setReviseSection] = useState('')
  const [reviseInstruction, setReviseInstruction] = useState('')
  const [isRevising, setIsRevising] = useState(false)

  const router = useRouter()
  const { showToast } = useToast()
  
  // Autosave
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    fetchProject()
  }, [])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (res.ok) {
        const data = await res.json()
        setProjectTitle(data.title)
        const doc = data.prd_documents?.[0]
        if (doc?.content_markdown) {
          setContent(doc.content_markdown)
        }
      }
    } catch (error) {
      showToast('Gagal memuat PRD', 'error')
    }
  }

  const saveContent = useCallback(async (newContent: string) => {
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/projects/${id}/save-prd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_markdown: newContent })
      })
      
      if (res.ok) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(null), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      setSaveStatus('error')
    }
  }, [id])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      saveContent(newContent)
    }, 2000)
  }

  const handleExport = () => {
    exportAsMd(projectTitle || 'PRD', content)
  }

  const handleRevise = async () => {
    if (!reviseSection || !reviseInstruction.trim()) {
      showToast('Pilih section dan tulis instruksi revisi', 'error')
      return
    }
    setIsRevising(true)
    try {
      const res = await fetch(`/api/projects/${id}/revise-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_name: reviseSection, instruction: reviseInstruction })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal merevisi section')
      setContent(data.content_markdown || content)
      setSaveStatus('saved')
      setReviseOpen(false)
      setReviseInstruction('')
      showToast(`Section "${reviseSection}" berhasil direvisi`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Gagal merevisi section', 'error')
    } finally {
      setIsRevising(false)
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#12121a] border border-[#2a2a3e] rounded-xl p-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-3">
            {projectTitle || 'Loading...'}
            {saveStatus === 'saving' && <span className="text-xs font-normal text-slate-400 flex items-center gap-1"><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Menyimpan...</span>}
            {saveStatus === 'saved' && <span className="text-xs font-normal text-emerald-500 flex items-center gap-1"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>Tersimpan</span>}
          </h1>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg overflow-hidden shrink-0">
            <button onClick={() => setViewMode('editor')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'editor' ? 'bg-[#2a2a3e] text-white' : 'text-slate-400 hover:text-white'}`}>Editor</button>
            <button onClick={() => setViewMode('split')} className={`px-3 py-1.5 text-xs font-medium border-x border-[#2a2a3e] transition-colors hidden md:block ${viewMode === 'split' ? 'bg-[#2a2a3e] text-white' : 'text-slate-400 hover:text-white'}`}>Split</button>
            <button onClick={() => setViewMode('preview')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'preview' ? 'bg-[#2a2a3e] text-white' : 'text-slate-400 hover:text-white'}`}>Preview</button>
          </div>
          
          <button onClick={handleExport} className="border border-[#2a2a3e] hover:border-emerald-500/30 text-slate-300 rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export
          </button>

          <button
            onClick={() => setReviseOpen(true)}
            disabled={!content.trim() || isRevising}
            className="border border-purple-500/40 hover:border-purple-500/70 text-purple-300 rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            Revise AI
          </button>
          
          <button onClick={() => router.push(`/project/${id}/breakdown`)} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 shrink-0">
            Breakdown
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex gap-4 overflow-hidden ${viewMode !== 'split' ? 'justify-center' : ''}`}>
        
        {/* Editor */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full max-w-4xl'} h-full bg-[#12121a] border border-[#2a2a3e] rounded-xl overflow-hidden flex flex-col`}>
            <div className="bg-[#1a1a2e] px-4 py-2 border-b border-[#2a2a3e] flex justify-between items-center">
              <span className="text-xs font-medium text-slate-400">Markdown Editor</span>
            </div>
            <textarea
              value={content}
              onChange={handleContentChange}
              className="flex-1 w-full p-4 bg-transparent text-slate-300 font-mono text-sm leading-relaxed resize-none outline-none"
              spellCheck="false"
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full max-w-4xl'} h-full bg-[#12121a] border border-[#2a2a3e] rounded-xl overflow-hidden flex flex-col`}>
            <div className="bg-[#1a1a2e] px-4 py-2 border-b border-[#2a2a3e] flex justify-between items-center">
              <span className="text-xs font-medium text-slate-400">Live Preview</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="prose prose-dark max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || '*Tidak ada konten*'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>

      {reviseOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => { if (!isRevising) setReviseOpen(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Revisi section dengan AI"
            className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-purple-500/15 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Revisi Section dengan AI</h3>
                <p className="text-xs text-slate-500">AI akan menulis ulang section yang dipilih sesuai instruksimu</p>
              </div>
            </div>

            <label className="block text-sm font-medium text-slate-300 mb-1.5">Pilih Section</label>
            <select
              value={reviseSection}
              onChange={(e) => setReviseSection(e.target.value)}
              disabled={isRevising}
              className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 disabled:opacity-60 mb-4"
            >
              <option value="">-- Pilih section --</option>
              {Object.keys(extractSections(content)).map((s) => (
                <option key={s} value={s}>{s.replace(/^#+\s*/, '')}</option>
              ))}
            </select>

            <label className="block text-sm font-medium text-slate-300 mb-1.5">Instruksi Revisi</label>
            <textarea
              value={reviseInstruction}
              onChange={(e) => setReviseInstruction(e.target.value)}
              disabled={isRevising}
              placeholder="Contoh: tambahkan requirement mode offline, pertegas acceptance criteria, tambahkan edge case..."
              rows={3}
              className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 resize-none disabled:opacity-60 mb-4"
            />

            {isRevising && (
              <div className="flex items-center gap-2 text-purple-400 text-sm mb-4">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                AI sedang menulis ulang section, tunggu sebentar...
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={handleRevise}
                disabled={isRevising || !reviseSection || !reviseInstruction.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isRevising ? 'Merevisi...' : 'Minta AI Revisi'}
              </button>
              <button
                type="button"
                onClick={() => setReviseOpen(false)}
                disabled={isRevising}
                className="flex-1 border border-[#2a2a3e] hover:border-slate-500 disabled:opacity-50 text-slate-300 rounded-lg px-4 py-2.5 font-medium transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
