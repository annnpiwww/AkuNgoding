'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Need to lazy load Mermaid because it requires window
function MermaidDiagram({ chart }: { chart: string }) {
  useEffect(() => {
    import('mermaid').then(mermaid => {
      mermaid.default.initialize({ startOnLoad: true, theme: 'dark' });
      mermaid.default.contentLoaded();
    });
  }, [chart]);

  return <div className="mermaid flex justify-center text-sm">{chart}</div>;
}

export default function StructurePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const [diagram, setDiagram] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const generateDiagram = async () => {
    setIsGenerating(true)
    setDiagram('')
    try {
      const res = await fetch(`/api/projects/${id}/generate-structure`, { method: 'POST' })
      if (!res.ok) throw new Error('Gagal generate struktur')
      
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        result += text
        let cleanText = result;
        const match = cleanText.match(/```(?:mermaid)?([\s\S]*?)```/);
        if (match) {
            cleanText = match[1];
        } else {
            cleanText = cleanText.replace(/```mermaid/g, '').replace(/```/g, '');
        }
        setDiagram(cleanText.trim());
      }
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    // Generate automatically on mount if first time
    generateDiagram()
  }, [])

  return (
    <div className="max-w-5xl mx-auto p-6 pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Struktur Arsitektur</h1>
          <p className="text-sm text-slate-400 mt-1">Review diagram struktur sebelum masuk PRD (Flowchart TD).</p>
        </div>
        <button onClick={generateDiagram} disabled={isGenerating} className="text-emerald-400 text-sm border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 rounded hover:bg-emerald-500/20 transition-all">
          {isGenerating ? 'Membuat...' : 'Regenerate'}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 min-h-[400px] overflow-auto">
        {diagram ? (
           <MermaidDiagram chart={diagram} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center space-y-4 pt-20 pb-20">
             <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
             <p className="text-slate-400">Merangkai arsitektur sistem...</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur border-t border-slate-800 flex justify-end gap-3 z-50">
        <Link href={`/project/${id}/clarify`} className="px-6 py-2.5 rounded text-slate-300 hover:text-white">
          Kembali
        </Link>
        <button
          onClick={() => router.push(`/project/${id}/generate`)}
          disabled={isGenerating || !diagram}
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-8 py-2.5 font-medium transition-all disabled:opacity-50"
        >
          Lanjut ke PRD
        </button>
      </div>
    </div>
  )
}
