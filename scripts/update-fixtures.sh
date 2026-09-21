#!/bin/sh
# Copy the files the adapters read from vendor/ into test/fixtures/, so the
# generator snapshot tests run against frozen inputs and do not break when
# a family repository moves. Run after a deliberate upstream refresh, then
# update the snapshots (npx vitest run -u) and commit both.
set -eu
cd "$(dirname "$0")/.."
node - <<'JS'
import { mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { ADAPTERS, VENDOR } from './src/model/load.js';
for (const [id, a] of Object.entries(ADAPTERS)) {
  const src = join(VENDOR, a.dir);
  const dst = join('test/fixtures', a.dir);
  for (const f of [a.tokens, ...a.NEEDS]) {
    mkdirSync(dirname(join(dst, f)), { recursive: true });
    copyFileSync(join(src, f), join(dst, f));
  }
  const sha = execSync('git rev-parse --short HEAD', { cwd: src, encoding: 'utf8' }).trim();
  writeFileSync(join(dst, 'COMMIT'), sha + '\n');
  console.log(`${id} ${sha}`);
}
JS
