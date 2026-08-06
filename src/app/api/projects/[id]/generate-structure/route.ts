import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';
import { getActiveLlmConfig } from '@/lib/api-helpers';
import { chatCompletionStream, type ChatMessage } from '@/lib/llm-client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { data: project } = await supabase.from('projects').select('*').eq('id', id).single();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const llmConfig = await getActiveLlmConfig(user.id);
    if (!llmConfig) return NextResponse.json({ error: 'Configure active LLM' }, { status: 400 });

    const systemPrompt = `Kamu adalah Software Architect. Buat diagram arsitektur Mermaid (flowchart TD) untuk project ini.
Aturan WAJIB (STRICT):
1. Output HANYA mermaid code murni, DILARANG pakai markdown ```mermaid.
2. Harus diawali dengan kata "flowchart TD" di baris pertama.
3. Semua teks di dalam node (seperti didalam kurung siku []) DILARANG mengandung karakter khusus seperti kutip ("), koma (,), titik dua (:) atau kurung biasa (!). Gunakan huruf dan spasi saja untuk label.
4. Jangan tambahkan kata pembuka/penutup.`;

    const userPrompt = `
Idea: ${project.idea_input}
Tech Stack: ${JSON.stringify(project.tech_stack || {})}
QA: ${JSON.stringify(project.clarification_answers || [])}
Buatkan mermaid flowchart TD.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const stream = await chatCompletionStream(llmConfig, messages);

    let fullMermaid = '';
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        fullMermaid += text;
        controller.enqueue(chunk);
      },
      async flush() {
        if (fullMermaid) {
            let cleanMermaid = fullMermaid;
            const match = cleanMermaid.match(/\`\`\`(?:mermaid)?([\s\S]*?)\`\`\`/);
            if (match) {
                cleanMermaid = match[1];
            } else {
                cleanMermaid = cleanMermaid.replace(/\`\`\`mermaid/g, '').replace(/\`\`\`/g, '');
            }
            await supabase.from('projects').update({ structure_diagram: cleanMermaid.trim() }).eq('id', id);
        }
      }
    });

    return new Response(stream.pipeThrough(transformStream), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
