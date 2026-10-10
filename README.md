# BPMN editor and viewer with external links

A self-contained toolkit built on [bpmn-js](https://bpmn.io/toolkit/bpmn-js/) that lets you:

- **edit** existing BPMN 2.0 diagrams in the browser,
- **attach an external link to any BPMN element** so that clicking it opens a web page,
- **export any diagram as a standalone viewer page** that works fully offline,
- **display diagrams read-only** in a web page, with links and zoom controls.

Everything runs without a server: the pages under `page/` are plain HTML files
that can be opened directly from the file manager and shared as a folder.

## What is different from the bpmn.io website

The reference point for this project is [demo.bpmn.io](https://demo.bpmn.io),
the official bpmn-js demo. This project matches its editing experience
(modeling palette, context pad with replace / color picker / append menu,
alignment tools) and adds features that the demo does not have:

| Feature | Description |
|---|---|
| **External links on elements** | Any BPMN element can carry a URL, stored as a custom `ehub:url` attribute **inside the `.bpmn` file itself** (a proper BPMN extension, not a side database). In viewers, clicking the element opens the page in a new tab; linked elements show a pointer cursor. |
| **Link editing panel** | Select an element in the editor and set or clear its URL in the side panel. Changes are undoable (Ctrl+Z) and saved into the BPMN XML. |
| **Export as standalone page** | One click produces a single HTML file — a read-only viewer page with the diagram embedded, links active, zoom controls included — that works offline next to the `lib/` folder. bpmn.io has no export of this kind. |
| **Fully offline distribution** | The bpmn-js library and its styles are vendored into `page/lib/` (pinned to one version). No CDN, no server, no Node required to use the pages. The demo website always requires hosting. |
| **Open / Save BPMN buttons** | Load any `.bpmn` from disk and save the edited result, with the link extension and colors preserved. |

Features that match demo.bpmn.io (rather than extend it) and are therefore
wired in as well: the color picker (brush) and the "..." create/append menu,
both via the official `bpmn-js-color-picker` and `bpmn-js-create-append-anything`
modules, plus the zoom control strip.

## Repository layout

```
├── page/                    # Standalone pages, usable from file://
│   ├── bpmnEditor.html      # Editor: palette, context pad, link panel,
│   │                        #   open/save BPMN, export page, zoom controls
│   ├── bpmnSample.html      # Read-only viewer with links + zoom controls
│   └── lib/                 # Vendored bpmn-js 18.31.0 + extension bundle
│       ├── bpmn-modeler.development.js
│       ├── bpmn-navigated-viewer.development.js
│       ├── bpmn-js-extras.js # color picker + create/append menu (IIFE)
│       ├── *.css             # diagram-js, bpmn-js, bpmn-font, color picker
│       └── LICENSE-*         # upstream license texts
├── diagram/sample.bpmn      # Sample diagram (placeholders, one demo link)
├── index.html               # Vite app: same editor, served by npm run dev
├── viewer.html              # Vite app: read-only viewer
├── src/                     # App sources (Vite)
│   ├── modeler.js / viewer.js
│   ├── links.js             # link read/write + click-to-open handler
│   ├── link-panel.js        # URL editing panel
│   ├── zoom-controls.js     # zoom strip component
│   ├── export-page.js       # standalone-page generator (Vite editor)
│   ├── standalone-extras.js # source of the vendored lib/bpmn-js-extras.js
│   └── ehub.json            # BPMN extension descriptor
└── vite.config.js / vite.config.extras.js
```

## Using the standalone pages (no installation)

1. Copy or download the `page/` folder **including** `page/lib/`.
2. Open `page/bpmnEditor.html` by double-clicking it.

From there:

- **Open BPMN** loads any `.bpmn` or `.xml` file from disk.
- Select an element and use the **External link** panel to attach a URL.
  In the editor, open a link with **Ctrl/Cmd+click** (plain click keeps
  normal editing behavior).
- **Save BPMN** downloads the edited diagram; `ehub:url` attributes and
  element colors are preserved in the XML.
- **Export page** generates a standalone viewer page for the current
  diagram (see below).
- Modeling works as on demo.bpmn.io: palette on the left, context pad
  around selected elements (wrench = replace, brush = color, "..." =
  append menu), mouse wheel to zoom, space or right-drag to pan.

The exported page (`<Process name>.html`) is a read-only viewer: embedded
diagram, click on an element to open its link, zoom strip bottom-right.
Place it in any folder that contains the `lib/` folder — for example next
to `bpmnSample.html` — and it works offline anywhere.

To share with someone: send the whole folder (`lib/` + the pages), or zip it.

## Using the Vite app (development mode)

```bash
npm install
npm run dev          # http://localhost:5173/ (editor) and /viewer.html
npm run build        # production build into dist/
npm run build:extras # regenerate page/lib/bpmn-js-extras.js after updates
```

The Vite app is functionally equivalent to the standalone pages. Use it
when you want to develop features; use the standalone pages for daily
work and distribution.

## How the links work

The link feature is a custom BPMN extension defined in `src/ehub.json`
(and inline in the standalone pages):

```json
{
  "name": "Ehub",
  "prefix": "ehub",
  "uri": "https://letstryhub.example/bpmn/ehub",
  "types": [
    {
      "name": "Linked",
      "extends": [ "bpmn:BaseElement" ],
      "properties": [ { "name": "url", "isAttr": true, "type": "String" } ]
    }
  ]
}
```

It declares an `ehub:url` attribute valid on **any** BPMN element. In the
XML it looks like:

```xml
<bpmn:task id="Task_1" name="Review request"
           ehub:url="https://en.wikipedia.org/wiki/Business_process_model">
```

Design properties worth knowing:

- The link is part of the **standard `.bpmn` file**, so it survives save,
  round-trips through any BPMN tool that tolerates unknown extensions, and
  works in every page built by this project.
- The **editor** registers the extension via `moddleExtensions` and writes
  the attribute with `modeling.updateProperties()` (undoable).
- A **viewer does not need the extension**: unknown namespaced attributes
  remain accessible as `element.businessObject.$attrs['ehub:url']`.
- Colors set with the brush are stored according to the
  [BPMN in Color](https://github.com/bpmn-io/bpmn-js/blob/main/docs/PROJECT.md)
  attributes in BPMN DI, so they are interoperable as well.

## License

This project's own code is licensed under the **MIT License** (see
[LICENSE](LICENSE)). Third-party components — bpmn-js, diagram-js,
bpmn-font, bpmn-js-color-picker, bpmn-js-create-append-anything — are
covered by their own licenses, summarized in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) with the full texts under
`page/lib/`.

Note that the bpmn-js license requires the **"bpmn.io" watermark** shown
on rendered diagrams to remain visible and unobscured. Keep it intact.

## Requirements

- Standalone pages: any modern browser (Chrome, Firefox, Edge, Safari).
  No server, no internet access needed.
- Vite app: Node.js 18+ and npm.
