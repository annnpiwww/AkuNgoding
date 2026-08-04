'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

interface Message {
  id: string
  role: 'ai' | 'user'
  content: string
  timestamp: string
}

interface Question {
  category: string
  question: string
  suggested_answers: string[]
}

export default function ClarifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [messages, setMessages] = useState<Message[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [customAnswers, setCustomAnswers] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [projectTitle, setProjectTitle] = useState('Loading...')
  const [questionCount, setQuestionCount] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const maxQuestions = 5
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { showToast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, questions])

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/clarify`)
      if (res.ok) {
        const data = await res.json()
        setProjectTitle(data.project.title)
        
        if (data.messages && data.messages.length > 0) {
          const filtered = data.messages.filter((m: any) => m.content !== 'READY_TO_GENERATE_PRD')
          setMessages(filtered)
          if (filtered.length !== data.messages.length) setIsReady(true)
          const qCount = filtered.filter((m: any) => m.role === 'ai').length
          setQuestionCount(qCount)
        } else {
          triggerNextQuestion()
        }
      }
    } catch (error) {
      showToast('Gagal memuat percakapan', 'error')
    }
  }

  const triggerNextQuestion = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${id}/clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'next_question' })
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.readyToGenerate || data.ai_message_count >= maxQuestions) {
          setIsReady(true)
          setQuestionCount(data.ai_message_count ?? 0)
          return
        }
        
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions)
          setSelectedAnswers({})
          setCustomAnswers({})
        } else {
          setMessages(prev => [...prev, data.message])
        }
        setQuestionCount(data.ai_message_count ?? 0)
      } else {
        const error = await res.json()
        showToast(error.error || 'Gagal mendapatkan pertanyaan', 'error')
      }
    } catch (error) {
      showToast('Terjadi kesalahan koneksi', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitAnswers = async () => {
    const answers: string[] = []
    questions.forEach((q, idx) => {
      const selected = selectedAnswers[idx]
      if (selected === 'Custom (tulis sendiri)') {
        const custom = customAnswers[idx]?.trim()
        if (custom) {
          answers.push(`**${q.question}**\n${custom}`)
        }
      } else if (selected) {
        answers.push(`**${q.question}**\n${selected}`)
      }
    })

    if (answers.length === 0) {
      showToast('Pilih atau tulis jawaban minimal 1 pertanyaan', 'error')
      return
    }

    const messageContent = answers.join('\n\n')
    setIsLoading(true)
    setQuestions([])
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const res = await fetch(`/api/projects/${id}/clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent })
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.readyToGenerate) {
          setIsReady(true)
          return
        }
        
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions)
          setSelectedAnswers({})
          setCustomAnswers({})
        } else {
          setMessages(prev => [...prev, data.message])
        }
        setQuestionCount(data.ai_message_count ?? 0)
      } else {
        const error = await res.json()
        showToast(error.error || 'Gagal mendapatkan jawaban', 'error')
      }
    } catch (error) {
      showToast('Terjadi kesalahan koneksi', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push(`/project/${id}/generate`)
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white truncate max-w-md">{projectTitle}</h1>
          <p className="text-slate-400 text-sm">Sesi Klarifikasi</p>
        </div>
        {!isReady && (
          <div className="bg-[#1a1a2e] border border-[#2a2a3e] px-3 py-1 rounded-full flex items-center gap-2">
            <span className="text-xs font-medium text-emerald-400">Pertanyaan {Math.min(questionCount, maxQuestions)}/{maxQuestions}</span>
          </div>
        )}
      </div>

      <div className="flex-1 bg-[#12121a] border border-[#2a2a3e] rounded-xl overflow-hidden flex flex-col shadow-lg">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === 'user' 
                  ? 'bg-emerald-600/20 border border-emerald-500/30 text-white rounded-br-sm' 
                  : 'bg-[#1a1a2e] border border-[#2a2a3e] text-slate-200 rounded-bl-sm'
              }`}>
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2v2.1c3.5.4 6.2 3.2 6.8 6.7L22 17h-2.1c-.6-2.5-2.7-4.4-5.3-4.8A7.9 7.9 0 0 1 12 18a7.9 7.9 0 0 1-2.6-5.8c-2.6.4-4.7 2.3-5.3 4.8H2l1.2-4.2C3.8 7.3 6.5 4.5 10 4.1V4a2 2 0 0 1 2-2z" /></svg>
                    </div>
                    <span className="text-xs font-medium text-emerald-400">AI Assistant</span>
                  </div>
                )}
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          ))}
          
          {/* Structured Questions UI */}
          {questions.length > 0 && !isLoading && (
            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                      {q.category}
                    </span>
                    <span className="text-xs text-slate-500">Pertanyaan {qIdx + 1}</span>
                  </div>
                  <p className="text-white font-medium mb-4">{q.question}</p>
                  <div className="space-y-2">
                    {q.suggested_answers.map((ans, aIdx) => {
                      const isCustom = ans === 'Custom (tulis sendiri)'
                      const isSelected = selectedAnswers[qIdx] === ans
                      return (
                        <div key={aIdx}>
                          <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/10 border-emerald-500/50'
                              : 'bg-[#0a0a0f] border-[#2a2a3e] hover:border-emerald-500/30'
                          }`}>
                            <input
                              type="radio"
                              name={`question-${qIdx}`}
                              checked={isSelected}
                              onChange={() => setSelectedAnswers(prev => ({ ...prev, [qIdx]: ans }))}
                              className="mt-0.5 w-4 h-4 text-emerald-500 border-[#2a2a3e] focus:ring-emerald-500/20"
                            />
                            <span className="text-sm text-slate-200 flex-1">{ans}</span>
                          </label>
                          {isCustom && isSelected && (
                            <textarea
                              value={customAnswers[qIdx] || ''}
                              onChange={(e) => setCustomAnswers(prev => ({ ...prev, [qIdx]: e.target.value }))}
                              placeholder="Tulis jawabanmu di sini..."
                              className="mt-2 w-full bg-[#0a0a0f] border border-[#2a2a3e] focus:border-emerald-500/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none resize-none min-h-[60px]"
                              rows={2}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-slate-400">AI sedang berpikir &amp; menyusun pertanyaan...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input/Submit Area */}
        <div className="p-4 bg-[#0a0a0f] border-t border-[#2a2a3e]">
          {isReady ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-emerald-400 text-sm font-medium">Info sudah cukup 👌</p>
              {messages.length === 0 && (
                <p className="text-slate-400 text-sm text-center max-w-md">
                  AI menilai idemu sudah cukup detail &amp; tidak perlu klarifikasi tambahan.
                  Kalau masih ada yang mau diperjelas, kamu bisa langsung generate lalu edit hasilnya.
                </p>
              )}
              <button
                onClick={() => router.push(`/project/${id}/generate`)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Generate PRD →
              </button>
            </div>
          ) : questions.length > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleSkip}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                Skip, langsung generate <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
              <button
                onClick={handleSubmitAnswers}
                disabled={isLoading || Object.keys(selectedAnswers).length === 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:bg-slate-700 flex items-center gap-2"
              >
                Kirim Jawaban
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <span className="text-xs text-slate-500">Menunggu pertanyaan dari AI...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
