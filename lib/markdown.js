// A small, safe Markdown subset for Lab notes. Everything is HTML-escaped first, so admin text can never inject markup.
//   ## Heading   ### Smaller heading
//   - bullet  or  1. numbered   (one item per line)
//   > quote
//   **bold**  *italic*  [link text](https://…)
//   [[NOTE: …]]  an editor's note: highlighted in previews, and publishing is refused while one is left
// Blank lines separate blocks; a single line break inside a paragraph is kept.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

export const hasNotes = (s) => /\[\[[\s\S]*?\]\]/.test(String(s || ''));
export const countNotes = (s) => (String(s || '').match(/\[\[[\s\S]*?\]\]/g) || []).length;
export const readMinutes = (s) => Math.max(1, Math.round(String(s || '').split(/\s+/).filter(Boolean).length / 220));

function inline(s) {
  return esc(s)
    .replace(/\[\[([\s\S]*?)\]\]/g, '<mark class="todo">$1</mark>')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|\/|#)[^\s)]*)\)/g, (_, text, url) =>
      `<a href="${url}"${/^https?:/.test(url) ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
}

export function renderMarkdown(src) {
  const blocks = String(src || '').replace(/\r\n?/g, '\n').trim().split(/\n\s*\n/).filter(Boolean);
  return blocks.map((b) => {
    const lines = b.split('\n').map((l) => l.trimEnd());
    const h = lines.length === 1 && b.match(/^(#{1,3})\s+(.+)$/);
    if (h) { const lv = h[1].length === 3 ? 3 : 2; return `<h${lv}>${inline(h[2])}</h${lv}>`; }
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`;
    if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`;
    if (lines.every((l) => /^>/.test(l))) return `<blockquote><p>${lines.map((l) => inline(l.replace(/^>\s?/, ''))).join('<br>')}</p></blockquote>`;
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  }).join('\n');
}
