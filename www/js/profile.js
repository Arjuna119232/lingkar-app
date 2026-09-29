/* ===== profile.js ===== */
const Profile = {
  async init() {
    App.init({ header: false, nav: false, requireAuth: true });
    const user = await DB.getUser();
    if (!user) return;
    const profile = await DB.getProfile(user.id);
    this.render(profile);
    this.loadStats(user.id);
    this.loadGrid(user.id);
    document.getElementById("btn-logout").addEventListener("click", () => App.logout());
    document.querySelectorAll(".tabs button").forEach(b =>
      b.addEventListener("click", () => this.switchTab(b, user.id)));
  },

  render(p) {
    document.getElementById("p-avatar").src = p.avatar_url || "assets/logo.svg";
    document.getElementById("p-username").textContent = "@" + p.username;
    document.getElementById("p-bio").textContent = p.bio || "Belum ada bio.";
  },

  async loadStats(userId) {
    const [{ count: posts }, circles, { count: friends }] = await Promise.all([
      sb.from("moments").select("id", { count: "exact", head: true }).eq("user_id", userId),
      DB.myCircles(userId).catch(() => []),
      sb.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId)
    ]);
    document.getElementById("stat-posts").textContent = posts ?? 0;
    document.getElementById("stat-circles").textContent = circles.length;
    document.getElementById("stat-friends").textContent = friends ?? 0;
  },

  async loadGrid(userId, tab = "posts") {
    const grid = document.getElementById("profile-grid");
    grid.innerHTML = Array(6).fill('<div class="cell skeleton"></div>').join("");
    let rows = [];
    if (tab === "posts") {
      const { data } = await sb.from("moments").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      rows = data || [];
    } else if (tab === "circles") {
      const circles = await DB.myCircles(userId).catch(() => []);
      grid.innerHTML = circles.length
        ? circles.map(c => `<a href="circle-detail.html?id=${c.circles.id}" class="cell" style="display:flex;align-items:center;justify-content:center;font-size:11px;text-align:center;padding:4px">${Utils.escapeHtml(c.circles.name)}</a>`).join("")
        : `<div class="empty-state" style="grid-column:1/-1"><i class="fa-regular fa-circle"></i><p>Belum join lingkaran manapun.</p></div>`;
      return;
    } else {
      const { data } = await sb.from("reactions").select("moments(*)").eq("user_id", userId);
      rows = (data || []).map(d => d.moments).filter(Boolean);
    }
    grid.innerHTML = rows.length
      ? rows.map(m => `<a href="moment-detail.html?id=${m.id}" class="cell">${m.media_type === "video" ? `<video src="${m.media_url}" muted></video>` : `<img src="${m.media_url}">`}</a>`).join("")
      : `<div class="empty-state" style="grid-column:1/-1"><i class="fa-regular fa-image"></i><p>Belum ada postingan.</p></div>`;
  },

  switchTab(btn, userId) {
    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    this.loadGrid(userId, btn.dataset.tab);
  }
};

const EditProfile = {
  async init() {
    App.init({ header: false, nav: false, requireAuth: true });
    this.user = await DB.getUser();
    this.profile = await DB.getProfile(this.user.id);
    const f = document.getElementById("edit-form");
    f.username.value = this.profile.username || "";
    f.full_name.value = this.profile.full_name || "";
    f.bio.value = this.profile.bio || "";
    if (this.profile.birth_date) f.birth_date.value = this.profile.birth_date;
    f.gender.value = this.profile.gender || "";
    document.getElementById("e-avatar").src = this.profile.avatar_url || "assets/logo.svg";
    document.getElementById("avatar-input").addEventListener("change", e => this.previewAvatar(e.target.files[0]));
    f.addEventListener("submit", e => this.save(e));
  },
  previewAvatar(file) {
    if (!file) return;
    this._avatarFile = file;
    document.getElementById("e-avatar").src = URL.createObjectURL(file);
  },
  async save(e) {
    e.preventDefault();
    const f = e.target;
    const btn = document.getElementById("btn-save");
    Utils.setLoading(btn, true);
    try {
      let avatar_url = this.profile.avatar_url;
      if (this._avatarFile) avatar_url = await DB.uploadMedia(this._avatarFile, this.user.id);
      await DB.updateProfile(this.user.id, {
        username: f.username.value.trim(),
        full_name: f.full_name.value.trim(),
        bio: f.bio.value.trim(),
        birth_date: f.birth_date.value || null,
        gender: f.gender.value || null,
        avatar_url
      });
      Utils.toast("Profil diperbarui");
      setTimeout(() => location.href = "profile.html", 700);
    } catch (err) {
      Utils.toast("Gagal simpan: " + err.message);
    }
    Utils.setLoading(btn, false, "Simpan");
  }
};
