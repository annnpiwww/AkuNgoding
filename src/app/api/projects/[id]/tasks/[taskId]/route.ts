import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth-bypass';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, taskId } = await params;
    const body = await req.json();

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const updateData: Record<string, any> = {};
    if (body.status !== undefined) {
      if (!['todo', 'in_progress', 'review', 'done'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = body.status;
    }
    if (body.title !== undefined) updateData.title = body.title;
    if (body.detail !== undefined) updateData.detail = body.detail;
    if (body.prompt !== undefined) updateData.prompt = body.prompt;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('breakdown_tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('project_id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      throw error;
    }
    return NextResponse.json({ task: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, taskId } = await params;

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { error } = await supabase
      .from('breakdown_tasks')
      .delete()
      .eq('id', taskId)
      .eq('project_id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
