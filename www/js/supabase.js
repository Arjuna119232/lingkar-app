/* ===== supabase.js =====
   Konfigurasi Supabase + helper query.
   File media disimpan di HP user via LocalStorage.
   Supabase hanya untuk: auth, metadata, komentar, reaksi, lingkaran.
   Dikembangkan oleh Arjuna Mahendra.
*/

const SUPABASE_URL = "https://ddrsbdoalmwihcerhlks.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8TohLRxTAe29XK9w1j4yaw_-cDiH6LN";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});

const DB = {
  // ============ AUTH ============
  async getSession() {
    const { data } = await sb.auth.getSession();
    return data.session;
  },
  async getUser() {
    const { data } = await sb.auth.getUser();
    return data.user;
  },
  async signUp(email, password, username) {
    const { data, error } = await sb.auth.signUp({
      email, password, options: { data: { username } }
    });
    if (error) throw error;
    return data;
  },
  async signIn(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signOut() {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
  },
  async resetPassword(email) {
    const { data, error } = await sb.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  },

  // ============ PROFILES ============
  async getProfile(userId) {
    const { data, error } = await sb.from("profiles").select("*").eq("id", userId).single();
    if (error) throw error;
    return data;
  },
  async updateProfile(userId, fields) {
    const { data, error } = await sb.from("profiles").update(fields).eq("id", userId).select().single();
    if (error) throw error;
    return data;
  },

  // ============ CIRCLES ============
  async myCircles(userId) {
    const { data, error } = await sb
      .from("circle_members")
      .select("role,status,circles(*)")
      .eq("user_id", userId)
      .eq("status", "active");
    if (error) throw error;
    return data;
  },
  async createCircle(payload) {
    const { data, error } = await sb.from("circles").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async joinCircleByCode(code, userId) {
    const { data: circle, error: e1 } = await sb.from("circles").select("*").eq("invite_code", code).single();
    if (e1 || !circle) throw new Error("Kode undangan tidak ditemukan");
    const { error: e2 } = await sb.from("circle_members").insert({ circle_id: circle.id, user_id: userId });
    if (e2) throw e2;
    return circle;
  },
  async getCircleDetail(circleId) {
    const { data, error } = await sb.from("circles").select("*").eq("id", circleId).single();
    if (error) throw error;
    return data;
  },
  async getCircleMembers(circleId) {
    const { data, error } = await sb
      .from("circle_members")
      .select("role,status,joined_at,profiles(id,username,avatar_url)")
      .eq("circle_id", circleId)
      .eq("status", "active");
    if (error) throw error;
    return data;
  },
  async leaveCircle(circleId, userId) {
    const { error } = await sb.from("circle_members").delete().eq("circle_id", circleId).eq("user_id", userId);
    if (error) throw error;
  },

  // ============ FEED / MOMENTS ============
  async feed(userId, filterType, { from = 0, to = 19 } = {}) {
    let circleIds = await sb
      .from("circle_members")
      .select("circle_id, circles(type)")
      .eq("user_id", userId)
      .eq("status", "active");
    if (circleIds.error) throw circleIds.error;

    let ids = circleIds.data
      .filter(c => filterType === "all" || c.circles.type === filterType)
      .map(c => c.circle_id);
    if (ids.length === 0) return [];

    const { data, error } = await sb
      .from("moment_visibility")
      .select("moments(*, profiles(username, avatar_url)), circles(type)")
      .in("circle_id", ids)
      .order("created_at", { ascending: false, foreignTable: "moments" })
      .range(from, to);
    if (error) throw error;
    return data;
  },
  async getUserMoments(userId) {
    const { data, error } = await sb
      .from("moments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async createMoment(payload) {
    const { data, error } = await sb.from("moments").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async addMomentVisibility(momentId, circleIds) {
    const rows = circleIds.map(cid => ({ moment_id: momentId, circle_id: cid }));
    const { error } = await sb.from("moment_visibility").insert(rows);
    if (error) throw error;
  },
  async deleteMoment(momentId, userId) {
    const { error } = await sb.from("moments").delete().eq("id", momentId).eq("user_id", userId);
    if (error) throw error;
  },

  // ============ STORAGE (HYBRID: lokal dulu, fallback cloud) ============
  /**
   * Simpan media. Prioritas: LocalStorage (HP user).
   * Fallback ke Supabase Storage kalau LocalStorage gagal.
   * @returns {Promise<{url: string, isLocal: boolean, localId?: string, path?: string}>}
   */
  async uploadMedia(file, userId, momentId = null) {
    // FIX: Langsung upload ke Supabase (skip IndexedDB, tidak reliable di WebView)
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await sb.storage.from("media").upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

    if (error) {
      console.error("Upload error:", error);
      throw new Error("Upload gagal: " + error.message);
    }

    const { data } = sb.storage.from("media").getPublicUrl(path);
    console.log("☁️ File di-upload ke Supabase:", path);
    return { url: data.publicUrl, isLocal: false, path };
  },

  async deleteMedia(path) {
    const { error } = await sb.storage.from("media").remove([path]);
    if (error) throw error;
  },

  // ============ COMMENTS ============
  async getComments(momentId) {
    const { data, error } = await sb
      .from("comments")
      .select("*, profiles(username, avatar_url)")
      .eq("moment_id", momentId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },
  async createComment(momentId, userId, text) {
    const { data, error } = await sb
      .from("comments")
      .insert({ moment_id: momentId, user_id: userId, text })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ============ REACTIONS ============
  async getReactions(momentId) {
    const { data, error } = await sb.from("reactions").select("*").eq("moment_id", momentId);
    if (error) throw error;
    return data;
  },
  async toggleReaction(momentId, userId, emoji = "❤️") {
    const { data: existing } = await sb
      .from("reactions")
      .select("id")
      .eq("moment_id", momentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await sb.from("reactions").delete().eq("id", existing.id);
      if (error) throw error;
      return { action: "removed" };
    } else {
      const { error } = await sb
        .from("reactions")
        .insert({ moment_id: momentId, user_id: userId, emoji });
      if (error) throw error;
      return { action: "added" };
    }
  },

  // ============ NOTIFICATIONS ============
  async notifications(userId) {
    const { data, error } = await sb
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  // Buat notifikasi baru
  async createNotification({ userId, type, title, body, data = {} }) {
    if (!userId) return;
    const { error } = await sb.from("notifications").insert({
      user_id: userId,
      type: type,
      title: title,
      body: body,
      data: data,
      is_read: false
    });
    if (error) console.warn("createNotification error:", error.message);
  },

  async markAllRead(userId) {
    const { error } = await sb
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw error;
  },
  async markOneRead(notifId) {
    const { error } = await sb.from("notifications").update({ is_read: true }).eq("id", notifId);
    if (error) throw error;
  },

  // ============ FOLLOWS ============
  async follow(followerId, followingId) {
    const { error } = await sb
      .from("follows")
      .insert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
  },
  async unfollow(followerId, followingId) {
    const { error } = await sb
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    if (error) throw error;
  },
  async isFollowing(followerId, followingId) {
    const { data, error } = await sb
      .from("follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }
};

window.DB = DB;
window.sb = sb;

console.log("%c Lingkar Supabase ", 
  "background: #3ecf8e; color: #000; padding: 4px 8px; border-radius: 4px; font-weight: bold;");