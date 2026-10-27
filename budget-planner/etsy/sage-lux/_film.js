// Tiny deterministic animation kit: window.render(t) draws the frame at time t (seconds).
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a, b, x) => a + (b - a) * x;
const $ = (id) => document.getElementById(id);
/** Visible between a and b with fade in/out of f seconds. */
const win = (t, a, b, f = 0.35) => clamp(Math.min((t - a) / f, (b - t) / f));
function set(id, { x = 0, y = 0, s = 1, r = 0, o = 1, blur = 0 } = {}) {
  const e = typeof id === "string" ? $(id) : id;
  if (!e) return;
  e.style.transform = `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`;
  e.style.opacity = o;
  e.style.filter = blur ? `blur(${blur}px)` : "";
}
/** Gold dust that drifts up — seeded, so every render is identical. */
function dust(n = 34) {
  const box = document.createElement("div");
  box.id = "dust";
  box.style.cssText = "position:absolute;inset:0;z-index:2;pointer-events:none";
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const ps = Array.from({ length: n }, () => ({ x: rnd() * 1080, y: rnd() * 1080, r: 1.5 + rnd() * 3.5, v: 14 + rnd() * 30, ph: rnd() * 6.28 }));
  for (const p of ps) { const d = document.createElement("i"); d.style.cssText = `position:absolute;left:0;top:0;width:${p.r * 2}px;height:${p.r * 2}px;border-radius:50%;background:radial-gradient(circle,#ffe7a8,rgba(217,173,94,0));`; box.appendChild(d); p.el = d; }
  document.body.appendChild(box);
  return (t) => { for (const p of ps) { const y = (p.y - p.v * t + 1080 * 4) % 1100; p.el.style.transform = `translate(${p.x + Math.sin(t * 0.8 + p.ph) * 14}px, ${y}px)`; p.el.style.opacity = 0.35 + 0.35 * Math.sin(t * 1.7 + p.ph); } };
}
/** Count a money label up from a to b. */
const money = (v) => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
