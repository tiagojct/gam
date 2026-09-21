# Glauca

A design system named for the glaucous bloom: the pale blue-grey-green film on
kale leaves, on waves, on eyes. The frost field carries the work; one vivid
sky-blue is the load-bearing mark. Light sibling of
[try-works](https://github.com/tiagojct/try-works).

Two modes, light first: **Pruina** (light, the bloom itself) and **Profundum**
(dark, the deep the sea-god Glaucus lives in).

## The signature

Nothing hides behind the surface. The field stays pale, even, and legible; the
blue — *dies*, #007AFF — is spent only where it must carry weight: the link,
the focus ring, the cursor, the one notice-me callout. Scarcity is what keeps
it load-bearing. The one place the system breaks this on purpose is the code
tier, where a duty to colour-blind readers puts the blue on keywords and admits
the leaf green (*folium*, #62BA46). The reasoning is in
[FOUNDATIONS.md](docs/FOUNDATIONS.md).

## The anchors

Three fixed points, placed rather than decorated:

- **#007AFF (dies)** — light accent-bright, dark accent-deep, the keyword colour,
  the terminal cursor, ANSI bright blue, the P3 gamut anchor.
- **#62BA46 (folium)** — the string colour, ANSI bright green, the success
  signal.
- **#8C8C8C (cinis)** — exactly the dark mode's muted text (5.4:1 on the dark
  ground), and the light mode's faint/disabled family.

## Tiers

Core hues are the identity: saxum (dark neutrals), glaucum (the bloom tints),
caelum (the blue mark), pruina (pale neutrals). Extended hues are added only
for code — folium, bacca (red), viola (violet), lacus (working blue), unda
(cyan); they never appear on posters, slides, or the web.

## Layout

```
src/                 authoring inputs (the only files you edit)
  glauca.json        the single source of truth
  scripts/           generator + checks (generate, validate, cvd, fonts)
  web/               the 11ty app (its generated CSS is embedded in src/web/src/css)
  tailwind/ vscode/ zed/ vivaldi/ firefox/ thunderbird/ zotero/ obsidian/
  typst/ quarto/ omz/ themes/ pptx/ miniflux/ markedit/  scaffolding
  assets/ fonts/ specimen/                              brand assets, fonts, demos
docs/                README's siblings (FOUNDATIONS, PRODUCT, BRAND, ...)
dist/                generated, committed, vendorable surfaces (the build output)
```

## Surfaces

Each is built into `dist/` from `src/glauca.json`:

```
dist/css/               custom properties (colours, type scale, spacing), light at :root
dist/tailwind/          preset: colours, fontSize, spacing, borderRadius
dist/typst/             slide theme + generated colours + poster preset
dist/obsidian/          theme.css + manifest (Pruina / Profundum)
dist/themes/terminals/  Ghostty + iTerm2 presets (Glauca light + Glauca-Dark) + glauca.conf
dist/omz/               oh-my-zsh prompt themes (light + dark)
dist/vscode/            light + dark code themes and a file-icon theme, tuned for R and Python
dist/zed/               Zed theme family (Pruina light + Profundum dark)
dist/vivaldi/           Vivaldi browser themes (light + dark), zipped for import
dist/firefox/           Firefox static theme (both modes in one), packaged as .xpi
dist/thunderbird/       Thunderbird static theme (both modes in one), packaged as .xpi
dist/zotero/            Zotero 7 theme, a userChrome.css drop-in (light + dark)
dist/r/ dist/python/    ggplot2 / matplotlib scales and themes
dist/quarto/ dist/print/   Quarto themes; print CMYK spec
dist/miniflux/          Miniflux reader custom CSS (light + dark via the OS)
dist/markedit/          MarkEdit editor theme bundle
dist/pptx/              PowerPoint templates (light + dark)
src/web/                minimal 11ty starter (built in place)
```

Run `make generate` and all of them rebuild (generate the tokens, then assemble
the scaffolding alongside). `make cvd` runs the colour-vision check.

## Data visualization

Three scales, generated for R (ggplot2) and Python (matplotlib) from the same
json. The categorical scale is Okabe-Ito, the colour-blind-safe field standard,
deliberately brand-free. The sequential scale is a perceptually even ramp on
the brand blue; the diverging scale runs blue to copper through a pale centre —
the cool–warm axis, which is also the colour-blind-safe one.

R: source `dist/r/glauca.R` for `scale_colour_glauca_d`, `_c`, `_div`, their
fill equivalents, and `theme_glauca(mode = "light" or "dark")` — light is the
default. Python: import `dist/python/glauca.py` and call `use_glauca()`; it
registers the `glauca_seq` and `glauca_div` colormaps and sets the categorical
cycle.

## Print

`dist/print/SPEC.md` is generated from the json: profile (PSO Coated v3 /
FOGRA51), a 300% ink limit, a cool rich-black recipe, and CMYK starting values.
Fair warning the other way round from most systems: the *blue* is the risky
ink. #007AFF sits outside coated CMYK and will print duller; run it as a spot
(Pantone 2175 C region) when fidelity matters. `dist/typst/poster.typ` is a
poster preset — trim + 3 mm bleed, crop marks, 5 mm safe guide — defaulting to
the paper field with the one blue mark.

## Accessibility

Every body pair clears WCAG AA in both modes, locked as tests: 18 contrast rows
in `src/scripts/validate.py`, including both hover pairs (dark hovers brighten,
light hovers darken — the raw #007AFF measures under 4.5:1 on the pale ground,
so light-mode hovers use the deep blue and the anchor serves as the large/UI
mark), the sea used as a selection fill (browser menus, mail rows, terminal
search candidates), and the deep blue used as a fill rather than a hover. A
Machado-2009 colour-vision pass covers the code hues; the measured
close pairs (number/function, function/type) are reinforced with weight and
italics, never colour alone. `dist/css/a11y.css` adds :focus-visible rings,
prefers-contrast: more, forced-colors, and reduced-transparency support. Data
is never encoded by colour alone — the categorical scale pairs with marker
shapes in both plotting libraries.

## Typography

IBM Plex, all three voices: **Plex Serif** for display and headings, **Plex
Sans** for interface and body (the reading voice), **Plex Mono** for code and
labels. All OFL; the TTFs are committed in `src/fonts/` and the Portuguese
subsets as woff2 in `src/web/public/fonts/` (`src/fonts/README.md`). The type layer is roles,
not sizes: display, headline, title, subhead, body-lg, body, caption, eyebrow,
data, code — each binding family, size (fluid where it should be), weight,
leading, tracking, OpenType features, and measure, emitted as `.gl-<role>`
classes. Plex has no optical-size axis, so unlike Try-Works the roles carry no
opsz; figures still switch by context (oldstyle proportional in text, lining
tabular in data) and body measure holds at 68ch.

Fallback metrics in `dist/css/fallbacks.css` are metric-matched (fontTools,
computed from the Plex TTFs against Georgia/Arial/Courier New), so the swap
from fallback to webfont does not shift text.

## Motion

Marks a change, does not decorate: four durations (120–480 ms), four quiet
eases, all collapsed under prefers-reduced-motion.

## Development

`src/glauca.json` is the only file you edit. Everything under `dist/` is
generated and committed; `make generate` rebuilds it. (The web app embeds its
generated CSS at `src/web/src/css` — the one generated path inside `src/`.)

```
make generate   # rebuild all surfaces from the json into dist/
make validate   # tokens, hex, mode parity, WCAG contrast (13 rows)
make check      # fail if any generated file drifts from the json
make test       # validate + check (what CI runs)
make cvd        # colour-vision-deficiency report
```

CI runs `validate`, `check`, `cvd`, and the font-coverage check on every push,
so a hand-edited generated file or a contrast regression fails the build.

## Versioning

0.x: the public surface may still move. From 1.0 it freezes and semver applies
to the CSS custom properties, the Tailwind preset keys, the json schema, and
the R and Python names.

## Licensing

Code (generators, configs, CI, scripts) is MIT — see LICENSE-MIT. The design
(palette, token values, docs) is CC-BY-4.0 — see LICENSE-CC-BY-4.0; attribute
Glauca. IBM Plex is OFL; the TTFs and subset woff2 files ship in the repo under
that licence — if you redistribute subsetted fonts, ship the OFL text and keep
the reserved font names.

## Credits

[try-works](https://github.com/tiagojct/try-works) for the machinery and the
single-source discipline; [Flexoki](https://stephango.com/flexoki) for the
published-tokens philosophy. IBM Plex by Mike Abbink and Bold Monday for IBM.
The name is Latin *glaucus* — the bloom on a leaf, the colour of the sea-god's
eyes.
