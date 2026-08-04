import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';
import { getActiveLlmConfig } from '@/lib/api-helpers';
import { chatCompletion, type ChatMessage } from '@/lib/llm-client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const taskId = body.task_id;
    const instruction = (body.instruction || '').trim();

    if (!taskId) return NextResponse.json({ error: 'task_id is required' }, { status: 400 });

    const { data: project } = await supabase
      .from('projects')
      .select('title, idea_input')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { data: task, error: taskError } = await supabase
      .from('breakdown_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('project_id', id)
      .single();
    if (taskError || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    // Ambil PRD utk konteks
    const { data: prdDocs } = await supabase
      .from('prd_documents')
      .select('content_markdown')
      .eq('project_id', id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    const prdExcerpt = (prdDocs?.content_markdown || '').slice(0, 6000);

    const basePrompt = `Kamu adalah software engineer. Kerjakan SATU task berikut dari project "${project.title}" sesuai PRD.

# TASK
${task.title}

${task.detail ? `Detail: ${task.detail}\n` : ''}${instruction ? `Instruksi tambahan dari user:\n${instruction}\n` : ''}
# KONTEKS IDE PRODUK
${project.idea_input}

# PRD (ekscerpt)
${prdExcerpt || '(PRD belum tersedia)'}

# KETENTUAN
1. Ikuti stack & arsitektur yang sudah dipakai di codebase (jangan ganti tanpa alasan kuat).
2. Tulis kode production-ready: error handling, validasi input, security basics.
3. Tambahkan/mutakhirkan test jika pola proyek memungkinkan.
4. Beri ringkasan singkat: file yang diubah, keputusan teknis, cara verifikasi.
5. Jika ada ambiguitas, tulis asumsi yang kamu ambil alih-alih berhenti bertanya.

# DEFINISI SELESAI (DoD)
- Fitur berfungsi sesuai deskripsi task.
- Tidak merusak fitur lain (regression-free).
- Kode bisa dijalankan tanpa error.
- Status task ini boleh ditandai DONE via tool MCP akuNgoding (update_task_status -> done).`;

    let prompt = basePrompt;
    // Kalau ada LLM config, biarkan LLM merapikan prompt (opsional, tidak wajib)
    try {
      const llmConfig = await getActiveLlmConfig(user.id);
      if (llmConfig) {
        const response = await chatCompletion(
          llmConfig,
          [
            { role: 'system', content: 'You refine developer task prompts. Return ONLY the refined prompt text, same language as input. Keep all technical context intact.' },
            { role: 'user', content: basePrompt },
          ],
          { temperature: 0.3 }
        );
        const refined = response.choices?.[0]?.message?.content;
        if (refined && refined.trim().length > 50) prompt = refined.trim();
      }
    } catch {
      // gagal refine → pakai template (jangan error)
    }

    // Simpan prompt ke task
    await supabase.from('breakdown_tasks').update({ prompt }).eq('id', taskId).eq('project_id', id);

    return NextResponse.json({ prompt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
