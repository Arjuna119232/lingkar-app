/* ===== app.js (root) =====
   Konfigurasi build Nitron. File ini WAJIB ada di root project (bukan di dalam www/)
   supaya perintah `npm run build` / `npx nitron build` tahu cara membungkus aplikasi jadi APK.
   Dokumentasi: https://github.com/ALightbolt4G/nitron
*/
import { app } from 'nitron';

app.init({
  name: "Lingkar",
  packageId: "app.lingkar.mobile",
  version: "1.0.1",
  entry: "www/index.html",
  orientation: "portrait",
  statusBar: true,
  permissions: [
    "INTERNET",
    "CAMERA",
    "READ_EXTERNAL_STORAGE",
    "WRITE_EXTERNAL_STORAGE"
  ],
  icon: {
    src: "www/assets/icon.png",
    background: "#0F0F14"
  }
});
