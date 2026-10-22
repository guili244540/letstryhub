// Shared hover-popup: shows the comment and every filled properties field
// (all except the link) of an element as a fixed-position popup after
// hovering it for a short delay. Used by both the Modeler (via
// properties-panel) and the Viewer, so the interaction stays identical on
// every surface. The popup itself stays interactive so long texts can be
// scrolled; it closes via its X button or when the pointer leaves it.
import { buildPopupText } from './links.js';

export const COMMENT_HOVER_DELAY_MS = 1000;

export function setupCommentPopup(eventBus) {
  const popup = document.createElement('div');
  popup.id = 'comment-popup';
  popup.style.display = 'none';

  const closeButton = document.createElement('button');
  closeButton.id = 'comment-popup-close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.textContent = '\u00d7';
  closeButton.addEventListener('click', () => {
    hovered = false;
    hide();
  });
  popup.appendChild(closeButton);

  const content = document.createElement('div');
  content.id = 'comment-popup-content';
  popup.appendChild(content);

  document.body.appendChild(popup);

  let hoverTimer = null;
  let hovered = false;

  popup.addEventListener('mouseenter', () => { hovered = true; });
  popup.addEventListener('mouseleave', () => {
    hovered = false;
    hide();
  });

  function show(x, y, text) {
    content.textContent = text;
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

  function hideIfNotHovered() {
    if (!hovered) hide();
  }

  eventBus.on('element.hover', (event) => {
    const text = buildPopupText(event.element);
    if (!text) return;
    const { clientX: x, clientY: y } = event.originalEvent;
    hide();
    hoverTimer = setTimeout(() => show(x, y, text), COMMENT_HOVER_DELAY_MS);
  });

  ['element.out', 'canvas.viewbox.changing'].forEach((name) => {
    eventBus.on(name, hideIfNotHovered);
  });
  eventBus.on('element.mousedown', hide);
}
