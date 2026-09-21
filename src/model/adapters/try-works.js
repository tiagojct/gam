// Try-Works: src/try-works.json. Neutral groups ground, sea and whale; the
// fire trio as core accents; five extended hues for code. Modes are named
// lit (Try-Fire, dark) and cold (True Lamp, light).
import { adaptSystem } from './system.js';
import { mixToken, alias } from '../token.js';

const FILE = 'src/try-works.json';

export const SPEC = {
  id: 'try-works',
  file: FILE,
  tagline: 'A cold sea is the field; the fire is the one hot mark.',
  scaleName: 'Sea',
  modeKeys: { dark: 'lit', light: 'cold' },
  labels: { dark: 'Try-Fire', light: 'True Lamp' },
  neutralGroups: ['ground', 'sea', 'whale'],
  coreGroup: 'fire',
  coreIds: ['ember', 'flame', 'oil'],
  coreHues: { ember: 'orange', flame: 'orange', oil: 'orange' },
  extendedHues: { kelp: 'green', brick: 'red', dusk: 'violet', tide: 'blue', shoal: 'cyan' },
  stringId: 'kelp',
  tintKey: 'sea',
  literals: {
    '#cdd2d3': ({ text, textMuted }) => mixToken(text, textMuted, 0.35, 'light.parameter'),
    '#aeb6b8': ({ textMuted }) => alias(textMuted, 'light.operator'),
    '#8a9296': ({ textMuted }) => alias(textMuted, 'light.punctuation'),
  },
  ghostty: { dark: 'dist/themes/terminals/Try-Works.ghostty', light: 'dist/themes/terminals/Try-Works-Cold.ghostty' },
  cvd: {
    summary: 'A Machado-2009 pass at full severity covers the code hues. Sea against fire separates cleanly; in the code tier the blue and amber axis is the CVD-safe spine, and the residual close pairs sit on rarely adjacent tokens and are reinforced with weight and italics.',
    href: 'https://github.com/tiagojct/try-works#accessibility',
    script: 'src/scripts/cvd_check.py',
  },
  ships: [
    { target: 'css', label: 'CSS custom properties', mode: 'both', path: 'dist/css/try-works.css', install: null, files: { both: 'dist/css/try-works.css' } },
    { target: 'vscode', label: 'VS Code', mode: 'both', path: 'dist/vscode/', install: ['dist/vscode/README.md', 'Install from source'],
      files: { dark: 'dist/vscode/themes/Try-Works-color-theme.json', light: 'dist/vscode/themes/Try-Works-Cold-color-theme.json' } },
    { target: 'zed', label: 'Zed', mode: 'both', path: 'dist/zed/themes/Try-Works.json', install: ['dist/zed/README.md', 'Install'], files: { both: 'dist/zed/themes/Try-Works.json' } },
    { target: 'ghostty', label: 'Ghostty', mode: 'both', path: 'dist/themes/terminals/', install: ['dist/themes/terminals/README.md', 'Ghostty'],
      files: { dark: 'dist/themes/terminals/Try-Works.ghostty', light: 'dist/themes/terminals/Try-Works-Cold.ghostty' } },
    { target: 'iterm2', label: 'iTerm2', mode: 'both', path: 'dist/themes/terminals/', install: ['dist/themes/terminals/README.md', 'iTerm2'],
      files: { dark: 'dist/themes/terminals/Try-Works.itermcolors', light: 'dist/themes/terminals/Try-Works-Cold.itermcolors' } },
    { target: 'obsidian', label: 'Obsidian', mode: 'both', path: 'dist/obsidian/', install: ['dist/obsidian/README.md', null], files: { both: 'dist/obsidian/theme.css' } },
    { target: 'tailwind', label: 'Tailwind CSS', mode: 'both', path: 'dist/tailwind/', install: ['dist/tailwind/README.md', null], package: 'vendored: dist/tailwind (not on npm)' },
    { target: 'quarto', label: 'Quarto', mode: 'both', path: 'dist/quarto/', install: ['dist/quarto/README.md', 'HTML'],
      files: { dark: 'dist/quarto/try-works-dark.scss', light: 'dist/quarto/try-works.scss' } },
    { target: 'typst', label: 'Typst', mode: 'both', path: 'dist/typst/', install: ['dist/typst/README.md', null], files: { both: 'dist/typst/colors.typ' } },
    { target: 'r', label: 'R', mode: 'both', path: 'dist/r/tryworks.R', install: ['README.md', 'Data visualization'], files: { both: 'dist/r/tryworks.R' }, package: 'source file: dist/r/tryworks.R (not on CRAN)' },
    { target: 'python', label: 'Python', mode: 'both', path: 'dist/python/', install: ['README.md', 'Data visualization'], files: { both: 'dist/python/tryworks.py' }, package: 'source file: dist/python/tryworks.py (not on PyPI)' },
  ],
  also: ['Vivaldi', 'oh-my-zsh', 'print (CMYK spec)'],
};

export function adapt(input) {
  const fam = adaptSystem(SPEC, input);
  fam.also = SPEC.also;
  return fam;
}

export const NEEDS = ['README.md', SPEC.ghostty.dark, SPEC.ghostty.light];
