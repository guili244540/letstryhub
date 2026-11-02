// Shared click-popup: shows the link (as a clickable anchor), the comment
// and every filled properties field of an element as a fixed-position
// popup when the user clicks the element. Used by the Modeler (via
// properties-panel), the Viewer and the standalone/exported pages, so the
// interaction stays identical on every surface. The popup itself stays
// interactive so links can be clicked and long texts can be scrolled; it
// closes via its X button, a click on another element (which then shows
// that element's popup when it has content), a click on an element
// without content, a click on empty canvas, the Escape key, or a
// zoom/pan of the canvas.
//
// This module is the single source of the popup DOM/logic (EVOLUTION.md,
// slices 1-3). It is deliberately dependency-free and injects its own
// styles via src/comment-popup-style.js (kept in a separate file only
// because src/export-template.js cannot concatenate modules at runtime; it
// embeds both files in sequence). It must never contain the closing-tag
// sequence of a script or style element: scripts/inline-lib.mjs inlines it
// verbatim into the standalone pages after stripping the export keywords.

import { ensureCommentPopupStyle } from './comment-popup-style.js';

// Builds the popup content ({ url, text }) for the clicked element.
// Passed in by each caller because the attribute-access helpers live per
// surface today (src/links.js in the Vite app, local helpers in the
// standalone pages until the later EVOLUTION.md slices unify them too).
export function setupCommentPopup(eventBus, buildPopupText, hasContent) {
  ensureCommentPopupStyle();

  const popup = document.createElement('div');
  popup.id = 'comment-popup';
  popup.style.display = 'none';

  const closeButton = document.createElement('button');
  closeButton.id = 'comment-popup-close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.textContent = '\u00d7';
  closeButton.addEventListener('click', () => hide());
  popup.appendChild(closeButton);

  const content = document.createElement('div');
  content.id = 'comment-popup-content';
  popup.appendChild(content);

  document.body.appendChild(popup);

  function show(x, y, { url, urlText, text }) {
    content.textContent = '';
    if (url) {
      const link = document.createElement('a');
      link.id = 'comment-popup-link';
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = urlText || url;
      content.appendChild(link);
    }
    if (text) {
      const body = document.createElement('div');
      body.id = 'comment-popup-text';
      body.textContent = text;
      content.appendChild(body);
    }
    popup.style.display = 'block';
    const rect = popup.getBoundingClientRect();
    const left = Math.min(x + 12, window.innerWidth - rect.width - 8);
    const top = Math.min(y + 12, window.innerHeight - rect.height - 8);
    popup.style.left = Math.max(8, left) + 'px';
    popup.style.top = Math.max(8, top) + 'px';
  }

  function hide() {
    popup.style.display = 'none';
  }

  function isVisible() {
    return popup.style.display !== 'none';
  }

  eventBus.on('element.click', (event) => {
    const { element } = event;
    if (!hasContent(element)) {
      hide();
      return;
    }
    const { clientX: x, clientY: y } = event.originalEvent;
    show(x, y, buildPopupText(element));
  });

  // Clicking empty canvas (no element hit) also closes the popup.
  eventBus.on('canvas.click', hide);

  eventBus.on('canvas.viewbox.changing', hide);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isVisible()) hide();
  });
}
