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
