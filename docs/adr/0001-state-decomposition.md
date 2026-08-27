# 0001. Arsitektur State Management & Dekomposisi App.tsx

- **Status:** Proposed
- **Tanggal:** 2026-08-27
- **Pengambil Keputusan:** Core Team

## Konteks & Masalah
File `src/App.tsx` saat ini bertindak sebagai *God Component* (~880 baris kode) yang mengelola 15+ state React sekaligus: data habits, modal triggers, autentikasi cloud, periodic reminder loop, theme toggle, dan keyboard shortcut listener. Hal ini menyebabkan:
1. **Re-render Berantai (Unnecessary Re-renders):** Perubahan pada satu tanggal habit memicu re-render seluruh aplikasi beserta modal-modal yang tertutup.
2. **Keterikatan Kuat (Tight Coupling):** Logika bisnis (streak, freeze rules, notifikasi) bercampur langsung dengan tata letak UI.

## Keputusan Arsitektur
Dekomposisi `App.tsx` ke dalam **Domain Custom Hooks** terisolasi:
- `useHabits()`: Mengelola CRUD, mutasi riwayat tanggal, streak freeze, dan persistensi `localStorage`.
- `useReminders()`: Mengelola pengecekan background interval, evaluasi quiet hours, dan snooze.
- `useKeyboardShortcuts()`: Menangani global hotkeys (`N`, `1-9`) dengan *input guard*.
- `useCloudSync()`: Menangani listener auth Supabase dan abstraksi sinkronisasi.

## Konsekuensi
- **Positif:** Ukuran `App.tsx` berkurang menjadi < 200 baris, re-render lebih hemat, logic mudah di-unit test secara terpisah.
- **Negatif:** Diperlukan refactor passing props atau penggunaan React Context sederhana untuk state sharing.
