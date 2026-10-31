# Evolution: icon toolbar for the editor pages

> **Status: IMPLEMENTED — all slices complete.** This plan follows the
> structure of the previous rounds (see [EVOLUTION261030.md](EVOLUTION261030.md)
> and [EVOLUTION261030_2.md](EVOLUTION261030_2.md)).

## 1. Goal

Replace the text-only toolbar buttons of the editor pages with icons,
agreed with the owner:

- **BPMN Editor brand button** (the `<h1>` title area): **icon + visible
  text + `aria-label`**, no tooltip.
- Every other toolbar button (**Open BPMN, Save BPMN, Export page,
  Download standalone editor, Properties**): **icon only**, with the former
  text label shown as a tooltip and exposed via `aria-label`.

Progress is checkable when: on `index.html`, `page/bpmnEditorOnLine.html`
and the generated `page/bpmnEditor.html`, the toolbar shows icons instead of
text (except the brand), each icon-only button carries `aria-label` and a
tooltip with its former label, `npm run check:pages` is green, and no
button behavior changed.

## 2. Current state (inventory)

Three editor surfaces share the same toolbar (six controls), duplicated
inline in each surface:

| Surface | Role | Toolbar location |
|---|---|---|
| `index.html` | Vite dev shell (loads `/src/modeler.js`) | lines 10-17 |
| `page/bpmnEditorOnLine.html` | light standalone editor; source of truth for the generated page | header buttons ~1011-1015, header CSS ~182-215 |
| `page/bpmnEditor.html` | **generated** from `bpmnEditorOnLine.html` by `npm run inline-lib` | never hand-edited |

Shared styling lives in `src/page-style.js` (header button CSS at
~line 61, `#toggle-panel.active` at ~line 209) for the Vite shell, and is
duplicated inline in `page/bpmnEditorOnLine.html`. Button behavior
(open/save/export/download/toggle) is wired by id in `src/modeler.js`
(`#toggle-panel` at line 152) and inlined in the standalone pages; none of
it changes.

Existing precedent for icons: the zoom controls strip
(`src/zoom-controls.js`, duplicated inline in both standalone pages) uses
hand-written inline stroke SVG — 24×24 viewBox, `stroke="currentColor"`,
rendered at 16px, with `title` per button. The new toolbar icons reuse
exactly this technique: Lucide-style (ISC) paths inlined by hand, no icon
font, no CDN — keeps the fully-offline requirement intact.

## 3. Design rules going forward

1. **Each slice is shippable on its own** and must leave
   `npm run check:pages` green.
2. **No behavior change intended.** Buttons keep their ids, handlers and
   actions; only markup, icons, labels and CSS change. The visible
   text→icon swap is the justified user-visible difference approved by
   the owner.
3. **Icon-only buttons** carry `aria-label` (equal to the former text),
   keep a native `title`, and get a small CSS tooltip shown on `hover`
   and `:focus-visible`. Minimum hit target ~32px, 16px SVG — consistent
   with the zoom controls.
4. **Brand button** (`BPMN Editor`) shows icon + text + `aria-label`,
   no tooltip.
5. **`#toggle-panel` keeps `aria-pressed` and the `.active` class**;
   its icon styling reflects the pressed (panel open) state.
6. **Narrow screens are a non-goal** — no responsive/overflow handling.
7. **Parameterize per-surface differences; do not unify them silently** —
   each of the three surfaces (plus the shared `src/page-style.js`) is
   edited explicitly; the generated page only via `npm run inline-lib`.

## 4. Steps (slices, in order)

### Slice 1 — icon set + Vite shell (`index.html`, `src/page-style.js`)

- Define the six inline SVG glyphs (one place per surface, matching the
  zoom-controls style):

  | Button | aria-label / tooltip | Glyph |
  |---|---|---|
  | brand (h1 area) | "BPMN Editor" | small BPMN process/diagram mark next to the text |
  | `#open` | "Open BPMN" | `folder-open` |
  | `#save` | "Save BPMN" | `save` (floppy) |
  | `#export` | "Export page" | `file-code` |
  | `#download-standalone` | "Download standalone editor" | `package` + download arrow (clearly distinct from `#export`) |
  | `#toggle-panel` | "Properties" | `panel-right`, styled when `.active` |

- Update the six buttons in `index.html` (icon-only + `aria-label` +
  `title`, brand keeps text) and extend `src/page-style.js` with
  icon-button sizing, tooltip CSS and brand icon alignment.
- `npm run dev` smoke; behavior unchanged.

### Slice 2 — standalone light editor (`page/bpmnEditorOnLine.html`)

- Apply the same toolbar markup and CSS changes in the inlined copy of
  the page (buttons + header CSS + tooltips).
- Run `npm run inline-lib` to regenerate `page/bpmnEditor.html`, then
  `npm run check:pages`.
- Smoke from `file://`: tooltips, toggle state, all four actions.

### Slice 3 — consistency check and documentation

- Verify both standalone pages and the Vite shell render identically.
- Update the toolbar description in README if it mentions button text;
  update this file's checklist; per rule 3 the transition notices /
  matrix in AGENTS.md are adjusted only if this plan is still in progress
  when a slice lands.

## 5. Constraints and non-goals

- `page/lib/` stays pinned to one bpmn-js version; upgrades remain a
  deliberate multi-step process.
- `dist/` is disposable — regenerated by `npm run build`, never edited,
  never committed.
- `page/bpmnEditor.html` is generated — only ever refreshed via
  `npm run inline-lib`.
- No icon font or external asset may be added; icons are inlined SVG only.
- **Non-goals:** narrow-screen/responsive toolbar behavior; changes to
  the zoom controls strip; any change to open/save/export/download/
  properties logic; replacing `title` on the zoom controls.

## 6. Risks

- **Ambiguity between `#export` and `#download-standalone`** (both produce
  a file): mitigated by deliberately distinct glyphs (`file-code` vs
  `package`+arrow) and tooltips.
- **Discoverability loss** from removing visible text: mitigated by
  tooltips + `aria-label`; owner accepted the trade-off.
- **Drift between the three duplicated surfaces**: mitigated by editing
  each explicitly (rule 7) and by `npm run check:pages`.
- **Tooltip duplication of `title`**: acceptable; CSS tooltip is the
  primary affordance, `title` stays as fallback.

## 7. Verification protocol (after each slice)

1. `npm run check:pages` — exits non-zero on drift.
2. `npm run inline-lib` and `npm run build` complete cleanly.
3. Manual smoke test of every affected surface (standalone pages from
   the file system, `npm run dev`, an exported page): hover/focus shows
   the tooltip, `#toggle-panel` icon reflects open state, all four
   actions still work, `aria-label`/`aria-pressed` present in the DOM.
4. In a sandbox without a browser, at minimum run steps 1-2 and state
   which browser checks were not performed.

## 8. Status checklist

- [x] Slice 1 — icons + tooltips in `index.html` / `src/page-style.js`
- [x] Slice 2 — icons + tooltips in `page/bpmnEditorOnLine.html`;
      regenerate `page/bpmnEditor.html`
- [x] Slice 3 — cross-surface consistency + docs

Verification performed (sandbox, no browser):
`npm run inline-lib`, `npm run check:pages` (all pages in sync) and
`npm run build` all pass; markup consistency verified programmatically
across `index.html`, `page/bpmnEditorOnLine.html` and `page/bpmnEditor.html`.
Manual browser checks (tooltips on hover/focus, toggle-panel icon state,
the four actions) were not performed in the sandbox.
README button references remain accurate — the former labels survive as
`aria-label` and tooltip text, so no wording change was needed.
