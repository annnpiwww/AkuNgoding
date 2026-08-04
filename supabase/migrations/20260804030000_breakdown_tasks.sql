-- Breakdown Tasks — todo/progress/done tracking + MCP sync
CREATE TABLE IF NOT EXISTS breakdown_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  feature_name TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT DEFAULT '',
  prompt TEXT DEFAULT '',
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_breakdown_tasks_project_id ON breakdown_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_breakdown_tasks_status ON breakdown_tasks(status);

ALTER TABLE breakdown_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access breakdown_tasks" ON breakdown_tasks;
CREATE POLICY "Allow all access breakdown_tasks" ON breakdown_tasks FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_breakdown_tasks_updated_at ON breakdown_tasks;
CREATE TRIGGER update_breakdown_tasks_updated_at BEFORE UPDATE ON breakdown_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
