const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  focusTerminal: () => ipcRenderer.send('focus-terminal'),
  hideBubble: () => ipcRenderer.send('hide-bubble'),
});
