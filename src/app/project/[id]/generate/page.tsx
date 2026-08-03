'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const SECTIONS = [
  { id: 'ringkasan', label: 'Ringkasan Eksekutif' },
  { id: 'masalah', label: 'Masalah & Tujuan' },
  { id: 'pengguna', label: 'Target Pengguna' },
  { id: 'fitur', label: 'Core Features' },
  { id: 'non-fungsional', label: 'Non-Functional Requirements' },
  { id: 'flow', label: 'User Flow' },
  { id: 'metrik', label: 'Metrik Kesuksesan' }
]

export default function GeneratePage({ params }: { params: { id: string } }) {
  const [content, setContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    startGeneration()
  }, [])

  useEffect(() => {
    // Detect section based on markdown headings
    const lines = content.split('\n')
    let foundHeadings = 0
    lines.forEach(line => {
      if (line.startsWith('## ')) foundHeadings++
    })
    
    if (foundHeadings > 0 && foundHeadings <= SECTIONS.length) {
      setCurrentSectionIndex(foundHeadings - 1)
    }
  }, [content])

  const startGeneration = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/projects/${params.id}/generate-prd`, {
        method: 'POST'
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Gagal generate PRD')
      }

      if (!res.body) throw new Error('Response body is null')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        setContent((prev) => prev + chunk)
      }
      
      setIsGenerating(false)
      setCurrentSectionIndex(SECTIONS.length) // All done
      
    } catch (err: any) {
      setError(err.message)
      setIsGenerating(false)
      showToast('Gagal generate PRD', 'error')
    }
  }

  const handleFinish = () => {
    router.push(`/project/${params.id}/edit`)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          {isGenerating ? (
            <>
              <svg className="animate-spin h-6 w-6 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Menyusun PRD...
            </>
          ) : error ? (
            <>
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Gagal Menyusun PRD
            </>
          ) : (
            <>
              <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              PRD Selesai Disusun!
            </>
          )}
        </h1>
        <p className="text-slate-400 text-sm">
          {isGenerating ? 'AI sedang menulis PRD berdasarkan informasi yang diberikan.' : error ? 'Terjadi kesalahan saat memproses data.' : 'Draft PRD berhasil dibuat dan siap di-review.'}
        </p>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center max-w-xl mx-auto">
          <p className="text-red-400 mb-4">{error}</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => router.push('/settings/llm')}
              className="text-slate-300 hover:text-white text-sm underline"
            >
              Cek Pengaturan LLM
            </button>
            <button 
              onClick={startGeneration}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Progress Sidebar */}
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-5 h-fit sticky top-24">
            <h3 className="font-medium text-white mb-4">Progress</h3>
            <ul className="space-y-4">
              {SECTIONS.map((section, idx) => {
                const isDone = idx < currentSectionIndex || (!isGenerating && !error)
                const isCurrent = idx === currentSectionIndex && isGenerating
                
                return (
                  <li key={section.id} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-xs shrink-0
                      ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 
                        isCurrent ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 
                        'bg-[#1a1a2e] border-[#2a2a3e] text-slate-500'}`}
                    >
                      {isDone ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : isCurrent ? (
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className={`text-sm ${isDone ? 'text-slate-300' : isCurrent ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                      {section.label}
                    </span>
                  </li>
                )
              })}
            </ul>
            
            {!isGenerating && !error && (
              <div className="mt-8">
                <button
                  onClick={handleFinish}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  Lihat PRD Penuh
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-3 bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6 min-h-[500px]">
            <div className="prose prose-dark max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || '*Menyiapkan generator...*'}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
