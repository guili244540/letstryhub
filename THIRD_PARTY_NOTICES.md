# Third-party notices

This repository includes software developed by third parties. The MIT license
at the root of this repository applies only to the original code and does not
cover the components below.

## bpmn-js (vendored in `page/lib/`)

- Homepage: https://github.com/bpmn-io/bpmn-js
- Copyright (c) 2014-present Camunda Services GmbH
- License: bpmn.io license — MIT-style terms plus the following condition:
  the "bpmn.io" watermark displayed as part of rendered diagrams (bottom-right
  of the canvas) must not be removed, changed, or visually obscured.
- Full text: `page/lib/LICENSE-bpmn-js`

## diagram-js (CSS vendored in `page/lib/`; bundled from npm in the Vite build)

- Homepage: https://github.com/bpmn-io/diagram-js
- Copyright (c) 2014-present Camunda Services GmbH
- License: MIT — `page/lib/LICENSE-diagram-js`

## bpmn-font (vendored in `page/lib/bpmn-embedded.css`)

- Homepage: https://github.com/bpmn-io/bpmn-font
- License: MIT (font embedded as base64 data URIs inside the CSS file)

## bpmn-js-create-append-anything (bundled into `page/lib/bpmn-js-extras.js`)

- Homepage: https://github.com/bpmn-io/bpmn-js-create-append-anything
- Adds the "..." create/append menu to the palette and context pad
- License: MIT — see the package LICENSE for details

## bpmn-js-color-picker (bundled into `page/lib/bpmn-js-extras.js`)

- Homepage: https://github.com/bpmn-io/bpmn-js-color-picker
- Adds the color picker (brush icon) to the context pad
- License: MIT — see the package LICENSE for details

## npm dependencies (`node_modules/`, not distributed)

bpmn-js, diagram-js and bpmn-moddle are installed via npm for the Vite build.
Their licenses are the same as listed above and apply to the built output in
`dist/` accordingly.
