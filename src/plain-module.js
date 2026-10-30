// Converts the shared inlinable modules (src/comments.js,
// src/comment-popup-style.js) from ES-module syntax into a single plain
// script body, so the same sources can run:
//   - as ES modules in the Vite app (normal import), and
//   - as plain <script> blocks in the standalone pages and in the pages
//     exported by the editor (scripts/inline-lib.mjs refills the marker
//     blocks from here, src/export-page.js feeds the export template).
//
// Deliberately dependency-free and free of "</script" / "</style"
// sequences, like every module that gets inlined into a page.

// Strip the ES-module-only syntax a plain <script> block cannot parse:
// import statements (the modules are concatenated in dependency order by
// the caller instead) and the `export ` keyword prefix. Nothing else is
// rewritten: the body must stay a verbatim copy of the source.
export function toPlainModule(sources) {
  let out = '';
  for (const { name, content } of sources) {
    let body = content;
    const importCount = (body.match(/^import[^\n]*\n/gm) || []).length;
    const exportCount = (body.match(/^export (const|let|var|function|class)/gm) || []).length;
    body = body.replace(/^import[^\n]*\n/gm, '');
    body = body.replace(/^export (const|let|var|function|class)/gm, '$1');
    if ((body.match(/^import/m) || body.match(/^export /m)) !== null) {
      throw new Error(`${name}: unexpected module syntax remains after conversion`);
    }
    if (importCount + exportCount === 0) {
      throw new Error(`${name}: no module syntax found; is this still an ES module?`);
    }
    out += body.trimEnd() + '\n\n';
  }
  return out.trimEnd();
}
