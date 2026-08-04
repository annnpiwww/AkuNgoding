// ============================================================
// Task Extractor — Auto-populate breakdown_tasks dari PRD
// ============================================================

import { chatCompletion, type ChatMessage, type LlmConfig } from './llm-client';

export interface ExtractedTask {
  feature_name: string;
  title: string;
  detail: string;
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
        tasks.push({ feature_name: currentFeature, title, detail: detail.slice(0, 300) });
      }
    }
  }
  
  return tasks;
}

const TASK_EXTRACTION_SYSTEM_PROMPT = `You are a senior software engineer extracting implementation tasks from a Product Requirements Document (PRD).

Your job: Parse the PRD's "Core Features" section (biasanya section 7 atau 16-17) dan/atau "Functional Requirements" section, lalu convert setiap feature/requirement menjadi 2-5 concrete implementation tasks suitable for an AI coding agent or human developer.

OUTPUT FORMAT (MANDATORY):
- Output MUST be valid JSON array starting with '[' - NO markdown code fences, NO \`\`\`json wrapper
- Each task object MUST have exactly these fields:
  - "feature_name": string - nama fitur/modul dari requirement (e.g. "User Authentication", "Task Management", "Report Export")
  - "title": string - task title singkat tapi jelas (e.g. "Buat tabel users + migration", "Implement POST /api/auth/login")
  - "detail": string - acceptance criteria konkrit 2-4 kalimat (e.g. "Tabel users dengan kolom: id, email, password_hash, created_at. Add unique constraint pada email. Include migration rollback.")

RULES:
- Group tasks by feature/module (functional requirement)
- Each functional requirement → 2-5 tasks (frontend, backend, database, API, testing)
- Task title harus actionable: "Buat X", "Implement Y", "Add Z"
- Detail harus include acceptance criteria konkrit, bukan vague "sesuai kebutuhan"
- Output minimal 8 tasks total, maksimal 30 tasks
- Reply in same language as PRD (Indonesian if PRD is Indonesian)

EXAMPLE OUTPUT:
[
  {
    "feature_name": "User Authentication",
    "title": "Buat tabel users + migration",
    "detail": "Tabel users dengan kolom: id (UUID PK), email (unique), password_hash, role, created_at, updated_at. Add index pada email. Include migration rollback."
  },
  {
    "feature_name": "User Authentication",
    "title": "Implement POST /api/auth/register",
    "detail": "Endpoint register user baru. Validate email format + uniqueness, hash password dengan bcrypt, return JWT token. Handle error 409 jika email sudah terdaftar."
  },
  {
    "feature_name": "Task Management",
    "title": "Build TaskList component dengan filter",
    "detail": "Component React menampilkan list task dengan filter by status (todo/in_progress/done). Include loading state, empty state, dan error state. Support realtime update."
  }
]

Now extract implementation tasks from the PRD below. Output JSON array only, no other text.`;

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
        return tasks.slice(0, 30);
      }
      
      console.warn('First 200 chars:', content.slice(0, 200));
      return [];
    }

    // Validate structure
    const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
    const validated = tasks
      .filter((t: any) => t.feature_name && t.title && typeof t.feature_name === 'string' && typeof t.title === 'string')
      .map((t: any) => ({
        feature_name: String(t.feature_name).trim(),
        title: String(t.title).trim(),
        detail: String(t.detail || '').trim(),
      }));

    return validated.slice(0, 30); // Cap at 30 tasks max
  } catch (error: any) {
    console.error('extractTasksFromPrd error:', error.message);
    return [];
  }
}
