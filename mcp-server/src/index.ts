import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const DEBUG = process.env.AKUNGODING_MCP_DEBUG === "1";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("MCP akuNgoding: SUPABASE_URL (atau NEXT_PUBLIC_SUPABASE_URL) dan anon key wajib di-set.");
  process.exit(1);
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

function log(...args: unknown[]) {
  if (DEBUG) console.error("[akungoding-mcp]", ...args);
}

const VALID_STATUS = ["todo", "in_progress", "done"] as const;

async function getProjectOrThrow(supabase: SupabaseClient, projectId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, idea_input, status")
    .eq("id", projectId)
    .single();
  if (error || !data) throw new Error(`Project tidak ditemukan: ${projectId}`);
  return data;
}

async function getTasks(supabase: SupabaseClient, projectId: string) {
  const { data, error } = await supabase
    .from("breakdown_tasks")
    .select("id, project_id, feature_name, title, detail, prompt, status, sort_order, created_at, updated_at")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Gagal ambil tasks: ${error.message}`);
  return data || [];
}

const server = new McpServer({
  name: "akungoding",
  version: "1.0.0",
});

// Health
server.tool(
  "akungoding_health",
  "Cek koneksi MCP akuNgoding dan client ke Supabase.",
  {},
  async () => {
    let db = "unknown";
    try {
      const { error } = await supabase.from("projects").select("id").limit(1);
      db = error ? `error: ${error.message}` : "connected";
    } catch (e: any) {
      db = `error: ${e?.message || e}`;
    }
    return {
      content: [{ type: "text", text: JSON.stringify({ connected: true, server: "akungoding-mcp", supabase: db, time: new Date().toISOString() }) }],
    };
  }
);

// Get project
server.tool(
  "akungoding_get_project",
  "Ambil detail project (konteks ide, status) lengkap beserta daftar seluruh task breakdown-nya.",
  { project_id: z.string().describe("UUID project di akuNgoding") },
  async ({ project_id }) => {
    const project = await getProjectOrThrow(supabase, project_id);
    const tasks = await getTasks(supabase, project_id);
    return {
      content: [{ type: "text", text: JSON.stringify({ project, tasks }) }],
    };
  }
);

// List tasks
server.tool(
  "akungoding_list_tasks",
  "Daftar seluruh task breakdown sebuah project beserta status (todo / in_progress / done) dan prompt-nya.",
  { project_id: z.string().describe("UUID project di akuNgoding") },
  async ({ project_id }) => {
    const tasks = await getTasks(supabase, project_id);
    return {
      content: [{ type: "text", text: JSON.stringify({ count: tasks.length, tasks }) }],
    };
  }
);

// Get task
server.tool(
  "akungoding_get_task",
  "Ambil detail satu task breakdown termasuk instruksi/prompt yang harus dikerjakan.",
  { task_id: z.string().describe("UUID task di tabel breakdown_tasks") },
  async ({ task_id }) => {
    const { data, error } = await supabase
      .from("breakdown_tasks")
      .select("id, project_id, feature_name, title, detail, prompt, status, sort_order, created_at, updated_at")
      .eq("id", task_id)
      .single();
    if (error || !data) throw new Error(`Task tidak ditemukan: ${task_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }
);

// Update task status (sinkronisasi todo <-> agent)
server.tool(
  "akungoding_update_task_status",
  "Ubah status sebuah task. Gunakan 'in_progress' saat mulai mengerjakan, dan 'done' ketika selesai. Perubahan langsung tampil realtime di fitur todo akuNgoding.",
  {
    task_id: z.string().describe("UUID task di tabel breakdown_tasks"),
    status: z.enum(VALID_STATUS).describe("Status baru: todo, in_progress, atau done"),
  },
  async ({ task_id, status }) => {
    const { data, error } = await supabase
      .from("breakdown_tasks")
      .update({ status })
      .eq("id", task_id)
      .select("id, project_id, feature_name, title, status, updated_at")
      .single();
    if (error || !data) throw new Error(`Gagal update status task ${task_id}: ${error?.message || "not found"}`);
    log("status updated", task_id, status);
    return {
      content: [{ type: "text", text: JSON.stringify({ ok: true, task: data }) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("akungoding MCP running via stdio");
}

main().catch((err) => {
  console.error("MCP akuNgoding error:", err);
  process.exit(1);
});