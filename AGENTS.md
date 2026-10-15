# Git policy

Read-only git commands (status, diff, log, show, etc.) are allowed and encouraged
for inspecting the repository.

Do not commit, push, create branches, stash, or otherwise modify git state.
In local sessions, make file edits only and leave the repository in a
dirty working state; the owner handles all state-changing git operations.
Never assume whether changes are committed; check `git status` first.

In remote coding sessions (Vibe Code Web sandboxes), creating a working
branch, committing to it, and opening a pull request is allowed as the
final step of the task. Never push directly to main.


# Development

- Keep the bpmn.io watermark visible (license requirement).
- The Vite app (`src/`) and the standalone pages (`page/`) are parallel
  implementations: a behavior change is only complete once the standalone
  pages reflect it too (directly or via `export-page.js`).
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