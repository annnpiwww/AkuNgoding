import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';
import { testConnection } from '@/lib/llm-client';
import { decrypt } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    let config;

    if (body.setting_id) {
      const { data, error } = await supabase
        .from('llm_settings')
        .select('*')
        .eq('id', body.setting_id)
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      
      config = {
        baseUrl: data.base_url,
        apiKey: decrypt(data.api_key_encrypted),
        model: data.model_name,
      };
    } else {
      if (!body.base_url || !body.api_key || !body.model_name) {
        return NextResponse.json({ error: 'base_url, api_key, and model_name are required' }, { status: 400 });
      }
      config = {
        baseUrl: body.base_url,
        apiKey: body.api_key,
        model: body.model_name,
      };
    }

    const result = await testConnection(config);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
