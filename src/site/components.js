// Page fragments shared by several routes.
import { html, raw, escape, swatchClass } from './html.js';
import { proseSample, codeSample, chartSvg } from '../content/samples.js';
import { contrast, grade } from '../colour/wcag.js';

export const familyHref = (id) => `/${id}/`;

/** A strip of the family's base scale. */
export function scaleStrip(fam) {
  return html`<div class="strip" role="img" aria-label="${fam.scale.name} scale, ${fam.scale.steps.length} steps">${fam.scale.steps.map((s) => raw(`<span class="${swatchClass(fam.id, s)}" title="${escape(s.label)} ${s.hex}"></span>`))}</div>`;
}

/** Accent dots for one mode. */
export function accentDots(fam, mode) {
  const list = fam.accents.map((a) => a[mode]);
  return html`<div class="strip dots" role="img" aria-label="${fam.accents.length} accents, ${mode}">${fam.accents.map((a) => raw(`<span class="${swatchClass(fam.id, a[mode])}" title="${escape(a.label)} ${a[mode].hex}"></span>`))}</div>`;
}

/** A pair of mode panels, each scoped to the family and mode. */
export function modePair(fam, inner) {
  return html`<div class="mode-pair">
${['dark', 'light'].map((m) => html`<div data-family="${fam.id}" data-mode="${m}"><div class="mode-name">${fam.modes[m].label} (${m})</div>${inner(m)}</div>`)}
</div>`;
}

/** The family card used on the home page. */
export function familyCard(fam) {
  return html`<li class="card">
  <h2><a href="${familyHref(fam.id)}">${fam.name}</a> <small class="muted">${fam.version}</small></h2>
  <p>${raw(inlineMarkdown(fam.description))}</p>
  ${scaleStrip(fam)}
  ${modePair(fam, (m) => accentDots(fam, m))}
  <p class="card-links"><a href="${familyHref(fam.id)}">Family page</a> <a href="${fam.repo}">Repository</a> <a href="/carpenter/?family=${fam.id}">Export</a></p>
</li>`;
}

/** *emphasis* and `code` only, for README one-liners. */
export function inlineMarkdown(s) {
  return escape(s)
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

/** A swatch button: copies its hex on click. */
export function swatch(fam, token, role) {
  return html`<li><button type="button" class="swatch ${swatchClass(fam.id, token)}" data-hex="${token.hex}" aria-label="${token.label}, ${token.hex}${role ? ', ' + role : ''}. Copy hex">
  <span class="chip" aria-hidden="true"></span>
  <span class="meta"><span class="name">${token.label}</span><span class="hex">${token.hex}</span>${role ? html`<span class="role">${role}</span>` : ''}</span>
</button></li>`;
}

export function swatchGrid(fam, tokens, roleOf = () => '') {
  return html`<ul class="swatches">${tokens.map((t) => swatch(fam, t, roleOf(t)))}</ul>`;
}

/** Prose, code and (optionally) chart for one family in one mode. */
export function sampleBlock(fam, mode, { chart = false, heading = true } = {}) {
  return html`<div class="sample" data-family="${fam.id}" data-mode="${mode}">
  ${heading ? html`<div class="sample-label">${fam.name} · ${fam.modes[mode].label}</div>` : ''}
  ${proseSample()}
  ${codeSample()}
  ${chart ? html`<div class="chart-wrap">${chartSvg()}</div>` : ''}
</div>`;
}

/** A dark/light switchable set of samples; works without JavaScript. */
export function sampleSet(id, renderMode, defaultMode = 'dark') {
  return html`<div class="sample-set">
  <fieldset class="seg" aria-label="Sample mode">
    <label><input type="radio" name="${id}-mode" value="dark" ${defaultMode === 'dark' ? 'checked' : ''}> Dark</label>
    <label><input type="radio" name="${id}-mode" value="light" ${defaultMode === 'light' ? 'checked' : ''}> Light</label>
  </fieldset>
  <div class="for-dark">${renderMode('dark')}</div>
  <div class="for-light">${renderMode('light')}</div>
</div>`;
}

function badge(label, pass) {
  return html`<span class="badge ${pass ? 'pass' : 'fail'}">${label}<span class="visually-hidden"> ${pass ? 'passes' : 'fails'}</span></span>`;
}

/** One row of a contrast table. */
export function contrastRow(label, fg, bg, famId) {
  const ratio = contrast(fg.hex, bg.hex);
  const g = grade(ratio);
  return html`<tr>
  <td>${label}</td>
  <td><span class="cell-swatch ${swatchClass(famId, fg)}" aria-hidden="true"></span>${fg.label} <code>${fg.hex}</code></td>
  <td><span class="cell-swatch ${swatchClass(famId, bg)}" aria-hidden="true"></span>${bg.label} <code>${bg.hex}</code></td>
  <td class="num">${ratio.toFixed(2)}:1</td>
  <td>${badge('AA', ratio >= 4.5)} ${badge('AA large', ratio >= 3)}${g === 'AAA' ? html` ${badge('AAA', true)}` : ''}</td>
</tr>`;
}
