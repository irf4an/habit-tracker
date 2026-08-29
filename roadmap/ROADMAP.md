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
- [x] **Quick Evening Check-in Sheet**
  - Modal bottom sheet 1-tap check-in harian tanpa scroll panjang (lazy-loaded).

---

### 🚀 Versi 1.2 — Reflection & Retensi Data
**Fokus:** Mengangkat nilai catatan harian agar tidak terkubur di dalam grid.

- [ ] **Timeline Jurnal / Reflection Feed**
  - Tab atau sub-view kronologis yang menampilkan riwayat catatan harian (*daily reflections*).
  - Filter catatan berdasarkan habit dan pencarian teks.
  - Export jurnal terpisah ke format Markdown/PDF.
- [ ] **Streak Protection Notification Enhancement**
  - Notifikasi darurat pintar pukul 21:00 jika ada kebiasaan yang streak-nya aktif tapi belum dicentang.

---

### 🚀 Versi 2.0 — Deep Insights & Anti-Habits
**Fokus:** Fitur analitik prediktif dan variasi jenis kebiasaan baru.

- [ ] **Negative Habits / Anti-Habit Mode**
  - Format kebiasaan "Menahan Diri / Berhenti" (contoh: *No Sugar*, *Stop Merokok*, *Screen Time < 2 Jam*).
  - Otomatis dianggap sukses tiap hari kecuali user log "Relapse".
  - Counter hari bersih (*clean streak*) dan kalkulator penghematan (waktu/uang).
- [ ] **Weekly Review & Automated Digest**
  - Popup review otomatis tiap hari Senin pagi.
  - Skor konsistensi mingguan + analisis korelasi (contoh: *"Kamu 2x lebih konsisten saat memulai hari sebelum jam 8"*).
- [ ] **Widget iOS / Android (PWA Shortcuts)**
  - Pintasan cepat check-in hari ini langsung dari home screen.
