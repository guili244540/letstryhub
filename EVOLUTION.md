# Evolution: One Source of Truth for CSS and JS

> **Status: PLAN — not started.** This document describes the target
> architecture and the steps to get there. Track progress in the
> checklist at the bottom; when the plan is complete, either delete
> this file or compress it into a short README section
> ("How the single-source pipeline works").

## 1. Goal

Every piece of CSS and JavaScript that is **shared** between the
surfaces of this project must be maintained in **exactly one place**
under `src/`. All derived artifacts are regenerated from it:

- `npm run inline-lib` propagates sources into
  `page/bpmnEditorOnLine.html` (marker blocks), `page/bpmnEditor.html`
  (generated), `page/bpmnSample.html` (generated) and the export
  template's output (exported viewer pages).
- `npm run build` propagates sources into `dist/` (Vite bundles them
  natively; no extra machinery needed).
- `npm run check:pages` guards the invariant and fails on drift
  between sources and generated pages.

Concretely: **changing the color of the comment popup — or any other
shared CSS/JS — must require editing exactly one file**, followed by
`npm run inline-lib` and, for `dist/`, `npm run build`.

### The "one source, four surfaces" precedent

This is not a new idea for the repo: `src/export-template.js` already
works exactly this way ("one source, four surfaces", see README).
The plan below extends the same discipline to the remaining
duplicated assets.

## 2. Current state (inventory of duplication)

| Asset | Canonical copies that exist today |
|---|---|
| Export template (viewer page) | `src/export-template.js` — **already single-source**, injected everywhere by `inline-lib.mjs` |
| Popup CSS | `src/style.css` (`#comment-popup*` rules) **and** inline copies in `page/bpmnEditorOnLine.html` (×2: runtime + export-template block) **and** `src/export-template.js` |
| Popup DOM/hover JS | `src/comments.js` **and** inline copies in `page/bpmnEditorOnLine.html` (×2) **and** `src/export-template.js` |
| Link read/write, click-to-open, markers | `src/links.js` **and** inline copies in `page/bpmnEditorOnLine.html` |
| Properties/link panel JS | `src/properties-panel.js` **and** inline copies in `page/bpmnEditorOnLine.html` |
| Zoom controls JS | `src/zoom-controls.js` **and** inline copies in `page/bpmnEditorOnLine.html` |
| Page CSS (layout, panels, buttons) | `src/style.css` **and** inline styles in `page/bpmnEditorOnLine.html` |
| Vendored lib (`page/lib/`) | Third-party, pinned to bpmn-js 18.31.0 — **out of scope**, never hand-edited |

Note: `page/bpmnEditor.html` and `page/bpmnSample.html` are fully
generated and therefore not listed — they inherit from whatever the
sources produce.

## 3. Design rules going forward

1. **No shared code in generated pages.** Hand-editing
   `page/bpmnEditor.html`, `page/bpmnSample.html`, or the injected
   blocks of `page/bpmnEditorOnLine.html` is forbidden; edit the
   `src/` source and regenerate.
2. **Sources must be inlinable.** Any module that will be injected
   into the standalone pages must stay dependency-free — no bare
   imports (`bpmn-js/...`), no Vite-specific syntax (`?raw`), no
   `</script` inside the source (checked by `inline-lib.mjs`).
   App entry points (`modeler.js`, `viewer.js`) that never get
   inlined are exempt.
3. **Styles are injected by the module that owns them**, using a
   `<style id="...">` element created at runtime (the pattern the
   standalone pages already use). `src/style.css` shrinks to what is
   genuinely Vite-app-specific, or disappears.
4. **Each slice is shippable on its own** and must leave
   `npm run check:pages` green.
5. **README.md and AGENTS.md track the transition state.** Both must
   stay consistent with the current status of this plan: while it is
   in progress, they carry the "transition in progress" notice; when a
   slice completes, the `EVOLUTION.md` checklist is updated first, then
   the surface matrix in AGENTS.md and the relevant README sections are
   adjusted to match; when the whole plan is done, the notices are
   removed and this file is either deleted or compressed into a short
   README section.
6. **Genuinely per-page code stays put.** The open/save-file buttons,
   the `file://`-vs-HTTP messaging, and the "download standalone
   editor" button are specific to the standalone editor pages; they
   are *not* duplication and are not extracted.

## 4. Steps (slices, in order)

### Slice 1 — Popup (CSS + JS): the pilot
Extract the comment-popup styles and DOM/hover logic into
import-free modules (`src/comments.js` + a popup-style module),
inject them from `src/` into:
- the Vite app (import; covers dev + `dist/`),
- `page/bpmnEditorOnLine.html` (marker block, both occurrences),
- the export template output (exported pages + `bpmnSample.html`).

Diff the three current copies first and reconcile differences before
extracting. Extend `scripts/inline-lib.mjs` with a generic
"refill marker block from source file" injector, modeled on the
existing `injectExportTemplate`. Lessons from this slice shape the
rest of the plan.

### Slice 2 — Links, zoom controls, properties/link panel
Same treatment for `src/links.js`, `src/zoom-controls.js`,
`src/properties-panel.js`: make them dependency-free, add marker
blocks in `bpmnEditorOnLine.html`, extend the injector, verify.

### Slice 3 — Page CSS (`src/style.css`)
Move shared layout/panel/button styles into the injecting modules or
a dedicated injected-styles module; reduce or remove `src/style.css`.

### Slice 4 — Export template embedding cleanup
Ensure the export-template output embeds the shared modules from
their single sources rather than carrying its own copies, so
exported pages and `bpmnSample.html` derive from `src/` too.

### Each slice ends with the verification protocol (§6).

## 5. Constraints and non-goals

- **Exported pages are frozen.** Standalone viewer HTML files already
  generated and shared keep their old popup/styles forever; only
  future exports change. Unavoidable with single-file pages.
- **Vendored `page/lib/` stays pinned** to one bpmn-js version;
  upgrades remain the deliberate multi-step process described in the
  README.
- **No behavior change intended.** This is a refactor; any
  user-visible difference must be justified separately.
- **`dist/` is disposable** — regenerated by `npm run build`,
  never edited, never committed.

## 6. Verification protocol (after each slice)

No automated UI tests exist; verification is:

1. `npm run check:pages` — exits non-zero on drift.
2. `npm run inline-lib` and `npm run build` complete cleanly.
3. Manual smoke test from the file system:
   `page/bpmnEditor.html` and `page/bpmnEditorOnLine.html`
   (open/save/export, popup hover, links, colors, zoom);
   `page/bpmnSample.html` (popup, links, zoom).
4. Export a page and check its popup, links and zoom.
5. `npm run dev`: editor and viewer pages behave the same.

In a sandbox without a browser, at minimum run steps 1–2 and state
which browser checks were not performed (same rule as bpmn-js
upgrades).

## 7. Risks

- **Copy drift.** The inline copies and `src/` copies have evolved
  independently (the hover-popup work touched several at once).
  Every extraction must start with a careful diff and an explicit
  decision about which variant is canonical.
- **Inlinability constraints.** A future edit that adds an import or
  `</script` to an inlined module breaks generation; the existing
  `inline-lib.mjs` checks and `check:pages` must catch this.
- **Regression surface.** With no UI tests, each slice relies on the
  manual protocol above; keep slices small.

## 8. Status checklist

- [ ] Slice 1 — Popup (CSS + JS)
- [ ] Slice 2 — Links, zoom controls, properties/link panel
- [ ] Slice 3 — Page CSS (`src/style.css`)
- [ ] Slice 4 — Export template embedding cleanup

---

Drafted as agreed: goal → inventory → rules → steps → constraints →
risks → verification. Slice 1 is intentionally detailed enough to
execute first, as the pilot for the rest.
