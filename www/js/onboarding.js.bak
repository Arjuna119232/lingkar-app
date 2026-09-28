/* ===== onboarding.js ===== */
document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("slides-track");
  const dots = [...document.querySelectorAll(".dots .dot")];
  let idx = 0;
  const total = dots.length;

  function render() {
    track.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === idx));
    document.getElementById("btn-next").textContent = idx === total - 1 ? "Mulai Sekarang" : "Lanjut";
  }

  document.getElementById("btn-next").addEventListener("click", () => {
    if (idx < total - 1) { idx++; render(); }
    else location.href = "register.html";
  });
  document.getElementById("btn-skip").addEventListener("click", () => location.href = "login.html");

  // swipe
  let startX = 0;
  track.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  track.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx < -40 && idx < total - 1) { idx++; render(); }
    if (dx > 40 && idx > 0) { idx--; render(); }
  });

  render();
});
