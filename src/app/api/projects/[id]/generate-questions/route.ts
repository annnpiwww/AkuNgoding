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
    const { data: project } = await supabase.from('projects').select('*').eq('id', id).eq('user_id', user.id).single();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const llmConfig = await getActiveLlmConfig(user.id);
    if (!llmConfig) return NextResponse.json({ error: 'LLM not configured' }, { status: 400 });

    const systemPrompt = `Kamu adalah Product Manager. Analisis ide ini secara mendalam dan hasilkan pertanyaan klarifikasi krusial agar PRD tidak berasumsi sendiri. 
ATURAN WAJIB: 
1. Jangan beri pertanyaan umum/template! Harus mengacu langsung pada konteks spesifik ide user (sebutkan fitur/entitas dari ide mereka).
2. Minimal 4 pertanyaan, maksimal 8. 
3. WAJIB sisipkan 1 pertanyaan (bebas di urutan ke berapa): "Apakah Anda memiliki referensi desain UI/UX aplikasi lain dari kompetitor atau inspirasi tertentu?" (tipe text).
4. Keluarkan HANYA format JSON Array yang valid, tanpa teks pembuka/penutup, DILARANG menggunakan markdown code fence. 
Format JSON:
[
  {
    "id": "q1",
    "text": "Pertanyaan terarah sesuai ide...",
    "type": "text", // 'text', 'single', 'multi'
    "options": ["Opsi A", "Opsi B", "Lainnya"] // isi jika type single/multi.
  }
]`;

    const userPrompt = `Project Idea:\n${project.idea_input}\nTech Stack: ${JSON.stringify(project.tech_stack)}`;

    const response = await chatCompletion(llmConfig, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    let content = response.choices[0]?.message?.content || '{}';
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let questions;
    try {
      questions = JSON.parse(content);
    } catch(e) {
      // Fallback
      questions = [
        { id: 'q1', text: 'Apa satu hal terpenting yang mau diselesaikan?', type: 'text', options: [] },
        { id: 'q2', text: 'Ceritakan user yang akan memakai ini.', type: 'text', options: [] },
        { id: 'q3', text: 'Apakah Anda punya referensi desain (link Figma, web inspirasi, dll)?', type: 'text', options: [] }
      ];
    }
    
    return NextResponse.json({ questions });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
