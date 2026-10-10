import { defineConfig } from 'vite';

// Builds src/standalone-extras.js into an IIFE bundle (window.BpmnJsExtras)
// placed in page/lib/, so the file://-based standalone pages can use the
// bpmn-js extensions without a server or a bundler.
export default defineConfig({
  build: {
    outDir: 'page/lib',
    emptyOutDir: false,
    lib: {
      entry: 'src/standalone-extras.js',
      formats: ['iife'],
      name: 'BpmnJsExtras',
      fileName: () => 'bpmn-js-extras.js'
    }
  }
});
