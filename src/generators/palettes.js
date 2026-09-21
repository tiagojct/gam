// Palette files: GIMP/Inkscape .gpl, Adobe .ase (binary), a plain hex list.
import { view, header, kebab, modesOf, rgb255, rgb01 } from './common.js';

/** Every colour worth exporting from a family, with labels, per mode. */
function entries(fam, opts) {
  const modes = modesOf(opts.mode);
  const first = view(fam, { ...opts, mode: modes[0] });
  const list = [];
  for (const s of first.scale) list.push({ name: s.label, hex: s.hex });
  for (const sc of first.extraScales) for (const s of sc.steps) list.push({ name: s.label, hex: s.hex });
  for (const mode of modes) {
    const v = view(fam, { ...opts, mode });
    for (const a of v.allAccents) list.push({ name: `${a.label} (${mode})`, hex: a.hex });
  }
  return { list, first };
}

export const gpl = {
  id: 'gpl', label: 'GIMP / Inkscape palette (.gpl)', group: 'palettes', ext: 'gpl', mime: 'text/plain',
  generate(fam, opts) {
    const { list, first } = entries(fam, opts);
    let out = `GIMP Palette\nName: ${first.name} (Gam)\nColumns: 8\n`;
    out += header(first, 'hash');
    for (const e of list) {
      const [r, g, b] = rgb255(e.hex);
      out += `${String(r).padStart(3)} ${String(g).padStart(3)} ${String(b).padStart(3)}\t${e.name}\n`;
    }
    return [{ name: `${kebab(first.name)}.gpl`, content: out, mime: this.mime }];
  },
};

/** Adobe Swatch Exchange, one group holding RGB global colours. */
export function encodeAse(groupName, list) {
  const enc = (s) => {
    const u = new Uint8Array((s.length + 1) * 2);
    for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); u[i * 2] = c >> 8; u[i * 2 + 1] = c & 0xff; }
    return u;
  };
  const blocks = [];
  const push = (type, body) => {
    const b = new Uint8Array(6 + body.length);
    const dv = new DataView(b.buffer);
    dv.setUint16(0, type);
    dv.setUint32(2, body.length);
    b.set(body, 6);
    blocks.push(b);
  };
  // group start
  {
    const name = enc(groupName);
    const body = new Uint8Array(2 + name.length);
    new DataView(body.buffer).setUint16(0, name.length / 2);
    body.set(name, 2);
    push(0xc001, body);
  }
  for (const e of list) {
    const name = enc(e.name);
    const body = new Uint8Array(2 + name.length + 4 + 12 + 2);
    const dv = new DataView(body.buffer);
    let o = 0;
    dv.setUint16(o, name.length / 2); o += 2;
    body.set(name, o); o += name.length;
    body.set([0x52, 0x47, 0x42, 0x20], o); o += 4; // 'RGB '
    for (const c of rgb01(e.hex)) { dv.setFloat32(o, c); o += 4; }
    dv.setUint16(o, 0); // global colour
    push(0x0001, body);
  }
  push(0xc002, new Uint8Array(0));
  const total = 12 + blocks.reduce((n, b) => n + b.length, 0);
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  out.set([0x41, 0x53, 0x45, 0x46], 0); // ASEF
  dv.setUint16(4, 1); dv.setUint16(6, 0);
  dv.setUint32(8, blocks.length);
  let o = 12;
  for (const b of blocks) { out.set(b, o); o += b.length; }
  return out;
}

export const ase = {
  id: 'ase', label: 'Adobe swatch exchange (.ase)', group: 'palettes', ext: 'ase', mime: 'application/octet-stream',
  generate(fam, opts) {
    const { list, first } = entries(fam, opts);
    return [{ name: `${kebab(first.name)}.ase`, content: encodeAse(`${first.name} (Gam)`, list), mime: this.mime }];
  },
};

export const hexList = {
  id: 'hex', label: 'Plain hex list', group: 'palettes', ext: 'txt', mime: 'text/plain',
  generate(fam, opts) {
    const { list, first } = entries(fam, opts);
    let out = header(first, 'hash');
    for (const e of list) out += `${e.hex}  ${e.name}\n`;
    return [{ name: `${kebab(first.name)}-hex.txt`, content: out, mime: this.mime }];
  },
};
