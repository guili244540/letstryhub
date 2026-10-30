// Shared hover-popup: shows the comment and every filled properties field
// (all except the link) of an element as a fixed-position popup after
// hovering it for a short delay. Used by the Modeler (via
// properties-panel), the Viewer and the standalone/exported pages, so the
// interaction stays identical on every surface. The popup itself stays
// interactive so long texts can be scrolled; it closes via its X button or
// when the pointer leaves it.
// Moving the pointer from the element towards the popup crosses other
// diagram elements (e.g. the parent of a nested element), which would
// otherwise hide the popup before the cursor reaches it; hiding is
// therefore delayed by a short grace period that is cancelled as soon
// as the pointer enters the popup.
//
// This module is the single source of the popup DOM/logic (EVOLUTION.md,
// slice 1). It is deliberately dependency-free and injects its own styles
// via src/comment-popup-style.js (kept in a separate file only because
// src/export-template.js cannot concatenate modules at runtime; it embeds
// both files in sequence). It must never contain the closing-tag sequence
// of a script or style element: scripts/inline-lib.mjs inlines it verbatim
// into the standalone pages after stripping the export keywords.

import { ensureCommentPopupStyle } from './comment-popup-style.js';

export const COMMENT_HOVER_DELAY_MS = 1000;
export const COMMENT_HIDE_DELAY_MS = 300;

// Builds the popup text for the hovered element. Passed in by each caller
// because the attribute-access helpers live per surface today
// (src/links.js in the Vite app, local helpers in the standalone pages
// until the later EVOLUTION.md slices unify them too).
export function setupCommentPopup(eventBus, buildPopupText) {
  ensureCommentPopupStyle();

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
  let hideTimer = null;
  let hovered = false;

  popup.addEventListener('mouseenter', () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    hovered = true;
  });
  popup.addEventListener('mouseleave', () => {
    hovered = false;
    hide();
  });

  function show(x, y, text) {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
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
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    popup.style.display = 'none';
  }

  // Hide after a grace period so the pointer can travel from the element
  // to the popup without the popup vanishing mid-way. Any pending show
  // timer for a newly hovered element is left untouched: only the visible
  // popup is hidden, the upcoming one must still appear.
  function hideSoon() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      hideTimer = null;
      popup.style.display = 'none';
    }, COMMENT_HIDE_DELAY_MS);
  }

  function hideIfNotHovered() {
    if (!hovered) hideSoon();
  }

  eventBus.on('element.hover', (event) => {
    hideSoon();
    const text = buildPopupText(event.element);
    if (!text) return;
    const { clientX: x, clientY: y } = event.originalEvent;
    hoverTimer = setTimeout(() => show(x, y, text), COMMENT_HOVER_DELAY_MS);
  });

  ['canvas.viewbox.changing'].forEach((name) => {
    eventBus.on(name, hideIfNotHovered);
  });
  eventBus.on('element.mousedown', hide);
}
