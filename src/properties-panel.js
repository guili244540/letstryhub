// Side properties panel for the selected element (link today, more fields later).
// This avoids pulling in the full properties-panel for the demo; swap it
// later for bpmn-js-properties-panel if you need a richer UI.

import { getElementUrl } from './links.js';

export function setupPropertiesPanel(modeler, panelEl) {
  const modeling = modeler.get('modeling');
  const eventBus = modeler.get('eventBus');

  const heading = document.createElement('h3');
  heading.textContent = 'Properties';

  const label = document.createElement('label');
  label.textContent = 'Link';
  label.htmlFor = 'link-input';

  const input = document.createElement('input');
  input.type = 'url';
  input.id = 'link-input';
  input.placeholder = 'https://example.org/docs';
  input.style.width = '100%';

  const noneSelected = document.createElement('p');
  noneSelected.textContent = 'Select an element to edit its properties.';

  panelEl.append(heading, noneSelected, label, input);
  label.style.display = 'none';
  input.style.display = 'none';
  noneSelected.style.display = 'block';

  let current = null;

  eventBus.on('selection.changed', ({ newSelection }) => {
    current = newSelection.length === 1 ? newSelection[0] : null;
    render();
  });

  input.addEventListener('change', () => {
    if (!current) return;
    modeling.updateProperties(current, { 'ehub:url': input.value || undefined });
  });

  function render() {
    if (current) {
      noneSelected.style.display = 'none';
      label.style.display = 'block';
      input.style.display = 'block';
      input.value = getElementUrl(current) || '';
    } else {
      noneSelected.style.display = 'block';
      label.style.display = 'none';
      input.style.display = 'none';
    }
  }
}
