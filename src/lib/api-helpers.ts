import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/encryption';
import { LlmConfig } from '@/lib/llm-client';

export async function getActiveLlmConfig(userId: string): Promise<LlmConfig | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('llm_settings')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .single();
  
  if (data) {
    return {
      baseUrl: data.base_url,
      apiKey: decrypt(data.api_key_encrypted),
      model: data.model_name,
    };
  }
  
  // Fallback to user preset configuration if no settings in DB yet
  return {
    baseUrl: 'http://100.106.72.4:20129/v1',
    apiKey: 'sk-23a9722ed5683fbd-816ddb-6268eeec',
    model: 'PRD',
  };
}
