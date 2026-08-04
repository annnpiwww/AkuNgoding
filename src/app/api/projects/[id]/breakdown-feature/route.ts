import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';
import { getActiveLlmConfig } from '@/lib/api-helpers';
import { chatCompletion, type ChatMessage } from '@/lib/llm-client';
import { BREAKDOWN_FEATURE_SYSTEM_PROMPT, BREAKDOWN_FORMAT_INSTRUCTIONS } from '@/lib/prompts';
import { appendBreakdown } from '@/lib/markdown-parser';

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
    const { feature_name, feature_description } = body;

    if (!feature_name || !feature_description) {
      return NextResponse.json({ error: 'Feature name and description are required' }, { status: 400 });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, status')
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
      { role: 'system', content: BREAKDOWN_FEATURE_SYSTEM_PROMPT },
      { role: 'user', content: `${BREAKDOWN_FORMAT_INSTRUCTIONS}\n\nCurrent PRD:\n\n${prdDoc.content_markdown}\n\nFeature to Breakdown:\nName: ${feature_name}\nDescription: ${feature_description}` },
    ];

    const response = await chatCompletion(llmConfig, messages);
    const breakdownResult = response.choices[0]?.message?.content || '';

    const updatedMarkdown = appendBreakdown(prdDoc.content_markdown, feature_name, breakdownResult);

    const newVersion = (prdDoc.version || 1) + 1;
    await supabase.from('prd_documents').update({
      content_markdown: updatedMarkdown,
      version: newVersion,
    }).eq('project_id', id);

    if (project.status !== 'breakdown' && project.status !== 'final') {
      await supabase.from('projects').update({ status: 'breakdown' }).eq('id', id);
    }

    return NextResponse.json({ content_markdown: updatedMarkdown });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
