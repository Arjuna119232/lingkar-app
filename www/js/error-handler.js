/* ===== error-handler.js =====
   Global error handler untuk Lingkar.
   Catch semua error yang tidak ter-handle + offline detector.
   Dikembangkan oleh Arjuna Mahendra.
*/

(function() {
  'use strict';

  // ===== 1. GLOBAL ERROR HANDLER =====
  window.addEventListener('error', function(event) {
    console.error('❌ Global error:', event.error || event.message);
    showFriendlyError(event.error || event.message);
  });

  // ===== 2. UNHANDLED PROMISE REJECTION =====
  window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled promise:', event.reason);
    showFriendlyError(event.reason);
  });

  // ===== 3. FUNGSI TAMPILKAN ERROR =====
  function showFriendlyError(error) {
    let message = 'Terjadi kesalahan. Coba lagi ya.';

    if (!error) return;

    const msg = (typeof error === 'string') ? error : (error.message || '');

    // Terjemahkan error umum
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      message = '📡 Koneksi internet bermasalah. Cek koneksi kamu.';
    } else if (msg.includes('JWT') || msg.includes('token')) {
      message = '🔐 Sesi kamu habis. Coba login ulang.';
    } else if (msg.includes('permission denied')) {
      message = '🚫 Kamu tidak punya akses ke fitur ini.';
    } else if (msg.includes('not found') || msg.includes('tidak ditemukan')) {
      message = '🔍 Data tidak ditemukan.';
    } else if (msg.includes('timeout')) {
      message = '⏱️ Koneksi lambat. Coba lagi.';
    } else if (msg.includes('quota')) {
      message = '💾 Penyimpanan penuh.';
    } else if (msg.includes('is not a function')) {
      message = '⚙️ Aplikasi perlu di-refresh.';
      console.error('Developer error:', msg);
    }

    // Tampilkan pakai Utils.toast kalau ada
    if (typeof Utils !== 'undefined' && Utils.toast) {
      Utils.toast(message, 'error', 4000);
    } else {
      // Fallback: alert
      console.warn('Utils belum siap:', message);
    }
  }

  // ===== 4. OFFLINE DETECTOR =====
  function updateOnlineStatus() {
    if (!navigator.onLine) {
      if (typeof Utils !== 'undefined' && Utils.toast) {
        Utils.toast('📡 Kamu sedang offline', 'error', 5000);
      }
    }
  }

  window.addEventListener('online', function() {
    if (typeof Utils !== 'undefined' && Utils.toast) {
      Utils.toast('✅ Kembali online', 'success', 2000);
    }
  });

  window.addEventListener('offline', updateOnlineStatus);

  // Cek saat load
  if (!navigator.onLine) {
    setTimeout(updateOnlineStatus, 1000);
  }

  console.log('%c Lingkar Error Handler ', 
    "background: #ff3b30; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;");
})();
