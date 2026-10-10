// Zoom control strip (bottom-right of the canvas, above the bpmn.io
// watermark), like the one on demo.bpmn.io. Attaches itself to the
// given container element.

const ICONS = {
  zoomIn:
    '<circle cx="10.5" cy="10.5" r="7"></circle>' +
    '<path d="m16 16 5 5"></path>' +
    '<path d="M10.5 7.5v6M7.5 10.5h6"></path>',
  zoomOut:
    '<circle cx="10.5" cy="10.5" r="7"></circle>' +
    '<path d="m16 16 5 5"></path>' +
    '<path d="M7.5 10.5h6"></path>',
  reset: '<text x="12" y="15" font-size="9.5" text-anchor="middle" stroke="none" fill="currentColor">1:1</text>',
  fit: '<path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"></path>'
};

function svg(content) {
  return (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    content +
    '</svg>'
  );
}

export function setupZoomControls(canvasService, containerEl) {
  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 4;
  const STEP = 1.2;

  function center() {
    const viewbox = canvasService.viewbox();
    return {
      x: viewbox.x + viewbox.width / 2,
      y: viewbox.y + viewbox.height / 2
    };
  }

  function stepZoom(factor) {
    canvasService.zoom(
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, canvasService.zoom() * factor)),
      center()
    );
  }

  const controls = [
    { title: 'Zoom in', icon: ICONS.zoomIn, action: () => stepZoom(STEP) },
    { title: 'Zoom out', icon: ICONS.zoomOut, action: () => stepZoom(1 / STEP) },
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
  return strip;
}
