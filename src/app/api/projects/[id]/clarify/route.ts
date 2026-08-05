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
    
    // For next_question action, use explicit instruction instead of empty message
    const requestContent = isNextQuestion 
      ? 'Buatkan 3-8 pertanyaan klarifikasi untuk memahami kebutuhan project ini secara detail. Output dalam format JSON array sesuai instruksi system prompt.'
      : userMessageContent;
    
    messages.push({ role: 'user', content: requestContent });

    // Retry loop with validation for structured questions (min 3 on first turn)
    let aiResponseContent = '';
    let parsedQuestions: any[] = [];
    let isStructured = false;
    let attempts = 0;
    const maxAttempts = 3;
    const isFirstRound = !history || history.length === 0;

    while (attempts < maxAttempts) {
      attempts++;
      
      const response = await chatCompletion(llmConfig, messages, { 
        response_format: { type: "json_object" } 
      });
      aiResponseContent = response.choices[0]?.message?.content || '';

      // Parse structured JSON response (questions array with suggested_answers)
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = aiResponseContent.match(/```json\s*([\s\S]*?)\s*```/) || aiResponseContent.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponseContent;
        parsedQuestions = JSON.parse(jsonStr.trim());
        isStructured = Array.isArray(parsedQuestions) && parsedQuestions.length > 0;
      } catch {
        // Not JSON — keep as plain text
        parsedQuestions = [];
        isStructured = false;
      }

      // Guard: model bias langsung generate PRD. Kalau output keliatan PRD (heading markdown / terlalu panjang),
      // anggap sudah cukup jelas dan ganti dg sentinel biar history clarify tetap bersih.
      // CRITICAL: Skip this check on first turn - we NEED questions on first round, even if long.
      const looksLikePrd = !isFirstRound && (/^#{1,3}\s/m.test(aiResponseContent) || (!isStructured && aiResponseContent.length > 600));
      if (looksLikePrd) {
        aiResponseContent = 'READY_TO_GENERATE_PRD';
        parsedQuestions = [];
        isStructured = false;
      }

      // Validation: first turn MUST produce structured JSON with minimum 3 questions
      const needsRetry = isFirstRound && attempts < maxAttempts && (
        !isStructured || // AI didn't return JSON format at all
        parsedQuestions.length < 3 // AI returned JSON but <3 questions
      );
      
      if (needsRetry) {
        let reminder = '';
        if (!isStructured) {
          reminder = `Response sebelumnya BUKAN format JSON array. WAJIB output format JSON array yang dimulai dengan '['. Contoh lengkap:\n[\n  {"category":"Workflow & Approval","question":"...","suggested_answers":["...","...","Custom (tulis sendiri)"]}\n]\nMinimal 3 pertanyaan. Output langsung JSON array, JANGAN pakai code fence.`;
        } else {
          reminder = `Response sebelumnya hanya ${parsedQuestions.length} pertanyaan. WAJIB minimal 3 pertanyaan dalam format JSON array. Ulangi dengan 3-8 pertanyaan sekaligus.`;
        }
        messages.push({ role: 'user', content: reminder });
        continue; // Retry
      }

      // Validation passed, or retries exhausted, or not first round
      break;
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

    // SAFEGUARD: NEVER allow READY on first AI turn — force minimum 1 clarification round
    const isFirstTurn = (count || 0) <= 1;
    if (isFirstTurn && aiResponseContent === 'READY_TO_GENERATE_PRD') {
      // Model tried to skip questions — reject and force questions
      return NextResponse.json({ 
        error: 'AI harus memberikan minimal 1 pertanyaan klarifikasi. Coba lagi atau skip manual.' 
      }, { status: 500 });
    }

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
