const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, shell } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = !app.isPackaged

let mainWindow = null
let tray = null

function getAssetPath(...parts) {
  return path.join(app.getAppPath(), ...parts)
}

function maybeCreateImage(...parts) {
  const assetPath = getAssetPath(...parts)
  if (!fs.existsSync(assetPath)) {
    return undefined
  }

  const image = nativeImage.createFromPath(assetPath)
  return image.isEmpty() ? undefined : image
}

function createWindow() {
  const windowOptions = {
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  }

  const appIcon = maybeCreateImage('public', 'logo.png')
  if (appIcon) {
    windowOptions.icon = appIcon
  }

  mainWindow = new BrowserWindow(windowOptions)

  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000'
  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  createTray()
}

function createTray() {
  if (tray) {
    return
  }

  const trayIcon = maybeCreateImage('public', 'icon.png') || maybeCreateImage('public', 'logo.png')
  if (!trayIcon) {
    return
  }

  tray = new Tray(trayIcon)

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
      click: () => app.quit(),
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip('TabVault')
  tray.on('click', () => {
    if (!mainWindow) {
      return
    }

    if (mainWindow.isVisible()) {
      mainWindow.hide()
      return
    }

    mainWindow.show()
    mainWindow.focus()
  })
}

ipcMain.on('minimize-to-tray', () => {
  if (mainWindow) {
    mainWindow.hide()
  }
})

ipcMain.handle('get-app-path', () => app.getPath('appData'))

ipcMain.handle('open-in-file-explorer', async (_event, filePath) => {
  shell.showItemInFolder(filePath)
})

app.whenReady().then(createWindow)

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
