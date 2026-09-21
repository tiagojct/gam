// Read prose out of a family's README files: the one-line description and
// the install sections the site quotes verbatim.

/** Lines of `text` split into fenced-code-aware records. */
function lines(text) {
  const out = [];
  let fence = false;
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    out.push({ line, fence: fence || /^\s*(```|~~~)/.test(line) });
  }
  return out;
}

/**
 * The body of the section under `heading` (exact text, any level), up to
 * the next heading of the same or a higher level. With `heading` null,
 * returns the text between the H1 and the first H2.
 */
export function section(text, heading) {
  const ls = lines(text);
  let level = null;
  let start = -1;
  for (let i = 0; i < ls.length; i++) {
    const { line, fence } = ls[i];
    if (fence) continue;
    const m = /^(#{1,6})\s+(.*?)\s*$/.exec(line);
    if (!m) continue;
    if (heading === null) {
      if (m[1].length === 1 && start < 0) { level = 1; start = i + 1; continue; }
      if (start >= 0) return ls.slice(start, i).map((l) => l.line).join('\n').trim();
      continue;
    }
    if (start < 0) {
      if (m[2] === heading) { level = m[1].length; start = i + 1; }
    } else if (m[1].length <= level) {
      return ls.slice(start, i).map((l) => l.line).join('\n').trim();
    }
  }
  if (start < 0) throw new Error(`README section not found: ${heading}`);
  return ls.slice(start).map((l) => l.line).join('\n').trim();
}

/** First paragraph after the H1, joined to one line, markdown emphasis kept. */
export function firstParagraph(text) {
  const body = section(text, null);
  const para = body.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !p.startsWith('[') && !p.startsWith('!'));
  return para.replace(/\s*\n\s*/g, ' ');
}
