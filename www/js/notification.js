/* ===== notification.js ===== */
const Notifications = {
  filter: "all",
  async init() {
    App.init({ nav: true, active: "notifications.html", requireAuth: true });
    this.user = await DB.getUser();
    document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => this.tab(b)));
    document.getElementById("btn-mark-all").addEventListener("click", () => this.markAll());
    await this.load();
  },
  tab(btn) {
    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    this.filter = btn.dataset.filter;
    this.render();
  },
  async load() {
    this.rows = await DB.notifications(this.user.id).catch(() => []);
    this.render();
  },
  render() {
    const rows = this.filter === "unread" ? this.rows.filter(r => !r.is_read) : this.rows;
    const icons = { like: "heart", comment: "comment", follow: "user-plus", join: "circle-nodes" };
    document.getElementById("notif-list").innerHTML = rows.length ? rows.map(r => `
      <div class="list-row">
        <i class="leading fa-solid fa-${icons[r.type] || "bell"}"></i>
        <div class="row-text">
          <div class="t1">${Utils.escapeHtml(r.title)}</div>
          <div class="t2">${Utils.escapeHtml(r.body || "")} - ${Utils.timeAgo(r.created_at)}</div>
        </div>
        ${!r.is_read ? '<span class="badge-dot" style="position:static"></span>' : ""}
      </div>`).join("") : `<div class="empty-state"><i class="fa-regular fa-bell"></i><p>Tidak ada notifikasi.</p></div>`;
  },
  async markAll() {
    await DB.markAllRead(this.user.id);
    await this.load();
    Utils.toast("Semua ditandai sudah dibaca");
  }
};
