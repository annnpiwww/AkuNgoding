import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'akuNgoding — AI PRD Generator',
  description: 'Ubah ide mentah menjadi PRD terstruktur dengan bantuan AI. Siap dikirim ke AI coding agent atau tim developer.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0a0a0f] text-slate-300 antialiased font-sans" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
