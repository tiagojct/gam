// Shared adapter for the two design systems built on the same machinery,
// Glauca and Try-Works: named neutral groups instead of a numbered ramp,
// a core accent trio plus five extended code hues, mode blocks with direct
// hexes, a dark-only code map and terminal block. Light code colours are
// derived exactly as the family generators derive them (generate.py,
// _light_remap / _cold_remap): hues blend 45 % toward the light text, the
// string green 50 %, the accent trio takes the light accent and accent-deep.
import {
  fromFile, alias, fallback, roles, syntax, mixToken, byLuminanceDesc,
} from '../token.js';
import { terminalFromGhostty } from '../ghostty.js';
import { firstParagraph } from '../readme.js';
import { lower } from '../../colour/hex.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * spec: { id, file, modeKeys: {dark, light}, labels: {dark, light}, neutralGroups,
 *         coreGroup, coreHues, extendedHues, greenId, stringId, literals: {dark hex: light rule},
 *         ghostty: {dark, light}, ships, cvd, tagline }
 */
export function adaptSystem(spec, { json, files }) {
  const FILE = spec.file;
  const mk = (path, hex, id, label) => fromFile(FILE, path, hex, id, label);

  const steps = byLuminanceDesc(spec.neutralGroups.flatMap((g) =>
    Object.entries(json.palette[g]).map(([name, hex]) =>
      ({ ...mk(`palette.${g}.${name}`, hex, `${g}.${name}`, `${cap(name)} (${g})`), group: g }))));

  const modeJson = (m) => json.modes[spec.modeKeys[m]];
  const light = modeJson('light');
  const lightText = mk(`modes.${spec.modeKeys.light}.text`, light.text, 'light.text', 'Light text');
  const lightAccent = mk(`modes.${spec.modeKeys.light}.accent`, light.accent, 'light.accent', 'Light accent');
  const lightDeep = mk(`modes.${spec.modeKeys.light}.accent-deep`, light['accent-deep'], 'light.accent-deep', 'Light accent-deep');

  // The family's light remap for a core or extended hue token.
  const toLight = (t) => {
    if (t.id === `${spec.coreGroup}.${spec.coreIds[0]}`) return alias(lightAccent, `${t.id}.light`, `${t.label} light`);
    if (spec.coreIds.slice(1).some((n) => t.id === `${spec.coreGroup}.${n}`)) return alias(lightDeep, `${t.id}.light`, `${t.label} light`);
    if (t.id === `extended.${spec.stringId}`) return mixToken(t, lightText, 0.5, `${t.id}.light`, `${t.label} light`);
    return mixToken(t, lightText, 0.45, `${t.id}.light`, `${t.label} light`);
  };

  const accents = [];
  for (const name of spec.coreIds) {
    const t = mk(`palette.${spec.coreGroup}.${name}`, json.palette[spec.coreGroup][name], `${spec.coreGroup}.${name}`, cap(name));
    accents.push({ id: name, label: cap(name), hue: spec.coreHues[name], tier: 'core', group: spec.coreGroup,
      dark: t, light: toLight(t) });
  }
  for (const [name, hex] of Object.entries(json.palette.extended)) {
    const t = mk(`palette.extended.${name}`, hex, `extended.${name}`, cap(name));
    accents.push({ id: name, label: cap(name), hue: spec.extendedHues[name], tier: 'extended', group: 'extended',
      dark: t, light: toLight(t) });
  }

  // Map a hex in the dark code map back to the token that carries it.
  const darkHexToLight = new Map();
  for (const a of accents) darkHexToLight.set(lower(a.dark.hex), a.light);

  const mode = (m) => {
    const key = spec.modeKeys[m];
    const mj = modeJson(m);
    const r = (k, id = k) => mk(`modes.${key}.${k}`, mj[k], `${m}.${id}`, `${cap(m)} ${id}`);
    const bg = r('bg');
    const text = r('text');
    const textMuted = r('text-muted');
    const accent = r('accent');
    const onAccent = r('on-accent');
    const tint = spec.tintKey;
    const rolesRecord = roles({
      bg,
      surface: r('surface'),
      text,
      textMuted,
      textSubtle: fallback(textMuted, `${m}.text-subtle`, 'textMuted'),
      border: r('border'),
      link: alias(accent, `${m}.link`),
      linkHover: m === 'dark' ? r('accent-bright', 'link-hover') : r('accent-deep', 'link-hover'),
      accent,
      onAccent,
      button: alias(accent, `${m}.button`),
      onButton: alias(onAccent, `${m}.on-button`),
      focus: mk(`a11y.focus.${key}`, json.a11y.focus[key], `${m}.focus`, `${cap(m)} focus`),
      selection: m === 'dark' ? r(tint, 'selection') : r(`${tint}-pale`, 'selection'),
    });

    // Code map. Dark is verbatim; light follows the remap table.
    const lightLiteral = (hex) => {
      const rule = spec.literals[lower(hex)];
      if (!rule) throw new Error(`${spec.id}: no light mapping for code colour ${hex}`);
      return rule({ text: lightText, textMuted: rolesRecord.textMuted });
    };
    const code = (role, id = role) => {
      const c = json.code[role];
      const dark = mk(`code.${role}.color`, c.color, `dark.syntax.${id}`, `Dark ${id}`);
      let tok;
      if (m === 'dark') tok = dark;
      else {
        const hex = lower(c.color);
        const mapped = darkHexToLight.get(hex) || (hex === lower(modeJson('dark').text) ? lightText : null)
          || (hex === lower(modeJson('dark')['text-muted']) ? rolesRecord.textMuted : null);
        tok = mapped ? alias(mapped, `light.syntax.${id}`, `Light ${id}`) : { ...lightLiteral(c.color), id: `light.syntax.${id}`, label: `Light ${id}` };
      }
      return c.style ? { ...tok, style: c.style } : tok;
    };
    const syntaxRecord = syntax({
      keyword: code('keyword'),
      string: code('string'),
      number: code('number'),
      comment: code('comment'),
      function: code('function'),
      type: code('type'),
      constant: fallback(code('number'), `${m}.syntax.constant`, 'number'),
      variable: code('variable'),
      operator: code('operator'),
      punctuation: code('punctuation'),
      decorator: code('decorator'),
      parameter: code('parameter'),
    });

    const gfile = spec.ghostty[m];
    const term = terminalFromGhostty(gfile, files[gfile], `${m}.terminal`);

    const dv = json.dataviz;
    const list = (k) => dv[k].colors.map((hex, i) => mk(`dataviz.${k}.colors.${i}`, hex, `dataviz.${k}.${i + 1}`, `${cap(k)} ${i + 1}`));
    const plot = (k) => mk(`dataviz.plot.${m}.${k}`, dv.plot[m][k], `${m}.plot.${k}`, `${cap(m)} plot ${k}`);
    return {
      label: spec.labels[m],
      scheme: m,
      roles: rolesRecord,
      syntax: syntaxRecord,
      terminal: term,
      dataviz: {
        categorical: list('categorical'),
        sequential: list('sequential'),
        diverging: list('diverging'),
        categoricalNote: dv.categorical.name,
        plot: { bg: plot('bg'), grid: plot('grid'), text: plot('text'), muted: plot('muted') },
      },
    };
  };

  return {
    id: spec.id,
    name: json.name,
    version: json.version,
    description: firstParagraph(files['README.md']),
    tagline: spec.tagline,
    repo: `https://github.com/tiagojct/${spec.id}`,
    homepage: null,
    changelog: `https://github.com/tiagojct/${spec.id}/blob/main/docs/CHANGELOG.md`,
    licence: { tokens: 'CC-BY-4.0', code: 'MIT', stated: true, files: ['LICENSE-CC-BY-4.0', 'LICENSE-MIT'] },
    tokenFile: FILE,
    scale: { name: spec.scaleName, steps },
    extraScales: [],
    accents,
    modes: { dark: mode('dark'), light: mode('light') },
    cvd: spec.cvd,
    ships: spec.ships,
  };
}
