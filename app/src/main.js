// Rain City: wires the editor. Load photos, pick a layout and a grade, crop and
// position each panel by dragging it, write the caption, export the PNG.
// A `?shot=` query sets up a fixed scene for a screenshot instead (shots.js).
import { drawCover, GRADES, LAYOUTS, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');

// The editor state. Panels hold a photo id, a zoom and a pan offset.
const state = {
  size: '1080x1080',
  layout: 'hero',
  grade: 'rain',
  caption: 'RAIN CITY',
  subtitle: 'Vice Noir · 3 AM in the rain',
  rain: 0.7,
  vignette: true,
  panels: [{ photo: 'rain-street', zoom: 1, panX: 0, panY: 0 }],
  selected: 0,
};

// Loaded photos, by id: the two built-in samples plus anything the user adds.
const photos = new Map();
let uploadCount = 0;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSample(id) {
  if (photos.has(id)) return photos.get(id);
  const img = await loadImage(`samples/${id}.jpg`);
  photos.set(id, img);
  return img;
}

function statePhotos() {
  return state.panels.map((p) => (p.photo ? photos.get(p.photo) || null : null));
}

function applySize() {
  const size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
}

function redraw() {
  applySize();
  const panels = state.panels.map((p, i) => ({
    photo: p.photo ? photos.get(p.photo) || null : null,
    zoom: p.zoom,
    panX: p.panX,
    panY: p.panY,
  }));
  drawCover(canvas, { ...state, panels });
  updatePanelList();
}

function updatePanelList() {
  const list = document.getElementById('panels');
  const layout = LAYOUTS[state.layout];
  list.replaceChildren();
  layout.cells.forEach((_, i) => {
    const panel = state.panels[i] || { photo: null, zoom: 1, panX: 0, panY: 0 };
    const row = document.createElement('div');
    row.className = 'panel-row' + (state.selected === i ? ' selected' : '');
    const label = document.createElement('span');
    label.textContent = `Panel ${i + 1}`;
    const select = document.createElement('select');
    select.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'Empty';
    select.append(none);
    for (const id of photos.keys()) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = id === 'rain-street' ? 'Rain Street (sample)' : id === 'rain-boulevard' ? 'Rain Boulevard (sample)' : id;
      select.append(opt);
    }
    select.value = panel.photo || '';
    select.addEventListener('change', () => {
      state.panels[i] = { ...panel, photo: select.value || null };
      redraw();
    });
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '2.5';
    zoom.step = '0.05';
    zoom.value = String(panel.zoom || 1);
    zoom.setAttribute('aria-label', `Zoom for panel ${i + 1}`);
    zoom.addEventListener('input', () => {
      state.panels[i] = { ...panel, zoom: Number(zoom.value) };
      redraw();
    });
    row.append(label, select, zoom);
    row.addEventListener('click', () => {
      state.selected = i;
      redraw();
    });
    list.append(row);
  });
}

function setLayout(name) {
  state.layout = name;
  const cells = LAYOUTS[name].cells.length;
  while (state.panels.length < cells) {
    state.panels.push({ photo: state.panels[0] ? state.panels[0].photo : null, zoom: 1, panX: 0, panY: 0 });
  }
  state.panels.length = cells;
  state.selected = 0;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === name));
  redraw();
}

function setGrade(name) {
  state.grade = name;
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === name));
  redraw();
}

function setSize(name) {
  state.size = name;
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === name));
  redraw();
}

// Drag on the canvas pans the selected panel's photo.
let dragging = null;
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  const cells = LAYOUTS[state.layout].cells;
  for (let i = 0; i < cells.length; i++) {
    const [fx, fy, fw, fh] = cells[i];
    if (x >= fx && x < fx + fw && y >= fy && y < fy + fh) return i;
  }
  return 0;
}
canvas.addEventListener('pointerdown', (e) => {
  state.selected = panelAt(e.clientX, e.clientY);
  dragging = { x: e.clientX, y: e.clientY, panX: state.panels[state.selected].panX, panY: state.panels[state.selected].panY };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const panel = state.panels[state.selected];
  panel.panX = dragging.panX + (e.clientX - dragging.x) / rect.width;
  panel.panY = dragging.panY + (e.clientY - dragging.y) / rect.height;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  dragging = null;
});

// Controls.
document.getElementById('photo').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const file of files) {
    uploadCount += 1;
    const id = `upload-${uploadCount}`;
    const img = await loadImage(URL.createObjectURL(file));
    photos.set(id, img);
    state.panels[state.selected] = { ...state.panels[state.selected], photo: id };
  }
  statusEl.textContent = files.length ? `${files.length} photo${files.length > 1 ? 's' : ''} loaded.` : '';
  redraw();
});
document.querySelectorAll('[data-sample]').forEach((b) => {
  b.addEventListener('click', async () => {
    await loadSample(b.dataset.sample);
    state.panels[state.selected] = { ...state.panels[state.selected], photo: b.dataset.sample };
    redraw();
  });
});
document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => setLayout(b.dataset.layout)));
document.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => setGrade(b.dataset.grade)));
document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => setSize(b.dataset.size)));
captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  redraw();
});
subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  redraw();
});
document.getElementById('rain').addEventListener('input', (e) => {
  state.rain = Number(e.target.value);
  redraw();
});
document.getElementById('vignette').addEventListener('change', (e) => {
  state.vignette = e.target.checked;
  redraw();
});
document.getElementById('export').addEventListener('click', () => {
  const size = SIZES[state.size];
  canvas.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rain-city-cover-${size.w}x${size.h}.png`;
    a.click();
    statusEl.textContent = `Saved rain-city-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
});

// Boot: load the default sample, then draw. A ?shot= query takes over instead.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    loadSample,
    setState(next) {
      Object.assign(state, next);
      captionInput.value = state.caption;
      subtitleInput.value = state.subtitle;
      document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
      document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
      document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
    },
    redraw,
  });
} else {
  loadSample('rain-street').then(redraw);
}
