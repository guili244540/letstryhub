// Inlines the vendored lib/ assets into the standalone pages so they become
// fully self-contained HTML files (no lib/ folder needed next to them), and
// embeds the viewer-library blob used by the export feature of the editor.
//
// page/bpmnEditor.html is generated from page/bpmnEditorOnLine.html (the
// light source page that references lib/). The standalone editor and the
// light editor share the same code; only the asset delivery differs.
//
// Idempotent: safe to run repeatedly.
// Usage: npm run inline-lib            (sync + inline, writes files)
//        npm run inline-lib -- --check (verify only, exit 1 when out of sync)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLValidator } from 'fast-xml-parser';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
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

// Embed diagram/sample.bpmn into the page's bpmn-data block so the sample
// diagram lives in exactly one place. The block is normalized to the same
// shape in every page, so a diagram change produces a small, reviewable diff.
// A malformed embedded diagram breaks the whole page at runtime (the
// browser console shows an "unparsable content" error). Validate it here so
// the build fails loudly instead of shipping a broken page.
function assertValidXml(name, xml) {
  const result = XMLValidator.validate(xml);
  if (result !== true) {
    const { msg, line, col } = result.err;
    throw new Error(`${name}: invalid XML at line ${line}, column ${col}: ${msg}`);
  }
}

function injectDiagram(html, diagramXml, file) {
  assertEmbeddable('diagram/sample.bpmn', diagramXml, '</script');
  if (!diagramXml.includes('xmlns:ehub=')) {
    throw new Error('diagram/sample.bpmn: missing xmlns:ehub declaration');
  }
  const marker = /<script type="text\/plain" id="bpmn-data">[\s\S]*?<\/script>/;
  if (!marker.test(html)) {
    throw new Error(`${file}: bpmn-data block not found`);
  }
  const block = `<script type="text/plain" id="bpmn-data">\n${diagramXml.trimEnd()}\n    </script>`;
  // Function replacement: block may contain "$&"-style sequences.
  return html.replace(marker, () => block);
}

const diagramXml = readFileSync(join(root, 'diagram', 'sample.bpmn'), 'utf8');
assertValidXml('diagram/sample.bpmn', diagramXml);

// The source page carries the diagram too (it is deployed as the site root),
// so it must be synced like the generated files, not just read as input.
function syncSourcePage(source, diagramXml) {
  const path = join(root, source);
  const before = readFileSync(path, 'utf8');
  const after = injectDiagram(before, diagramXml, source);
  if (after !== before) {
    if (check) {
      outOfSync++;
      console.log(`${source}: diagram out of date (run npm run inline-lib)`);
    } else {
      writeFileSync(path, after);
      console.log(`${source}: diagram synced`);
    }
  } else {
    console.log(`${source}: up to date`);
  }
}

let outOfSync = 0;

syncSourcePage('page/bpmnEditorOnLine.html', diagramXml);

const targets = [
  {
    source: 'page/bpmnEditorOnLine.html',
    file: 'page/bpmnEditor.html',
    viewerLib: true,
    diagram: true
  },
  {
    file: 'page/bpmnSample.html',
    diagram: true
  }
];

for (const { source, file, viewerLib, diagram } of targets) {
  const before = source
    ? readFileSync(join(root, source), 'utf8')
    : readFileSync(join(root, file), 'utf8');
  let out = before;
  if (diagram) {
    out = injectDiagram(out, diagramXml, source || file);
  }
  out = inlineRefs(out);
  if (viewerLib) {
    out = injectViewerLibBlob(out);
  }
  if (/(src|href)="lib\//.test(out)) {
    throw new Error(`${file}: lib/ references remain after inlining`);
  }
  const path = join(root, file);
  if (out !== readFileSync(path, 'utf8')) {
    if (check) {
      outOfSync++;
      console.log(`${file}: out of date (run npm run inline-lib)`);
    } else {
      writeFileSync(path, out);
      console.log(`${file}: inlined (${Math.round(out.length / 1024)} KB)`);
    }
  } else {
    console.log(`${file}: up to date`);
  }
}

if (check && outOfSync > 0) {
  console.log(`${outOfSync} file(s) out of date`);
  process.exit(1);
}
