// Builds a standalone viewer page for a diagram, using the single shared
// template in src/export-template.js (also used by the standalone editor
// pages and to generate page/bpmnSample.html). The Vite app imports the
// viewer library at build time via ?raw; the page-building logic itself
// lives in the template module.

import viewerJs from '/page/lib/bpmn-navigated-viewer.development.js?raw';
import diagramJsCss from '/page/lib/diagram-js.css?raw';
import bpmnJsCss from '/page/lib/bpmn-js.css?raw';

import { buildStandaloneViewerPage } from './export-template.js';

export function buildStandalonePage({ title, xml }) {
  return buildStandaloneViewerPage({
    title,
    xml,
    lib: {
      js: viewerJs,
      diagramCss: diagramJsCss,
      bpmnCss: bpmnJsCss
    }
  });
}
