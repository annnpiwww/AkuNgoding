'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import { DEV_MOCK_USER, BYPASS_MODE } from '@/lib/auth-bypass'

export function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(BYPASS_MODE ? DEV_MOCK_USER : null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else if (BYPASS_MODE) {
        setUser(DEV_MOCK_USER)
      }
    }
    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || (BYPASS_MODE ? DEV_MOCK_USER : null))
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#0a0a0f]/80 border-b border-[#2a2a3e]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <span className="text-xl font-bold text-white tracking-tight">
                aku<span className="text-emerald-500">N</span>goding
              </span>
            </Link>
            {user && (
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link href="/dashboard" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/settings/llm" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Settings
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-400">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="border border-[#2a2a3e] hover:border-emerald-500/30 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#2a2a3e] bg-[#12121a]">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user && (
              <>
                <Link href="/dashboard" className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Dashboard</Link>
                <Link href="/settings/llm" className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Settings</Link>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-[#2a2a3e]">
            {user ? (
              <div className="px-5 flex flex-col space-y-3">
                <div className="text-sm text-slate-400">{user.email}</div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left border border-[#2a2a3e] hover:border-emerald-500/30 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="px-5 flex flex-col space-y-3">
                <Link href="/auth/login" className="text-slate-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Login</Link>
                <Link href="/auth/register" className="bg-emerald-600 text-white block px-3 py-2 rounded-md text-base font-medium text-center">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
