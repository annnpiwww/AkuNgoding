import { ProjectStatus } from '@/lib/types'

const STATUS_CONFIG: Record<ProjectStatus, { color: string, label: string }> = {
  draft_ide: { color: 'bg-yellow-500', label: 'Draft Ide' },
  klarifikasi: { color: 'bg-blue-500', label: 'Klarifikasi' },
  prd_generated: { color: 'bg-purple-500', label: 'PRD Generated' },
  breakdown: { color: 'bg-orange-500', label: 'Breakdown' },
  final: { color: 'bg-emerald-500', label: 'Final' }
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = STATUS_CONFIG[status] || { color: 'bg-gray-500', label: 'Unknown' }

  return (
    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#1a1a2e] border border-[#2a2a3e] gap-2">
      <span className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-xs font-medium text-slate-300">{config.label}</span>
    </div>
  )
}
