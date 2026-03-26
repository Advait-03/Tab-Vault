/**
 * Electron IPC utilities for React components
 * Usage: import { useElectron } from '@/lib/electron-ipc'
 */

import { useCallback, useEffect, useState } from 'react'

// Type for Electron window object
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

export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && !!window.electron)
  }, [])

  return {
    isElectron,
    
    // App utilities
    getAppPath: useCallback(async () => {
      if (!window.electron) throw new Error('Not in Electron app')
      return window.electron.getAppPath()
    }, []),

    openInFileExplorer: useCallback(async (filePath: string) => {
      if (!window.electron) throw new Error('Not in Electron app')
      return window.electron.openInFileExplorer(filePath)
    }, []),

    minimizeToTray: useCallback(() => {
      if (!window.electron) throw new Error('Not in Electron app')
      return window.electron.minimizeToTray()
    }, []),

    // IPC communication
    invoke: useCallback((channel: string, ...args: any[]) => {
      if (!window.electron) throw new Error('Not in Electron app')
      return window.electron.invoke(channel, ...args)
    }, []),

    send: useCallback((channel: string, ...args: any[]) => {
      if (!window.electron) throw new Error('Not in Electron app')
      return window.electron.send(channel, ...args)
    }, []),

    on: useCallback((channel: string, callback: (...args: any[]) => void) => {
      if (!window.electron) throw new Error('Not in Electron app')
      return window.electron.on(channel, callback)
    }, []),

    once: useCallback((channel: string, callback: (...args: any[]) => void) => {
      if (!window.electron) throw new Error('Not in Electron app')
      return window.electron.once(channel, callback)
    }, []),
  }
}

// Hook to listen for update availability
export const useUpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const { once } = useElectron()

  useEffect(() => {
    try {
      once('update-available', (info) => {
        setUpdateAvailable(true)
        console.log('Update available:', info)
      })
    } catch (err) {
      // Not in Electron context
    }
  }, [once])

  return updateAvailable
}

// Hook to listen for preferences changes
export const usePreferencesListener = (callback: () => void) => {
  const { on } = useElectron()

  useEffect(() => {
    try {
      on('open-preferences', callback)
    } catch (err) {
      // Not in Electron context
    }
  }, [on, callback])
}

// Example component usage:
/*
import { useElectron } from '@/lib/electron-ipc'

export function ElectronFeatures() {
  const { isElectron, minimizeToTray, openInFileExplorer } = useElectron()

  if (!isElectron) {
    return <p>Not running in Electron</p>
  }

  return (
    <div className="space-y-2">
      <button onClick={minimizeToTray} className="btn btn-primary">
        Minimize to Tray
      </button>
      
      <button 
        onClick={() => openInFileExplorer('/path/to/folder')}
        className="btn btn-secondary"
      >
        Open in File Explorer
      </button>
    </div>
  )
}
*/
