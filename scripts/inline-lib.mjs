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
import { toPlainModule } from '../src/plain-module.js';

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

// A bare import (an npm package like "bpmn-js/...") inside a module that
// gets inlined would be silently dropped by toPlainModule and break at
// runtime: inlined modules may only import each other via relative paths
// (EVOLUTION.md slice 1, lesson 6).
function assertNoBareImports(name, content) {
  for (const match of content.matchAll(/^import\s.*?from\s+['"]([^'"]+)['"]/gm)) {
    if (!match[1].startsWith('./')) {
      throw new Error(`${name}: bare import "${match[1]}" cannot be inlined`);
    }
  }
  if (/^import\s['"]/.test(content)) {
    throw new Error(`${name}: side-effect imports cannot be inlined`);
  }
}

// Reads one shared module source and strips its ES-module syntax, so it can
// be refilled into a marker block and run as a plain script.
function readPlainModule(name) {
  const content = readFileSync(join(root, name), 'utf8');
  assertNoBareImports(name, content);
  return toPlainModule([{ name, content }]);
}

// The comment-popup modules (styles + DOM/hover logic) inlined as one plain
// script block. Order matters: the style module defines the helpers the
// popup module calls.
const popupModule = readPopupModule();

function readPopupModule() {
  const sources = [
    { name: 'src/comment-popup-style.js', content: readFileSync(join(root, 'src', 'comment-popup-style.js'), 'utf8') },
    { name: 'src/comments.js', content: readFileSync(join(root, 'src', 'comments.js'), 'utf8') }
  ];
  for (const { name, content } of sources) assertNoBareImports(name, content);
  return toPlainModule(sources);
}

// The shared modules inlined into the editor pages as marker blocks
// (EVOLUTION.md slice 2). Order matters: the properties-panel module relies
// on the helpers the links block defines (its import is stripped by
// toPlainModule), so links-module must run before it. Keep the assembly in
// sync with src/export-page.js, which builds the same plain modules for the
// Vite app's export feature.
const linksModule = readPlainModule('src/links.js');
const zoomModule = readPlainModule('src/zoom-controls.js');
const propertiesPanelModule = readPlainModule('src/properties-panel.js');

const EDITOR_MODULE_BLOCKS = [
  { id: 'links-module', source: linksModule },
  { id: 'comment-popup-module', source: popupModule },
  { id: 'zoom-controls-module', source: zoomModule },
  { id: 'properties-panel-module', source: propertiesPanelModule }
];

// The modules embedded into every exported viewer page via the template
// (the properties panel is editor-only and never exported).
const VIEWER_MODULES = { popup: popupModule, links: linksModule, zoom: zoomModule };

// The source page carries the diagram too (it is deployed as the site root),
// so it must be synced like the generated files, not just read as input.
function syncSourcePage(source, diagramXml) {
  const path = join(root, source);
  const before = readFileSync(path, 'utf8');
  // The source page is deployed as the site root, so it must carry the
  // export template like the generated pages do, not only the diagram.
  let after = injectExportTemplate(
    injectDiagram(stripExportTemplate(before), diagramXml, source), source);
  for (const block of EDITOR_MODULE_BLOCKS) {
    after = injectMarkerBlock(after, block.id, block.source, source);
  }
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

function reportSync(file, before, after) {
  if (after !== before) {
    if (check) {
      outOfSync++;
      console.log(`${file}: out of date (run npm run inline-lib)`);
    } else {
      writeFileSync(join(root, file), after);
      console.log(`${file}: updated`);
    }
  } else {
    console.log(`${file}: up to date`);
  }
}

// Inject src/export-template.js (the single source of the export template,
// also used by the Vite app and by bpmnSample.html generation) into the
// #export-template marker block of the editor pages. The module is
// dependency-free, so it runs verbatim as a plain script block.
const EXPORT_TEMPLATE_ID = 'export-template';

// Generic "refill marker block from source file" injector (EVOLUTION.md
// slice 1), modeled on injectExportTemplate: it replaces the content of the
// <script id="..."> marker block with the shared module's source, stripped
// of ES-module syntax so it runs as a plain script block. The block is
// refilled on every run, so the generated pages can never drift from src/.
function injectMarkerBlock(html, id, source, file) {
  if (source.includes('</script')) {
    throw new Error(`${file}: module for #${id} contains "</script" and cannot be inlined`);
  }
  const block = `<script id="${id}">\n${source.trimEnd()}\n    </script>`;
  const marker = new RegExp(`<script id="${id}">[\\s\\S]*?</script>`);
  if (!marker.test(html)) {
    throw new Error(`${file}: #${id} block not found`);
  }
  return html.replace(marker, () => block);
}

function injectExportTemplate(html, file) {
  let template = readFileSync(join(root, 'src', 'export-template.js'), 'utf8');
  if (template.includes('</script')) {
    throw new Error('src/export-template.js contains "</script" and cannot be inlined');
  }
  const decl = 'export function buildStandaloneViewerPage';
  if (!template.includes(decl)) {
    throw new Error(`src/export-template.js: ${decl} not found`);
  }
  // The module uses `export function` for Vite/Node; as an inline plain
  // script it must become a plain function declaration.
  template = template.replace(decl, 'function buildStandaloneViewerPage');
  const block = `<script id="${EXPORT_TEMPLATE_ID}">\n${template.trimEnd()}\n    </script>`;
  const marker = new RegExp(`<script id="${EXPORT_TEMPLATE_ID}">[\\s\\S]*?</script>`);
  if (!marker.test(html)) {
    throw new Error(`${file}: #${EXPORT_TEMPLATE_ID} block not found`);
  }
  return html.replace(marker, () => block);
}

// The injected template carries placeholder markup of its own (a bpmn-data
// block, a </head> line), which the other injections locate by first match.
// Empty the block before they run, so they only ever see the page's real
// markers; injectExportTemplate refills it afterwards.
function stripExportTemplate(html) {
  const marker = new RegExp(`<script id="${EXPORT_TEMPLATE_ID}">[\\s\\S]*?</script>`);
  return html.replace(marker, () => `<script id="${EXPORT_TEMPLATE_ID}"></script>`);
}

syncSourcePage('page/bpmnEditorOnLine.html', diagramXml);

const targets = [
  {
    source: 'page/bpmnEditorOnLine.html',
    file: 'page/bpmnEditor.html',
    viewerLib: true,
    diagram: true
  }
];

for (const { source, file, viewerLib, diagram } of targets) {
  const before = source
    ? readFileSync(join(root, source), 'utf8')
    : readFileSync(join(root, file), 'utf8');
  let out = stripExportTemplate(before);
  if (diagram) {
    out = injectDiagram(out, diagramXml, source || file);
  }
  out = inlineRefs(out);
  if (viewerLib) {
    out = injectViewerLibBlob(out);
  }
  out = injectExportTemplate(out, file);
  for (const block of EDITOR_MODULE_BLOCKS) {
    out = injectMarkerBlock(out, block.id, block.source, file);
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

// page/bpmnSample.html is generated wholesale from the same export template
// the editors use, so exported pages and the sample viewer are identical by
// construction instead of "kept in sync" by hand.
{
  const { buildStandaloneViewerPage } = await import(join(root, 'src', 'export-template.js'));
  const lib = {
    js: readLib('bpmn-navigated-viewer.development.js'),
    diagramCss: readLib('diagram-js.css'),
    bpmnCss: readLib('bpmn-js.css')
  };
  const out = buildStandaloneViewerPage({
    title: 'BPMN (embedded diagram)',
    xml: diagramXml.trimEnd(),
    modules: VIEWER_MODULES,
    lib
  });
  reportSync('page/bpmnSample.html', readFileSync(join(root, 'page', 'bpmnSample.html'), 'utf8'), out);
}

if (check && outOfSync > 0) {
  console.log(`${outOfSync} file(s) out of date`);
  process.exit(1);
}
