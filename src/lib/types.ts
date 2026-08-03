export type ProjectStatus = 'draft_ide' | 'klarifikasi' | 'prd_generated' | 'breakdown' | 'final';
export type MessageRole = 'ai' | 'user';

export interface Project {
  id: string;
  user_id: string;
  title: string;
  idea_input: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface LlmSetting {
  id: string;
  user_id: string;
  base_url: string;
  api_key_encrypted: string;
  model_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClarificationMessage {
  id: string;
  project_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface PrdDocument {
  id: string;
  project_id: string;
  content_markdown: string;
  version: number;
  updated_at: string;
}

// For API responses (API key masked)
export interface LlmSettingPublic {
  id: string;
  user_id: string;
  base_url: string;
  api_key_masked: string; // e.g. "sk-...3fbd"
  model_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
