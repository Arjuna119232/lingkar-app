/* ===== app.js =====
   Inisialisasi tiap halaman: render header + bottom navbar, tema, cek auth.
   Catatan: header/navbar dirender lewat template JS (bukan fetch file HTML terpisah),
   karena fetch() ke file lokal sering diblokir CORS di sebagian WebView Android.
   File components/*.html tetap disediakan sebagai referensi/dokumentasi struktur.
*/
const App = {
  currentPage: location.pathname.split("/").pop() || "index.html",

  init({ header = true, nav = true, active = "", requireAuth = false } = {}) {
    this.applyTheme();
    if (header) this.renderHeader();
    if (nav) this.renderNav(active);
    if (requireAuth) Utils.requireAuth();
  },

  applyTheme() {
    const theme = localStorage.getItem("lingkar_theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
  },

  toggleTheme() {
    const cur = localStorage.getItem("lingkar_theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    localStorage.setItem("lingkar_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  },

  renderHeader(opts = {}) {
    // Header atas dihapus sesuai desain baru: cukup buang elemen penampungnya.
    const mount = document.getElementById("app-header");
    if (mount) mount.remove();
  },

  renderNav(active) {
    const mount = document.getElementById("bottom-nav");
    if (!mount) return;
    const item = (page, icon, label) =>
      `<a href="${page}" class="${active === page ? "active" : ""}"><i class="fa-solid fa-${icon}"></i><span>${label}</span></a>`;
    mount.outerHTML = `
      <nav class="bottom-nav" id="bottom-nav">
        ${item("feed.html", "house", "Feed")}
        ${item("explore.html", "compass", "Jelajah")}
        <a href="upload.html" class="nav-upload"><i class="fa-solid fa-plus"></i></a>
        ${item("notifications.html", "bell", "Notif")}
        ${item("profile.html", "user", "Profil")}
      </nav>`;
  },

  async logout() {
    await sb.auth.signOut();
    location.href = "login.html";
  }
};
