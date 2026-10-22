// Shared helpers for reading/writing the custom ehub:* attributes.

export function getElementText(element, attr) {
  const bo = element.businessObject;
  if (!bo) return null;
  return bo.get(attr) || bo.$attrs[attr] || null;
}

export function getElementUrl(element) {
  return getElementText(element, 'ehub:url');
}

export function getElementComment(element) {
  return getElementText(element, 'ehub:comment');
}

// Fields shown in the hover popup after the comment, in display order.
export const POPUP_FIELDS = [
  { attr: 'ehub:input', label: 'Input' },
  { attr: 'ehub:output', label: 'Output' },
  { attr: 'ehub:validation', label: 'Validation' },
  { attr: 'ehub:exception', label: 'Exception' }
];

export const POPUP_IMPLEMENTATION_FIELDS = [
  { attr: 'ehub:implementationCurrent', label: 'Current' },
  { attr: 'ehub:implementationTarget', label: 'Target' },
  { attr: 'ehub:implementationTargetMethod', label: 'Target method' }
];

// Build the hover-popup text: the comment first, then every other
// properties field that has a value (all except the link).
export function buildPopupText(element) {
  const parts = [];
  const comment = getElementComment(element);
  if (comment) parts.push(comment);
  for (const field of POPUP_FIELDS) {
    const value = getElementText(element, field.attr);
    if (value) parts.push(field.label + ':\n' + value);
  }
  const impl = POPUP_IMPLEMENTATION_FIELDS
    .map((field) => ({ field, value: getElementText(element, field.attr) }))
    .filter((entry) => entry.value);
  if (impl.length) {
    parts.push('Implementation:\n' + impl
      .map((entry) => '  ' + entry.field.label + ':\n    ' + entry.value)
      .join('\n'));
  }
  return parts.join('\n\n');
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
