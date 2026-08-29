# 0003. Pola Sinkronisasi Local-First & Outbox Queue

- **Status:** Accepted
- **Tanggal:** 2026-08-27
- **Pengambil Keputusan:** Core Team

## Konteks & Masalah
Saat ini fungsi `syncHabitToCloud()` bekerja secara *fire-and-forget*. Jika pengguna melakukan check-in saat offline (misal di pesawat/sinyal buruk), data tersimpan di LocalStorage tetapi mutasi ke Supabase gagal dan hilang tanpa retry mechanism. Terdapat juga risiko data overwrite jika pengguna memakai 2 device berbeda tanpa perbandingan timestamp.

## Keputusan Arsitektur
Mengadopsi pola **Local-First Architecture** dengan **Mutation Outbox Queue**:
1. **Source of Truth Lokal:** Seluruh aksi baca dan tulis pertama kali selalu ke LocalStorage.
2. **Outbox Queue (`minimal_habit_sync_outbox_v1`):** Setiap mutasi (insert, update, delete) dicatat ke antrean lokal dengan `timestamp` dan de-duplikasi otomatis per habit ID.
3. **Auto-Flush Listeners:**
   - Listener event `window.addEventListener('online', flushOutboxQueue)` otomatis menguras antrean saat jaringan terhubung kembali.
   - Listener `visibilitychange` menguras antrean saat tab browser dibuka kembali.
   - Background interval berkala setiap 60 detik.
4. **Indikator Status:** Indikator antrean sinkronisasi live di Modal Profil pengguna.

## Hasil & Konsekuensi
- **Positif:** 100% tahan offline (offline-resilient), bebas dari data loss akibat gangguan sinyal, bandwidth efisien dengan deduplikasi mutasi.

