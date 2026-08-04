import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';
import { encrypt, decrypt, maskApiKey } from '@/lib/encryption';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('llm_settings')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    const maskedData = data.map((setting) => {
      let masked = '';
      try {
        masked = maskApiKey(decrypt(setting.api_key_encrypted));
      } catch (e) {}
      return {
        ...setting,
        api_key_encrypted: undefined,
        api_key_masked: masked,
      };
    });

    return NextResponse.json(maskedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { base_url, api_key, model_name, is_active } = body;

    if (!base_url || !api_key || !model_name) {
      return NextResponse.json({ error: 'base_url, api_key, and model_name are required' }, { status: 400 });
    }

    if (is_active) {
      await supabase
        .from('llm_settings')
        .update({ is_active: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabase
      .from('llm_settings')
      .insert({
        user_id: user.id,
        base_url,
        api_key_encrypted: encrypt(api_key),
        model_name,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...data, api_key_encrypted: undefined });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    let id = url.searchParams.get('id');
    
    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { error } = await supabase
      .from('llm_settings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
