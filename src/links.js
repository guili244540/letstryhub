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

// Fields shown in the click popup after the comment, in display order.
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

// Build the click-popup content: the link first (rendered as a clickable
// anchor by the popup module), then the comment and every other
// properties field that has a value.
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
  return { url: getElementUrl(element), text: parts.join('\n\n') };
}

// Flat variant of the popup text used by the standalone surfaces: like
// buildPopupText but without the grouped "Implementation:" block, every
// field on its own line. implPrefix is prepended to the implementation
// field labels only, because the surfaces label them differently: the
// exported pages say "Current", the standalone editor says
// "Implementation – Current" (kept per surface on purpose —
// parameterize, do not unify silently).
export function buildFlatPopupText(element, implPrefix = '') {
  const parts = [];
  const comment = getElementComment(element);
  if (comment) parts.push(comment);
  for (const field of [...POPUP_FIELDS, ...POPUP_IMPLEMENTATION_FIELDS]) {
    const isImpl = POPUP_IMPLEMENTATION_FIELDS.includes(field);
    const label = (isImpl ? implPrefix : '') + field.label;
    const value = getElementText(element, field.attr);
    if (value) parts.push(label + ':\n' + value);
  }
  return { url: getElementUrl(element), text: parts.join('\n\n') };
}

export function isUrlElement(element) {
  return !!getElementUrl(element);
}

// Attributes shown as text in the popup (everything except the link,
// which the popup renders as a clickable anchor).
const POPUP_TEXT_ATTRS = [ 'ehub:comment',
  ...POPUP_FIELDS.map((field) => field.attr),
  ...POPUP_IMPLEMENTATION_FIELDS.map((field) => field.attr) ];

// True when the element carries any ehub content at all: a link, a
// comment or at least one other properties field. The click popup only
// appears for such elements.
export function hasEhubContent(element) {
  if (!element) return false;
  return isUrlElement(element) ||
    POPUP_TEXT_ATTRS.some((attr) => !!getElementText(element, attr));
}

// Keep the has-link / has-comment canvas markers in sync with the element's
// ehub attributes, so flagged elements are recognizable at a glance.
// has-comment treats every other ehub property like a comment: an element
// with e.g. only an ehub:input gets the same shadow as a commented one.
// Marker names map 1:1 to the CSS rules injected by src/page-style.js on
// every surface.
export function updateContentMarkers(canvas, element) {
  if (!element || element.labelTarget || !element.businessObject) return;
  const hasLink = isUrlElement(element);
  const hasComment = POPUP_TEXT_ATTRS.some((attr) => !!getElementText(element, attr));
  canvas[hasLink ? 'addMarker' : 'removeMarker'](element, 'has-link');
  canvas[hasComment ? 'addMarker' : 'removeMarker'](element, 'has-comment');
}
