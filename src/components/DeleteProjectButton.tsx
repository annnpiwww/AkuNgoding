'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

interface Props {
  projectId: string
  projectTitle: string
}

export default function DeleteProjectButton({ projectId, projectTitle }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus project')
      setOpen(false)
      showToast(`Project "${projectTitle}" dihapus`, 'success')
      router.refresh()
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus project', 'error')
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Hapus project "${projectTitle}"`}
        aria-label={`Hapus project ${projectTitle}`}
        className="text-slate-500 hover:text-red-400 transition-colors p-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => { if (!deleting) setOpen(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Konfirmasi hapus project"
            className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 shrink-0 rounded-full bg-red-500/15 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Hapus Project?</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Project <span className="text-white font-medium">"{projectTitle}"</span> beserta seluruh
                  PRD &amp; riwayat klarifikasinya akan dihapus permanen dari database. Tindakan ini tidak bisa dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 font-medium transition-colors"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="flex-1 border border-[#2a2a3e] hover:border-slate-500 disabled:opacity-50 text-slate-300 rounded-lg px-4 py-2.5 font-medium transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
