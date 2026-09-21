// The site mark: four wedges, one per family, in each family's dark-mode
// accent, on the default family's dark ground. Built from the model.
export function faviconSvg(model, size = 64) {
  const fams = model.order.map((id) => model.families[id]);
  const bg = fams[0].modes.dark.roles.bg.hex;
  const ring = fams[0].modes.dark.roles.text.hex;
  const c = size / 2;
  const r = size * 0.42;
  const wedge = (i, hex) => {
    const a0 = (i / fams.length) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / fams.length) * 2 * Math.PI - Math.PI / 2;
    const p = (a) => `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
    return `<path d="M${c},${c} L${p(a0)} A${r},${r} 0 0 1 ${p(a1)} Z" fill="${hex}"/>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
<rect width="${size}" height="${size}" rx="${size * 0.18}" fill="${bg}"/>
${fams.map((f, i) => wedge(i, f.modes.dark.roles.accent.hex)).join('\n')}
<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${ring}" stroke-width="${size * 0.04}"/>
<circle cx="${c}" cy="${c}" r="${size * 0.1}" fill="${bg}" stroke="${ring}" stroke-width="${size * 0.04}"/>
</svg>
`;
}
