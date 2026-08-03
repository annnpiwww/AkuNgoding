# akuNgoding — Agent Guidelines

Repo ini memiliki knowledge graph yang dibangun dengan **graphify**.

## Wajib: gunakan graphify sebelum membaca file mentah

Graph ada di `graphify-out/graph.json` (196 nodes, 346 edges, 13 communities) dan selalu lebih cepat + akurat daripada membaca seluruh source code.

Commands:
- `/graphify .` — bangun ulang graph (atau `graphify update .` untuk re-extract cepat tanpa LLM)
- `graphify query "pertanyaan arsitektur"` — BFS traversal, cari node/relasi relevan
- `graphify explain "getActiveLlmConfig"` — penjelasan node + tetangganya
- `graphify path "A" "B"` — jalur terpendek antara dua simbol
- `graphify affected "createClient"` — node yang terdampak oleh perubahan X
- `graphify god-nodes` — hub arsitektur (paling terhubung)

Setelah `graphify query`, baca file spesifik yang disebut hasilnya — jangan baca semua file.

## Arsitektur inti (dari graph)
- Hub: `createClient()` (supabase), `getEffectiveUser()` (auth bypass), `getActiveLlmConfig()` / `decrypt()` (LLM settings), `chatCompletion()` (LLM client), `useToast()` (UI).
- Stack: Next.js 16 (App Router) + React 19 + Tailwind v4 + Supabase (auth + DB) + BYO-LLM via OpenAI-compatible endpoint.

## Catatan
- `graphify extract` dijalankan dengan `--code-only` (tanpa API key). Untuk semantic edges, jalankan `graphify extract . --backend <gemini|kimi|claude|openai>` dengan key yang sesuai.
- `.sql` tidak ter-index (butuh `pip install "graphifyy[sql]"`).
