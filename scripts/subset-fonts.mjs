// Fetch the two OFL font families from the google/fonts repository (once,
// into the gitignored tools/fonts/src/) and subset them to the site's
// character range: Latin, Latin-1 (European Portuguese included),
// general punctuation, the euro, and the few Greek and maths symbols the
// contrast and colour-vision tables use. Writes woff2 for the site and
// TTF for the build-time Open Graph renderer. Both outputs are committed,
// so the build itself never fetches anything.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import subsetFont from 'subset-font';

const root = new URL('../', import.meta.url).pathname;
const srcDir = join(root, 'tools', 'fonts', 'src');
const ttfDir = join(root, 'tools', 'fonts');
const outDir = join(root, 'public', 'fonts');
mkdirSync(srcDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const RAW = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const FONTS = [
  { out: 'atkinson-hyperlegible-next', url: `${RAW}/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext%5Bwght%5D.ttf` },
  { out: 'atkinson-hyperlegible-next-italic', url: `${RAW}/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext-Italic%5Bwght%5D.ttf` },
  { out: 'jetbrains-mono', url: `${RAW}/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf` },
  { out: 'jetbrains-mono-italic', url: `${RAW}/jetbrainsmono/JetBrainsMono-Italic%5Bwght%5D.ttf` },
  { out: 'OFL-atkinson', url: `${RAW}/atkinsonhyperlegiblenext/OFL.txt`, licence: true },
  { out: 'OFL-jetbrains-mono', url: `${RAW}/jetbrainsmono/OFL.txt`, licence: true },
];

// Code points to keep. Ranges are inclusive.
const RANGES = [
  [0x0000, 0x00ff], [0x0131, 0x0131], [0x0152, 0x0153], [0x02c6, 0x02c6], [0x02dc, 0x02dc],
  [0x0394, 0x0394], [0x2000, 0x206f], [0x20ac, 0x20ac], [0x2122, 0x2122],
  [0x2190, 0x2193], [0x2212, 0x2212], [0x2260, 0x2265], [0x25a0, 0x25a1], [0x2713, 0x2713],
];
let text = '';
for (const [a, b] of RANGES) for (let c = a; c <= b; c++) text += String.fromCodePoint(c);

for (const f of FONTS) {
  const ext = f.licence ? '.txt' : '.ttf';
  const src = join(srcDir, f.out + ext);
  if (!existsSync(src)) {
    const res = await fetch(f.url);
    if (!res.ok) throw new Error(`${f.url}: ${res.status}`);
    writeFileSync(src, Buffer.from(await res.arrayBuffer()));
    console.log(`fetched ${f.out}${ext}`);
  }
  if (f.licence) {
    writeFileSync(join(outDir, f.out + '.txt'), readFileSync(src));
    continue;
  }
  const full = readFileSync(src);
  const woff2 = await subsetFont(full, text, { targetFormat: 'woff2' });
  writeFileSync(join(outDir, f.out + '.woff2'), woff2);
  let note = '';
  if (!f.out.endsWith('-italic')) {
    // The Open Graph renderer needs TTF; only the upright faces draw there.
    const ttf = await subsetFont(full, text, { targetFormat: 'truetype' });
    writeFileSync(join(ttfDir, f.out + '.ttf'), ttf);
    note = `, ttf ${(ttf.length / 1024).toFixed(0)}K`;
  }
  console.log(`${f.out}: ${(full.length / 1024).toFixed(0)}K -> woff2 ${(woff2.length / 1024).toFixed(0)}K${note}`);
}
