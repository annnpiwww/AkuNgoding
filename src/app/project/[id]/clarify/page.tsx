'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import Link from 'next/link'

const PREDEFINED_QUESTIONS = [
  {
    id: 'q1',
    text: '1. Ceritakan seseorang yg butuh app ini. Mereka ngapain bwt ngatasi masalahnya?',
    type: 'text',
    options: []
  },
  {
    id: 'q2',
    text: '2. Apa satu hal yg paling penting bwt diselesaikan di kesempatan pertama pake app ini?',
    type: 'single',
    options: ['Bwt tugas harian', 'Catat lokasi butuh peremajaan', 'Pinjam alat ke teknisi', 'Lihat jadwal krj', 'Lainnya']
  },
  {
    id: 'q3',
    text: '3. Pilih 3 fitur yg paling wajib ada di app ini (boleh pilih beberapa):',
    type: 'multi',
    options: ['Tugas harian + foto bukti', 'Catat peremajaan lokasi + RAB', 'Pinjam-alat + foto', 'Jadwal dr Google Sheets', 'PWA bs akses dr HP', 'Lainnya']
  },
  {
    id: 'q4',
    text: '4. Apa keunggulan utama app dibanding cara krj mereka?',
    type: 'single',
    options: ['Hemat waktu', 'Bukti jelas', 'Semua jadi satu tempat', 'Lebih rapi', 'Lainnya']
  },
  {
    id: 'q5',
    text: '5. Apa yg bikin mereka trus pake app tiap hari?',
    type: 'single',
    options: ['Pantau progress cpt', 'Gk ada yg kelewat', 'Bukti foto otomatis', 'Gampang akses di HP', 'Lainnya']
  }
]

export default function ClarifyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const [answers, setAnswers] = useState<Record<string, string | string[] | null>>({})
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

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

  const answeredCount = Object.keys(answers).filter(k => answers[k] !== null && answers[k]?.length !== 0).length

  const handleSave = async () => {
    if (answeredCount < 3) return showToast('Jawab minimal 3 pertanyaan', 'error')

    const finalAnswers = Object.keys(answers).map(k => {
      let ans = answers[k]
      // Inject "lainnya" text if selected
      if (Array.isArray(ans) && ans.includes('Lainnya') && otherTexts[k]) {
        ans = ans.map(a => a === 'Lainnya' ? `Lainnya: ${otherTexts[k]}` : a)
      } else if (ans === 'Lainnya' && otherTexts[k]) {
        ans = `Lainnya: ${otherTexts[k]}`
      }
      return { questionId: k, answer: ans }
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

  return (
    <div className="max-w-3xl mx-auto p-6 pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Beberapa Pertanyaan</h1>
          <p className="text-sm text-slate-400 mt-1">Biar PRD-nya lebih akurat.</p>
        </div>
        <div className="bg-slate-800 text-emerald-400 font-mono px-3 py-1 rounded text-sm">
          {answeredCount} / {PREDEFINED_QUESTIONS.length}
        </div>
      </div>

      <div className="space-y-8">
        {PREDEFINED_QUESTIONS.map((q) => {
          const isSkipped = answers[q.id] === null
          return (
            <div key={q.id} className={`p-5 rounded-lg border transition-all ${isSkipped ? 'border-slate-800 opacity-50' : 'border-slate-700 bg-slate-800/30'}`}>
              <div className="flex justify-between gap-4 mb-4">
                <h3 className="font-medium text-white">{q.text}</h3>
                <button onClick={() => handleSkip(q.id)} className="text-xs text-slate-400 hover:text-white shrink-0">
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
                  {q.options.map(opt => {
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

              {((q.type === 'multi' && ((answers[q.id] as string[]) || []).includes('Lainnya')) ||
                (q.type === 'single' && answers[q.id] === 'Lainnya')) && !isSkipped && (
                <input 
                  type="text"
                  placeholder="Sebutkan lainnya..."
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
          disabled={isLoading || answeredCount < 3}
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-8 py-2.5 font-medium transition-all disabled:opacity-50"
        >
          {isLoading ? 'Load...' : 'Simpan & Lanjut'}
        </button>
      </div>
    </div>
  )
}
