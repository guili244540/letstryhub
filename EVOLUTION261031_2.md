# Evolution: wire the "Clean diagram" and "Save BPMN as" toolbar buttons

> **Status: IMPLEMENTED — all slices complete.** This plan follows the
> structure of the previous rounds (see [EVOLUTION261030.md](EVOLUTION261030.md),
> [EVOLUTION261030_2.md](EVOLUTION261030_2.md) and
> [EVOLUTION261031.md](EVOLUTION261031.md)). The two buttons were added
> as icons without handlers in commit `152f612` (see EVOLUTION261031
> follow-up); this plan gives them their functionality.

## 1. Goal

The two icon-only toolbar buttons added to the editor headers do
something useful and predictable on every editor surface:

- **`#clean` (Clean diagram)** — replaces the canvas content with a new,
  empty BPMN diagram (a single, featureless poolless process), keeping the
  editor usable afterwards (elements can still be created, saved,
  exported). A confirmation step prevents accidental loss of the current
  diagram.
- **`#save-as` (Save BPMN as)** — exports the current diagram XML exactly
  like the existing `#save` button, but lets the user choose the file name
  via a browser download whose name is prompted for first (native
  `prompt()` with a sensible default derived from the current timestamp),
  instead of the fixed `BpmnSource<timestamp>.bpmn` name.

Progress is checkable when: on `index.html`, `page/bpmnEditorOnLine.html`
and the generated `page/bpmnEditor.html`, clicking the buttons produces
the behaviors above, the status line reflects what happened, the rest of
the toolbar is untouched, and `npm run check:pages` is green.

## 2. Current state (inventory)

Three editor surfaces carry the two dead buttons (markup added in
`152f612`, identical inline in each surface):

| Surface | Role | Where the buttons live | Where handlers must go |
|---|---|---|---|
| `index.html` | Vite dev shell (loads `/src/modeler.js`) | header, ids `clean`, `save-as` | `src/modeler.js` (open/save/export handlers around lines 36-118) |
| `page/bpmnEditorOnLine.html` | light standalone editor, hand-edited source of truth for the generated page | header buttons; open/save handlers at lines ~1828-1859 | same inline script, next to the `#save` handler |
| `page/bpmnEditor.html` | **generated** from `bpmnEditorOnLine.html` by `npm run inline-lib` | same | never hand-edited, regenerated |

Behavior conventions already established by `#save` / `#export`:

- XML is obtained with `await modeler.saveXML({ format: true })`.
- The file is delivered via a `Blob` + object-URL anchor click,
  `URL.revokeObjectURL` afterwards.
- The status line (`#status`) reports success or failure
  (`'Saved <file>.', 'Failed to save: ' + err.message`).
- Errors from `saveXML`/`importXML` are caught and reported, not thrown.
- The exported-XML "cannot be embedded in a page" check (`</script`)
  applies only to the page **export** flow, not to plain XML save — the
  new save-as follows the plain-save convention.
- `openDiagram(xml)` already exists on every surface and re-runs the
  content-marker sync; "clean" can reuse it as-is.

The standalone page must stay fully offline: `prompt()` and
`window.confirm()` are the only "dialogs" allowed (no CDN, no extra
dependency). The zoom controls and comment popup set the precedent for
prompt-free simplicity; there is no modal infrastructure to reuse, and
building one is out of scope.

## 3. Design rules going forward

1. **Each slice is shippable on its own** and must leave
   `npm run check:pages` green.
2. **Only the two dead buttons gain behavior.** Existing ids, handlers,
   markup and icons are not touched; the visible difference is exactly
   the functionality requested by the owner.
3. **Reuse the established save/open patterns verbatim** (per surface,
   in its local style): the Vite shell uses ES modules and `const`; the
   standalone page uses the same code inline in its existing
   `var`/`function` style. No new shared module is introduced for this
   pair — the handlers are page-local toolbar glue, like the existing
   `#save` handler, not reusable behavior.
4. **Empty diagram XML is a single local constant** per surface
   (a minimal `definitions` + one empty `process`), matching the minimal
   shape the modeler accepts, with the same BPMN namespaces the sample
   diagram uses.
5. **Destructive action is confirmed.** "Clean diagram" asks
   `window.confirm()` before wiping the canvas; the user can cancel with
   no effect. If the editor already shows an empty canvas, the confirm
   still runs (cheap and predictable beats clever state tracking).
6. **Save-as cancels cleanly.** If the user dismisses the `prompt()`,
   nothing is downloaded and the status line says so; an empty name is
   treated as canceled.
7. **The generated page is only regenerated** by `npm run inline-lib`
   after the standalone source is edited; hand-editing it fails
   `npm run check:pages`.
8. **Parameterize per-surface differences; do not unify them silently.**

## 4. Steps (slices, in order)

### Slice 1 — Clean diagram on all three surfaces

- Add an `EMPTY_DIAGRAM_XML` constant and a `#clean` click handler in:
  - `src/modeler.js` (Vite shell) — `confirm()` → `openDiagram(EMPTY_DIAGRAM_XML)`,
    status `'Diagram cleaned.'`; on cancel, status `'Clean cancelled.'`.
  - `page/bpmnEditorOnLine.html` — same logic inline, in the page's
    existing style, next to the `#save` handler.
- Regenerate `page/bpmnEditor.html` via `npm run inline-lib`.
- Check: `npm run check:pages` green; opening the pages from the file
  system and cleaning produces an empty, editable canvas.

### Slice 2 — Save BPMN as on all three surfaces

- Add a `#save-as` click handler that:
  1. `prompt('Save BPMN as', 'BpmnSource' + <ts>)` using the same
     timestamp scheme as `#save`;
  2. on `null` or empty string, stop with status `'Save-as cancelled.'`;
  3. otherwise run the exact `#save` flow but with the entered name
     (`.bpmn` appended if the user did not type it), status
     `'Saved <name>.'`.
- Same three surfaces as Slice 1 (source module, standalone source,
  regenerate the generated page).
- Check: `npm run check:pages` green; the download carries the chosen
  name in all three surfaces.

## 5. Constraints and non-goals

- `page/lib/` stays pinned to one bpmn-js version; upgrades remain a
  deliberate multi-step process.
- `dist/` is disposable — regenerated by `npm run build`, never edited,
  never committed.
- **No new dependency, no modal framework, no filename plumbing into the
  existing `#save` button** — `#save` keeps its timestamped name.
- The exported-viewer page (`#export`) is untouched.
- Undo/redo history across a clean is a non-goal (bpmn-js command stack
  naturally empties on a fresh import; that is accepted behavior).
- Narrow screens are a non-goal.

## 6. Verification protocol (after each slice)

1. `npm run check:pages` — exits non-zero on drift.
2. `npm run inline-lib` and `npm run build` complete cleanly.
3. Manual smoke test of every affected surface (standalone pages from
   the file system, `npm run dev`, an exported page).
4. In a sandbox without a browser, at minimum run steps 1-2 and state
   which browser checks were not performed.

### Slice 3 — OS "Save as" dialog via the File System Access API (follow-up requested by the owner)

- On browsers that implement `window.showSaveFilePicker()` (Chromium,
  Edge, Chrome), `#save-as` opens the real OS save dialog: the user
  picks the folder and the name (default `BpmnSource<timestamp>.bpmn`,
  filter `BPMN / XML files`), and the XML is written directly to the
  chosen location (no download folder round-trip).
- On browsers without the API (Firefox, Safari) the button falls back
  to the Slice 2 behavior (prompt + download), so no surface loses
  functionality.
- Canceling the OS dialog is a clean no-op (status `Save-as
  cancelled.`), consistent with the existing cancel semantics.
- Same three surfaces as Slices 1-2 (`src/modeler.js`, inline in
  `page/bpmnEditorOnLine.html`, regenerate `page/bpmnEditor.html`).
- Note: `showSaveFilePicker` requires a user gesture and a secure
  context (https or localhost); served from `file://` or plain http on
  a LAN IP the API is unavailable and the fallback engages. This is
  accepted — the standalone pages are primarily used via `file://`,
  where the fallback keeps the feature working.
- Check: `npm run check:pages` green; in Chromium the dialog opens,
  the chosen path receives the `.bpmn` file; in Firefox the prompt
  fallback still works.

## 7. Risks

- **`importXML` of the empty diagram fails on some bpmn-js versions** if
  the XML lacks required namespaces/diagram elements — mitigated by
  reusing the exact namespace set of `diagram/sample.bpmn` and testing
  in the browser check.
- **`prompt()` returns vary across browsers** (some browsers suppress
  repeated prompts); the cancel path is defensive (treated as a clean
  cancel, no download) so the failure mode is a no-op, never a wrong
  file.
- **Drift between the three copies** of the handler — the existing
  `npm run check:pages` guard plus the shared timestamp/status-string
  conventions keep copies aligned; no new marker block is needed for
  glue of this size.

## 8. Status checklist

- [x] Slice 1 — Clean diagram (`src/modeler.js`,
      `page/bpmnEditorOnLine.html`, regenerate `page/bpmnEditor.html`)
- [x] Slice 2 — Save BPMN as (same three surfaces)
- [x] `npm run check:pages` green, `npm run inline-lib` + `npm run build`
      clean
- [x] Browser smoke tests — **not performed** (sandbox without a
      browser): `npm run check:pages`, `npm run inline-lib` and
      `npm run build` were run instead, plus a syntax parse check of the
      two edited handler blocks. The confirm/prompt flows and the empty
      diagram import still need a manual browser pass by the owner.
- [x] README changelog entry, then archive this file as
      `EVOLUTION261031_2.md` when complete
- [x] Slice 3 — OS "Save as" dialog via `showSaveFilePicker` with
      prompt fallback (owner follow-up); browser checks not performed
      in the sandbox (no browser), `npm run check:pages` + `npm run
      build` green instead — needs a manual Chromium + Firefox pass by
      the owner
