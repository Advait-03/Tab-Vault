// TabVault — extension/popup.js

const BROWSER_COLORS = {
  chrome:  { color: '#F4845F', icon: '🔴' },
  edge:    { color: '#3BA0E9', icon: '🔵' },
  firefox: { color: '#FF9500', icon: '🟠' },
  brave:   { color: '#A78BFA', icon: '🦁' },
  safari:  { color: '#34C759', icon: '🧭' },
}

function fmt(seconds) {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${m}m`
  return `${m}m`
}

async function loadPopup() {
  // ── Get background page status ───────────────────────
  let bgStatus = {}
  try {
    bgStatus = await chrome.runtime.sendMessage({ type: 'get_status' })
  } catch (_) {}

  // ── Profile ──────────────────────────────────────────
  let profileEmail = bgStatus.profile ?? 'Default'
  try {
    const info = await chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' })
    if (info?.email) profileEmail = info.email
  } catch (_) {}

  const initial = profileEmail.charAt(0).toUpperCase()
  document.getElementById('profile-avatar').textContent = initial
  document.getElementById('profile-name').textContent   = profileEmail
  document.getElementById('browser-name').textContent   =
    `${bgStatus.browser ?? 'chrome'} browser`

  // ── Open tabs ────────────────────────────────────────
  try {
    const tabs = await chrome.tabs.query({})
    document.getElementById('tab-count').textContent = tabs.length
  } catch (_) {
    document.getElementById('tab-count').textContent = '?'
  }

  // ── Queue size ───────────────────────────────────────
  const queueSize = bgStatus.queueSize ?? 0
  document.getElementById('queue-count').textContent = queueSize
  if (queueSize > 50) {
    const warn = document.getElementById('queue-warn')
    document.getElementById('queue-warn-text').textContent = queueSize
    warn.style.display = 'block'
  }

  // ── Check server + fetch stats ───────────────────────
  try {
    const [pingRes, statsRes] = await Promise.all([
      fetch('http://localhost:3000/api/ingest'),
      fetch('http://localhost:3000/api/stats?days=1'),
    ])

    if (pingRes.ok) {
      // Server is running
      const status = document.getElementById('status')
      status.className = 'status online'
      document.getElementById('status-text').textContent = 'TabVault is running'

      if (statsRes.ok) {
        const stats = await statsRes.json()
        // Usage time
        document.getElementById('usage-time').textContent =
          fmt(stats.totalTime ?? 0)
        // Visit count
        document.getElementById('visit-count').textContent =
          stats.totalVisits ?? 0
        // Browser pills
        if (stats.browsers?.length) {
          const list = document.getElementById('browsers-list')
          list.innerHTML = stats.browsers.map((b) => {
            const bc = BROWSER_COLORS[b.browser] ?? { color: '#8B86AE', icon: '🌐' }
            return `
              <div class="b-pill" style="color:${bc.color};border-color:${bc.color}33;background:${bc.color}15">
                ${bc.icon} ${b.browser}
              </div>
            `
          }).join('')
        }
      }
    }
  } catch (_) {
    // Server not running
    const status = document.getElementById('status')
    status.className = 'status offline'
    document.getElementById('status-text').textContent =
      '⚠️ Run: npm run dev in TabVault folder'
    document.getElementById('usage-time').textContent  = 'N/A'
    document.getElementById('visit-count').textContent = 'N/A'
  }

  // ── Button: Open dashboard ───────────────────────────
  document.getElementById('btn-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' })
    window.close()
  })

  // ── Button: Force sync ───────────────────────────────
  document.getElementById('btn-sync').addEventListener('click', async () => {
    const btn = document.getElementById('btn-sync')
    btn.textContent = 'Syncing…'
    btn.disabled    = true
    try {
      // Ask background to flush immediately
      await chrome.runtime.sendMessage({ type: 'force_flush' })
      btn.textContent = '✓ Synced!'
      setTimeout(() => { btn.textContent = 'Sync Now'; btn.disabled = false }, 2000)
    } catch (_) {
      btn.textContent = 'Retry'
      btn.disabled    = false
    }
  })
}

loadPopup()
