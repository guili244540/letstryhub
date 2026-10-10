// Generates a standalone viewer page for a diagram: functionally identical
// to page/bpmnSample.html (embedded XML, click-to-open links, zoom controls).
// The page references the local lib/ folder, so it must be kept next to it,
// e.g. in the same folder as bpmnSample.html.

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
        .zoom-controls svg { width: 16px; height: 16px; }`;

  const viewerScript = `
        const viewer = new BpmnJS({ container: '#canvas' });

        function getUrl(element) {
            const bo = element.businessObject;
            return (bo && bo.$attrs['ehub:url']) || '';
        }

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
    <script src="lib/bpmn-navigated-viewer.development.js"></${''}script>
    <link rel="stylesheet" href="lib/diagram-js.css">
    <link rel="stylesheet" href="lib/bpmn-js.css">
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
