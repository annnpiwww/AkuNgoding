'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useToast } from '@/components/Toast'
import { exportAsMd } from '@/lib/export'

export default function EditPage({ params }: { params: { id: string } }) {
  const [projectTitle, setProjectTitle] = useState('')
  const [content, setContent] = useState('')
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('split')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null)
  
  const router = useRouter()
  const { showToast } = useToast()
  
  // Autosave
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    fetchProject()
  }, [])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setProjectTitle(data.title)
        if (data.prd_document?.content) {
          setContent(data.prd_document.content)
        }
      }
    } catch (error) {
      showToast('Gagal memuat PRD', 'error')
    }
  }

  const saveContent = useCallback(async (newContent: string) => {
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/projects/${params.id}/save-prd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
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
  }, [params.id])

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
          
          <button onClick={() => router.push(`/project/${params.id}/breakdown`)} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 shrink-0">
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
    </div>
  )
}
