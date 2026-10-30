// Builds a standalone viewer page for a diagram, using the single shared
// template in src/export-template.js (also used by the standalone editor
// pages and to generate page/bpmnSample.html). The Vite app imports the
// viewer library at build time via ?raw; the page-building logic itself
// lives in the template module.
//
// The shared modules embedded into every exported page are assembled here
// from the same src/ sources that scripts/inline-lib.mjs inlines into the
// standalone pages: the popup module (comment-popup-style.js + comments.js),
// the links module and the zoom module. Keep the assembly lists in sync
// with scripts/inline-lib.mjs.

import viewerJs from '/page/lib/bpmn-navigated-viewer.development.js?raw';
import diagramJsCss from '/page/lib/diagram-js.css?raw';
import bpmnJsCss from '/page/lib/bpmn-js.css?raw';
import commentsJs from './comments.js?raw';
import commentPopupStyleJs from './comment-popup-style.js?raw';
import linksJs from './links.js?raw';
import zoomControlsJs from './zoom-controls.js?raw';
import pageStyleJs from './page-style.js?raw';

import { buildStandaloneViewerPage } from './export-template.js';
import { toPlainModule } from './plain-module.js';

// Single-file modules become plain script bodies directly; the popup
// module concatenates its style + DOM files in dependency order.
const modules = {
  style: toPlainModule([{ name: 'src/page-style.js', content: pageStyleJs }]),
  popup: toPlainModule([
    { name: 'src/comment-popup-style.js', content: commentPopupStyleJs },
    { name: 'src/comments.js', content: commentsJs }
  ]),
  links: toPlainModule([{ name: 'src/links.js', content: linksJs }]),
  zoom: toPlainModule([{ name: 'src/zoom-controls.js', content: zoomControlsJs }])
};

export function buildStandalonePage({ title, xml }) {
  return buildStandaloneViewerPage({
    title,
    xml,
    modules,
    lib: {
      js: viewerJs,
      diagramCss: diagramJsCss,
      bpmnCss: bpmnJsCss
    }
  });
}
