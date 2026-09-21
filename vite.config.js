import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig } from 'vite';

// scripts/render-pages.mjs writes one index.html per route into site/;
// every one of them is a build entry. Sources live in src/ next door.
const siteDir = resolve('site');

function htmlEntries(dir = siteDir, out = {}) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) htmlEntries(p, out);
    else if (name === 'index.html') out[p.slice(siteDir.length + 1).replace(/\/?index\.html$/, '') || 'index'] = p;
  }
  return out;
}

export default defineConfig({
  root: 'site',
  publicDir: '../public',
  appType: 'mpa',
  clearScreen: false,
  server: { port: 5173, strictPort: true, host: '127.0.0.1', fs: { allow: [resolve('.')] } },
  preview: { port: 4174, strictPort: true, host: '127.0.0.1' },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
    rollupOptions: { input: htmlEntries() },
  },
});
