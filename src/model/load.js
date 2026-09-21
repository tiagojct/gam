// Node-side loader: reads the vendored repositories and builds the model
// for all four families. The browser never imports this; it gets the JSON
// that scripts/build-model.mjs writes.
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import * as pequod from './adapters/pequod.js';
import * as glauca from './adapters/glauca.js';
import * as tryWorks from './adapters/try-works.js';
import * as ambergris from './adapters/ambergris.js';

export const ADAPTERS = {
  pequod: { ...pequod, dir: 'pequod', tokens: 'pequod.json' },
  glauca: { ...glauca, dir: 'glauca', tokens: 'src/glauca.json' },
  'try-works': { ...tryWorks, dir: 'try-works', tokens: 'src/try-works.json' },
  ambergris: { ...ambergris, dir: 'ambergris', tokens: 'tokens.json' },
};

export const VENDOR = new URL('../../vendor/', import.meta.url).pathname;

function readAll(dir, paths) {
  const files = {};
  for (const p of paths) {
    const full = join(dir, p);
    if (!existsSync(full)) throw new Error(`missing ${full}; run npm run vendor`);
    files[p] = readFileSync(full, 'utf8');
  }
  return files;
}

function commitOf(dir) {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: dir, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

export function loadFamily(id) {
  const a = ADAPTERS[id];
  const dir = join(VENDOR, a.dir);
  const json = JSON.parse(readFileSync(join(dir, a.tokens), 'utf8'));
  const files = readAll(dir, a.NEEDS);
  const fam = a.adapt({ json, files });
  fam.source = { file: a.tokens, commit: commitOf(dir) };
  return fam;
}

export function loadAll() {
  const out = {};
  for (const id of Object.keys(ADAPTERS)) out[id] = loadFamily(id);
  return out;
}

/** Read any file from a family's vendored repository (install sections, official themes). */
export function readVendorFile(id, path) {
  return readFileSync(join(VENDOR, ADAPTERS[id].dir, path), 'utf8');
}

export function vendorFileExists(id, path) {
  return existsSync(join(VENDOR, ADAPTERS[id].dir, path));
}
