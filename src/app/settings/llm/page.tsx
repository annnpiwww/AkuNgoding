'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'

export default function LlmSettingsPage() {
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [modelName, setModelName] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null)
  
  const [savedSettings, setSavedSettings] = useState<any[]>([])
  
  const { showToast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/llm-settings')
      if (res.ok) {
        const data = await res.json()
        setSavedSettings(data)
        
        // Populate active setting
        const active = data.find((s: any) => s.is_active)
        if (active) {
          setBaseUrl(active.base_url)
          setModelName(active.model_name)
          setApiKey(active.api_key || '') 
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleTest = async () => {
    if (!baseUrl || !apiKey || !modelName) {
      showToast('Mohon lengkapi semua field', 'error')
      return
    }

    setIsTesting(true)
    setTestResult(null)
    
    try {
      const res = await fetch('/api/llm-settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_url: baseUrl, api_key: apiKey, model_name: modelName })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setTestResult({ success: true, message: `Koneksi berhasil! Model terdeteksi: ${data.model || modelName}` })
        showToast('Koneksi berhasil', 'success')
      } else {
        setTestResult({ success: false, message: data.error || 'Gagal terhubung ke API' })
        showToast('Koneksi gagal', 'error')
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || 'Terjadi kesalahan' })
      showToast('Koneksi gagal', 'error')
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!baseUrl || !apiKey || !modelName) {
      showToast('Mohon lengkapi semua field', 'error')
      return
    }

    setIsLoading(true)
    
    try {
      const res = await fetch('/api/llm-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_url: baseUrl, api_key: apiKey, model_name: modelName })
      })
      
      if (res.ok) {
        showToast('Pengaturan berhasil disimpan', 'success')
        fetchSettings()
        setApiKey('') // Clear the API key for security (the user can re-enter it or the API returns it as stars)
      } else {
        const error = await res.json()
        showToast(error.error || 'Gagal menyimpan pengaturan', 'error')
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetActive = async (id: string) => {
    try {
      const res = await fetch(`/api/llm-settings/${id}/active`, { method: 'POST' })
      if (res.ok) {
        showToast('Pengaturan LLM aktif diperbarui', 'success')
        fetchSettings()
      }
    } catch (error) {
      showToast('Gagal mengaktifkan pengaturan', 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Pengaturan LLM</h1>
        <p className="text-slate-400">
          Konfigurasi provider LLM (OpenAI, Anthropic, atau local LLM via Ollama/LMStudio). 
          Data akan disimpan aman di server.
        </p>
      </div>

      <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Tambah / Edit Konfigurasi</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Base URL</label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                required
                className="w-full bg-[#0a0a0f] border border-[#2a2a3e] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Model Name</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="gpt-4o"
                required
                className="w-full bg-[#0a0a0f] border border-[#2a2a3e] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                required={!savedSettings.length} // Not strictly required if just testing existing, but good enough
                className="w-full bg-[#0a0a0f] border border-[#2a2a3e] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showApiKey ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.188-1.58c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
              {testResult.success ? (
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 border border-[#2a2a3e] hover:border-emerald-500/30 text-slate-300 rounded-lg px-6 py-2.5 font-medium transition-all flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              )}
              Test Connection
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-6 py-2.5 font-medium transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
              Simpan & Jadikan Aktif
            </button>
          </div>
        </form>
      </div>

      {savedSettings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Konfigurasi Tersimpan</h2>
          <div className="grid gap-4">
            {savedSettings.map((setting) => (
              <div 
                key={setting.id}
                className={`bg-[#12121a] border rounded-xl p-5 flex items-center justify-between transition-all ${
                  setting.is_active ? 'border-emerald-500/50' : 'border-[#2a2a3e] hover:border-emerald-500/30'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-white">{setting.model_name}</h3>
                    {setting.is_active && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mb-1">{setting.base_url}</p>
                </div>
                
                {!setting.is_active && (
                  <button
                    onClick={() => handleSetActive(setting.id)}
                    className="border border-[#2a2a3e] hover:border-emerald-500/30 text-slate-300 text-sm rounded-lg px-4 py-2 transition-all"
                  >
                    Set Aktif
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
