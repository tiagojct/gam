import { html } from '../site/html.js';
import { familyCard } from '../site/components.js';

export function page(model) {
  const fams = model.order.map((id) => model.families[id]);
  return {
    path: '/',
    title: 'Gam',
    description: 'Gam is where the four Moby-Dick colour families meet: Pequod, Glauca, Try-Works and Ambergris, side by side, with an export tool for the formats people actually use.',
    body: html`
<h1>Gam</h1>
<p class="lede">In chapter 53 of <em>Moby-Dick</em> a gam is the meeting of two or more whaling ships at sea, where the crews visit and exchange news. This is where four colour families meet: ${fams.map((f, i) => html`${i > 0 ? (i === fams.length - 1 ? ' and ' : ', ') : ''}<a href="/${f.id}/">${f.name}</a>`)}. Each has a dark and a light variant, its own repository, and some combination of editor themes, terminal presets, and Tailwind, Python and R packages.</p>
<p>Pick a family and a colour scheme in the header and the site restyles itself. Every colour on these pages is read from the family's own token file at build time; none is typed by hand. The <a href="/compare/">Compare</a> page shows the same prose, code and chart in all four at once, and the <a href="/carpenter/">Carpenter</a> turns any family into CSS, Tailwind, design tokens, Quarto, Typst, LaTeX, ggplot2, matplotlib, editor themes, terminal presets and palette files, in the browser.</p>
<ul class="cards">
${fams.map(familyCard)}
</ul>
<h2>What the families share</h2>
<div class="two-col">
<div>
<p>All four are named from <em>Moby-Dick</em> and built to be read at length rather than glanced at: low saturation, warm or cool grounds, accents that carry meaning. Each publishes its tokens as a single JSON file that the rest of its repository regenerates from, with contrast locked by tests.</p>
</div>
<div>
<p>They differ in temperament. Pequod is a reading and code palette with eight named crew accents. Try-Works and Glauca are full design systems, one dark-first and one light-first, each with a single load-bearing mark. Ambergris is near-monochrome, with one teal for interaction and a hue sweep kept for data.</p>
</div>
</div>
`,
  };
}
