# 0004. Optimasi Komputasi Streak & Analytics Derivation

- **Status:** Proposed
- **Tanggal:** 2026-08-27
- **Pengambil Keputusan:** Core Team

## Konteks & Masalah
Fungsi `calculateStreak()` dan `calculateBadges()` (mengevaluasi 50 lencana dan memindai riwayat 365 hari) saat ini dijalankan langsung di dalam render loop komponen. Ketika pengguna memiliki 15+ kebiasaan dengan riwayat 1-2 tahun (ribuan titik tanggal), komputasi intensif ini berpotensi memicu *frame drop* (jank) saat scrolling atau mengetik.

## Keputusan Arsitektur
1. **Selective Memoization:** Gunakan granular dependency keys untuk `useMemo` daripada me-rekomputasi seluruh list saat hanya 1 habit yang berubah.
2. **Web Worker Offloading (Future-Proof):** Untuk kalkulasi berat (seperti pembuatan grafik heatmap tahunan terpadu dan badge scanner massal), pindahkan komputasi ke dedicated Web Worker di background thread jika riwayat melewati 365 hari.

## Konsekuensi
- **Positif:** Main thread UI tetap berjalan 60fps konstan tanpa lag interaksi.
- **Negatif:** Menambah sedikit kompleksitas asynchronous messaging jika menggunakan Web Worker.
