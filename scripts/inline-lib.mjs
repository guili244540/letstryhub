// Inlines the vendored lib/ assets into the standalone pages so they become
// fully self-contained HTML files (no lib/ folder needed next to them), and
// embeds the viewer-library blob used by the export feature of the editor.
//
// page/bpmnEditor.html is generated from page/bpmnEditorOnLine.html (the
// light source page that references lib/). The standalone editor and the
// light editor share the same code; only the asset delivery differs.
//
// Idempotent: safe to run repeatedly.
// Usage: npm run inline-lib
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const libDir = join(root, 'page', 'lib');

const VIEWER_LIB_ID = 'viewer-lib';

function readLib(file) {
  return readFileSync(join(libDir, file), 'utf8');
}

// A </script> or </style> sequence inside an inlined asset would close the
// tag early and break the page, so refuse to inline instead of corrupting it.
function assertEmbeddable(name, content, closing) {
  if (content.toLowerCase().includes(closing)) {
    throw new Error(`${name} contains "${closing}" and cannot be inlined`);
  }
}

// Replace <script src="lib/x.js"></script> and <link ... href="lib/x.css">
// references with inline content.
function inlineRefs(html) {
  html = html.replace(/<script src="lib\/([^"]+)"><\/script>/g, (match, file) => {
    const content = readLib(file);
    assertEmbeddable(file, content, '</script');
    return `<script>\n/* Inlined from lib/${file} */\n${content.trimEnd()}\n</script>`;
  });
  html = html.replace(/<link\b[^>]*href="lib\/([^"]+)"[^>]*>/g, (match, file) => {
    const content = readLib(file);
    assertEmbeddable(file, content, '</style');
    return `<style>\n/* Inlined from lib/${file} */\n${content.trimEnd()}\n</style>`;
  });
  return html;
}

// The export feature of the standalone editor needs the viewer library as
// strings, to embed them into every exported page. Store them as a JSON
// blob that the export code reads at runtime. "</script" inside the JSON is
// escaped to "<\/script" (a valid JSON escape) so it cannot close the tag.
function injectViewerLibBlob(html) {
  const blob = {
    js: readLib('bpmn-navigated-viewer.development.js'),
    diagramCss: readLib('diagram-js.css'),
    bpmnCss: readLib('bpmn-js.css')
  };
  assertEmbeddable('bpmn-navigated-viewer.development.js', blob.js, '</script');

  const json = JSON.stringify(blob).replace(/<\/script/gi, '<\\/script');
  const block = `<script type="application/json" id="${VIEWER_LIB_ID}">${json}</script>`;
  const marker = new RegExp(
    `<script type="application/json" id="${VIEWER_LIB_ID}">[\\s\\S]*?</script>`);

  if (marker.test(html)) {
    // Function replacement: block contains "$&"-style sequences that a string
    // replacement would interpret as patterns.
    return html.replace(marker, () => block);
  }
  // Function replacement for the same reason as above.
  return html.replace('</head>', () => `${block}\n</head>`);
}

const targets = [
  {
    source: 'page/bpmnEditorOnLine.html',
    file: 'page/bpmnEditor.html',
    viewerLib: true
  },
  { file: 'page/bpmnSample.html' }
];

for (const { source, file, viewerLib } of targets) {
  const before = source
    ? readFileSync(join(root, source), 'utf8')
    : readFileSync(join(root, file), 'utf8');
  let out = inlineRefs(before);
  if (viewerLib) {
    out = injectViewerLibBlob(out);
  }
  if (/(src|href)="lib\//.test(out)) {
    throw new Error(`${file}: lib/ references remain after inlining`);
  }
  const path = join(root, file);
  if (out !== readFileSync(path, 'utf8')) {
    writeFileSync(path, out);
    console.log(`${file}: inlined (${Math.round(out.length / 1024)} KB)`);
  } else {
    console.log(`${file}: up to date`);
  }
}
