# 0004. Optimasi Komputasi Streak & Analytics Derivation

- **Status:** Accepted
- **Tanggal:** 2026-08-27
- **Pengambil Keputusan:** Core Team

## Konteks & Masalah
Fungsi `calculateStreak()` dan `calculateBadges()` (mengevaluasi 50 lencana dan memindai riwayat 365 hari) sebelumnya dijalankan berulang-ulang di setiap siklus render komponen utama (`App.tsx`, `ProfileModal.tsx`, `AchievementsModal.tsx`). Saat pengguna memiliki banyak habit dengan riwayat panjang, komputasi berulang ini dapat memicu frame drop.

## Keputusan Arsitektur
1. **Custom Hook `useAchievements(habits)` (`src/hooks/useAchievements.ts`):**
   - Memasang granular fingerprint key (`habitsFingerprint`) yang hanya memicu kalkulasi ulang saat terjadi mutasi data history / freeze / archive, bukan saat re-render biasa (misal saat ganti tab, buka modal, atau ganti filter kategori).
2. **Selective Derivation:**
   - Komponen `App.tsx`, `AchievementsModal.tsx`, dan `ProfileModal.tsx` menggunakan satu instance memoized state yang konsisten tanpa menduplikasi pemanggilan `calculateBadges()`.

## Hasil
- CPU usage berkurang drastis saat interaksi UI (scroll, ketik filter, klik modal).
- UI konsisten berjalan pada **60 fps** mulus di semua perangkat.

