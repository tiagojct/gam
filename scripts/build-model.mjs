// Build the normalised model from vendor/ into src/generated/model.json,
// and copy every official file the families ship into public/official/ so
// the Carpenter can offer them verbatim. Run before build, dev and test.
import { mkdirSync, writeFileSync, copyFileSync, rmSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import MarkdownIt from 'markdown-it';
import { loadAll, readVendorFile, vendorFileExists, VENDOR, ADAPTERS } from '../src/model/load.js';
import { section } from '../src/model/readme.js';

const root = new URL('../', import.meta.url).pathname;
const md = new MarkdownIt({ html: false, linkify: false });

// Relative links in a README section must point back at the repository.
function absolutise(html, repo, readmePath) {
  const dir = readmePath.includes('/') ? readmePath.slice(0, readmePath.lastIndexOf('/') + 1) : '';
  return html.replace(/href="(?!https?:|#|mailto:)([^"]+)"/g, (_, href) => {
    const path = href.startsWith('/') ? href.slice(1) : dir + href;
    return `href="${repo}/blob/main/${path.replace(/^\.\//, '')}"`;
  });
}

const families = loadAll();
const officialDir = join(root, 'public', 'official');
rmSync(officialDir, { recursive: true, force: true });

for (const fam of Object.values(families)) {
  const readmeCache = {};
  const readme = (p) => (readmeCache[p] ??= readVendorFile(fam.id, p));
  for (const ship of fam.ships) {
    if (ship.install) {
      const [file, heading] = ship.install;
      ship.installHtml = absolutise(md.render(section(readme(file), heading)), fam.repo, file);
      ship.installSource = `${fam.repo}/blob/main/${file}`;
    }
    if (ship.files) {
      ship.official = {};
      for (const [mode, path] of Object.entries(ship.files)) {
        if (!vendorFileExists(fam.id, path)) throw new Error(`${fam.id}: official file missing ${path}`);
        const outDir = join(officialDir, fam.id);
        mkdirSync(outDir, { recursive: true });
        const name = basename(path);
        copyFileSync(join(VENDOR, ADAPTERS[fam.id].dir, path), join(outDir, name));
        ship.official[mode] = { path, url: `/official/${fam.id}/${name}`, name };
      }
    }
  }
}

const generated = join(root, 'src', 'generated');
mkdirSync(generated, { recursive: true });
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const model = {
  site: { name: 'Gam', version: pkg.version, builtAt: new Date().toISOString().slice(0, 10) },
  order: Object.keys(families),
  families,
};
writeFileSync(join(generated, 'model.json'), JSON.stringify(model, null, 1) + '\n');
// A small summary for the site chrome script, so reading pages do not
// carry the whole model.
const meta = {
  site: model.site,
  order: model.order,
  families: Object.fromEntries(model.order.map((id) => [id, {
    name: families[id].name,
    bg: { dark: families[id].modes.dark.roles.bg.hex, light: families[id].modes.light.roles.bg.hex },
  }])),
};
writeFileSync(join(generated, 'meta.json'), JSON.stringify(meta) + '\n');
console.log(`model: ${Object.keys(families).join(', ')} -> src/generated/model.json`);
