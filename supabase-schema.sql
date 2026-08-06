-- akuNgoding Database Schema
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. LLM Settings Table
CREATE TABLE IF NOT EXISTS llm_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  base_url TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(100) NOT NULL,
  idea_input TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft_ide' CHECK (status IN ('draft_ide','klarifikasi','prd_generated','breakdown','final')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Clarification Messages Table
CREATE TABLE IF NOT EXISTS clarification_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(10) CHECK (role IN ('ai','user')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PRD Documents Table
CREATE TABLE IF NOT EXISTS prd_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  content_markdown TEXT DEFAULT '',
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_llm_settings_user_id ON llm_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_clarification_messages_project_id ON clarification_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_prd_documents_project_id ON prd_documents(project_id);

-- Enable RLS
ALTER TABLE llm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE clarification_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prd_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid duplication
DROP POLICY IF EXISTS "Allow all access llm_settings" ON llm_settings;
DROP POLICY IF EXISTS "Allow all access projects" ON projects;
DROP POLICY IF EXISTS "Allow all access clarification_messages" ON clarification_messages;
DROP POLICY IF EXISTS "Allow all access prd_documents" ON prd_documents;

-- Permissive RLS Policies (Allow access for both authenticated and bypass mode)
CREATE POLICY "Allow all access llm_settings" ON llm_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access clarification_messages" ON clarification_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access prd_documents" ON prd_documents FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_llm_settings_updated_at ON llm_settings;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_prd_documents_updated_at ON prd_documents;

CREATE TRIGGER update_llm_settings_updated_at BEFORE UPDATE ON llm_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prd_documents_updated_at BEFORE UPDATE ON prd_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
