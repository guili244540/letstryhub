// Single source of the shared page CSS (EVOLUTION.md, slice 3): the app
// shell (layout, header, toolbar buttons), the properties panel, the zoom
// strip, the link/comment cursor and halo rules, and the palette override.
//
// The styles are owned by this module and injected at runtime as a
// <style id="page-style"> element, so no surface carries a hand-maintained
// copy: the Vite app imports this module, the standalone editor pages
// receive it verbatim in the #page-style-module marker block refilled by
// scripts/inline-lib.mjs, and every page exported by the template embeds
// the same plain module.
//
// The file is deliberately dependency-free (no imports, no Vite-specific
// syntax) and must never contain the closing-tag sequence of a script or
// style element anywhere, not even inside a comment or string: it runs
// both as an ES module and as a plain inlined script block.
//
// One per-surface difference is preserved on purpose (slice 1, lesson 3:
// parameterize, do not unify silently): only the standalone editor pages
// and the exported viewer pages draw a 1px border around the canvas; the
// Vite app never did. The border is requested via the data-canvas-border
// attribute on the <html> element, so the module can inject the style
// while the page head is still parsing (no unstyled flash) and still stay
// a verbatim single source on every surface.

const PAGE_STYLE_ID = 'page-style';

const PAGE_STYLE_CSS = `
* {
  box-sizing: border-box;
}

html, body {
  height: 100%;
  margin: 0;
  font-family: system-ui, sans-serif;
}

body {
  display: flex;
  flex-direction: column;
}

header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #ddd;
}

header h1 {
  font-size: 1rem;
  margin: 0;
}

#status {
  color: #666;
  font-size: 0.85rem;
}

/* Toolbar buttons next to the title. */
header button {
  font: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.4rem 0.85rem;
  border: 1px solid #c9c9c9;
  border-radius: 6px;
  background: #fff;
  color: #333;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

/* Icon-only toolbar buttons: tooltip + aria-label carry the label. */
header button.icon-only {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

header button.icon-only svg {
  width: 16px;
  height: 16px;
}

header button.icon-only[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #333;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 400;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 30;
}

header button.icon-only[data-tooltip]:hover::after,
header button.icon-only[data-tooltip]:focus-visible::after {
  opacity: 1;
}

/* Brand icon inside the <h1> title. */
header h1 {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

header h1 svg {
  width: 20px;
  height: 20px;
  color: #1a73e8;
}

header button:hover {
  background: #f2f2f2;
  border-color: #aaa;
}

header button:focus-visible {
  outline: 2px solid #7aa5e0;
  outline-offset: 1px;
}

header button:active {
  background: #e6e6e6;
}

#save {
  background: #1a73e8;
  border-color: #1a73e8;
  color: #fff;
}

#save:hover {
  background: #1666d0;
  border-color: #1666d0;
}

#save:active {
  background: #1257b8;
}

#export {
  background: #f4f9ee;
  border-color: #a8d08d;
  color: #2f6b1f;
}

#export:hover {
  background: #e8f3dd;
  border-color: #86bd63;
}

#export:active {
  background: #d8ecbe;
}

main {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* The standalone editor pages and the exported viewer pages additionally
   set data-canvas-border on <html>, which adds the border rule below.
   Exported pages are plain body > canvas; there the flex column on body
   plus flex:1 on the canvas fill the viewport, replacing the explicit
   height: 100% their old copy carried. */
#canvas {
  flex: 1;
  min-width: 0;
  position: relative;
}

#properties-panel {
  width: 280px;
  border-left: 1px solid #ddd;
  padding: 1rem 1rem 1.5rem;
  background: #fafbfc;
  overflow-y: auto;
}

#properties-panel h3 {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #556;
  border-bottom: 1px solid #e2e4e8;
  padding-bottom: 0.5rem;
}

#properties-panel p {
  margin: 0;
  color: #888;
  font-size: 0.85rem;
}

#properties-panel label {
  display: block;
  margin: 0.9rem 0 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #445;
}

#properties-panel input,
#properties-panel textarea {
  margin-bottom: 0.25rem;
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: 1px solid #ccd0d6;
  border-radius: 4px;
  background: #fff;
  font: inherit;
  font-size: 0.85rem;
  color: #222;
}

#properties-panel input:focus,
#properties-panel textarea:focus {
  outline: none;
  border-color: #7aa5e0;
  box-shadow: 0 0 0 2px rgba(122, 165, 224, 0.25);
}

#properties-panel textarea {
  resize: vertical;
  min-height: 4.5rem;
}

#properties-panel h4 {
  margin: 1.25rem 0 0;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #556;
  border-bottom: 1px solid #e2e4e8;
  padding-bottom: 0.35rem;
}

#properties-panel h4 + label {
  margin-top: 0.6rem;
}

#toggle-panel.active {
  background: #dce8ff;
  border-color: #7aa5e0;
  color: #1a56b0;
}

#toggle-panel.active svg {
  stroke-width: 2;
}

/* Zoom control strip, bottom-right of the canvas, above the bpmn.io watermark. */
.zoom-controls {
  position: absolute;
  right: 15px;
  bottom: 80px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 20;
}

.zoom-controls button {
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  background: #fff;
  color: #444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.zoom-controls button + button {
  border-top: 1px solid #e8e8e8;
}

.zoom-controls button:hover {
  background: #f2f2f2;
}

.zoom-controls svg {
  width: 16px;
  height: 16px;
}

/* Elements carrying an external link get a pointer cursor.
   Must out-specify diagram-js's ".djs-element .djs-hit-* { cursor: move }". */
.djs-element.has-link .djs-hit-stroke,
.djs-element.has-link .djs-hit-click-stroke,
.djs-element.has-link .djs-hit-all {
  cursor: pointer;
}

/* Elements carrying a link or a comment get a soft colored halo so they are
   recognizable without hovering: royal blue = link, amber = comment,
   violet = both. The glow is purely additive: the element's own stroke and
   fill colors (default or set via the color picker) are untouched. */
.djs-element.has-link .djs-visual {
  filter: drop-shadow(0 0 4px rgba(65, 105, 225, 0.9));
}

.djs-element.has-comment .djs-visual {
  filter: drop-shadow(0 0 4px rgba(204, 122, 0, 0.9));
}

.djs-element.has-link.has-comment .djs-visual {
  filter: drop-shadow(0 0 4px rgba(123, 79, 184, 0.9));
}
`;

const CANVAS_BORDER_CSS = `
#canvas {
  border: 1px solid #ddd;
}
`;

/* Keep the modeling palette (tool column, top-left) fully visible
   instead of the default fade-in on hover. Harmless on viewer-only
   surfaces, which have no palette. */
const PALETTE_CSS = `
.djs-palette,
.djs-palette .group,
.djs-palette .entry {
  opacity: 1 !important;
}
`;

// Idempotent: creates the <style> element once, reuses and rewrites it
// afterwards, so a second call with different options stays correct.
export function ensurePageStyle({ canvasBorder } = {}) {
  if (canvasBorder === undefined) {
    canvasBorder = document.documentElement.hasAttribute('data-canvas-border');
  }
  const css = PAGE_STYLE_CSS + (canvasBorder ? CANVAS_BORDER_CSS : '') + PALETTE_CSS;
  let style = document.getElementById(PAGE_STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = PAGE_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;
  return style;
}

// Self-executing on every surface: the Vite app imports this module, and
// the standalone/exported pages run it as an inlined plain script block
// while the head is still parsing, so the layout is in place before the
// body renders.
ensurePageStyle();
