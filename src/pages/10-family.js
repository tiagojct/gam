import { html, raw } from '../site/html.js';
import { swatchGrid, sampleBlock, sampleSet, contrastRow, inlineMarkdown } from '../site/components.js';
import { MODES } from '../model/token.js';

/** base token id -> list of "mode role" strings that point at it. */
function roleIndex(fam) {
  const idx = new Map();
  const add = (base, label) => {
    if (!idx.has(base)) idx.set(base, []);
    if (!idx.get(base).includes(label)) idx.get(base).push(label);
  };
  for (const m of MODES) {
    const mode = fam.modes[m];
    for (const [role, tok] of Object.entries(mode.roles)) if (tok.alias) add(tok.alias, `${m} ${humanRole(role)}`);
    for (const [role, tok] of Object.entries(mode.syntax)) {
      const base = tok.alias || tok.id;
      add(base, `${m === 'dark' ? 'dark' : 'light'} ${role}`);
    }
  }
  return idx;
}

function humanRole(role) {
  return role.replace(/([A-Z])/g, ' $1').toLowerCase();
}

function rolesFor(idx, token) {
  const list = idx.get(token.id) || [];
  return list.join(', ');
}

/** Syntax roles an accent carries, per mode, de-duplicated. */
function syntaxFor(fam, accent) {
  const out = new Set();
  for (const m of MODES) {
    for (const [role, tok] of Object.entries(fam.modes[m].syntax)) {
      if ((tok.alias || tok.id) === accent[m].id || tok.id === accent[m].id || (tok.alias && tok.alias === accent[m].alias && accent[m].alias)) out.add(role);
    }
  }
  return [...out];
}

function contrastTable(fam, m) {
  const mode = fam.modes[m];
  const r = mode.roles;
  const rows = [
    contrastRow('Body text', r.text, r.bg, fam.id),
    contrastRow('Muted text', r.textMuted, r.bg, fam.id),
    contrastRow('Links', r.link, r.bg, fam.id),
    ...fam.accents.map((a) => contrastRow(`${a.label}${a.tier === 'extended' ? ' (extended)' : ''}`, a[m], r.bg, fam.id)),
  ];
  return html`<h3>${mode.label} (${m}): on ${r.bg.label}, ${r.bg.hex}</h3>
<div class="table-scroll"><table>
<thead><tr><th>Use</th><th>Foreground</th><th>Surface</th><th class="num">Ratio</th><th>WCAG 2.x</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>`;
}

function installSections(fam) {
  const groups = new Map();
  for (const s of fam.ships) {
    const key = s.installHtml ? s.installSource + '#' + s.install[1] : `nodoc:${s.target}`;
    if (!groups.has(key)) groups.set(key, { ships: [], html: s.installHtml, source: s.installSource, heading: s.install ? s.install[1] : null });
    groups.get(key).ships.push(s);
  }
  return [...groups.values()].map((g) => {
    const labels = g.ships.map((s) => s.label).join(', ');
    const pkgs = g.ships.filter((s) => s.package).map((s) => s.package);
    const links = g.ships.filter((s) => s.link).map((s) => html`<a href="${s.link}">${s.label} listing</a>`);
    const files = g.ships.flatMap((s) => Object.entries(s.official || {}).map(([mode, f]) => html`<a href="${fam.repo}/blob/main/${f.path}"><code>${f.path}</code></a>${mode !== 'both' ? html` (${mode})` : ''}`));
    return html`<section class="install-section">
<h3>${labels}</h3>
${pkgs.length ? html`<p class="muted">${pkgs.join('; ')}</p>` : ''}
${g.html ? html`${raw(g.html)}<p class="muted">Copied from <a href="${g.source}">${g.source.replace(fam.repo + '/blob/main/', '')}</a>${g.heading ? html`, section "${g.heading}"` : ''}.</p>` : ''}
${files.length ? html`<p>Files: ${files.map((f, i) => html`${i ? ', ' : ''}${f}`)}.</p>` : ''}
${links.length ? html`<p>${links.map((l, i) => html`${i ? ' · ' : ''}${l}`)}</p>` : ''}
</section>`;
  });
}

export function pages(model) {
  return model.order.map((id) => {
    const fam = model.families[id];
    const idx = roleIndex(fam);
    return {
      path: `/${id}/`,
      title: fam.name,
      description: fam.description.replace(/[*`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
      body: html`
<h1>${fam.name} <small class="muted">${fam.version}</small></h1>
<p class="lede">${raw(inlineMarkdown(fam.description))}</p>
<p>Modes: <strong>${fam.modes.dark.label}</strong> (dark) and <strong>${fam.modes.light.label}</strong> (light). Canonical tokens in <a href="${fam.repo}/blob/main/${fam.tokenFile}"><code>${fam.tokenFile}</code></a>, read at commit <code>${fam.source.commit}</code>.${fam.descriptionSource ? html` Description from ${fam.descriptionSource}.` : ''}</p>
<ul class="toc">
  <li><a href="#scale">Scale</a></li><li><a href="#accents">Accents</a></li><li><a href="#samples">Samples</a></li>
  <li><a href="#contrast">Contrast</a></li><li><a href="#cvd">Colour vision</a></li><li><a href="#install">Install</a></li><li><a href="#links">Links</a></li>
</ul>
${fam.rules ? html`<div class="callout"><p><strong>The family's rules</strong></p><ol>${fam.rules.map((r) => html`<li>${r}</li>`)}</ol></div>` : ''}

<h2 id="scale">${fam.scale.name} scale</h2>
<p>${fam.scale.steps.length} steps, light to dark. Click a swatch to copy its hex. The roles listed are the family's own assignments.</p>
${swatchGrid(fam, fam.scale.steps, (t) => rolesFor(idx, t))}
${fam.extraScales.map((s) => html`<h3>${s.name} ramp</h3>${swatchGrid(fam, s.steps, (t) => rolesFor(idx, t))}`)}

<h2 id="accents">Accents</h2>
<p>${fam.accents.filter((a) => a.tier === 'core').length} core${fam.accents.some((a) => a.tier === 'extended') ? html` and ${fam.accents.filter((a) => a.tier === 'extended').length} extended (code only)` : ''}. Each has a dark and a light variant${fam.id === 'pequod' ? ' in the token file' : fam.id === 'ambergris' ? ', taken from the two data sweeps and the theme links' : '; the light variants are derived exactly as the family derives its own light themes'}.</p>
${MODES.map((m) => html`<h3>${fam.modes[m].label} (${m})</h3>
${swatchGrid(fam, fam.accents.map((a) => a[m]), (t) => {
  const a = fam.accents.find((x) => x[m].id === t.id);
  const syn = syntaxFor(fam, a).filter((r) => fam.modes[m].syntax[r] && (fam.modes[m].syntax[r].id === t.id || fam.modes[m].syntax[r].alias === (t.alias || t.id)));
  return [a.hue, a.tier === 'extended' ? 'extended' : null, ...syn].filter(Boolean).join(', ');
})}`)}
<dl>
${fam.accents.filter((a) => a.note).map((a) => html`<dt><strong>${a.label}</strong></dt><dd>${a.note}</dd>`)}
</dl>

<h2 id="samples">Prose and code</h2>
${sampleSet(`${id}-samples`, (m) => sampleBlock(fam, m, { chart: true }), 'dark')}

<h2 id="contrast">Contrast</h2>
<p>WCAG 2.x contrast ratios computed at build time for body text, muted text, links and every accent on the family's reference surface in each mode. AA is 4.5:1 for normal text; AA large is 3:1 for large text and interface parts.</p>
${MODES.map((m) => contrastTable(fam, m))}

<h2 id="cvd">Colour vision</h2>
${fam.cvd ? html`<p>${fam.cvd.summary}</p><p>Source: <a href="${fam.cvd.href}">${fam.cvd.href.replace('https://github.com/', '')}</a>, script <a href="${fam.repo}/blob/main/${fam.cvd.script}"><code>${fam.cvd.script}</code></a>.</p>` : html`<p>The repository documents no colour-vision notes. Its contrast assertions are in <a href="${fam.repo}/blob/main/${fam.tokenFile}"><code>${fam.tokenFile}</code></a>.</p>`}
<p>Simulate any pair under protanopia, deuteranopia and tritanopia in the <a href="/carpenter/#contrast">Carpenter's contrast checker</a>.</p>

<h2 id="install">Install</h2>
<p>Only the targets this repository ships, with the commands copied from its README.</p>
${installSections(fam)}
${fam.also && fam.also.length ? html`<p>The repository also ships: ${fam.also.join(', ')}. See the <a href="${fam.repo}">repository</a>.</p>` : ''}
<p>Every other format is generated in the <a href="/carpenter/?family=${id}">Carpenter</a>.</p>

<h2 id="links">Links</h2>
<ul>
  <li><a href="${fam.repo}">Repository</a></li>
  ${fam.homepage ? html`<li><a href="${fam.homepage}">Project page</a></li>` : ''}
  ${fam.changelog ? html`<li><a href="${fam.changelog}">Changelog</a></li>` : html`<li>No changelog in the repository.</li>`}
  ${fam.licence.stated
    ? fam.licence.files.map((f) => html`<li><a href="${fam.repo}/blob/main/${f}">${f}</a></li>`)
    : html`<li>The repository states no licence. This site assumes tokens ${fam.licence.tokens} and code ${fam.licence.code}, as for the other families.</li>`}
</ul>
`,
    };
  });
}
