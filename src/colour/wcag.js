// WCAG 2.x relative luminance and contrast ratio.
import { hexToRgb, channelToLinear } from './hex.js';

export function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colours, order independent, 1..21. */
export function contrast(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export const AA = 4.5;
export const AA_LARGE = 3;
export const AAA = 7;

/** Grade a ratio: 'AAA', 'AA', 'AA-large' or 'fail'. */
export function grade(ratio) {
  if (ratio >= AAA) return 'AAA';
  if (ratio >= AA) return 'AA';
  if (ratio >= AA_LARGE) return 'AA-large';
  return 'fail';
}

export function formatRatio(ratio) {
  return `${ratio.toFixed(2)}:1`;
}
