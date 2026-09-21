// The normalised schema every family maps into, and the helpers the four
// adapters share. A Token is a colour plus its origin: either a path into
// the family's canonical token file, a key in an official file the family
// ships, or a named derivation over such tokens. The origin audit test walks
// the whole model and rejects any colour that cannot be traced this way.
import { normaliseHex, mix8 } from '../colour/hex.js';
import { contrast } from '../colour/wcag.js';

export const FAMILY_IDS = ['pequod', 'glauca', 'try-works', 'ambergris'];
export const MODES = ['dark', 'light'];

/** Site-chrome roles every mode defines. */
export const ROLES = [
  'bg', 'surface', 'text', 'textMuted', 'textSubtle', 'border',
  'link', 'linkHover', 'accent', 'onAccent', 'button', 'onButton', 'focus', 'selection',
];

/** Syntax roles every mode defines (some through a declared fallback). */
export const SYNTAX_ROLES = [
  'keyword', 'string', 'number', 'comment', 'function', 'type', 'constant',
  'variable', 'operator', 'punctuation', 'decorator', 'parameter',
];

export const ANSI_NAMES = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
  'bright-black', 'bright-red', 'bright-green', 'bright-yellow', 'bright-blue',
  'bright-magenta', 'bright-cyan', 'bright-white',
];

/** A colour read verbatim from the canonical token file. */
export function fromFile(file, path, hex, id = path, label = id) {
  return { id, label, hex: normaliseHex(hex), origin: { file, path } };
}

/** A colour read from a file the family ships (an official theme or preset). */
export function fromOfficial(file, key, hex, id = key, label = id) {
  return { id, label, hex: normaliseHex(hex), origin: { file, path: key, official: true } };
}

/** A colour computed from other tokens by a named rule. */
export function derived(rule, from, hex, id, label = id) {
  return {
    id, label,
    hex: normaliseHex(hex),
    origin: { derived: rule, from: from.map((t) => (typeof t === 'string' ? t : t.alias || t.id)) },
  };
}

/** Same colour, new id and label (an alias such as a role pointing at a step). */
export function alias(token, id, label = id) {
  return { ...token, id, label, alias: token.id };
}

/** A role that the family does not define, filled from another role. */
export function fallback(token, id, fromRole) {
  return { ...token, id, label: id, alias: token.id, fallback: fromRole };
}

/**
 * The 8-bit blend the Glauca and Try-Works generators use to derive light
 * code colours: t of the way from `a` toward `b`.
 */
export function mixToken(a, b, t, id, label = id) {
  return derived(`mix(${a.id}, ${b.id}, ${t})`, [a, b], mix8(a.hex, b.hex, t), id, label);
}

/** Whichever of two candidates contrasts more with `against`. */
export function contrastPick(against, first, second, id) {
  const pick = contrast(first.hex, against.hex) >= contrast(second.hex, against.hex) ? first : second;
  return derived(`higher-contrast(${first.id} | ${second.id}) on ${against.id}`, [against, first, second], pick.hex, id);
}

/** Order tokens light to dark by WCAG relative luminance. */
export function byLuminanceDesc(tokens) {
  return tokens.slice().sort((a, b) => contrast(b.hex, '#000000') - contrast(a.hex, '#000000'));
}

/** Build a { role: token } record, checking that every role is present. */
export function roles(record) {
  for (const r of ROLES) if (!record[r]) throw new Error(`role missing: ${r}`);
  return record;
}

export function syntax(record) {
  for (const r of SYNTAX_ROLES) if (!record[r]) throw new Error(`syntax role missing: ${r}`);
  return record;
}

export function terminal(t) {
  for (const k of ['bg', 'fg', 'cursor', 'cursorText', 'selectionBg', 'selectionFg']) {
    if (!t[k]) throw new Error(`terminal key missing: ${k}`);
  }
  if (!t.ansi || t.ansi.length !== 16) throw new Error('terminal needs sixteen ANSI colours');
  if (!['official', 'generated'].includes(t.origin)) throw new Error('terminal origin must be official or generated');
  return t;
}

/** Every token reachable in a family model, for audits and the swatch CSS. */
export function* walkTokens(family) {
  yield* family.scale.steps;
  for (const a of family.accents) {
    yield a.dark;
    yield a.light;
  }
  for (const m of MODES) {
    const mode = family.modes[m];
    yield* Object.values(mode.roles);
    yield* Object.values(mode.syntax);
    const t = mode.terminal;
    yield t.bg; yield t.fg; yield t.cursor; yield t.cursorText; yield t.selectionBg; yield t.selectionFg;
    yield* t.ansi;
    yield* mode.dataviz.categorical;
    yield* mode.dataviz.sequential;
    if (mode.dataviz.diverging) yield* mode.dataviz.diverging;
    yield* Object.values(mode.dataviz.plot);
  }
}
