// Single source of truth for the standalone viewer page template.
//
// Used by:
//   - src/export-page.js (Vite online editor, lib imported at build time)
//   - page/bpmnEditorOnLine.html / page/bpmnEditor.html (standalone editor,
//     lib from the #viewer-lib blob or fetched from lib/)
//   - scripts/inline-lib.mjs (generates page/bpmnSample.html)
//
// The file is deliberately dependency-free: it has no imports, so it can run
// as a plain ES module (Node, Vite) and can be inlined verbatim into the
// editor pages by scripts/inline-lib.mjs. For that reason it must never
// contain the closing-tag sequence of a script or style element anywhere,
// not even inside a string or a comment: the HTML parser would end the host
// page's script block early. Hence the split "<" + "/script" forms below.

export function buildStandaloneViewerPage({ title, xml, lib, modules }) {
  // Assembled at runtime, never written literally: see the header comment.
  const SCRIPT_CLOSE = '<' + '/script';
  const STYLE_CLOSE = '<' + '/style';
  for (const [name, content] of [
    ['title', title],
    ['diagram XML', xml],
    ['viewer library', lib.js],
    ['diagram-js.css', lib.diagramCss],
    ['bpmn-js.css', lib.bpmnCss],
    ['popup module', modules.popup],
    ['links module', modules.links],
    ['zoom module', modules.zoom]
  ]) {
    if (String(content).includes(SCRIPT_CLOSE) || String(content).includes(STYLE_CLOSE)) {
      throw new Error(`${name} contains a closing tag and cannot be embedded`);
    }
  }

  const S = '<' + 'script';

  const pageCss = `
        html, body { margin: 0; height: 100%; }
        #canvas { height: 100%; border: 1px solid #ddd; position: relative; }
        .djs-element.has-link .djs-hit-stroke,
        .djs-element.has-link .djs-hit-click-stroke,
        .djs-element.has-link .djs-hit-all { cursor: pointer; }
        .djs-element.has-link .djs-visual { filter: drop-shadow(0 0 4px rgba(65, 105, 225, 0.9)); }
        .djs-element.has-comment .djs-visual { filter: drop-shadow(0 0 4px rgba(204, 122, 0, 0.9)); }
        .djs-element.has-link.has-comment .djs-visual { filter: drop-shadow(0 0 4px rgba(123, 79, 184, 0.9)); }
        .zoom-controls {
            position: absolute; right: 15px; bottom: 80px;
            display: flex; flex-direction: column;
            background: #fff; border: 1px solid #ccc; border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,.15); overflow: hidden; z-index: 20;
        }
        .zoom-controls button {
            width: 30px; height: 30px; padding: 0; border: none;
            background: #fff; color: #444;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .zoom-controls button + button { border-top: 1px solid #e8e8e8; }
        .zoom-controls button:hover { background: #f2f2f2; }
        .zoom-controls svg { width: 16px; height: 16px; }`;

  const viewerScript = `
        const viewer = new BpmnJS({ container: '#canvas' });

        // Attribute helpers, click-to-open, canvas markers, popup DOM and
        // zoom controls all come from the shared modules embedded above as
        // plain script blocks (single sources under src/, forwarded by every
        // caller of the template). Only the popup text builder stays
        // page-specific: exported pages label every field flat, unlike the
        // grouped format of src/links.js used by the Vite viewer. Named
        // POPUP_LABELS (not POPUP_FIELDS) so it cannot collide with the
        // links module's top-level const.
        const POPUP_LABELS = [
            { attr: 'ehub:input', label: 'Input' },
            { attr: 'ehub:output', label: 'Output' },
            { attr: 'ehub:validation', label: 'Validation' },
            { attr: 'ehub:exception', label: 'Exception' },
            { attr: 'ehub:implementationCurrent', label: 'Current' },
            { attr: 'ehub:implementationTarget', label: 'Target' },
            { attr: 'ehub:implementationTargetMethod', label: 'Target method' }
        ];
        function buildPopupText(element) {
            const parts = [];
            const comment = getElementComment(element);
            if (comment) parts.push(comment);
            POPUP_LABELS.forEach(function (f) {
                const value = getElementText(element, f.attr);
                if (value) parts.push(f.label + ':\\n' + value);
            });
            return parts.join('\\n\\n');
        }
        setupCommentPopup(viewer.get('eventBus'), buildPopupText);
        registerOpenLinks(viewer.get('eventBus'), { ctrlRequired: false });
        setupZoomControls(viewer.get('canvas'), document.getElementById('canvas'));

        const xml = document.getElementById('bpmn-data').textContent.trim();
        viewer.importXML(xml)
            .then(() => {
                viewer.get('canvas').zoom('fit-viewport');
                const canvas = viewer.get('canvas');
                viewer.get('elementRegistry').getAll().forEach((element) => {
                    updateContentMarkers(canvas, element);
                });
            })
            .catch(err => console.error('Could not display BPMN diagram:', err));`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    ${S}>${lib.js}
    </${''}script>
    <style>${lib.diagramCss}</style>
    <style>${lib.bpmnCss}</style>
    <style>${pageCss}
    </style>
</head>
<body>
    <div id="canvas"></div>

    <script type="text/plain" id="bpmn-data">
${xml}
    </${''}script>

    ${S}>${modules.popup}
    </${''}script>

    ${S}>${modules.links}
    </${''}script>

    ${S}>${modules.zoom}
    </${''}script>

    ${S}>${viewerScript}
    </${''}script>
</body>
</html>
`;
}
