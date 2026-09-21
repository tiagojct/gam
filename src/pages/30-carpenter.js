import { html } from '../site/html.js';

export function page(model) {
  const fams = model.order.map((id) => model.families[id]);
  return {
    path: '/carpenter/',
    title: 'Carpenter',
    description: 'The export tool: turn any of the four families into CSS, Tailwind, design tokens, Quarto, Typst, LaTeX, ggplot2, matplotlib, editor themes, terminal presets and palette files, in the browser.',
    scripts: ['src/workshop/carpenter.js'],
    stylesheets: ['src/styles/carpenter.css'],
    body: html`
<h1>Carpenter</h1>
<p class="lede">The ship's carpenter (chapter 107) turns whatever reaches his bench into whatever is asked of it. This bench turns any family into the formats people actually use. Everything runs in your browser: nothing is uploaded and no request leaves this site.</p>
<noscript><div class="callout"><p><strong>The Carpenter needs JavaScript.</strong> The generators run in the browser so that nothing is sent anywhere. Without JavaScript you can still download the files each family ships from its family page: ${fams.map((f, i) => html`${i ? ', ' : ''}<a href="/${f.id}/#install">${f.name}</a>`)}.</p></div></noscript>

<form id="bench" class="bench" aria-labelledby="bench-heading">
  <h2 id="bench-heading">Choose</h2>
  <div class="bench-row">
    <div class="field">
      <label for="c-family">Family</label>
      <select id="c-family" name="family">
        ${fams.map((f) => html`<option value="${f.id}">${f.name} ${f.version}</option>`)}
      </select>
    </div>
    <fieldset class="field">
      <legend>Mode</legend>
      <div class="seg">
        <label><input type="radio" name="mode" value="dark"> Dark</label>
        <label><input type="radio" name="mode" value="light"> Light</label>
        <label><input type="radio" name="mode" value="both" checked> Both</label>
      </div>
    </fieldset>
    <div class="field">
      <label for="c-prefix">CSS prefix</label>
      <input id="c-prefix" name="prefix" type="text" pattern="[a-zA-Z][a-zA-Z0-9-]*" maxlength="24" autocomplete="off" spellcheck="false">
      <small class="muted">Used where a format has a namespace: CSS, SCSS.</small>
    </div>
  </div>

  <fieldset class="field accents-field">
    <legend>Accents for data visualisation</legend>
    <p class="muted">Tick the accents to export as series colours and set their order. Used by the CSS series variables, ggplot2, matplotlib, Observable and Typst outputs.</p>
    <ol id="c-accents" class="accent-list"></ol>
    <div class="bench-row">
      <div class="field">
        <label for="c-count">Keep</label>
        <select id="c-count"></select>
      </div>
      <button type="button" id="c-order" class="quiet">Order for colour-vision distance</button>
    </div>
    <div id="c-order-result" class="order-result" aria-live="polite"></div>
  </fieldset>
</form>

<section aria-labelledby="outputs-heading">
  <div class="outputs-head">
    <h2 id="outputs-heading">Outputs</h2>
    <button type="button" id="c-zip">Download all as zip</button>
  </div>
  <p class="muted">Each output has a live preview, a copy button and a download. Where the family repository already ships a file for a target, that file is offered and labelled <span class="badge official">official</span>; otherwise the file is <span class="badge">generated</span> here from the tokens. Every generated file carries the family, version and commit it came from.</p>
  <div id="c-outputs" class="outputs"></div>
</section>

<section id="contrast" aria-labelledby="contrast-heading" class="checker">
  <h2 id="contrast-heading">Contrast checker</h2>
  <p>Pick any two tokens from any family. The WCAG 2.x ratio, the AA marks, and the pair as a protanope, a deuteranope and a tritanope would see it (Viénot-Brettel-Mollon, full severity).</p>
  <div class="bench-row">
    <div class="field">
      <label for="k-fg-family">Text family</label>
      <select id="k-fg-family"></select>
      <label for="k-fg">Text token</label>
      <select id="k-fg"></select>
    </div>
    <div class="field">
      <label for="k-bg-family">Surface family</label>
      <select id="k-bg-family"></select>
      <label for="k-bg">Surface token</label>
      <select id="k-bg"></select>
    </div>
  </div>
  <div id="k-result" class="k-result" aria-live="polite"></div>
</section>
`,
  };
}
