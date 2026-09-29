/* ===== settings.js ===== */
const Settings = {
  async init() {
    App.init({ nav: false, requireAuth: true });
    const currentTheme = localStorage.getItem("lingkar_theme") || "dark";
    document.getElementById("theme-switch").checked = (currentTheme === "dark");
    document.getElementById("theme-switch").addEventListener("change", () => App.toggleTheme());
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
