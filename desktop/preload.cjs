const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('abzaroDesktop', Object.freeze({
  convertDocx: (bytes, name) => ipcRenderer.invoke('convert-docx', bytes, name),
}));
