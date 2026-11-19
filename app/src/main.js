// Vice Cover Studio — the editor: upload, samples, layouts, per-panel crop,
// grades, captions and PNG export. Plain ES module, no network requests.
import { SIZES, LAYOUTS, GRADES, blankPanel, renderCover, exportPng, loadImage, ensureFont } from './cover.js';
import { runShot } from './shots.js';

const SAMPLES = [
  { id: 'boulevard', label: 'Boulevard', file: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'Pier night', file: 'samples/pier.jpg' },
  { id: 'rooftop', label: 'Rooftop', file: 'samples/rooftop.jpg' },
];

const state = {
  layout: 'hero',
  grade: 'sunset',
  gradeStrength: 0.7,
  caption: 'Sunset Heist',
  subtitle: 'One night in the neon city',
  titleSize: 1,
  titleColor: '#ffffff',
  showSub: true,
  panels: [blankPanel('boulevard')],
  activePanel: 0,
};

const images = {}; // id -> HTMLImageElement (samples + the uploaded photo as 'upload')
let uploadedName = null;

const $ = (id) => document.getElementById(id);
const canvas = $('cover');

function panelCount() {
  return LAYOUTS[state.layout].length;
}

function syncPanels() {
  const n = panelCount();
  while (state.panels.length < n) {
    // New panels cycle through the samples so a multi-panel poster starts varied.
    state.panels.push(blankPanel(SAMPLES[state.panels.length % SAMPLES.length].id));
  }
  state.panels.length = n;
  if (state.activePanel >= n) state.activePanel = 0;
}

function render() {
  syncPanels();
  renderCover(canvas, images, state);
}

function photoOptions() {
  const opts = [...SAMPLES.map((s) => ({ id: s.id, label: s.label }))];
  if (uploadedName) opts.push({ id: 'upload', label: `Uploaded: ${uploadedName}` });
  return opts;
}

function buildSamples() {
  const box = $('samples');
  box.innerHTML = '';
  SAMPLES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.photo = s.id;
    b.innerHTML = `<img src="./${s.file}" alt="${s.label} sample photo"><span>${s.label}</span>`;
    b.addEventListener('click', () => {
      state.panels[state.activePanel].photo = s.id;
      refreshPanelUI();
      render();
    });
    box.appendChild(b);
  });
}

function buildPanelPick() {
  const box = $('panelPick');
  box.innerHTML = '';
  for (let i = 0; i < panelCount(); i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `Panel ${i + 1}`;
    b.classList.toggle('on', i === state.activePanel);
    b.addEventListener('click', () => {
      state.activePanel = i;
      refreshPanelUI();
    });
    box.appendChild(b);
  }
}

function refreshPanelUI() {
  buildPanelPick();
  const panel = state.panels[state.activePanel];
  const sel = $('panelPhoto');
  sel.innerHTML = '';
  photoOptions().forEach((o) => {
    const opt = document.createElement('option');
    opt.value = o.id;
    opt.textContent = o.label;
    if (o.id === panel.photo) opt.selected = true;
    sel.appendChild(opt);
  });
  $('zoom').value = panel.zoom;
  $('panX').value = panel.panX;
  $('panY').value = panel.panY;
  $('zoomVal').textContent = `${Number(panel.zoom).toFixed(2)}×`;
  $('panXVal').textContent = Number(panel.panX).toFixed(2);
  $('panYVal').textContent = Number(panel.panY).toFixed(2);
  document.querySelectorAll('#samples button').forEach((b) => {
    b.classList.toggle('on', b.dataset.photo === panel.photo);
  });
}

function segWire(id, key, after) {
  document.querySelectorAll(`#${id} button`).forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll(`#${id} button`).forEach((x) => x.classList.toggle('on', x === b));
      state[key] = b.dataset[key];
      after?.();
      refreshPanelUI();
      render();
    });
  });
}

function bindControls() {
  segWire('layoutSeg', 'layout', () => { state.activePanel = 0; });
  segWire('gradeSeg', 'grade');

  $('panelPhoto').addEventListener('change', (e) => {
    state.panels[state.activePanel].photo = e.target.value;
    refreshPanelUI();
    render();
  });
  const panelSlider = (id, key, fmt) => {
    $(id).addEventListener('input', (e) => {
      state.panels[state.activePanel][key] = Number(e.target.value);
      $(`${id}Val`).textContent = fmt(Number(e.target.value));
      render();
    });
  };
  panelSlider('zoom', 'zoom', (v) => `${v.toFixed(2)}×`);
  panelSlider('panX', 'panX', (v) => v.toFixed(2));
  panelSlider('panY', 'panY', (v) => v.toFixed(2));

  $('gradeStrength').addEventListener('input', (e) => {
    state.gradeStrength = Number(e.target.value);
    $('gradeVal').textContent = `${Math.round(state.gradeStrength * 100)}%`;
    render();
  });
  $('caption').addEventListener('input', (e) => { state.caption = e.target.value; render(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
  $('titleSize').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value);
    $('titleVal').textContent = `${Math.round(state.titleSize * 100)}%`;
    render();
  });
  $('titleColor').addEventListener('change', (e) => { state.titleColor = e.target.value; render(); });
  $('showSub').addEventListener('change', (e) => { state.showSub = e.target.checked; render(); });

  $('photo').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      images.upload = await loadImage(url);
      uploadedName = file.name.length > 24 ? `${file.name.slice(0, 21)}…` : file.name;
      state.panels[state.activePanel].photo = 'upload';
      $('photoHint').textContent = `Using your photo: ${file.name}. It is also in the per-panel photo list.`;
      refreshPanelUI();
      render();
    } catch {
      $('status').textContent = 'That file could not be read as an image.';
    }
  });

  const doExport = async (sizeKey) => {
    const size = SIZES[sizeKey];
    $('status').textContent = `Rendering ${size.label} PNG…`;
    try {
      const blob = await exportPng(images, state, sizeKey);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vice-cover-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      $('status').textContent = `Exported ${size.label} PNG (${(blob.size / 1024).toFixed(0)} KB).`;
    } catch (err) {
      $('status').textContent = `Export failed: ${err.message}`;
    }
  };
  $('exportSquare').addEventListener('click', () => doExport('square'));
  $('exportPortrait').addEventListener('click', () => doExport('portrait'));
  $('exportWide').addEventListener('click', () => doExport('wide'));
  $('reset').addEventListener('click', () => {
    state.layout = 'hero3';
    state.grade = 'sunset';
    state.gradeStrength = 0.7;
    state.caption = 'Boulevard Queen';
    state.subtitle = 'One night in the neon city';
    state.titleSize = 1;
    state.titleColor = '#ffffff';
    state.showSub = true;
    state.panels = [blankPanel('boulevard'), blankPanel('pier'), blankPanel('rooftop'), blankPanel('boulevard')];
    state.activePanel = 0;
    $('caption').value = state.caption;
    $('subtitle').value = state.subtitle;
    $('gradeStrength').value = state.gradeStrength;
    $('titleSize').value = state.titleSize;
    $('titleColor').value = state.titleColor;
    $('showSub').checked = true;
    document.querySelectorAll('#layoutSeg button').forEach((x) => x.classList.toggle('on', x.dataset.layout === 'hero3'));
    document.querySelectorAll('#gradeSeg button').forEach((x) => x.classList.toggle('on', x.dataset.grade === 'sunset'));
    refreshPanelUI();
    render();
    $('status').textContent = 'Reset to the Boulevard Queen poster.';
  });
}

async function boot() {
  buildSamples();
  bindControls();
  // Load the samples up front so every layout works offline immediately.
  for (const s of SAMPLES) {
    try { images[s.id] = await loadImage(`./${s.file}`); } catch { /* a missing sample just leaves its panel dark */ }
  }
  await ensureFont();
  refreshPanelUI();
  render();

  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) {
    // Shot params may pick the layout, grade and caption for the scene.
    const layout = query.get('layout');
    if (layout && LAYOUTS[layout]) {
      state.layout = layout;
      document.querySelectorAll('#layoutSeg button').forEach((x) => x.classList.toggle('on', x.dataset.layout === layout));
    }
    const grade = query.get('grade');
    if (grade && GRADES[grade]) {
      state.grade = grade;
      document.querySelectorAll('#gradeSeg button').forEach((x) => x.classList.toggle('on', x.dataset.grade === grade));
    }
    await runShot(shot, query, async (photo, caption) => {
      syncPanels();
      // Spread the photos across the panels: the requested photo first, then
      // the other samples in turn, so neighbours never repeat.
      const start = SAMPLES.findIndex((s) => s.id === photo);
      const base = start >= 0 ? start : 0;
      state.panels.forEach((p, i) => {
        p.photo = images[SAMPLES[(base + i) % SAMPLES.length].id]
          ? SAMPLES[(base + i) % SAMPLES.length].id
          : p.photo;
      });
      if (caption) {
        state.caption = caption;
        $('caption').value = caption;
      }
      render();
    }, canvas);
  } else {
    window.__shotReady = true;
  }
}

boot();
