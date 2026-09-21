// Progressive behaviour for every page: the family and mode switcher,
// swatches that copy their hex, and a toast that is also announced to
// screen readers. Reading pages render fully without this file.
import model from './generated/meta.json';

const root = document.documentElement;
const STORAGE_KEY = 'gam-theme';

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function store(theme) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(theme)); } catch { /* storage unavailable */ }
}

function currentTheme() {
  const t = readStored();
  return {
    family: model.order.includes(t.family) ? t.family : model.order[0],
    mode: t.mode === 'dark' || t.mode === 'light' ? t.mode : 'system',
  };
}

function apply(theme) {
  if (theme.family === model.order[0]) root.removeAttribute('data-family'); else root.setAttribute('data-family', theme.family);
  if (theme.mode === 'system') root.removeAttribute('data-mode'); else root.setAttribute('data-mode', theme.mode);
  const fam = model.families[theme.family];
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  metas.forEach((m) => {
    const scheme = m.media && m.media.includes('dark') ? 'dark' : 'light';
    const mode = theme.mode === 'system' ? scheme : theme.mode;
    m.setAttribute('content', fam.bg[mode]);
  });
  document.dispatchEvent(new CustomEvent('gam:theme', { detail: theme }));
}

export function announce(text) {
  const live = document.getElementById('announce');
  if (live) { live.textContent = ''; setTimeout(() => { live.textContent = text; }, 30); }
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('aria-hidden', 'true');
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 1800);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.className = 'visually-hidden';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

function buildSwitcher() {
  const host = document.getElementById('theme-switch');
  if (!host) return;
  const theme = currentTheme();
  const famLabel = document.createElement('label');
  famLabel.htmlFor = 'family-select';
  famLabel.textContent = 'Family';
  const select = document.createElement('select');
  select.id = 'family-select';
  for (const id of model.order) {
    const o = document.createElement('option');
    o.value = id;
    o.textContent = model.families[id].name;
    if (id === theme.family) o.selected = true;
    select.appendChild(o);
  }
  const seg = document.createElement('fieldset');
  seg.className = 'seg';
  seg.setAttribute('aria-label', 'Colour scheme');
  for (const [value, label] of [['system', 'System'], ['dark', 'Dark'], ['light', 'Light']]) {
    const l = document.createElement('label');
    const i = document.createElement('input');
    i.type = 'radio';
    i.name = 'site-mode';
    i.value = value;
    i.checked = theme.mode === value;
    l.appendChild(i);
    l.appendChild(document.createTextNode(' ' + label));
    seg.appendChild(l);
  }
  host.append(famLabel, select, seg);
  const update = () => {
    const next = { family: select.value, mode: seg.querySelector('input:checked').value };
    store(next);
    apply(next);
  };
  select.addEventListener('change', update);
  seg.addEventListener('change', update);
  apply(theme);
}

function wireSwatches() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-hex]');
    if (!btn) return;
    const hex = btn.getAttribute('data-hex');
    const ok = await copyText(hex);
    announce(ok ? `Copied ${hex}` : `Could not copy; the value is ${hex}`);
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 1200);
  });
}

buildSwitcher();
wireSwatches();

export { model, currentTheme };
