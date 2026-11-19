// Vice Cover Studio — the poster renderer (original work).
// Draws a photo (or several photos) into a multi-panel poster with a sunset/neon
// colour grade and big display lettering, on any canvas size. No external assets:
// the only font is the vendored Anton, with a bold system-sans fallback.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

export const LAYOUTS = {
  // Panels in normalised coords: x, y, w, h (0..1 of the canvas).
  hero: [{ x: 0, y: 0, w: 1, h: 1 }],
  grid4: [
    { x: 0, y: 0, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ],
  hero3: [
    { x: 0, y: 0, w: 1, h: 0.62 },
    { x: 0, y: 0.62, w: 1 / 3, h: 0.38 },
    { x: 1 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
    { x: 2 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
  ],
  strip3: [
    { x: 0, y: 0, w: 1 / 3, h: 1 },
    { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
    { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
  ],
};

export const GRADES = {
  sunset: {
    label: 'Sunset',
    tint: ['rgba(255,94,40,0.20)', 'rgba(255,45,149,0.22)', 'rgba(90,20,140,0.18)'],
    filter: 'saturate(1.25) contrast(1.08)',
    sky: ['#ff9a3d', '#ff2d95'],
  },
  neon: {
    label: 'Neon Night',
    tint: ['rgba(255,0,180,0.26)', 'rgba(40,0,120,0.30)', 'rgba(0,220,255,0.14)'],
    filter: 'saturate(1.45) contrast(1.14)',
    sky: ['#ff2bd6', '#2b0a5e'],
  },
  golden: {
    label: 'Golden Hour',
    tint: ['rgba(255,176,32,0.24)', 'rgba(255,120,40,0.16)', 'rgba(120,40,0,0.10)'],
    filter: 'saturate(1.2) contrast(1.05)',
    sky: ['#ffc23d', '#ff7a1a'],
  },
  teal: {
    label: 'Teal Vice',
    tint: ['rgba(0,220,200,0.18)', 'rgba(255,45,149,0.18)', 'rgba(0,60,90,0.22)'],
    filter: 'saturate(1.35) contrast(1.1)',
    sky: ['#2de2c5', '#ff2d95'],
  },
  noir: {
    label: 'Noir',
    tint: ['rgba(0,0,0,0.30)', 'rgba(255,255,255,0.06)', 'rgba(0,0,0,0.25)'],
    filter: 'grayscale(0.85) contrast(1.3)',
    sky: ['#e8e8e8', '#222222'],
  },
};

/** A blank panel state: which photo, zoom and pan. */
export function blankPanel(photo = 'boulevard') {
  return { photo, zoom: 1.2, panX: 0, panY: 0 };
}

/** Draw one photo into a panel rect with cover-fit, zoom and pan. */
function drawPhoto(ctx, img, rect, panel) {
  const { x, y, w, h } = rect;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih) * (panel.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2 + (panel.panX || 0) * w;
  const dy = y + (h - dh) / 2 + (panel.panY || 0) * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

/** Wash a grade over a rect: diagonal tint bands + a soft vignette. */
function gradeRect(ctx, rect, grade, strength) {
  const { x, y, w, h } = rect;
  if (!strength) return;
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, grade.tint[0]);
  g.addColorStop(0.55, grade.tint[1]);
  g.addColorStop(1, grade.tint[2]);
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // Vignette: darken the corners so the lettering pops.
  const v = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = v;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, family) {
  let px = startPx;
  ctx.font = `${px}px ${family}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 4;
    ctx.font = `${px}px ${family}`;
  }
  return px;
}

/** Big display title + subtitle across the bottom of the poster. */
function drawWords(ctx, W, H, state) {
  const family = '"Anton", "Arial Black", sans-serif';
  const title = (state.caption || '').trim().toUpperCase() || 'SUNSET HEIST';
  const margin = W * 0.045;
  const maxW = W - margin * 2;
  const base = Math.round(W * 0.115 * (state.titleSize || 1));
  const px = fitFont(ctx, title, maxW, base, family);
  const titleY = H - H * 0.075;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${px}px ${family}`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(4, px * 0.14);
  ctx.strokeStyle = 'rgba(20,4,28,0.92)';
  ctx.shadowColor = 'rgba(255,45,149,0.55)';
  ctx.shadowBlur = px * 0.18;
  ctx.shadowOffsetY = px * 0.05;
  ctx.strokeText(title, margin, titleY);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = state.titleColor || '#ffffff';
  ctx.fillText(title, margin, titleY);
  // Thin neon underline under the title.
  const tw = ctx.measureText(title).width;
  const grad = ctx.createLinearGradient(margin, 0, margin + tw, 0);
  grad.addColorStop(0, '#ff2d95');
  grad.addColorStop(0.5, '#ffd166');
  grad.addColorStop(1, '#39e6ff');
  ctx.fillStyle = grad;
  ctx.fillRect(margin, titleY + px * 0.1, tw, Math.max(4, px * 0.06));
  if (state.showSub && (state.subtitle || '').trim()) {
    const sub = state.subtitle.trim();
    const spx = Math.round(W * 0.028);
    ctx.font = `700 ${spx}px system-ui, sans-serif`;
    ctx.lineWidth = Math.max(3, spx * 0.18);
    ctx.strokeStyle = 'rgba(20,4,28,0.9)';
    const subY = titleY - px * 1.18;
    ctx.strokeText(sub, margin, subY);
    ctx.fillStyle = '#ffe9f4';
    ctx.fillText(sub, margin, subY);
  }
  ctx.restore();
}

/**
 * Render the poster onto `canvas` at its own width/height.
 * state: { layout, grade, gradeStrength, panels: PanelState[], caption, subtitle,
 *          titleSize, titleColor, showSub } — images: { name: HTMLImageElement }.
 */
export function renderCover(canvas, images, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const gutter = Math.max(3, Math.round(Math.min(W, H) * 0.008));
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d0512';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.filter = grade.filter;
  layout.forEach((p, i) => {
    const rect = {
      x: p.x * W + (p.x > 0 ? gutter / 2 : 0),
      y: p.y * H + (p.y > 0 ? gutter / 2 : 0),
      w: p.w * W - (p.x > 0 ? gutter / 2 : 0) - (p.x + p.w < 1 ? gutter / 2 : 0),
      h: p.h * H - (p.y > 0 ? gutter / 2 : 0) - (p.y + p.h < 1 ? gutter / 2 : 0),
    };
    const panel = state.panels[i] || blankPanel();
    const img = images[panel.photo];
    if (img) drawPhoto(ctx, img, rect, panel);
  });
  ctx.restore();
  // Grade + gutters on top of the filtered photos.
  layout.forEach((p, i) => {
    const rect = {
      x: p.x * W + (p.x > 0 ? gutter / 2 : 0),
      y: p.y * H + (p.y > 0 ? gutter / 2 : 0),
      w: p.w * W - (p.x > 0 ? gutter / 2 : 0) - (p.x + p.w < 1 ? gutter / 2 : 0),
      h: p.h * H - (p.y > 0 ? gutter / 2 : 0) - (p.y + p.h < 1 ? gutter / 2 : 0),
    };
    gradeRect(ctx, rect, grade, state.gradeStrength ?? 0.7);
  });
  // White gutters between panels, like a printed poster.
  ctx.fillStyle = '#fdf6ff';
  layout.forEach((p) => {
    if (p.x > 0) ctx.fillRect(p.x * W - gutter / 2, 0, gutter, H);
    if (p.y > 0) ctx.fillRect(0, p.y * H - gutter / 2, W, gutter);
  });
  // Bottom scrim so the title stays readable over any photo.
  const scrim = ctx.createLinearGradient(0, H * 0.62, 0, H);
  scrim.addColorStop(0, 'rgba(10,2,16,0)');
  scrim.addColorStop(1, 'rgba(10,2,16,0.62)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.62, W, H * 0.38);
  drawWords(ctx, W, H, state);
}

/** Render at an export size and return a PNG blob. */
export function exportPng(images, state, sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  renderCover(off, images, state);
  return new Promise((resolve, reject) => {
    off.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png');
  });
}

/** Load an image element from a URL (local file or object URL). */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

/** Make sure the vendored display font is ready before we paint text. */
export async function ensureFont() {
  try {
    await document.fonts.load('100px "Anton"');
    await document.fonts.ready;
  } catch {
    // Fall back to the bold system sans: the renderer never depends on Anton.
  }
}
