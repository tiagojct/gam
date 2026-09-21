// The prose and code samples shown in every family. The prose is from
// Moby-Dick, chapter 53 (1851, public domain). The code is tokenised by
// hand into the model's syntax roles so no highlighter is needed.
import { html, raw, escape } from '../site/html.js';

export const PROSE_TITLE = 'Chapter 53. The Gam';

export function proseSample() {
  return html`
<h3>The Gam</h3>
<p><em>Gam</em>, noun. A social meeting of two (or more) whale-ships, generally on a cruising-ground; when, after exchanging hails, they exchange visits by boats' crews: the two captains remaining, for the time, on board of one ship, and the two chief mates on the other.</p>
<p>The ostensible reason why Ahab did not go on board of the whalers we have described was this: the wind and sea betokened storms. But even had this not been the case, he would not after all, perhaps, have boarded her, judging by his <a href="/about/">subsequent conduct</a> on similar occasions.</p>
<p class="muted">Herman Melville, <em>Moby-Dick; or, The Whale</em> (1851). <span class="subtle">Public domain.</span></p>`;
}

// [role, text] pairs; a null role is plain text.
export const CODE_TOKENS = [
  ['keyword', 'from'], [null, ' '], ['variable', 'dataclasses'], [null, ' '], ['keyword', 'import'], [null, ' '], ['variable', 'dataclass'], [null, '\n\n'],
  ['decorator', '@dataclass'], [null, '\n'],
  ['keyword', 'class'], [null, ' '], ['type', 'Ship'], ['punctuation', ':'], [null, '\n'],
  [null, '    '], ['variable', 'name'], ['punctuation', ':'], [null, ' '], ['type', 'str'], [null, '\n'],
  [null, '    '], ['variable', 'crew'], ['punctuation', ':'], [null, ' '], ['type', 'int'], [null, ' '], ['operator', '='], [null, ' '], ['number', '30'], [null, '\n\n'],
  ['keyword', 'def'], [null, ' '], ['function', 'gam'], ['punctuation', '('], ['parameter', 'ships'], ['punctuation', ':'], [null, ' '], ['type', 'list'], ['punctuation', '['], ['type', 'Ship'], ['punctuation', ']'], ['punctuation', ')'], [null, ' '], ['operator', '->'], [null, ' '], ['type', 'str'], ['punctuation', ':'], [null, '\n'],
  [null, '    '], ['string', '"""Two or more whale-ships meeting at sea."""'], [null, '\n'],
  [null, '    '], ['comment', '# exchange hails, then visits by boats\' crews'], [null, '\n'],
  [null, '    '], ['variable', 'names'], [null, ' '], ['operator', '='], [null, ' '], ['string', '", "'], ['punctuation', '.'], ['function', 'join'], ['punctuation', '('], ['variable', 's'], ['punctuation', '.'], ['variable', 'name'], [null, ' '], ['keyword', 'for'], [null, ' '], ['variable', 's'], [null, ' '], ['keyword', 'in'], [null, ' '], ['variable', 'ships'], ['punctuation', ')'], [null, '\n'],
  [null, '    '], ['variable', 'hands'], [null, ' '], ['operator', '='], [null, ' '], ['function', 'sum'], ['punctuation', '('], ['variable', 's'], ['punctuation', '.'], ['variable', 'crew'], [null, ' '], ['keyword', 'for'], [null, ' '], ['variable', 's'], [null, ' '], ['keyword', 'in'], [null, ' '], ['variable', 'ships'], ['punctuation', ')'], [null, '\n'],
  [null, '    '], ['keyword', 'return'], [null, ' '], ['string', 'f"{names}: {hands} hands, {'], ['constant', 'MAX_BOATS'], ['string', '} boats"'], [null, '\n\n'],
  ['constant', 'MAX_BOATS'], [null, ' '], ['operator', '='], [null, ' '], ['number', '4'], [null, '\n'],
  ['function', 'print'], ['punctuation', '('], ['function', 'gam'], ['punctuation', '('], ['punctuation', '['], ['type', 'Ship'], ['punctuation', '('], ['string', '"Pequod"'], ['punctuation', ')'], ['punctuation', ','], [null, ' '], ['type', 'Ship'], ['punctuation', '('], ['string', '"Samuel Enderby"'], ['punctuation', ','], [null, ' '], ['parameter', 'crew'], ['operator', '='], ['number', '40'], ['punctuation', ')'], ['punctuation', ']'], ['punctuation', ')'], ['punctuation', ')'], [null, '\n'],
];

export function codeSample() {
  const body = CODE_TOKENS.map(([role, text]) =>
    role ? `<span class="tok-${role}">${escape(text)}</span>` : escape(text)).join('');
  return raw(`<pre class="code-sample" tabindex="0"><code>${body}</code></pre>`);
}

/** Plain text of the code sample, for exports that want a preview. */
export const CODE_TEXT = CODE_TOKENS.map(([, t]) => t).join('');

// A small chart: monthly catches as bars, a running mean as a line.
export const CHART_BARS = [14, 22, 17, 30, 25, 34, 28];
export const CHART_LINE = [14, 18, 17.7, 20.8, 21.6, 23.7, 24.3];
export const CHART_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

export function chartSvg(title = 'Catches per month, with the running mean') {
  const w = 360, h = 200, left = 30, bottom = 24, top = 10, right = 8;
  const max = 40;
  const iw = w - left - right, ih = h - top - bottom;
  const n = CHART_BARS.length;
  const bw = iw / n;
  const y = (v) => top + ih - (v / max) * ih;
  const gridLines = [0, 10, 20, 30, 40].map((v) =>
    `<line class="grid" x1="${left}" x2="${w - right}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="axis" x="${left - 4}" y="${(y(v) + 3.5).toFixed(1)}" text-anchor="end">${v}</text>`).join('');
  const bars = CHART_BARS.map((v, i) =>
    `<rect class="bar" x="${(left + i * bw + bw * 0.2).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw * 0.6).toFixed(1)}" height="${(top + ih - y(v)).toFixed(1)}" rx="1"/>`).join('');
  const pts = CHART_LINE.map((v, i) => `${(left + i * bw + bw / 2).toFixed(1)},${y(v).toFixed(1)}`);
  const line = `<polyline class="line" points="${pts.join(' ')}"/>` + pts.map((p) => `<circle class="dot" cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="3"/>`).join('');
  const labels = CHART_LABELS.map((l, i) => `<text class="axis" x="${(left + i * bw + bw / 2).toFixed(1)}" y="${h - 8}" text-anchor="middle">${l}</text>`).join('');
  return raw(`<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escape(title)}">${gridLines}${bars}${line}${labels}</svg>`);
}
