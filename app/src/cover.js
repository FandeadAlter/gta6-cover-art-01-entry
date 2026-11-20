// Rain City cover engine: draws a multi-panel GTA-style poster on a canvas,
// in the cold rainy Vice City noir grade (the anti-neon look), with bold
// caption lettering, rain streaks and fog. Pure canvas 2D, no libraries.

// A deterministic PRNG, so the same state always draws the same rain.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Colour grades. "rain" is the signature: steel blue, slate grey, wet asphalt,
// the city at 3 AM in the rain. "neon" is the viral sunset look, offered as an
// option; "mono" is black-and-white noir; "dusk" is cold teal.
export const GRADES = {
  rain: {
    label: 'Rain Noir',
    wash: 'rgba(72, 110, 138, 0.30)',
    top: 'rgba(14, 26, 36, 0.55)',
    band: '#0a141d',
    accent: '#7fb2d9',
    ink: '#e9f1f6',
    rain: true,
    fog: true,
  },
  neon: {
    label: 'Neon Sunset',
    wash: 'rgba(255, 110, 80, 0.28)',
    top: 'rgba(58, 16, 48, 0.35)',
    band: '#1c0a18',
    accent: '#ff7a5c',
    ink: '#ffffff',
    rain: false,
    fog: false,
  },
  mono: {
    label: 'Mono',
    wash: 'rgba(0, 0, 0, 0.30)',
    top: 'rgba(10, 10, 10, 0.45)',
    band: '#0a0a0a',
    accent: '#e8e8e8',
    ink: '#f5f5f5',
    rain: true,
    fog: false,
  },
  dusk: {
    label: 'Dusk Teal',
    wash: 'rgba(40, 140, 150, 0.26)',
    top: 'rgba(12, 34, 38, 0.45)',
    band: '#081a1d',
    accent: '#5fd0c0',
    ink: '#eaf6f4',
    rain: false,
    fog: true,
  },
};

// Panel layouts, as fractions of the canvas: [x, y, w, h] each.
export const LAYOUTS = {
  hero: {
    label: 'Hero · 1 panel',
    cells: [[0, 0, 1, 1]],
  },
  split: {
    label: 'Split · 2 panels',
    cells: [
      [0, 0, 0.5, 1],
      [0.5, 0, 0.5, 1],
    ],
  },
  triptych: {
    label: 'Triptych · 3 panels',
    cells: [
      [0, 0, 1 / 3, 1],
      [1 / 3, 0, 1 / 3, 1],
      [2 / 3, 0, 1 / 3, 1],
    ],
  },
  grid: {
    label: 'Grid · 4 panels',
    cells: [
      [0, 0, 0.5, 0.5],
      [0.5, 0, 0.5, 0.5],
      [0, 0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0.5],
    ],
  },
};

// Post sizes the app exports.
export const SIZES = {
  '1080x1080': { label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  '1080x1350': { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  '1920x1080': { label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

/** Draws one photo into a panel rect, cover-fit, with zoom and pan offsets. */
function drawPhotoInto(ctx, photo, rect, zoom, panX, panY) {
  const [rx, ry, rw, rh] = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(rw / iw, rh / ih);
  const scale = base * zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  const cx = rx + rw / 2 + panX * rw;
  const cy = ry + rh / 2 + panY * rh;
  ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

/** Draws diagonal rain streaks over the whole canvas, seeded so they repeat. */
function drawRain(ctx, w, h, strength) {
  const rand = mulberry32(20261119 + Math.round(w) + Math.round(h));
  const count = Math.round(140 * strength);
  ctx.save();
  ctx.strokeStyle = 'rgba(198, 220, 238, 0.30)';
  ctx.lineWidth = Math.max(1, w / 1080);
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const len = h * (0.025 + rand() * 0.035);
    const lean = w * 0.012;
    ctx.moveTo(x, y);
    ctx.lineTo(x - lean, y + len);
  }
  ctx.stroke();
  ctx.restore();
}

/** Draws a soft fog bank across the top third of the canvas. */
function drawFog(ctx, w, h) {
  const fog = ctx.createLinearGradient(0, 0, 0, h * 0.45);
  fog.addColorStop(0, 'rgba(190, 208, 220, 0.20)');
  fog.addColorStop(1, 'rgba(190, 208, 220, 0)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, w, h * 0.45);
}

/** Draws a dark vignette around the edges. */
function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Fits the caption to the width, then draws it in bold capitals. */
function drawCaption(ctx, w, h, caption, subtitle, grade) {
  const text = caption.trim().toUpperCase();
  const bandH = h * 0.26;
  const bandY = h - bandH;
  // Bottom scrim so the lettering reads over any photo.
  const scrim = ctx.createLinearGradient(0, bandY - h * 0.08, 0, h);
  scrim.addColorStop(0, 'rgba(10, 20, 29, 0)');
  scrim.addColorStop(1, grade.band);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - h * 0.08, w, bandH + h * 0.08);
  // Accent rule above the kicker.
  ctx.fillStyle = grade.accent;
  ctx.fillRect(w * 0.06, bandY + h * 0.01, w * 0.12, Math.max(3, h * 0.004));
  // Kicker line.
  const kicker = 'VICE NOIR · RAIN CITY';
  const kickerBase = bandY + h * 0.055;
  ctx.textAlign = 'left';
  ctx.fillStyle = grade.accent;
  const kSize = h * 0.022;
  ctx.font = `bold ${kSize}px 'Arial Black', Arial, sans-serif`;
  ctx.fillText(kicker, w * 0.06, kickerBase);
  // Main caption, shrunk to fit, sitting below the kicker.
  let captionBase = kickerBase;
  if (text) {
    let size = h * 0.09;
    ctx.font = `900 ${size}px 'Arial Black', Arial, sans-serif`;
    while (ctx.measureText(text).width > w * 0.88 && size > 10) {
      size -= 2;
      ctx.font = `900 ${size}px 'Arial Black', Arial, sans-serif`;
    }
    captionBase = kickerBase + size * 1.25;
    ctx.textAlign = 'left';
    ctx.fillStyle = grade.ink;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.04;
    ctx.fillText(text, w * 0.06, captionBase);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  // Subtitle under the caption, with a clear gap below its baseline.
  const sub = subtitle.trim();
  if (sub) {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(233, 241, 246, 0.82)';
    const sSize = Math.max(12, h * 0.024);
    ctx.font = `${sSize}px Arial, sans-serif`;
    ctx.fillText(sub, w * 0.06, captionBase + h * 0.045);
  }
}

/**
 * Draws the whole cover onto `canvas` from a state:
 * { layout, grade, size, caption, subtitle, rain, vignette, panels: [{ photo, zoom, panX, panY }] }
 * A panel's photo is an <img>/<canvas> image, or null for an empty panel.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.rain;
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero;
  const gutter = Math.max(4, Math.round(w * 0.006));

  // Base: the grade's dark sky, so an empty panel still reads as the theme.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, grade.top);
  sky.addColorStop(1, grade.band);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Panels.
  layout.cells.forEach((cell, i) => {
    const [fx, fy, fw, fh] = cell;
    const rect = [fx * w + gutter / 2, fy * h + gutter / 2, fw * w - gutter, fh * h - gutter];
    const panel = state.panels[i] || {};
    if (panel.photo) {
      drawPhotoInto(ctx, panel.photo, rect, panel.zoom || 1, panel.panX || 0, panel.panY || 0);
    }
  });

  // Grade wash over the whole cover, then fog and rain.
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, w, h);
  if (grade.fog) drawFog(ctx, w, h);
  if (grade.rain && state.rain > 0) drawRain(ctx, w, h, state.rain);
  if (state.vignette) drawVignette(ctx, w, h);

  // Gutters between panels, in the band colour.
  ctx.fillStyle = grade.band;
  layout.cells.forEach(([fx, fy, fw, fh]) => {
    if (fx > 0) ctx.fillRect(fx * w - gutter / 2, 0, gutter, h);
    if (fy > 0) ctx.fillRect(0, fy * h - gutter / 2, w, gutter);
  });

  drawCaption(ctx, w, h, state.caption || '', state.subtitle || '', grade);
}
