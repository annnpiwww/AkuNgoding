import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';
import { getActiveLlmConfig } from '@/lib/api-helpers';
import { chatCompletion, type ChatMessage } from '@/lib/llm-client';
import { REVISE_SECTION_SYSTEM_PROMPT } from '@/lib/prompts';
import { replaceSection } from '@/lib/markdown-parser';

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
    const { section_name, instruction } = body;

    if (!section_name || !instruction) {
      return NextResponse.json({ error: 'Section name and instruction are required' }, { status: 400 });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { data: prdDoc } = await supabase
      .from('prd_documents')
      .select('*')
      .eq('project_id', id)
      .single();

    if (!prdDoc || !prdDoc.content_markdown) {
      return NextResponse.json({ error: 'PRD Document not found' }, { status: 404 });
    }

    const llmConfig = await getActiveLlmConfig(user.id);
    if (!llmConfig) {
      return NextResponse.json({ error: 'Please configure active LLM settings first' }, { status: 400 });
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: REVISE_SECTION_SYSTEM_PROMPT },
      { role: 'user', content: `Current PRD:\n\n${prdDoc.content_markdown}\n\nTarget Section: ${section_name}\nInstruction: ${instruction}` },
    ];

    const response = await chatCompletion(llmConfig, messages);
    const revisedSectionContent = response.choices[0]?.message?.content || '';

    const updatedMarkdown = replaceSection(prdDoc.content_markdown, section_name, revisedSectionContent);

    const newVersion = (prdDoc.version || 1) + 1;
    await supabase.from('prd_documents').update({
      content_markdown: updatedMarkdown,
      version: newVersion,
    }).eq('project_id', id);

    return NextResponse.json({ content_markdown: updatedMarkdown });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
