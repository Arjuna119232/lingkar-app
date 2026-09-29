/* ===== utils.js =====
   Helper functions untuk Lingkar.
   Dikembangkan oleh Arjuna Mahendra.
*/

const Utils = {
  /**
   * Ambil query string dari URL
   */
  qs(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },

  /**
   * Format tanggal ke "2 jam lalu" dll
   */
  timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "baru saja";
    if (seconds < 3600) return Math.floor(seconds / 60) + " menit lalu";
    if (seconds < 86400) return Math.floor(seconds / 3600) + " jam lalu";
    if (seconds < 604800) return Math.floor(seconds / 86400) + " hari lalu";

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  },

  /**
   * Escape HTML biar aman dari XSS
   */
  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Toast notification
   */
  toast(message, type = "info", duration = 3000) {
    let toast = document.getElementById("lingkar-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "lingkar-toast";
      toast.style.cssText = "position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(100px);background:#1a1a1a;color:#fff;padding:14px 24px;border-radius:12px;font-size:14px;z-index:99999;transition:transform 0.3s ease;border:1px solid #2a2a2a;max-width:90%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.4);";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    if (type === "success") toast.style.borderColor = "#34c759";
    else if (type === "error") toast.style.borderColor = "#ff3b30";
    else toast.style.borderColor = "#2a2a2a";

    setTimeout(() => toast.style.transform = "translateX(-50%) translateY(0)", 100);
    setTimeout(() => {
      toast.style.transform = "translateX(-50%) translateY(100px)";
    }, duration);
  },

  /**
   * Set loading state tombol
   */
  setLoading(btn, isLoading, textDefault = "Posting") {
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    } else {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> ' + textDefault;
    }
  },

  /**
   * Debounce
   */
  debounce(fn, delay = 300) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Haptic feedback (getar)
   */
  haptic(type = "light") {
    if (navigator.vibrate) {
      if (type === "light") navigator.vibrate(10);
      else if (type === "medium") navigator.vibrate(20);
      else if (type === "heavy") navigator.vibrate(50);
    }
  },

  /**
   * Download media ke galeri HP
   */
  async downloadMedia(url, filename = null, mediaType = "image") {
    try {
      Utils.toast("⏳ Menyimpan ke galeri...");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Gagal ambil file");
      const blob = await response.blob();

      if (!filename) {
        const ext = mediaType === "video" ? "mp4" : "jpg";
        filename = "lingkar_" + Date.now() + "." + ext;
      }

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], filename, { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Simpan Momen Lingkar" });
          Utils.toast("✅ Momen disimpan!", "success");
          return true;
        }
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      Utils.toast("✅ Momen disimpan ke Downloads", "success");
      return true;
    } catch (e) {
      console.warn("Download error:", e);
      Utils.toast("❌ Gagal simpan: " + e.message, "error");
      return false;
    }
  },

  /**
   * Format ukuran file
   */
  formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  },

  /**
   * Konfirmasi dialog
   */
  async confirm(message) {
    return window.confirm(message);
  },

  /**
   * Cek login — redirect kalau belum
   */
  async requireAuth() {
    const user = await DB.getUser();
    if (!user) {
      Utils.toast("Kamu belum login", "error");
      setTimeout(() => location.href = "login.html", 800);
      return false;
    }
    return true;
  }
};

console.log("%c Lingkar Utils ", 
  "background: #ff9500; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;");
