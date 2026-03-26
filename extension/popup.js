const BROWSER_META = {
  chrome: { color: '#ea4335', label: 'Chrome' },
  edge: { color: '#1a73e8', label: 'Edge' },
  firefox: { color: '#ff8c00', label: 'Firefox' },
  brave: { color: '#fb542b', label: 'Brave' },
  opera: { color: '#d93025', label: 'Opera' },
}

function formatMinutes(seconds) {
  if (!seconds) return '0m'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function setStatus(isOnline, text) {
  const status = document.getElementById('status')
  status.className = `status ${isOnline ? 'online' : 'offline'}`
  document.getElementById('status-text').textContent = text
}

async function getBackgroundStatus() {
  try {
    return await chrome.runtime.sendMessage({ type: 'get_status' })
  } catch {
    return {
      browser: 'brave',
      profile: 'Default',
      isServerUp: false,
      queueSize: 0,
      openTabCount: 0,
    }
  }
}

async function loadPopup() {
  const background = await getBackgroundStatus()
  document.getElementById('browser-select').value = background.browser || 'brave'

  const profile = background.profile || 'Default'
  document.getElementById('profile-avatar').textContent = profile.charAt(0).toUpperCase()
  document.getElementById('profile-name').textContent = profile
  document.getElementById('profile-input').value = profile
  document.getElementById('browser-name').textContent = `${BROWSER_META[background.browser]?.label || background.browser} extension`
  document.getElementById('tab-count').textContent = String(background.openTabCount ?? 0)
  document.getElementById('queue-count').textContent = String(background.queueSize ?? 0)

  try {
    const [statsRes, setupRes] = await Promise.all([
      fetch('http://localhost:3000/api/stats?days=1'),
      fetch('http://localhost:3000/api/setup'),
    ])

    if (!statsRes.ok || !setupRes.ok) {
      throw new Error('Local app not reachable')
    }

    const stats = await statsRes.json()
    const setup = await setupRes.json()

    setStatus(true, 'Connected to local TabVault app')
    document.getElementById('usage-time').textContent = formatMinutes(stats.today?.totalTime ?? 0)
    document.getElementById('visit-count').textContent = String(stats.today?.visits ?? 0)

    const list = document.getElementById('browsers-list')
    const tracked = setup.trackedBrowsers ?? []
    if (!tracked.length) {
      list.innerHTML = '<div class="pill">No tracked browser connected yet</div>'
    } else {
      list.innerHTML = tracked
        .map((browser) => {
          const meta = BROWSER_META[browser.browserId] || { color: '#5f6f85', label: browser.name }
          return `<div class="pill" style="border-color:${meta.color}22;color:${meta.color};">${meta.label}</div>`
        })
        .join('')
    }
  } catch {
    setStatus(false, 'Start the TabVault desktop app on localhost:3000')
    document.getElementById('usage-time').textContent = 'N/A'
    document.getElementById('visit-count').textContent = 'N/A'
    document.getElementById('browsers-list').innerHTML = '<div class="pill">Desktop app offline</div>'
  }
}

document.getElementById('btn-dashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000' })
  window.close()
})

document.getElementById('btn-sync').addEventListener('click', async () => {
  const button = document.getElementById('btn-sync')
  button.textContent = 'Syncing...'
  button.disabled = true
  try {
    await chrome.runtime.sendMessage({ type: 'force_flush' })
    button.textContent = 'Synced'
    setTimeout(() => {
      button.textContent = 'Sync now'
      button.disabled = false
      loadPopup()
    }, 800)
  } catch {
    button.textContent = 'Retry'
    button.disabled = false
  }
})

document.getElementById('btn-apply-browser').addEventListener('click', async () => {
  const button = document.getElementById('btn-apply-browser')
  const browser = document.getElementById('browser-select').value
  button.textContent = 'Saving...'
  button.disabled = true
  try {
    await chrome.runtime.sendMessage({ type: 'set_browser_override', browser })
    button.textContent = 'Saved'
    setTimeout(() => {
      button.textContent = 'Save browser choice'
      button.disabled = false
      loadPopup()
    }, 800)
  } catch {
    button.textContent = 'Retry'
    button.disabled = false
  }
})

document.getElementById('btn-save-profile').addEventListener('click', async () => {
  const button = document.getElementById('btn-save-profile')
  const profile = document.getElementById('profile-input').value
  button.textContent = 'Saving...'
  button.disabled = true
  try {
    await chrome.runtime.sendMessage({ type: 'set_profile_name', profile })
    button.textContent = 'Saved'
    setTimeout(() => {
      button.textContent = 'Save profile name'
      button.disabled = false
      loadPopup()
    }, 800)
  } catch {
    button.textContent = 'Retry'
    button.disabled = false
  }
})

loadPopup()
