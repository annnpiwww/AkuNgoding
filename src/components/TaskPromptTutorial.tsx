'use client'

import { useState } from 'react'

interface TaskPromptTutorialProps {
  isOpen: boolean
  onClose: () => void
  totalTasks: number
}

export default function TaskPromptTutorial({ isOpen, onClose, totalTasks }: TaskPromptTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)

  if (!isOpen) return null

  const steps = [
    {
      title: '🎉 Prompts Berhasil Digenerate!',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            Selamat! <span className="text-emerald-400 font-semibold">{totalTasks} prompts</span> siap digunakan untuk implementasi project Anda menggunakan AI Coding Agent.
          </p>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <p className="text-emerald-300 text-sm">
              💡 <strong>Tip:</strong> Prompts sudah diorganisir berdasarkan Phase (MVP, Enhancement, Optimization) untuk memudahkan eksekusi bertahap.
            </p>
          </div>
        </div>
      )
    },
    {
      title: '📋 Cara Menggunakan Prompts',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            Setiap task memiliki prompt yang sudah siap pakai. Ada 3 cara untuk mengeksekusi prompts:
          </p>
          <div className="space-y-3">
            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h4 className="text-white font-medium mb-1">Option 1: MCP Integration (Otomatis)</h4>
                  <p className="text-slate-400 text-sm">
                    Klik tombol "MCP Connect" untuk menghubungkan dengan AI Agent (Claude Desktop, Kimi CLI, dll). Agent akan auto-execute tasks satu per satu.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <h4 className="text-white font-medium mb-1">Option 2: Copy Manual (Semi-Otomatis)</h4>
                  <p className="text-slate-400 text-sm">
                    Klik "Copy Prompt" pada setiap task, lalu paste ke AI Coding Agent favorit Anda (Cursor, Windsurf, Cline, dll).
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📥</span>
                <div>
                  <h4 className="text-white font-medium mb-1">Option 3: Export All (Batch)</h4>
                  <p className="text-slate-400 text-sm">
                    Klik tombol "Export All Prompts" untuk download semua prompts dalam format .txt atau .md, lalu execute batch menggunakan script automation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '🔄 Tracking Progress dengan Status',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            UI Breakdown sekarang dibagi menjadi 4 section untuk tracking progress implementasi:
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-slate-500/20 flex items-center justify-center text-xl">📝</div>
              <div className="flex-1">
                <h4 className="text-white font-medium">Task</h4>
                <p className="text-slate-400 text-sm">Semua task yang belum dikerjakan (status: todo)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[#1a1a2e] border border-amber-500/30 rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-xl">⚡</div>
              <div className="flex-1">
                <h4 className="text-amber-300 font-medium">Dikerjakan</h4>
                <p className="text-slate-400 text-sm">Task yang sedang dieksekusi AI Agent via MCP (status: in_progress)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[#1a1a2e] border border-emerald-500/30 rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xl">✅</div>
              <div className="flex-1">
                <h4 className="text-emerald-300 font-medium">Selesai</h4>
                <p className="text-slate-400 text-sm">Task yang berhasil selesai (status: done)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[#1a1a2e] border border-red-500/30 rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-xl">❌</div>
              <div className="flex-1">
                <h4 className="text-red-300 font-medium">Gagal</h4>
                <p className="text-slate-400 text-sm">Task yang gagal dieksekusi (status: failed) — perlu retry manual</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '💡 Tips Eksekusi yang Efisien',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            Beberapa best practices untuk implementasi yang smooth:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 text-xl shrink-0">→</span>
              <div>
                <strong className="text-white">Eksekusi per Phase</strong>
                <p className="text-slate-400 text-sm">Kerjakan Phase 1 (MVP) dulu hingga selesai sebelum lanjut Phase 2. Ini memastikan core features stabil.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 text-xl shrink-0">→</span>
              <div>
                <strong className="text-white">Test setelah setiap Feature</strong>
                <p className="text-slate-400 text-sm">Jangan tunggu semua task selesai baru test. Validate per feature untuk catch bugs lebih cepat.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 text-xl shrink-0">→</span>
              <div>
                <strong className="text-white">Update status manual jika diperlukan</strong>
                <p className="text-slate-400 text-sm">Jika pakai copy-paste manual (bukan MCP), update status task secara manual agar tracking tetap akurat.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 text-xl shrink-0">→</span>
              <div>
                <strong className="text-white">Backup code sebelum batch execution</strong>
                <p className="text-slate-400 text-sm">Commit to Git atau backup manual sebelum auto-execute banyak tasks sekaligus.</p>
              </div>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: '🚀 Siap Mulai Implementasi!',
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            Anda sudah siap untuk mulai implementasi! Pilih metode eksekusi yang sesuai dengan workflow Anda:
          </p>
          <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-lg p-4">
            <p className="text-emerald-300 text-sm leading-relaxed">
              <strong>🎯 Recommended:</strong> Jika menggunakan Claude Desktop atau Kimi CLI, gunakan <strong>MCP Connect</strong> untuk auto-execution. Jika tidak, gunakan <strong>Copy Prompt</strong> manual ke AI Coding Agent favorit Anda.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Butuh bantuan? Cek dokumentasi MCP atau contact support.</p>
          </div>
        </div>
      )
    }
  ]

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border-b border-[#2a2a3e] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{currentStepData.title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Close tutorial"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep
                    ? 'bg-emerald-500 flex-1'
                    : idx < currentStep
                    ? 'bg-emerald-500/50 w-8'
                    : 'bg-slate-700 w-8'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2a2a3e] px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <span className="text-sm text-slate-400">
            Step {currentStep + 1} of {steps.length}
          </span>

          {isLastStep ? (
            <button
              onClick={onClose}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              Mulai Implementasi
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              Next
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
