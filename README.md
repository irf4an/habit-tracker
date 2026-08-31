# Minimal Habit Tracker — Build Consistency Daily

> Pelacak kebiasaan harian yang bersih, cepat, dan bebas distraksi. Heatmap 52 minggu, Pomodoro, streak protection, dan offline PWA — data milikmu, sinkronisasi opsional.

**Live Demo → https://habit-tracker.ahmdirfn19902.workers.dev**

![PWA](https://img.shields.io/badge/PWA-ready-brightgreen) ![Vite](https://img.shields.io/badge/Vite-8.x-646CFF) ![React](https://img.shields.io/badge/React-19-61DAFB) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## Deskripsi

Minimal Habit Tracker lahir dari kebutuhan personal untuk membangun konsistensi harian tanpa iklan, paywall, atau tracking invasif. Guest-first: buka langsung pakai, data tersimpan lokal (IndexedDB/LocalStorage). Cloud sync ke Supabase hanya jika kamu login. Cocok di HP, tablet, laptop — install sebagai PWA, tetap jalan offline.

## Fitur

- **Heatmap 52 minggu** — grid GitHub-style per habit (warna habit), 17/19/28/52 minggu adaptif, sinkron & akurasi bulan.
- **Habit stacking (Time-of-Day)** — Pagi `🌤️` / Siang `☀️` / Malam `🌙` / Bebas `🕒`, filter cepat + badge di card.
- **Frekuensi fleksibel** — setiap hari, hari kerja, akhir pekan, atau target mingguan (X hari/minggu).
- **Negative / anti-habit** — menahan diri (mis. no sugar): default bersih/hijau, relapse = merah, streak hari bebas.
- **Target angka** — mis. 20 halaman, 60 menit, dengan progress & streak.
- **Jurnal & mood harian** — catatan + mood (Senang/Semangat/Fokus/Lelah/Berat) per tanggal, timeline feed dengan search & filter.
- **Pomodoro focus mode** — timer fokus + istirahat, lanjut sesi, akumulasi `focusLog` per hari (menit & sesi) tampil di card & peringkat.
- **Notifikasi pintar** — per-habit reminder (snooze), ringkasan malam 21:00, quiet hours, chime.
- **Streak protection** — bekukan streak (2x/7 hari rolling) untuk hari sakit/libur.
- **Gamifikasi** — 50+ badge, level & XP.
- **Statistik & rekap mingguan** — skor konsistensi, tren vs pekan lalu, bintang pekan & perlu perhatian, breakdown per habit.
- **Share & export** — kartu streak PNG (html2canvas), CSV/JSON backup & restore.
- **PWA polish** — iOS Add-to-Home prompt, badge, theme dark/light dengan animasi circular reveal.

## Keunggulan

- **Ringan & cepat** — initial bundle ~118 KB (34 KB gzip), code-splitting semua modal, vendor besar (html2canvas, supabase) lazy + precache 507 KiB.
- **Hemat kuota & offline** — Service Worker `CacheFirst` untuk vendor, local-first dengan outbox queue + auto-retry saat online (`online`/`visibilitychange`/60s).
- **Responsif** — hitung streak jadwal-aware (off-days tidak putus streak), heatmap presisi & touch-scroll.
- **Privasi** — tanpa iklan/tracker; tip jar sukarela (Saweria/Trakteer/GitHub) di profil.

## Tech Stack

React 19 · Vite 8 · Tailwind CSS 4 · PWA (vite-plugin-pwa, Workbox) · Supabase · Lucide / Material Symbols · canvas-confetti · html2canvas-pro (lazy)

## Quick Start

```bash
npm install
cp .env.example .env.local   # isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY (opsional, tetap jalan offline)
npm run dev                  # http://localhost:5173
npm run build                # tsc + vite build
npm run preview
```

Deploy ke Cloudflare: `wrangler.toml` sudah siap (`[assets] directory = "./dist"`), `npm run build` lalu `npx wrangler deploy` atau hubungkan Pages ke repo.

## Struktur

```
src/
  components/   # HabitCard, HabitModal, StatsView, PomodoroTimer, WeeklyReviewModal, ...
  hooks/        # useHabits, useAuthProfile, useReminders, useTheme, useAchievements
  utils.ts      # streak, weekly review, format tanggal natural (Senin, 17 Agustus 2026)
  types.ts      # Habit, TimeOfDay, DailyMood, focusLog/focusSessions
public/         # favicon.svg, og-image.svg, icons.svg
docs/           # VISION.md, adr/
roadmap/        # ROADMAP.md
```

## Lisensi

MIT — bebas pakai & modifikasi. Kontribusi & issue sangat diterima.
