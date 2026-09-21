import { html } from '../site/html.js';

export function page(model) {
  return {
    path: '/404/',
    title: 'Not found',
    description: 'There is no page at this address.',
    body: html`
<h1>Not found</h1>
<p class="lede">There is no page at this address. The ships in this gam are ${model.order.map((id, i) => html`${i ? (i === model.order.length - 1 ? ' and ' : ', ') : ''}<a href="/${id}/">${model.families[id].name}</a>`)}; the <a href="/carpenter/">Carpenter</a> and the <a href="/compare/">Compare</a> page are the other two places to go.</p>
`,
  };
}
