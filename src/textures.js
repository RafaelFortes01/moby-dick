/* Texturas geradas em canvas: a madeira da mesa e o amassado das folhas.
   rnd, crumple e wood vêm do protótipo do handoff (design_handoff_guitar_hero),
   sem mudança no algoritmo — só saíram de métodos de classe pra funções.

   Cada uma vira um blob JPEG, e a URL dele vai pra uma variável CSS no :root
   (--md-wood, --md-cr-a, --md-cr-b). Blob em vez de toDataURL porque a string
   de data-URI ficaria enorme dentro da variável. */

export function rnd(seed) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

// amassado: dobras retas locais -> facetas com luz chapada + vinco claro/escuro.
// Centrado em 128 (cinza neutro) pra funcionar com mix-blend-mode: hard-light,
// e espelhado na vertical (altura 2H) pra repetir sem emenda.
export function crumple(seed, W, H, N) {
  const r = rnd(seed), F = [], Lx = -0.55, Ly = -0.83;
  for (let i = 0; i < N; i++) {
    const a = r() * Math.PI, nx = Math.cos(a), ny = Math.sin(a), R = (0.2 + r() * 0.55) * W, amp = (0.35 + r() * 0.65) * (r() < 0.5 ? -1 : 1);
    F.push([nx, ny, r() * W, r() * H, 1 / (R * R), amp * (nx * Lx + ny * Ly), amp]);
  }
  const c = document.createElement("canvas"); c.width = W; c.height = H * 2;
  const g = c.getContext("2d"), im = g.createImageData(W, H), d = im.data; let p = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const wx = x + 7 * Math.sin(y * 0.017 + seed) + 4 * Math.sin(x * 0.031 + y * 0.013), wy = y + 7 * Math.sin(x * 0.015 + seed * 2) + 4 * Math.sin(y * 0.027 + x * 0.011);
    let s = 0, e = 0;
    for (let i = 0; i < N; i++) {
      const f = F[i], dx = wx - f[2], dy = wy - f[3]; let w = 1 - (dx * dx + dy * dy) * f[4]; if (w <= 0) continue; w *= w;
      const dd = f[0] * dx + f[1] * dy, q = dd * dd;
      s += f[5] * w * (dd > 1 ? 1 : dd < -1 ? -1 : dd);
      if (q < 5) e += f[6] * w * (1 - q / 5);
    }
    const v = s * 30 + e * 14;
    if (v > 0) { d[p++] = 128 + v; d[p++] = 128 + v * 0.98; d[p++] = 128 + v * 0.9; }
    else { const u = v * 0.48; d[p++] = 128 + u * 0.86; d[p++] = 128 + u * 0.98; d[p++] = 128 + u * 1.12; }
    d[p++] = 255;
  }
  g.putImageData(im, 0, 0);
  g.save(); g.translate(0, 2 * H); g.scale(1, -1); g.drawImage(c, 0, 0, W, H, 0, 0, W, H); g.restore();
  return c;
}

// madeira: veios longos em 4 tons + nós + tábuas
export function wood(W, H) {
  const h2 = (x, y) => { let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const r = rnd(77), PH = H / 4.3, KN = [];
  for (let i = 0; i < 6; i++) KN.push([r() * W, r() * H, 10 + r() * 16, 16 + r() * 22]);
  const P = [[24, 12, 6], [50, 27, 12], [77, 44, 21], [99, 60, 30]];
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"), im = g.createImageData(W, H), d = im.data; let p = 0;
  for (let y = 0; y < H; y++) {
    const pl = Math.floor(y / PH), ox = h2(pl, 7) * 900, ly = y - pl * PH;
    for (let x = 0; x < W; x++) {
      let yy = y + 12 * vn(x * 0.005 + ox, y * 0.028), core = 0;
      for (let k = 0; k < 6; k++) {
        const K = KN[k], dy = y - K[1]; if (dy > 80 || dy < -80) continue;
        const dx = (x - K[0]) * 0.42, q = (dx * dx + dy * dy) / (K[2] * K[2]); if (q > 9) continue;
        yy += K[3] * Math.exp(-q) * dy / Math.sqrt(dy * dy + 20); core += Math.exp(-q * 9);
      }
      let t = vn(x * 0.0035 + ox, yy * 0.17) * 0.6 + vn(x * 0.012 + ox, yy * 0.55) * 0.28 + vn(x * 0.06, yy * 2.1) * 0.12 - core * 0.4;
      if (ly < 1.5) t -= 0.45; else if (ly < 3) t += 0.05;
      const f = Math.max(0, Math.min(2.999, (t - 0.22) * 5.4)), i = f | 0; let u = f - i; u = u < 0.3 ? 0 : u > 0.7 ? 1 : (u - 0.3) / 0.4;
      const A = P[i], B = P[i + 1];
      d[p++] = A[0] + (B[0] - A[0]) * u; d[p++] = A[1] + (B[1] - A[1]) * u; d[p++] = A[2] + (B[2] - A[2]) * u; d[p++] = 255;
    }
  }
  g.putImageData(im, 0, 0);
  return c;
}

const JOBS = [
  ["--md-wood", () => wood(840, 520)],
  ["--md-cr-a", () => crumple(11, 460, 900, 64)],
  ["--md-cr-b", () => crumple(29, 460, 640, 96)],
];

/* Gera as três em sequência, com 20ms entre elas, depois do primeiro paint —
   assim nenhuma trava a tela de entrada. O resultado fica num global, então
   remontar o App (ou o duplo efeito do StrictMode em dev) não gera de novo. */
export function initTextures() {
  const cache = window.__mdTex2 || (window.__mdTex2 = {});
  if (cache.started) return;
  cache.started = true;
  const root = document.documentElement.style;
  const put = (k, url) => root.setProperty(k, `url(${url})`);
  const run = (i) => {
    if (i >= JOBS.length) return;
    const [key, make] = JOBS[i];
    const next = () => setTimeout(() => run(i + 1), 20);
    if (cache[key]) { put(key, cache[key]); next(); return; }
    try {
      make().toBlob((b) => {
        if (b) { cache[key] = URL.createObjectURL(b); put(key, cache[key]); }
        next();
      }, "image/jpeg", 0.85);
    } catch {
      next();
    }
  };
  setTimeout(() => run(0), 60);
}
