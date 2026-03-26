import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'path'
import os from 'os'

const isDev = process.env.NODE_ENV === 'development'

// Keep window references globally to prevent GC
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

// Auto-update configuration
autoUpdater.checkForUpdatesAndNotify()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/logo.png'),
  })

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../.next/standalone/.next/out/index.html')}`

  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Create tray icon
  createTray()
}

function createTray() {
  const iconPath = path.join(__dirname, '../public/icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show TabVault',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Preferences',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('open-preferences')
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit TabVault',
      click: () => {
        app.quit()
      },
    },
  ])
  
  tray.setContextMenu(contextMenu)
  
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    }
  })
}

// Handle window minimize to tray
ipcMain.on('minimize-to-tray', () => {
  if (mainWindow) {
    mainWindow.hide()
  }
})

// Handle database sync to app data directory
ipcMain.handle('get-app-path', () => {
  return app.getPath('appData')
})

// Handle file operations
ipcMain.handle('open-in-file-explorer', async (event, filePath) => {
  const { shell } = require('electron')
  shell.showItemInFolder(filePath)
})

// App event handlers
app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// Auto-update events
autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info)
  }
})

export { mainWindow }
