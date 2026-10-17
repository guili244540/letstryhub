// Shared helpers for reading/writing the custom ehub:url attribute.

export function getElementUrl(element) {
  const bo = element.businessObject;
  if (!bo) return null;
  return bo.get('ehub:url') || bo.$attrs['ehub:url'] || null;
}

export function getElementComment(element) {
  const bo = element.businessObject;
  if (!bo) return null;
  return bo.get('ehub:comment') || bo.$attrs['ehub:comment'] || null;
}

export function isUrlElement(element) {
  return !!getElementUrl(element);
}

// Keep the has-link / has-comment canvas markers in sync with the element's
// ehub:url / ehub:comment attributes, so flagged elements are recognizable
// without hovering. Marker names map 1:1 to CSS rules in style.css (and the
// copies embedded in the standalone pages).
export function updateContentMarkers(canvas, element) {
  if (!element || element.labelTarget || !element.businessObject) return;
  const hasLink = isUrlElement(element);
  const hasComment = !!getElementComment(element);
  canvas[hasLink ? 'addMarker' : 'removeMarker'](element, 'has-link');
  canvas[hasComment ? 'addMarker' : 'removeMarker'](element, 'has-comment');
}

// Register a click handler that opens the external URL of an element.
// Works in both Modeler and Viewer; exported so pages can hook extra logic.
export function registerOpenLinks(eventBus, { ctrlRequired = true } = {}) {
  eventBus.on('element.click', (event) => {
    const { element } = event;
    const url = getElementUrl(element);
    if (!url) return;
    if (ctrlRequired && !event.originalEvent.ctrlKey && !event.originalEvent.metaKey) return;
    event.preventDefault();
    window.open(url, '_blank', 'noopener');
  });
}
