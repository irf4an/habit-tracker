# 0002. Code-Splitting & Lazy Loading untuk Modals Berat

- **Status:** Accepted (Implemented in `a2863f5`)
- **Tanggal:** 2026-08-27
- **Pengambil Keputusan:** Core Team

## Konteks & Masalah
Hasil build Vite sebelumnya menunjukkan single JavaScript bundle sebesar **~955 KB** (`index-*.js`). Library berat seperti `html2canvas-pro` (untuk export share card PNG), `canvas-confetti`, dan komponen modal yang jarang dibuka ikut dimuat pada *initial load*.

## Keputusan Arsitektur
1. Menerapkan **Route/Component Code-Splitting** menggunakan `React.lazy()` dan `<Suspense fallback={null}>` untuk seluruh modal:
   - `ShareCardModal` (mengisolasi `html2canvas-pro`)
   - `AchievementsModal` (mengisolasi evaluasi 50 lencana)
   - `AuthModal` (mengisolasi client Supabase auth views)
   - `PomodoroTimer`
   - `HabitModal`, `ProfileModal`, `HelpModal`, `OnboardingModal`
2. Menambahkan chunking granular di `vite.config.ts`:
   - `vendor-canvas` (html2canvas, confetti) = 259 KB (hanya di-download saat export share card)
   - `vendor-supabase` = 208 KB
   - `vendor-motion` = 128 KB
   - `vendor-react` = 189 KB
   - **App Core Bundle (`index.js`) = 102 KB** (Gzip: **30 KB!**)

## Hasil Pengujian
- **Ukuran Initial JS Bundle:** Berkurang **89%** dari **956 KB ➔ 102.6 KB (30 KB Gzip)**.
- **PWA Precache:** 24 fine-grained chunks terdaftar otomatis di Service Worker untuk offline-ready.
- **First Load Time di HP 4G:** < 0.5 detik.

