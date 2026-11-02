# Evolution: Click-to-open popup with the link inside, comment-style shadows for all ehub properties

> **Status: IN PROGRESS — all slices implemented, browser verification pending.**
> Working branch: `popupbehavior` (cut from `experimental`); the future PR
> targets `experimental`.

## 1. Goal

Replace the hover-based comment popup with a click-based one and make the
ehub link a first-class part of it:

1. The popup displays the **clickable link at the beginning**, followed by
   the comment and the other ehub properties.
2. The popup opens **only when the user clicks an element** that has ehub
   content (a link, a comment, or at least one other ehub property).
3. The popup closes **only** via:
   - its `x` button,
   - clicking another element (which shows that element's popup if it has
     content),
   - clicking an element without content,
   - clicking empty canvas,
   - pressing `Escape`.
4. The **canvas shadow** currently marking elements with a comment also
   marks elements that have any other ehub property (input, output,
   validation, exception, implementation fields): "other ehub property =
   comment" for the shadow.
5. The link is no longer opened directly by clicking the element on any
   surface (the editor's `ctrl`+click direct-open is removed too); the
   popup's link anchor is the only way to open it.

## 2. Current state (inventory)

| Concern | Where it lives today | Behavior today |
|---|---|---|
| Popup DOM + logic | `src/comments.js` (`setupCommentPopup`) | Opens on `element.hover` after `COMMENT_HOVER_DELAY_MS` (1000 ms); hides via `x` button, pointer leaving the popup, or a 300 ms grace delay (`hideSoon`) when hovering elsewhere; also hidden on `canvas.viewbox.changing` (if not hovered) and `element.mousedown` |
| Popup CSS | `src/comment-popup-style.js` | Plain-text content only, no link anchor style |
| Popup text builders | `src/links.js` (`buildPopupText` grouped, `buildFlatPopupText` flat) | Comment first, then other ehub properties; **link excluded** |
| Link opening | `src/links.js` (`registerOpenLinks`) | `element.click` opens the URL: plain click in viewer/exported pages, `ctrl`+click in the editor |
| Canvas markers / shadows | `src/links.js` (`updateContentMarkers`), CSS in `src/page-style.js` (`has-link`, `has-comment`) | Shadow for link and/or comment only |
| Surfaces affected | Vite editor `src/modeler.js` + `src/properties-panel.js`; Vite viewer `src/viewer.js`; export template `src/export-template.js`; standalone editor `page/bpmnEditorOnLine.html` → generated `page/bpmnEditor.html`; generated `page/bpmnSample.html` | All surfaces must change together (AGENTS.md surface matrix) |

Decisions confirmed by the owner for the open questions:

- Q1 (extra close triggers): yes — empty canvas, element without content,
  and `Escape` all close the popup.
- Q2 (editor `ctrl`+click): yes — remove it; the popup link is the only
  way to open a URL on every surface.
- Q3 (zoom/pan): yes — the popup hides when the viewbox changes, as today.

## 3. Design rules going forward

1. Each slice is shippable on its own and must leave
   `npm run check:pages` green (run `npm run inline-lib` after every slice
   that touches `src/`).
2. All shared logic changes happen in the single sources under `src/`
   (`comments.js`, `links.js`, `comment-popup-style.js`); the standalone
   pages are regenerated, never hand-edited.
3. Keep the modules inlinable: dependency-free, no bare imports, no
   `</script`/`</style` sequences.
4. Per-surface differences stay parameterized (e.g. the flat vs grouped
   popup text, the `Implementation – ` label prefix in the standalone
   editor) — do not unify them silently.
5. `dist/` is disposable and never committed.

## 4. Steps (slices, in order)

### Slice 1 — Link inside the popup, structured popup content

- `src/links.js`: extend the popup text builders to return the link along
  with the text (`{ url, text }` shape or equivalent), link first. Add a
  shared `hasEhubContent(element)` helper: true when the element has a
  link, a comment, or any other ehub property.
- `src/comments.js`: render the link as a clickable
  `<a href target="_blank" rel="noopener">` at the top of the popup
  content; the comment/properties text below it.
- `src/comment-popup-style.js`: style the link anchor.
- Update the stale header comments describing hover behavior.

### Slice 2 — Click to show, refined close rules

- `src/comments.js`: show the popup on `element.click` (only when the
  element `hasEhubContent`), positioned at the click coordinates; remove
  the hover delay, the grace-period timers, the `mouseleave` auto-hide
  and the `element.hover` handler.
- Close on: `x` button; click on another element (its popup replaces the
  current one when it has content); click on an element without content;
  click on empty canvas; `Escape`.
- Keep hiding on `canvas.viewbox.changing` (zoom/pan), as today.
- Remove the now-unused `element.mousedown` hide (the click handler owns
  the lifecycle).

### Slice 3 — Link opening moves into the popup

- `src/links.js`: remove `registerOpenLinks` (or reduce it to nothing) —
  element clicks no longer open URLs on any surface.
- `src/modeler.js`, `src/viewer.js`, `src/export-template.js`,
  `page/bpmnEditorOnLine.html` (call sites): drop the
  `registerOpenLinks` wiring; the popup anchor is the only link opener.

### Slice 4 — Comment-style shadow for all ehub properties

- `src/links.js`: in `updateContentMarkers`, set the `has-comment` marker
  when the element has a comment **or** any other ehub property
  (input, output, validation, exception, implementation current/target/
  target method). Marker name and CSS unchanged; only the condition
  widens.

### Slice 5 — Regenerate, verify, document

- `npm run inline-lib` (regenerates `page/bpmnEditor.html`,
  `page/bpmnSample.html` and the editor export blocks),
  `npm run check:pages`, `npm run build`.
- Adjust AGENTS.md / README wording that still describes hover popups or
  `ctrl`+click opening.
- Manual smoke test of every surface (see protocol below).

## 5. Constraints and non-goals

- The popup stays a fixed-position DOM element outside the canvas; no
  diagram-overlay refactoring.
- bpmn-js stays pinned at 18.31.0; `page/lib/` is untouched.
- No new dependencies.
- The popup's visual design is otherwise unchanged (position near the
  click point, clamped to the viewport, scrollable content).

## 6. Risks

- Clicking an element in the editor also selects it (modeler default
  interaction); the popup must not fight selection — acceptable, they
  coexist.
- `element.click` on the canvas root/background may not fire like an
  element click; the empty-canvas close may need a canvas `click`/blank
  region listener. Verify in the browser.
- Exported pages run from `file://`; the anchor with `rel="noopener"` and
  `target="_blank"` must work there — verify by opening an exported page
  from the file system.

## 7. Verification protocol (after each slice)

1. `npm run check:pages` — exits non-zero on drift.
2. `npm run inline-lib` and `npm run build` complete cleanly.
3. Manual smoke test of every affected surface (standalone pages from
   the file system, `npm run dev`, an exported page):
   - click on element with ehub content → popup with link first,
     link opens the URL;
   - click `x` / another element / element without content / empty
     canvas / `Escape` → popup closes;
   - zoom/pan → popup hides;
   - element with only e.g. `ehub:input` → comment shadow shown;
   - no element click opens a URL directly anymore.
4. In a sandbox without a browser, run steps 1-2 at minimum and state
   which browser checks were not performed.

## 8. Status checklist

- [x] Slice 1 — link inside the popup, structured content
- [x] Slice 2 — click to show, refined close rules
- [x] Slice 3 — link opening moved into the popup
- [x] Slice 4 — comment-style shadow for all ehub properties
- [x] Slice 5 — regenerate, verify, document
