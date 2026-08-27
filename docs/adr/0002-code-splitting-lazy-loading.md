# 0002. Code-Splitting & Lazy Loading untuk Modals Berat

- **Status:** Proposed
- **Tanggal:** 2026-08-27
- **Pengambil Keputusan:** Core Team

## Konteks & Masalah
Hasil build Vite saat ini menunjukkan single JavaScript bundle sebesar **~955 KB** (`index-*.js`). Library berat seperti `html2canvas-pro` (untuk export share card PNG), `canvas-confetti`, dan komponen modal yang jarang dibuka ikut dimuat pada *initial load*. Hal ini memperlambat *First Contentful Paint (FCP)* dan *Time to Interactive (TTI)* pada perangkat mobile dengan koneksi lambat.

## Keputusan Arsitektur
Menerapkan **Route/Component Code-Splitting** menggunakan `React.lazy()` dan `React.Suspense` untuk modal sekunder:
1. `ShareCardModal` (mengisolasi `html2canvas-pro`).
2. `AchievementsModal` (mengisolasi evaluasi 50 lencana).
3. `AuthModal` (mengisolasi client Supabase auth views).
4. `HelpModal` dan `OnboardingModal`.

Menambahkan konfigurasi chunking pada `vite.config.ts` untuk memisahkan vendor libraries (React, motion, supabase) ke chunk terpisah.

## Konsekuensi
- **Positif:** Initial bundle berkurang dari ~955 KB menjadi < 250 KB. Loading awal aplikasi instan (< 1 detik di mobile).
- **Negatif:** Terdapat delay mikro (~50-100ms) saat user pertama kali membuka modal saat aset chunk diunduh (dapat dimitigasi dengan spinner minimalis atau preloading on hover).
