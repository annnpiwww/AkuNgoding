'use client'

import { useState, useEffect, use, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { createClient } from '@/lib/supabase/client'
import TaskPromptTutorial from '@/components/TaskPromptTutorial'

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

interface Task {
  id: string
  project_id: string
  feature_name: string
  title: string
  detail: string
  prompt: string
  status: TaskStatus
  sort_order: number
  created_at: string
  updated_at: string
}

interface MCPStatus {
  connected: boolean
  error?: string
  tools?: string[]
  health?: { connected: boolean; server?: string; supabase?: string }
  command?: string
  supabaseProject?: string
}

const STATUS_META: Record<TaskStatus, { label: string; cls: string; dot: string }> = {
  todo: { label: 'Todo', cls: 'bg-slate-500/10 border-slate-500/30 text-slate-300', dot: 'bg-slate-500' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-500/10 border-amber-500/30 text-amber-300', dot: 'bg-amber-500' },
  review: { label: 'Review', cls: 'bg-blue-500/10 border-blue-500/30 text-blue-300', dot: 'bg-blue-500' },
  done: { label: 'Done', cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', dot: 'bg-emerald-500' },
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'review',
  review: 'done',
  done: 'todo',
}

export default function BreakdownPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { showToast } = useToast()

  const [projectTitle, setProjectTitle] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [filterFeature, setFilterFeature] = useState<string>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDetail, setNewDetail] = useState('')
  const [newFeature, setNewFeature] = useState('')
  const [adding, setAdding] = useState(false)

  const [promptingId, setPromptingId] = useState<string | null>(null)
  const [promptModal, setPromptModal] = useState<{ task: Task; prompt: string } | null>(null)

  const [mcp, setMcp] = useState<MCPStatus | null>(null)
  const [checkingMcp, setCheckingMcp] = useState(false)
  const [showMcp, setShowMcp] = useState(false)

  const [generatingAll, setGeneratingAll] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  const channelRef = useRef<any>(null)

  const features = Array.from(new Set(tasks.map((t) => t.feature_name).filter(Boolean))).sort()
  const visible = filterFeature === 'all' ? tasks : tasks.filter((t) => t.feature_name === filterFeature)

  const totalDone = tasks.filter((t) => t.status === 'done').length

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}/tasks`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch {
      showToast('Gagal memuat tasks', 'error')
    } finally {
      setLoadingTasks(false)
    }
  }, [id, showToast])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/projects/${id}`)
        if (res.ok) {
          const data = await res.json()
          setProjectTitle(data.title || '')
        }
      } catch {
        /* ignore */
      }
    })()
    loadTasks()
  }, [id, loadTasks])

  // Realtime sync: update task saat MCP agent ubah status di DB -> jadi done langsung
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`tasks:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'breakdown_tasks', filter: `project_id=eq.${id}` },
        () => {
          loadTasks()
        }
      )
      .subscribe()
    channelRef.current = channel
    // polling fallback (aman kalau realtime blm aktif)
    const interval = setInterval(loadTasks, 8000)
    return () => {
      clearInterval(interval)
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [id, loadTasks])

  const cycleStatus = async (task: Task) => {
    const next = NEXT_STATUS[task.status]
    // optimistik
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)))
    try {
      const res = await fetch(`/api/projects/${id}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)))
        showToast('Gagal update status', 'error')
      }
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)))
      showToast('Gagal update status', 'error')
    }
  }

  const addTask = async () => {
    if (!newTitle.trim()) {
      showToast('Judul task wajib diisi', 'error')
      return
    }
    setAdding(true)
    try {
      const feature = newFeature.trim() || (features[0] || 'Umum')
      const res = await fetch(`/api/projects/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_name: feature, title: newTitle.trim(), detail: newDetail.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast(err.error || 'Gagal tambah task', 'error')
        return
      }
      await loadTasks()
      setShowAdd(false)
      setNewTitle('')
      setNewDetail('')
      setNewFeature('')
      showToast('Task ditambahkan', 'success')
    } catch {
      showToast('Gagal tambah task', 'error')
    } finally {
      setAdding(false)
    }
  }

  const deleteTask = async (task: Task) => {
    if (!confirm(`Hapus task "${task.title}"?`)) return
    try {
      const res = await fetch(`/api/projects/${id}/tasks/${task.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
      showToast('Task dihapus', 'success')
    } catch {
      showToast('Gagal hapus task', 'error')
    }
  }

  const generatePrompt = async (task: Task) => {
    setPromptingId(task.id)
    try {
      const res = await fetch(`/api/projects/${id}/tasks/generate-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: task.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal generate prompt')
      setPromptModal({ task: { ...task, prompt: data.prompt }, prompt: data.prompt })
    } catch (e: any) {
      showToast(e.message || 'Gagal generate prompt', 'error')
    } finally {
      setPromptingId(null)
    }
  }

  const copyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('Prompt disalin ke clipboard', 'success')
    } catch {
      showToast('Gagal menyalin prompt', 'error')
    }
  }

  const checkMcp = async () => {
    setCheckingMcp(true)
    try {
      const res = await fetch('/api/mcp/status')
      const data = await res.json()
      setMcp(data)
      setShowMcp(true)
    } catch {
      setMcp({ connected: false, error: 'Gagal mengecek MCP server' })
      setShowMcp(true)
    } finally {
      setCheckingMcp(false)
    }
  }

  const generateAllPrompts = async () => {
    setGeneratingAll(true)
    try {
      const res = await fetch(`/api/projects/${id}/tasks/generate-all-prompts`, {
        method: 'POST'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal generate prompts')
      
      showToast(data.message || `${data.generated} prompts berhasil digenerate`, 'success')
      await loadTasks() // Reload tasks dengan prompts baru
      setShowTutorial(true) // Show tutorial after successful generation
    } catch (e: any) {
      showToast(e.message || 'Gagal generate all prompts', 'error')
    } finally {
      setGeneratingAll(false)
    }
  }

  const generateTasksFromPrd = async () => {
    setRegenerating(true)
    try {
      const res = await fetch(`/api/projects/${id}/tasks/regenerate`, {
        method: 'POST'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal generate tasks dari PRD')

      showToast(data.message || `${data.generated} task berhasil dibuat`, 'success')
      await loadTasks()
    } catch (e: any) {
      showToast(e.message || 'Gagal generate tasks dari PRD', 'error')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] min-h-[300px] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#12121a] border border-[#2a2a3e] rounded-xl p-4">
        <div>
          <h1 className="text-xl font-bold text-white">{projectTitle || 'Loading...'}</h1>
          <p className="text-sm text-slate-400">Task Breakdown — tracking Todo / In Progress / Done</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            {totalDone}/{tasks.length} done
          </span>
          {tasks.length === 0 ? (
            <button
              onClick={generateTasksFromPrd}
              disabled={regenerating}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {regenerating ? 'Mengekstrak task dari PRD...' : '⚡ Generate Tasks dari PRD'}
            </button>
          ) : (
            <button
              onClick={generateAllPrompts}
              disabled={generatingAll || tasks.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {generatingAll ? 'Generating...' : '⚡ Generate All Prompts'}
            </button>
          )}
          <button
            onClick={checkMcp}
            disabled={checkingMcp}
            className="border border-[#2a2a3e] hover:border-emerald-500/30 text-slate-300 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {checkingMcp ? 'Cek MCP...' : 'MCP Connect'}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap"
          >
            + Task
          </button>
        </div>
      </div>

      {/* Filter per fitur */}
      {features.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterFeature('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              filterFeature === 'all'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-[#12121a] border-[#2a2a3e] text-slate-300 hover:border-emerald-500/30'
            }`}
          >
            Semua ({tasks.length})
          </button>
          {features.map((f) => {
            const fDone = tasks.filter((t) => t.feature_name === f && t.status === 'done').length
            const fTotal = tasks.filter((t) => t.feature_name === f).length
            return (
              <button
                key={f}
                onClick={() => setFilterFeature(filterFeature === f ? 'all' : f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  filterFeature === f
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-[#12121a] border-[#2a2a3e] text-slate-300 hover:border-emerald-500/30'
                }`}
              >
                {f} ({fDone}/{fTotal})
              </button>
            )
          })}
        </div>
      )}

      {/* 4-Column Task Board */}
      {tasks.length === 0 && (
        <div className="border border-indigo-500/30 bg-indigo-500/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-indigo-200">Belum ada task breakdown</p>
            <p className="text-xs text-slate-400 mt-1">Task di-buat otomatis dari PRD yang sudah digenerate. Klik <b>⚡ Generate Tasks dari PRD</b> di atas.</p>
          </div>
          <button
            onClick={generateTasksFromPrd}
            disabled={regenerating}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {regenerating ? 'Memproses...' : '⚡ Generate Tasks'}
          </button>
        </div>
      )}

      {/* 4-Column Task Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden auto-rows-fr">
        {/* Column 1: Task (todo) */}
        <div className="flex flex-col h-full min-h-0">
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-t-xl px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span className="text-lg">📝</span>
              Todo
            </h3>
            <span className="text-xs text-slate-400 bg-slate-500/10 px-2 py-1 rounded">
              {visible.filter(t => t.status === 'todo').length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 bg-[#0a0a0f] border-x border-b border-[#2a2a3e] rounded-b-xl p-3 space-y-2">
            {loadingTasks ? (
              <div className="text-center text-slate-500 text-sm mt-4">Loading...</div>
            ) : visible.filter(t => t.status === 'todo').length === 0 ? (
              <div className="text-center text-slate-500 text-sm mt-4">Tidak ada task</div>
            ) : (
              visible.filter(t => t.status === 'todo').map((task) => (
                <div key={task.id} className="bg-[#12121a] border border-[#2a2a3e] hover:border-emerald-500/30 transition-all rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-slate-500 bg-[#1a1a2e] px-2 py-0.5 rounded">{task.feature_name}</span>
                    {task.prompt && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">✓</span>}
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">{task.title}</h4>
                  {task.detail && <p className="text-xs text-slate-400 line-clamp-2">{task.detail}</p>}
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => cycleStatus(task)} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded transition-all">Start</button>
                    <button onClick={() => generatePrompt(task)} disabled={promptingId === task.id} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-all disabled:opacity-50">
                      {promptingId === task.id ? '...' : task.prompt ? 'View' : 'Gen'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Progress (in_progress) */}
        <div className="flex flex-col h-full min-h-0">
          <div className="bg-[#12121a] border border-amber-500/30 rounded-t-xl px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-amber-300 flex items-center gap-2">
              <span className="text-lg">⚡</span>
              In Progress
            </h3>
            <span className="text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded">
              {visible.filter(t => t.status === 'in_progress').length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 bg-[#0a0a0f] border-x border-b border-amber-500/30 rounded-b-xl p-3 space-y-2">
            {loadingTasks ? (
              <div className="text-center text-slate-500 text-sm mt-4">Loading...</div>
            ) : visible.filter(t => t.status === 'in_progress').length === 0 ? (
              <div className="text-center text-slate-500 text-sm mt-4">Tidak ada task</div>
            ) : (
              visible.filter(t => t.status === 'in_progress').map((task) => (
                <div key={task.id} className="bg-[#12121a] border border-amber-500/30 hover:border-amber-500/50 transition-all rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">{task.feature_name}</span>
                    {task.prompt && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">✓</span>}
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">{task.title}</h4>
                  {task.detail && <p className="text-xs text-slate-400 line-clamp-2">{task.detail}</p>}
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => cycleStatus(task)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-all">Review</button>
                    <button onClick={() => generatePrompt(task)} disabled={promptingId === task.id} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-all disabled:opacity-50">
                      {promptingId === task.id ? '...' : task.prompt ? 'View' : 'Gen'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Done (done) */}
        <div className="flex flex-col h-full min-h-0">
          <div className="bg-[#12121a] border border-emerald-500/30 rounded-t-xl px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-emerald-300 flex items-center gap-2">
              <span className="text-lg">✅</span>
              Done
            </h3>
            <span className="text-xs text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded">
              {visible.filter(t => t.status === 'done').length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 bg-[#0a0a0f] border-x border-b border-emerald-500/30 rounded-b-xl p-3 space-y-2">
            {loadingTasks ? (
              <div className="text-center text-slate-500 text-sm mt-4">Loading...</div>
            ) : visible.filter(t => t.status === 'done').length === 0 ? (
              <div className="text-center text-slate-500 text-sm mt-4">Tidak ada task</div>
            ) : (
              visible.filter(t => t.status === 'done').map((task) => (
                <div key={task.id} className="bg-[#12121a] border border-emerald-500/30 hover:border-emerald-500/50 transition-all rounded-lg p-3 opacity-75">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">{task.feature_name}</span>
                    {task.prompt && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">✓</span>}
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">{task.title}</h4>
                  {task.detail && <p className="text-xs text-slate-400 line-clamp-2">{task.detail}</p>}
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => generatePrompt(task)} disabled={promptingId === task.id} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-all disabled:opacity-50">
                      {promptingId === task.id ? '...' : task.prompt ? 'View' : 'Gen'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 4: Review (review) */}
        <div className="flex flex-col h-full min-h-0">
          <div className="bg-[#12121a] border border-blue-500/30 rounded-t-xl px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-blue-300 flex items-center gap-2">
              <span className="text-lg">🔍</span>
              Review
            </h3>
            <span className="text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded">
              {visible.filter(t => t.status === 'review').length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 bg-[#0a0a0f] border-x border-b border-blue-500/30 rounded-b-xl p-3 space-y-2">
            {loadingTasks ? (
              <div className="text-center text-slate-500 text-sm mt-4">Loading...</div>
            ) : visible.filter(t => t.status === 'review').length === 0 ? (
              <div className="text-center text-slate-500 text-sm mt-4">Tidak ada task</div>
            ) : (
              visible.filter(t => t.status === 'review').map((task) => (
                <div key={task.id} className="bg-[#12121a] border border-blue-500/30 hover:border-blue-500/50 transition-all rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded">{task.feature_name}</span>
                    {task.prompt && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">✓</span>}
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">{task.title}</h4>
                  {task.detail && <p className="text-xs text-slate-400 line-clamp-2">{task.detail}</p>}
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => cycleStatus(task)} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded transition-all">Approve</button>
                    <button onClick={() => generatePrompt(task)} disabled={promptingId === task.id} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-all disabled:opacity-50">
                      {promptingId === task.id ? '...' : task.prompt ? 'View' : 'Gen'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ===== Modal Tambah Task ===== */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Tambah Task</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Fitur</label>
                <input
                  list="feature-list"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder={features[0] || 'Nama fitur'}
                  className="mt-1 w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                />
                <datalist id="feature-list">
                  {features.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-xs text-slate-400">Judul Task *</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Mis. Buat tabel & API list proyek"
                  className="mt-1 w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Detail (opsional)</label>
                <textarea
                  value={newDetail}
                  onChange={(e) => setNewDetail(e.target.value)}
                  rows={3}
                  placeholder="Deskripsi singkat / acceptance criteria"
                  className="mt-1 w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowAdd(false)}
                className="border border-[#2a2a3e] text-slate-300 rounded-lg px-4 py-2 text-sm font-medium transition-all"
              >
                Batal
              </button>
              <button
                onClick={addTask}
                disabled={adding}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
              >
                {adding ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal Prompt ===== */}
      {promptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl w-full max-w-2xl p-5 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white">Prompt untuk AI Agent</h2>
              <button onClick={() => setPromptModal(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              Task: <span className="text-white">{promptModal.task.title}</span>
            </p>
            <pre className="flex-1 overflow-y-auto bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg p-4 text-xs text-slate-300 whitespace-pre-wrap">
              {promptModal.prompt}
            </pre>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setPromptModal(null)}
                className="border border-[#2a2a3e] text-slate-300 rounded-lg px-4 py-2 text-sm font-medium transition-all"
              >
                Tutup
              </button>
              <button
                onClick={() => copyPrompt(promptModal.prompt)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all"
              >
                Salin Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal MCP Connect ===== */}
      {showMcp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowMcp(false)}>
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl w-full max-w-lg p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">MCP Connect — akuNgoding</h2>
              <button onClick={() => setShowMcp(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {mcp?.connected ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-emerald-400 font-medium">
                ✅ MCP akuNgoding terkoneksi
                {mcp.supabaseProject && <div className="text-xs text-slate-400 mt-1">Supabase: {mcp.supabaseProject}</div>}
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 font-medium">
                ❌ MCP belum terkoneksi
                {mcp?.error && <div className="text-xs text-slate-400 mt-1 font-normal">{mcp.error}</div>}
              </div>
            )}

            {mcp?.connected && mcp.tools && (
              <div className="mt-4">
                <p className="text-xs text-slate-400 mb-2">Tool tersedia ({mcp.tools.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {mcp.tools.map((t) => (
                    <span key={t} className="text-xs bg-[#1a1a2e] border border-[#2a2a3e] text-slate-300 px-2 py-1 rounded-md">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5">
              <p className="text-sm font-semibold text-white mb-2">Cara connect ke AI agent kamu</p>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg p-3">
                  <p className="text-slate-400 mb-1">Claude Code</p>
                  <code className="block text-emerald-400 break-all">
                    claude mcp add akuNgoding -- node /home/annnpii/orca/AkuNgoding/mcp-server/dist/index.js
                  </code>
                  <p className="text-slate-500 mt-1">
                    Pastikan env <span className="text-slate-300">SUPABASE_URL</span> &amp;{' '}
                    <span className="text-slate-300">SUPABASE_ANON_KEY</span> (atau NEXT_PUBLIC_*) tersedia saat agent
                    jalan. Contoh: <code className="text-emerald-400">SUPABASE_URL=... SUPABASE_ANON_KEY=... claude mcp add ...</code>
                  </p>
                </div>
                <div className="bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg p-3">
                  <p className="text-slate-400 mb-1">Cursor (`.mcp.json` di project root)</p>
                  <code className="block text-emerald-400 break-all">
                    {`{"mcpServers":{"akuNgoding":{"type":"stdio","command":"node","args":["/home/annnpii/orca/AkuNgoding/mcp-server/dist/index.js"]}}}`}
                  </code>
                </div>
                <div className="bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg p-3">
                  <p className="text-slate-400 mb-1">OpenCode / Orca GUI</p>
                  <p className="text-slate-500">
                    Tambah MCP stdio dengan command <code className="text-emerald-400">node</code> dan args{' '}
                    <code className="text-emerald-400">/home/annnpii/orca/AkuNgoding/mcp-server/dist/index.js</code>.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowMcp(false)} className="border border-[#2a2a3e] text-slate-300 rounded-lg px-4 py-2 text-sm font-medium transition-all">
                Tutup
              </button>
              <button onClick={checkMcp} disabled={checkingMcp} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50">
                {checkingMcp ? 'Cek...' : 'Cek Ulang'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ===== Tutorial Modal ===== */}
      <TaskPromptTutorial 
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        totalTasks={tasks.length}
      />
    </div>
  )
}