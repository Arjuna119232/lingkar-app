# Changelog

## [1.0.1] - 2026-09-27 (Audit rilis)
### Diperbaiki
- **Bug kritis:** konfigurasi build Nitron dipindah dari `nitron.config.json` (format salah, tidak dikenali Nitron) ke `app.js` di root project sesuai format resmi Nitron v1.3+. Ini kemungkinan besar penyebab ukuran/hasil APK tidak normal sebelumnya.
- `package.json` ditambahkan `"type": "module"` (wajib supaya `import` di `app.js` tidak error) dan versi dependency `nitron` diperbarui ke `^1.3.1`.
- **Bug layout:** 16 halaman (settings, edit-profile, semua halaman lingkaran, detail momen, pencarian, halaman statis, dll) kehilangan `no-header` sehingga punya spasi kosong tidak normal di bagian atas. Sudah diperbaiki di semua halaman terkait.
- **Bug crash:** `notification-settings.html` memanggil fungsi yang butuh cek sesi login tapi belum memuat pustaka Supabase — ditambahkan.
- **Bug query:** `DB.feed()` di `supabase.js` memakai opsi `referencedTable` (salah) alih-alih `foreignTable` (benar) saat mengurutkan hasil join — diperbaiki.
- **Fitur belum jalan:** halaman detail lingkaran (`circle-detail.html`) sebelumnya hanya menampilkan placeholder statis, sekarang benar-benar memuat momen milik lingkaran tersebut dari database.
### Ditambahkan
- `LICENSE` (MIT).

## [1.0.0] - 2026-09-27
### Ditambahkan
- Struktur awal aplikasi Lingkar (27 halaman HTML lengkap): splash, onboarding, auth (login/register/lupa password), feed, explore, upload, notifikasi, profil (sendiri & orang lain), edit profil, lingkaran (list/detail/buat/gabung/member), detail momen, pencarian, pengaturan (umum & notifikasi), halaman statis (privasi, syarat, tentang, bantuan, kontak, 404).
- Integrasi Supabase: auth, database (profiles, circles, circle_members, moments, moment_visibility, comments, reactions, notifications, follows), storage untuk media.
- Konfigurasi build APK via Nitron (`app.js` di root project, sesuai format resmi Nitron v1.3+).
- GitHub Actions workflow otomatis build APK setiap push ke `main`, dengan artifact & release otomatis.
- Dokumentasi lengkap: `README.md`, `SUPABASE-SETUP.md`, `GITHUB-SETUP.md`.
- Aset dasar: logo, ikon, splash screen, ilustrasi onboarding (SVG + PNG).

### Diketahui belum lengkap (rencana pengembangan lanjutan)
- Notifikasi realtime/push belum aktif (baru tersimpan di database).
- Login dengan Google masih placeholder.
- Reaksi UI baru mendukung 1 emoji (❤️); tabel sudah siap untuk emoji lain.
