// Glauca: src/glauca.json. Neutral groups saxum, glaucum and pruina; the
// caelum blue trio as core accents; five extended hues for code.
import { adaptSystem } from './system.js';
import { mixToken, alias } from '../token.js';

const FILE = 'src/glauca.json';

export const SPEC = {
  id: 'glauca',
  file: FILE,
  tagline: 'One sky-blue mark on a frost-bloom field.',
  scaleName: 'Frost',
  modeKeys: { dark: 'dark', light: 'light' },
  labels: { dark: 'Profundum', light: 'Pruina' },
  neutralGroups: ['saxum', 'glaucum', 'pruina'],
  coreGroup: 'caelum',
  coreIds: ['dies', 'aer', 'imum'],
  coreHues: { dies: 'blue', aer: 'blue', imum: 'blue' },
  extendedHues: { folium: 'green', bacca: 'red', viola: 'violet', lacus: 'blue', unda: 'cyan' },
  stringId: 'folium',
  tintKey: 'tint',
  // Code-map colours that are not palette tokens, and the family's light
  // rule for each (generate.py, _light_remap).
  literals: {
    '#c3cdd3': ({ text, textMuted }) => mixToken(text, textMuted, 0.35, 'light.parameter'),
    '#a7b1b8': ({ textMuted }) => alias(textMuted, 'light.operator'),
    '#86929a': ({ textMuted }) => alias(textMuted, 'light.punctuation'),
  },
  ghostty: { dark: 'dist/themes/terminals/Glauca-Dark.ghostty', light: 'dist/themes/terminals/Glauca.ghostty' },
  cvd: {
    summary: 'A Machado-2009 pass at full severity covers the code hues. The blue mark holds under all three axes; the measured close pairs (number against function under protan and deutan, function against type under tritan) are reinforced with weight and italics rather than hue.',
    href: 'https://github.com/tiagojct/glauca/blob/main/docs/FOUNDATIONS.md',
    script: 'src/scripts/cvd_check.py',
  },
  ships: [
    { target: 'css', label: 'CSS custom properties', mode: 'both', path: 'dist/css/glauca.css', install: null, files: { both: 'dist/css/glauca.css' } },
    { target: 'vscode', label: 'VS Code', mode: 'both', path: 'dist/vscode/', install: ['dist/vscode/README.md', 'Install from source'],
      files: { dark: 'dist/vscode/themes/Glauca-Dark-color-theme.json', light: 'dist/vscode/themes/Glauca-color-theme.json' } },
    { target: 'zed', label: 'Zed', mode: 'both', path: 'dist/zed/themes/Glauca.json', install: ['dist/zed/README.md', 'Install'], files: { both: 'dist/zed/themes/Glauca.json' } },
    { target: 'ghostty', label: 'Ghostty', mode: 'both', path: 'dist/themes/terminals/', install: ['dist/themes/terminals/README.md', 'Ghostty'],
      files: { dark: 'dist/themes/terminals/Glauca-Dark.ghostty', light: 'dist/themes/terminals/Glauca.ghostty' } },
    { target: 'iterm2', label: 'iTerm2', mode: 'both', path: 'dist/themes/terminals/', install: ['dist/themes/terminals/README.md', 'iTerm2'],
      files: { dark: 'dist/themes/terminals/Glauca-Dark.itermcolors', light: 'dist/themes/terminals/Glauca.itermcolors' } },
    { target: 'obsidian', label: 'Obsidian', mode: 'both', path: 'dist/obsidian/', install: ['dist/obsidian/README.md', null], files: { both: 'dist/obsidian/theme.css' } },
    { target: 'tailwind', label: 'Tailwind CSS', mode: 'both', path: 'dist/tailwind/', install: ['dist/tailwind/README.md', null], package: 'vendored: dist/tailwind (not on npm)' },
    { target: 'quarto', label: 'Quarto', mode: 'both', path: 'dist/quarto/', install: ['dist/quarto/README.md', 'HTML'],
      files: { dark: 'dist/quarto/glauca-dark.scss', light: 'dist/quarto/glauca.scss' } },
    { target: 'typst', label: 'Typst', mode: 'both', path: 'dist/typst/', install: ['dist/typst/README.md', null], files: { both: 'dist/typst/colors.typ' } },
    { target: 'r', label: 'R', mode: 'both', path: 'dist/r/glauca.R', install: ['README.md', 'Data visualization'], files: { both: 'dist/r/glauca.R' }, package: 'source file: dist/r/glauca.R (not on CRAN)' },
    { target: 'python', label: 'Python', mode: 'both', path: 'dist/python/', install: ['README.md', 'Data visualization'], files: { both: 'dist/python/glauca.py' }, package: 'source file: dist/python/glauca.py (not on PyPI)' },
  ],
  also: ['Firefox', 'Thunderbird', 'Vivaldi', 'Zotero', 'oh-my-zsh', 'Miniflux', 'MarkEdit', 'PowerPoint', 'print (CMYK spec)'],
};

export function adapt(input) {
  const fam = adaptSystem(SPEC, input);
  fam.also = SPEC.also;
  return fam;
}

export const NEEDS = ['README.md', SPEC.ghostty.dark, SPEC.ghostty.light];
