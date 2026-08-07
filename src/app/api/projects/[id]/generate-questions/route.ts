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

    const systemPrompt = `Bertindaklah sebagai Product Manager yang teliti. Tugasmu adalah menganalisis ide sistem yang diberikan dan menghasilkan BEBERAPA PERTANYAAN KLARIFIKASI.
JANGAN MEMBUAT DOKUMEN APAPUN. HANYA HASILKAN PERTANYAAN DALAM FORMAT JSON ARRAY.
ATURAN WAJIB:
1. JANGAN PERNAH beri pertanyaan umum. Pertanyaan WAJIB menyebutkan fitur/entitas dari ide tersebut.
2. Setiap pertanyaan WAJIB memiliki "options" (jawaban cepat).
3. Tipe: 'multi' atau 'single'.
4. Sertakan opsi "Lainnya" di setiap options.
5. Pertanyaan ke-1 WAJIB: "Apakah Anda memiliki referensi desain UI/UX (link Figma, web inspirasi)?" (tipe "text").
6. Keluarkan HANYA format JSON Array yang valid. JANGAN MENULIS APAPUN SELAIN JSON.

Format JSON WAJIB:
{
  "questions": [
    {
      "id": "q1",
      "text": "Apakah Anda memiliki referensi desain UI/UX?",
      "type": "text",
      "options": []
    },
    {
      "id": "q2",
      "text": "Terkait [Nama Fitur Dari Ide], apakah...",
      "type": "multi",
      "options": ["Opsi A", "Opsi B", "Lainnya"]
    }
  ]
}`;

    const userPrompt = `Project Idea:\n${project.idea_input}\nTech Stack: ${JSON.stringify(project.tech_stack)}`;

    const response = await chatCompletion(llmConfig, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {});

    
    let content = response.choices[0]?.message?.content || '{}';
    content = content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    
    // Attempt extra extraction if prepended with text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) content = jsonMatch[0];

    let questions;
    try {
      const parsed = JSON.parse(content);
      questions = parsed.questions || parsed;
      if (!Array.isArray(questions)) throw new Error("Not array");
    } catch(e) {
      console.error("LLM Parse Error:", content);
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
