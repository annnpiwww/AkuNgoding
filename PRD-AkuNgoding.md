# PRD — akuNgoding (AI PRD Generator)

> Versi dokumen: 1.0 — 06 Agustus 2026
> Status: LIVE (produksi di Proxmox CT101 + Vercel preview)
> Tujuan dokumen: dasar redesign & handoff ke tool desain/agent (Google Stitch, Claude Code, dll.)

---

## 1. Ringkasan Eksekutif

### 1.1 Product Overview
**akuNgoding** adalah web-app **AI PRD Generator** yang mengubah ide produk mentah menjadi dokumen spesifikasi siap-implementasi (PRD + Technical Spec + AI Coding Rules + Implementation Breakdown). Output dirancang agar **langsung bisa dikonsumsi AI coding agent** (Claude Code, Cursor, Codex, Gemini CLI) dan engineer manusia, meminimalkan asumsi & pertanyaan lanjutan.

### 1.2 Problem Statement
- Menulis PRD berkualitas butuh waktu & keahlian Product Manager.
- PRD yang ambigu membuat AI coding agent menebak-nebak → hasil implementasi melenceng.
- Tidak ada jembatan antara "ide" → "task siap dikerjakan" yang otomatis & ter-track.

### 1.3 Solution Overview
Pipeline 1 klik: **Ide → Klarifikasi → PRD AI-Ready (4 bagian) → Task Breakdown otomatis → Prompt per-task → Agent via MCP → Status realtime.**

### 1.4 Goals
- G1: Hasilkan PRD berkualitas ≥9.5/10 konsisten di berbagai jenis produk.
- G2: Minimalkan pertanyaan lanjutan dari AI coding agent saat implementasi.
- G3: Ubah PRD jadi task eksekusi (Todo/In Progress/Review/Done) otomatis.
- G4: Sinkronkan task dengan agent eksternal lewat MCP (tanpa copy-paste manual).

### 1.5 Success Metrics
- % PRD lolos evaluasi kualitas (Problem→Schema→Acceptance Criteria lengkap).
- Jumlah task yang dihasilkan per PRD (target 20–60).
- Waktu ide→PRD siap-bangun.
- % task diselesaikan lewat MCP tanpa intervensi manual.

### 1.6 Target Users
- Individu/startup yang mau prototipe cepat.
- Developer yang butuh spesifikasi teknis (schema, API, RLS) sebelum coding.
- Tim yang memakai AI coding agent (Claude Code, Cursor, Codex).

---

## 2. Alur Pengguna Utama (User Flow)

```
Dashboard
   │  (+ Project Baru: judul + ide, ide ≥ 20 char)
   ▼
Klarifikasi (chat AI, ±5 pertanyaan, opsi custom jawaban)
   │  (opsional: Skip)
   ▼
Generate PRD (streaming, 4 bagian + breakdown)
   │
   ├─ Review / Revisi per-section (modal revise)
   │
   ▼
PRD Lengkap (view editor/preview/split + Export .md)
   │
   ▼
Task Breakdown (Kanban Todo/In Progress/Review/Done)
   │  ├─ ⚡ Generate Tasks dari PRD (untuk PRD lama)
   │  ├─ ⚡ Generate All Prompts (prompt siap-pakai per task)
   │  └─ MCP Connect (status server MCP)
   ▼
AI Agent (Claude Code dll) ambil task via MCP → update status
   ▼
Board update realtime (Supabase Realtime)
```

---

## 3. Fitur & Halaman

### 3.1 Dashboard (`/dashboard`)
- List project milik user, urut updated_at.
- Status badge per project: `draft_ide`, `klarifikasi`, `prd_generated`, `breakdown`, `final`.
- Tombol **Lanjutkan** → route pintar berdasarkan status.
- Tombol hapus project (dengan konfirmasi modal).
- CTA buat project baru.

### 3.2 Project Baru (`/project/new`)
- Form: `title` (≤100 char, wajib) + `idea_input` (≥20 char, wajib).
- Submit → `POST /api/projects` → redirect ke klarifikasi.

### 3.3 Klarifikasi (`/project/[id]/clarify`)
- Chat AI: history tersimpan (`clarification_messages`).
- AI ajukan pertanyaan (kategori + suggested answers chips).
- **Opsi "Custom (tulis sendiri)"** selalu tersedia.
- Tombol Skip / Minta pertanyaan lagi.
- Deteksi ide sudah siap → sentinel `READY_TO_GENERATE_PRD` → lanjut generate.
- Maksimal 5 pertanyaan per sesi.

### 3.4 Generate PRD (`/project/[id]/generate`)
- Streaming output via SSE, live preview markdown.
- Progress per section (5 tahap):
  1. Executive Summary
  2. PRD
  3. Technical Specification
  4. AI Coding Rules
  5. Implementation Breakdown
- Selesai → tombol **Lihat PRD Lengkap** (langsung ke `/edit`, tanpa scroll).
- Error → tombol ke `/settings/llm` + Coba Lagi.

### 3.5 PRD Editor (`/project/[id]/edit`)
- 3 mode view: **Editor / Preview / Split**.
- Auto-save ke `prd_documents` (versioning naik tiap save).
- **Export .md** (download markdown).
- **Revisi per-section**: modal pilih section + instruksi → AI revisi hanya bagian itu → save version baru.

### 3.6 Task Breakdown (`/project/[id]/breakdown`)
- **Kanban 4 kolom**: Todo / In Progress / Review / Done (realtime).
- Tombol **⚡ Generate Tasks dari PRD** → extract otomatis (untuk PRD lama yang belum punya task).
- Tombol **⚡ Generate All Prompts** → generate prompt siap-pakai untuk SEMUA task (aktif kalau ≥1 task).
- **MCP Connect** → cek status server MCP + modal setup instruction.
- Filter per fitur, tambah/hapus task manual, copy prompt per task.
- **Tutorial modal** step-by-step (5 langkah) setelah generate prompts.
- Realtime sync: Supabase `postgres_changes` + polling fallback.

### 3.7 Settings LLM (`/settings/llm`)
- Form: Base URL, API Key (masked, toggle show), Model Name.
- **Test Connection** → `POST /test-connection` → feedback sukses/gagal + model terdeteksi.
- **Simpan & Jadikan Aktif** → simpan config, aktifkan (otomatis nonaktifkan yang lain).
- List saved configs: badge aktif, tombol **Set Aktif**.
- *(Kebutuhan redesign: tambah tombol Hapus + modal konfirmasi, edit config yang sudah ada.)*

### 3.8 Auth (`/auth/login`, `/auth/register`)
- Email/password via Supabase Auth.
- **Catatan**: saat ini mode `BYPASS_MODE=true` (mock user) aktif di server → semua flow jalan tanpa login.

---

## 4. Arsitektur & Tech Stack

### 4.1 Stack
| Layer | Teknologi |
|---|---|
| Frontend | Next.js App Router (v16, Turbopack), React 19, Tailwind v4 |
| Backend | Next.js API Routes (Route Handlers), Server Actions tersedia |
| DB/Auth/Storage | Supabase (PostgreSQL + Auth + Realtime) |
| LLM | BYO OpenAI-compatible endpoint (chat/completions, stream) |
| Markdown | ReactMarkdown + remark-gfm |
| MCP | Custom MCP Server (stdio) |
| Deploy | Docker (node:22-alpine) + nginx di Proxmox CT101; Vercel preview |
| Env | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, LLM_ENCRYPTION_KEY |

### 4.2 Struktur Project (ringkas)
```
src/app/
  dashboard/            → list project
  project/new/          → form ide
  project/[id]/
    clarify/            → chat klarifikasi
    generate/           → streaming PRD
    edit/               → PRD editor/preview/export
    breakdown/          → kanban task + MCP
  settings/llm/         → konfigurasi LLM
  auth/login, register
  api/                  → semua route handlers
src/lib/
  llm-client.ts         → chatCompletion / chatCompletionStream / testConnection
  prompts-ai.ts         → AI_READY_SYSTEM_PROMPT + FORMAT (4 bagian)
  prompts.ts            → prompt lama (clarify, revise, breakdown-feature)
  task-extractor.ts     → PRD → tasks (JSON + fallback markdown)
  api-helpers.ts        → getActiveLlmConfig (fallback hardcoded)
  auth-bypass.ts        → mock user saat BYPASS_MODE
  encryption.ts         → AES-256-GCM utk API key
  export.ts / markdown-parser.ts
mcp-server/             → MCP server standalone (src/index.ts, health.cjs)
supabase/migrations/    → schema + RLS + realtime
Dockerfile / docker-compose.yml / nginx.conf
```

### 4.3 Integrasi LLM
- Endpoint kompatibel OpenAI: `POST {base_url}/chat/completions`.
- Auth: `Authorization: Bearer <api_key>`.
- Mode: non-stream (clarify, revise, extract, prompt) & stream (generate PRD).
- API key dienkripsi AES-256-GCM (`LLM_ENCRYPTION_KEY`) sebelum disimpan.
- **Fallback**: bila tidak ada config aktif di DB, pakai config hardcoded (Tailscale `100.106.72.4:20129`, model `PRD`).

---

## 5. Data Model (Supabase/PostgreSQL)

### 5.1 Status Enum
- **Project**: `draft_ide`, `klarifikasi`, `prd_generated`, `breakdown`, `final`
- **Task**: `todo`, `in_progress`, `review`, `done`
- **Message role**: `ai`, `user`

### 5.2 Tabel
**`projects`** — id, user_id, title (100), idea_input, status (check), created_at, updated_at.

**`clarification_messages`** — id, project_id (FK cascade), role (ai/user), content, created_at.

**`prd_documents`** — id, project_id (FK cascade), content_markdown, version (int, naik tiap save), updated_at.

**`llm_settings`** — id, user_id, base_url, api_key_encrypted, model_name, is_active, created_at, updated_at.

**`breakdown_tasks`** — id, project_id (FK cascade), feature_name, title, detail, prompt, status (check), sort_order, task_id (e.g. `TASK-001`), epic (default 'Core'), module, category (default 'Frontend'), priority (default 'P1'), complexity (default 'Medium'), estimated_hours (numeric), depends_on, acceptance_criteria, files_affected, labels, created_at, updated_at.

### 5.3 RLS & Index
- Semua tabel saat ini: **policy "Allow all access"** (`FOR ALL USING(true)`).
- Index: `breakdown_tasks(project_id)`, `breakdown_tasks(status)`, `breakdown_tasks(priority)`, `projects(user_id)`, `llm_settings(user_id)`, `clarification_messages(project_id)`, `prd_documents(project_id)`.
- Realtime: `breakdown_tasks` terdaftar di publikasi `supabase_realtime`.

> ⚠️ **Catatan security utk redesign**: RLS semua "allow all" + BYPASS_MODE aktif = autentikasi hanya simbolis. Jika mau publik, perlu RLS berbasis user (owner-only read/write) + service role untuk MCP.

---

## 6. API Endpoints

Semua route di bawah `/api`, auth via `getEffectiveUser` (mock user saat bypass).

### 6.1 Projects
| Method | Path | Fungsi |
|---|---|---|
| POST | `/api/projects` | buat project (validasi title/idea) |
| GET | `/api/projects` | list project user |
| GET | `/api/projects/[id]` | detail project |
| PATCH | `/api/projects/[id]` | update title/idea/status |
| DELETE | `/api/projects/[id]` | hapus project |

### 6.2 Pipeline PRD
| Method | Path | Fungsi |
|---|---|---|
| GET/POST | `/api/projects/[id]/clarify` | history + kirim jawaban / minta pertanyaan / skip |
| POST | `/api/projects/[id]/generate-prd` | stream PRD, save doc, extract tasks |
| POST | `/api/projects/[id]/save-prd` | auto-save markdown (versioning) |
| POST | `/api/projects/[id]/revise-section` | revisi satu section via AI |
| POST | `/api/projects/[id]/breakdown-feature` | breakdown fitur tambahan (legacy) |

### 6.3 Tasks
| Method | Path | Fungsi |
|---|---|---|
| GET/POST | `/api/projects/[id]/tasks` | list / tambah task |
| POST | `/api/projects/[id]/tasks/regenerate` | extract ulang task dari PRD tersimpan |
| POST | `/api/projects/[id]/tasks/generate-prompt` | generate prompt satu task |
| POST | `/api/projects/[id]/tasks/generate-all-prompts` | generate prompt semua task |
| PATCH/DELETE | `/api/projects/[id]/tasks/[taskId]` | update status/field / hapus task |

### 6.4 Lainnya
| Method | Path | Fungsi |
|---|---|---|
| GET/POST/DELETE | `/api/llm-settings` | kelola config LLM |
| POST | `/api/llm-settings/test-connection` | tes koneksi LLM |
| GET | `/api/mcp/status` | cek server MCP (spawn health.cjs) |

---

## 7. Sistem Prompt (AI)

### 7.1 Prompt Utama (`prompts-ai.ts`)
Output PRD dibagi **4 bagian besar** (+ implementation breakdown):

1. **Executive Summary** — overview, problem, solution, goals, success metrics, target users.
2. **Product Requirements Document** — problem statement, goals, personas, user stories, FR (FR-001...), NFR, business rules, acceptance criteria, scope/out-of-scope, edge cases, risks, open questions, future enhancements.
3. **Technical Specification** — system architecture, data flow, sequence diagram, state diagram, ERD, database schema, constraints, index recommendation, **Supabase RLS recommendation**, storage structure, auth flow, authorization matrix, folder structure, coding convention, API standard, endpoints, response/error format, env vars, deployment/logging/monitoring/backup/scalability strategy, performance target, security checklist, testing strategy, definition of done.
4. **AI Coding Rules** — rules eksplisit untuk agent (strict TS, no `any`, Zod, repository pattern, server actions, RLS-aware, unit test wajib, dll).
5. **Implementation Breakdown** — hierarki Epic→Feature→Module→Task→Subtask; tiap task punya `task_id, title, description, priority, complexity, estimated effort, dependency, acceptance criteria, files affected, labels, owner type` (Frontend/Backend/Database/API/Auth/DevOps/Testing/Docs/UI-UX/AI Agent) + status default `todo`.

### 7.2 Prompt Pendukung
- `CLARIFICATION_SYSTEM_PROMPT` — ajukan pertanyaan paling berdampak, deteksi kesiapan generate.
- `REVISE_SECTION_SYSTEM_PROMPT` — revisi hanya section tertentu.
- `TASK_EXTRACTION_SYSTEM_PROMPT` — PRD → array JSON task (2–5 task/fitur, urutan DB→API→Backend→Frontend→Testing, cap 60).
- `PROMPT_GENERATION_SYSTEM` / `PROMPT_REFINE` — buat prompt self-contained per task (context, acceptance criteria, file path, langkah, testing).

---

## 8. MCP Server (Custom)

- Mode: **stdio**; dipakai agent eksternal (Claude Code dkk) via `.mcp.json`.
- Koneksi DB: Supabase (anon key), RLS allow-all.
- **Tools**:
  1. `akungoding_health` — cek koneksi server + DB.
  2. `akungoding_get_project` — project + semua task-nya.
  3. `akungoding_get_tasks` — daftar task per project (urutan sort_order).
  4. `akungoding_get_task` — detail satu task (termasuk field AI-ready).
  5. `akungoding_update_task_status` — update status `todo|in_progress|review|done`.
- Web-app cek status via `/api/mcp/status` → spawn `node mcp-server/dist/index.js` di dalam container (dibuild saat image, node 22 utk native WebSocket supabase-js).

---

## 9. Infrastruktur & Deployment

- **Docker multi-stage** (`node:22-alpine`): deps → builder (next build + build mcp-server) → runner (non-root `nextjs`, standalone output + mcp-server).
- **docker-compose**: service `app` (3000) + `nginx` (80/443, reverse proxy + SSL), env via `.env.production`.
- **Hosting prod**: Proxmox CT101 (`100.111.29.104`), Tailscale network.
- **Preview**: Vercel (`akungoding.vercel.app`).
- Healthcheck: `curl /` pada app & `nginx -t`.
- Env penting: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `LLM_ENCRYPTION_KEY` (AES), `SUPABASE_URL/SUPABASE_ANON_KEY` (MCP), `AKUNGODING_MCP_DEBUG`.

---

## 10. Masalah Keamanan yang Perlu Diperbaiki (Saat Redesign)

- **P0**: RLS semua tabel "allow all" → perlu RLS owner-based + service role khusus MCP.
- **P0**: `BYPASS_MODE=true` aktif di produksi → matikan & wajibkan login asli.
- **P1**: API key hardcoded sebagai fallback LLM di `api-helpers.ts` → hapus/dukung env.
- **P1**: `.mcp.json` berisi anon key di repo → pindah ke env/template.
- **P2**: Tidak ada rate limit & validasi body API secara ketat.

---

## 11. Area Perbaikan UX (untuk Redesign)

- Settings LLM: belum ada tombol **Hapus** config + modal konfirmasi (sudah di-request user).
- Dashboard: tambah statistik (jumlah project, status, task progress).
- Generate PRD: state "Lihat PRD Lengkap" sudah muncul di akhir — pertahankan.
- Breakdown: kolom status sudah 4 (Todo/In Progress/Review/Done) — pertahankan, tambah drag-drop antar kolom.
- MCP Connect: tampilkan detail error yang user-friendly.
- Aksesibilitas (WCAG) & mobile responsive board kanban.

---

## 12. Open Questions

1. Apakah auth harus diwajibkan (multi-user) atau tetap single-user bypass?
2. Apakah perlu export format lain (PDF, Notion, JSON, API)?
3. Apakah perlu integrasi repo (GitHub) agar task auto-buat issue/PR?
4. LLM "PRD" — apakah akan ada multi-model (default vs agent) per pipeline?
5. Apakah PRD perlu version compare (diff antar versi)?

---

## 13. Future Enhancements

- Drag-drop kanban + swimlane per fitur.
- Notifikasi agent (ketika task done, push ke browser).
- Auto-commit PRD ke GitHub (file `.md` + issue per task).
- Multi-bahasa output (EN/ID toggle).
- Template PRD per industri (SaaS, POS, HRM, dll).
- Live collaboration (multi-user di satu project).
