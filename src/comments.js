// Shared hover-comment popup: shows the ehub:comment attribute of an
// element as a fixed-position popup after hovering it for a short delay.
// Used by both the Modeler (via properties-panel) and the Viewer, so the
// interaction stays identical on every surface.
import { getElementComment } from './links.js';

export const COMMENT_HOVER_DELAY_MS = 1000;

export function setupCommentPopup(eventBus) {
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
