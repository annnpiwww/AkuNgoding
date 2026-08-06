'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

export default function NewProjectPage() {
  const [title, setTitle] = useState('')
  const [rawIdea, setRawIdea] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (title.trim().length === 0) {
      showToast('Judul project tidak boleh kosong', 'error')
      return
    }
    
    if (rawIdea.trim().length < 20) {
      showToast('Ide/konsep minimal 20 karakter', 'error')
      return
    }

    setIsLoading(true)
    
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, idea_input: rawIdea })
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/project/${data.id}/tech-preference`)
      } else {
        const error = await res.json()
        showToast(error.error || 'Gagal membuat project', 'error')
        setIsLoading(false)
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'error')
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto pt-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">Mulai Susun PRD</h1>
        <p className="text-slate-400">Ceritakan ide produkmu, AI akan membantu mengubahnya menjadi struktur yang rapi.</p>
      </div>

      <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-medium text-slate-300">Judul Project</label>
              <span className={`text-xs ${title.length > 100 ? 'text-red-400' : 'text-slate-500'}`}>
                {title.length}/100
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Aplikasi Manajemen Tugas Tim"
              className="w-full bg-[#0a0a0f] border border-[#2a2a3e] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-medium text-slate-300">Ide / Konsep</label>
              <span className={`text-xs ${rawIdea.length > 0 && rawIdea.length < 20 ? 'text-red-400' : 'text-slate-500'}`}>
                {rawIdea.length > 0 && rawIdea.length < 20 ? 'Minimal 20 karakter' : `${rawIdea.length} karakter`}
              </span>
            </div>
            <textarea
              required
              minLength={20}
              value={rawIdea}
              onChange={(e) => setRawIdea(e.target.value)}
              placeholder="Deskripsikan ide produkmu secara bebas. Semakin detail, semakin bagus PRD yang dihasilkan...&#10;&#10;Contoh: Saya ingin membuat aplikasi untuk melacak tugas tim. Harus ada fitur login, dashboard, kanban board, dan notifikasi email saat tugas di-assign."
              className="w-full min-h-[200px] resize-y bg-[#0a0a0f] border border-[#2a2a3e] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || title.length > 100 || (rawIdea.length > 0 && rawIdea.length < 20)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-6 py-3.5 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : null}
            Lanjut ke Klarifikasi
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </form>
      </div>
    </div>
  )
}
