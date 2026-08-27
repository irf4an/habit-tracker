# Visi, Misi & Strategi Produk — Minimal Habit Tracker

Dokumen ini mendefinisikan arah jangka panjang, prinsip inti produk, arsitektur biaya rendah, dan strategi peluncuran ke publik.

---

## 🌟 Visi
> *"Menyediakan pelacak kebiasaan yang bersih, bebas distraksi/iklan, cepat kilat, dan mulus di segala perangkat elektronik (HP, Laptop, Tablet, PC) tanpa memungut biaya langganan kepada pengguna."*

Aplikasi ini lahir dari kebutuhan personal yang dikembangkan menjadi fasilitas publik gratis (*public good*) untuk membantu siapa saja membangun konsistensi harian secara berkelanjutan.

---

## 🎯 Misi
1. **Zero-Friction Habit Tracking:** Akses instan tanpa kewajiban daftar/login di awal (*Guest-First*).
2. **Universal Accessibility (PWA):** Berjalan optimal dan responsif di browser apapun, hemat kuota, dan dapat di-install layaknya aplikasi native melalui Progressive Web App.
3. **Privacy by Design:** Data sepenuhnya milik pengguna (tersimpan lokal di perangkat). Sinkronisasi cloud bersifat opsional atas persetujuan pengguna.
4. **Distraction-Free Mindset:** Nol iklan, nol tracking invasif, nol spam notification, dan desain antarmuka yang menenangkan (*calm tech*).

---

## 🏗️ Strategi Infrastruktur & Operasional Hemat (< Rp 100.000/tahun)

Aplikasi dirancang agar dapat melayani ribuan hingga puluhan ribu pengguna aktif dengan biaya operasional mendekati nol:

### 1. Frontend & Hosting (Rp 0,- / Bulan)
- **Platform:** Cloudflare Pages / Vercel.
- **Keunggulan:** Unlimited bandwidth, Global Anycast CDN, SSL otomatis gratis, deployment otomatis via GitHub CI/CD.

### 2. Database & Autentikasi
- **Tahap Awal (0 - 5.000 User):** Supabase Free Tier (500 MB database, 50.000 Monthly Active Users auth) dengan arsitektur *Local-First* (hanya mengirim delta mutasi sync, bukan query data berat tiap detik).
- **Tahap Pertumbuhan (Self-Hosted Option):** Jika kuota tercapai, deploy **PocketBase** (single binary Go + SQLite) di VPS murah (~Rp 50.000/bulan) yang mampu menangani 20.000+ koneksi concurrent pada 1 CPU 1GB RAM.

### 3. Domain & Identitas
- Modal utama hanya dialokasikan untuk sewa domain resmi (`.com` / `.id` / `.app`) sekitar Rp 100k–150k per tahun.

---

## 📱 Standar Pengalaman Multi-Device (PWA)

| Perangkat | Target Pengalaman Pengguna |
| :--- | :--- |
| **Mobile (iOS / Android)** | Safe-area aware, gesture sentuhan halus (*touch-pan-x*), haptic feedback (audio chime), prompt panduan *Add to Home Screen* Safari iOS. |
| **Tablet / iPad** | Layout adaptif matriks 26–52 minggu, split-view stats yang nyaman dengan layar horizontal. |
| **Desktop / Laptop** | Keyboard shortcut super cepat (`N` untuk habit baru, `1–9` toggle hari ini, `Shift+Klik` detail), floating quick legend. |
| **Offline Mode** | Service Worker caching penuh — tetap bisa mencatat kebiasaan saat di pesawat atau tanpa sinyal, auto-sync saat online. |

---

## 🤝 Model Keberlanjutan (Tanpa Iklan)

Aplikasi **tidak akan pernah** memasang banner iklan atau mengunci fitur dasar di balik paywall langganan bulanan.

Keberlanjutan server dan domain didukung melalui:
- **Tip Jar Komunitas Sukarela:** Tombol donasi apresiasi (*Saweria / Trakteer / Buy Me a Coffee / GitHub Sponsors*) di halaman profil/tentang aplikasi.
- **Open-Source Contribution:** Mendorong kolaborasi komunitas untuk perbaikan bug dan penambahan fitur.
