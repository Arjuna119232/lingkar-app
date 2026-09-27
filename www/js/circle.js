/* ===== circle.js ===== */
const CircleList = {
  async init() {
    App.init({ nav: false, requireAuth: true });
    this.user = await DB.getUser();
    document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => this.tab(b)));
    await this.load("inner");
  },
  async tab(btn) {
    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    await this.load(btn.dataset.type);
  },
  async load(type) {
    const list = document.getElementById("circle-list");
    list.innerHTML = '<div class="skeleton" style="height:70px" class="mb-16"></div>';
    const rows = (await DB.myCircles(this.user.id).catch(() => [])).filter(c => c.circles.type === type);
    list.innerHTML = rows.length ? rows.map(c => `
      <a href="circle-detail.html?id=${c.circles.id}" class="card" style="display:flex;align-items:center;gap:12px">
        <img class="avatar" src="${c.circles.avatar_url || "assets/logo.svg"}">
        <div style="flex:1">
          <div style="font-weight:600">${Utils.escapeHtml(c.circles.name)}</div>
          <div class="text-dim" style="font-size:12px">Peran: ${c.role}</div>
        </div>
        <span class="badge badge-${type}">${type}</span>
      </a>`).join("") : `<div class="empty-state"><i class="fa-regular fa-circle"></i><p>Belum ada lingkaran ${type}.</p></div>`;
  }
};

const CircleCreate = {
  async init() {
    App.init({ nav: false, requireAuth: true });
    this.user = await DB.getUser();
    document.getElementById("desc").addEventListener("input", e =>
      document.getElementById("desc-count").textContent = `${e.target.value.length}/200`);
    document.getElementById("create-form").addEventListener("submit", e => this.submit(e));
  },
  async submit(e) {
    e.preventDefault();
    const f = e.target;
    const type = f.type.value;
    const btn = document.getElementById("btn-create");
    Utils.setLoading(btn, true);
    try {
      const circle = await DB.createCircle({
        name: f.name.value.trim(),
        description: f.desc.value.trim(),
        type,
        invite_code: Utils.genInviteCode(),
        owner_id: this.user.id,
        is_public: type === "community" ? f.is_public.checked : false
      });
      await sb.from("circle_members").insert({ circle_id: circle.id, user_id: this.user.id, role: "owner" });
      Utils.toast("Lingkaran dibuat! Kode: " + circle.invite_code);
      setTimeout(() => location.href = "circle-detail.html?id=" + circle.id, 900);
    } catch (err) {
      Utils.toast("Gagal membuat lingkaran: " + err.message);
    }
    Utils.setLoading(btn, false, "Buat");
  }
};

const CircleJoin = {
  async init() {
    App.init({ nav: false, requireAuth: true });
    this.user = await DB.getUser();
    document.getElementById("join-form").addEventListener("submit", e => this.submit(e));
  },
  async submit(e) {
    e.preventDefault();
    const code = e.target.code.value.trim().toUpperCase();
    const btn = document.getElementById("btn-join");
    Utils.setLoading(btn, true);
    try {
      const circle = await DB.joinCircleByCode(code, this.user.id);
      Utils.toast("Berhasil bergabung ke " + circle.name);
      setTimeout(() => location.href = "circle-detail.html?id=" + circle.id, 800);
    } catch (err) {
      Utils.toast(err.message);
    }
    Utils.setLoading(btn, false, "Gabung");
  }
};

const CircleDetail = {
  async init() {
    App.init({ nav: false, requireAuth: true });
    this.user = await DB.getUser();
    this.id = Utils.qs("id");
    const { data: circle } = await sb.from("circles").select("*").eq("id", this.id).single();
    this.circle = circle;
    const { count: memberCount } = await sb.from("circle_members").select("id", { count: "exact", head: true }).eq("circle_id", this.id);
    const { count: momentCount } = await sb.from("moment_visibility").select("id", { count: "exact", head: true }).eq("circle_id", this.id);
    document.getElementById("c-name").textContent = circle.name;
    document.getElementById("c-badge").textContent = circle.type;
    document.getElementById("c-badge").className = "badge badge-" + circle.type;
    document.getElementById("c-desc").textContent = circle.description || "";
    document.getElementById("c-avatar").src = circle.avatar_url || "assets/logo.svg";
    document.getElementById("c-stats").textContent = `${memberCount} member - ${momentCount} momen`;
    const isOwner = circle.owner_id === this.user.id;
    document.getElementById("btn-owner-settings").classList.toggle("hidden", !isOwner);
    document.getElementById("btn-delete").classList.toggle("hidden", !isOwner);
    document.getElementById("btn-leave").classList.toggle("hidden", isOwner);
    document.getElementById("btn-leave").addEventListener("click", () => this.leave());
    document.getElementById("btn-delete").addEventListener("click", () => this.remove());
    await this.loadFeed();
  },
  async loadFeed() {
    const wrap = document.getElementById("circle-feed");
    wrap.innerHTML = Array(2).fill('<div class="card skeleton" style="height:180px"></div>').join("");
    const { data, error } = await sb
      .from("moment_visibility")
      .select("moments(*, profiles(username, avatar_url))")
      .eq("circle_id", this.id)
      .order("created_at", { ascending: false, foreignTable: "moments" })
      .limit(20);
    if (error || !data || data.length === 0) {
      wrap.innerHTML = `<div class="empty-state"><i class="fa-regular fa-images"></i><p>Belum ada momen di lingkaran ini.</p></div>`;
      return;
    }
    wrap.innerHTML = data.filter(d => d.moments).map(d => {
      const m = d.moments;
      return `
      <div class="card moment-card">
        <div class="card-top">
          <img class="avatar" src="${m.profiles.avatar_url || "assets/logo.svg"}">
          <div class="who">
            <div class="uname">${Utils.escapeHtml(m.profiles.username)}</div>
            <div class="time">${Utils.timeAgo(m.created_at)}</div>
          </div>
        </div>
        <a href="moment-detail.html?id=${m.id}">
          <div class="moment-media">
            ${m.media_type === "video"
              ? `<video src="${m.media_url}" muted autoplay loop playsinline></video>`
              : `<img src="${m.media_url}">`}
          </div>
        </a>
        ${m.caption ? `<div class="moment-caption">${Utils.escapeHtml(m.caption)}</div>` : ""}
      </div>`;
    }).join("");
  },
  async leave() {
    if (!confirm("Keluar dari lingkaran ini?")) return;
    await sb.from("circle_members").delete().eq("circle_id", this.id).eq("user_id", this.user.id);
    location.href = "circle-list.html";
  },
  async remove() {
    if (!confirm("Hapus lingkaran ini secara permanen?")) return;
    await sb.from("circles").delete().eq("id", this.id);
    location.href = "circle-list.html";
  }
};

const CircleMembers = {
  async init() {
    App.init({ nav: false, requireAuth: true });
    this.id = Utils.qs("id");
    this.user = await DB.getUser();
    document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => this.tab(b)));
    await this.load("active");
  },
  async tab(btn) {
    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    await this.load(btn.dataset.status);
  },
  async load(status) {
    const { data } = await sb.from("circle_members").select("*, profiles(username, avatar_url)").eq("circle_id", this.id).eq("status", status);
    const list = document.getElementById("member-list");
    list.innerHTML = (data || []).length ? data.map(m => `
      <div class="list-row">
        <img class="avatar avatar-sm" src="${m.profiles.avatar_url || "assets/logo.svg"}">
        <div class="row-text">
          <div class="t1">${Utils.escapeHtml(m.profiles.username)}</div>
          <div class="t2">Bergabung ${Utils.timeAgo(m.joined_at)}</div>
        </div>
        <span class="badge badge-close">${m.role}</span>
      </div>`).join("") : `<div class="empty-state"><i class="fa-regular fa-user"></i><p>Tidak ada member di kategori ini.</p></div>`;
  }
};
