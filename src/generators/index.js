// Every generator, in the order the Carpenter lists them, plus the bundle.
import { zipSync, strToU8 } from 'fflate';
import * as web from './web.js';
import * as publishing from './publishing.js';
import * as data from './data.js';
import * as editors from './editors.js';
import * as terminals from './terminals.js';
import * as palettes from './palettes.js';

export const GROUPS = [
  { id: 'web', label: 'Web' },
  { id: 'publishing', label: 'Publishing' },
  { id: 'data', label: 'Data' },
  { id: 'editors', label: 'Editors' },
  { id: 'terminals', label: 'Terminals' },
  { id: 'palettes', label: 'Palette files' },
];

export const GENERATORS = [
  web.css, web.scss, web.tailwind3, web.tailwind4, web.dtcg, web.tokensStudio,
  publishing.quartoBrand, publishing.quartoScss, publishing.typst, publishing.latex, publishing.pandocCss,
  data.ggplot2, data.matplotlib, data.observable,
  editors.vscode, editors.zed, editors.neovim, editors.obsidian,
  terminals.ghostty, terminals.alacritty, terminals.kitty, terminals.wezterm, terminals.tmux, terminals.windowsTerminal, terminals.iterm2,
  palettes.gpl, palettes.ase, palettes.hexList,
];

export const byId = Object.fromEntries(GENERATORS.map((g) => [g.id, g]));

/** Official files a family ships for a generator's target and the requested modes. */
export function officialFor(fam, generatorId, mode) {
  const ship = fam.ships.find((s) => s.target === generatorId && s.official);
  if (!ship) return [];
  const modes = mode === 'both' ? ['dark', 'light'] : [mode];
  const out = [];
  if (ship.official.both) out.push({ mode: 'both', ...ship.official.both });
  for (const m of modes) if (ship.official[m]) out.push({ mode: m, ...ship.official[m] });
  return out;
}

/** Run every generator for a family; returns [{generator, files}]. */
export function generateAll(fam, opts) {
  return GENERATORS.map((g) => ({ generator: g, files: g.generate(fam, opts) }));
}

/** A zip of every generated file (and any official files passed in). */
export function bundle(fam, opts, official = []) {
  const tree = {};
  for (const { generator, files } of generateAll(fam, opts)) {
    for (const f of files) {
      const content = typeof f.content === 'string' ? strToU8(f.content) : f.content;
      tree[`${generator.group}/${generator.id}/${f.name}`] = content;
    }
  }
  for (const o of official) tree[`official/${o.name}`] = typeof o.content === 'string' ? strToU8(o.content) : o.content;
  tree['README.txt'] = strToU8(`${fam.name} ${fam.version}, exported by Gam (https://gam.tiagojacinto.eu) from ${fam.tokenFile} at commit ${fam.source.commit}.\nMode: ${opts.mode}. Tokens CC BY 4.0, attribute ${fam.name}; generated files MIT.\nFiles under official/ are copied verbatim from the family repository.\n`);
  return zipSync(tree, { level: 6 });
}
