const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Context menu
  showContextMenu: () => ipcRenderer.send('show-context-menu'),

  // Always on top
  toggleAlwaysOnTop: () => ipcRenderer.send('toggle-always-on-top'),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),
  onAlwaysOnTopChanged: (callback) => {
    ipcRenderer.on('always-on-top-changed', (event, value) => callback(value));
  },

  // Window visibility
  showWindow: () => ipcRenderer.send('show-window'),
  hideWindow: () => ipcRenderer.send('hide-window'),

  // Drag detection
  onDragStart: (callback) => {
    ipcRenderer.on('drag-start', callback);
  },
});
