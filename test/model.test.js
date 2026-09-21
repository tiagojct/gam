import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadAll, readVendorFile, VENDOR, ADAPTERS } from '../src/model/load.js';
import { walkTokens, ROLES, SYNTAX_ROLES, MODES } from '../src/model/token.js';
import { lower } from '../src/colour/hex.js';
import { contrast } from '../src/colour/wcag.js';

const families = loadAll();

describe('every colour traces back to a family file', () => {
  for (const fam of Object.values(families)) {
    it(`${fam.id}: origins are file paths, official keys or named derivations`, () => {
      const cache = {};
      const text = (file) => (cache[file] ??= readFileSync(join(VENDOR, ADAPTERS[fam.id].dir, file), 'utf8').toLowerCase());
      const ids = new Set();
      for (const tok of walkTokens(fam)) {
        expect(tok.hex).toMatch(/^#[0-9A-F]{6}$/);
        ids.add(tok.id);
        if (tok.alias) ids.add(tok.alias);
        const o = tok.origin;
        if (o.derived) {
          expect(o.derived.length).toBeGreaterThan(0);
          expect(o.from.length).toBeGreaterThan(0);
        } else {
          expect(o.file).toBeTruthy();
          expect(o.path).toBeTruthy();
          // The hex is written verbatim somewhere in that file.
          expect(text(o.file)).toContain(lower(tok.hex).slice(1));
        }
      }
      // Every derivation names tokens that exist in the model.
      for (const tok of walkTokens(fam)) {
        if (tok.origin.derived) for (const id of tok.origin.from) expect(ids.has(id), `${tok.id} from ${id}`).toBe(true);
      }
    });
  }
});

describe('shape', () => {
  for (const fam of Object.values(families)) {
    it(`${fam.id} has both modes, all roles and syntax roles`, () => {
      expect(fam.scale.steps.length).toBeGreaterThanOrEqual(11);
      expect(fam.accents.length).toBeGreaterThan(0);
      for (const m of MODES) {
        const mode = fam.modes[m];
        expect(mode.scheme).toBe(m);
        for (const r of ROLES) expect(mode.roles[r], r).toBeTruthy();
        for (const r of SYNTAX_ROLES) expect(mode.syntax[r], r).toBeTruthy();
        expect(mode.terminal.ansi).toHaveLength(16);
      }
      expect(fam.description.length).toBeGreaterThan(20);
      expect(fam.source.commit).toMatch(/^[0-9a-f]{7,}$/);
    });
  }
});

describe('derived light code colours equal the shipped light themes', () => {
  const cases = {
    glauca: 'dist/vscode/themes/Glauca-color-theme.json',
    'try-works': 'dist/vscode/themes/Try-Works-Cold-color-theme.json',
  };
  const scopeFor = {
    keyword: 'keyword', string: 'string', number: 'constant.numeric', comment: 'comment',
    function: 'entity.name.function', type: 'entity.name.type', variable: 'variable',
    parameter: 'variable.parameter', operator: 'keyword.operator', punctuation: 'punctuation',
    decorator: 'meta.decorator',
  };
  for (const [id, file] of Object.entries(cases)) {
    it(id, () => {
      const theme = JSON.parse(readVendorFile(id, file));
      const fg = (scope) => {
        const rule = theme.tokenColors.find((t) => (Array.isArray(t.scope) ? t.scope : [t.scope]).includes(scope));
        return lower(rule.settings.foreground);
      };
      const syn = families[id].modes.light.syntax;
      for (const [role, scope] of Object.entries(scopeFor)) {
        expect(lower(syn[role].hex), role).toBe(fg(scope));
      }
    });
  }
});

describe('site chrome contrast in every family and mode', () => {
  // Fails the build if any text pair the site chrome uses drops below AA.
  const pairs = [
    ['text', 'bg'], ['textMuted', 'bg'], ['link', 'bg'], ['linkHover', 'bg'],
    ['text', 'surface'], ['textMuted', 'surface'],
    ['onButton', 'button'], ['text', 'selection'],
  ];
  for (const fam of Object.values(families)) {
    for (const m of MODES) {
      it(`${fam.id} ${m}`, () => {
        const r = fam.modes[m].roles;
        const failures = [];
        for (const [fgRole, bgRole] of pairs) {
          const ratio = contrast(r[fgRole].hex, r[bgRole].hex);
          if (ratio < 4.5) failures.push(`${fgRole} on ${bgRole}: ${ratio.toFixed(2)}`);
        }
        expect(failures).toEqual([]);
        // Focus rings and borders are non-text: 3:1 against the ground.
        expect(contrast(r.focus.hex, r.bg.hex)).toBeGreaterThanOrEqual(3);
      });
    }
  }
});
