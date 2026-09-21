// Parse a Ghostty theme file (the one terminal format every family ships)
// into the model's terminal block. Every colour keeps a pointer to the file
// and key it came from.
import { fromOfficial, ANSI_NAMES, terminal } from './token.js';

export function parseGhostty(text) {
  const out = { palette: {} };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (key === 'palette') {
      const [n, hex] = value.split('=').map((s) => s.trim());
      out.palette[Number(n)] = hex;
    } else {
      out[key] = value;
    }
  }
  return out;
}

const clean = (v) => (v.startsWith('#') ? v : '#' + v);

/** Model terminal block from an official Ghostty file at `file` (repo-relative). */
export function terminalFromGhostty(file, text, prefix) {
  const g = parseGhostty(text);
  const t = (key, id) => fromOfficial(file, key, clean(g[key]), `${prefix}.${id}`, `${prefix} ${id}`);
  return terminal({
    origin: 'official',
    bg: t('background', 'bg'),
    fg: t('foreground', 'fg'),
    cursor: t('cursor-color', 'cursor'),
    cursorText: t('cursor-text', 'cursor-text'),
    selectionBg: t('selection-background', 'selection-bg'),
    selectionFg: t('selection-foreground', 'selection-fg'),
    ansi: ANSI_NAMES.map((name, i) =>
      fromOfficial(file, `palette ${i}`, clean(g.palette[i]), `${prefix}.ansi.${name}`, `${prefix} ${name}`)),
  });
}
