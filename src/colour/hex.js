// Hex colour helpers shared by the adapters, the generators and the Workshop.
// Everything here is arithmetic on colours that already exist in a family's
// token file; no colour is authored in this module.

const HEX6 = /^#?([0-9a-f]{6})$/i;
const HEX8 = /^#?([0-9a-f]{8})$/i;

export function normaliseHex(value) {
  const m6 = HEX6.exec(value);
  if (m6) return '#' + m6[1].toUpperCase();
  const m8 = HEX8.exec(value);
  if (m8) return '#' + m8[1].toUpperCase();
  throw new Error(`not a hex colour: ${value}`);
}

export function isHex(value) {
  return HEX6.test(value) || HEX8.test(value);
}

/** '#RRGGBB' or '#RRGGBBAA' to [r, g, b] in 0..255 (alpha dropped). */
export function hexToRgb(hex) {
  const h = normaliseHex(hex).slice(1, 7);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function rgbToHex([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return ('#' + c(r) + c(g) + c(b)).toUpperCase();
}

/** Lower-case form, which the family generators and most editors emit. */
export function lower(hex) {
  return normaliseHex(hex).toLowerCase();
}

/**
 * Gamma-encoded 8-bit blend, t in [0, 1], a to b. This is the `_mix` used by
 * the Glauca and Try-Works generators (generate_obsidian.py) to derive their
 * light-mode code colours; it is reproduced exactly so the derived values
 * match the shipped themes bit for bit.
 */
export function mix8(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca.map((v, i) => Math.round(v + (cb[i] - v) * t))).toLowerCase();
}

/** sRGB channel (0..255) to linear light (0..1). */
export function channelToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function linearToChannel(v) {
  const c = Math.max(0, Math.min(1, v));
  const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(s * 255)));
}

/** Append an alpha byte (0..1) to a six-digit hex, as editor themes do. */
export function withAlpha(hex, alpha) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0');
  return normaliseHex(hex).slice(0, 7) + a.toUpperCase();
}

/** 'r g b' triple string, for rgb(r g b / a) and Typst rgb(). */
export function rgbTriple(hex) {
  return hexToRgb(hex).join(' ');
}
