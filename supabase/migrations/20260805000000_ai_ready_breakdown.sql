-- akuNgoding — AI-Ready task schema enhancement
-- Adds rich task fields for AI coding agent breakdown + MCP sync compatibility.

-- 1. Disable realtime publication for table before altering (avoid "already member of publication" error)
ALTER TABLE breakdown_tasks DISABLE ROW LEVEL SECURITY;

-- 2. Expand status enum to include 'review' (Todo / In Progress / Review / Done)
ALTER TABLE breakdown_tasks DROP CONSTRAINT IF EXISTS breakdown_tasks_status_check;
UPDATE breakdown_tasks SET status = CASE
  WHEN status = 'todo' THEN 'todo'
  WHEN status = 'in_progress' THEN 'in_progress'
  WHEN status IN ('review', 'done') THEN status
  ELSE 'todo'
END;
ALTER TABLE breakdown_tasks ADD CONSTRAINT breakdown_tasks_status_check
  CHECK (status IN ('todo','in_progress','review','done'));

-- 3. Add AI-Ready fields (idempotent — only add if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdown_tasks' AND column_name='task_id') THEN
    ALTER TABLE breakdown_tasks ADD COLUMN task_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdown_tasks' AND column_name='epic') THEN
    ALTER TABLE breakdown_tasks ADD COLUMN epic TEXT DEFAULT 'Core';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdown_tasks' AND column_name='module') THEN
    ALTER TABLE breakdown_tasks ADD COLUMN module TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdown_tasks' AND column_name='category') THEN
    ALTER TABLE breakdown_tasks ADD COLUMN category TEXT DEFAULT 'Frontend';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdown_tasks' AND column_name='priority') THEN
    ALTER TABLE breakdown_tasks ADD COLUMN priority TEXT DEFAULT 'P1';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdown_tasks' AND column_name='complexity') THEN
    ALTER TABLE breakdown_tasks ADD COLUMN complexity TEXT DEFAULT 'Medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdown_tasks' AND column_name='estimated_hours') THEN
    ALTER TABLE breakdown_tasks ADD COLUMN estimated_hours NUMERIC DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdown_tasks' AND column_name='depends_on') THEN
    ALTER TABLE breakdown_tasks ADD COLUMN depends_on TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdown_tasks' AND column_name='labels') THEN
    ALTER TABLE breakdown_tasks ADD COLUMN labels TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdown_tasks' AND column_name='acceptance_criteria') THEN
    ALTER TABLE breakdown_tasks ADD COLUMN acceptance_criteria TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='breakdown_tasks' AND column_name='files_affected') THEN
    ALTER TABLE breakdown_tasks ADD COLUMN files_affected TEXT DEFAULT '';
  END IF;
END $$;

-- 4. Rebuild indexes
DROP INDEX IF EXISTS idx_breakdown_tasks_status;
CREATE INDEX IF NOT EXISTS idx_breakdown_tasks_project_id ON breakdown_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_breakdown_tasks_status ON breakdown_tasks(status);
CREATE INDEX IF NOT EXISTS idx_breakdown_tasks_priority ON breakdown_tasks(priority);

-- 5. Re-enable RLS + policies
ALTER TABLE breakdown_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access breakdown_tasks" ON breakdown_tasks;
CREATE POLICY "Allow all access breakdown_tasks" ON breakdown_tasks FOR ALL USING (true) WITH CHECK (true);

-- 6. Trigger keeps updated_at fresh
DROP TRIGGER IF EXISTS update_breakdown_tasks_updated_at ON breakdown_tasks;
CREATE TRIGGER update_breakdown_tasks_updated_at BEFORE UPDATE ON breakdown_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();