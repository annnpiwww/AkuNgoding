# PRD: akuNgoding

**Versi:** 1.0
**Status:** Draft

---

## 1. Overview

### Problem Statement
Banyak orang punya ide atau konsep produk, tapi kesulitan menerjemahkannya jadi requirement yang terstruktur sebelum diserahkan ke AI coding agent (Claude Code, Cursor, dsb) atau ke developer. Akibatnya, prompt/brief yang diberikan ke AI agent sering ambigu, scope tidak jelas, arsitektur tidak dipikirkan, dan hasil akhirnya jadi berantakan atau butuh banyak revisi.

### Solusi
**akuNgoding** adalah web app yang membantu pengguna mengubah ide/konsep mentah menjadi **PRD (Product Requirements Document)** yang lengkap dan detail. Prosesnya:
1. Pengguna memasukkan ide secara bebas.
2. AI mengajukan pertanyaan klarifikasi (opsional) untuk mempertajam pemahaman ide.
3. AI menyusun draft PRD lengkap dengan 7 bagian standar.
4. Pengguna review & edit draft.
5. Pengguna diajak melanjutkan ke sesi **breakdown fitur & task**, hasilnya ditambahkan ke PRD yang sama.
6. Pengguna export PRD final sebagai file `.md`, siap dikirim ke AI coding agent atau tim developer.

### Target Users
- Solo builder / "vibe coder" yang membangun produk sendiri dibantu AI agent.
- Product manager atau founder yang butuh cara cepat menstrukturkan ide jadi spesifikasi.
- Developer yang ingin scoping project lebih rapi sebelum mulai coding.

### Goals
- Mempercepat proses dari "ide di kepala" menjadi dokumen requirement yang siap dieksekusi.
- Mengurangi ambiguitas brief yang dikirim ke AI coding agent, sehingga output coding agent lebih akurat.
- Memberi pengguna kontrol penuh atas model AI yang dipakai (bring-your-own LLM endpoint & API key).

---

## 2. Requirements

### Functional Requirements
- FR1: Pengguna dapat memasukkan ide/konsep dalam bentuk teks bebas.
- FR2: Sistem dapat menjalankan sesi klarifikasi berbasis chat (AI bertanya, user menjawab), dan sesi ini bisa dilewati (skip).
- FR3: Sistem dapat menghasilkan draft PRD 7 bagian berdasarkan ide + hasil klarifikasi.
- FR4: Pengguna dapat mengedit PRD secara manual, atau meminta AI merevisi bagian tertentu saja.
- FR5: Setelah PRD selesai, sistem mengajak pengguna melakukan breakdown per fitur menjadi sub-fitur, spesifikasi teknis, dan task list.
- FR6: Hasil breakdown ditambahkan sebagai bagian lanjutan pada PRD yang sama (bukan file baru).
- FR7: Pengguna dapat mengatur koneksi LLM: URL endpoint, API key, nama model.
- FR8: Pengguna dapat menekan tombol "Test Connection" untuk memverifikasi koneksi ke LLM sebelum dipakai generate.
- FR9: Pengguna dapat export PRD final sebagai file Markdown (`.md`).
- FR10: Sistem menyimpan pengaturan LLM & histori project per akun pengguna (login).

### Non-Functional Requirements
- NFR1: API key LLM pengguna disimpan terenkripsi, tidak pernah dikirim ke client dalam bentuk plain text setelah tersimpan.
- NFR2: Panggilan ke LLM eksternal dilakukan lewat server (proxy), bukan langsung dari browser, untuk menghindari kebocoran API key.
- NFR3: Sistem harus tetap berfungsi untuk endpoint LLM ber-format OpenAI-compatible apapun (OpenAI, OpenRouter, Ollama lokal, LM Studio, dll).
- NFR4: Waktu respons "Test Connection" maksimal beberapa detik dengan status jelas (berhasil/gagal + pesan error).
- NFR5: Draft PRD tidak boleh hilang jika koneksi terputus di tengah proses generate (auto-save progresif).

---

## 3. Core Features

| # | Fitur | Deskripsi | Catatan UI/UX |
|---|---|---|---|
| F1 | Input ide | Textarea besar untuk menulis ide bebas, ada judul project. | Halaman awal simpel, fokus ke satu ajakan aksi: "Mulai susun PRD". |
| F2 | Sesi klarifikasi AI | Chat interface, AI ajukan pertanyaan lanjutan satu-satu berdasarkan ide. Tombol "Skip, langsung generate" selalu tersedia. | Terasa seperti obrolan santai, bukan form kaku. |
| F3 | Generate PRD | AI menyusun draft PRD 7 bagian (Overview, Requirements, Core Features, User Flow, Architecture, Database Schema, Tech Stack), termasuk catatan UI/UX di dalam Core Features & User Flow. | Tampilkan progress per bagian saat digenerate (streaming), bukan loading kosong. |
| F4 | Review & edit PRD | Editor markdown untuk PRD yang dihasilkan; per bagian ada tombol "Minta AI revisi bagian ini". | Split view: preview rapi di satu sisi, raw markdown di sisi lain (opsional toggle). |
| F5 | Breakdown fitur & task | Setelah PRD final, AI ajak diskusi per fitur di Core Features: pecah jadi sub-fitur, spesifikasi teknis, task list (checklist). Ditambahkan ke bagian baru di PRD yang sama. | Bisa dikerjakan fitur demi fitur, tidak harus sekaligus semua. |
| F6 | Pengaturan LLM | Halaman settings: Base URL/endpoint, API key, nama model (input manual, mendukung provider OpenAI-compatible apapun), tombol **Test Connection**. | Status koneksi ditampilkan jelas (berhasil / gagal + pesan error), termasuk info model yang terdeteksi kalau berhasil. |
| F7 | Export PRD | Tombol export/download PRD final sebagai satu file `.md`. | Nama file otomatis mengikuti judul project. |
| F8 *(pendukung)* | Akun & histori project | Login (Supabase Auth), daftar project PRD yang pernah dibuat, bisa dibuka & dilanjutkan. | Diperlukan karena pengaturan LLM & draft PRD perlu tersimpan per user — bukan diminta eksplisit sebelumnya, jadi ini asumsi berdasarkan tech stack (Supabase) yang dipilih; boleh dikonfirmasi ulang. |

---

## 4. User Flow

1. **Landing** — pengguna login/daftar, lalu klik "Project baru".
2. **Input ide** — pengguna menulis ide/konsep secara bebas, klik "Lanjut".
3. **Klarifikasi AI** — AI menampilkan beberapa pertanyaan lanjutan; pengguna menjawab atau menekan "Skip".
4. **Generate PRD** — sistem memanggil LLM (sesuai pengaturan di F6) dan menyusun draft PRD 7 bagian.
5. **Review & edit** — pengguna membaca hasil, mengedit manual dan/atau minta AI revisi bagian tertentu, sampai puas.
6. **Ajakan breakdown** — sistem menawarkan: "Lanjut breakdown fitur jadi sub-fitur & task?"
   - Jika ya → masuk sesi breakdown per fitur (F5), hasil otomatis ditambahkan ke PRD.
   - Jika tidak → langsung ke langkah export.
7. **Export** — pengguna download PRD final sebagai `.md`, siap dikirim ke AI coding agent.

**Edge case:**
- Koneksi ke LLM gagal saat generate → tampilkan error jelas + arahkan ke halaman Settings untuk cek/ubah koneksi.
- Pengguna keluar di tengah sesi klarifikasi/breakdown → progress tersimpan, bisa lanjut dari project yang sama nanti.

---

## 5. Architecture

**Frontend**
- Next.js (App Router) + React + Tailwind CSS.
- Halaman utama: Dashboard project, Input Ide, Sesi Klarifikasi, Editor PRD, Sesi Breakdown, Settings LLM.

**Backend**
- Next.js API routes / server actions sebagai proxy ke LLM eksternal — API key tidak pernah lewat client langsung ke provider LLM.
- Endpoint terpisah untuk: generate PRD, revisi per bagian, sesi klarifikasi, breakdown fitur, test connection.

**Data layer**
- Supabase Postgres untuk menyimpan user, pengaturan LLM, dan dokumen PRD.
- Supabase Auth untuk login/session pengguna.

**Integrasi eksternal**
- LLM endpoint milik pengguna sendiri (bring-your-own), dipanggil lewat format chat-completion yang OpenAI-compatible.

---

## 6. Database Schema

| Tabel | Field utama | Keterangan |
|---|---|---|
| `users` | id, email, created_at | Disediakan Supabase Auth. |
| `llm_settings` | id, user_id (FK), base_url, api_key (terenkripsi), model_name, updated_at | Satu pengguna bisa punya lebih dari satu profil koneksi LLM. |
| `projects` | id, user_id (FK), title, idea_input, status, created_at, updated_at | Status: draft_ide / klarifikasi / prd_generated / breakdown / final. |
| `clarification_messages` | id, project_id (FK), role (ai/user), content, created_at | Log tanya-jawab sesi klarifikasi. |
| `prd_documents` | id, project_id (FK), content_markdown, version, updated_at | Isi PRD lengkap (7 bagian + hasil breakdown) dalam satu field markdown. |

---

## 7. Tech Stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Frontend framework | Next.js + React | Mendukung server actions untuk proxy API key dengan aman, satu framework untuk frontend & backend ringan. |
| Styling | Tailwind CSS | Cepat untuk membangun UI konsisten, cocok dipakai bareng komponen custom. |
| Database & Auth | Supabase (Postgres, Auth) | Sudah dipakai di project [[trackingduit]] milik pengguna, mempercepat setup & konsisten dengan workflow yang sudah familiar. |
| LLM integration | HTTP client ke endpoint OpenAI-compatible (dikonfigurasi user) | Fleksibel untuk provider apapun: OpenAI, OpenRouter, Ollama lokal, LM Studio, dll. |
| Deployment | Vercel (disarankan, menyatu dengan Next.js) | Deploy cepat, cocok untuk arsitektur server actions Next.js. |

---

## 8. Feature Breakdown & Tasks

### F1 — Input Ide

**Sub-fitur**
- Form input judul project (max 100 karakter)
- Textarea input ide bebas (min 20 karakter, autosize)
- Tombol "Lanjut ke klarifikasi"

**Spesifikasi**
- Validasi client-side: judul & ide tidak boleh kosong.
- Saat "Lanjut" ditekan → buat row baru di tabel `projects` (status: `draft_ide`), redirect ke halaman klarifikasi.

**Tasks**
- [ ] Buat halaman `/project/new` dengan form judul + textarea ide
- [ ] Implementasi validasi form (client-side)
- [ ] Buat API route `POST /api/projects` untuk simpan project baru ke Supabase
- [ ] Redirect ke `/project/[id]/clarify` setelah submit sukses

---

### F2 — Sesi Klarifikasi AI

**Sub-fitur**
- Chat UI (bubble AI vs user)
- Tombol "Skip, langsung generate"
- Indikator jumlah pertanyaan tersisa (opsional, misal maks 5 pertanyaan)

**Spesifikasi**
- AI menerima idea_input, membalas dengan 1 pertanyaan klarifikasi per giliran (bukan sekaligus banyak).
- Setiap jawaban user disimpan ke tabel `clarification_messages`.
- Setelah maksimal N pertanyaan (default 5) atau user menekan skip → status project berubah jadi `klarifikasi`, lanjut ke generate PRD.

**Tasks**
- [ ] Buat halaman `/project/[id]/clarify` dengan chat UI
- [ ] Buat API route `POST /api/projects/[id]/clarify` yang memanggil LLM (system prompt: "ajukan 1 pertanyaan klarifikasi berdasarkan ide + histori jawaban")
- [ ] Simpan setiap pesan ke tabel `clarification_messages`
- [ ] Implementasi tombol skip yang langsung ubah status project
- [ ] Batasi maksimal jumlah pertanyaan (default 5, bisa dikonfigurasi)

---

### F3 — Generate PRD

**Sub-fitur**
- Layar progress generate (streaming per bagian)
- System prompt "pakar pembuatan PRD" mengikuti pedoman referensi (PRDGenius)

**Spesifikasi**
- Input ke LLM: idea_input + seluruh histori clarification_messages.
- Output: markdown PRD 7 bagian (Overview, Requirements, Core Features, User Flow, Architecture, Database Schema, Tech Stack), UI/UX menyatu di Core Features & User Flow.
- Hasil disimpan ke tabel `prd_documents` (content_markdown), status project jadi `prd_generated`.
- Jika koneksi LLM gagal → tampilkan error, arahkan ke halaman Settings.

**Tasks**
- [ ] Buat API route `POST /api/projects/[id]/generate-prd`
- [ ] Susun system prompt generator PRD (7 bagian, format markdown baku)
- [ ] Implementasi streaming response ke frontend (per bagian tampil bertahap)
- [ ] Simpan hasil ke tabel `prd_documents`
- [ ] Handle error koneksi LLM (pesan jelas + link ke Settings)

---

### F4 — Review & Edit PRD

**Sub-fitur**
- Editor markdown (split view: raw + preview)
- Tombol "Minta AI revisi bagian ini" per section

**Spesifikasi**
- Edit manual langsung update `content_markdown` (autosave).
- "Revisi bagian ini": kirim section terkait + instruksi user ke LLM, ganti hanya bagian itu di dokumen.

**Tasks**
- [ ] Buat halaman `/project/[id]/edit` dengan markdown editor
- [ ] Implementasi autosave ke Supabase (debounce)
- [ ] Buat API route `POST /api/projects/[id]/revise-section` (input: nama section + instruksi)
- [ ] Update `content_markdown` hanya pada section yang direvisi, tanpa mengubah bagian lain

---

### F5 — Breakdown Fitur & Task

**Sub-fitur**
- Daftar fitur dari section "Core Features" (parsing otomatis dari markdown)
- Chat per-fitur untuk breakdown sub-fitur, spesifikasi, task
- Tombol "Tambahkan ke PRD" per fitur yang sudah selesai di-breakdown

**Spesifikasi**
- Sistem parse bagian "Core Features" dari `content_markdown` jadi daftar fitur yang bisa diklik satu-satu.
- Untuk tiap fitur: AI membantu susun sub-fitur, spesifikasi teknis, dan task checklist (format sama seperti contoh di dokumen ini).
- Hasil breakdown per fitur di-append ke `content_markdown` di bagian "8. Feature Breakdown & Tasks", tidak menimpa bagian lain.
- Status project berubah `breakdown` saat minimal 1 fitur sudah di-breakdown, jadi `final` saat semua fitur selesai atau user memilih selesai.

**Tasks**
- [ ] Buat parser markdown untuk ekstrak daftar fitur dari section "Core Features"
- [ ] Buat halaman `/project/[id]/breakdown` dengan list fitur + status (belum/sudah di-breakdown)
- [ ] Buat API route `POST /api/projects/[id]/breakdown-feature` (input: nama fitur)
- [ ] Implementasi append hasil ke `content_markdown` tanpa merusak format existing
- [ ] Update status project sesuai progress breakdown

---

### F6 — Pengaturan LLM

**Sub-fitur**
- Form: Base URL/endpoint, API Key, Model name
- Tombol "Test Connection"
- Bisa simpan lebih dari 1 profil koneksi (opsional, default 1 profil aktif)

**Spesifikasi**
- API key dienkripsi sebelum disimpan ke tabel `llm_settings` (server-side, bukan di client).
- "Test Connection": server melakukan request ringan (contoh: list models atau chat completion 1 token) ke endpoint yang dikonfigurasi, hasilnya ditampilkan (berhasil + info model / gagal + pesan error).
- Semua endpoint LLM lain di sistem (generate PRD, klarifikasi, revisi, breakdown) memakai profil aktif dari `llm_settings`.

**Tasks**
- [ ] Buat halaman `/settings/llm` dengan form endpoint, API key, model name
- [ ] Buat API route `POST /api/llm-settings` (enkripsi API key sebelum simpan)
- [ ] Buat API route `POST /api/llm-settings/test-connection`
- [ ] Tampilkan status koneksi (berhasil/gagal) dengan pesan jelas
- [ ] Pastikan semua pemanggilan LLM di fitur lain membaca profil ini

---

### F7 — Export PRD

**Sub-fitur**
- Tombol "Export .md" di halaman edit/breakdown

**Spesifikasi**
- Generate file `.md` dari `content_markdown` apa adanya (termasuk section breakdown jika sudah ada).
- Nama file otomatis: slug dari judul project, contoh `akungoding-prd.md`.

**Tasks**
- [ ] Implementasi tombol export yang trigger download file `.md` dari `content_markdown`
- [ ] Generate nama file otomatis dari judul project (slugify)

---

### F8 — Akun & Histori Project

**Sub-fitur**
- Login/daftar (Supabase Auth)
- Dashboard daftar project milik user (dengan status masing-masing)

**Spesifikasi**
- Semua data (`projects`, `prd_documents`, `clarification_messages`, `llm_settings`) di-scope per `user_id`, dengan Row Level Security Supabase aktif.
- Dashboard menampilkan project + status (draft_ide / klarifikasi / prd_generated / breakdown / final), bisa lanjut dari mana pun terakhir berhenti.

**Tasks**
- [ ] Setup Supabase Auth (login, register, session)
- [ ] Buat halaman `/dashboard` dengan daftar project + status
- [ ] Aktifkan Row Level Security di semua tabel, kebijakan akses per `user_id`
- [ ] Implementasi tombol "Lanjutkan" yang redirect sesuai status project terakhir

---

*Dokumen ini final dan siap dijadikan referensi untuk AI coding agent.*
