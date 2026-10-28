// Single source of the comment-popup CSS (EVOLUTION.md, slice 1).
//
// The popup styles are owned by this module and injected at runtime as a
// <style id="comment-popup-style"> element, so no surface carries a
// hand-maintained copy: the Vite app imports this module, and the
// standalone pages receive it verbatim in the #comment-popup-style marker
// block refilled by scripts/inline-lib.mjs.
//
// The file is deliberately dependency-free (no imports, no Vite-specific
// syntax) and must never contain the closing-tag sequence of a script or
// style element anywhere, not even inside a comment: it runs both as an ES
// module and as a plain inlined script block.

export const COMMENT_POPUP_STYLE_ID = 'comment-popup-style';

export const COMMENT_POPUP_CSS = `
#comment-popup {
  position: fixed;
  z-index: 1000;
  max-width: 300px;
  max-height: 200px;
  overflow: auto;
  padding: 0.5rem 0.75rem;
  background: #fffde7;
  border: 1px solid #d4c65c;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: 0.85rem;
  font-family: system-ui, sans-serif;
  white-space: pre-wrap;
}

#comment-popup #comment-popup-close {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  background: transparent;
  color: #7a6a1c;
  font-size: 14px;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
}

#comment-popup #comment-popup-close:hover {
  background: #efe6a0;
  border-radius: 3px;
}

#comment-popup #comment-popup-content {
  max-height: 180px;
  overflow: auto;
  padding-right: 12px;
  scrollbar-width: thin;
}
`;

// Idempotent: creates the <style> element once, reuses it afterwards.
export function ensureCommentPopupStyle() {
  let style = document.getElementById(COMMENT_POPUP_STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = COMMENT_POPUP_STYLE_ID;
    style.textContent = COMMENT_POPUP_CSS;
    document.head.appendChild(style);
  }
  return style;
}
