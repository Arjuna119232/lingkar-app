/* ===== upload.js =====
   Handle upload momen (foto/video) dengan kompresi + simpan ke HP.
   Dikembangkan oleh Arjuna Mahendra.
*/

// Konfigurasi kompresi AGRESIF (hemat storage)
const COMPRESS_CONFIG = {
  image: {
    quality: 65,
    format: "webp",
    maxWidth: 1280,
    maxHeight: 1280
  },
  video: {
    crf: 32,
    preset: "veryfast",
    maxWidth: 854,
    maxHeight: 480,
    maxDuration: 15,
    audioBitrate: "64k"
  }
};

const Upload = {
  file: null,
  mediaType: null,
  user: null,

  async init() {
    App.init({ active: "upload.html", requireAuth: true });

    this.user = await DB.getUser();
    if (!this.user) {
      Utils.toast("Kamu belum login");
      setTimeout(() => location.href = "login.html", 800);
      return;
    }

    await this.loadCircles();

    document.getElementById("pick-image").addEventListener("click", () => {
      this.setActiveButton("image");
      document.getElementById("media-input-image").click();
    });

    document.getElementById("pick-video").addEventListener("click", () => {
      this.setActiveButton("video");
      document.getElementById("media-input-video").click();
    });

    document.getElementById("pick-camera").addEventListener("click", () => {
      this.setActiveButton("camera");
      document.getElementById("media-input-camera").click();
    });

    document.getElementById("media-input-image").addEventListener("change", e => {
      this.preview(e.target.files[0]);
    });

    document.getElementById("media-input-video").addEventListener("change", e => {
      this.preview(e.target.files[0]);
    });

    document.getElementById("media-input-camera").addEventListener("change", e => {
      this.preview(e.target.files[0]);
    });

    const captionEl = document.getElementById("caption");
    captionEl.addEventListener("input", e => {
      document.getElementById("caption-count").textContent =
        `${e.target.value.length}/200`;
    });

    document.getElementById("upload-form").addEventListener("submit", e => this.submit(e));
    document.getElementById("btn-cancel").addEventListener("click", () => history.back());

    console.log("✅ Upload module siap (kompresi + simpan lokal)");
  },

  setActiveButton(type) {
    document.getElementById("pick-image").classList.remove("active");
    document.getElementById("pick-video").classList.remove("active");
    const btnCamera = document.getElementById("pick-camera");
    if (btnCamera) btnCamera.classList.remove("active");

    if (type === "image") document.getElementById("pick-image").classList.add("active");
    else if (type === "video") document.getElementById("pick-video").classList.add("active");
    else if (type === "camera" && btnCamera) btnCamera.classList.add("active");
  },

  async loadCircles() {
    const circles = await DB.myCircles(this.user.id).catch(() => []);
    const wrap = document.getElementById("circle-checks");

    if (!circles || circles.length === 0) {
      wrap.innerHTML = `
        <p class="text-dim" style="font-size:13px">
          Kamu belum punya lingkaran.
          <a href="circle-create.html" class="text-primary">Buat satu dulu</a>.
        </p>`;
      return;
    }

    wrap.innerHTML = circles.map(c => `
      <label class="checkbox-row mb-8">
        <input type="checkbox" name="circle" value="${c.circles.id}"
          ${c.circles.type === "inner" ? "checked" : ""}>
        <span>
          ${Utils.escapeHtml(c.circles.name)}
          <span class="badge badge-${c.circles.type}">${c.circles.type}</span>
        </span>
      </label>
    `).join("");
  },

  async preview(file) {
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      Utils.toast("File harus foto atau video");
      return;
    }

    const maxInputSize = 100 * 1024 * 1024;
    if (file.size > maxInputSize) {
      Utils.toast("File terlalu besar (max 100 MB)");
      return;
    }

    this.file = file;
    this.mediaType = isVideo ? "video" : "image";

    const url = URL.createObjectURL(file);
    const icon = document.getElementById("preview-icon");
    const img = document.getElementById("preview-img");
    const video = document.getElementById("preview-video");

    icon.style.display = "none";
    img.style.display = "none";
    video.style.display = "none";
    img.src = "";
    video.src = "";

    if (this.mediaType === "video") {
      video.src = url;
      video.style.display = "block";
    } else {
      img.src = url;
      img.style.display = "block";
    }

    if (isVideo) {
      try {
        const duration = await this.getVideoDuration(file);
        if (duration > COMPRESS_CONFIG.video.maxDuration) {
          Utils.toast(`⏱️ Video terlalu panjang (${Math.round(duration)}s). Max ${COMPRESS_CONFIG.video.maxDuration} detik.`);
          this.file = null;
          return;
        }
        Utils.toast(`🎥 Video ${Math.round(duration)}s — siap dikompres`);
      } catch (e) {
        Utils.toast("Gagal cek durasi video");
        this.file = null;
        return;
      }
    } else {
      Utils.toast("📷 Foto dipilih");
    }
  },

  getVideoDuration(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => reject(new Error("Gagal baca video"));
      video.src = URL.createObjectURL(file);
    });
  },

  async compressFile(file, mediaType) {
    try {
      // Video: skip kompresi (langsung upload)
      if (mediaType === "video") {
        Utils.toast("Video langsung di-upload tanpa kompresi");
        return file;
      }

      // Foto: pakai library lokal browser-image-compression
      Utils.toast("Mengkompres foto...");

      // Load library dari file lokal
      if (typeof imageCompression === "undefined") {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "js/lib/browser-image-compression.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const options = {
        maxSizeMB: 0.08,
        maxWidthOrHeight: 1080,
        useWebWorker: false,
        fileType: "image/webp",
        initialQuality: 0.5
      };

      const compressedBlob = await imageCompression(file, options);
      const newFile = new File([compressedBlob], "compressed.webp", {
        type: "image/webp"
      });

      const saving = Math.round((1 - newFile.size / file.size) * 100);
      Utils.toast("Hemat " + saving + "%");
      return newFile;

    } catch (e) {
      console.warn("Kompresi gagal, pakai file asli:", e);
      Utils.toast("Kompresi gagal, pakai file asli");
      return file;
    }
  },

  async submit(e) {
    e.preventDefault();

    if (!this.file) {
      Utils.toast("Pilih foto atau video dulu");
      return;
    }

    const circleIds = [...document.querySelectorAll('input[name="circle"]:checked')]
      .map(el => el.value);

    if (circleIds.length === 0) {
      Utils.toast("Pilih minimal 1 lingkaran tujuan");
      return;
    }

    const btn = document.getElementById("btn-submit");
    const bar = document.querySelector("#progress .fill");
    const progressEl = document.getElementById("progress");

    progressEl.classList.remove("hidden");
    Utils.setLoading(btn, true);

    try {
      // Step 0: Kompres
      bar.style.width = "15%";
      const compressedFile = await this.compressFile(this.file, this.mediaType);

      // Step 1: Simpan ke HP (atau fallback ke cloud)
      bar.style.width = "40%";
      const momentId = "m_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
      let uploadResult;
      try {
        uploadResult = await DB.uploadMedia(compressedFile, this.user.id, momentId);
      } catch (uploadErr) {
        console.error("Upload error:", uploadErr);
        throw uploadErr;
      }

      // Step 2: Insert metadata ke Supabase
      bar.style.width = "70%";
      const moment = await DB.createMoment({
        user_id: this.user.id,
        media_url: uploadResult.url,
        media_type: this.mediaType,
        caption: document.getElementById("caption").value.trim(),
        is_local: uploadResult.isLocal,
        local_id: uploadResult.localId || null
      });

      // Step 3: Insert visibility
      await sb.from("moment_visibility").insert(
        circleIds.map(id => ({ moment_id: moment.id, circle_id: id }))
      );

      bar.style.width = "100%";
      Utils.toast("✅ Momen diposting " + (uploadResult.isLocal ? "(tersimpan di HP)" : "(di cloud)"));

      setTimeout(() => location.href = "feed.html", 800);

    } catch (err) {
      console.error("Upload error:", err);
      Utils.toast("Gagal posting: " + err.message, "error");
      Utils.setLoading(btn, false, "Posting");
      progressEl.classList.add("hidden");
      bar.style.width = "0%";
    }
  }
};

console.log("%c Lingkar Upload ", 
  "background: #007aff; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;");