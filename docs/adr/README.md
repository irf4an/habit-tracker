# Architecture Decision Records (ADR)

Indeks riwayat keputusan arsitektur teknis dan standar rekayasa perangkat lunak untuk Minimal Habit Tracker.

| No. | Dokumen | Status | Tanggal | Topik Utama |
| :--- | :--- | :--- | :--- | :--- |
| **0001** | [State Management & Dekomposisi App.tsx](0001-state-decomposition.md) | Proposed | 2026-08-27 | Refactor God Component ke Custom Hooks (`useHabits`, `useReminders`) |
| **0002** | [Code-Splitting & Lazy Loading Modals](0002-code-splitting-lazy-loading.md) | Proposed | 2026-08-27 | Reduksi bundle 955 KB -> <250 KB via `React.lazy` |
| **0003** | [Pola Sinkronisasi Local-First & Outbox Queue](0003-local-first-outbox-sync.md) | Proposed | 2026-08-27 | Keandalan offline-first & background retry sync Supabase |
| **0004** | [Optimasi Komputasi Streak & Analytics](0004-analytics-computation-optimization.md) | Proposed | 2026-08-27 | Memoization & offloading komputasi 50 lencana dari render loop |
