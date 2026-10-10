import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import { CreateAppendAnythingModule } from 'bpmn-js-create-append-anything';
import colorPickerModule from 'bpmn-js-color-picker';
import 'bpmn-js-color-picker/colors/color-picker.css';
import ehubModdle from './ehub.json';
import { registerOpenLinks } from './links.js';
import { setupLinkPanel } from './link-panel.js';
import { setupZoomControls } from './zoom-controls.js';
import { buildStandalonePage } from './export-page.js';

import diagramXml from '/diagram/sample.bpmn?raw';

const modeler = new BpmnModeler({
  container: '#canvas',
  moddleExtensions: { ehub: ehubModdle },
  additionalModules: [CreateAppendAnythingModule, colorPickerModule],
  keyboard: { bindTo: document }
});

const openButton = document.getElementById('open');
const openInput = document.getElementById('open-file');
const saveButton = document.getElementById('save');
const exportButton = document.getElementById('export');
const statusEl = document.getElementById('status');

async function openDiagram(xml) {
  try {
    await modeler.importXML(xml);
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
    const blob = new Blob([xml], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'diagram.bpmn';
    link.click();
    URL.revokeObjectURL(link.href);
    statusEl.textContent = 'Saved diagram.bpmn (check the ehub:url attributes).';
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
    const root = modeler.get('canvas').getRootElement().businessObject;
    const processName = (root && root.name) || (root && root.id) || 'diagram';
    const safeName = processName.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'diagram';
    const html = buildStandalonePage({ title: `BPMN \u2013 ${processName}`, xml });
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${safeName}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    statusEl.textContent =
      `Exported ${safeName}.html — keep it next to the lib/ folder (like page/bpmnSample.html).`;
  } catch (err) {
    statusEl.textContent = 'Export failed: ' + err.message;
  }
});

registerOpenLinks(modeler.get('eventBus'));
setupLinkPanel(modeler, document.getElementById('link-panel'));
setupZoomControls(modeler.get('canvas'), document.getElementById('canvas'));

openDiagram(diagramXml);
