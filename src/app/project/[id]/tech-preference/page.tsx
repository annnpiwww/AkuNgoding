'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { MonitorSmartphone, Server, Database, Cloud } from 'lucide-react'
import Link from 'next/link'

export default function TechPreferencePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const [mode, setMode] = useState<'ai' | 'manual' | null>(null)
  const [stack, setStack] = useState({ frontend: '', backend: '', db: '', deploy: '' })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const techOptions = {
    frontend: ['Next.js', 'React (Vite)', 'Vue/Nuxt', 'SvelteKit', 'Astro', 'React Native', 'Flutter', 'PWA (vanilla)'],
    backend: ['Node.js (Express)', 'Node.js (NestJS)', 'Fastify', 'Hono', 'Python (FastAPI)', 'Python (Django)', 'Go (Fiber)', 'Bun (Elysia)', 'Laravel', 'Supabase Edge Functions'],
    db: ['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Supabase', 'Firebase Firestore', 'PlanetScale', 'Turso', 'Google Sheets'],
    deploy: ['Vercel', 'Netlify', 'Cloudflare Pages/Workers', 'Railway', 'Render', 'Fly.io', 'VPS (Docker)', 'AWS', 'GCP', 'Self-hosted']
  }

  const handleSave = async () => {
    if (!mode) return showToast('Pilih preferensi teknologi', 'error')
    if (mode === 'manual' && (!stack.frontend || !stack.backend || !stack.db || !stack.deploy)) {
      return showToast('Lengkapi semua pilihan teknologi', 'error')
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tech_preference_mode: mode,
          tech_stack: stack
        }),
      })

      if (!res.ok) throw new Error('Gagal menyimpan preferensi')
      router.push(`/project/${id}/clarify`)
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Preferensi Teknologi</h1>
        <p className="text-slate-400">Udah punya pilihan tech stack, atau mau AI yang tentuin?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div 
          onClick={() => setMode('ai')}
          className={`p-6 rounded-xl border cursor-pointer transition-all ${
            mode === 'ai' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
          }`}
        >
          <h2 className="text-xl font-semibold text-white mb-2">Biarkan AI pilih 🤖</h2>
          <p className="text-sm text-slate-400">AI rekomendasiin stack yang paling cocok buat project lo.</p>
        </div>
        <div 
          onClick={() => setMode('manual')}
          className={`p-6 rounded-xl border cursor-pointer transition-all ${
            mode === 'manual' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
          }`}
        >
          <h2 className="text-xl font-semibold text-white mb-2">Pilih Sendiri 🛠️</h2>
          <p className="text-sm text-slate-400">Lo tentuin teknologi yang mau dipakai per layer.</p>
        </div>
      </div>

      {mode === 'manual' && (
        <div className="grid md:grid-cols-2 gap-6 mb-8 animate-in mt-4 fade-in slide-in-from-top-4 duration-300">
          {/* Frontend */}
          <div className="p-5 border border-slate-700 rounded-lg bg-slate-800/30">
            <div className="flex items-center gap-3 mb-4">
              <MonitorSmartphone className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-semibold text-white">Frontend</h3>
                <p className="text-xs text-slate-400">UI & tampilan user</p>
              </div>
            </div>
            <select 
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-emerald-500 outline-none"
              value={stack.frontend}
              onChange={(e) => setStack({...stack, frontend: e.target.value})}
            >
              <option value="">Pilih framework...</option>
              {techOptions.frontend.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Backend */}
          <div className="p-5 border border-slate-700 rounded-lg bg-slate-800/30">
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-semibold text-white">Backend</h3>
                <p className="text-xs text-slate-400">Logic & API srv</p>
              </div>
            </div>
            <select 
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-emerald-500 outline-none"
              value={stack.backend}
              onChange={(e) => setStack({...stack, backend: e.target.value})}
            >
              <option value="">Pilih backend...</option>
              {techOptions.backend.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Database */}
          <div className="p-5 border border-slate-700 rounded-lg bg-slate-800/30">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-semibold text-white">DB</h3>
                <p className="text-xs text-slate-400">Penyimpanan data</p>
              </div>
            </div>
            <select 
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-emerald-500 outline-none"
              value={stack.db}
              onChange={(e) => setStack({...stack, db: e.target.value})}
            >
              <option value="">Pilih DB...</option>
              {techOptions.db.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Deploy */}
          <div className="p-5 border border-slate-700 rounded-lg bg-slate-800/30">
            <div className="flex items-center gap-3 mb-4">
              <Cloud className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-semibold text-white">Deployment</h3>
                <p className="text-xs text-slate-400">Hosting & infra</p>
              </div>
            </div>
            <select 
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-emerald-500 outline-none"
              value={stack.deploy}
              onChange={(e) => setStack({...stack, deploy: e.target.value})}
            >
              <option value="">Pilih platform...</option>
              {techOptions.deploy.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-800">
        <Link href="/project/new" className="text-slate-400 hover:text-white px-4 py-2">
          Kembali
        </Link>
        <button
          onClick={handleSave}
          disabled={!mode || isLoading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-8 py-3 font-medium transition-all disabled:opacity-50"
        >
          {isLoading ? 'Menyimpan...' : 'Lanjutkan'}
        </button>
      </div>
    </div>
  )
}
