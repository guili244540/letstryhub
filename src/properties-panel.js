// Side properties panel for the selected element (link and comment today,
// more fields later). This avoids pulling in the full properties-panel for
// the demo; swap it later for bpmn-js-properties-panel if you need a richer
// UI.
import { getElementUrl, getElementComment } from './links.js';
import { setupCommentPopup } from './comments.js';

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

  const commentLabel = document.createElement('label');
  commentLabel.textContent = 'Comment';
  commentLabel.htmlFor = 'comment-input';

  const commentInput = document.createElement('textarea');
  commentInput.id = 'comment-input';
  commentInput.rows = 4;
  commentInput.maxLength = 1000;
  commentInput.placeholder = 'Type a comment…';
  commentInput.style.width = '100%';

  const noneSelected = document.createElement('p');
  noneSelected.textContent = 'Select an element to edit its properties.';

  panelEl.append(heading, noneSelected, label, input, commentLabel, commentInput);
  label.style.display = 'none';
  input.style.display = 'none';
  commentLabel.style.display = 'none';
  commentInput.style.display = 'none';
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

  commentInput.addEventListener('change', () => {
    if (!current) return;
    modeling.updateProperties(current, { 'ehub:comment': commentInput.value || undefined });
  });

  function render() {
    if (current) {
      noneSelected.style.display = 'none';
      label.style.display = 'block';
      input.style.display = 'block';
      input.value = getElementUrl(current) || '';
      commentLabel.style.display = 'block';
      commentInput.style.display = 'block';
      commentInput.value = getElementComment(current) || '';
    } else {
      noneSelected.style.display = 'block';
      label.style.display = 'none';
      input.style.display = 'none';
      commentLabel.style.display = 'none';
      commentInput.style.display = 'none';
    }
  }

  setupCommentPopup(eventBus);
}
