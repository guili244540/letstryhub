import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import { CreateAppendAnythingModule } from 'bpmn-js-create-append-anything';
import colorPickerModule from 'bpmn-js-color-picker';
import 'bpmn-js-color-picker/colors/color-picker.css';
import ehubModdle from './ehub.json';
import './page-style.js';
import { registerOpenLinks, updateContentMarkers, buildPopupText } from './links.js';
import { setupCommentPopup } from './comments.js';
import { setupPropertiesPanel } from './properties-panel.js';
import { setupZoomControls } from './zoom-controls.js';
import { buildStandalonePage } from './export-page.js';

import diagramXml from '/diagram/sample.bpmn?raw';

const modeler = new BpmnModeler({
  container: '#canvas',
  moddleExtensions: { ehub: ehubModdle },
  additionalModules: [CreateAppendAnythingModule, colorPickerModule],
  keyboard: { bindTo: document }
});

const canvas = modeler.get('canvas');

// Keep the has-link / has-comment markers in sync whenever an element is
// created, changed (e.g. link/comment edited in the properties panel) or
// re-rendered.
modeler.get('eventBus').on('element.changed', (event) => {
  updateContentMarkers(canvas, event.element);
});

const openButton = document.getElementById('open');
const openInput = document.getElementById('open-file');
const saveButton = document.getElementById('save');
const exportButton = document.getElementById('export');
const statusEl = document.getElementById('status');

async function openDiagram(xml) {
  try {
    await modeler.importXML(xml);
    for (const element of modeler.get('elementRegistry').getAll()) {
      updateContentMarkers(canvas, element);
    }
    statusEl.textContent = 'Diagram loaded.';
  } catch (err) {
    statusEl.textContent = 'Failed to load diagram: ' + err.message;
    console.error(err);
  }
}

openButton.addEventListener('click', () => openInput.click());

openInput.addEventListener('change', () => {
  const file = openInput.files[0];
  if (!file) return;
  file.text().then(openDiagram);
  openInput.value = '';
});

saveButton.addEventListener('click', async () => {
  try {
    const { xml } = await modeler.saveXML({ format: true });
    const now = new Date();
    const ts = [
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ].join('');
    const fileName = `BpmnSource${ts}`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.bpmn`;
    link.click();
    URL.revokeObjectURL(link.href);
    statusEl.textContent = `Saved ${fileName}.bpmn (check the ehub:url attributes).`;
  } catch (err) {
    statusEl.textContent = 'Failed to save: ' + err.message;
  }
});

document.getElementById('export').addEventListener('click', async () => {
  try {
    const { xml } = await modeler.saveXML({ format: true });
    if (xml.includes('</script')) {
      throw new Error('diagram XML cannot be embedded in a page');
    }
    const now = new Date();
    const ts = [
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ].join('');
    const fileName = `BpmnViewer${ts}`;
    const html = buildStandalonePage({ title: `BPMN \u2013 ${fileName}`, xml });
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    statusEl.textContent =
      `Exported ${fileName}.html — fully standalone, no lib/ folder needed.`;
  } catch (err) {
    statusEl.textContent = 'Export failed: ' + err.message;
  }
});

// Show/hide the side properties panel (external link today, more fields later).
const panelToggle = document.getElementById('toggle-panel');

panelToggle.addEventListener('click', () => {
  const panel = document.getElementById('properties-panel');
  const show = panel.style.display === 'none';
  panel.style.display = show ? '' : 'none';
  panelToggle.classList.toggle('active', show);
  panelToggle.setAttribute('aria-pressed', String(show));
});

// The panel module owns only the panel; the hover popup is wired here with
// the links.js text builder (the standalone editor passes its own).
registerOpenLinks(modeler.get('eventBus'));
setupPropertiesPanel(modeler, document.getElementById('properties-panel'));
setupCommentPopup(modeler.get('eventBus'), buildPopupText);
setupZoomControls(modeler.get('canvas'), document.getElementById('canvas'));

openDiagram(diagramXml);
