ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS tech_preference_mode VARCHAR(20),
ADD COLUMN IF NOT EXISTS tech_stack JSONB,
ADD COLUMN IF NOT EXISTS clarification_answers JSONB,
ADD COLUMN IF NOT EXISTS structure_diagram TEXT,
ADD COLUMN IF NOT EXISTS ui_ux_guidelines TEXT;

CREATE TABLE IF NOT EXISTS breakdown_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  layer VARCHAR(20),
  estimate VARCHAR(10),
  acceptance_criteria JSONB,
  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  agent_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_breakdown_tasks_project_id ON breakdown_tasks(project_id);
ALTER TABLE breakdown_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access breakdown_tasks" ON breakdown_tasks;
CREATE POLICY "Allow all access breakdown_tasks" ON breakdown_tasks FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_breakdown_tasks_updated_at BEFORE UPDATE ON breakdown_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
