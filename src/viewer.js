import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import ehubModdle from './ehub.json';
import { registerOpenLinks, isUrlElement } from './links.js';
import { setupCommentPopup } from './comments.js';
import { setupZoomControls } from './zoom-controls.js';

import diagramXml from '/diagram/sample.bpmn?raw';

const viewer = new NavigatedViewer({
  container: '#canvas',
  moddleExtensions: { ehub: ehubModdle }
});

registerOpenLinks(viewer.get('eventBus'), { ctrlRequired: false });
setupCommentPopup(viewer.get('eventBus'));
setupZoomControls(viewer.get('canvas'), document.getElementById('canvas'));

async function openDiagram(xml) {
  const statusEl = document.getElementById('status');
  try {
    await viewer.importXML(xml);

    const elementRegistry = viewer.get('elementRegistry');
    const canvas = viewer.get('canvas');
    for (const element of elementRegistry.getAll()) {
      if (isUrlElement(element)) {
        canvas.addMarker(element, 'has-link');
      }
    }

    statusEl.textContent = 'Click a highlighted element to open its page.';
  } catch (err) {
    statusEl.textContent = 'Failed to load diagram: ' + err.message;
    console.error(err);
  }
}

openDiagram(diagramXml);
