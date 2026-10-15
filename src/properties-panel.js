// Side properties panel for the selected element (link and comment today,
// more fields later). This avoids pulling in the full properties-panel for
// the demo; swap it later for bpmn-js-properties-panel if you need a richer
// UI.
import { getElementUrl, getElementComment } from './links.js';

const COMMENT_HOVER_DELAY_MS = 1000;

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

function setupCommentPopup(eventBus) {
  const popup = document.createElement('div');
  popup.id = 'comment-popup';
  popup.style.display = 'none';
  document.body.appendChild(popup);

  let hoverTimer = null;

  function show(x, y, text) {
    popup.textContent = text;
    popup.style.display = 'block';
    const rect = popup.getBoundingClientRect();
    const left = Math.min(x + 12, window.innerWidth - rect.width - 8);
    const top = Math.min(y + 12, window.innerHeight - rect.height - 8);
    popup.style.left = Math.max(8, left) + 'px';
    popup.style.top = Math.max(8, top) + 'px';
  }

  function hide() {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    popup.style.display = 'none';
  }

  eventBus.on('element.hover', (event) => {
    const comment = getElementComment(event.element);
    if (!comment) return;
    const { clientX: x, clientY: y } = event.originalEvent;
    hide();
    hoverTimer = setTimeout(() => show(x, y, comment), COMMENT_HOVER_DELAY_MS);
  });

  ['element.out', 'element.mousedown', 'canvas.viewbox.changing'].forEach((name) => {
    eventBus.on(name, hide);
  });
}
