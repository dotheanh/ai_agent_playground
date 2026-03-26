const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Always on top
  toggleAlwaysOnTop: () => ipcRenderer.send('toggle-always-on-top'),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),
  onAlwaysOnTopChanged: (callback) => {
    ipcRenderer.on('always-on-top-changed', (event, value) => callback(value));
  },

  // Window actions
  startMove: () => ipcRenderer.send('start-move'),
  exitApp: () => ipcRenderer.send('exit-app'),

  // Drag trigger from menu
  onTriggerDrag: (callback) => {
    ipcRenderer.on('trigger-drag', callback);
  },
});
