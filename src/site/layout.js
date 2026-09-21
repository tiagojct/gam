// The page shell shared by every route: head metadata, skip link, header
// with navigation and the theme switcher's placeholder, main, footer.
import { html, raw } from './html.js';
import { themeColours } from './theme-css.js';

export const SITE_URL = 'https://gam.tiagojacinto.eu';

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/pequod/', label: 'Pequod' },
  { href: '/glauca/', label: 'Glauca' },
  { href: '/try-works/', label: 'Try-Works' },
  { href: '/ambergris/', label: 'Ambergris' },
  { href: '/compare/', label: 'Compare' },
  { href: '/carpenter/', label: 'Carpenter' },
  { href: '/about/', label: 'About' },
];

/**
 * page: { path: '/pequod/', title, description, body (Raw), scripts: [relative module paths],
 *         stylesheets: [], head: Raw }
 * model: the generated model; rel: prefix to reach the project root from the page.
 */
export function layout(page, model, rel) {
  const defaultFamily = model.families[model.order[0]];
  const [lightColour, darkColour] = themeColours(defaultFamily);
  const fullTitle = page.path === '/' ? 'Gam: where the four families meet' : `${page.title} · Gam`;
  const url = SITE_URL + page.path;
  return raw(`<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeText(fullTitle)}</title>
<meta name="description" content="${escapeText(page.description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Gam">
<meta property="og:title" content="${escapeText(fullTitle)}">
<meta property="og:description" content="${escapeText(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_URL}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="${lightColour}">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${darkColour}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.png" type="image/png" sizes="64x64">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="${rel}src/generated/theme.css">
<link rel="stylesheet" href="${rel}src/styles/site.css">
${(page.stylesheets || []).map((s) => `<link rel="stylesheet" href="${rel}${s}">`).join('\n')}
<script src="/theme.js"></script>
${page.head ? String(page.head) : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="/" aria-label="Gam, home"><span class="brand-mark" aria-hidden="true"></span>Gam</a>
    <nav class="site-nav" aria-label="Site">
      <ul>
${NAV.map((n) => `        <li><a href="${n.href}"${n.href === page.path ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('\n')}
      </ul>
    </nav>
    <div id="theme-switch" class="theme-switch"></div>
  </div>
</header>
<main id="main" class="wrap" tabindex="-1">
${String(page.body)}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p>Gam ${model.site.version}, built ${model.site.builtAt} from ${model.order.map((id) => `${model.families[id].name} ${model.families[id].version} (${model.families[id].source.commit})`).join(', ')}.</p>
    <p>Tokens CC BY 4.0, code MIT, each family under its own licence. <a href="/about/#licences">Licences and citation</a>. <a href="https://github.com/tiagojct/gam">Source</a>.</p>
  </div>
</footer>
<div id="announce" class="visually-hidden" aria-live="polite"></div>
<script type="module" src="${rel}src/site.js"></script>
${(page.scripts || []).map((s) => `<script type="module" src="${rel}${s}"></script>`).join('\n')}
</body>
</html>
`);
}

function escapeText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export { html, raw };
