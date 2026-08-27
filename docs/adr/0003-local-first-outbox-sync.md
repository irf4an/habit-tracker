# 0003. Pola Sinkronisasi Local-First & Outbox Queue

- **Status:** Proposed
- **Tanggal:** 2026-08-27
- **Pengambil Keputusan:** Core Team

## Konteks & Masalah
Saat ini fungsi `syncHabitToCloud()` bekerja secara *fire-and-forget*. Jika pengguna melakukan check-in saat offline (misal di pesawat/sinyal buruk), data tersimpan di LocalStorage tetapi mutasi ke Supabase gagal dan hilang tanpa retry mechanism. Terdapat juga risiko data overwrite jika pengguna memakai 2 device berbeda tanpa perbandingan timestamp.

## Keputusan Arsitektur
Mengadopsi pola **Local-First Architecture** dengan **Mutation Outbox Queue**:
1. **Source of Truth Lokal:** Seluruh aksi baca dan tulis pertama kali selalu ke LocalStorage/IndexedDB.
2. **Outbox Queue:** Setiap mutasi (insert, update, delete) mencatat item mutasi ke dalam queue `pending_sync_queue` dengan `timestamp` ISO dan `operation_id`.
3. **Auto-Retry & Online Listener:** Pasang listener `window.addEventListener('online', flushQueue)` dan background worker interval untuk menguras antrean mutasi ke Supabase.
4. **Last-Write-Wins with Timestamp:** Resolusi konflik menggunakan field `updatedAt` pada level habit history.

## Konsekuensi
- **Positif:** 100% offline-ready, data tidak pernah hilang meski jaringan putus-nyambung, sync multi-device lebih andal.
- **Negatif:** Menambah lapisan state tracking antrean sync dan skema migrasi tabel Supabase (kolom `updated_at`).
