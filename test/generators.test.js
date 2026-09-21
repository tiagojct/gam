import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as yaml from 'js-yaml';
import { parse as parseToml } from 'smol-toml';
import luaparse from 'luaparse';
import * as plist from 'plist';
import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';
import { loadAll } from '../src/model/load.js';
import { GENERATORS, byId, bundle, officialFor } from '../src/generators/index.js';
import { parseGhostty } from '../src/model/ghostty.js';

// Live vendor for the parse tests and audits; frozen fixtures for the
// snapshots, so an upstream token change never fails the build here.
const families = loadAll();
const fixtures = loadAll(new URL('./fixtures/', import.meta.url).pathname);
const ids = Object.keys(families);

const hasR = (() => { try { execFileSync('Rscript', ['--version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const hasPython = (() => { try { execFileSync('python3', ['--version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const tmp = mkdtempSync(join(tmpdir(), 'gam-'));

const toText = (f) => (typeof f.content === 'string' ? f.content : Buffer.from(f.content).toString('hex').replace(/(.{64})/g, '$1\n'));

describe('snapshots', () => {
  for (const id of ids) {
    for (const mode of ['both', 'dark']) {
      if (mode === 'dark' && id !== 'pequod') continue;
      for (const g of GENERATORS) {
        it(`${g.id} ${id} ${mode}`, async () => {
          const files = g.generate(fixtures[id], { mode });
          expect(files.length).toBeGreaterThan(0);
          for (const f of files) {
            expect(f.name).toBeTruthy();
            expect(f.mime).toBeTruthy();
            await expect(toText(f)).toMatchFileSnapshot(`__snapshots__/generators/${id}/${mode}/${g.id}/${f.name}${typeof f.content === 'string' ? '' : '.hex'}`);
          }
        });
      }
    }
  }
});

// A tiny CSS/SCSS checker: braces balance and every declaration ends with a semicolon.
function checkCss(text) {
  const noComments = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  let depth = 0;
  for (const ch of noComments) {
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth < 0) throw new Error('unbalanced }'); }
  }
  if (depth !== 0) throw new Error('unbalanced {');
  for (const line of noComments.split('\n')) {
    const l = line.trim();
    if (!l || l.includes('{') || l === '}' || l.startsWith('@') || l.endsWith('(') || l === ');' || l.endsWith(',')) continue;
    if (/^[$@]?[\w.-]+\s*:/.test(l) && !l.endsWith(';') && !l.endsWith('{')) throw new Error(`missing semicolon: ${l}`);
  }
}

function evalCommonJs(src) {
  const module = { exports: {} };
  new Function('module', 'exports', src)(module, module.exports);
  return module.exports;
}

describe('outputs parse', () => {
  for (const id of ids) {
    const fam = families[id];
    const gen = (gid, mode = 'both') => byId[gid].generate(fam, { mode });

    it(`${id}: JSON formats`, () => {
      for (const gid of ['dtcg', 'tokens-studio', 'vscode', 'zed', 'windows-terminal']) {
        for (const f of gen(gid)) {
          const o = JSON.parse(f.content);
          expect(o).toBeTypeOf('object');
        }
      }
      const dt = JSON.parse(gen('dtcg')[0].content);
      expect(dt.dark.bg.$type).toBe('color');
      expect(dt.light.code.keyword.$value).toMatch(/^#[0-9A-F]{6}$/);
      const vs = JSON.parse(gen('vscode', 'dark')[0].content);
      expect(vs.type).toBe('dark');
      expect(vs.colors['editor.background']).toBe(fam.modes.dark.roles.bg.hex);
      const zed = JSON.parse(gen('zed')[0].content);
      expect(zed.themes).toHaveLength(2);
      expect(zed.themes.map((t) => t.appearance).sort()).toEqual(['dark', 'light']);
      const wt = JSON.parse(gen('windows-terminal', 'light')[0].content);
      expect(wt.brightBlack).toMatch(/^#/);
    });

    it(`${id}: YAML`, () => {
      const y = yaml.load(gen('quarto-brand')[0].content);
      expect(y.meta.name).toBe(fam.name);
      expect(Object.keys(y.color.palette).length).toBeGreaterThan(5);
      expect(y.color.foreground).toBeTruthy();
    });

    it(`${id}: TOML`, () => {
      for (const f of gen('alacritty')) {
        const t = parseToml(f.content);
        expect(t.colors.primary.background).toMatch(/^#[0-9A-F]{6}$/);
        expect(Object.keys(t.colors.normal)).toHaveLength(8);
      }
    });

    it(`${id}: Lua`, () => {
      for (const gid of ['wezterm', 'neovim']) {
        for (const f of gen(gid)) expect(() => luaparse.parse(f.content, { luaVersion: '5.3' })).not.toThrow();
      }
    });

    it(`${id}: plist`, () => {
      for (const f of gen('iterm2')) {
        const p = plist.parse(f.content);
        expect(p['Ansi 0 Color']['Color Space']).toBe('sRGB');
        expect(p['Background Color']['Red Component']).toBeGreaterThanOrEqual(0);
        expect(Object.keys(p).filter((k) => k.startsWith('Ansi '))).toHaveLength(16);
      }
    });

    it(`${id}: JavaScript`, () => {
      const tw = evalCommonJs(gen('tailwind3')[0].content);
      expect(Object.keys(tw.theme.extend.colors).length).toBeGreaterThan(5);
      const obs = evalCommonJs(gen('observable')[0].content.replace(/^export const /gm, 'exports.').replace(/^export default .*$/m, ''));
      const dark = Object.entries(obs).find(([k]) => k.endsWith('Dark') && !k.includes('Sequential') && !k.includes('Plot') && !k.includes('Diverging'));
      expect(Array.isArray(dark[1])).toBe(true);
    });

    it(`${id}: CSS and SCSS`, () => {
      for (const gid of ['css', 'tailwind4', 'pandoc-css', 'obsidian', 'scss', 'quarto-scss']) {
        for (const f of gen(gid)) expect(() => checkCss(f.content), `${gid} ${f.name}`).not.toThrow();
      }
      const single = gen('css', 'dark')[0].content;
      expect(single).not.toContain('prefers-color-scheme');
      expect(gen('css')[0].content).toContain('[data-theme="dark"]');
    });

    it(`${id}: Typst and LaTeX`, () => {
      const typ = gen('typst')[0].content;
      const opens = (typ.match(/\(/g) || []).length;
      const closes = (typ.match(/\)/g) || []).length;
      expect(opens).toBe(closes);
      for (const line of gen('latex')[0].content.split('\n')) {
        if (!line || line.startsWith('%')) continue;
        expect(line).toMatch(/^\\definecolor\{[A-Za-z0-9]+\}\{HTML\}\{[0-9A-F]{6}\}$/);
      }
    });

    it(`${id}: terminals`, () => {
      for (const f of gen('ghostty')) {
        const g = parseGhostty(f.content);
        expect(Object.keys(g.palette)).toHaveLength(16);
        expect(g.background).toMatch(/^#/);
      }
      for (const f of gen('kitty')) for (const l of f.content.split('\n')) if (l && !l.startsWith('#')) expect(l).toMatch(/^[a-z_0-9]+ #[0-9A-F]{6}$/);
      for (const f of gen('tmux')) for (const l of f.content.split('\n')) if (l && !l.startsWith('#')) expect(l).toMatch(/^set -g /);
    });

    it(`${id}: palettes`, () => {
      const gpl = gen('gpl')[0].content.split('\n');
      expect(gpl[0]).toBe('GIMP Palette');
      const rows = gpl.filter((l) => /^\s*\d+\s+\d+\s+\d+\t/.test(l));
      expect(rows.length).toBeGreaterThan(10);
      const ase = gen('ase')[0].content;
      const dv = new DataView(ase.buffer, ase.byteOffset, ase.byteLength);
      expect(String.fromCharCode(...ase.slice(0, 4))).toBe('ASEF');
      expect(dv.getUint16(4)).toBe(1);
      const blocks = dv.getUint32(8);
      expect(blocks).toBe(rows.length + 2);
      // Walk the blocks and check every colour entry is well formed.
      let o = 12, colours = 0;
      while (o < ase.length) {
        const type = dv.getUint16(o); const len = dv.getUint32(o + 2); o += 6;
        if (type === 0x0001) {
          const n = dv.getUint16(o);
          const model = String.fromCharCode(...ase.slice(o + 2 + n * 2, o + 2 + n * 2 + 4));
          expect(model).toBe('RGB ');
          colours++;
        }
        o += len;
      }
      expect(colours).toBe(rows.length);
      expect(o).toBe(ase.length);
    });

    it.skipIf(!hasPython)(`${id}: Python compiles`, () => {
      const py = gen('matplotlib').find((f) => f.name.endsWith('.py'));
      const p = join(tmp, py.name);
      writeFileSync(p, py.content);
      execFileSync('python3', ['-c', `import ast,sys; ast.parse(open(sys.argv[1]).read())`, p]);
    });

    it.skipIf(!hasR)(`${id}: R parses`, () => {
      const r = gen('ggplot2')[0];
      const p = join(tmp, r.name);
      writeFileSync(p, r.content);
      execFileSync('Rscript', ['-e', `invisible(parse(file = commandArgs(TRUE)[1]))`, p]);
    });
  }

  it('every hex in every export is a family colour', () => {
    for (const id of ids) {
      const fam = families[id];
      const known = new Set();
      const walk = (o) => {
        if (o && typeof o === 'object') {
          if (typeof o.hex === 'string') known.add(o.hex.toUpperCase());
          for (const v of Object.values(o)) walk(v);
        }
      };
      walk(fam);
      for (const g of GENERATORS) {
        if (g.id === 'ase') continue;
        for (const f of g.generate(fam, { mode: 'both' })) {
          const hexes = f.content.match(/#[0-9A-Fa-f]{6}\b/g) || [];
          for (const h of hexes) expect(known.has(h.toUpperCase()), `${g.id} ${f.name} ${h}`).toBe(true);
        }
      }
    }
  });

  it('bundles a zip with every generated file', () => {
    const z = unzipSync(bundle(families.pequod, { mode: 'both' }, [{ name: 'Pequod.ghostty', content: 'x' }]));
    const names = Object.keys(z);
    expect(names).toContain('README.txt');
    expect(names).toContain('official/Pequod.ghostty');
    expect(names.some((n) => n.startsWith('web/css/'))).toBe(true);
    expect(strFromU8(z['README.txt'])).toContain('Pequod');
    expect(names.length).toBeGreaterThan(30);
  });

  it('knows which official files a family ships', () => {
    const built = JSON.parse(readFileSync(new URL('../src/generated/model.json', import.meta.url), 'utf8')).families;
    expect(officialFor(built.pequod, 'ghostty', 'dark').map((o) => o.name)).toEqual(['Pequod.ghostty']);
    expect(officialFor(built.pequod, 'ghostty', 'light')).toEqual([]);
    expect(officialFor(built.glauca, 'vscode', 'both').map((o) => o.mode).sort()).toEqual(['dark', 'light']);
    expect(officialFor(built.ambergris, 'zed', 'light')).toEqual([]);
  });
});
