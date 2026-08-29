# 0001. Arsitektur State Management & Dekomposisi App.tsx

- **Status:** Accepted (Implemented in `f1e73a0`)
- **Tanggal:** 2026-08-27
- **Pengambil Keputusan:** Core Team

## Konteks & Masalah
File `src/App.tsx` sebelumnya bertindak sebagai *God Component* (~887 baris kode) yang mengelola 15+ state React sekaligus: data habits, modal triggers, autentikasi cloud, periodic reminder loop, theme toggle, dan keyboard shortcut listener.

## Keputusan Arsitektur
Dekomposisi seluruh logika bisnis ke dalam **Domain Custom Hooks** di folder `src/hooks/`:
1. `src/hooks/useHabits.ts`: Mengelola data state, CRUD habits, persistensi LocalStorage, toggle checklist, catatan refleksi, dan streak freeze.
2. `src/hooks/useAuthProfile.ts`: Mengisolasi state autentikasi Supabase, user profile, dan auto-sync listener.
3. `src/hooks/useReminders.ts`: Mengelola interval background checker notifikasi, evaluasi jam sunyi (*quiet hours*), dan snooze 10 menit.
4. `src/hooks/useKeyboardShortcuts.ts`: Mengelola global hotkeys (`N`, `1-9`) dengan *input/textarea guard*.
5. `src/hooks/useTheme.ts`: Mengelola theme dark/light mode dan animasi View Transition circle reveal.

## Hasil
- Ukuran file `App.tsx` berhasil dipangkas **>55%** dari **887 baris ➔ 395 baris**.
- Komponen murni fokus pada tata letak tampilan (*Presentation Layer*), sementara *Business Logic* terisolasi rapi dan mudah di-test.

