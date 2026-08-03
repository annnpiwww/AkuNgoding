import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/StatusBadge'
import { Project } from '@/lib/types'

function getNextActionRoute(id: string, status: string) {
  switch (status) {
    case 'draft_ide':
    case 'klarifikasi':
      return `/project/${id}/clarify`
    case 'prd_generated':
      return `/project/${id}/edit`
    case 'breakdown':
      return `/project/${id}/breakdown`
    case 'final':
      return `/project/${id}/edit`
    default:
      return `/project/${id}/clarify`
  }
}

import { getEffectiveUser } from '@/lib/auth-bypass'

export default async function DashboardPage() {
  const supabase = await createClient()
  const user = await getEffectiveUser(supabase)

  if (!user) {
    return null
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Project Saya</h1>
          <p className="text-slate-400 mt-1">Daftar ide dan PRD yang sedang kamu kerjakan.</p>
        </div>
        <Link 
          href="/project/new"
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-6 py-2.5 font-medium transition-all inline-flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Project Baru
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-[#1a1a2e] rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Belum ada project</h3>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            Mulai ubah ide mentahmu menjadi PRD yang terstruktur. AI kami siap membantu proses klarifikasi dan penyusunan.
          </p>
          <Link 
            href="/project/new"
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-6 py-2.5 font-medium transition-all"
          >
            Mulai Buat PRD
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
            <div key={project.id} className="bg-[#12121a] border border-[#2a2a3e] hover:border-emerald-500/30 transition-all rounded-xl p-5 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-white text-lg truncate pr-2" title={project.title}>
                  {project.title}
                </h3>
                <StatusBadge status={project.status} />
              </div>
              
              <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-grow">
                {project.idea_input}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-[#2a2a3e] mt-auto">
                <span className="text-xs text-slate-500">
                  {new Date(project.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                
                <Link
                  href={getNextActionRoute(project.id, project.status)}
                  className="text-sm font-medium text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  Lanjutkan
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
