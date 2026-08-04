import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';
import { getActiveLlmConfig } from '@/lib/api-helpers';
import { chatCompletionStream, type ChatMessage } from '@/lib/llm-client';
import { GENERATE_PRD_SYSTEM_PROMPT, PRD_FORMAT_INSTRUCTIONS } from '@/lib/prompts';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: project } = await supabase
      .from('projects')
      .select('idea_input')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const llmConfig = await getActiveLlmConfig(user.id);
    if (!llmConfig) {
      return NextResponse.json({ error: 'Please configure active LLM settings first' }, { status: 400 });
    }

    const { data: history } = await supabase
      .from('clarification_messages')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    let clarificationContext = '';
    if (history && history.length > 0) {
      clarificationContext = '\n\nClarification Context:\n' + history.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: GENERATE_PRD_SYSTEM_PROMPT },
      { role: 'user', content: `${PRD_FORMAT_INSTRUCTIONS}\n\nProduct Idea:\n${project.idea_input}${clarificationContext}` },
    ];

    const sseStream = await chatCompletionStream(llmConfig, messages);
    
    let fullContent = '';
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                controller.enqueue(encoder.encode(content));
              }
            } catch (e) {
              // Ignore invalid JSON parsing errors
            }
          }
        }
      },
      async flush(controller) {
        // flush remaining decode
        const text = decoder.decode();
        if (text) {
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  controller.enqueue(encoder.encode(content));
                }
              } catch (e) {}
            }
          }
        }

        // Save after generation — only persist if the output is a real PRD,
        // never a clarifying question, an empty stream, or a broken fragment.
        const isRealPrd =
          fullContent.length > 1500 &&
          /#{1,3}\s*(1\.\s*)?Overview/i.test(fullContent) &&
          /\n#{1,3}\s+\d+\.\s/.test(fullContent);

        if (isRealPrd) {
          try {
            const { data: existingDoc } = await supabase
              .from('prd_documents')
              .select('id, version')
              .eq('project_id', id)
              .maybeSingle();

            if (existingDoc) {
              await supabase.from('prd_documents').update({
                content_markdown: fullContent,
                version: (existingDoc.version || 1) + 1,
              }).eq('project_id', id);
            } else {
              await supabase.from('prd_documents').insert({
                project_id: id,
                content_markdown: fullContent,
                version: 1,
              });
            }

            await supabase.from('projects').update({ status: 'prd_generated' }).eq('id', id);
          } catch (error) {
            console.error('Error saving PRD:', error);
          }
        } else {
          console.warn('generate-prd: output discarded (not a valid PRD), length=', fullContent.length);
        }
      }
    });

    const readableStream = sseStream.pipeThrough(transformStream);

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
