const { contextBridge } = require('electron');

// Expose a minimal API surface to the renderer. For the PoC we'll keep this small.
contextBridge.exposeInMainWorld('electronAPI', {
  // placeholder for future ipc methods
});
