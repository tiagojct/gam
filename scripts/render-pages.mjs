// Render every route to site/<route>/index.html from the model, plus the
// generated theme stylesheet and the favicon. Vite then builds site/.
import { mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { layout } from '../src/site/layout.js';
import { themeCss } from '../src/site/theme-css.js';
import { faviconSvg } from '../src/site/favicon.js';

const root = new URL('../', import.meta.url).pathname;
const model = JSON.parse((await import('node:fs')).readFileSync(join(root, 'src/generated/model.json'), 'utf8'));

const siteDir = join(root, 'site');
rmSync(siteDir, { recursive: true, force: true });
mkdirSync(siteDir, { recursive: true });

writeFileSync(join(root, 'src/generated/theme.css'), themeCss(model));
writeFileSync(join(root, 'public/favicon.svg'), faviconSvg(model));

const pagesDir = join(root, 'src/pages');
const modules = readdirSync(pagesDir).filter((f) => f.endsWith('.js')).sort();
for (const file of modules) {
  const mod = await import(join(pagesDir, file));
  const pages = typeof mod.pages === 'function' ? mod.pages(model) : [mod.page(model)];
  for (const page of pages) {
    const depth = page.path.split('/').filter(Boolean).length;
    const rel = '../'.repeat(depth + 1);
    const out = join(siteDir, page.path, 'index.html');
    mkdirSync(join(siteDir, page.path), { recursive: true });
    writeFileSync(out, String(layout(page, model, rel)));
    console.log(`rendered ${page.path}`);
  }
}
