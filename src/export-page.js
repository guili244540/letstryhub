// Generates a standalone viewer page for a diagram: functionally identical
// to page/bpmnSample.html (embedded XML, click-to-open links, zoom controls).
// The viewer library and its styles are embedded in the page, so the result
// is fully standalone: it can be opened anywhere, no lib/ folder needed.

import viewerJs from '/page/lib/bpmn-navigated-viewer.development.js?raw';
import diagramJsCss from '/page/lib/diagram-js.css?raw';
import bpmnJsCss from '/page/lib/bpmn-js.css?raw';

for (const [name, content] of [
  ['bpmn-navigated-viewer.development.js', viewerJs],
  ['diagram-js.css', diagramJsCss],
  ['bpmn-js.css', bpmnJsCss]
]) {
  if (content.includes('</script') || content.includes('</style')) {
    throw new Error(`${name} contains a closing tag and cannot be embedded`);
  }
}

export function buildStandalonePage({ title, xml }) {
  const zoomControlsCss = `
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
        .zoom-controls svg { width: 16px; height: 16px; }
        #comment-popup {
            position: fixed; z-index: 1000;
            max-width: 300px; max-height: 200px; overflow: auto;
            padding: 0.5rem 0.75rem;
            background: #fffde7; border: 1px solid #d4c65c; border-radius: 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,.2);
            font-size: 0.85rem; white-space: pre-wrap;
            pointer-events: none;
        }`;

  const viewerScript = `
        const viewer = new BpmnJS({ container: '#canvas' });

        function getUrl(element) {
            const bo = element.businessObject;
            return (bo && bo.$attrs['ehub:url']) || '';
        }
        function getComment(element) {
            const bo = element.businessObject;
            return (bo && bo.$attrs['ehub:comment']) || '';
        }
        const commentPopup = document.createElement('div');
        commentPopup.id = 'comment-popup';
        commentPopup.style.display = 'none';
        document.body.appendChild(commentPopup);
        let hoverTimer = null;
        function showCommentPopup(x, y, text) {
            commentPopup.textContent = text;
            commentPopup.style.display = 'block';
            const rect = commentPopup.getBoundingClientRect();
            const left = Math.min(x + 12, window.innerWidth - rect.width - 8);
            const top = Math.min(y + 12, window.innerHeight - rect.height - 8);
            commentPopup.style.left = Math.max(8, left) + 'px';
            commentPopup.style.top = Math.max(8, top) + 'px';
        }
        function hideCommentPopup() {
            if (hoverTimer) {
                clearTimeout(hoverTimer);
                hoverTimer = null;
            }
            commentPopup.style.display = 'none';
        }
        viewer.get('eventBus').on('element.hover', (e) => {
            const comment = getComment(e.element);
            if (!comment) return;
            const x = e.originalEvent.clientX;
            const y = e.originalEvent.clientY;
            hideCommentPopup();
            hoverTimer = setTimeout(() => showCommentPopup(x, y, comment), 1000);
        });
        ['element.out', 'element.mousedown', 'canvas.viewbox.changing'].forEach((evt) => {
            viewer.get('eventBus').on(evt, hideCommentPopup);
        });

        viewer.get('eventBus').on('element.click', (e) => {
            const url = getUrl(e.element);
            if (url) { window.open(url, '_blank', 'noopener'); }
        });

        function setupZoomControls(canvasService, containerEl) {
            function center() {
                const v = canvasService.viewbox();
                return { x: v.x + v.width / 2, y: v.y + v.height / 2 };
            }
            function stepZoom(factor) {
                canvasService.zoom(Math.min(4, Math.max(0.2, canvasService.zoom() * factor)), center());
            }
            function svg(c) {
                return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' + c + '</svg>';
            }
            const ICONS = {
                zoomIn: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/><path d="M10.5 7.5v6M7.5 10.5h6"/>',
                zoomOut: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/><path d="M7.5 10.5h6"/>',
                reset: '<text x="12" y="15" font-size="9.5" text-anchor="middle" stroke="none" fill="currentColor">1:1</text>',
                fit: '<path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/>'
            };
            const controls = [
                { title: 'Zoom in', icon: ICONS.zoomIn, action: () => stepZoom(1.2) },
                { title: 'Zoom out', icon: ICONS.zoomOut, action: () => stepZoom(1 / 1.2) },
                { title: 'Reset zoom (100%)', icon: ICONS.reset, action: () => canvasService.zoom(1.0, center()) },
                { title: 'Fit diagram to screen', icon: ICONS.fit, action: () => canvasService.zoom('fit-viewport') }
            ];
            const strip = document.createElement('div');
            strip.className = 'zoom-controls';
            for (const control of controls) {
                const button = document.createElement('button');
                button.type = 'button';
                button.title = control.title;
                button.innerHTML = svg(control.icon);
                button.addEventListener('click', control.action);
                strip.appendChild(button);
            }
            containerEl.appendChild(strip);
        }

        setupZoomControls(viewer.get('canvas'), document.getElementById('canvas'));

        const xml = document.getElementById('bpmn-data').textContent.trim();
        viewer.importXML(xml)
            .then(() => {
                viewer.get('canvas').zoom('fit-viewport');
                const canvas = viewer.get('canvas');
                viewer.get('elementRegistry').forEach((element) => {
                    if (getUrl(element)) { canvas.addMarker(element, 'has-link'); }
                });
            })
            .catch(err => console.error('Could not display BPMN diagram:', err));`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <script>${viewerJs}</${''}script>
    <style>${diagramJsCss}</style>
    <style>${bpmnJsCss}</style>
    <style>
        html, body { margin: 0; height: 100%; }
        #canvas { height: 100%; border: 1px solid #ddd; position: relative; }
        .djs-element.has-link .djs-hit-stroke,
        .djs-element.has-link .djs-hit-click-stroke,
        .djs-element.has-link .djs-hit-all { cursor: pointer; }${zoomControlsCss}
    </style>
</head>
<body>
    <div id="canvas"></div>

    <script type="text/plain" id="bpmn-data">
${xml}
    </${''}script>

    <script>${viewerScript}
    </${''}script>
</body>
</html>
`;
}
