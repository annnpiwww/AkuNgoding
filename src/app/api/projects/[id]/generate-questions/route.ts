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

    const systemPrompt = `Kamu adalah Senior Product Manager. Analisis ide aplikasi ini secara MENDALAM. Hasilkan pertanyaan klarifikasi KRUSIAL agar PRD tidak berasumsi.
ATURAN WAJIB:
1. JANGAN PERNAH beri pertanyaan umum/template! Pertanyaan WAJIB menyebutkan fitur/entitas/konteks spesifik dari ide user.
2. Setiap pertanyaan WAJIB memiliki "options" (quick answers) yang spesifik dan relevan dengan pertanyaan tersebut.
3. Tipe dapat berupa 'multi' (bisa pilih banyak) atau 'single'. Utamakan 'multi' untuk fitur/kebutuhan.
4. Sertakan opsi "Lainnya" di setiap options.
5. Pertanyaan ke-1 WAJIB: "Apakah Anda memiliki referensi desain UI/UX (link Figma, web inspirasi kompetitor)?" dengan tipe "text" (options kosong).
6. Keluarkan HANYA format JSON Array yang valid tanpa markdown! TIDAK boleh ada chat sebelum/sesudah JSON.

Format JSON:
[
  {
    "id": "q1",
    "text": "Apakah Anda memiliki referensi desain UI/UX...",
    "type": "text",
    "options": []
  },
  {
    "id": "q2",
    "text": "Untuk fitur [Nama Fitur Spesifik], apakah...", // Harus relevan!
    "type": "multi", // quick answers yg bisa dipilih lebih dari satu
    "options": ["Opsi Spesifik A", "Opsi Spesifik B", "Lainnya"]
  }
]`;

    const userPrompt = `Project Idea:\n${project.idea_input}\nTech Stack: ${JSON.stringify(project.tech_stack)}`;

    const response = await chatCompletion(llmConfig, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    
    let content = response.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) content = jsonMatch[0];
    else content = content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    
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
