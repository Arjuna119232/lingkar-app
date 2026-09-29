/* ===== search.js ===== */
const Search = {
  tabKind: "all",
  async init() {
    App.init({ nav: false, requireAuth: true });
    document.getElementById("search-input").addEventListener("input", Utils.debounce(e => this.run(e.target.value), 350));
    document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => {
      document.querySelectorAll(".tabs button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      this.tabKind = b.dataset.kind;
      this.run(document.getElementById("search-input").value);
    }));
  },
  async run(q) {
    const wrap = document.getElementById("search-results");
    if (!q.trim()) { wrap.innerHTML = ""; return; }
    wrap.innerHTML = '<div class="skeleton" style="height:50px"></div>';
    const results = [];
    if (this.tabKind === "all" || this.tabKind === "user") {
      const { data } = await sb.from("profiles").select("*").ilike("username", `%${q}%`).limit(10);
      (data || []).forEach(u => results.push({ kind: "user", data: u }));
    }
    if (this.tabKind === "all" || this.tabKind === "circle") {
      const { data } = await sb.from("circles").select("*").ilike("name", `%${q}%`).eq("is_public", true).limit(10);
      (data || []).forEach(c => results.push({ kind: "circle", data: c }));
    }
    wrap.innerHTML = results.length ? results.map(r => r.kind === "user" ? `
      <a href="user-profile.html?id=${r.data.id}" class="list-row">
        <img class="avatar avatar-sm" src="${r.data.avatar_url || "assets/logo.svg"}">
        <div class="row-text"><div class="t1">${Utils.escapeHtml(r.data.username)}</div></div>
      </a>` : `
      <a href="circle-detail.html?id=${r.data.id}" class="list-row">
        <img class="avatar avatar-sm" src="${r.data.avatar_url || "assets/logo.svg"}">
        <div class="row-text"><div class="t1">${Utils.escapeHtml(r.data.name)}</div><div class="t2">Komunitas publik</div></div>
      </a>`).join("") : `<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>Tidak ada hasil untuk "${Utils.escapeHtml(q)}"</p></div>`;
  }
};
