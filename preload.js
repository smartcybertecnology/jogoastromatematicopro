// Dentro do preload.js
const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openNewWindow: (url) => ipcRenderer.invoke('open-new-window', url)
});