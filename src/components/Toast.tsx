'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5)
    setToasts((prev) => [...prev, { id, message, type }])
  }

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1))
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toasts])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2" suppressHydrationWarning>
          {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              transform transition-all duration-300 ease-in-out
              animate-in slide-in-from-top-2 fade-in duration-300
              min-w-[300px] p-4 rounded-xl shadow-lg border flex items-center gap-3 text-sm font-medium
              ${toast.type === 'success' ? 'bg-[#12121a] border-emerald-500/30 text-emerald-400' : ''}
              ${toast.type === 'error' ? 'bg-[#12121a] border-red-500/30 text-red-400' : ''}
              ${toast.type === 'info' ? 'bg-[#12121a] border-blue-500/30 text-blue-400' : ''}
            `}
          >
            {toast.type === 'success' && (
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.message}
          </div>
        ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
