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

    const systemPrompt = `Kamu adalah System Analyst dan Product Manager berpengalaman.
Tugasmu adalah membantu user merinci sistem/aplikasi yang ingin mereka buat berdasarkan IDE mereka menjadi jelas agar tidak ada satupun ambiguitas saat pembuatan PRD (Product Requirements Document).

BERIKAN 3 - 5 PERTANYAAN KRITIS dan SPESIFIK yang digali langsung dari IDE user.
Setiap pertanyaan WAJIB ditujukan untuk menghilangkan asumsi ghaib tentang fitur, alur kerja, spesifikasi bisnis, atau user role. JANGAN berikan pertanyaan basa-basi.

FORMAT KELUARAN HARUS STRICT JSON (tanpa markdown, tanpa teks pembuka/penutup).
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
      "text": "[Pertanyaan Kritis Spesifik Menggali Ide 1, misal: Untuk fitur X, bagaimana rule ...]",
      "type": "multi",
      "options": ["Opsi Logis 1", "Opsi Logis 2", "Opsi Logis 3", "Lainnya"]
    }
  ]
}

ATURAN WAJIB:
1. Pertanyaan Pertama (q1) WAJIB menanyakan referensi desain seperti pada format di atas dengan type "text" dan options kosong.
2. Pertanyaan ke-2 hingga terakhir (q2, q3, q4..) HARUS pertanyaan cerdas yang MENGGALI SPESIFIK tentang IDE aplikasi yang diberikan. 
3. Pertanyaan ke-2 hingga terakhir HARUS menggunakan type "multi" atau "single".
4. Untuk type "multi" / "single", berikan 3-5 opsi jawaban di "options" yang logis dan relevan, ditambah SELALU akhiri opsi dengan "Lainnya" agar user bisa menambah deskripsi custom.
5. JANGAN BUAT DOKUMEN PRD. HANYA KELUARKAN JSON!`;

    const userPrompt = `Project Idea:\n${project.idea_input}\nTech Stack: ${JSON.stringify(project.tech_stack)}`;

    const response = await chatCompletion(llmConfig, [
      { role: 'system', content: systemPrompt },
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
      if (!Array.isArray(questions)) throw new Error("Not array");
    } catch(e) {
      console.error("LLM Parse Error:", content);
      questions = [
        { id: 'q1', text: 'Apa satu hal terpenting yang mau diselesaikan?', type: 'text', options: [] },
        { id: 'q2', text: 'Ceritakan user yang akan memakai ini.', type: 'text', options: [] },
        { id: 'q3', text: 'Apakah Anda punya referensi desain (link Figma, web inspirasi, dll)?', type: 'text', options: [] }
      ];
    }
    
    // Save generated questions to avoid regenerating on refresh
    await supabase.from('projects').update({ clarification_questions: questions }).eq('id', id);

    return NextResponse.json({ questions });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
