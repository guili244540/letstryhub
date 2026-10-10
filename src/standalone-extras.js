// Extensions for the standalone editor page (page/bpmnEditor.html).
//
// Both packages are npm ES modules, which cannot be loaded by a plain
// <script> tag on a file:// page. This entry bundles them once into an
// IIFE exposing window.BpmnJsExtras, vendored into page/lib/.
//
// Rebuild with: npm run build:extras
import { CreateAppendAnythingModule } from 'bpmn-js-create-append-anything';
import colorPickerModule from 'bpmn-js-color-picker';

export { CreateAppendAnythingModule, colorPickerModule };
