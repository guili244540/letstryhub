// Small side panel to edit the external URL of the selected element.
// This avoids pulling in the full properties-panel for the demo; swap it
// later for bpmn-js-properties-panel if you need a richer UI.

import { getElementUrl } from './links.js';

export function setupLinkPanel(modeler, panelEl) {
  const modeling = modeler.get('modeling');
  const eventBus = modeler.get('eventBus');

  const heading = document.createElement('h3');
  heading.textContent = 'External link';

  const input = document.createElement('input');
  input.type = 'url';
  input.placeholder = 'https://example.org/docs';
  input.style.width = '100%';

  const hint = document.createElement('small');
  hint.textContent = 'Ctrl/Cmd+click the element to open the link.';

  const noneSelected = document.createElement('p');
  noneSelected.textContent = 'Select an element to edit its link.';

  panelEl.append(heading, noneSelected, input, hint);
  input.style.display = 'none';
  hint.style.display = 'none';
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
      input.style.display = 'block';
      hint.style.display = 'block';
      input.value = getElementUrl(current) || '';
    } else {
      noneSelected.style.display = 'block';
      input.style.display = 'none';
      hint.style.display = 'none';
    }
  }
}
