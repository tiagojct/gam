// Colour-vision-deficiency simulation and colour difference.
//
// A port of pequod's scripts/cvd_check.py: Vienot, Brettel and Mollon (1999)
// dichromat simulation at full severity in LMS space, and CIE76 delta E in
// CIELAB (D65). The matrices are copied from that script so the two agree.
//
// Reference: Vienot F, Brettel H, Mollon JD. Digital video colourmaps for
// checking the legibility of displays by dichromats. Color Res Appl.
// 1999;24(4):243-252.
import { hexToRgb, rgbToHex, channelToLinear, linearToChannel } from './hex.js';

const RGB2LMS = [
  [17.8824, 43.5161, 4.11935],
  [3.45565, 27.1554, 3.86714],
  [0.0299566, 0.184309, 1.46709],
];

const SIM = {
  protan: [
    [0.0, 2.02344, -2.52581],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 1.0],
  ],
  deutan: [
    [1.0, 0.0, 0.0],
    [0.494207, 0.0, 1.24827],
    [0.0, 0.0, 1.0],
  ],
  tritan: [
    [1.0, 0.0, 0.0],
    [0.0, 1.0, 0.0],
    [-0.395913, 0.801109, 0.0],
  ],
};

export const CVD_TYPES = ['protan', 'deutan', 'tritan'];
export const CVD_LABELS = { protan: 'protanopia', deutan: 'deuteranopia', tritan: 'tritanopia' };

function mul(m, v) {
  return m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
}

function invert3(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ];
}

const LMS2RGB = invert3(RGB2LMS);

/** Simulate a hex colour as seen by a dichromat: 'protan', 'deutan' or 'tritan'. */
export function simulate(hex, type) {
  const matrix = SIM[type];
  if (!matrix) throw new Error(`unknown CVD type: ${type}`);
  const lin = hexToRgb(hex).map(channelToLinear);
  const lms = mul(RGB2LMS, lin);
  const sim = mul(matrix, lms);
  const out = mul(LMS2RGB, sim);
  return rgbToHex(out.map(linearToChannel));
}

const RGB2XYZ = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.072175],
  [0.0193339, 0.119192, 0.9503041],
];
const WHITE_D65 = [0.95047, 1.0, 1.08883];

export function lab(hex) {
  const lin = hexToRgb(hex).map(channelToLinear);
  const xyz = mul(RGB2XYZ, lin).map((v, i) => v / WHITE_D65[i]);
  const delta = 6 / 29;
  const f = (t) => (t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta ** 2) + 4 / 29);
  const [fx, fy, fz] = xyz.map(f);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** CIE76 colour difference. */
export function deltaE(a, b) {
  const la = lab(a);
  const lb = lab(b);
  return Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

/** Minimum delta E between two colours across the three simulations. */
export function worstDeltaE(a, b) {
  let worst = { type: null, deltaE: Infinity };
  for (const type of CVD_TYPES) {
    const d = deltaE(simulate(a, type), simulate(b, type));
    if (d < worst.deltaE) worst = { type, deltaE: d };
  }
  return worst;
}

/**
 * All pairwise worst-case distances for a list of {id, hex}.
 * Returns [{a, b, type, deltaE}] sorted ascending.
 */
export function pairwise(items) {
  const out = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const w = worstDeltaE(items[i].hex, items[j].hex);
      out.push({ a: items[i].id, b: items[j].id, ...w });
    }
  }
  return out.sort((x, y) => x.deltaE - y.deltaE);
}

/**
 * Choose `n` of the items maximising the minimum pairwise worst-case delta E,
 * then order them so that adjacent items are as far apart as possible. Both
 * searches are exhaustive; the accent counts involved (at most eight) keep
 * that cheap. Returns { order, worstPair, worstAdjacent }.
 */
export function orderForCvd(items, n = items.length) {
  const count = Math.min(n, items.length);
  const dist = new Map();
  for (const p of pairwise(items)) {
    dist.set(p.a + '|' + p.b, p);
    dist.set(p.b + '|' + p.a, p);
  }
  const d = (x, y) => dist.get(x.id + '|' + y.id);

  let bestSubset = null;
  let bestMin = -1;
  const combos = (start, chosen) => {
    if (chosen.length === count) {
      let min = Infinity;
      for (let i = 0; i < chosen.length; i++)
        for (let j = i + 1; j < chosen.length; j++) min = Math.min(min, d(chosen[i], chosen[j]).deltaE);
      if (min > bestMin) {
        bestMin = min;
        bestSubset = chosen.slice();
      }
      return;
    }
    for (let i = start; i < items.length; i++) combos(i + 1, [...chosen, items[i]]);
  };
  combos(0, []);

  let bestOrder = null;
  let bestAdj = -1;
  const perms = (rest, acc) => {
    if (rest.length === 0) {
      let min = Infinity;
      for (let i = 1; i < acc.length; i++) min = Math.min(min, d(acc[i - 1], acc[i]).deltaE);
      if (min > bestAdj) {
        bestAdj = min;
        bestOrder = acc.slice();
      }
      return;
    }
    for (let i = 0; i < rest.length; i++) perms([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, rest[i]]);
  };
  perms(bestSubset, []);

  const worstPair = pairwise(bestSubset)[0] || null;
  let worstAdjacent = null;
  for (let i = 1; i < bestOrder.length; i++) {
    const p = d(bestOrder[i - 1], bestOrder[i]);
    if (!worstAdjacent || p.deltaE < worstAdjacent.deltaE) worstAdjacent = p;
  }
  return { order: bestOrder, worstPair, worstAdjacent };
}
