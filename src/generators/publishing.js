// Publishing formats: Quarto _brand.yml and SCSS theme, Typst palette,
// LaTeX xcolor definitions, a stylesheet for Pandoc's HTML output.
import { view, header, kebab, camel, modesOf, ROLE_NAMES } from './common.js';

const roleName = (r) => kebab(r.replace(/([A-Z])/g, '-$1'));

export const quartoBrand = {
  id: 'quarto-brand', label: 'Quarto _brand.yml', group: 'publishing', ext: 'yml', mime: 'text/yaml',
  generate(fam, opts) {
    const modes = modesOf(opts.mode);
    const v = view(fam, { ...opts, mode: modes.includes('light') ? 'light' : modes[0] });
    const q = (hex) => `"${hex}"`;
    let out = header(v, 'hash', modes.length > 1 ? 'brand.yml has one colour set; this is the light mode. Use the SCSS theme for a dark variant.' : '');
    out += `meta:\n  name: ${v.name}\n  link:\n    home: ${v.repo}\n`;
    out += `color:\n  palette:\n`;
    for (const s of v.scale) out += `    ${s.name}: ${q(s.hex)}\n`;
    for (const sc of v.extraScales) for (const s of sc.steps) out += `    ${s.name}: ${q(s.hex)}\n`;
    for (const a of v.allAccents) out += `    ${a.name}: ${q(a.hex)}\n`;
    const named = (hex) => {
      const s = v.scale.find((x) => x.hex === hex) || v.allAccents.find((x) => x.hex === hex);
      return s ? s.name : q(hex);
    };
    out += `  foreground: ${named(v.roles.text)}\n  background: ${named(v.roles.bg)}\n`;
    out += `  primary: ${named(v.roles.accent)}\n  secondary: ${named(v.roles.textMuted)}\n  link: ${named(v.roles.link)}\n`;
    const acc = (hue) => v.allAccents.find((a) => a.hue === hue);
    if (acc('green')) out += `  success: ${acc('green').name}\n`;
    if (acc('red')) out += `  danger: ${acc('red').name}\n`;
    if (acc('yellow') || acc('orange')) out += `  warning: ${(acc('yellow') || acc('orange')).name}\n`;
    if (acc('blue')) out += `  info: ${acc('blue').name}\n`;
    return [{ name: '_brand.yml', content: out, mime: this.mime }];
  },
};

export const quartoScss = {
  id: 'quarto-scss', label: 'Quarto SCSS theme', group: 'publishing', ext: 'scss', mime: 'text/x-scss',
  generate(fam, opts) {
    return modesOf(opts.mode).map((mode) => {
      const v = view(fam, { ...opts, mode });
      let out = header(v, 'slashes', `Use: format: html: theme: [${v.scheme === 'dark' ? 'darkly' : 'cosmo'}, ${kebab(v.name)}-${mode}.scss]`);
      out += `\n/*-- scss:defaults --*/\n`;
      for (const s of v.scale) out += `$${s.name}: ${s.hex};\n`;
      for (const a of v.allAccents) out += `$${a.name}: ${a.hex};\n`;
      out += `\n$body-bg: ${v.roles.bg};\n$body-color: ${v.roles.text};\n$link-color: ${v.roles.link};\n$link-hover-color: ${v.roles.linkHover};\n`;
      out += `$primary: ${v.roles.accent};\n$secondary: ${v.roles.textMuted};\n$border-color: ${v.roles.border};\n`;
      out += `$code-bg: ${v.roles.surface};\n$code-color: ${v.syntax.variable.hex};\n$pre-bg: ${v.roles.surface};\n`;
      out += `$navbar-bg: ${v.roles.surface};\n$navbar-fg: ${v.roles.text};\n$sidebar-bg: ${v.roles.surface};\n`;
      out += `$code-block-border-left: ${v.roles.border};\n$font-family-monospace: "JetBrains Mono", ui-monospace, monospace;\n`;
      out += `\n/*-- scss:rules --*/\n`;
      out += `:root { color-scheme: ${v.scheme}; }\n`;
      out += `.sourceCode .kw, .sourceCode .cf { color: ${v.syntax.keyword.hex}; ${v.syntax.keyword.style === 'bold' ? 'font-weight: 700; ' : ''}}\n`;
      out += `.sourceCode .st, .sourceCode .ss { color: ${v.syntax.string.hex}; }\n`;
      out += `.sourceCode .dv, .sourceCode .fl, .sourceCode .bn { color: ${v.syntax.number.hex}; }\n`;
      out += `.sourceCode .co { color: ${v.syntax.comment.hex}; ${v.syntax.comment.style === 'italic' ? 'font-style: italic; ' : ''}}\n`;
      out += `.sourceCode .fu { color: ${v.syntax.function.hex}; }\n`;
      out += `.sourceCode .dt { color: ${v.syntax.type.hex}; ${v.syntax.type.style === 'italic' ? 'font-style: italic; ' : ''}}\n`;
      out += `.sourceCode .cn { color: ${v.syntax.constant.hex}; }\n`;
      out += `.sourceCode .va { color: ${v.syntax.variable.hex}; }\n`;
      out += `.sourceCode .op { color: ${v.syntax.operator.hex}; }\n`;
      out += `.sourceCode .at { color: ${v.syntax.decorator.hex}; }\n`;
      out += `.sourceCode .ot { color: ${v.syntax.parameter.hex}; }\n`;
      out += `::selection { background: ${v.roles.selection}; }\n`;
      out += `*:focus-visible { outline: 2px solid ${v.roles.focus}; outline-offset: 2px; }\n`;
      return { name: `${kebab(v.name)}-${mode}.scss`, content: out, mime: this.mime };
    });
  },
};

export const typst = {
  id: 'typst', label: 'Typst palette', group: 'publishing', ext: 'typ', mime: 'text/plain',
  generate(fam, opts) {
    const modes = modesOf(opts.mode);
    const first = view(fam, { ...opts, mode: modes[0] });
    const p = kebab(first.name).replace(/-/g, '_');
    let out = header(first, 'slashes', `#import "${kebab(first.name)}.typ": ${p}`);
    out += `#let ${p} = (\n`;
    out += `  scale: (\n${first.scale.map((s) => `    "${s.name}": rgb("${s.hex}"),`).join('\n')}\n  ),\n`;
    for (const sc of first.extraScales) out += `  ${kebab(sc.name).replace(/-/g, '_')}: (\n${sc.steps.map((s) => `    "${s.name}": rgb("${s.hex}"),`).join('\n')}\n  ),\n`;
    for (const mode of modes) {
      const v = view(fam, { ...opts, mode });
      out += `  ${mode}: (\n`;
      for (const r of ROLE_NAMES) out += `    "${roleName(r)}": rgb("${v.roles[r]}"),\n`;
      out += `    accents: (\n${v.allAccents.map((a) => `      "${a.name}": rgb("${a.hex}"),`).join('\n')}\n    ),\n`;
      out += `    code: (\n${Object.entries(v.syntax).map(([r, s]) => `      "${r}": rgb("${s.hex}"),`).join('\n')}\n    ),\n`;
      out += `    series: (${v.dataviz.categorical.map((h) => `rgb("${h}")`).join(', ')}),\n`;
      out += `  ),\n`;
    }
    out += `)\n\n// Usage: #set text(fill: ${p}.${modes[0]}.at("text"))\n`;
    return [{ name: `${kebab(first.name)}.typ`, content: out, mime: this.mime }];
  },
};

export const latex = {
  id: 'latex', label: 'LaTeX xcolor definitions', group: 'publishing', ext: 'sty', mime: 'text/x-tex',
  generate(fam, opts) {
    const modes = modesOf(opts.mode);
    const first = view(fam, { ...opts, mode: modes[0] });
    const P = camel(first.name);
    let out = header(first, 'percent', `\\usepackage{xcolor} then \\input{${kebab(first.name)}-colours.tex}`);
    const def = (name, hex) => `\\definecolor{${P}${name}}{HTML}{${hex.slice(1)}}\n`;
    for (const s of first.scale) out += def(camel(s.id), s.hex);
    for (const sc of first.extraScales) for (const s of sc.steps) out += def(camel(s.id), s.hex);
    for (const a of first.allAccents) { out += def(camel(a.id) + 'Light', a.light); out += def(camel(a.id) + 'Dark', a.dark); }
    for (const mode of modes) {
      const v = view(fam, { ...opts, mode });
      const M = camel(mode);
      out += `% ${v.modeLabel} (${mode})\n`;
      for (const r of ROLE_NAMES) out += def(M + camel(r), v.roles[r]);
      for (const [r, s] of Object.entries(v.syntax)) out += def(M + 'Code' + camel(r), s.hex);
    }
    out += `% Example: \\pagecolor{${P}${camel(modes[0])}Bg}\\color{${P}${camel(modes[0])}Text}\n`;
    return [{ name: `${kebab(first.name)}-colours.tex`, content: out, mime: this.mime }];
  },
};

export const pandocCss = {
  id: 'pandoc-css', label: 'Pandoc HTML CSS', group: 'publishing', ext: 'css', mime: 'text/css',
  generate(fam, opts) {
    const modes = modesOf(opts.mode);
    const block = (v) => {
      const s = v.syntax;
      return [
        `  color-scheme: ${v.scheme};`,
        `  --bg: ${v.roles.bg}; --surface: ${v.roles.surface}; --text: ${v.roles.text}; --muted: ${v.roles.textMuted};`,
        `  --border: ${v.roles.border}; --link: ${v.roles.link}; --link-hover: ${v.roles.linkHover}; --accent: ${v.roles.accent}; --selection: ${v.roles.selection};`,
        `  --kw: ${s.keyword.hex}; --st: ${s.string.hex}; --dv: ${s.number.hex}; --co: ${s.comment.hex}; --fu: ${s.function.hex}; --dt: ${s.type.hex};`,
        `  --cn: ${s.constant.hex}; --va: ${s.variable.hex}; --op: ${s.operator.hex}; --at: ${s.decorator.hex}; --ot: ${s.parameter.hex};`,
      ].join('\n');
    };
    const light = view(fam, { ...opts, mode: modes.includes('light') ? 'light' : modes[0] });
    const dark = view(fam, { ...opts, mode: modes.includes('dark') ? 'dark' : modes[0] });
    let out = header(light, 'css', 'pandoc --standalone --css this-file.css --highlight-style=pygments; the highlighting classes are restyled below.');
    if (modes.length > 1) {
      out += `:root {\n${block(light)}\n}\n@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {\n${block(dark)}\n} }\n[data-theme="dark"] {\n${block(dark)}\n}\n`;
    } else {
      out += `:root {\n${block(light)}\n}\n`;
    }
    out += `
html { background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; line-height: 1.55; }
body { max-width: 42rem; margin: 0 auto; padding: 2rem 1rem; }
a { color: var(--link); }
a:hover { color: var(--link-hover); }
h1, h2, h3 { color: var(--text); }
hr { border: 0; border-top: 1px solid var(--border); }
blockquote { border-left: 3px solid var(--accent); margin-left: 0; padding-left: 1rem; color: var(--muted); }
code, pre { font-family: ui-monospace, monospace; }
pre, code { background: var(--surface); }
pre { padding: 0.75rem 1rem; overflow-x: auto; border: 1px solid var(--border); }
::selection { background: var(--selection); }
table { border-collapse: collapse; } th, td { border-bottom: 1px solid var(--border); padding: 0.3rem 0.6rem; }
.sourceCode .kw, .sourceCode .cf, .sourceCode .im { color: var(--kw); ${light.syntax.keyword.style === 'bold' ? 'font-weight: 700; ' : ''}}
.sourceCode .st, .sourceCode .ss, .sourceCode .vs { color: var(--st); }
.sourceCode .dv, .sourceCode .fl, .sourceCode .bn { color: var(--dv); }
.sourceCode .co, .sourceCode .do { color: var(--co); ${light.syntax.comment.style === 'italic' ? 'font-style: italic; ' : ''}}
.sourceCode .fu { color: var(--fu); }
.sourceCode .dt { color: var(--dt); }
.sourceCode .cn { color: var(--cn); }
.sourceCode .va { color: var(--va); }
.sourceCode .op { color: var(--op); }
.sourceCode .at { color: var(--at); }
.sourceCode .ot { color: var(--ot); }
`;
    return [{ name: `${kebab(light.name)}-pandoc.css`, content: out, mime: this.mime }];
  },
};
