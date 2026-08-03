'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Password tidak cocok')
      setIsLoading(false)
      return
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsLoading(false)
    } else if (signUpData.session) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setMessage('Registrasi berhasil! Silakan periksa inbox email Anda untuk mengkonfirmasi pendaftaran sebelum login.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
      <div className="w-full max-w-md bg-[#12121a] border border-[#2a2a3e] rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            aku<span className="text-emerald-500">N</span>goding
          </h1>
          <p className="text-slate-400 text-sm">
            Daftar untuk mulai mengubah ide jadi PRD
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[#2a2a3e] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[#2a2a3e] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-all"
              placeholder="Min. 6 karakter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Konfirmasi Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[#2a2a3e] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-all"
              placeholder="Ulangi password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !!message}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-6 py-2.5 font-medium transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            Daftar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Sudah punya akun?{' '}
          <Link href="/auth/login" className="text-emerald-500 hover:text-emerald-400 font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
