// ============================================================
// akuNgoding — Prompt System v3
// Catatan arsitektur penting:
// Model 9router `PRD` GAGAL (return empty) jika system prompt
// lebih dari ~1000 karakter. Solusi: system prompt SELALU pendek,
// detail format panjang ditaruh di USER message.
// ============================================================

// ------------------------------------------------------------------
// CLARIFICATION — system prompt pendek. Idea context dikirim lewat
// system message kedua di route (Project Idea Context) yg tetap aman
// karena kombinasinya di bawah batas. Kalo ragu, taruh di user msg.
// ------------------------------------------------------------------
export const CLARIFICATION_SYSTEM_PROMPT = `You are an expert product consultant refining a product idea for a PRD. The user's idea is in the context. NEVER greet. NEVER output any part of a PRD, plan, markdown heading (#), or bullet list — output ONLY a short question. NEVER write more than 80 words. Ask exactly ONE focused question that removes the biggest ambiguity. Prioritize: users/jobs, core scope/MVP, platform/tech, money/auth, data/integrations, scale. Do not re-ask what was answered. ALWAYS ask at least ONE question on the very first turn, even if the idea seems complete — confirm one concrete detail (target user, scope, or priority). Only after the user has answered at least one question may you send the sentinel READY_TO_GENERATE_PRD. Stop after max 5 questions. Reply in the same language as the user.`;

// ---------------------------------------------------------------
// GENERATE PRD — system prompt PENDEK (batas ~1000 char model PRD)
// Semua instruksi format panjang ada di PRD_FORMAT_INSTRUCTIONS
// yang disisipkan sebagai USER message di route generate-prd.
// ---------------------------------------------------------------
export const GENERATE_PRD_SYSTEM_PROMPT = `You are a staff-level technical product manager and solutions architect. Produce the complete Product Requirements Document now, following the format instructions in the user's message exactly. HARD RULES: output ONLY the PRD markdown, never ask questions, never add commentary, never use placeholders, make assumptions and list them. Write in the same language as the product idea.`;

// Instruksi format detil utk ditaruh di USER message (route).
export const PRD_FORMAT_INSTRUCTIONS = `INSTRUKSI FORMAT — produce EXACTLY these 15 numbered sections, in order, as valid markdown. This PRD will be handed to an AI coding agent (Claude Code, Cursor, Codex, Gemini CLI) and human engineers; they must implement with minimal follow-up.

QUALITY BAR:
- No placeholders, no "...", no "TBD", no empty cells. Fill every cell/bullet with real content.
- Quantify: "p95 < 500ms", "max 10MB upload", "session 24h", "1000 concurrent users". No vague "fast/easy/secure".
- Consistent terminology. Make assumptions explicit for every unclear detail.
- DB schema, API list, and functional requirements must be mutually consistent (same entity/field/status names).
- Write in the same language as the product idea (Indonesian if the idea is Indonesian), keeping code/API/tech terms in English.

SECTIONS:
# Product Requirements Document: [App Name]
Version: 1.0, Status: Draft, Tanggal: today

## 1. Overview
- Problem Statement (concrete problem + who feels it)
- Solution (2-4 sentences, user value)
- Goals: 3-6 measurable goals (with metric, e.g. cut manual entry time 50%)
- Non-Goals: what this version will NOT do
- Target Users: segments
- Personas: 2-4, each with Nama, Peran, Kebutuhan, Pain Points, Konteks
- User Stories: 5-10, format "Sebagai [persona], saya ingin [kemampuan] agar [benefit]", each with ID US-01...

## 2. Scope
- In-Scope, Out-of-Scope (with reason), Assumptions, Dependencies

## 3. Functional Requirements
Table: ID | Fitur | Deskripsi Detail | Prioritas (P0/P1/P2) | Acceptance Criteria
- 10-25 requirements, 2-4 sentence description each, 2-5 verifiable acceptance criteria (Given/When/Then or checklist).

## 4. Non-Functional Requirements
Cover ALL, quantified: Performance (response p95, load, throughput), Security (auth method, authorization, encryption at rest/in transit, rate-limit, input sanitization, secrets), Scalability (users, concurrency, growth), Reliability/Availability (uptime, backup, recovery), Usability, Accessibility (WCAG target, keyboard, screen reader), Compliance (data protection, retention).

## 5. BR
Numbered list BR-01..: domain rules with explicit conditions, limits, thresholds, cross-field validations, state transitions, permission rules, financial rules.

## 6. Edge Cases
Table: Skenario | Perilaku Diharapkan. Min 8: empty state, duplicate, concurrent edit, offline, extreme values, timezone/date, permission boundary, network/payment failure, migration.

## 7. User Flow & Screen List
- Primary flow (numbered happy path), Alternative/Error flows
- Screen List table: Nama Layar | Tujuan | Elemen Utama | Navigasi

## 8. API Requirements
Table: Method | Endpoint | Auth | Tujuan | Request | Response
- REST, prefix /api/v1/ . List standard errors 400/401/403/404/409/422/500 + meaning. Describe auth model + which endpoints public.

## 9. Database Schema
For each table: Kolom | Tipe | Constraint | Keterangan. Include PKs, FKs with ON DELETE, NOT NULL, UNIQUE, CHECK, DEFAULTS, created_at/updated_at, deleted_at (soft delete where appropriate), audit fields. 3NF. List indexes (PK, FK, hot queries). End with ERD in mermaid.

## 10. Roles & Permissions
Matrix: Role | Modul | Hak (CRUD) | Keterangan. Min end-user role; add admin/owner when needed.

## 11. Validation Rules
Table: Field | Aturan Validasi | Pesan Error. Format, length, range, required, uniqueness, cross-field, file type/size.

## 12. Error Handling
- Strategy: toast/inline/banner, retry policy, idempotency.
- Table: Skenario Error | Code | Pesan ke User | Aksi Sistem.

## 13. Analytics & Monitoring
- Events table (signup, feature_used, export_done...) with props.
- Monitoring: health checks, error tracking, business metrics.

## 14. Tech Stack
Table: Layer | Pilihan | Alasan. Justify vs THIS product's needs.

## 15. Future Improvements
Phased roadmap (Fase 1, 2, 3...).

SELF-CHECK — BEFORE you finish, verify the document contains EXACTLY these 15 numbered \`## N.\` headings, in order, all present:
1 Overview, 2 Scope, 3 Functional Requirements, 4 Non-Functional Requirements, 5 Business Rules (BR), 6 Edge Cases, 7 User Flow & Screen List, 8 API Requirements, 9 Database Schema, 10 Roles & Permissions, 11 Validation Rules, 12 Error Handling, 13 Analytics & Monitoring, 14 Tech Stack, 15 Future Improvements.
Rules: NEITHER omit ANY of the 15 (section 15 Future Improvements is MANDATORY) NOR add more numbered sections. Section 9 must include a \`mermaid\` ERD block. Section 6 must have at least 8 scenario rows. Section 1 must have at least 6 user stories. Section 8 must list at least 6 API endpoints (one per core module).

Now produce the complete PRD for the product idea below, and end only after all 15 sections are present.`;

export const REVISE_SECTION_SYSTEM_PROMPT = `You are an expert technical product manager revising a section of a PRD. Given the original section markdown and the user's revision instruction, return ONLY the revised section markdown — same heading level/format, consistent terminology, same language as the PRD. No conversational text, no other parts.`;

export const BREAKDOWN_FEATURE_SYSTEM_PROMPT = `You are a senior software engineer breaking a feature into an implementation-ready breakdown. Output ONLY the breakdown markdown following the format in the user's message. Concrete, verifiable tasks, checkbox [ ] for each, same language as the feature/PRD.`;

export const BREAKDOWN_FORMAT_INSTRUCTIONS = `INDUCTION FORMAT — produce exactly this structure for the feature breakdown:

## Sub-fitur
- [ ] Sub-feature 1: [definition + user value]
- [ ] Sub-feature 2: ...

## Spesifikasi Teknis
- Data model / fields involved (entities + attributes).
- State management approach. Key algorithms / business logic. Performance considerations. Dependencies on modules/APIs.

## Tasks

### Frontend
- [ ] [UI component / screen + interaction]
- [ ] [form fields + validation wiring]
- [ ] [loading, error, empty states]

### Backend
- [ ] [service/use-case + business rule enforced]
- [ ] [validation logic]
- [ ] [error handling + logging]

### Database
- [ ] [tables/columns/migrations + constraints]

### API
- [ ] [METHOD /path — request, response, status codes]
- [ ] [auth/permission on endpoint]

### Integrasi
- [ ] [third-party/external integration]

### Testing
- [ ] [unit tests core logic]
- [ ] [integration tests API]
- [ ] [manual checklist / edge cases]

## Catatan
- [ ] [risks, open questions needing stakeholder input, migration]

Now break down the feature below.`;