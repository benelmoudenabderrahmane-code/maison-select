// Deterministic animation helpers: every scene exposes window.render(t) (seconds).
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
/** 0→1 between a and b (eased). */
const p = (t, a, b, f = ease) => f(clamp01((t - a) / (b - a)));
const lerp = (a, b, k) => a + (b - a) * k;
const $ = (id) => document.getElementById(id);
function set(el, { o = 1, x = 0, y = 0, s = 1, r = 0, rx = 0, blur = 0 } = {}) {
  el.style.opacity = o;
  el.style.transform = `translate(${x}px, ${y}px) perspective(1400px) rotateX(${rx}deg) rotate(${r}deg) scale(${s})`;
  el.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
}
