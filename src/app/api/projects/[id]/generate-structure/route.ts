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
Aturan:
1. Output HANYA mermaid code, tanpa markdown \`\`\`mermaid atau teks lain.
2. Harus ada layer Frontend (UI), Backend (API), dan DB.
3. Node minimal 8-12 yang mewakili halaman atau modul utama.`;

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
            let cleanMermaid = fullMermaid.replace(/```mermaid/g, '').replace(/```/g, '').trim();
            await supabase.from('projects').update({ structure_diagram: cleanMermaid }).eq('id', id);
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
