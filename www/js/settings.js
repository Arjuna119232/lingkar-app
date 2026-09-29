/* ===== settings.js ===== */
const Settings = {
  async init() {
    App.init({ nav: false, requireAuth: true });
    // Setup tema dropdown (terang / gelap / auto)
    const currentTheme = localStorage.getItem("lingkar_theme") || "auto";
    const themeSelect = document.getElementById("theme-select");
    const themeLabel = document.getElementById("theme-label");
    const themeLabels = { light: "Terang", dark: "Gelap", auto: "Mengikuti Perangkat" };
    if (themeSelect) {
      themeSelect.value = currentTheme;
      if (themeLabel) themeLabel.textContent = themeLabels[currentTheme] || "Auto";
      themeSelect.addEventListener("change", () => {
        App.setTheme(themeSelect.value);
        if (themeLabel) themeLabel.textContent = themeLabels[themeSelect.value] || "Auto";
      });
    }
    // Bind modal handlers
    document.getElementById("btn-cancel-confirm").addEventListener("click", () => this.hideConfirm());
    document.getElementById("btn-confirm-action").addEventListener("click", () => this.executePending());
    
    // Logout dengan konfirmasi
    document.getElementById("btn-logout").addEventListener("click", () => this.showConfirm(
      "Keluar dari Lingkar?",
      "Kamu akan keluar dari akun ini. Bisa masuk lagi kapan saja.",
      "logout"
    ));
    
    // Hapus akun dengan konfirmasi
    const btnDelete = document.getElementById("btn-delete-account");
    if (btnDelete) {
      btnDelete.addEventListener("click", () => this.showConfirm(
        "Hapus akun permanen?",
        "Semua momen, lingkaran, dan data kamu akan dihapus. Tindakan ini tidak bisa dibatalkan.",
        "delete-account"
      ));
    }
    document.getElementById("btn-delete-account")?.addEventListener("click", () => this.deleteAccount());
  },
  pendingAction: null,

  showConfirm(title, message, action) {
    this.pendingAction = action;
    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-message").textContent = message;
    document.getElementById("confirm-modal").classList.add("show");
  },

  hideConfirm() {
    this.pendingAction = null;
    document.getElementById("confirm-modal").classList.remove("show");
  },

  async executePending() {
    const action = this.pendingAction;
    this.hideConfirm();
    if (action === "logout") {
      try {
        await sb.auth.signOut();
        localStorage.clear();
        Utils.toast("✅ Berhasil logout", "success");
        setTimeout(() => location.href = "login.html", 600);
      } catch (e) {
        Utils.toast("Gagal logout: " + e.message, "error");
      }
    } else if (action === "delete-account") {
      Utils.toast("Hubungi dukungan untuk hapus akun");
    }
  },

  async deleteAccount() {
    if (!confirm("Yakin ingin menghapus akun kamu? Tindakan ini tidak bisa dibatalkan.")) return;
    Utils.toast("Hubungi tim dukungan untuk penghapusan akun (lihat contact.html)");
  }
};

const NotifSettings = {
  keys: ["notif_inner", "notif_close", "notif_community", "notif_comment", "notif_reaction", "notif_join", "notif_follow", "notif_message"],
  init() {
    App.init({ nav: false, requireAuth: true });
    this.keys.forEach(k => {
      const el = document.getElementById(k);
      if (!el) return;
      el.checked = localStorage.getItem(k) !== "0";
    });
    document.getElementById("notif-settings-form").addEventListener("submit", e => {
      e.preventDefault();
      this.keys.forEach(k => {
        const el = document.getElementById(k);
        if (el) localStorage.setItem(k, el.checked ? "1" : "0");
      });
      Utils.toast("Pengaturan notifikasi disimpan");
    });
  }
};

const ContactForm = {
  init() {
    App.init({ nav: false });
    document.getElementById("contact-form").addEventListener("submit", e => {
      e.preventDefault();
      Utils.toast("Pesan terkirim, terima kasih!");
      e.target.reset();
    });
  }
};

const FAQ = {
  init() {
    App.init({ nav: false });
    document.querySelectorAll(".accordion-item .q").forEach(q => {
      q.addEventListener("click", () => q.parentElement.classList.toggle("open"));
    });
  }
};
