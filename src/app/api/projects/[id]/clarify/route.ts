import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';
import { getActiveLlmConfig } from '@/lib/api-helpers';
import { chatCompletion, type ChatMessage } from '@/lib/llm-client';
import { CLARIFICATION_SYSTEM_PROMPT } from '@/lib/prompts';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    
    // Verify ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id, title')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { data, error } = await supabase
      .from('clarification_messages')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ project, messages: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('idea_input, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (pError || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    if (body.skip === true) {
      await supabase.from('projects').update({ status: 'klarifikasi' }).eq('id', id);
      return NextResponse.json({ success: true, status: 'klarifikasi' });
    }

    const llmConfig = await getActiveLlmConfig(user.id);
    if (!llmConfig) {
      return NextResponse.json({ error: 'Please configure active LLM settings first' }, { status: 400 });
    }

    const userMessageContent = body.message || '';
    const isNextQuestion = body.action === 'next_question';
    if (!isNextQuestion && !userMessageContent) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const { data: history } = await supabase
      .from('clarification_messages')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    const messages: ChatMessage[] = [
      { role: 'system', content: CLARIFICATION_SYSTEM_PROMPT },
      { role: 'user', content: `Project Idea Context:\n${project.idea_input}` },
    ];

    if (history) {
      for (const msg of history) {
        messages.push({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.content });
      }
    }
    messages.push({ role: 'user', content: userMessageContent });

    const response = await chatCompletion(llmConfig, messages);
    let aiResponseContent = response.choices[0]?.message?.content || '';

    // Parse structured JSON response (questions array with suggested_answers)
    let parsedQuestions: any[] = [];
    let isStructured = false;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponseContent.match(/```json\s*([\s\S]*?)\s*```/) || aiResponseContent.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponseContent;
      parsedQuestions = JSON.parse(jsonStr.trim());
      isStructured = Array.isArray(parsedQuestions) && parsedQuestions.length > 0;
    } catch {
      // Not JSON — keep as plain text
    }

    // Guard: model bias langsung generate PRD. Kalau output keliatan PRD (heading markdown / terlalu panjang),
    // anggap sudah cukup jelas dan ganti dg sentinel biar history clarify tetap bersih.
    const looksLikePrd = /^#{1,3}\s/m.test(aiResponseContent) || (!isStructured && aiResponseContent.length > 600);
    if (looksLikePrd) {
      aiResponseContent = 'READY_TO_GENERATE_PRD';
      parsedQuestions = [];
      isStructured = false;
    }

    // Save user message
    if (!isNextQuestion) {
      await supabase.from('clarification_messages').insert({
        project_id: id,
        role: 'user',
        content: userMessageContent,
      });
    }

    // Save AI response (raw content for history)
    const { data: aiMessage, error: aiError } = await supabase.from('clarification_messages').insert({
      project_id: id,
      role: 'ai',
      content: aiResponseContent,
    }).select().single();

    if (aiError) throw aiError;

    // Count AI messages
    const { count } = await supabase
      .from('clarification_messages')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)
      .eq('role', 'ai');

    if (count && count >= 5) {
      await supabase.from('projects').update({ status: 'klarifikasi' }).eq('id', id);
    }

    const readyToGenerate = aiResponseContent === 'READY_TO_GENERATE_PRD' || (!!count && count >= 5);

    return NextResponse.json({
      message: aiMessage,
      questions: isStructured ? parsedQuestions : null,
      ai_message_count: count || 0,
      readyToGenerate: !!readyToGenerate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
