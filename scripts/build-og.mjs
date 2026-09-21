// Render the Open Graph image and the PNG favicons from the model with
// resvg. Fonts come from tools/fonts (subset TTFs committed to the repo).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { ogSvg } from '../src/site/og.js';
import { faviconSvg } from '../src/site/favicon.js';

const root = new URL('../', import.meta.url).pathname;
const model = JSON.parse(readFileSync(join(root, 'src/generated/model.json'), 'utf8'));
const fontFiles = ['atkinson-hyperlegible-next.ttf', 'jetbrains-mono.ttf'].map((f) => join(root, 'tools/fonts', f));

function png(svg, width) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Atkinson Hyperlegible Next' },
  });
  return r.render().asPng();
}

writeFileSync(join(root, 'public/og.png'), png(ogSvg(model), 1200));
writeFileSync(join(root, 'public/favicon.png'), png(faviconSvg(model), 64));
writeFileSync(join(root, 'public/apple-touch-icon.png'), png(faviconSvg(model), 180));
console.log('og.png, favicon.png, apple-touch-icon.png');
