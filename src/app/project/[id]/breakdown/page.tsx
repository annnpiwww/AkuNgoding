'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useToast } from '@/components/Toast'

interface Feature {
  id: string
  name: string
  status: 'belum' | 'sudah'
  description?: string
  breakdown?: string
}

export default function BreakdownPage({ params }: { params: { id: string } }) {
  const [projectTitle, setProjectTitle] = useState('')
  const [features, setFeatures] = useState<Feature[]>([])
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Temporary mock implementation since we don't have the markdown-parser lib fully defined here yet
      // In a real implementation this would call an API that parses the PRD
      const res = await fetch(`/api/projects/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setProjectTitle(data.title)
        
        // Mock feature extraction
        const mockFeatures: Feature[] = [
          { id: '1', name: 'Autentikasi Pengguna', status: 'sudah', description: 'Login dan registrasi dengan email', breakdown: '### Sub-fitur:\n- Login via Email\n- Register via Email\n\n### Task:\n- Setup Supabase Auth\n- Buat halaman UI' },
          { id: '2', name: 'Manajemen Task', status: 'belum', description: 'Membuat, mengedit, dan menghapus tugas' },
          { id: '3', name: 'Notifikasi Real-time', status: 'belum', description: 'Push notification saat tugas di-assign' },
        ]
        setFeatures(mockFeatures)
      }
    } catch (error) {
      showToast('Gagal memuat data fitur', 'error')
    }
  }

  const selectedFeature = features.find(f => f.id === selectedFeatureId)
  const completedCount = features.filter(f => f.status === 'sudah').length

  const handleGenerate = async () => {
    if (!selectedFeature) return
    setIsGenerating(true)
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newBreakdown = `### Sub-fitur / Komponen Utama\n1. Form Input Task\n2. List View & Kanban View\n3. Dialog Konfirmasi Hapus\n\n### Persyaratan Teknis (Tech Specs)\n- State management via Zustand\n- API Endpoint: \`POST /api/tasks\`, \`GET /api/tasks\`\n\n### Daftar Task (Development)\n- [ ] Buat komponen form modal\n- [ ] Integrasi API Create Task\n- [ ] Buat Kanban Board UI`
      
      setGeneratedContent(newBreakdown)
    } catch (error) {
      showToast('Gagal generate breakdown', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveToPRD = () => {
    if (!selectedFeature || !generatedContent) return
    
    // Update local state
    setFeatures(prev => prev.map(f => 
      f.id === selectedFeature.id ? { ...f, status: 'sudah', breakdown: generatedContent } : f
    ))
    setGeneratedContent(null)
    showToast('Berhasil ditambahkan ke PRD', 'success')
  }

  const handleFinish = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'final' })
      })
      
      if (res.ok) {
        showToast('PRD difinalisasi!', 'success')
        router.push(`/project/${params.id}/edit`)
      }
    } catch (error) {
      showToast('Gagal update status', 'error')
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#12121a] border border-[#2a2a3e] rounded-xl p-4">
        <div>
          <h1 className="text-xl font-bold text-white">{projectTitle || 'Loading...'}</h1>
          <p className="text-sm text-slate-400">Breakdown Fitur menjadi Task Teknis</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            {completedCount}/{features.length} fitur di-breakdown
          </span>
          <button 
            onClick={handleFinish}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all"
          >
            Selesai, Finalisasi
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        
        {/* Sidebar Features */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-[#12121a] border border-[#2a2a3e] rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#2a2a3e] bg-[#1a1a2e]">
            <h3 className="font-semibold text-white">Daftar Fitur Utama</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {features.map((feature, idx) => (
              <button
                key={feature.id}
                onClick={() => {
                  setSelectedFeatureId(feature.id)
                  setGeneratedContent(null)
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3
                  ${selectedFeatureId === feature.id 
                    ? 'bg-[#1a1a2e] border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                    : 'bg-[#0a0a0f] border-[#2a2a3e] hover:border-emerald-500/30'}`}
              >
                <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center border
                  ${feature.status === 'sudah' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-slate-600'}`}
                >
                  {feature.status === 'sudah' && (
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200 line-clamp-1">{idx + 1}. {feature.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Area */}
        <div className="flex-1 bg-[#12121a] border border-[#2a2a3e] rounded-xl overflow-hidden flex flex-col">
          {!selectedFeature ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-[#1a1a2e] rounded-full flex items-center justify-center mb-4 text-slate-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Pilih Fitur</h3>
              <p className="text-slate-400 max-w-sm">Pilih fitur dari daftar di samping untuk men-generate technical breakdown dan task list.</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-[#2a2a3e]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{selectedFeature.name}</h2>
                    <p className="text-slate-400 text-sm">{selectedFeature.description}</p>
                  </div>
                  {selectedFeature.status === 'belum' && !generatedContent && (
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Generate Breakdown</>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0f]">
                {isGenerating ? (
                  <div className="space-y-4 max-w-2xl">
                    <div className="skeleton h-6 w-1/3 rounded"></div>
                    <div className="skeleton h-4 w-full rounded"></div>
                    <div className="skeleton h-4 w-5/6 rounded"></div>
                    <div className="skeleton h-4 w-4/6 rounded"></div>
                  </div>
                ) : generatedContent ? (
                  <div className="max-w-3xl">
                    <div className="prose prose-dark max-w-none mb-6">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedContent}</ReactMarkdown>
                    </div>
                    <button
                      onClick={handleSaveToPRD}
                      className="border border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 rounded-lg px-5 py-2.5 font-medium transition-all w-full flex justify-center items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Simpan & Tambahkan ke PRD
                    </button>
                  </div>
                ) : selectedFeature.status === 'sudah' ? (
                  <div className="prose prose-dark max-w-none max-w-3xl">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg mb-6 text-sm inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Sudah di-breakdown
                    </div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedFeature.breakdown || ''}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 mt-10">
                    Klik tombol Generate Breakdown untuk menganalisa fitur ini.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
