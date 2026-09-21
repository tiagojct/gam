# Changelog

All notable changes to the Gam site are recorded here. The format follows
Keep a Changelog and the project uses semantic versioning. The four
families keep their own changelogs in their repositories.

## [0.1.0] - 2026-09-21

First release.

- Home, one page per family (Pequod, Glauca, Try-Works, Ambergris),
  Compare, Carpenter and About.
- One adapter per family mapping the canonical token files into a shared
  model; every colour carries its origin and a test audits it.
- Build-time WCAG 2.x contrast tables, colour-vision notes linked to the
  source, install sections quoted from each repository.
- The Carpenter: twenty-eight export formats generated in the browser
  (web, publishing, data, editors, terminals, palette files), official
  files offered verbatim where a family ships one, a colour-vision
  ordering for accents, a zip bundle, and a contrast checker with
  protan, deutan and tritan simulation.
- Site chrome restyles in any family and mode; the choice is remembered
  in localStorage and the pages render without it or without JavaScript.
- Open Graph image, favicons and theme-color generated from the tokens.
- nginx image, GitHub Actions workflow with repository_dispatch and a
  weekly schedule, deployment notes for the VPS.
