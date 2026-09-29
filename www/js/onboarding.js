/* ===== onboarding.js =====
   Handle onboarding slides + permission request.
   Dikembangkan oleh 0xmahen.
*/

const Onboarding = {
  currentSlide: 0,
  totalSlides: 5,
  slidesTrack: null,
  dots: null,
  btnNext: null,

  init() {
    this.slidesTrack = document.getElementById("slides-track");
    this.dots = document.querySelectorAll(".dot");
    this.btnNext = document.getElementById("btn-next");

    if (!this.slidesTrack) return;

    // Auto-detect jumlah slide
    const slides = this.slidesTrack.querySelectorAll(".slide");
    this.totalSlides = slides.length;

    // Bind tombol Next
    if (this.btnNext) {
      this.btnNext.addEventListener("click", () => this.next());
    }

    // Bind skip button
    const btnSkip = document.getElementById("btn-skip");
    if (btnSkip) {
      btnSkip.addEventListener("click", () => this.goToLogin());
    }

    // Update UI awal
    this.updateUI();
  },

  next() {
    if (this.currentSlide >= this.totalSlides - 1) {
      // Slide terakhir → minta permission + lanjut
      this.requestPermissions().then(() => {
        this.goToLogin();
      });
      return;
    }

    this.currentSlide++;
    this.updateUI();
  },

  updateUI() {
    // Update slide position
    if (this.slidesTrack) {
      this.slidesTrack.style.transform = `translateX(-${this.currentSlide * 100}%)`;
    }

    // Update dots
    if (this.dots) {
      this.dots.forEach((dot, i) => {
        dot.classList.toggle("active", i === this.currentSlide);
      });
    }

    // Update tombol text
    if (this.btnNext) {
      if (this.currentSlide === this.totalSlides - 1) {
        this.btnNext.innerHTML = 'Mulai Sekarang <i class="fa-solid fa-arrow-right"></i>';
      } else {
        this.btnNext.textContent = "Lanjut";
      }
    }
  },

  async requestPermissions() {
    // 1. Notifikasi (via Notifications API)
    if ("Notification" in window) {
      try {
        const result = await Notification.requestPermission();
        this.updatePermissionStatus("notification", result === "granted");
      } catch (e) {
        console.warn("Notification permission error:", e);
      }
    } else {
      this.updatePermissionStatus("notification", true);
    }

    // 2. Kamera & Storage (via getUserMedia - request permission)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        });
        stream.getTracks().forEach(t => t.stop());
        this.updatePermissionStatus("camera", true);
        this.updatePermissionStatus("storage", true);
      } catch (e) {
        console.warn("Camera permission error:", e);
        // Fallback: minta izin storage saja
        this.updatePermissionStatus("camera", false);
        this.updatePermissionStatus("storage", true);
      }
    } else {
      // Fallback
      this.updatePermissionStatus("camera", true);
      this.updatePermissionStatus("storage", true);
    }

    // Tunggu 1 detik biar user lihat status
    await new Promise(resolve => setTimeout(resolve, 1000));
  },

  updatePermissionStatus(permission, granted) {
    const statusEl = document.getElementById("status-" + permission);
    const itemEl = document.querySelector(`[data-permission="${permission}"]`);

    if (statusEl) {
      statusEl.innerHTML = granted
        ? '<i class="fa-solid fa-check-circle"></i>'
        : '<i class="fa-solid fa-times-circle" style="color:#ff3b30"></i>';
    }

    if (itemEl) {
      itemEl.classList.toggle("granted", granted);
    }
  },

  goToLogin() {
    localStorage.setItem("lingkar_onboarded", "1");
    window.location.href = "login.html";
  }
};

// Init saat halaman load
document.addEventListener("DOMContentLoaded", () => {
  Onboarding.init();
});

console.log("%c Lingkar Onboarding ", 
  "background: #8b5cf6; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;");
