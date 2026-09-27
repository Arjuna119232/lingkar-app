/* ===== feed.js =====
   Handle feed momen dengan tombol download.
   Dikembangkan oleh Arjuna Mahendra.
*/

const Feed = {
  filter: "all",
  offset: 0,
  loading: false,
  user: null,
  userReactions: new Set(),
  likeCounts: {},
  commentCounts: {},

  async init() {
    App.init({ active: "feed.html", requireAuth: true });
    this.user = await DB.getUser();
    if (!this.user) return;

    document.querySelectorAll(".tabs button").forEach(b =>
      b.addEventListener("click", () => this.setFilter(b.dataset.filter, b))
    );

    document.getElementById("feed-list").addEventListener("scroll",
      Utils.debounce(() => this.maybeLoadMore(), 200)
    );

    LocalStorage.cleanupOld(7).catch(e => console.warn("Cleanup error:", e));

    await this.load(true);
    await this.checkNotifDot();
  },

  setFilter(f, btn) {
    this.filter = f;
    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    this.load(true);
  },

  async load(reset = false) {
    if (this.loading) return;
    this.loading = true;

    if (reset) {
      this.offset = 0;
      document.getElementById("feed-list").innerHTML = this.skeleton();
    }

    try {
      const rows = await DB.feed(this.user.id, this.filter, {
        from: this.offset, to: this.offset + 19
      });

      if (reset) {
        await this.loadUserReactions(rows);
        await this.loadCounts(rows);
      }

      if (reset) document.getElementById("feed-list").innerHTML = "";

      if (rows.length === 0 && reset) {
        document.getElementById("feed-list").innerHTML = '<div class="empty-state"><i class="fa-regular fa-images"></i><p>Belum ada momen di sini.<br>Yuk mulai bagikan momen pertamamu!</p></div>';
      } else {
        document.getElementById("feed-list").insertAdjacentHTML("beforeend", rows.map(r => this.card(r)).join(""));
        this.bindActions();
        this.loadLocalMedia();
      }

      this.offset += 20;
    } catch (e) {
      Utils.toast("Gagal memuat feed: " + e.message, "error");
    }
    this.loading = false;
  },

  async loadUserReactions(rows) {
    try {
      const momentIds = rows.map(r => r.moments.id).filter(Boolean);
      if (momentIds.length === 0) { this.userReactions = new Set(); return; }

      const { data, error } = await sb.from("reactions").select("moment_id").eq("user_id", this.user.id).in("moment_id", momentIds);
      if (error) { this.userReactions = new Set(); return; }
      this.userReactions = new Set((data || []).map(r => r.moment_id));
    } catch (e) {
      this.userReactions = new Set();
    }
  },

  async loadCounts(rows) {
    try {
      const momentIds = rows.map(r => r.moments.id).filter(Boolean);
      if (momentIds.length === 0) { this.likeCounts = {}; this.commentCounts = {}; return; }

      const [reactionRes, commentRes] = await Promise.all([
        sb.from("reactions").select("moment_id").in("moment_id", momentIds),
        sb.from("comments").select("moment_id").in("moment_id", momentIds)
      ]);

      const likes = {};
      (reactionRes.data || []).forEach(r => { likes[r.moment_id] = (likes[r.moment_id] || 0) + 1; });

      const comments = {};
      (commentRes.data || []).forEach(c => { comments[c.moment_id] = (comments[c.moment_id] || 0) + 1; });

      this.likeCounts = likes;
      this.commentCounts = comments;
    } catch (e) {
      this.likeCounts = {};
      this.commentCounts = {};
    }
  },

  async loadLocalMedia() {
    const placeholders = document.querySelectorAll(".moment-media[data-local-id]");
    for (const el of placeholders) {
      const localId = el.dataset.localId;
      const mediaType = el.dataset.mediaType;
      try {
        const url = await LocalStorage.getFile(localId);
        if (url) {
          el.innerHTML = mediaType === "video"
            ? '<video src="' + url + '" muted autoplay loop playsinline></video>'
            : '<img src="' + url + '">';
          el.dataset.resolvedUrl = url;
        } else {
          el.innerHTML = '<div style="padding:20px;text-align:center;color:#888;font-size:12px">⚠️ File tidak ditemukan di HP</div>';
        }
      } catch (e) {
        console.warn("Gagal load media lokal:", localId, e);
      }
    }
  },

  maybeLoadMore() {
    const el = document.getElementById("feed-list");
    if (el.scrollTop + el.clientHeight > el.scrollHeight - 200) this.load(false);
  },

  skeleton() {
    return Array(3).fill('<div class="card"><div class="skeleton" style="height:220px"></div></div>').join("");
  },

  card(row) {
    const m = row.moments;
    const type = row.circles.type;
    const badgeClass = { inner: "badge-inner", close: "badge-close", community: "badge-community" }[type];
    const badgeLabel = { inner: "Inner", close: "Close", community: "Community" }[type];

    const isLiked = this.userReactions.has(m.id);
    const likeCount = this.likeCounts[m.id] || 0;
    const commentCount = this.commentCounts[m.id] || 0;
    const likeLabel = likeCount > 0 ? " (" + likeCount + ")" : "";
    const commentLabel = commentCount > 0 ? " (" + commentCount + ")" : "";

    let mediaHTML;
    if (m.is_local && m.local_id) {
      mediaHTML = '<div class="moment-media" data-local-id="' + m.local_id + '" data-media-type="' + m.media_type + '"><div class="skeleton" style="height:220px"></div></div>';
    } else {
      mediaHTML = '<div class="moment-media" data-resolved-url="' + m.media_url + '">' + (m.media_type === "video" ? '<video src="' + m.media_url + '" muted autoplay loop playsinline></video>' : '<img src="' + m.media_url + '">') + '</div>';
    }

    return '<div class="card moment-card slide-up" data-id="' + m.id + '">' +
      '<div class="card-top">' +
        '<img class="avatar" src="' + (m.profiles.avatar_url || "assets/logo.svg") + '">' +
        '<div class="who">' +
          '<div class="uname">' + Utils.escapeHtml(m.profiles.username) + '</div>' +
          '<div class="time">' + Utils.timeAgo(m.created_at) + '</div>' +
        '</div>' +
        '<span class="badge ' + badgeClass + '">' + badgeLabel + '</span>' +
      '</div>' +
      '<a href="moment-detail.html?id=' + m.id + '">' + mediaHTML + '</a>' +
      (m.caption ? '<div class="moment-caption">' + Utils.escapeHtml(m.caption) + '</div>' : '') +
      '<div class="moment-actions">' +
        '<span class="act react-btn ' + (isLiked ? "liked" : "") + '" data-id="' + m.id + '">' +
          '<i class="' + (isLiked ? "fa-solid" : "fa-regular") + ' fa-heart"></i>' +
          '<span>Suka</span><span class="like-count">' + likeLabel + '</span>' +
        '</span>' +
        '<a class="act" href="moment-detail.html?id=' + m.id + '">' +
          '<i class="fa-regular fa-comment"></i><span>Komentar</span><span class="comment-count">' + commentLabel + '</span>' +
        '</a>' +
        '<span class="act download-btn" data-moment-id="' + m.id + '" data-media-type="' + m.media_type + '" data-is-local="' + (m.is_local || false) + '" data-local-id="' + (m.local_id || "") + '" data-media-url="' + (m.media_url || "") + '">' +
          '<i class="fa-solid fa-download"></i> Simpan' +
        '</span>' +
      '</div>' +
    '</div>';
  },

  bindActions() {
    document.querySelectorAll(".react-btn").forEach(el => {
      el.onclick = async () => {
        Utils.haptic("light");
        const momentId = el.dataset.id;
        const wasLiked = el.classList.contains("liked");

        el.classList.toggle("liked");
        el.querySelector("i").className = el.classList.contains("liked") ? "fa-solid fa-heart" : "fa-regular fa-heart";

        const currentCount = this.likeCounts[momentId] || 0;
        const newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
        this.likeCounts[momentId] = newCount;

        const countEl = el.querySelector(".like-count");
        if (countEl) countEl.textContent = newCount > 0 ? " (" + newCount + ")" : "";

        try {
          if (!wasLiked) {
            await sb.from("reactions").insert({ moment_id: momentId, user_id: this.user.id });
            this.userReactions.add(momentId);
          } else {
            await sb.from("reactions").delete().eq("moment_id", momentId).eq("user_id", this.user.id);
            this.userReactions.delete(momentId);
          }
        } catch (e) {
          el.classList.toggle("liked");
          el.querySelector("i").className = el.classList.contains("liked") ? "fa-solid fa-heart" : "fa-regular fa-heart";
          this.likeCounts[momentId] = currentCount;
          if (countEl) countEl.textContent = currentCount > 0 ? " (" + currentCount + ")" : "";
          if (wasLiked) this.userReactions.add(momentId);
          else this.userReactions.delete(momentId);
          Utils.toast("Gagal menyimpan reaksi", "error");
        }
      };
    });

    document.querySelectorAll(".download-btn").forEach(el => {
      el.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        Utils.haptic("medium");

        const momentId = el.dataset.momentId;
        const mediaType = el.dataset.mediaType;
        const isLocal = el.dataset.isLocal === "true";
        const localId = el.dataset.localId;
        const mediaUrl = el.dataset.mediaUrl;

        let url = mediaUrl;

        if (isLocal && localId) {
          const localUrl = await LocalStorage.getFile(localId);
          if (!localUrl) {
            Utils.toast("❌ File tidak ditemukan di HP", "error");
            return;
          }
          url = localUrl;
        } else {
          const card = el.closest(".moment-card");
          const mediaEl = card.querySelector("[data-resolved-url]");
          if (mediaEl && mediaEl.dataset.resolvedUrl) url = mediaEl.dataset.resolvedUrl;
        }

        const filename = "lingkar_" + momentId + "." + (mediaType === "video" ? "mp4" : "jpg");
        await Utils.downloadMedia(url, filename, mediaType);
      };
    });
  },

  async checkNotifDot() {
    const rows = await DB.notifications(this.user.id).catch(() => []);
    const unread = rows.filter(r => !r.is_read).length;
    const dot = document.getElementById("notif-dot");
    if (dot) dot.classList.toggle("hidden", unread === 0);
  }
};

console.log("%c Lingkar Feed ", "background: #8b5cf6; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;");
