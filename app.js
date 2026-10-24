// Color Palette: makes color palettes with shades, a contrast check and code to copy. Everything runs in the browser.

// ---------- helpers ----------

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function detectLang() {
  return (navigator.language || '').toLowerCase().match(/^(nb|nn|no)/) ? 'nb' : 'en';
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.remove(), 2200);
}

async function copyText(text, okMsg, promptMsg) {
  try {
    await navigator.clipboard.writeText(text);
    toast(okMsg);
  } catch {
    prompt(promptMsg, text);
  }
}

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

// Shared links carry their data in the #fragment, which browsers never send to a server.
function encodeHash(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeHash(str) {
  try {
    const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, ch => ch.charCodeAt(0))));
  } catch {
    return null;
  }
}

// ---------- texts ----------

const T = {
  en: {
    appName: 'Color Palette', tagline: 'Free. No sign-up. Nothing leaves your browser.',
    harmony: 'Style', h_auto: 'Surprise me', h_analogous: 'Analogous', h_complementary: 'Complementary', h_triadic: 'Triadic', h_mono: 'One color',
    share: 'Copy link', savePalette: 'Save palette', shuffle: 'New colors',
    spaceHint: 'Press Space for new colors. Lock the ones you like and they stay.',
    lock: 'Lock this color', unlock: 'Unlock this color', copy: 'Copy', pick: 'Pick a color', edit: 'Hex code',
    shadesTitle: 'Shades', shadesOf: 'of {hex}', shadesHint: 'Click a shade to copy it. Light shades work as backgrounds, dark shades as text.',
    contrastTitle: 'Is the text readable?', textColor: 'Text', bgColor: 'Background', white: 'White', black: 'Black',
    sampleTitle: 'Big heading', sampleText: 'Normal text should be easy to read for everyone, also on a phone in the sun.', sampleButton: 'Button',
    ratio: 'Contrast {r} : 1', normalText: 'Normal text', largeText: 'Large text', pass: 'Pass', fail: 'Too low',
    verdictGood: 'Easy to read.', verdictLarge: 'Fine for big headings, too weak for normal text.', verdictBad: 'Hard to read. Pick colors further apart in lightness.',
    exportTitle: 'Use it in your code', withShades: 'Include shades', copyCode: 'Copy code',
    savedTitle: 'Saved palettes', noSaved: 'Palettes you save show up here, in this browser.', load: 'Use', remove: 'Remove',
    copied: 'Copied {v}', linkCopied: 'Link copied', copyPrompt: 'Copy:', saved: 'Palette saved',
    privacy: 'Everything stays in this browser. There is no server, no account and no tracking.',
    madeBy: 'An example app by the Kodeby team.', source: 'Source code', color: 'Color {n}',
  },
  nb: {
    appName: 'Fargepalett', tagline: 'Gratis. Ingen konto. Ingenting forlater nettleseren.',
    harmony: 'Stil', h_auto: 'Overrask meg', h_analogous: 'Nabofarger', h_complementary: 'Komplementær', h_triadic: 'Triade', h_mono: 'Én farge',
    share: 'Kopier lenke', savePalette: 'Lagre palett', shuffle: 'Nye farger',
    spaceHint: 'Trykk mellomrom for nye farger. Lås dem du liker, så blir de stående.',
    lock: 'Lås denne fargen', unlock: 'Lås opp denne fargen', copy: 'Kopier', pick: 'Velg en farge', edit: 'Heksadesimal kode',
    shadesTitle: 'Nyanser', shadesOf: 'av {hex}', shadesHint: 'Klikk på en nyanse for å kopiere den. Lyse nyanser passer som bakgrunn, mørke som tekst.',
    contrastTitle: 'Er teksten lett å lese?', textColor: 'Tekst', bgColor: 'Bakgrunn', white: 'Hvit', black: 'Svart',
    sampleTitle: 'Stor overskrift', sampleText: 'Vanlig tekst skal være lett å lese for alle, også på mobilen i sola.', sampleButton: 'Knapp',
    ratio: 'Kontrast {r} : 1', normalText: 'Vanlig tekst', largeText: 'Stor tekst', pass: 'Bestått', fail: 'For lav',
    verdictGood: 'Lett å lese.', verdictLarge: 'Greit for store overskrifter, for svakt for vanlig tekst.', verdictBad: 'Vanskelig å lese. Velg farger med større forskjell i lyshet.',
    exportTitle: 'Bruk den i koden din', withShades: 'Ta med nyanser', copyCode: 'Kopier koden',
    savedTitle: 'Lagrede paletter', noSaved: 'Paletter du lagrer dukker opp her, i denne nettleseren.', load: 'Bruk', remove: 'Fjern',
    copied: 'Kopierte {v}', linkCopied: 'Lenken er kopiert', copyPrompt: 'Kopier:', saved: 'Paletten er lagret',
    privacy: 'Alt blir i denne nettleseren. Det er ingen server, ingen konto og ingen sporing.',
    madeBy: 'En eksempelapp fra Kodeby-teamet.', source: 'Kildekode', color: 'Farge {n}',
  },
};

const STORAGE_KEY = 'color-palette-v1';
const HEX_RE = /^#[0-9a-f]{6}$/;
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const STEP_L = [0.975, 0.94, 0.88, 0.8, 0.71, 0.62, 0.53, 0.45, 0.37, 0.29, 0.21];

// ---------- color math (OKLab / OKLCH) ----------

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => v / 255);
}

function rgbToHex(rgb) {
  return '#' + rgb.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');
}

const toLinear = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function rgbToOklch(rgb) {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}

function oklchToRgbRaw([L, C, H]) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(fromLinear);
}

// Lower the chroma until the color fits on a normal screen.
function oklchToHex([L, C, H]) {
  let lo = 0, hi = C;
  const fits = c => oklchToRgbRaw([L, c, H]).every(v => v >= -0.0005 && v <= 1.0005);
  if (fits(C)) return rgbToHex(oklchToRgbRaw([L, C, H]));
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) lo = mid; else hi = mid;
  }
  return rgbToHex(oklchToRgbRaw([L, lo, H]));
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

function readableOn(hex) {
  return contrast(hex, '#ffffff') >= contrast(hex, '#14122b') ? '#ffffff' : '#14122b';
}

function shades(hex) {
  const [, C, H] = rgbToOklch(hexToRgb(hex));
  return STEP_L.map(L => oklchToHex([L, C * (1 - Math.abs(L - 0.6) * 0.85), H]));
}

// ---------- palette generation ----------

const rand = (a, b) => a + Math.random() * (b - a);

function generate(colors, harmony) {
  const anchor = colors.find(c => c.locked);
  const base = anchor ? rgbToOklch(hexToRgb(anchor.hex))[2] : rand(0, 360);
  const mode = harmony === 'auto' ? ['analogous', 'complementary', 'triadic', 'mono', 'analogous'][Math.floor(rand(0, 5))] : harmony;
  const offsets = {
    analogous: [0, -28, 0, 28, 14],
    complementary: [0, 0, 180, 20, 180],
    triadic: [0, 0, 120, 240, 0],
    mono: [0, 0, 0, 0, 0],
  }[mode];
  // A useful UI palette: a dark, three colorful middles and a light.
  const spread = rand(-12, 12);
  const roles = [
    [rand(0.2, 0.3), rand(0.02, 0.06)],
    [rand(0.5, 0.62), rand(0.13, 0.2)],
    [rand(0.64, 0.76), rand(0.1, 0.17)],
    [rand(0.74, 0.86), rand(0.12, 0.18)],
    [rand(0.95, 0.985), rand(0.01, 0.03)],
  ];
  if (mode === 'mono') roles[2][0] = rand(0.38, 0.46);
  return colors.map((c, i) => (c.locked ? c : {
    hex: oklchToHex([roles[i][0], roles[i][1], (base + offsets[i] + spread * (i % 2 ? 1 : -1) + 360) % 360]),
    locked: false,
  }));
}

// ---------- state ----------

function freshState(lang) {
  const s = {
    version: 1, lang, harmony: 'auto', selected: 1, fg: 0, bg: 4, fmt: 'css', withShades: false, saved: [],
    colors: ['#1e1b3a', '#6b46e5', '#3d9bff', '#ff8358', '#f6f4ff'].map(hex => ({ hex, locked: false })),
  };
  return s;
}

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!d || d.version !== 1) return null;
    const s = freshState(d.lang === 'nb' ? 'nb' : 'en');
    if (Array.isArray(d.colors) && d.colors.length === 5 && d.colors.every(c => c && HEX_RE.test(c.hex))) {
      s.colors = d.colors.map(c => ({ hex: c.hex, locked: !!c.locked }));
    }
    if (['auto', 'analogous', 'complementary', 'triadic', 'mono'].includes(d.harmony)) s.harmony = d.harmony;
    if (['css', 'tailwind', 'scss', 'json'].includes(d.fmt)) s.fmt = d.fmt;
    for (const k of ['selected', 'fg', 'bg']) if (Number.isInteger(d[k]) && d[k] >= 0 && d[k] <= 6) s[k] = d[k];
    if (s.selected > 4) s.selected = 0;
    s.withShades = !!d.withShades;
    if (Array.isArray(d.saved)) s.saved = d.saved.filter(p => Array.isArray(p) && p.length === 5 && p.every(h => HEX_RE.test(h))).slice(0, 60);
    return s;
  } catch {
    return null;
  }
}

let state = load() || freshState(detectLang());

// A shared link opens the palette from the #fragment.
const shared = location.hash.match(/^#c=((?:[0-9a-f]{6}-){4}[0-9a-f]{6})$/i);
if (shared) {
  state.colors = shared[1].toLowerCase().split('-').map(h => ({ hex: '#' + h, locked: false }));
  history.replaceState(null, '', location.pathname + location.search);
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage blocked: still works for this visit */ }
}

function t(key, vars) {
  let s = (T[state.lang] && T[state.lang][key]) ?? T.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

// Index 5 is white and 6 is black in the contrast check.
function pairColor(i) {
  return i === 5 ? '#ffffff' : i === 6 ? '#000000' : state.colors[i].hex;
}

// ---------- rendering ----------

const LOCK = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
const UNLOCK = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 7.6-1.8" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
const DROP = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3.5c3 3.6 6 7.1 6 10.4a6 6 0 0 1-12 0c0-3.3 3-6.8 6-10.4z" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
const COPY = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

function renderSwatches() {
  $('#swatches').innerHTML = state.colors.map((c, i) => `
    <div class="swatch ${i === state.selected ? 'selected' : ''}" data-i="${i}" data-bg="${c.hex}" data-fg="${readableOn(c.hex)}">
      <button type="button" class="sw-select" aria-label="${esc(t('shadesTitle'))} ${c.hex}"></button>
      <div class="sw-tools">
        <button type="button" class="sw-btn" data-act="lock" title="${esc(t(c.locked ? 'unlock' : 'lock'))}" aria-pressed="${c.locked}">${c.locked ? LOCK : UNLOCK}</button>
        <button type="button" class="sw-btn" data-act="copy" title="${esc(t('copy'))}">${COPY}</button>
        <label class="sw-btn pick" title="${esc(t('pick'))}"><input type="color" value="${c.hex}" data-act="pick" aria-label="${esc(t('pick'))}">${DROP}</label>
      </div>
      <input class="sw-hex" value="${c.hex.slice(1).toUpperCase()}" maxlength="7" spellcheck="false" aria-label="${esc(t('edit'))}">
    </div>`).join('');
  // Colors are set through the DOM, since the Content Security Policy blocks inline style attributes.
  $$('#swatches .swatch').forEach(el => { el.style.background = el.dataset.bg; el.style.color = el.dataset.fg; });
}

function renderShades() {
  const hex = state.colors[state.selected].hex;
  $('#shades-of').textContent = t('shadesOf', { hex: hex.toUpperCase() });
  $('#shades').innerHTML = shades(hex).map((h, i) => `
    <button type="button" class="shade" data-hex="${h}" data-fg="${readableOn(h)}"><span>${STEPS[i]}</span><code>${h.slice(1).toUpperCase()}</code></button>`).join('');
  $$('#shades .shade').forEach(el => { el.style.background = el.dataset.hex; el.style.color = el.dataset.fg; });
}

function renderContrast() {
  const opts = [...state.colors.map((c, i) => `<option value="${i}">${esc(t('color', { n: i + 1 }))} · ${c.hex.toUpperCase()}</option>`),
    `<option value="5">${esc(t('white'))} · #FFFFFF</option>`, `<option value="6">${esc(t('black'))} · #000000</option>`].join('');
  $('#fg').innerHTML = opts;
  $('#bg').innerHTML = opts;
  $('#fg').value = state.fg;
  $('#bg').value = state.bg;
  const fg = pairColor(state.fg), bg = pairColor(state.bg);
  const r = contrast(fg, bg);
  const sample = $('#sample');
  sample.style.background = bg;
  sample.style.color = fg;
  sample.style.borderColor = state.bg >= 5 ? 'var(--border)' : bg;
  const btn = $('.sample-btn');
  btn.style.background = fg;
  btn.style.color = bg;
  const badge = (ok, label) => `<span class="badge ${ok ? 'ok' : 'no'}">${esc(label)} · ${esc(ok ? t('pass') : t('fail'))}</span>`;
  const verdict = r >= 4.5 ? t('verdictGood') : r >= 3 ? t('verdictLarge') : t('verdictBad');
  $('#ratio').innerHTML = `
    <strong>${esc(t('ratio', { r: r.toFixed(2) }))}</strong>
    <div class="badges">
      ${badge(r >= 4.5, `${t('normalText')} AA`)}${badge(r >= 7, `${t('normalText')} AAA`)}
      ${badge(r >= 3, `${t('largeText')} AA`)}${badge(r >= 4.5, `${t('largeText')} AAA`)}
    </div>
    <p>${esc(verdict)}</p>`;
}

function exportCode() {
  const names = state.colors.map((_, i) => `color-${i + 1}`);
  const all = state.colors.map(c => shades(c.hex));
  const lines = [];
  if (state.fmt === 'css') {
    lines.push(':root {');
    state.colors.forEach((c, i) => {
      lines.push(`  --${names[i]}: ${c.hex};`);
      if (state.withShades) all[i].forEach((h, j) => lines.push(`  --${names[i]}-${STEPS[j]}: ${h};`));
    });
    lines.push('}');
  } else if (state.fmt === 'scss') {
    state.colors.forEach((c, i) => {
      lines.push(`$${names[i]}: ${c.hex};`);
      if (state.withShades) all[i].forEach((h, j) => lines.push(`$${names[i]}-${STEPS[j]}: ${h};`));
    });
  } else if (state.fmt === 'tailwind') {
    lines.push('// tailwind.config.js', 'module.exports = {', '  theme: {', '    extend: {', '      colors: {');
    state.colors.forEach((c, i) => {
      if (!state.withShades) { lines.push(`        '${names[i]}': '${c.hex}',`); return; }
      lines.push(`        '${names[i]}': {`, `          DEFAULT: '${c.hex}',`);
      all[i].forEach((h, j) => lines.push(`          ${STEPS[j]}: '${h}',`));
      lines.push('        },');
    });
    lines.push('      },', '    },', '  },', '};');
  } else {
    const obj = {};
    state.colors.forEach((c, i) => {
      obj[names[i]] = state.withShades ? { DEFAULT: c.hex, ...Object.fromEntries(all[i].map((h, j) => [STEPS[j], h])) } : c.hex;
    });
    lines.push(JSON.stringify(obj, null, 2));
  }
  return lines.join('\n');
}

function renderExport() {
  $$('.tabs button').forEach(b => { b.classList.toggle('on', b.dataset.fmt === state.fmt); b.setAttribute('aria-selected', b.dataset.fmt === state.fmt); });
  $('#with-shades').checked = state.withShades;
  $('#code').value = exportCode();
}

function renderSaved() {
  $('#saved').innerHTML = state.saved.length ? state.saved.map((p, i) => `
    <li data-i="${i}">
      <button type="button" class="mini" data-act="load" title="${esc(t('load'))}">${p.map(h => `<span data-c="${h}"></span>`).join('')}</button>
      <button type="button" class="icon" data-act="remove" aria-label="${esc(t('remove'))}">×</button>
    </li>`).join('') : `<li class="empty">${esc(t('noSaved'))}</li>`;
  $$('#saved .mini span').forEach(el => { el.style.background = el.dataset.c; });
}

function applyLanguage() {
  document.documentElement.lang = state.lang;
  document.title = t('appName');
  $('#lang').value = state.lang;
  $('#harmony').value = state.harmony;
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
}

function renderAll() {
  applyLanguage();
  renderSwatches();
  renderShades();
  renderContrast();
  renderExport();
  renderSaved();
}

function changedColors() {
  save();
  renderSwatches();
  renderShades();
  renderContrast();
  renderExport();
}

// ---------- events ----------

function shuffle() {
  state.colors = generate(state.colors, state.harmony);
  changedColors();
}

$('#btn-shuffle').addEventListener('click', shuffle);
document.addEventListener('keydown', e => {
  if (e.code !== 'Space' || e.target.closest('input, textarea, select, button, dialog')) return;
  e.preventDefault();
  shuffle();
});

$('#swatches').addEventListener('click', e => {
  const sw = e.target.closest('.swatch');
  if (!sw) return;
  const i = Number(sw.dataset.i);
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'lock') {
    state.colors[i].locked = !state.colors[i].locked;
    save();
    renderSwatches();
  } else if (act === 'copy') {
    copyText(state.colors[i].hex.toUpperCase(), t('copied', { v: state.colors[i].hex.toUpperCase() }), t('copyPrompt'));
  } else if (e.target.closest('.sw-select') && state.selected !== i) {
    state.selected = i;
    save();
    renderSwatches();
    renderShades();
  }
});

function setColor(i, hex) {
  state.colors[i].hex = hex;
  state.colors[i].locked = true;
  save();
  const sw = $(`#swatches .swatch[data-i="${i}"]`);
  sw.style.background = hex;
  sw.style.color = readableOn(hex);
  renderShades();
  renderContrast();
  renderExport();
}

$('#swatches').addEventListener('input', e => {
  const sw = e.target.closest('.swatch');
  if (!sw) return;
  const i = Number(sw.dataset.i);
  if (e.target.dataset.act === 'pick') {
    setColor(i, e.target.value.toLowerCase());
    sw.querySelector('.sw-hex').value = e.target.value.slice(1).toUpperCase();
  } else if (e.target.classList.contains('sw-hex')) {
    let v = e.target.value.trim().replace(/^#/, '').toLowerCase();
    if (/^[0-9a-f]{3}$/.test(v)) v = v.split('').map(ch => ch + ch).join('');
    if (/^[0-9a-f]{6}$/.test(v)) setColor(i, '#' + v);
  }
});
$('#swatches').addEventListener('change', () => renderSwatches());

$('#shades').addEventListener('click', e => {
  const b = e.target.closest('.shade');
  if (b) copyText(b.dataset.hex.toUpperCase(), t('copied', { v: b.dataset.hex.toUpperCase() }), t('copyPrompt'));
});

$('#fg').addEventListener('change', e => { state.fg = Number(e.target.value); save(); renderContrast(); });
$('#bg').addEventListener('change', e => { state.bg = Number(e.target.value); save(); renderContrast(); });

$$('.tabs button').forEach(b => b.addEventListener('click', () => { state.fmt = b.dataset.fmt; save(); renderExport(); }));
$('#with-shades').addEventListener('change', e => { state.withShades = e.target.checked; save(); renderExport(); });
$('#btn-copy-code').addEventListener('click', () => copyText($('#code').value, t('copied', { v: state.fmt.toUpperCase() }), t('copyPrompt')));

$('#btn-share').addEventListener('click', () => {
  const link = `${location.origin}${location.pathname}#c=${state.colors.map(c => c.hex.slice(1)).join('-')}`;
  copyText(link, t('linkCopied'), t('copyPrompt'));
});

$('#btn-save').addEventListener('click', () => {
  const p = state.colors.map(c => c.hex);
  if (!state.saved.some(x => x.join() === p.join())) state.saved.unshift(p);
  save();
  renderSaved();
  toast(t('saved'));
});

$('#saved').addEventListener('click', e => {
  const li = e.target.closest('li[data-i]');
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (!li || !act) return;
  const i = Number(li.dataset.i);
  if (act === 'load') state.colors = state.saved[i].map(hex => ({ hex, locked: false }));
  else state.saved.splice(i, 1);
  save();
  renderAll();
});

$('#harmony').addEventListener('change', e => { state.harmony = e.target.value; save(); shuffle(); });

$('#lang').addEventListener('change', e => {
  state.lang = e.target.value === 'nb' ? 'nb' : 'en';
  save();
  renderAll();
});

save();
renderAll();
