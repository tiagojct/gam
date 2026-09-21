import { html, raw, swatchClass } from '../site/html.js';
import { sampleBlock, sampleSet } from '../site/components.js';
import { lab } from '../colour/cvd.js';

const BINS = 21; // L* bins five units wide

/** Place each family's steps into luminance rows so they can be read across. */
function alignedRows(fams) {
  const rows = Array.from({ length: BINS }, () => ({}));
  for (const fam of fams) {
    const placed = new Set();
    const steps = fam.scale.steps.map((s) => ({ s, L: lab(s.hex)[0] })).sort((a, b) => b.L - a.L);
    for (const { s, L } of steps) {
      const want = Math.min(BINS - 1, Math.max(0, Math.round(((100 - L) / 100) * (BINS - 1))));
      // Nearest free bin, searching outward, downward first (darker).
      let i = want;
      for (let d = 0; placed.has(i) && d < BINS; d++) {
        const cand = d % 2 === 0 ? want + Math.ceil(d / 2) + (d ? 0 : 0) : want - Math.ceil(d / 2);
        if (cand >= 0 && cand < BINS) i = cand;
        if (!placed.has(i)) break;
      }
      placed.add(i);
      rows[i][fam.id] = { s, L };
    }
  }
  return rows;
}

export function page(model) {
  const fams = model.order.map((id) => model.families[id]);
  const rows = alignedRows(fams);
  return {
    path: '/compare/',
    title: 'Compare',
    description: 'The same prose, code and chart in Pequod, Glauca, Try-Works and Ambergris at once, and the four base scales aligned step by step.',
    body: html`
<h1>Compare</h1>
<p class="lede">The same prose, the same code and the same small chart in all four families at once. Switch every panel between dark and light; the switch works without JavaScript.</p>
<h2 id="samples">Side by side</h2>
${sampleSet('compare', (m) => html`<div class="sample-grid">${fams.map((f) => sampleBlock(f, m, { chart: true }))}</div>`, 'dark')}

<h2 id="scales">The base scales, aligned</h2>
<p>Each family's base scale placed on a common lightness axis (CIELAB L*, computed from the hex), so a step in one family can be read against its neighbours in the others. Empty cells mean the family has no step at that lightness. Click any swatch to copy its hex.</p>
<div class="table-scroll">
<table class="align-table">
<thead><tr><th class="num">L*</th>${fams.map((f) => html`<th>${f.name} <small class="muted">${f.scale.name}, ${f.scale.steps.length}</small></th>`)}</tr></thead>
<tbody>
${rows.map((row, i) => (Object.keys(row).length === 0 ? '' : html`<tr>
  <td class="num muted">${Math.round(100 - (i / (BINS - 1)) * 100)}</td>
  ${fams.map((f) => {
    const cell = row[f.id];
    if (!cell) return html`<td></td>`;
    return html`<td><button type="button" class="swatch inline ${swatchClass(f.id, cell.s)}" data-hex="${cell.s.hex}" aria-label="${cell.s.label}, ${cell.s.hex}, lightness ${cell.L.toFixed(0)}. Copy hex"><span class="chip" aria-hidden="true"></span><span class="meta"><span class="name">${cell.s.label}</span><span class="hex">${cell.s.hex} · L ${cell.L.toFixed(0)}</span></span></button></td>`;
  })}
</tr>`))}
</tbody>
</table>
</div>

<h2 id="accents">Accents across families</h2>
<p>Core accents in each mode, with the hue the family assigns. Extended (code-only) hues are marked.</p>
<div class="table-scroll">
<table>
<thead><tr><th>Family</th><th>Dark</th><th>Light</th></tr></thead>
<tbody>
${fams.map((f) => html`<tr><th scope="row"><a href="/${f.id}/">${f.name}</a></th>
${['dark', 'light'].map((m) => html`<td><ul class="dots-list">${f.accents.map((a) => html`<li><button type="button" class="dot ${swatchClass(f.id, a[m])}" data-hex="${a[m].hex}" aria-label="${a.label} ${m}, ${a[m].hex}. Copy hex"><span class="chip" aria-hidden="true"></span><span class="dot-label">${a.label}${a.tier === 'extended' ? raw('<span class="muted"> (ext.)</span>') : ''}</span></button></li>`)}</ul></td>`)}
</tr>`)}
</tbody>
</table>
</div>
`,
  };
}
