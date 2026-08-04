import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data, error } = await supabase
      .from('projects')
      .select('*, prd_documents(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      // PGRST116 = row not found
      if (error.code === 'PGRST116' || error.message?.includes('not found')) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      throw error;
    }
    if (!data) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Ownership check
    const { data: existing, error: findError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (findError || !existing) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Delete child rows explicitly first (safe even if FK cascade is missing)
    await supabase.from('prd_documents').delete().eq('project_id', id);
    await supabase.from('clarification_messages').delete().eq('project_id', id);

    const { error } = await supabase.from('projects').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const { data: existing, error: findError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (findError || !existing) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.idea_input !== undefined) updateData.idea_input = body.idea_input;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
