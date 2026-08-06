import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';
import { getActiveLlmConfig } from '@/lib/api-helpers';
import { extractTasksFromPrd } from '@/lib/task-extractor';

/**
 * Re-generate breakdown_tasks dari PRD yang sudah tersimpan di prd_documents.
 * Dipakai utk project lama (PRD digenerate sebelum fitur auto-breakdown ada)
 * atau saat user mau bikin ulang task breakdown tanpa regenerate PRD penuh.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const llmConfig = await getActiveLlmConfig(user.id);
    if (!llmConfig) {
      return NextResponse.json({ error: 'Please configure active LLM settings first' }, { status: 400 });
    }

    // Ambil PRD terbaru
    const { data: prdDoc } = await supabase
      .from('prd_documents')
      .select('content_markdown')
      .eq('project_id', id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const prdContent = prdDoc?.content_markdown;
    if (!prdContent || prdContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'PRD belum ada. Generate PRD dulu sebelum breakdown task.' },
        { status: 400 }
      );
    }

    const extractedTasks = await extractTasksFromPrd(prdContent, llmConfig);

    if (extractedTasks.length === 0) {
      return NextResponse.json(
        { error: 'Gagal ekstrak task dari PRD. Coba generate PRD ulang.' },
        { status: 422 }
      );
    }

    const tasksToInsert = extractedTasks.map((task, index) => ({
      project_id: id,
      feature_name: task.feature_name,
      title: task.title,
      detail: task.detail,
      status: 'todo',
      sort_order: index,
      task_id: task.task_id || `TASK-${String(index + 1).padStart(3, '0')}`,
      epic: task.epic || 'Core',
      module: task.module || '',
      category: task.category || 'Backend',
      priority: task.priority || 'P1',
      complexity: task.complexity || 'Medium',
      estimated_hours: task.estimated_hours || 1,
      depends_on: task.depends_on || '',
      labels: task.labels || '',
      acceptance_criteria: task.acceptance_criteria || task.detail || '',
      files_affected: task.files_affected || '',
    }));

    // Hapus task lama project, lalu insert ulang (regenerate)
    const { error: delErr } = await supabase
      .from('breakdown_tasks')
      .delete()
      .eq('project_id', id);
    if (delErr) {
      console.error('regenerate: error clearing old tasks:', delErr);
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    const { error: insertError } = await supabase
      .from('breakdown_tasks')
      .insert(tasksToInsert);
    if (insertError) {
      console.error('regenerate: error inserting tasks:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await supabase.from('projects').update({ status: 'prd_generated' }).eq('id', id);

    return NextResponse.json({
      generated: tasksToInsert.length,
      message: `${tasksToInsert.length} task berhasil digenerate dari PRD`,
    });
  } catch (error: any) {
    console.error('regenerate tasks error:', error?.message);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}