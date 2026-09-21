// Web formats: CSS custom properties, SCSS variables, Tailwind v3 config
// and v4 @theme block, W3C Design Tokens (DTCG), Tokens Studio for Figma.
import { view, header, json, kebab, modesOf, ROLE_NAMES } from './common.js';

const roleName = (r) => kebab(r.replace(/([A-Z])/g, '-$1'));

function primitives(v, p) {
  const out = [];
  for (const s of v.scale) out.push(`  --${p}-${s.name}: ${s.hex};`);
  for (const sc of v.extraScales) for (const s of sc.steps) out.push(`  --${p}-${s.name}: ${s.hex};`);
  for (const a of v.allAccents) {
    out.push(`  --${p}-${a.name}-light: ${a.light};`);
    out.push(`  --${p}-${a.name}-dark: ${a.dark};`);
  }
  return out;
}

function modeVars(v, p) {
  const out = [`  color-scheme: ${v.scheme};`];
  for (const r of ROLE_NAMES) out.push(`  --${p}-${roleName(r)}: ${v.roles[r]};`);
  for (const a of v.allAccents) out.push(`  --${p}-${a.name}: ${a.hex};`);
  for (const [role, s] of Object.entries(v.syntax)) out.push(`  --${p}-code-${role}: ${s.hex};`);
  v.dataviz.categorical.forEach((hex, i) => out.push(`  --${p}-series-${i + 1}: ${hex};`));
  return out;
}

export const css = {
  id: 'css', label: 'CSS custom properties', group: 'web', ext: 'css', mime: 'text/css',
  hasPrefix: true,
  generate(fam, opts) {
    const modes = modesOf(opts.mode);
    const first = view(fam, { ...opts, mode: modes[0] });
    const p = first.prefix;
    let out = header(first, 'css', modes.length > 1 ? 'Light at :root; dark under prefers-color-scheme and [data-theme="dark"]; [data-theme="light"] forces light.' : `${first.modeLabel} (${first.mode}) only.`);
    if (modes.length === 1) {
      out += `:root {\n${primitives(first, p).join('\n')}\n\n${modeVars(first, p).join('\n')}\n}\n`;
      return [{ name: `${kebab(fam.name)}-${first.mode}.css`, content: out, mime: this.mime }];
    }
    const light = view(fam, { ...opts, mode: 'light' });
    const dark = view(fam, { ...opts, mode: 'dark' });
    out += `:root {\n${primitives(light, p).join('\n')}\n}\n\n`;
    out += `:root, [data-theme="light"] {\n${modeVars(light, p).join('\n')}\n}\n\n`;
    out += `[data-theme="dark"] {\n${modeVars(dark, p).join('\n')}\n}\n\n`;
    out += `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${modeVars(dark, p).map((l) => '  ' + l).join('\n')}\n  }\n}\n`;
    return [{ name: `${kebab(fam.name)}.css`, content: out, mime: this.mime }];
  },
};

export const scss = {
  id: 'scss', label: 'SCSS variables', group: 'web', ext: 'scss', mime: 'text/x-scss',
  hasPrefix: true,
  generate(fam, opts) {
    const modes = modesOf(opts.mode);
    const first = view(fam, { ...opts, mode: modes[0] });
    const p = first.prefix;
    let out = header(first, 'slashes');
    out += `// Primitives\n`;
    for (const s of first.scale) out += `$${p}-${s.name}: ${s.hex};\n`;
    for (const sc of first.extraScales) for (const s of sc.steps) out += `$${p}-${s.name}: ${s.hex};\n`;
    for (const a of first.allAccents) out += `$${p}-${a.name}-light: ${a.light};\n$${p}-${a.name}-dark: ${a.dark};\n`;
    for (const mode of modes) {
      const v = view(fam, { ...opts, mode });
      out += `\n// ${v.modeLabel} (${mode})\n$${p}-${mode}: (\n`;
      const entries = [
        ...ROLE_NAMES.map((r) => [roleName(r), v.roles[r]]),
        ...v.allAccents.map((a) => [a.name, a.hex]),
        ...Object.entries(v.syntax).map(([r, s]) => [`code-${r}`, s.hex]),
      ];
      out += entries.map(([k, hex]) => `  "${k}": ${hex},`).join('\n') + '\n);\n';
    }
    out += `\n// Usage: map-get($${p}-${modes[0]}, "link")\n`;
    return [{ name: `_${kebab(fam.name)}.scss`, content: out, mime: this.mime }];
  },
};

function tailwindColours(fam, opts) {
  const modes = modesOf(opts.mode);
  const light = view(fam, { ...opts, mode: modes.includes('light') ? 'light' : modes[0] });
  const dark = view(fam, { ...opts, mode: modes.includes('dark') ? 'dark' : modes[0] });
  const colours = {};
  const scaleKey = kebab(light.scaleName);
  colours[scaleKey] = Object.fromEntries(light.scale.map((s) => [s.name.replace(`${kebab(s.id.split('.')[0])}-`, ''), s.hex]));
  for (const sc of light.extraScales) colours[kebab(sc.name)] = Object.fromEntries(sc.steps.map((s) => [s.name.split('-').pop(), s.hex]));
  for (const a of light.allAccents) colours[a.name] = modes.length > 1 ? { DEFAULT: a.light, light: a.light, dark: a.dark } : { DEFAULT: a.hex };
  const roleObj = (v) => Object.fromEntries(ROLE_NAMES.map((r) => [roleName(r), v.roles[r]]));
  if (modes.length > 1) {
    colours.light = roleObj(light);
    colours.dark = roleObj(dark);
  } else {
    Object.assign(colours, roleObj(light));
  }
  return { colours, light, dark, modes };
}

export const tailwind3 = {
  id: 'tailwind3', label: 'Tailwind v3 config', group: 'web', ext: 'js', mime: 'text/javascript',
  generate(fam, opts) {
    const { colours, light } = tailwindColours(fam, opts);
    const body = JSON.stringify({ theme: { extend: { colors: colours } } }, null, 2);
    const out = header(light, 'slashes', 'Merge into tailwind.config.js, or require() this file and spread it.') + `module.exports = ${body};\n`;
    return [{ name: `tailwind.${kebab(fam.name)}.config.js`, content: out, mime: this.mime }];
  },
};

export const tailwind4 = {
  id: 'tailwind4', label: 'Tailwind v4 @theme', group: 'web', ext: 'css', mime: 'text/css',
  generate(fam, opts) {
    const { colours, light } = tailwindColours(fam, opts);
    const lines = [];
    const walk = (obj, path) => {
      for (const [k, val] of Object.entries(obj)) {
        if (typeof val === 'string') lines.push(`  --color-${[...path, k].filter((s) => s !== 'DEFAULT').join('-')}: ${val};`);
        else walk(val, [...path, k]);
      }
    };
    walk(colours, []);
    const out = header(light, 'css', 'Import after tailwindcss; class names follow the variable names (bg-log-50, text-ahab-dark).') + `@theme {\n${lines.join('\n')}\n}\n`;
    return [{ name: `${kebab(fam.name)}.theme.css`, content: out, mime: this.mime }];
  },
};

function dtcgTokens(fam, opts, style) {
  const modes = modesOf(opts.mode);
  const first = view(fam, { ...opts, mode: modes[0] });
  const T = (hex, extra = {}) => (style === 'dtcg' ? { $type: 'color', $value: hex, ...extra } : { value: hex, type: 'color', ...extra });
  const ref = (path) => (style === 'dtcg' ? `{${path}}` : `{${path}}`);
  const out = {};
  const core = {};
  core[kebab(first.scaleName)] = Object.fromEntries(first.scale.map((s) => [s.name.split('-').slice(1).join('-') || s.name, T(s.hex, { $description: s.label })]));
  for (const sc of first.extraScales) core[kebab(sc.name)] = Object.fromEntries(sc.steps.map((s) => [s.name.split('-').pop(), T(s.hex)]));
  core.accent = Object.fromEntries(first.allAccents.map((a) => [a.name, { light: T(a.light, { $description: `${a.label}, ${a.hue}` }), dark: T(a.dark) }]));
  const modeSets = {};
  for (const mode of modes) {
    const v = view(fam, { ...opts, mode });
    const roles = {};
    for (const r of ROLE_NAMES) {
      const alias = v.roleRefs[r];
      const path = alias && first.scale.some((s) => s.id === alias) ? `${kebab(first.scaleName)}.${kebab(alias).split('-').slice(1).join('-')}` : null;
      roles[roleName(r)] = path ? T(ref(path)) : T(v.roles[r]);
    }
    const code = Object.fromEntries(Object.entries(v.syntax).map(([role, s]) => [role, T(s.hex, s.style ? { $extensions: { 'eu.tiagojacinto.gam': { style: s.style } } } : {})]));
    const series = Object.fromEntries(v.dataviz.categorical.map((hex, i) => [String(i + 1), T(hex)]));
    modeSets[mode] = { $description: `${v.modeLabel} (${mode})`, ...roles, code, series };
  }
  if (style === 'dtcg') {
    out.$description = `${first.name} ${first.version}, exported by Gam`;
    Object.assign(out, core);
    for (const [mode, set] of Object.entries(modeSets)) out[mode] = set;
  } else {
    // Tokens Studio: one set per group, plus set order metadata.
    const strip = (o) => JSON.parse(JSON.stringify(o).replace(/"\$description":/g, '"description":').replace(/"\$extensions":/g, '"extensions":'));
    out.core = strip(core);
    for (const [mode, set] of Object.entries(modeSets)) out[mode] = strip(set);
    out.$metadata = { tokenSetOrder: ['core', ...Object.keys(modeSets)] };
  }
  return { out, first };
}

export const dtcg = {
  id: 'dtcg', label: 'W3C Design Tokens (DTCG) JSON', group: 'web', ext: 'tokens.json', mime: 'application/json',
  generate(fam, opts) {
    const { out } = dtcgTokens(fam, opts, 'dtcg');
    return [{ name: `${kebab(fam.name)}.tokens.json`, content: json(out), mime: this.mime }];
  },
};

export const tokensStudio = {
  id: 'tokens-studio', label: 'Tokens Studio JSON (Figma)', group: 'web', ext: 'json', mime: 'application/json',
  generate(fam, opts) {
    const { out } = dtcgTokens(fam, opts, 'studio');
    return [{ name: `${kebab(fam.name)}.tokens-studio.json`, content: json(out), mime: this.mime }];
  },
};
