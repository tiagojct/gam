// The Open Graph image as SVG, from the model: the four base scales as
// bands, the four accent sets as dots, the site name set in the two fonts.
export function ogSvg(model, W = 1200, H = 630) {
  const fams = model.order.map((id) => model.families[id]);
  const base = fams[0].modes.dark;
  const bg = base.roles.bg.hex;
  const text = base.roles.text.hex;
  const muted = base.roles.textMuted.hex;
  const pad = 72;
  const bandH = 44;
  const gap = 30;
  const bandsTop = 300;
  const bands = fams.map((f, i) => {
    const y = bandsTop + i * (bandH + gap);
    const steps = f.scale.steps;
    const w = (W - pad * 2 - 280) / steps.length;
    const cells = steps.map((s, j) =>
      `<rect x="${(pad + 280 + j * w).toFixed(1)}" y="${y}" width="${(w + 0.5).toFixed(1)}" height="${bandH}" fill="${s.hex}"/>`).join('');
    const dots = f.accents.slice(0, 8).map((a, j) =>
      `<circle cx="${pad + 150 + j * 16}" cy="${y + bandH / 2 + 14}" r="6" fill="${a.dark.hex}"/>`).join('');
    const frame = `<rect x="${pad + 280}" y="${y}" width="${W - pad * 2 - 280}" height="${bandH}" fill="none" stroke="${muted}" stroke-width="1"/>`;
    return `${frame}<text x="${pad}" y="${y + bandH / 2 - 2}" font-family="Atkinson Hyperlegible Next" font-weight="700" font-size="26" fill="${text}">${f.name}</text>
<text x="${pad}" y="${y + bandH / 2 + 20}" font-family="JetBrains Mono" font-size="15" fill="${muted}">${f.version}</text>${dots}${cells}`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${bg}"/>
<text x="${pad}" y="150" font-family="Atkinson Hyperlegible Next" font-weight="800" font-size="120" fill="${text}">Gam</text>
<text x="${pad}" y="215" font-family="Atkinson Hyperlegible Next" font-size="34" fill="${muted}">Where the four Moby-Dick colour families meet</text>
<text x="${pad}" y="258" font-family="JetBrains Mono" font-size="22" fill="${muted}">gam.tiagojacinto.eu</text>
${bands}
</svg>`;
}
