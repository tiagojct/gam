import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { themeCss } from '../src/site/theme-css.js';

const root = new URL('../', import.meta.url).pathname;
const model = JSON.parse(readFileSync(join(root, 'src/generated/model.json'), 'utf8'));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'vendor', 'dist', 'site', '__snapshots__', 'fixtures', 'official', 'fonts'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{FE0F}]/u;

describe('house style', () => {
  it('no emoji anywhere in the source, docs or generated pages', () => {
    const files = walk(root).filter((f) => /\.(js|mjs|css|md|html|yml|yaml|json|sh|cff|txt|conf)$/.test(f));
    const siteDir = join(root, 'site');
    if (existsSync(siteDir)) files.push(...walk(siteDir).filter((f) => f.endsWith('.html')));
    const offenders = files.filter((f) => EMOJI.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('British spelling in page prose', () => {
    const siteDir = join(root, 'site');
    if (!existsSync(siteDir)) return;
    const american = /\b(color|colors|colored|gray|license|licenses|center|favorite|customize|organize|analyze)\b/;
    const offenders = [];
    for (const f of walk(siteDir).filter((x) => x.endsWith('.html'))) {
      const text = readFileSync(f, 'utf8')
        .replace(/<(pre|code|script|style)\b[\s\S]*?<\/\1>/g, ' ')
        .replace(/<[^>]+>/g, ' ');
      const m = american.exec(text);
      if (m) offenders.push(`${f.slice(root.length)}: ${m[0]}`);
    }
    expect(offenders).toEqual([]);
  });
});

describe('rendered pages', () => {
  const siteDir = join(root, 'site');
  const pages = existsSync(siteDir) ? walk(siteDir).filter((f) => f.endsWith('index.html')) : [];
  it('exist for every route', () => {
    const routes = pages.map((p) => p.slice(siteDir.length).replace(/index\.html$/, ''));
    for (const r of ['/', '/pequod/', '/glauca/', '/try-works/', '/ambergris/', '/compare/', '/carpenter/', '/about/']) expect(routes).toContain(r);
  });
  for (const p of pages) {
    it(`${p.slice(siteDir.length)} is CSP-clean and accessible in outline`, () => {
      const h = readFileSync(p, 'utf8');
      expect(h).toMatch(/^<!doctype html>\n<html lang="en-GB">/);
      expect(h).not.toMatch(/ style="/);
      expect(h).not.toMatch(/<script(?![^>]*\bsrc=)/);
      expect(h).not.toMatch(/\son[a-z]+="/);
      expect(h).toContain('<a class="skip" href="#main">');
      expect(h).toContain('<main id="main"');
      expect((h.match(/<h1[\s>]/g) || []).length).toBe(1);
      expect(h).toMatch(/<meta name="theme-color" media="\(prefers-color-scheme: light\)" content="#[0-9A-F]{6}">/);
      expect(h).toMatch(/<meta name="theme-color" media="\(prefers-color-scheme: dark\)" content="#[0-9A-F]{6}">/);
      expect(h).toContain('property="og:image"');
      // Every image-like SVG chart and strip has an accessible name.
      for (const m of h.matchAll(/<(svg|div)[^>]*role="img"[^>]*>/g)) expect(m[0]).toContain('aria-label=');
      // Buttons that copy carry a hex and a label.
      for (const m of h.matchAll(/<button[^>]*data-hex="([^"]+)"[^>]*>/g)) {
        expect(m[1]).toMatch(/^#[0-9A-F]{6}$/);
        expect(m[0]).toContain('aria-label=');
      }
    });
  }
});

describe('theme stylesheet', () => {
  const css = themeCss(model);
  it('covers every family and mode and defaults to the first family', () => {
    for (const id of model.order) {
      expect(css).toContain(`[data-family="${id}"] {`);
      expect(css).toContain(`[data-family="${id}"][data-mode="dark"] {`);
    }
    expect(css).toContain(`:root, [data-family="${model.order[0]}"] {`);
    expect(css).toContain('@media (prefers-color-scheme: dark)');
  });
  it('only contains hexes that exist in the model', () => {
    const known = new Set(JSON.stringify(model).match(/#[0-9A-F]{6}/g));
    for (const h of css.match(/#[0-9A-Fa-f]{6}/g)) expect(known.has(h.toUpperCase()), h).toBe(true);
  });
});
