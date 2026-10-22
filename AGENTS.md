# Git policy

Read-only git commands (status, diff, log, show, etc.) are allowed and encouraged
for inspecting the repository.

Do not commit, push, create branches, stash, or otherwise modify git state.
In local sessions, make file edits only and leave the repository in a
dirty working state; the owner handles all state-changing git operations.
Never assume whether changes are committed; check `git status` first.

In remote coding sessions (Vibe Code Web sandboxes), creating a working
branch, committing to it, and opening a pull request is allowed as the
final step of the task. Never push directly to main. Branches should be
cut from `development` (not `main`) and pull requests should target
`development`; the owner handles promoting `development` to `main`.

Before committing (and especially before pushing), verify the branch is
still usable:

1. Check the current branch (`git branch --show-current`) and the state
   of its pull request (`gh pr view <branch> --json state`).
2. If the PR was already merged (or the branch was deleted), do not
   push to it: create a fresh branch cut from the up-to-date
   `origin/development` and move the commits there (rebase), then open
   a new PR.
3. If no PR exists yet for the branch, open one after the first commit
   rather than letting a branch accumulate work without review.

This avoids a common failure mode: the owner merges a PR while the agent
is still working, so a later commit lands on a dead branch and never
reaches `development`.


# Development

- Keep the bpmn.io watermark visible (license requirement).
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
  - viewer: `src/viewer.js` -> `page/bpmnSample.html`
  - export: `src/export-page.js` and the inline export template inside
    `page/bpmnEditorOnLine.html` (two copies of the same template; keep
    them in sync with each other and functionally identical to
    `page/bpmnSample.html`)
  Shared attribute reading/writing belongs in `src/links.js` (or another
  shared module), not duplicated per file. Before opening a PR, re-check
  each surface against the matrix; a feature present on one surface and
  missing on another is an incomplete change, not a follow-up.
- Develop features in the Vite app (`index.html` + `src/`) first:
  `npm run dev` serves only that app at localhost:5173 — the files under
  `page/` are not part of it and changing them alone has no effect there.
- After changing `page/bpmnEditorOnLine.html`, regenerate
  `page/bpmnEditor.html` with `npm run inline-lib`; never hand-edit the
  generated file.
- The sample diagram lives in `diagram/sample.bpmn` (the single source of
  truth). Never paste diagram XML into a page by hand: edit the .bpmn file
  and run `npm run inline-lib`, which injects it into the `#bpmn-data`
  blocks of the standalone pages. `npm run check:pages` verifies the sync
  without writing (exits non-zero on drift) — use it in CI or before
  merging.
- `page/lib/*.js` and the inlined lib assets are generated output
  (`npm run build:extras`, `npm run inline-lib`) — do not edit them by hand.
- bpmn-js is vendored at a pinned version (18.31.0); do not upgrade it
  casually — upgrades require regenerating bundles and re-checking licenses.
- The Ehub extension descriptor in `src/ehub.json` must stay identical to
  the inline copy in `page/bpmnEditor.html`.
- There is no test suite: verify changes in the browser with `npm run dev`
  (editor and viewer), and test exported pages by opening them from the file
  system, not only via the dev server. In headless sandboxes where a browser
  is unavailable, run the builds and state clearly which checks were not
  performed so the owner can verify them after pulling the PR.