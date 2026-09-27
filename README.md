# Lingkar
**"Ruang kecil untuk teman terdekat"**

Aplikasi sosial privat untuk berbagi momen foto/video singkat ke lingkaran teman terdekat — tanpa algoritma, tanpa like publik.

## Tech Stack
- HTML5 + CSS3 + JavaScript vanilla (tanpa framework)
- [Supabase](https://supabase.com) — auth, database, storage, realtime
- [Nitron](https://github.com/ALightbolt4G/nitron) — bundle HTML/CSS/JS jadi APK Android tanpa Android Studio
- GitHub Actions — build APK otomatis di cloud
- Font Awesome, Google Fonts (Inter), Chart.js — via CDN

## Struktur Folder
```
lingkar-webview/
├── www/                  # seluruh source aplikasi (HTML, CSS, JS, aset)
├── app.js                # konfigurasi build APK (dibaca oleh Nitron, WAJIB di root)
├── package.json
├── .github/workflows/    # otomasi build APK di GitHub Actions
├── SUPABASE-SETUP.md     # panduan setup backend
└── GITHUB-SETUP.md       # panduan push dari Termux & ambil APK
```

## Cara Kerja Singkat
1. Kamu isi kredensial Supabase di `www/js/supabase.js` (lihat `SUPABASE-SETUP.md`).
2. Push project ini ke GitHub lewat Termux (lihat `GITHUB-SETUP.md`).
3. GitHub Actions otomatis menjalankan Nitron untuk build APK tiap kali kamu push ke branch `main`.
4. APK bisa diunduh dari tab **Actions** (artifact) atau dari tab **Releases** repo kamu.

## Status Implementasi
Semua 27 halaman yang diminta sudah dibuat dan terhubung satu sama lain (navigasi, auth, feed, upload, lingkaran, profil, notifikasi, pengaturan, halaman statis). Beberapa hal disederhanakan supaya kamu bisa langsung jalan dulu, dan bisa dikembangkan lagi:
- Reaksi emoji disederhanakan jadi 1 tombol suka (❤️) dulu — tabel `reactions` sudah mendukung emoji apa saja kalau mau ditambah 😂/😮 di UI.
- "Masuk dengan Google" masih tombol placeholder (belum aktif), sesuai permintaan awal.
- Notifikasi realtime (push) belum ada — tabel `notifications` sudah ada, tinggal diisi lewat Supabase Function/Trigger kalau mau diaktifkan.
- Ikon & splash dibuat sebagai placeholder sederhana (lingkaran bertingkat, sesuai konsep app) — ganti `www/assets/icon.png` & `splash.png` kapan saja dengan desain final kamu.

## Lisensi
Proyek pribadi — sesuaikan sendiri sebelum dipublikasikan.
