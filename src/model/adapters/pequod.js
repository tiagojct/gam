// Pequod: pequod.json. A twelve-step Log scale, eight crew accents with a
// light and a dark variant each, roles as references into the scale, and a
// syntax map from role to accent name.
import {
  fromFile, derived, alias, fallback, roles, syntax, terminal, mixToken, contrastPick, ANSI_NAMES,
} from '../token.js';
import { terminalFromGhostty } from '../ghostty.js';
import { firstParagraph } from '../readme.js';

const FILE = 'pequod.json';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function adapt({ json, files }) {
  const steps = Object.entries(json.log).map(([n, hex]) =>
    fromFile(FILE, `log.${n}`, hex, `log.${n}`, `Log ${n}`));
  const step = (ref) => {
    const t = steps.find((s) => s.id === ref);
    if (!t) throw new Error(`unknown log reference ${ref}`);
    return t;
  };

  const accents = Object.entries(json.accents).map(([name, a]) => ({
    id: name,
    label: cap(name),
    hue: a.role,
    tier: 'core',
    note: a.note,
    dark: fromFile(FILE, `accents.${name}.dark`, a.dark, `${name}.dark`, `${cap(name)} dark`),
    light: fromFile(FILE, `accents.${name}.light`, a.light, `${name}.light`, `${cap(name)} light`),
  }));
  const accent = (name, mode) => accents.find((a) => a.id === name)[mode];

  const mode = (m) => {
    const r = json.roles[m];
    const role = (key, id) => alias(step(r[key]), `${m}.${id}`, `${cap(m)} ${id}`);
    const bg = role('bg', 'bg');
    const text = role('text', 'text');
    const accentPrimary = role('accent-primary', 'accent');
    const onAccent = contrastPick(accentPrimary, bg, text, `${m}.on-accent`);
    const rolesRecord = roles({
      bg,
      surface: role('surface', 'surface'),
      text,
      textMuted: role('text-muted', 'text-muted'),
      textSubtle: role('text-subtle', 'text-subtle'),
      border: role('border', 'border'),
      link: role('link', 'link'),
      // The family's hover (log.400) is below AA on its reference surface,
      // so site links keep their colour on hover and change underline instead.
      linkHover: fallback(role('link', 'link'), `${m}.link-hover`, 'link'),
      accent: accentPrimary,
      onAccent,
      button: alias(accentPrimary, `${m}.button`),
      onButton: alias(onAccent, `${m}.on-button`),
      focus: role('focus-ring', 'focus'),
      selection: alias(step(r.surface), `${m}.selection`),
    });

    const syn = (key) => alias(accent(json.syntax[key], m), `${m}.syntax.${key}`, `${cap(m)} ${key}`);
    const syntaxRecord = syntax({
      keyword: syn('keyword'),
      string: syn('string'),
      number: syn('number'),
      comment: { ...syn('comment'), style: 'italic' },
      function: syn('function'),
      type: syn('type'),
      constant: syn('constant'),
      variable: syn('variable'),
      operator: syn('operator'),
      punctuation: syn('punctuation'),
      decorator: fallback(accent(json.syntax.constant, m), `${m}.syntax.decorator`, 'constant'),
      parameter: fallback(accent(json.syntax.variable, m), `${m}.syntax.parameter`, 'variable'),
    });

    let term;
    if (m === 'dark') {
      term = terminalFromGhostty('themes/terminals/Pequod.ghostty', files['themes/terminals/Pequod.ghostty'], 'dark.terminal');
    } else {
      // No light preset ships. Chrome follows the light roles the way the
      // dark preset follows the dark ones (cursor = accent-primary, selection
      // = surface); hues take the light accent by ANSI role; the greyscale
      // slots take the mode's inks so ordinary terminal text stays legible
      // on paper; bright variants darken a fifth of the way to the text.
      const p = 'light.terminal';
      const by = { red: 'ahab', green: 'tashtego', yellow: 'pip', blue: 'starbuck', magenta: 'queequeg' };
      const hue = (name) => alias(accent(by[name], 'light'), `${p}.ansi.${name}`);
      const cyan = mixToken(accent('starbuck', 'light'), accent('tashtego', 'light'), 0.5, `${p}.ansi.cyan`);
      const bright = (t, name) => mixToken(t, text, 0.2, `${p}.ansi.bright-${name}`);
      const ansi = {
        black: alias(step('log.900'), `${p}.ansi.black`),
        red: hue('red'), green: hue('green'), yellow: hue('yellow'), blue: hue('blue'), magenta: hue('magenta'),
        cyan,
        white: alias(rolesRecord.textSubtle, `${p}.ansi.white`),
        'bright-black': alias(rolesRecord.textMuted, `${p}.ansi.bright-black`),
        'bright-red': bright(hue('red'), 'red'),
        'bright-green': bright(hue('green'), 'green'),
        'bright-yellow': bright(hue('yellow'), 'yellow'),
        'bright-blue': bright(hue('blue'), 'blue'),
        'bright-magenta': bright(hue('magenta'), 'magenta'),
        'bright-cyan': bright(cyan, 'cyan'),
        'bright-white': alias(text, `${p}.ansi.bright-white`),
      };
      term = terminal({
        origin: 'generated',
        bg: alias(bg, `${p}.bg`),
        fg: alias(text, `${p}.fg`),
        cursor: alias(accentPrimary, `${p}.cursor`),
        cursorText: alias(bg, `${p}.cursor-text`),
        selectionBg: alias(rolesRecord.surface, `${p}.selection-bg`),
        selectionFg: alias(text, `${p}.selection-fg`),
        ansi: ANSI_NAMES.map((n) => ansi[n]),
      });
    }

    return {
      label: m === 'dark' ? 'Below deck' : 'Parchment',
      scheme: m,
      roles: rolesRecord,
      syntax: syntaxRecord,
      terminal: term,
      dataviz: {
        categorical: accents.map((a) => a[m]),
        sequential: steps,
        diverging: null,
        plot: {
          bg: alias(bg, `${m}.plot.bg`),
          grid: alias(rolesRecord.border, `${m}.plot.grid`),
          text: alias(text, `${m}.plot.text`),
          muted: alias(rolesRecord.textMuted, `${m}.plot.muted`),
        },
      },
    };
  };

  return {
    id: 'pequod',
    name: json.name,
    version: json.version,
    description: firstParagraph(files['README.md']),
    tagline: 'Warm paper, deep ink, the crew as accents.',
    repo: 'https://github.com/tiagojct/pequod',
    homepage: json.homepage,
    changelog: 'https://github.com/tiagojct/pequod/blob/main/CHANGELOG.md',
    licence: {
      tokens: json.license.palette, code: json.license.code, stated: true,
      files: ['LICENSE-CC-BY-4.0', 'LICENSE-MIT'],
    },
    tokenFile: FILE,
    scale: { name: 'Log', steps },
    extraScales: [],
    accents,
    modes: { dark: mode('dark'), light: mode('light') },
    cvd: {
      summary: 'Documented in the README: Viénot-Brettel-Mollon simulation of every accent with pairwise ΔE. The deuteranopia floor is Ishmael against Tashtego; the README asks that the two never be told apart by colour alone.',
      href: 'https://github.com/tiagojct/pequod#colour-vision-deficiency',
      script: 'scripts/cvd_check.py',
    },
    ships: [
      { target: 'vscode', label: 'VS Code', mode: 'both', path: 'vscode/', install: ['README.md', 'VS Code'], link: 'https://marketplace.visualstudio.com/items?itemName=tiagojct.pequod-color-theme',
        files: { dark: 'themes/Pequod-color-theme.json', light: 'themes/Pequod-light-color-theme.json' } },
      { target: 'zed', label: 'Zed', mode: 'both', path: 'themes/Pequod.zed.json', install: ['README.md', 'Zed'], files: { both: 'themes/Pequod.zed.json' } },
      { target: 'iterm2', label: 'iTerm2', mode: 'dark', path: 'themes/Pequod.itermcolors', install: ['README.md', 'iTerm2'], files: { dark: 'themes/Pequod.itermcolors' } },
      { target: 'ghostty', label: 'Ghostty', mode: 'dark', path: 'themes/terminals/Pequod.ghostty', install: ['README.md', 'Other terminals'], files: { dark: 'themes/terminals/Pequod.ghostty' } },
      { target: 'alacritty', label: 'Alacritty', mode: 'dark', path: 'themes/terminals/Pequod.alacritty.toml', install: null, files: { dark: 'themes/terminals/Pequod.alacritty.toml' } },
      { target: 'kitty', label: 'kitty', mode: 'dark', path: 'themes/terminals/Pequod.kitty.conf', install: null, files: { dark: 'themes/terminals/Pequod.kitty.conf' } },
      { target: 'wezterm', label: 'WezTerm', mode: 'dark', path: 'themes/terminals/Pequod.wezterm.lua', install: null, files: { dark: 'themes/terminals/Pequod.wezterm.lua' } },
      { target: 'tmux', label: 'tmux', mode: 'dark', path: 'themes/terminals/Pequod.tmux.conf', install: null, files: { dark: 'themes/terminals/Pequod.tmux.conf' } },
      { target: 'windows-terminal', label: 'Windows Terminal', mode: 'dark', path: 'themes/terminals/Pequod.windowsterminal.json', install: null, files: { dark: 'themes/terminals/Pequod.windowsterminal.json' } },
      { target: 'tailwind', label: 'Tailwind CSS', mode: 'both', path: 'tailwind/', install: ['README.md', 'Tailwind CSS'], link: 'https://www.npmjs.com/package/pequod-tailwind', package: 'npm: pequod-tailwind' },
      { target: 'python', label: 'Python', mode: 'both', path: 'python/', install: ['README.md', 'Python'], link: 'https://pypi.org/project/pequod/', package: 'PyPI: pequod' },
      { target: 'r', label: 'R', mode: 'both', path: 'r/', install: ['README.md', 'R'], link: 'https://CRAN.R-project.org/package=pequod', package: 'CRAN: pequod' },
    ],
  };
}

export const NEEDS = [
  'README.md',
  'themes/terminals/Pequod.ghostty',
];
