// The Carpenter: the export tool. Runs entirely in the browser on the
// model built from the token files. No uploads, no server calls; official
// files are fetched from this site's own static tree when requested.
import model from '../generated/model.json';
import { GENERATORS, GROUPS, officialFor, bundle } from '../generators/index.js';
import { defaultPrefix } from '../generators/common.js';
import { contrast, grade } from '../colour/wcag.js';
import { simulate, orderForCvd, CVD_TYPES, CVD_LABELS, worstDeltaE } from '../colour/cvd.js';
import { walkTokens } from '../model/token.js';
import { announce, copyText } from '../site.js';

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, attrs = {}, children = []) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) if (c != null) e.append(c);
  return e;
};
const setSw = (node, hex) => { node.style.setProperty('--sw', hex); return node; };

const state = {
  family: model.order[0],
  mode: 'both',
  prefix: defaultPrefix(model.order[0]),
  accents: [],       // ordered ids
  enabled: new Set(), // enabled ids
  count: 0,
};

const fam = () => model.families[state.family];
const options = () => ({
  mode: state.mode,
  prefix: state.prefix || defaultPrefix(state.family),
  accents: state.accents.filter((id) => state.enabled.has(id)),
});

// ---- Choose --------------------------------------------------------------

function initFamily() {
  const params = new URLSearchParams(location.search);
  const wanted = params.get('family');
  if (wanted && model.order.includes(wanted)) state.family = wanted;
  $('#c-family').value = state.family;
  resetAccents();
  $('#c-prefix').value = state.prefix = defaultPrefix(state.family);
  $('#c-prefix').placeholder = defaultPrefix(state.family);
}

function resetAccents() {
  state.accents = fam().accents.map((a) => a.id);
  state.enabled = new Set(state.accents);
  state.count = state.accents.length;
  const count = $('#c-count');
  count.replaceChildren(...state.accents.map((_, i) => el('option', { value: i + 1, text: `${i + 1} of ${state.accents.length}` })));
  count.value = String(state.count);
  $('#c-order-result').replaceChildren();
}

function renderAccents() {
  const list = $('#c-accents');
  const f = fam();
  const previewMode = state.mode === 'light' ? 'light' : 'dark';
  list.replaceChildren(...state.accents.map((id, i) => {
    const a = f.accents.find((x) => x.id === id);
    const on = state.enabled.has(id);
    const box = el('input', { type: 'checkbox', checked: on, 'aria-label': `Include ${a.label}`, onchange: (e) => {
      if (e.target.checked) state.enabled.add(id); else state.enabled.delete(id);
      update();
    } });
    return el('li', { class: on ? '' : 'off' }, [
      el('span', { class: 'pos', text: String(i + 1) }),
      setSw(el('span', { class: 'chip', 'aria-hidden': 'true' }), a[previewMode].hex),
      el('label', {}, [box, ` ${a.label}`]),
      el('button', { type: 'button', 'aria-label': `Move ${a.label} up`, text: '↑', disabled: i === 0, onclick: () => move(i, -1) }),
      el('button', { type: 'button', 'aria-label': `Move ${a.label} down`, text: '↓', disabled: i === state.accents.length - 1, onclick: () => move(i, 1) }),
    ]);
  }));
}

function move(i, d) {
  const j = i + d;
  if (j < 0 || j >= state.accents.length) return;
  [state.accents[i], state.accents[j]] = [state.accents[j], state.accents[i]];
  update();
}

function orderForDistance() {
  const f = fam();
  const previewMode = state.mode === 'light' ? 'light' : 'dark';
  const items = state.accents.filter((id) => state.enabled.has(id)).map((id) => ({ id, hex: f.accents.find((a) => a.id === id)[previewMode].hex }));
  if (items.length < 2) { announce('Tick at least two accents first'); return; }
  const n = Math.min(state.count, items.length);
  const { order, worstPair, worstAdjacent } = orderForCvd(items, n);
  const chosen = order.map((o) => o.id);
  state.accents = [...chosen, ...state.accents.filter((id) => !chosen.includes(id))];
  state.enabled = new Set(chosen);
  const label = (id) => f.accents.find((a) => a.id === id).label;
  const result = $('#c-order-result');
  result.replaceChildren(
    el('p', {}, [
      `Kept ${chosen.length} of ${items.length}, measured on the ${previewMode} variants. `,
      el('strong', { text: `Worst pair: ${label(worstPair.a)} and ${label(worstPair.b)}, ΔE ${worstPair.deltaE.toFixed(1)} under ${CVD_LABELS[worstPair.type]}.` }),
      worstAdjacent ? ` Worst adjacent pair: ${label(worstAdjacent.a)} and ${label(worstAdjacent.b)}, ΔE ${worstAdjacent.deltaE.toFixed(1)} under ${CVD_LABELS[worstAdjacent.type]}. Below about 10 two colours stop reading as distinct.` : '',
    ]),
    el('div', { class: 'sim-row' }, [
      simStrip('As designed', order.map((o) => o.hex)),
      ...CVD_TYPES.map((t) => simStrip(CVD_LABELS[t], order.map((o) => simulate(o.hex, t)))),
    ]),
  );
  announce(`Ordered ${chosen.length} accents; worst pair ΔE ${worstPair.deltaE.toFixed(1)}`);
  update();
}

function simStrip(label, hexes) {
  return el('div', { class: 'sim' }, [
    el('span', { text: label }),
    el('div', { class: 'strip', role: 'img', 'aria-label': `${label}: ${hexes.join(', ')}` }, hexes.map((h) => setSw(el('span'), h))),
  ]);
}

// ---- Outputs -------------------------------------------------------------

const officialCache = new Map();
async function fetchOfficial(url) {
  if (!officialCache.has(url)) {
    officialCache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.text(); }));
  }
  return officialCache.get(url);
}

function download(name, content, mime) {
  const blob = new Blob([content], { type: mime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderOutputs() {
  const host = $('#c-outputs');
  host.replaceChildren(...GROUPS.map((g) => el('div', {}, [
    el('h3', { text: g.label }),
    ...GENERATORS.filter((x) => x.group === g.id).map((gen) => outputCard(gen)),
  ])));
}

function outputCard(gen) {
  const f = fam();
  const official = officialFor(f, gen.id, state.mode);
  const files = gen.generate(f, options());
  const details = el('details', { class: 'output', 'data-generator': gen.id });
  const summary = el('summary', {}, [
    el('span', { class: 'name', text: gen.label }),
    official.length ? el('span', { class: 'badge official', text: 'official' }) : el('span', { class: 'badge', text: 'generated' }),
    el('span', { class: 'files', text: files.map((x) => x.name).join(', ') }),
  ]);
  const body = el('div', { class: 'body' });
  details.append(summary, body);
  const variants = [
    ...official.map((o) => ({ kind: 'official', label: `${o.name} (official${o.mode === 'both' ? ', both modes' : ', ' + o.mode})`, name: o.name, url: o.url, path: o.path })),
    ...files.map((x) => ({ kind: 'generated', label: `${x.name} (generated)`, file: x })),
  ];
  let current = 0;
  const render = async () => {
    const v = variants[current];
    body.replaceChildren();
    if (variants.length > 1) {
      body.append(el('div', { class: 'variants seg', role: 'group', 'aria-label': 'File' }, variants.map((x, i) =>
        el('label', {}, [el('input', { type: 'radio', name: `v-${gen.id}`, checked: i === current, onchange: () => { current = i; render(); } }), ` ${x.label}`]))));
    }
    const pre = el('pre', { tabindex: '0' });
    const code = el('code');
    pre.append(code);
    let content, name, mime;
    if (v.kind === 'official') {
      name = v.name; mime = 'text/plain';
      code.textContent = 'Loading the official file…';
      try { content = await fetchOfficial(v.url); code.textContent = content; }
      catch { code.textContent = 'The official file could not be loaded; the repository link below has it.'; }
    } else {
      name = v.file.name; mime = v.file.mime; content = v.file.content;
      code.textContent = typeof content === 'string' ? content : `Binary file, ${content.length} bytes. Download it below.`;
    }
    const toolbar = el('div', { class: 'toolbar' }, [
      el('button', { type: 'button', text: 'Copy', disabled: typeof content !== 'string', onclick: async () => {
        const ok = await copyText(content);
        announce(ok ? `Copied ${name}` : 'Could not copy');
      } }),
      el('button', { type: 'button', class: 'quiet', text: `Download ${name}`, onclick: () => download(name, content, mime) }),
      v.kind === 'official' ? el('a', { href: `${f.repo}/blob/main/${v.path}`, text: 'In the repository' }) : null,
    ]);
    body.append(toolbar, pre);
    if (v.kind === 'official') body.append(el('p', { class: 'note', text: `Copied verbatim from ${f.name} ${f.version} at ${v.path}.` }));
    else if (official.length) body.append(el('p', { class: 'note', text: 'The family ships its own file for this target; the generated one follows the shared Gam mapping instead.' }));
    if (gen.id === 'ghostty' || gen.id === 'alacritty' || gen.id === 'kitty' || gen.id === 'wezterm' || gen.id === 'tmux' || gen.id === 'windows-terminal' || gen.id === 'iterm2') {
      const modes = state.mode === 'both' ? ['dark', 'light'] : [state.mode];
      const generatedTerm = modes.filter((m) => f.modes[m].terminal.origin === 'generated');
      if (generatedTerm.length && v.kind === 'generated') body.append(el('p', { class: 'note', text: `The ${generatedTerm.join(' and ')} terminal palette is derived by Gam; the family does not ship one.` }));
    }
  };
  details.addEventListener('toggle', () => { if (details.open) render(); });
  details._rerender = () => { if (details.open) render(); };
  return details;
}

async function downloadZip() {
  const f = fam();
  const btn = $('#c-zip');
  btn.disabled = true;
  try {
    const official = [];
    for (const gen of GENERATORS) {
      for (const o of officialFor(f, gen.id, state.mode)) {
        try { official.push({ name: o.name, content: await fetchOfficial(o.url) }); } catch { /* skip */ }
      }
    }
    const zip = bundle(f, options(), official);
    download(`${f.id}-${state.mode}-gam.zip`, zip, 'application/zip');
    announce('Zip ready');
  } finally {
    btn.disabled = false;
  }
}

function update() {
  renderAccents();
  const host = $('#c-outputs');
  if (!host.children.length || host.dataset.current !== state.family) {
    renderOutputs();
    host.dataset.current = state.family;
  } else {
    // Refresh names and open previews in place.
    for (const details of host.querySelectorAll('details.output')) {
      const gen = GENERATORS.find((g) => g.id === details.dataset.generator);
      const files = gen.generate(fam(), options());
      $('.files', details).textContent = files.map((x) => x.name).join(', ');
      const official = officialFor(fam(), gen.id, state.mode);
      const badge = $('.badge', details);
      badge.textContent = official.length ? 'official' : 'generated';
      badge.className = official.length ? 'badge official' : 'badge';
      details._rerender();
    }
  }
}

// ---- Contrast checker ---------------------------------------------------

function tokenList(family) {
  const f = model.families[family];
  const seen = new Map();
  for (const t of walkTokens(f)) {
    const key = t.alias || t.id;
    if (!seen.has(key)) seen.set(key, { id: key, label: t.alias ? (f.scale.steps.find((s) => s.id === key) || {}).label || t.label : t.label, hex: t.hex });
  }
  return [...seen.values()];
}

function fillTokenSelect(select, family, keepHex) {
  const list = tokenList(family);
  select.replaceChildren(...list.map((t) => el('option', { value: t.id, text: `${t.label} ${t.hex}` })));
  const match = keepHex && list.find((t) => t.hex === keepHex);
  if (match) select.value = match.id;
}

function checker() {
  const fgFam = $('#k-fg-family'), bgFam = $('#k-bg-family'), fg = $('#k-fg'), bg = $('#k-bg');
  for (const s of [fgFam, bgFam]) s.replaceChildren(...model.order.map((id) => el('option', { value: id, text: model.families[id].name })));
  fgFam.value = state.family; bgFam.value = state.family;
  fillTokenSelect(fg, state.family);
  fillTokenSelect(bg, state.family);
  const f = model.families[state.family];
  fg.value = f.modes.dark.roles.text.alias || f.modes.dark.roles.text.id;
  bg.value = f.modes.dark.roles.bg.alias || f.modes.dark.roles.bg.id;
  const show = () => {
    const a = tokenList(fgFam.value).find((t) => t.id === fg.value);
    const b = tokenList(bgFam.value).find((t) => t.id === bg.value);
    if (!a || !b) return;
    const ratio = contrast(a.hex, b.hex);
    const g = grade(ratio);
    const card = (label, fgHex, bgHex) => {
      const c = el('div', { class: 'k-card' });
      const demo = el('div', { class: 'demo' }, [el('strong', { text: 'Ahab' }), 'Call me Ishmael. Some years ago, never mind how long precisely.']);
      demo.style.setProperty('--sw-bg', bgHex);
      demo.style.setProperty('--sw-fg', fgHex);
      const r = contrast(fgHex, bgHex);
      c.append(demo, el('div', { class: 'meta' }, [
        el('div', { text: label }),
        el('div', { class: 'ratio', text: `${r.toFixed(2)}:1 ${grade(r)}` }),
        el('div', {}, [el('code', { text: fgHex }), ' on ', el('code', { text: bgHex })]),
      ]));
      return c;
    };
    const worst = worstDeltaE(a.hex, b.hex);
    $('#k-result').replaceChildren(
      el('div', { class: 'k-summary' }, [
        el('span', { class: 'ratio', text: `${ratio.toFixed(2)}:1` }),
        el('span', { class: `badge ${ratio >= 4.5 ? 'pass' : 'fail'}`, text: `AA ${ratio >= 4.5 ? 'passes' : 'fails'}` }),
        el('span', { class: `badge ${ratio >= 3 ? 'pass' : 'fail'}`, text: `AA large ${ratio >= 3 ? 'passes' : 'fails'}` }),
        el('span', { class: `badge ${ratio >= 7 ? 'pass' : 'fail'}`, text: `AAA ${ratio >= 7 ? 'passes' : 'fails'}` }),
        el('span', { class: 'muted', text: `Grade ${g}. Colour difference in the least favourable simulation: ΔE ${worst.deltaE.toFixed(1)} (${CVD_LABELS[worst.type]}).` }),
      ]),
      el('div', { class: 'k-pair' }, [
        card('As designed', a.hex, b.hex),
        ...CVD_TYPES.map((t) => card(CVD_LABELS[t], simulate(a.hex, t), simulate(b.hex, t))),
      ]),
    );
  };
  fgFam.addEventListener('change', () => { fillTokenSelect(fg, fgFam.value); show(); });
  bgFam.addEventListener('change', () => { fillTokenSelect(bg, bgFam.value); show(); });
  fg.addEventListener('change', show);
  bg.addEventListener('change', show);
  show();
  return { setFamily: (id) => { fgFam.value = id; bgFam.value = id; fillTokenSelect(fg, id); fillTokenSelect(bg, id); show(); } };
}

// ---- Wire up -------------------------------------------------------------

initFamily();
const check = checker();
$('#c-family').addEventListener('change', (e) => {
  state.family = e.target.value;
  $('#c-prefix').value = state.prefix = defaultPrefix(state.family);
  $('#c-prefix').placeholder = defaultPrefix(state.family);
  resetAccents();
  update();
  check.setFamily(state.family);
  const url = new URL(location.href);
  url.searchParams.set('family', state.family);
  history.replaceState(null, '', url);
});
$('#bench').addEventListener('change', (e) => {
  if (e.target.name === 'mode') { state.mode = e.target.value; update(); }
});
$('#c-prefix').addEventListener('input', (e) => {
  const v = e.target.value.trim();
  state.prefix = /^[a-zA-Z][a-zA-Z0-9-]*$/.test(v) ? v : defaultPrefix(state.family);
  update();
});
$('#c-count').addEventListener('change', (e) => { state.count = Number(e.target.value); });
$('#c-order').addEventListener('click', orderForDistance);
$('#c-zip').addEventListener('click', downloadZip);
$('#bench').addEventListener('submit', (e) => e.preventDefault());
update();
