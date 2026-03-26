const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Always on top
  toggleAlwaysOnTop: () => ipcRenderer.send('toggle-always-on-top'),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),
  onAlwaysOnTopChanged: (callback) => {
    ipcRenderer.on('always-on-top-changed', (event, value) => callback(value));
  },

  // Window actions
  exitApp: () => ipcRenderer.send('exit-app'),
  setWindowPosition: (x, y) => ipcRenderer.send('set-window-position', { x, y }),
});
