import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';
import { getActiveLlmConfig } from '@/lib/api-helpers';
import { chatCompletion, type ChatMessage } from '@/lib/llm-client';

const PROMPT_GENERATION_SYSTEM = `You are an expert prompt engineer for AI coding agents (Claude Code, Cursor, GitHub Copilot, etc.).

Your task: Given a PRD task breakdown item with feature name, title, and detail, generate a complete, actionable prompt that an AI coding agent can execute immediately.

OUTPUT RULES:
- Prompt must be complete and self-contained (no "refer to PRD" vagueness)
- Include specific acceptance criteria from the task detail
- Specify tech stack (Next.js 15, React 19, TypeScript, Supabase, Tailwind v4)
- Include file paths, function names, and concrete implementation steps
- Add validation and testing instructions
- Reply in Indonesian if task is in Indonesian, English if task is in English

PROMPT STRUCTURE:
1. Context: What feature/module this task belongs to
2. Task: Clear objective
3. Requirements: Specific acceptance criteria
4. Implementation steps: Concrete actions
5. Validation: How to verify it works

Keep prompt concise but complete (200-400 words).`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id, title')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Fetch all tasks without prompts
    const { data: tasks, error: fetchError } = await supabase
      .from('breakdown_tasks')
      .select('*')
      .eq('project_id', id)
      .or('prompt.is.null,prompt.eq.')
      .order('sort_order', { ascending: true });

    if (fetchError) throw fetchError;
    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No tasks need prompt generation',
        generated: 0 
      });
    }

    const llmConfig = await getActiveLlmConfig(user.id);
    if (!llmConfig) {
      return NextResponse.json({ 
        error: 'No active LLM configuration. Please configure LLM settings first.' 
      }, { status: 400 });
    }

    // Generate prompts for all tasks
    const updates = [];
    for (const task of tasks) {
      try {
        const messages: ChatMessage[] = [
          { role: 'system', content: PROMPT_GENERATION_SYSTEM },
          { 
            role: 'user', 
            content: `Generate implementation prompt for this task:\n\nFeature: ${task.feature_name}\nTask: ${task.title}\nDetail: ${task.detail || 'No additional details provided.'}` 
          }
        ];

        const response = await chatCompletion(llmConfig, messages, {
          temperature: 0.4,
          max_tokens: 800,
        });

        const generatedPrompt = response.choices[0]?.message?.content?.trim() || '';
        
        if (generatedPrompt.length > 50) {
          updates.push({
            id: task.id,
            prompt: generatedPrompt,
          });
        }
      } catch (err) {
        console.error(`Failed to generate prompt for task ${task.id}:`, err);
        // Continue with other tasks even if one fails
      }
    }

    // Batch update all prompts
    if (updates.length > 0) {
      for (const update of updates) {
        await supabase
          .from('breakdown_tasks')
          .update({ prompt: update.prompt })
          .eq('id', update.id);
      }
    }

    return NextResponse.json({ 
      success: true, 
      generated: updates.length,
      total: tasks.length,
      message: `Generated ${updates.length} out of ${tasks.length} prompts successfully.`
    });
  } catch (error: any) {
    console.error('Generate all prompts error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
