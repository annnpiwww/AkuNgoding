import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';
import { getActiveLlmConfig } from '@/lib/api-helpers';
import { chatCompletion, type ChatMessage } from '@/lib/llm-client';

import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip + '_questions', 5, 60000)) {
      return NextResponse.json({ error: 'Terlalu banyak request. Tunggu 1 menit.' }, { status: 429 });
    }

    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { data: project } = await supabase.from('projects').select('*').eq('id', id).eq('user_id', user.id).single();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Use cached questions if they already exist
    if (project.clarification_questions && Array.isArray(project.clarification_questions) && project.clarification_questions.length > 0) {
      return NextResponse.json({ questions: project.clarification_questions });
    }

    const llmConfig = await getActiveLlmConfig(user.id);
    if (!llmConfig) return NextResponse.json({ error: 'LLM not configured' }, { status: 400 });

    const systemPrompt = `Kamu adalah AI System Analyst. Tugasmu HANYA menghasilkan daftar pertanyaan evaluasi dalam format JSON murni. 
DILARANG KERAS MEMBUAT DOKUMEN, OVERVIEW, ATAU PENJELASAN APAPUN. JANGAN MENULIS "# 1" ATAU FORMAT MARKDOWN LAINNYA.
Keluarkan LANGSUNG object JSON berisi pertanyaan kritis untuk user.

BERIKAN 3 - 5 PERTANYAAN spesifik yang digali dari sistem yang ingin mereka buat.
Setiap pertanyaan memiliki opsi jawaban ganda untuk menghilangkan ambiguitas fitur.

FORMAT OUTPUT WAJIB 100% JSON:
{
  "questions": [
    {
      "id": "q1",
      "text": "Apakah Anda memiliki referensi desain UI/UX (Misal URL Figma, Dribbble, atau nama web inspirasi)?",
      "type": "text",
      "options": []
    },
    {
      "id": "q2",
      "text": "[Pertanyaan Kritis Spesifik 1, misal: Untuk fitur X, bagaimana rule nya?]",
      "type": "multi",
      "options": ["Opsi 1", "Opsi 2", "Opsi 3", "Lainnya"]
    }
  ]
}

ATURAN:
1. JANGAN PERNAH MENULIS TEKS DI LUAR JSON.
2. JANGAN MEMBUAT RINGKASAN IDE ATAU PRD.
3. HARUS "type": "multi" atau "single" dengan "options" yang berakhiran "Lainnya" untuk q2 dan seterusnya.`;

    const userPrompt = `${systemPrompt}\n\nProject Idea:\n${project.idea_input}\nTech Stack: ${JSON.stringify(project.tech_stack)}`;

    const response = await chatCompletion(llmConfig, [
      { role: 'user', content: userPrompt }
    ]);

    
    let content = response.choices[0]?.message?.content || '{}';
    content = content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    
    // Extract everything between the first { and the last }
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) content = jsonMatch[0];

    let questions;
    try {
      const parsed = JSON.parse(content);
      questions = parsed.questions || parsed;
      if (!Array.isArray(questions)) throw new Error("Format JSON bukan array");
    } catch(e: any) {
      console.error("LLM Parse Error:", content);
      throw new Error(`LLM gagal merespons dengan format JSON yang valid. Silakan coba generate ulang. (Pesan LLM: ${e.message})`);
    }
    
    // Save generated questions to avoid regenerating on refresh
    await supabase.from('projects').update({ clarification_questions: questions }).eq('id', id);

    return NextResponse.json({ questions });

  } catch (error: any) {
    console.error("Top level route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
