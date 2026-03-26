const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  once: (channel, callback) => {
    ipcRenderer.once(channel, (_event, ...args) => callback(...args))
  },
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  openInFileExplorer: (filePath) => ipcRenderer.invoke('open-in-file-explorer', filePath),
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
})
