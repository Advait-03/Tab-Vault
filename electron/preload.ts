import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  // IPC communication
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  
  // Listen to main process messages
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args))
  },
  
  once: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.once(channel, (event, ...args) => callback(...args))
  },
  
  // App utilities
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  openInFileExplorer: (filePath: string) => ipcRenderer.invoke('open-in-file-explorer', filePath),
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
})

declare global {
  interface Window {
    electron?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>
      send: (channel: string, ...args: any[]) => void
      on: (channel: string, callback: (...args: any[]) => void) => void
      once: (channel: string, callback: (...args: any[]) => void) => void
      getAppPath: () => Promise<string>
      openInFileExplorer: (filePath: string) => Promise<void>
      minimizeToTray: () => void
    }
  }
}
