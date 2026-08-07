'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import Link from 'next/link'

interface Question {
  id: string
  text: string
  type: 'text' | 'single' | 'multi'
  options: string[]
}

export default function ClarifyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string | string[] | null>>({})
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(true)
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch(`/api/projects/${id}/generate-questions`, { method: 'POST' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Gagal memuat pertanyaan')
        setQuestions(data.questions)
      } catch (e: any) {
        showToast(e.message, 'error')
      } finally {
        setIsGenerating(false)
      }
    }
    loadQuestions()
  }, [id])

  const handleOptionClick = (qId: string, opt: string, isMulti: boolean) => {
    if (isMulti) {
      const current = (answers[qId] as string[]) || []
      if (current.includes(opt)) {
        setAnswers({ ...answers, [qId]: current.filter(x => x !== opt) })
      } else {
        setAnswers({ ...answers, [qId]: [...current, opt] })
      }
    } else {
      setAnswers({ ...answers, [qId]: answers[qId] === opt ? null : opt })
    }
  }

  const handleSkip = (qId: string) => {
    setAnswers({ ...answers, [qId]: null })
  }

  // Jawab min 3 (atau max - 1 jika jumlah pertanyaannya sedikit)
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== null && answers[k]?.length !== 0).length
  const minRequired = Math.min(3, questions.length || 3)

  const handleSave = async () => {
    if (answeredCount < minRequired) return showToast(`Jawab minimal ${minRequired} pertanyaan`, 'error')

    // Append text to final structure
    const finalAnswers = questions.map(q => {
      let ans = answers[q.id]
      if (ans === undefined) ans = null;
      
      const customNotes = otherTexts[q.id];
      if (customNotes) {
         if (Array.isArray(ans)) {
            ans = [...ans.filter(a => a !== 'Lainnya'), `Custom: ${customNotes}`];
         } else if (ans && ans !== 'Lainnya') {
            ans = `${ans} | Custom: ${customNotes}`;
         } else {
            ans = `${customNotes}`;
         }
      }

      return { questionId: q.id, question: q.text, answer: ans }
    })

    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clarification_answers: finalAnswers }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan jawaban')
      router.push(`/project/${id}/structure`)
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (isGenerating) {
    return (
      <div className="max-w-3xl mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-slate-400">AI sedang menyusun pertanyaan khusus untuk idemu...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Pertanyaan Spesifik Ide</h1>
          <p className="text-sm text-slate-400 mt-1">Jawab agar PRD tidak ambigu dan AI tidak ngarang.</p>
        </div>
        <div className="bg-slate-800 text-emerald-400 font-mono px-3 py-1 rounded text-sm">
          {answeredCount} / {questions.length}
        </div>
      </div>

      <div className="space-y-8">
        {questions.map((q) => {
          const isSkipped = answers[q.id] === null
          return (
            <div key={q.id} className={`p-5 rounded-lg border transition-all ${isSkipped ? 'border-slate-800 opacity-50' : 'border-slate-700 bg-slate-800/30'}`}>
              <div className="flex justify-between gap-4 mb-4">
                <h3 className="font-medium text-white">{q.text}</h3>
                <button onClick={() => handleSkip(q.id)} className="text-xs text-slate-400 hover:text-white shrink-0 bg-slate-800/50 px-2 py-1 rounded">
                  Lewati
                </button>
              </div>

              {q.type === 'text' && !isSkipped && (
                <textarea
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm text-white focus:border-emerald-500 outline-none"
                  rows={3}
                  placeholder="Ketik deskripsi..."
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  value={(answers[q.id] as string) || ''}
                />
              )}

              {q.type !== 'text' && !isSkipped && (
                <div className="flex flex-wrap gap-2">
                  {q.options?.map(opt => {
                    const isSelected = q.type === 'multi' 
                      ? ((answers[q.id] as string[]) || []).includes(opt)
                      : answers[q.id] === opt

                    return (
                      <button
                        key={opt}
                        onClick={() => handleOptionClick(q.id, opt, q.type === 'multi')}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all border ${
                          isSelected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )}

              {!isSkipped && (
                <input 
                  type="text"
                  placeholder="Tuliskan jawaban custom / catatan tambahan..."
                  className="w-full mt-3 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none"
                  value={otherTexts[q.id] || ''}
                  onChange={(e) => setOtherTexts({...otherTexts, [q.id]: e.target.value})}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur border-t border-slate-800 flex justify-end gap-3 z-50">
        <Link href={`/project/${id}/tech-preference`} className="px-6 py-2.5 rounded text-slate-300 hover:text-white">
          Kembali
        </Link>
        <button
          onClick={handleSave}
          disabled={isLoading || answeredCount < minRequired}
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-8 py-2.5 font-medium transition-all disabled:opacity-50"
        >
          {isLoading ? 'Load...' : 'Simpan & Lanjut'}
        </button>
      </div>
    </div>
  )
}
