import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';

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
    const { content_markdown } = body;

    if (!content_markdown) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { data: existingDoc } = await supabase
      .from('prd_documents')
      .select('id, version')
      .eq('project_id', id)
      .single();

    if (existingDoc) {
      await supabase.from('prd_documents').update({
        content_markdown,
        version: (existingDoc.version || 1) + 1,
      }).eq('project_id', id);
    } else {
      await supabase.from('prd_documents').insert({
        project_id: id,
        content_markdown,
        version: 1,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
