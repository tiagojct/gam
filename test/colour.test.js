import { describe, it, expect } from 'vitest';
import { mix8, hexToRgb, rgbToHex, withAlpha, normaliseHex } from '../src/colour/hex.js';
import { contrast, grade } from '../src/colour/wcag.js';
import { simulate, deltaE, orderForCvd, CVD_TYPES } from '../src/colour/cvd.js';
import { loadFamily } from '../src/model/load.js';

describe('hex helpers', () => {
  it('round-trips', () => {
    expect(rgbToHex(hexToRgb('#0B1720'))).toBe('#0B1720');
    expect(normaliseHex('f7f3ee')).toBe('#F7F3EE');
    expect(withAlpha('#0B1720', 0.5)).toBe('#0B172080');
  });
  it('mix8 matches the family generators (8-bit blend, round half up)', () => {
    // kelp toward the True Lamp ink at 0.5 is the shipped light string colour.
    expect(mix8('#86a87f', '#18272b', 0.5)).toBe('#4f6855');
    expect(mix8('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mix8('#000000', '#ffffff', 1)).toBe('#ffffff');
  });
});

describe('WCAG contrast', () => {
  const p = loadFamily('pequod');
  const step = (id) => p.scale.steps.find((s) => s.id === id).hex;
  it('reproduces the Pequod README table', () => {
    expect(contrast(step('log.800'), step('log.100'))).toBeCloseTo(10.8, 1);
    expect(contrast(step('log.100'), step('log.950'))).toBeCloseTo(14.0, 1);
  });
  it('grades', () => {
    expect(grade(21)).toBe('AAA');
    expect(grade(4.5)).toBe('AA');
    expect(grade(3)).toBe('AA-large');
    expect(grade(2.9)).toBe('fail');
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });
});

describe('CVD simulation (port of pequod scripts/cvd_check.py)', () => {
  const p = loadFamily('pequod');
  const closest = (mode, type) => {
    let best = null;
    const acc = p.accents;
    for (let i = 0; i < acc.length; i++) {
      for (let j = i + 1; j < acc.length; j++) {
        const d = deltaE(simulate(acc[i][mode].hex, type), simulate(acc[j][mode].hex, type));
        if (!best || d < best.d) best = { a: acc[i].id, b: acc[j].id, d };
      }
    }
    return best;
  };
  it('reproduces the README worst pairs', () => {
    expect(closest('light', 'protan')).toMatchObject({ a: 'ishmael', b: 'tashtego' });
    expect(closest('light', 'protan').d).toBeCloseTo(15.1, 1);
    expect(closest('light', 'deutan').d).toBeCloseTo(8.0, 1);
    expect(closest('light', 'tritan')).toMatchObject({ a: 'pip', b: 'daggoo' });
    expect(closest('light', 'tritan').d).toBeCloseTo(13.3, 1);
    expect(closest('dark', 'protan')).toMatchObject({ a: 'stubb', b: 'tashtego' });
    expect(closest('dark', 'protan').d).toBeCloseTo(11.8, 1);
    expect(closest('dark', 'deutan').d).toBeCloseTo(6.8, 1);
    expect(closest('dark', 'tritan')).toMatchObject({ a: 'ahab', b: 'pip' });
    expect(closest('dark', 'tritan').d).toBeCloseTo(10.2, 1);
  });
  it('leaves greys alone and clamps', () => {
    for (const t of CVD_TYPES) expect(simulate('#808080', t)).toBe('#808080');
    expect(simulate('#FF0000', 'protan')).toMatch(/^#[0-9A-F]{6}$/);
  });
  it('orders accents for colour-vision distance', () => {
    const items = p.accents.map((a) => ({ id: a.id, hex: a.light.hex }));
    const { order, worstPair, worstAdjacent } = orderForCvd(items, 5);
    expect(order).toHaveLength(5);
    expect(worstPair.deltaE).toBeGreaterThan(8);
    expect(worstAdjacent.deltaE).toBeGreaterThanOrEqual(worstPair.deltaE);
    // The confusable pair never survives a five-accent selection.
    const ids = order.map((o) => o.id);
    expect(ids.includes('ishmael') && ids.includes('tashtego')).toBe(false);
  });
});
