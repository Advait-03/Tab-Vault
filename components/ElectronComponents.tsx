'use client'

import { useElectron, useUpdateNotification } from '@/lib/electron-ipc'
import { AlertCircle, Home, Settings } from 'lucide-react'

/**
 * ElectronTrayComponent
 * 
 * Demonstrates Electron-specific features:
 * - Minimize to system tray
 * - Open file explorer
 * - Listen for update notifications
 * 
 * This component is only visible when running in Electron.
 * In web mode, it gracefully hides itself.
 */
export function ElectronTrayComponent() {
  const { isElectron, minimizeToTray } = useElectron()
  const updateAvailable = useUpdateNotification()

  if (!isElectron) {
    return null // Hide in web mode
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-2">
      {/* Update Notification */}
      {updateAvailable && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Update Available</p>
            <p className="text-blue-700 text-xs">Restart the app to install</p>
          </div>
        </div>
      )}

      {/* Minimize to Tray Button */}
      <button
        onClick={minimizeToTray}
        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        title="Minimize to system tray"
      >
        <Home className="w-4 h-4" />
        Hide to Tray
      </button>
    </div>
  )
}

/**
 * ElectronStatusBadge
 * 
 * Simple indicator showing whether the app is running in Electron
 */
export function ElectronStatusBadge() {
  const { isElectron } = useElectron()

  return (
    <div className="inline-block">
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          isElectron
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {isElectron ? '🖥️ Desktop' : '🌐 Web'}
      </span>
    </div>
  )
}
