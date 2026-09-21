// Generate the site's theme stylesheet from the model: one block of custom
// properties per family and mode, applied through data-family and
// data-mode on any element (the html element for the site chrome, a sample
// container for a scoped preview), plus one class per token for swatches.
// Pequod following the system colour scheme is the default when no
// attribute is set.
import { walkTokens } from '../model/token.js';
import { swatchClass } from './html.js';

const ROLE_VARS = {
  bg: 'bg', surface: 'surface', text: 'text', textMuted: 'text-muted', textSubtle: 'text-subtle',
  border: 'border', link: 'link', linkHover: 'link-hover', accent: 'accent', onAccent: 'on-accent',
  button: 'button', onButton: 'on-button', focus: 'focus', selection: 'selection',
};

function declarations(mode) {
  const lines = [`  color-scheme: ${mode.scheme};`];
  for (const [role, name] of Object.entries(ROLE_VARS)) lines.push(`  --${name}: ${mode.roles[role].hex};`);
  for (const [role, tok] of Object.entries(mode.syntax)) {
    lines.push(`  --syn-${role}: ${tok.hex};`);
    lines.push(`  --syn-${role}-style: ${tok.style === 'italic' ? 'italic' : 'normal'};`);
    lines.push(`  --syn-${role}-weight: ${tok.style === 'bold' ? '700' : '400'};`);
  }
  const t = mode.terminal;
  lines.push(`  --term-bg: ${t.bg.hex};`, `  --term-fg: ${t.fg.hex};`, `  --term-cursor: ${t.cursor.hex};`);
  t.ansi.forEach((tok, i) => lines.push(`  --ansi-${i}: ${tok.hex};`));
  const cat = mode.dataviz.categorical.length ? mode.dataviz.categorical : mode.dataviz.sequential;
  cat.slice(0, 8).forEach((tok, i) => lines.push(`  --series-${i + 1}: ${tok.hex};`));
  for (let i = cat.length + 1; i <= 8; i++) lines.push(`  --series-${i}: ${cat[(i - 1) % cat.length].hex};`);
  lines.push(`  --plot-grid: ${mode.dataviz.plot.grid.hex};`, `  --plot-muted: ${mode.dataviz.plot.muted.hex};`);
  return lines.join('\n');
}

export function themeCss(model) {
  const out = ['/* Generated from the family token files by src/site/theme-css.js. Do not edit. */'];
  const fams = model.order.map((id) => model.families[id]);
  for (const fam of fams) {
    const light = declarations(fam.modes.light);
    const dark = declarations(fam.modes.dark);
    const isDefault = fam.id === model.order[0];
    const base = isDefault ? `:root, [data-family="${fam.id}"]` : `[data-family="${fam.id}"]`;
    out.push(`${base} {\n${light}\n}`);
    out.push(`[data-family="${fam.id}"][data-mode="dark"] {\n${dark}\n}`);
    if (isDefault) out.push(`:root[data-mode="dark"] {\n${dark}\n}`);
    const dark_selectors = [`[data-family="${fam.id}"]:not([data-mode="light"])`];
    if (isDefault) dark_selectors.unshift(`:root:not([data-family]):not([data-mode="light"])`);
    out.push(`@media (prefers-color-scheme: dark) {\n${dark_selectors.join(', ')} {\n${dark}\n}\n}`);
  }
  // Swatch classes: every token in every family.
  const seen = new Set();
  for (const fam of fams) {
    for (const tok of walkTokens(fam)) {
      const cls = swatchClass(fam.id, tok);
      if (seen.has(cls)) continue;
      seen.add(cls);
      out.push(`.${cls} { --sw: ${tok.hex}; }`);
    }
  }
  return out.join('\n') + '\n';
}

/** theme-color values for the head: [lightHex, darkHex] of a family. */
export function themeColours(family) {
  return [family.modes.light.roles.bg.hex, family.modes.dark.roles.bg.hex];
}
