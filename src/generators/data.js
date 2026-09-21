// Data-visualisation formats: ggplot2 scale functions, a matplotlib style
// sheet with a colormap snippet, an Observable Plot / D3 scheme array.
import { view, header, kebab, snake, modesOf } from './common.js';

const rvec = (pairs) => `c(${pairs.map(([k, h]) => `${k} = "${h}"`).join(', ')})`;
const rlist = (arr) => `c(${arr.map((h) => `"${h}"`).join(', ')})`;

export const ggplot2 = {
  id: 'ggplot2', label: 'ggplot2 scales (R)', group: 'data', ext: 'R', mime: 'text/x-r',
  generate(fam, opts) {
    const modes = modesOf(opts.mode);
    const first = view(fam, { ...opts, mode: modes[0] });
    const p = snake(first.name);
    let out = header(first, 'hash', 'source() this file; needs ggplot2.');
    out += `\n${p}_scale <- ${rvec(first.scale.map((s) => [snake(s.id), s.hex]))}\n`;
    for (const mode of modes) {
      const v = view(fam, { ...opts, mode });
      out += `\n# ${v.modeLabel} (${mode})\n`;
      out += `${p}_${mode} <- list(\n  bg = "${v.roles.bg}", surface = "${v.roles.surface}", text = "${v.roles.text}", muted = "${v.roles.textMuted}",\n  grid = "${v.dataviz.plot.grid}", border = "${v.roles.border}", accent = "${v.roles.accent}", link = "${v.roles.link}"\n)\n`;
      out += `${p}_accents_${mode} <- ${rvec(v.allAccents.map((a) => [snake(a.id), a.hex]))}\n`;
      out += `${p}_series_${mode} <- ${rlist(v.dataviz.categorical)}\n`;
      out += `${p}_sequential_${mode} <- ${rlist(v.dataviz.sequential)}\n`;
      if (v.dataviz.diverging) out += `${p}_diverging_${mode} <- ${rlist(v.dataviz.diverging)}\n`;
    }
    const d = modes[0];
    out += `
#' Discrete colour and fill scales
scale_colour_${p}_d <- function(mode = "${d}", ...) {
  values <- get(paste0("${p}_series_", mode))
  ggplot2::scale_colour_manual(values = unname(values), ...)
}
scale_color_${p}_d <- scale_colour_${p}_d
scale_fill_${p}_d <- function(mode = "${d}", ...) {
  values <- get(paste0("${p}_series_", mode))
  ggplot2::scale_fill_manual(values = unname(values), ...)
}

#' Continuous (sequential) scales
scale_colour_${p}_c <- function(mode = "${d}", ...) {
  ggplot2::scale_colour_gradientn(colours = get(paste0("${p}_sequential_", mode)), ...)
}
scale_color_${p}_c <- scale_colour_${p}_c
scale_fill_${p}_c <- function(mode = "${d}", ...) {
  ggplot2::scale_fill_gradientn(colours = get(paste0("${p}_sequential_", mode)), ...)
}
${first.dataviz.diverging ? `
#' Diverging scales
scale_colour_${p}_div <- function(mode = "${d}", ...) {
  ggplot2::scale_colour_gradientn(colours = get(paste0("${p}_diverging_", mode)), ...)
}
scale_fill_${p}_div <- function(mode = "${d}", ...) {
  ggplot2::scale_fill_gradientn(colours = get(paste0("${p}_diverging_", mode)), ...)
}
` : ''}
#' A theme on the family's plot surface
theme_${p} <- function(mode = "${d}", base_size = 11) {
  m <- get(paste0("${p}_", mode))
  ggplot2::theme_minimal(base_size = base_size) +
    ggplot2::theme(
      plot.background = ggplot2::element_rect(fill = m$bg, colour = NA),
      panel.background = ggplot2::element_rect(fill = m$bg, colour = NA),
      panel.grid.major = ggplot2::element_line(colour = m$grid),
      panel.grid.minor = ggplot2::element_blank(),
      text = ggplot2::element_text(colour = m$text),
      axis.text = ggplot2::element_text(colour = m$muted),
      legend.background = ggplot2::element_rect(fill = m$bg, colour = NA),
      strip.text = ggplot2::element_text(colour = m$text)
    )
}
`;
    return [{ name: `${kebab(first.name)}.R`, content: out, mime: this.mime }];
  },
};

export const matplotlib = {
  id: 'matplotlib', label: 'matplotlib style and colormaps (Python)', group: 'data', ext: 'mplstyle', mime: 'text/plain',
  generate(fam, opts) {
    const modes = modesOf(opts.mode);
    const files = [];
    const noHash = (hex) => hex.slice(1);
    for (const mode of modes) {
      const v = view(fam, { ...opts, mode });
      // The mplstyle parser treats # as a comment, so hex values go without it.
      let out = header(v, 'hash', `plt.style.use("${kebab(v.name)}-${mode}.mplstyle")`);
      out += `figure.facecolor: ${noHash(v.dataviz.plot.bg)}\n`;
      out += `axes.facecolor: ${noHash(v.dataviz.plot.bg)}\naxes.edgecolor: ${noHash(v.dataviz.plot.grid)}\n`;
      out += `axes.labelcolor: ${noHash(v.dataviz.plot.text)}\naxes.titlecolor: ${noHash(v.dataviz.plot.text)}\n`;
      out += `axes.grid: True\ngrid.color: ${noHash(v.dataviz.plot.grid)}\ngrid.linewidth: 0.8\n`;
      out += `xtick.color: ${noHash(v.dataviz.plot.muted)}\nytick.color: ${noHash(v.dataviz.plot.muted)}\n`;
      out += `text.color: ${noHash(v.dataviz.plot.text)}\nlegend.frameon: False\n`;
      out += `axes.spines.top: False\naxes.spines.right: False\n`;
      out += `savefig.facecolor: ${noHash(v.dataviz.plot.bg)}\n`;
      out += `axes.prop_cycle: cycler('color', [${v.dataviz.categorical.map((h) => `'${noHash(h)}'`).join(', ')}])\n`;
      files.push({ name: `${kebab(v.name)}-${mode}.mplstyle`, content: out, mime: this.mime });
    }
    const first = view(fam, { ...opts, mode: modes[0] });
    const p = snake(first.name);
    let py = header(first, 'hash', 'import this module and call register_cmaps() once.');
    py += `from matplotlib.colors import LinearSegmentedColormap\nimport matplotlib as mpl\n\n`;
    py += `SCALE = {${first.scale.map((s) => `"${snake(s.id)}": "${s.hex}"`).join(', ')}}\n`;
    for (const mode of modes) {
      const v = view(fam, { ...opts, mode });
      const M = mode.toUpperCase();
      py += `ACCENTS_${M} = {${v.allAccents.map((a) => `"${snake(a.id)}": "${a.hex}"`).join(', ')}}\n`;
      py += `SERIES_${M} = [${v.dataviz.categorical.map((h) => `"${h}"`).join(', ')}]\n`;
      py += `SEQUENTIAL_${M} = [${v.dataviz.sequential.map((h) => `"${h}"`).join(', ')}]\n`;
      if (v.dataviz.diverging) py += `DIVERGING_${M} = [${v.dataviz.diverging.map((h) => `"${h}"`).join(', ')}]\n`;
    }
    py += `\n\ndef register_cmaps():\n    """Register ${p}_seq_<mode> (and _div where the family has one)."""\n`;
    for (const mode of modes) {
      const v = view(fam, { ...opts, mode });
      const M = mode.toUpperCase();
      py += `    mpl.colormaps.register(LinearSegmentedColormap.from_list("${p}_seq_${mode}", SEQUENTIAL_${M}), force=True)\n`;
      if (v.dataviz.diverging) py += `    mpl.colormaps.register(LinearSegmentedColormap.from_list("${p}_div_${mode}", DIVERGING_${M}), force=True)\n`;
    }
    py += `\n\ndef use(mode="${modes[0]}"):\n    """Apply the series cycle for a mode."""\n    mpl.rcParams["axes.prop_cycle"] = mpl.cycler(color=globals()["SERIES_" + mode.upper()])\n`;
    files.push({ name: `${p}_colours.py`, content: py, mime: 'text/x-python' });
    return files;
  },
};

export const observable = {
  id: 'observable', label: 'Observable Plot / D3 scheme', group: 'data', ext: 'js', mime: 'text/javascript',
  generate(fam, opts) {
    const modes = modesOf(opts.mode);
    const first = view(fam, { ...opts, mode: modes[0] });
    const p = snake(first.name).replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    let out = header(first, 'slashes', 'Plot.plot({color: {range: ' + p + 'Dark}}) or d3.scaleOrdinal(' + p + 'Dark).');
    out += `export const ${p}Scale = ${JSON.stringify(first.scale.map((s) => s.hex))};\n`;
    for (const mode of modes) {
      const v = view(fam, { ...opts, mode });
      const M = mode.charAt(0).toUpperCase() + mode.slice(1);
      out += `export const ${p}${M} = ${JSON.stringify(v.dataviz.categorical)};\n`;
      out += `export const ${p}Sequential${M} = ${JSON.stringify(v.dataviz.sequential)};\n`;
      if (v.dataviz.diverging) out += `export const ${p}Diverging${M} = ${JSON.stringify(v.dataviz.diverging)};\n`;
      out += `export const ${p}Plot${M} = ${JSON.stringify(v.dataviz.plot)};\n`;
    }
    out += `export default ${p}${modes[0].charAt(0).toUpperCase() + modes[0].slice(1)};\n`;
    return [{ name: `${kebab(first.name)}-scheme.js`, content: out, mime: this.mime }];
  },
};
