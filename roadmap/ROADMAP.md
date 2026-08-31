# Roadmap Pengembangan Minimal Habit Tracker

Dokumen ini memetakan tahapan rilis fitur berdasarkan prioritas psikologi kebiasaan, retensi pengguna, dan kemudahan implementasi.

---

## 📌 Milestones

### 🚀 Versi 1.1 — Daily Flow & Habit Stacking
**Fokus:** Mengurangi beban visual dan memperjelas pemicu waktu harian.

- [x] **Time-of-Day Grouping (Habit Stacking)**
  - Tag waktu pelaksanaan: Pagi (*Morning*), Siang (*Afternoon*), Malam (*Evening*), Kapan Saja (*Anytime*).
  - Filter cepat di atas beranda: [Semua Waktu | 🌅 Pagi | ☀️ Siang | 🌙 Malam].
  - Badge waktu minimalis di kartu habit.
- [ ] **Quick Evening Check-in Sheet** — Dihentikan (dipindah ke *Evening Push Notification* di `useReminders`)
  - Diputuskan tidak dilanjutkan karena menumpuk section di beranda (Calendar overload) untuk user baru.

---

### 🚀 Versi 1.2 — Reflection & Retensi Data
**Fokus:** Mengangkat nilai catatan harian agar tidak terkubur di dalam grid.

- [x] **Timeline Jurnal / Reflection Feed**
  - Modal kronologis yang mengumpulkan seluruh catatan refleksi harian dari semua kebiasaan.
  - Filter catatan berdasarkan habit dan pencarian teks / tanggal.
  - Fitur edit dan hapus catatan langsung dari timeline feed.
- [x] **Streak Protection Notification Enhancement**
  - Evaluasi malam otomatis pukul 21:00 yang mengingatkan kebiasaan yang belum dicentang.

---

### 🚀 Versi 2.0 — Deep Insights & Anti-Habits
**Fokus:** Fitur analitik prediktif dan variasi jenis kebiasaan baru.

- [x] **Negative Habits / Anti-Habit Mode**
  - Tipe kebiasaan "Menahan Diri / Berhenti" (misal: *No Sugar*, *Stop Merokok*, *Screen Time < 2 Jam*).
  - Otomatis dianggap sukses/bersih tiap hari dari tanggal mulai, user hanya mencatat jika mengalami *Relapse*.
  - Counter hari bersih (*Clean Days Streak*) dan tampilan heatmap otomatis hijau (bersih) / merah (kambuh).
- [x] **Weekly Review & Automated Digest**
  - Banner rekap pekan lalu di tab Statistik (Senin s/d Minggu ISO).
  - Skor konsistensi pekan lalu, tren delta % dibanding pekan sebelumnya, kebiasaan bintang pekan, dan kebiasaan yang butuh perhatian.
  - Modal detail rekap mingguan terpisah (lazy-loaded).
- [x] **PWA Polish & iOS Safari Add-to-Homescreen Guide**
  - Banner install prompt untuk iOS Safari dan Android (`IOSInstallPrompt` + `beforeinstallprompt`).
  - Icon website diperbarui ke grid checklist teal `#0EC9A0`.
