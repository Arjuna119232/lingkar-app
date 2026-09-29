/* ===== auth.js ===== */
const Auth = {
  initLogin() {
    const form = document.getElementById("login-form");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const email = form.email.value.trim();
      const password = form.password.value;
      if (!email || !password) return Utils.toast("Isi email dan password");
      const btn = document.getElementById("btn-login");
      Utils.setLoading(btn, true);
      const { error } = await sb.auth.signInWithPassword({ email, password });
      Utils.setLoading(btn, false, "Masuk");
      if (error) return Utils.toast(this.friendlyError(error.message));
      if (form.remember.checked) localStorage.setItem("lingkar_remember", "1");
      location.href = "feed.html";
    });
    document.getElementById("toggle-pw")?.addEventListener("click", e => this.togglePw(e.target));
  },

  initRegister() {
    const form = document.getElementById("register-form");
    const pwInput = form.password;
    pwInput.addEventListener("input", () => this.updateStrength(pwInput.value));

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const username = form.username.value.trim();
      const email = form.email.value.trim();
      const password = form.password.value;
      const confirm = form.confirm.value;

      if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) return Utils.toast("Username minimal 3 karakter, huruf/angka/underscore");
      if (password.length < 6) return Utils.toast("Password minimal 6 karakter");
      if (password !== confirm) return Utils.toast("Konfirmasi password tidak cocok");
      if (!form.agree.checked) return Utils.toast("Setujui Syarat & Ketentuan dulu ya");

      const btn = document.getElementById("btn-register");
      Utils.setLoading(btn, true);
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { username } } });
      if (!error && data.user) {
        await sb.from("profiles").insert({ id: data.user.id, username });
      }
      Utils.setLoading(btn, false, "Daftar");
      if (error) return Utils.toast(this.friendlyError(error.message));
      Utils.toast("Akun dibuat! Silakan cek email untuk verifikasi.");
      setTimeout(() => location.href = "login.html", 1500);
    });
    document.getElementById("toggle-pw")?.addEventListener("click", e => this.togglePw(e.target));
  },

  initForgot() {
    const form = document.getElementById("forgot-form");
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const btn = document.getElementById("btn-forgot");
      Utils.setLoading(btn, true);
      const { error } = await sb.auth.resetPasswordForEmail(form.email.value.trim());
      Utils.setLoading(btn, false, "Kirim link reset");
      Utils.toast(error ? this.friendlyError(error.message) : "Link reset dikirim, cek email kamu");
    });
  },

  togglePw(iconEl) {
    const input = iconEl.parentElement.querySelector("input");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    iconEl.className = show ? "fa-solid fa-eye-slash toggle-eye" : "fa-solid fa-eye toggle-eye";
  },

  updateStrength(pw) {
    const bar = document.getElementById("pw-strength");
    if (!bar) return;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    const levels = ["#FF4757", "#FF4757", "#FFA502", "#2ED573", "#2ED573"];
    const labels = ["Lemah", "Lemah", "Sedang", "Kuat", "Kuat"];
    bar.style.width = (score * 25) + "%";
    bar.style.background = levels[score];
    document.getElementById("pw-strength-label").textContent = pw ? labels[score] : "";
  },

  friendlyError(msg) {
    if (/invalid login/i.test(msg)) return "Email atau password salah";
    if (/already registered/i.test(msg)) return "Email sudah terdaftar";
    if (/rate limit/i.test(msg)) return "Terlalu banyak percobaan, coba lagi nanti";
    return msg;
  }
};
