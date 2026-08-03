# Graph Report - /home/annnpii/Product development annpii/akuNgoding  (2026-08-03)

## Corpus Check
- Corpus is ~15,188 words - fits in a single context window. You may not need a graph.

## Summary
- 261 nodes · 431 edges · 23 communities (11 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- API Route Handlers
- TypeScript Config
- App Pages & Layouts
- Product Features & PRD
- Core Dependencies
- Architecture & Agents
- Dev Tooling Config
- Auth & Shell Layout
- PRD Dashboard UI Types
- Next.js Starter Docs
- Auth Middleware
- LLM Endpoint Proxy
- ESLint Config
- Next Config
- Next.js Framework
- PostCSS Config
- React
- Tailwind Styling
- Vercel Deploy
- Static Asset Icons
- Static Asset Icons
- Static Asset Icons
- Static Asset Icons

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 31 edges
2. `getEffectiveUser()` - 26 edges
3. `compilerOptions` - 16 edges
4. `useToast()` - 13 edges
5. `akuNgoding PRD (Product Requirements Document)` - 12 edges
6. `getActiveLlmConfig()` - 11 edges
7. `decrypt()` - 8 edges
8. `chatCompletion()` - 8 edges
9. `AGENTS.md - Agent Guidelines` - 8 edges
10. `README.md (Next.js starter)` - 8 edges

## Surprising Connections (you probably didn't know these)
- `decrypt() (LLM settings)` --semantically_similar_to--> `Enkripsi API key LLM (server-side)`  [INFERRED] [semantically similar]
  AGENTS.md → akuNgoding-PRD.md
- `Test Connection (verifikasi koneksi LLM)` --semantically_similar_to--> `getActiveLlmConfig() (LLM settings)`  [INFERRED] [semantically similar]
  akuNgoding-PRD.md → AGENTS.md
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  src/app/auth/callback/route.ts → src/lib/supabase/server.ts
- `LoginPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/auth/login/page.tsx → src/lib/supabase/client.ts
- `RegisterPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/auth/register/page.tsx → src/lib/supabase/client.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **PRD Tech Stack** — akungoding_prd_nextjs, akungoding_prd_react, akungoding_prd_tailwind_css, akungoding_prd_supabase, akungoding_prd_vercel, akungoding_prd_openai_compatible_endpoint [EXTRACTED 1.00]
- **Core Features F1-F8** — akungoding_prd_feature_input_ide, akungoding_prd_feature_klarifikasi_ai, akungoding_prd_feature_generate_prd, akungoding_prd_feature_review_edit_prd, akungoding_prd_feature_breakdown, akungoding_prd_feature_pengaturan_llm, akungoding_prd_feature_export_prd, akungoding_prd_feature_akun_histori [EXTRACTED 1.00]
- **Supabase Data Model** — akungoding_prd_projects_table, akungoding_prd_clarification_messages_table, akungoding_prd_prd_documents_table, akungoding_prd_llm_settings_table [EXTRACTED 1.00]

## Communities (23 total, 12 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.11
Nodes (37): DELETE(), GET(), POST(), POST(), POST(), GET(), POST(), POST() (+29 more)

### Community 1 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 2 - "App Pages & Layouts"
Cohesion: 0.12
Nodes (17): metadata, BreakdownPage(), Feature, ClarifyPage(), Message, EditPage(), GeneratePage(), SECTIONS (+9 more)

### Community 3 - "Product Features & PRD"
Cohesion: 0.13
Nodes (26): akuNgoding PRD (Product Requirements Document), AI coding agent, akuNgoding (web app), Auto-save progresif draft PRD, Tabel clarification_messages, Claude Code, Cursor, F8 - Akun & Histori Project (+18 more)

### Community 4 - "Core Dependencies"
Cohesion: 0.08
Nodes (25): next, dependencies, next, react, react-dom, react-markdown, remark-gfm, slugify (+17 more)

### Community 5 - "Architecture & Agents"
Cohesion: 0.13
Nodes (19): AGENTS.md - Agent Guidelines, BYO-LLM via OpenAI-compatible endpoint, chatCompletion() (LLM client), createClient() (Supabase client hub), decrypt() (LLM settings), getActiveLlmConfig() (LLM settings), getEffectiveUser() (auth bypass), graphify (knowledge graph tool) (+11 more)

### Community 6 - "Dev Tooling Config"
Cohesion: 0.12
Nodes (17): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+9 more)

### Community 7 - "Auth & Shell Layout"
Cohesion: 0.20
Nodes (6): LoginPage(), RegisterPage(), Navbar(), BYPASS_MODE, DEV_MOCK_USER, createClient()

### Community 8 - "PRD Dashboard UI Types"
Cohesion: 0.20
Nodes (11): DashboardPage(), getNextActionRoute(), STATUS_CONFIG, StatusBadge(), ClarificationMessage, LlmSetting, LlmSettingPublic, MessageRole (+3 more)

### Community 9 - "Next.js Starter Docs"
Cohesion: 0.44
Nodes (9): README.md (Next.js starter), app/page.tsx, create-next-app, Geist (font family Vercel), next/font, Next.js, Next.js Documentation & Learn, Next.js GitHub repository (+1 more)

### Community 10 - "Auth Middleware"
Cohesion: 0.60
Nodes (3): updateSession(), config, middleware()

## Knowledge Gaps
- **83 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+78 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `API Route Handlers` to `PRD Dashboard UI Types`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `getEffectiveUser()` connect `API Route Handlers` to `PRD Dashboard UI Types`, `Auth & Shell Layout`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _83 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `TypeScript Config` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `App Pages & Layouts` be split into smaller, more focused modules?**
  _Cohesion score 0.1168091168091168 - nodes in this community are weakly interconnected._
- **Should `Product Features & PRD` be split into smaller, more focused modules?**
  _Cohesion score 0.13230769230769232 - nodes in this community are weakly interconnected._