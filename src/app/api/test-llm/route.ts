import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';
import { getActiveLlmConfig } from '@/lib/api-helpers';
import { chatCompletion } from '@/lib/llm-client';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await getEffectiveUser(supabase);
  const llmConfig = await getActiveLlmConfig(user.id);
  const res = await chatCompletion(llmConfig, [
      { role: 'system', content: 'Keluarkan JSON { "hello": "world" }' },
      { role: 'user', content: 'test' }
  ], { response_format: { type: "json_object"} });
  return NextResponse.json(res);
}
