# Git policy

Read-only git commands (status, diff, log, show, etc.) are allowed and encouraged
for inspecting the repository.

Do not commit, push, create branches, stash, or otherwise modify git state.
In local sessions, make file edits only and leave the repository in a
dirty working state; the owner handles all state-changing git operations.
Never assume whether changes are committed; check `git status` first.

In remote coding sessions (Vibe Code Web sandboxes), creating a working
branch, committing to it, and opening a pull request is allowed as the
final step of the task. Never push directly to main. `development` and
`experimental` are the two integration branches: working branches should
be cut from one of them (not from `main`) and pull requests should target
that same branch. The owner handles promoting integration branches to
`main`.

Before starting any changes, the agent must ask the owner which
integration branch to work from: `development` or `experimental`. The
answer decides both the base branch and the PR target. If the owner does
not answer, default to `development` and state that assumption
explicitly.

Before committing (and especially before pushing), verify the branch is
still usable:

1. Check the current branch (`git branch --show-current`) and the state
   of its pull request (`gh pr view <branch> --json state`).
2. If the PR was already merged (or the branch was deleted), do not
   push to it: create a fresh branch cut from the up-to-date base
   branch (`origin/development` or `origin/experimental`, whichever the
   task targets) and move the commits there (rebase), then open a new PR.
3. If no PR exists yet for the branch, open one after the first commit
   rather than letting a branch accumulate work without review.

This avoids a common failure mode: the owner merges a PR while the agent
is still working, so a later commit lands on a dead branch and never
reaches `development`.


# Development

- Keep the bpmn.io watermark visible (license requirement).
- **Architectural transition in progress** (see `EVOLUTION.md`): shared
  CSS/JS is being unified into single sources under `src/`, with
  `npm run inline-lib` + `npm run build` propagating to all surfaces.
  **Before deciding where an edit belongs, check the status checklist in
  `EVOLUTION.md`:**
  - within a completed slice, edit the `src/` source only and
    regenerate (`npm run inline-lib`); the copies in the standalone
    pages are generated output. Completed so far: slice 1 (comment
    popup, CSS + JS — sources `src/comments.js` +
    `src/comment-popup-style.js`, injected as the
    `#comment-popup-module` marker block and embedded in exported
    pages); slice 2 (links, zoom controls, properties panel — sources
    `src/links.js`, `src/zoom-controls.js`,
    `src/properties-panel.js`, injected as the `#links-module`,
    `#zoom-controls-module` and `#properties-panel-module` marker
    blocks); slice 3 (shared page CSS — source `src/page-style.js`,
    injected at runtime as `<style id="page-style">`; the Vite app
    imports it, the standalone editor pages receive the
    `#page-style-module` marker block and the exported pages embed it
    via the template's `modules.style`; `src/style.css` is deleted).
    The export template receives all shared modules as a
    `modules` parameter and embeds them in exported pages.
    Marker-block execution order matters: `#links-module` must run
    before `#properties-panel-module` (its `links.js` import is
    stripped during inlining).
  - outside it, the standalone pages still carry hand-maintained
    copies: edit both the `src/` module and its standalone copies in
    the same change (the surface matrix below), otherwise the two
    worlds diverge.
  When a slice completes, update the `EVOLUTION.md` checklist first,
  then adjust the surface matrix in this file and the relevant README
  sections to match the new reality.
- The Vite app (`src/`) and the standalone pages (`page/`) are parallel
  implementations: a behavior change is only complete once the standalone
  pages reflect it too (directly or via `export-page.js`).
- Element-level behaviors (links, comments, markers, hover popups, zoom
  controls...) exist on several parallel surfaces and have diverged
  before (a feature shipped in the editor and exported pages but not in
  the viewer). When adding or changing one, walk the full surface matrix
  and cover every applicable surface in the same change:
  - editor: `src/modeler.js` + `src/properties-panel.js` ->
    `page/bpmnEditorOnLine.html` -> `page/bpmnEditor.html` (generated)
  - viewer: `src/viewer.js` -> `page/bpmnSample.html` (generated from
    `src/export-template.js` by `npm run inline-lib`; never hand-edit it)
  - export: `src/export-template.js` is the single source of the export
    template. `src/export-page.js` (Vite) and the `#export-template` block
    injected into the editor pages by `npm run inline-lib` both use it;
    `page/bpmnSample.html` is generated from it too. Never duplicate the
    template elsewhere: change `src/export-template.js` and regenerate.
  Shared attribute reading/writing belongs in `src/links.js` (or another
  shared module), not duplicated per file — **once the corresponding
  `EVOLUTION.md` slice is complete**; until then see the transition rule
  above (both copies must change together). After completion the copies
  in the standalone pages are generated and regenerated by
  `npm run inline-lib`. Before opening a PR, re-check
  each surface against the matrix; a feature present on one surface and
  missing on another is an incomplete change, not a follow-up.
- Develop features in the Vite app (`index.html` + `src/`) first:
  `npm run dev` serves only that app at localhost:5173 — the files under
  `page/` are not part of it and changing them alone has no effect there.
- After changing `page/bpmnEditorOnLine.html`, `src/export-template.js`,
  or `diagram/sample.bpmn`, regenerate the derived pages with
  `npm run inline-lib`; never hand-edit `page/bpmnEditor.html` or
  `page/bpmnSample.html`.
- The sample diagram lives in `diagram/sample.bpmn` (the single source of
  truth). Never paste diagram XML into a page by hand: edit the .bpmn file
  and run `npm run inline-lib`, which injects it into the `#bpmn-data`
  blocks of the standalone pages. `npm run check:pages` verifies the sync
  without writing (exits non-zero on drift) — use it in CI or before
  merging.
- `page/lib/*.js` and the inlined lib assets are generated output
  (`npm run build:extras`, `npm run inline-lib`) — do not edit them by hand.
- `page/bpmnSample.html` is generated output too (`npm run inline-lib`),
  built from `src/export-template.js` — do not edit it by hand.
- bpmn-js is vendored at a pinned version (18.31.0); do not upgrade it
  casually — upgrades require regenerating bundles and re-checking licenses.
- The Ehub extension descriptor in `src/ehub.json` must stay identical to
  the inline copy in `page/bpmnEditor.html`.
- There is no test suite: verify changes in the browser with `npm run dev`
  (editor and viewer), and test exported pages by opening them from the file
  system, not only via the dev server. In headless sandboxes where a browser
  is unavailable, run the builds and state clearly which checks were not
  performed so the owner can verify them after pulling the PR.