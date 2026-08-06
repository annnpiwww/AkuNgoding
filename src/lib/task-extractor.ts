// ============================================================
// Task Extractor — Auto-populate breakdown_tasks dari PRD
// ============================================================

import { chatCompletion, type ChatMessage, type LlmConfig } from './llm-client';

export interface ExtractedTask {
  feature_name: string;
  title: string;
  detail: string;
  task_id?: string;
  epic?: string;
  module?: string;
  category?: string;
  priority?: string;
  complexity?: string;
  estimated_hours?: number;
  depends_on?: string;
  labels?: string;
  acceptance_criteria?: string;
  files_affected?: string;
}

// Helper: Parse tasks from markdown format (fallback when LLM returns markdown instead of JSON)
function parseTasksFromMarkdown(markdown: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  const lines = markdown.split('\n');
  let currentFeature = 'General';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Feature/section header: ### Feature Name atau ### 1. Feature Name
    if (line.match(/^#{2,3}\s+(\d+\.\s+)?(.+)/)) {
      const match = line.match(/^#{2,3}\s+(?:\d+\.\s+)?(.+)/);
      if (match) {
        currentFeature = match[1].replace(/\(FR-\d+\)/, '').trim();
      }
    }
    
    // Task item: - **Task title** atau - [ ] Task title
    if (line.match(/^-\s+(\*\*|(\[\s?\]))/)) {
      let title = line.replace(/^-\s+/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^\[\s?\]\s+/, '').trim();
      let detail = '';
      
      // Collect detail from next lines (indented or continuation)
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine.startsWith('-') || nextLine.match(/^#{2,3}/)) break;
        if (nextLine.length > 0 && !nextLine.startsWith('*')) {
          detail += (detail ? ' ' : '') + nextLine;
        }
      }
      
      if (title.length > 5) {
        tasks.push({ feature_name: currentFeature, title, detail: detail.slice(0, 300), category: 'Backend', priority: 'P1' });
      }
    }
  }
  
  return tasks;
}

const TASK_EXTRACTION_SYSTEM_PROMPT = `You are a senior software engineer extracting implementation tasks from an AI-Ready Development Specification (markdown).

Your job: Parse the "Product Requirements Document" (Functional Requirements) dan "Technical Specification" sections, lalu convert setiap feature/requirement menjadi 2-5 concrete implementation tasks suitable for an AI coding agent (Claude Code, Cursor, Codex) or human developer.

OUTPUT FORMAT (MANDATORY):
- Output MUST be valid JSON array starting with '[' - NO markdown code fences, NO \`\`\`json wrapper, NO explanatory text
- Each task object MUST have EXACTLY these fields:
  - "feature_name": string - nama fitur/modul dari requirement (e.g. "User Authentication", "Task Management")
  - "title": string - task title singkat tapi actionable (e.g. "Buat tabel users + migration")
  - "detail": string - acceptance criteria konkrit 2-4 kalimat
  - "task_id": string - format "TASK-001", "TASK-002" dst. urut
  - "epic": string - epic utama (e.g. "Core MVP", "Auth")
  - "module": string - sub-modul (e.g. "Database", "API", "UI")
  - "category": string - salah satu dari ["DB","API","Backend","Frontend","auth","DevOps","Testing","Documentation","UI/UX","AI Agent"]
  - "priority": string - "P0" | "P1" | "P2"
  - "complexity": string - "Low" | "Medium" | "High"
  - "estimated_hours": number - estimasi jam kerja (decimal, e.g. 2, 4, 8)
  - "depends_on": string - "TASK-00X" atau "" jika tidak ada dep
  - "labels": string - komma-separated label (e.g. "auth,security")
  - "acceptance_criteria": string - kriteria terukur (Given/When/Then atau checklist)

RULES:
- Group tasks by feature/module (functional requirement)
- Each functional requirement → 2-5 tasks (database, API, backend logic, frontend, testing)
- Task title harus actionable: "Buat X", "Implement Y", "Add Z"
- Detail & acceptance_criteria harus konkrit, bukan vague "sesuai kebutuhan"
- DB tasks SEBELUM API tasks, API SEBELUM Backend, Backend SEBELUM Frontend, Testing SETELAH impl
- Backend tasks TIDAK BOLEH depend pada Frontend tasks
- Output minimal 8 tasks total, maksimal 60 tasks
- Reply in same language as spec (Indonesian if spec is Indonesian)

EXAMPLE OUTPUT:
[
  {
    "feature_name": "User Authentication",
    "title": "Buat tabel users + migration",
    "detail": "Tabel users dengan kolom: id (UUID PK), email (unique), password_hash, role, created_at, updated_at. Add index pada email. Include migration rollback.",
    "task_id": "TASK-001",
    "epic": "Core MVP",
    "module": "Database",
    "category": "DB",
    "priority": "P0",
    "complexity": "Low",
    "estimated_hours": 2,
    "depends_on": "",
    "labels": "auth,db",
    "acceptance_criteria": "Given user yang baru, when migration dijalankan, then tabel users terbentuk dengan constraint email unique + RLS aktif.",
    "files_affected": "supabase/migrations/xxx_users.sql"
  },
  {
    "feature_name": "User Authentication",
    "title": "Implement API /api/auth/register",
    "detail": "Endpoint register user. Validate email format + uniqueness, hash password (bcrypt), return JWT. Handle 409 jika email sudah terdaftar.",
    "task_id": "TASK-002",
    "epic": "Core MVP",
    "module": "API",
    "category": "API",
    "priority": "P0",
    "complexity": "Medium",
    "estimated_hours": 4,
    "depends_on": "TASK-001",
    "labels": "auth,api",
    "acceptance_criteria": "When user POST /api/auth/register dengan email baru, maka response 201 + JWT. When email sudah ada, 409.",
    "files_affected": "src/app/api/auth/register/route.ts"
  }
]

Now extract implementation tasks from the specification below. Output the JSON array only, no other text.`;

export async function extractTasksFromPrd(
  prdMarkdown: string,
  llmConfig: LlmConfig
): Promise<ExtractedTask[]> {
  try {
    // Truncate PRD jika terlalu panjang (ambil section 1-10 untuk ensure Core Features section included)
    const truncated = prdMarkdown.length > 25000 
      ? prdMarkdown.slice(0, 25000) + '\n\n[... PRD truncated for token limit ...]'
      : prdMarkdown;

    const messages: ChatMessage[] = [
      { role: 'system', content: TASK_EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: `PRD to extract tasks from:\n\n${truncated}` },
    ];

    const response = await chatCompletion(llmConfig, messages, {
      temperature: 0.3,
      max_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Aggressive JSON extraction - model might wrap JSON in text
    let parsed: any;
    try {
      // Step 1: Strip markdown code fences
      let cleaned = content.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      
      // Step 2: Extract first JSON array if wrapped in text
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }
      
      // Step 3: Parse
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.warn('extractTasksFromPrd: JSON parse failed, trying markdown parse. Raw length:', content.length);
      
      // Fallback: Parse markdown response (model prefers markdown over JSON)
      const tasks = parseTasksFromMarkdown(content);
      if (tasks.length > 0) {
        console.log(`Extracted ${tasks.length} tasks from markdown format`);
        return tasks.slice(0, 60);
      }
      
      console.warn('First 200 chars:', content.slice(0, 200));
      return [];
    }

    // Validate structure
    const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
    const validated = tasks
      .filter((t: any) => t && t.title && typeof t.title === 'string')
      .map((t: any) => ({
        feature_name: String(t.feature_name ?? t.epic ?? 'General').trim(),
        title: String(t.title).trim(),
        detail: String(t.detail || t.acceptance_criteria || '').trim(),
        task_id: t.task_id ? String(t.task_id).trim() : undefined,
        epic: t.epic ? String(t.epic).trim() : undefined,
        module: t.module ? String(t.module).trim() : undefined,
        category: t.category ? String(t.category).trim() : undefined,
        priority: t.priority ? String(t.priority).trim() : undefined,
        complexity: t.complexity ? String(t.complexity).trim() : undefined,
        estimated_hours: typeof t.estimated_hours === 'number' && !isNaN(t.estimated_hours) ? t.estimated_hours : undefined,
        depends_on: t.depends_on ? String(t.depends_on).trim() : undefined,
        labels: t.labels ? (Array.isArray(t.labels) ? t.labels.join(',') : String(t.labels).trim()) : undefined,
        acceptance_criteria: t.acceptance_criteria ? String(t.acceptance_criteria).trim() : undefined,
        files_affected: t.files_affected ? String(t.files_affected).trim() : undefined,
      }));

    return validated.slice(0, 60); // Cap at 60 tasks max
  } catch (error: any) {
    console.error('extractTasksFromPrd error:', error.message);
    return [];
  }
}
