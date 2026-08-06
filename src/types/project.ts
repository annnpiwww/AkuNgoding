export type WizardStep = 
  | 'idea' 
  | 'tech_preference' 
  | 'questions' 
  | 'structure_review' 
  | 'prd_review' 
  | 'implementation';

export interface TechStack {
  frontend: string;
  backend: string;
  db: string;
  deploy: string;
}

export interface ClarificationAnswer {
  questionId: string;
  answer: string | string[];
}

export interface ProjectState {
  id: string;
  userId: string;
  title: string;
  ideaInput: string;
  status: string;
  techPreferenceMode?: 'ai' | 'manual';
  techStack?: TechStack;
  clarificationAnswers?: ClarificationAnswer[];
  structureDiagram?: string;
  uiUxGuidelines?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  layer?: 'FE' | 'BE' | 'DB' | 'Infra';
  estimate?: 'S' | 'M' | 'L';
  acceptanceCriteria?: string[];
  status: 'todo' | 'in_progress' | 'review' | 'done';
  agentId?: string;
}
