/* ===== moment-debug.js ===== */
const MomentDetail = {
  async init() {
    try {
      console.log('[1] Mulai init');
      App.init({ nav: false, requireAuth: true });
      console.log('[2] App.init OK');

      this.user = await DB.getUser();
      console.log('[3] User:', this.user ? this.user.email : 'NULL');
      if (!this.user) throw new Error('User null');

      this.id = Utils.qs("id");
      console.log('[4] ID:', this.id);
      if (!this.id) throw new Error('ID null');

      const { data: m, error } = await sb
        .from("moments")
        .select("*, profiles(username, avatar_url)")
        .eq("id", this.id)
        .single();

      if (error) throw new Error('Query error: ' + error.message);
      if (!m) throw new Error('Momen tidak ditemukan');

      console.log('[5] Momen loaded:', m.id);
      this.moment = m;
      this.isOwner = (m.user_id === this.user.id);

      // Hitung like
      const { data: allReacts } = await sb
        .from("reactions")
        .select("id")
        .eq("moment_id", this.id);
      this.likeCount = (allReacts || []).length;
      this.isLiked = false;
      console.log('[6] Like count:', this.likeCount);

      await this.render();
      console.log('[7] Render OK');

      await this.loadComments();
      console.log('[8] Comments OK');
    } catch (e) {
      console.error('❌ ERROR:', e.message);
      // Tampilkan error di layar
      document.getElementById("moment-wrap").innerHTML = `
        <a href="javascript:history.back()" class="text-dim">
          <i class="fa-solid fa-arrow-left"></i> Kembali
        </a>
        <div style="background:#1a1a1a;border:1px solid #ff3b30;border-radius:12px;padding:16px;margin-top:16px;color:#ff3b30;font-family:monospace;font-size:12px">
          <div style="font-weight:bold;margin-bottom:8px">❌ ERROR:</div>
          <div style="word-break:break-word;color:#fff">${Utils.escapeHtml(e.message)}</div>
          <div style="margin-top:12px;color:#888;font-size:11px">Stack:</div>
          <div style="color:#888;font-size:11px;word-break:break-word">${Utils.escapeHtml(e.stack || '')}</div>
        </div>`;
    }
  },

  async render() {
    const m = this.moment;

    document.getElementById("m-media").innerHTML = m.media_type === "video"
      ? `<video src="${m.media_url}" controls autoplay muted playsinline></video>`
      : `<img src="${m.media_url}">`;

    document.getElementById("m-avatar").src = (m.profiles && m.profiles.avatar_url) || "assets/logo.svg";
    document.getElementById("m-username").textContent = (m.profiles && m.profiles.username) || "unknown";
    document.getElementById("m-time").textContent = Utils.timeAgo(m.created_at);
    document.getElementById("m-caption").textContent = m.caption || "";

    // Tombol edit + hapus kalau owner
    if (this.isOwner) {
      const btnEdit = document.getElementById("btn-edit-caption");
      const btnDelete = document.getElementById("btn-delete");
      if (btnEdit) {
        btnEdit.style.display = "flex";
        btnEdit.onclick = () => this.showEditModal();
      }
      if (btnDelete) {
        btnDelete.style.display = "flex";
        btnDelete.onclick = () => this.showDeleteModal();
      }

      // Bind modal edit
      const btnCancelEdit = document.getElementById("btn-cancel-edit");
      const btnSaveEdit = document.getElementById("btn-save-edit");
      const inputEdit = document.getElementById("edit-caption-input");
      const countEdit = document.getElementById("edit-caption-count");

      if (btnCancelEdit) btnCancelEdit.onclick = () => this.hideEditModal();
      if (btnSaveEdit) btnSaveEdit.onclick = () => this.saveEditCaption();
      if (inputEdit && countEdit) {
        inputEdit.oninput = () => {
          countEdit.textContent = inputEdit.value.length;
        };
      }
    }

    // Event: modal
    document.getElementById("btn-cancel-delete").onclick = () => this.hideDeleteModal();
    document.getElementById("btn-confirm-delete").onclick = () => this.deleteMoment();

    // Event: like
    document.getElementById("btn-like").onclick = () => this.toggleLike();
    document.getElementById("btn-share").onclick = () => this.share();
    document.getElementById("btn-save").onclick = () => this.saveToGallery();
  },

  async toggleLike() {
    Utils.toast("Fitur like segera hadir", "info");
  },

  async share() {
    Utils.toast("Fitur share segera hadir", "info");
  },

  async saveToGallery() {
    Utils.haptic("medium");
    const m = this.moment;
    const filename = `lingkar_${this.id}.${m.media_type === "video" ? "mp4" : "jpg"}`;
    await Utils.downloadMedia(m.media_url, filename, m.media_type);
  },

  showDeleteModal() {
    Utils.haptic("medium");
    document.getElementById("delete-modal").classList.add("show");
  },

  hideDeleteModal() {
    document.getElementById("delete-modal").classList.remove("show");
  },

  async deleteMoment() {
    const btn = document.getElementById("btn-confirm-delete");
    btn.disabled = true;
    btn.innerHTML = 'Menghapus...';
    try {
      await sb.from("reactions").delete().eq("moment_id", this.id);
      await sb.from("comments").delete().eq("moment_id", this.id);
      await sb.from("moment_visibility").delete().eq("moment_id", this.id);
      await sb.from("moments").delete().eq("id", this.id).eq("user_id", this.user.id);
      Utils.toast("✅ Momen dihapus", "success");
      setTimeout(() => location.href = "feed.html", 800);
    } catch (e) {
      Utils.toast("❌ Gagal: " + e.message, "error");
      btn.disabled = false;
      btn.innerHTML = 'Hapus';
      this.hideDeleteModal();
    }
  },

  async loadComments() {
    const { data } = await sb
      .from("comments")
      .select("*, profiles(username, avatar_url)")
      .eq("moment_id", this.id)
      .order("created_at");

    const wrap = document.getElementById("comment-list");
    wrap.innerHTML = (data || []).length
      ? data.map(c => `
        <div class="list-row">
          <img class="avatar avatar-sm" src="${c.profiles.avatar_url || "assets/logo.svg"}">
          <div class="row-text">
            <div class="t1">${Utils.escapeHtml(c.profiles.username)} <span class="text-dim">- ${Utils.timeAgo(c.created_at)}</span></div>
            <div class="t2">${Utils.escapeHtml(c.text)}</div>
          </div>
        </div>`).join("")
      : `<p class="text-dim" style="font-size:13px;text-align:center;padding:20px 0">Belum ada komentar.</p>`;

    document.getElementById("comment-form").addEventListener("submit", e => this.postComment(e));
  },

  async postComment(e) {
    e.preventDefault();
    const input = e.target.text;
    const text = input.value.trim();
    if (!text) return;
    await sb.from("comments").insert({ moment_id: this.id, user_id: this.user.id, text });
    input.value = "";
    await this.loadComments();
  }
};
