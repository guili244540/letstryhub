// Side properties panel for the selected element (link and comment today,
// more fields later). This avoids pulling in the full properties-panel for
// the demo; swap it later for bpmn-js-properties-panel if you need a richer
// UI.
import { getElementUrl, getElementComment, getElementText } from './links.js';
import { setupCommentPopup } from './comments.js';

const TEXT_FIELDS = [
  { attr: 'ehub:input', label: 'Input', placeholder: 'Input\u2026' },
  { attr: 'ehub:output', label: 'Output', placeholder: 'Output\u2026' },
  { attr: 'ehub:validation', label: 'Validation', placeholder: 'Validation\u2026' },
  { attr: 'ehub:exception', label: 'Exception', placeholder: 'Exception\u2026' }
];

const IMPLEMENTATION_FIELDS = [
  { attr: 'ehub:implementationCurrent', label: 'Current', placeholder: 'Current\u2026' },
  { attr: 'ehub:implementationTarget', label: 'Target', placeholder: 'Target\u2026' },
  { attr: 'ehub:implementationTargetMethod', label: 'Target method', placeholder: 'Target method\u2026' }
];

export function setupPropertiesPanel(modeler, panelEl) {
  const modeling = modeler.get('modeling');
  const eventBus = modeler.get('eventBus');

  const heading = document.createElement('h3');
  heading.textContent = 'Properties';

  function makeField(field) {
    const label = document.createElement('label');
    label.textContent = field.label;
    label.htmlFor = field.attr;
    const input = document.createElement('textarea');
    input.id = field.attr;
    input.rows = 2;
    input.maxLength = 1000;
    input.placeholder = field.placeholder;
    input.style.width = '100%';
    input.style.display = 'none';
    label.style.display = 'none';
    input.addEventListener('change', () => {
      if (!current) return;
      modeling.updateProperties(current, { [field.attr]: input.value || undefined });
    });
    field.labelEl = label;
    field.inputEl = input;
  }

  const noneSelected = document.createElement('p');
  noneSelected.textContent = 'Select an element to edit its properties.';

  const implHeading = document.createElement('h4');
  implHeading.textContent = 'Implementation';
  implHeading.style.margin = '0.75rem 0 0';
  implHeading.style.fontSize = '0.85rem';
  implHeading.style.display = 'none';

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
  commentInput.placeholder = 'Type a comment\u2026';
  commentInput.style.width = '100%';

  [...TEXT_FIELDS, ...IMPLEMENTATION_FIELDS].forEach(makeField);

  panelEl.append(
    heading,
    noneSelected,
    label,
    input,
    commentLabel,
    commentInput
  );
  for (const field of TEXT_FIELDS) {
    panelEl.append(field.labelEl, field.inputEl);
  }
  panelEl.append(implHeading);
  for (const field of IMPLEMENTATION_FIELDS) {
    panelEl.append(field.labelEl, field.inputEl);
  }

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
      implHeading.style.display = 'block';
      for (const field of [...TEXT_FIELDS, ...IMPLEMENTATION_FIELDS]) {
        field.labelEl.style.display = 'block';
        field.inputEl.style.display = 'block';
        field.inputEl.value = getElementText(current, field.attr) || '';
      }
    } else {
      noneSelected.style.display = 'block';
      label.style.display = 'none';
      input.style.display = 'none';
      commentLabel.style.display = 'none';
      commentInput.style.display = 'none';
      implHeading.style.display = 'none';
      for (const field of [...TEXT_FIELDS, ...IMPLEMENTATION_FIELDS]) {
        field.labelEl.style.display = 'none';
        field.inputEl.style.display = 'none';
      }
    }
  }

  setupCommentPopup(eventBus);
}
