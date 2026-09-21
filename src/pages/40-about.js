import { readFileSync } from 'node:fs';
import MarkdownIt from 'markdown-it';
import { html, raw } from '../site/html.js';

const md = new MarkdownIt({ html: false });

export function page(model) {
  const fams = model.order.map((id) => model.families[id]);
  const changelog = readFileSync(new URL('../../CHANGELOG.md', import.meta.url), 'utf8').replace(/^# Changelog\s*/m, '');
  const year = model.site.builtAt.slice(0, 4);
  const bibtex = `@software{jacinto_gam_${year},
  author  = {Jacinto, Tiago},
  title   = {Gam: where the four Moby-Dick colour families meet},
  year    = {${year}},
  version = {${model.site.version}},
  url     = {https://gam.tiagojacinto.eu},
  note    = {Presents ${fams.map((f) => `${f.name} ${f.version}`).join(', ')}}
}`;
  return {
    path: '/about/',
    title: 'About',
    description: 'Why the names, how Gam relates to Loomings, the licences, how to cite, and the changelog.',
    body: html`
<h1>About</h1>
<h2 id="names">Why the names</h2>
<p>In chapter 53 of <em>Moby-Dick</em>, Melville stops the story to define a word: a <em>gam</em> is a social meeting of two or more whale-ships at sea, where the crews cross over in boats and exchange news and letters. Four colour families, each named from the same book, needed a place to meet. This is it.</p>
<ul>
${fams.map((f) => html`<li><strong><a href="/${f.id}/">${f.name}</a></strong>: ${f.tagline} Modes ${f.modes.dark.label} and ${f.modes.light.label}.</li>`)}
</ul>
<p>The export tool is the <a href="/carpenter/">Carpenter</a>, after chapter 107: the ship's carpenter who turns whatever reaches his bench into whatever is asked of it, a leg, an oarlock, a coffin. Here he turns a token file into the format you need.</p>

<h2 id="loomings">Relation to Loomings</h2>
<p><a href="https://loomings.tiagojacinto.eu/app">Loomings</a> is a Markdown editor for the browser, named from chapter 1. It is where the four families are used together: the editor and its rendering take their colours from a palettes file that carries all four, each with its dark and light mode. Gam is the other direction: not an application that uses the families, but the place that presents them, reads their canonical tokens directly, and exports them. Loomings keeps its own copy of the values; Gam reads the repositories at build time, so the two may differ by a release.</p>

<h2 id="licences">Licences</h2>
<p>Unless a repository says otherwise, palette tokens and documentation are <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0</a> and code is <a href="https://opensource.org/licenses/MIT">MIT</a>. The families:</p>
<div class="table-scroll"><table>
<thead><tr><th>Family</th><th>Tokens</th><th>Code</th><th>Stated in the repository</th></tr></thead>
<tbody>
${fams.map((f) => html`<tr><th scope="row">${f.name}</th><td>${f.licence.tokens}</td><td>${f.licence.code}</td><td>${f.licence.stated ? html`Yes: ${f.licence.files.map((x, i) => html`${i ? ', ' : ''}<a href="${f.repo}/blob/main/${x}">${x}</a>`)}` : 'No licence file; the default above is assumed.'}</td></tr>`)}
</tbody>
</table></div>
<p>This site: its code (adapters, generators, pages, build) is MIT; its text is CC BY 4.0. Files the Carpenter generates carry the family's tokens and are yours to use under that family's token licence, with attribution. Files labelled official are copied from the family repository under that repository's licence. The fonts, <a href="https://github.com/googlefonts/atkinson-hyperlegible-next">Atkinson Hyperlegible Next</a> and <a href="https://github.com/JetBrains/JetBrainsMono">JetBrains Mono</a>, are under the SIL Open Font License and are served as subsets from this site with their licence texts (<a href="/fonts/OFL-atkinson.txt">Atkinson</a>, <a href="/fonts/OFL-jetbrains-mono.txt">JetBrains Mono</a>).</p>

<h2 id="cite">How to cite</h2>
<p>Cite the family you use, and Gam if the site itself helped. Glauca and Try-Works ship a <code>CITATION.cff</code>; Pequod is on CRAN and PyPI, so <code>citation("pequod")</code> in R gives its entry. For Gam:</p>
<pre tabindex="0"><code>${bibtex}</code></pre>
<p>A <a href="https://github.com/tiagojct/gam/blob/main/CITATION.cff">CITATION.cff</a> with the same information is in the repository.</p>

<h2 id="build">This build</h2>
<p>Gam ${model.site.version}, built ${model.site.builtAt}. Every colour on the site was read from these files at that moment:</p>
<ul>
${fams.map((f) => html`<li>${f.name} ${f.version}: <a href="${f.repo}/blob/${f.source.commit}/${f.tokenFile}"><code>${f.tokenFile}</code></a> at commit <code>${f.source.commit}</code></li>`)}
</ul>
<p>The site rebuilds whenever a family repository changes, and once a week regardless. Source: <a href="https://github.com/tiagojct/gam">github.com/tiagojct/gam</a>.</p>

<h2 id="privacy">Privacy</h2>
<p>Static files only. No analytics, no cookies, no third-party requests. The family and mode you choose are kept in your browser's localStorage and nowhere else; the Carpenter runs entirely on your machine.</p>

<h2 id="changelog">Changelog</h2>
<div class="changelog">${raw(md.render(changelog))}</div>
`,
  };
}
