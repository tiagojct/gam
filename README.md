# Gam

Where the four Moby-Dick colour families meet. A static site at
[gam.tiagojacinto.eu](https://gam.tiagojacinto.eu) that presents
[Pequod](https://github.com/tiagojct/pequod),
[Glauca](https://github.com/tiagojct/glauca),
[Try-Works](https://github.com/tiagojct/try-works) and
[Ambergris](https://github.com/tiagojct/ambergris) side by side, shows each
one in use, sends visitors to the right repository and package, and carries
the Carpenter, an export tool that turns any family into the formats people
actually use, entirely in the browser.

In chapter 53 of *Moby-Dick* a gam is the meeting of two or more whaling
ships at sea, where crews visit and exchange news.

## How it is built

Every colour on the site is read from the family's canonical token file at
build time; none is typed by hand.

- `scripts/vendor.sh` shallow-clones the four repositories into `vendor/`
  (gitignored). Pass `name=ref` pairs to pin a family to a commit.
- `src/model/adapters/` holds one adapter per family. Each maps the
  family's own structure (Pequod's crew accents and Log scale, the
  Glauca and Try-Works design-system files, Ambergris's grey ramp and
  aliases) into one normalised model: a base scale, named accents with a
  dark and a light variant, and per mode the site-chrome roles, the syntax
  roles, the terminal palette and the data-visualisation scales. Every
  token records where it came from (a path in the token file, a key in an
  official file the family ships, or a named derivation), and a test
  refuses any colour that cannot be traced.
- `src/generators/` is the shared module the build and the Carpenter both
  use: twenty-eight formats across web, publishing, data, editors,
  terminals and palette files, plus a zip bundle (fflate, bundled).
- `src/colour/` has WCAG 2.x contrast and a port of pequod's
  Viénot-Brettel-Mollon colour-vision simulation with CIE76 ΔE.
- `src/pages/` renders the routes to plain HTML with a small tagged
  template; `src/site/theme-css.js` writes one block of custom properties
  per family and mode. Vite bundles the result; reading pages need no
  JavaScript, the Carpenter does.
- Fonts are Atkinson Hyperlegible Next and JetBrains Mono, subset to
  woff2 and committed (`scripts/subset-fonts.mjs`, OFL texts alongside).
  The Open Graph image and favicons are rendered from the tokens with
  resvg at build time.

```bash
npm ci
npm run vendor      # clone or refresh the four families
npm test            # adapters, colour maths, generators, site checks
npm run build       # dist/
npm run preview     # http://127.0.0.1:4174
```

`npm run dev` renders the pages and starts Vite; re-run `npm run render`
after editing a page module.

### Tests

- Origin audit: every hex in the model is in a family file or derived
  from tokens that are.
- Derived light code colours for Glauca and Try-Works equal the shipped
  light VS Code themes.
- Site-chrome contrast: every text pair the chrome uses is at least
  4.5:1 in all eight family and mode combinations; the build fails
  otherwise.
- Colour maths against the values in the Pequod README.
- One snapshot per generator, family and mode (against frozen copies of
  the token files in `test/fixtures/`, so an upstream change never fails
  the build), and parse tests where a parser exists: JSON, YAML, TOML,
  Lua, plist, Python, R, CSS, GPL and ASE.
- Rendered pages: no inline scripts or styles (the CSP forbids them), no
  emoji, British spelling in prose, accessible names on charts and
  copy buttons.

To refresh the frozen fixtures after a deliberate upstream change:
`sh scripts/update-fixtures.sh && npx vitest run -u`.

## Deployment

The site is served by nginx in a Docker image behind Caddy and a
Cloudflare Tunnel on the VPS, the same shape as Loomings. There is no SSH
deployment: the workflow pushes `ghcr.io/tiagojct/gam:latest` and the
watchtower already on the box redeploys it within five minutes. Files in
`deploy/`:

| File | Purpose |
|---|---|
| `Dockerfile` | node build stage, `nginx:alpine` runtime |
| `nginx.conf` | gzip, one-year immutable cache for `/assets/`, no cache for HTML, CSP without inline scripts or styles, Referrer-Policy, X-Content-Type-Options, Permissions-Policy |
| `docker-compose.yml` | the service as it runs in `/opt/vps/apps/gam/` |
| `Caddyfile.snippet` | the route to append to the Caddyfile |
| `cloudflared-ingress.yml` | the ingress rule for the tunnel |
| `family-dispatch.yml` | the job to add to each family repository's workflow |

`.github/workflows/build-deploy.yml` runs on pushes to `main`, on version
tags, on `repository_dispatch` (event `family-updated`) from the family
repositories, weekly on Monday morning as a fallback, and on demand.
`:latest` moves on every successful run, unlike Loomings, where it moves
only on tags: here a change in a family's tokens must deploy without a
release of this repository.

### Secrets

None in this repository; `GITHUB_TOKEN` pushes the image. Each family
repository needs one secret:

| Secret | Where | Value |
|---|---|---|
| `GAM_DISPATCH_TOKEN` | pequod, glauca, try-works, ambergris | a fine-grained personal access token for `tiagojct/gam` with Contents: read and write |

### Manual steps

1. **DNS.** In the Cloudflare dashboard for `tiagojacinto.eu` (a different
   account from the tunnel's API token, so the API route used for
   `tiagojct.eu` does not apply), add a CNAME: name `gam`, target
   `893f0087-5d84-4c1a-9ca5-5a7b32f3f38b.cfargotunnel.com`, proxied.
2. **Tunnel.** Add the rule from `deploy/cloudflared-ingress.yml` to
   `/etc/cloudflared/config.yml` (write the whole file back) and restart
   cloudflared.
3. **Caddy.** Append `deploy/Caddyfile.snippet` to
   `/opt/vps/caddy/Caddyfile` in place (`cat >>`, never `cp`, so the bind
   mount keeps its inode) and reload:
   `docker exec caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile`.
4. **Certificate.** Nothing to do. Cloudflare terminates TLS at the edge
   and cloudflared connects to Caddy's self-signed listener on 8443, which
   the snippet already declares.
5. **Secrets.** Add `GAM_DISPATCH_TOKEN` to each family repository, and the
   job from `deploy/family-dispatch.yml` to its workflow.
6. **First deploy.** Create the repository `tiagojct/gam` on GitHub and
   push `main`; the workflow publishes the image (the package must be
   public: GitHub, Packages, gam, change visibility). On the VPS:
   `mkdir -p /opt/vps/apps/gam`, copy `deploy/docker-compose.yml` there,
   then `cd /opt/vps/apps/gam && docker compose pull && docker compose up -d`.
7. **Check.** `curl -sI https://gam.tiagojacinto.eu/` should answer 200
   with the CSP header; `docker ps` should show `gam` healthy and
   watchtower tracking it. Append a dated line to `/opt/vps/CHANGELOG.md`.

To build the image locally: `npm run vendor && docker build -f deploy/Dockerfile -t gam .`

## Licence

Code (adapters, generators, pages, build, deployment files): MIT, see
`LICENSE-MIT`. Text and the site's own design: CC BY 4.0, see
`LICENSE-CC-BY-4.0`. The families' tokens stay under their own licences;
the site quotes them and attributes each. Fonts under the SIL Open Font
License, texts in `public/fonts/`.

## Citation

See `CITATION.cff` or the About page.
