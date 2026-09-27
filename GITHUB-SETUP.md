# Push ke GitHub & Build APK dari HP (Termux) — Panduan Lengkap

Kamu tidak butuh laptop sama sekali. Semua langkah ini dijalankan di **Termux**.

## 1. Siapkan Termux
Buka Termux, jalankan:
```bash
pkg update -y && pkg upgrade -y
pkg install git -y
```

## 2. Atur Identitas Git (sekali saja)
```bash
git config --global user.name "Nama Kamu"
git config --global user.email "email_kamu@gmail.com"
```

## 3. Buat Repository di GitHub (lewat browser HP)
1. Buka https://github.com, login/daftar.
2. Klik **New repository**.
3. Nama repo: `lingkar-webview` (atau bebas), pilih **Public** atau **Private**, JANGAN centang "Add README" (biar tidak bentrok).
4. Klik **Create repository**. Salin URL repo, contoh: `https://github.com/USERNAME/lingkar-webview.git`

## 4. Buat Personal Access Token (PAT) — pengganti password
GitHub tidak lagi menerima password biasa untuk `git push` dari terminal.
1. Di GitHub: foto profil (kanan atas) > **Settings** > gulir ke bawah **Developer settings**.
2. **Personal access tokens** > **Tokens (classic)** > **Generate new token (classic)**.
3. Centang scope **repo**. Klik **Generate token**.
4. **Salin token ini sekarang juga** (hanya muncul sekali) dan simpan di catatan aman.

## 5. Pindahkan Project ke Termux
Kalau project ini kamu unduh/copy ke HP (misal via Acode atau folder Download), pindahkan ke home Termux:
```bash
termux-setup-storage   # sekali saja, izinkan akses penyimpanan
cp -r /sdcard/Download/lingkar-webview ~/lingkar-webview
cd ~/lingkar-webview
```

## 6. Push Pertama Kali
```bash
git init
git add .
git commit -m "Initial commit: Lingkar app"
git branch -M main
git remote add origin https://github.com/USERNAME/lingkar-webview.git
git push -u origin main
```
Saat diminta **username**, isi username GitHub kamu.
Saat diminta **password**, tempel **Personal Access Token** dari langkah 4 (bukan password akun).

## 7. GitHub Actions Otomatis Build APK
Begitu push berhasil, buka repo kamu di browser > tab **Actions**.
Kamu akan lihat workflow **Build APK** berjalan otomatis (± 3-6 menit). Ini akan:
1. Install Node.js & Java di server GitHub (gratis).
2. Jalankan `npx nitron build` untuk membuat file `.apk`.
3. Mengunggah APK sebagai **artifact** yang bisa diunduh.
4. Membuat **Release** otomatis berisi file APK, siap diunduh kapan saja.

## 8. Unduh APK ke HP
- Cara 1: Repo > tab **Actions** > klik run terakhir yang sukses (centang hijau) > scroll ke bawah bagian **Artifacts** > unduh `lingkar-apk.zip`, ekstrak, dapat file `.apk`.
- Cara 2 (lebih gampang): Repo > tab **Releases** (di sisi kanan halaman utama repo) > unduh file `.apk` langsung.

## 9. Install APK di HP
1. Buka file `.apk` yang sudah diunduh lewat File Manager HP.
2. Kalau muncul peringatan "Install dari sumber tidak dikenal", izinkan sementara khusus untuk file ini.
3. Tekan **Install**.

## 10. Update Aplikasi Selanjutnya
Setiap kali kamu edit kode di Acode, cukup ulangi dari Termux:
```bash
cd ~/lingkar-webview
git add .
git commit -m "Update: <jelaskan perubahan>"
git push
```
GitHub Actions otomatis build ulang APK versi terbaru. Tinggal unduh lagi dari tab Actions/Releases.

## Troubleshooting Singkat
- **`git push` minta password terus ditolak** → pastikan kamu pakai Personal Access Token, bukan password akun biasa.
- **Build gagal di Actions** → buka tab Actions > klik run yang gagal (tanda silang merah) > baca log error, biasanya karena `app.js` (config Nitron di root) ada typo atau paket belum terinstall dengan benar.
- **APK terinstall tapi layar putih/blank** → cek `www/js/supabase.js`, pastikan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` sudah diisi benar (lihat `SUPABASE-SETUP.md`).
