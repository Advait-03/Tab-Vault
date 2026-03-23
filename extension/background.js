// TabVault — extension/background.js
// The always-running brain. Handles ALL browser events.
// Batches events and sends to TabVault app every 30 seconds.

const SERVER = 'http://localhost:3000/api/ingest'
const BATCH_ALARM = 'tabvault-flush'

// ── In-memory state ─────────────────────────────────────
let queue        = []   // events waiting to be sent
let activeTabId  = null // currently focused tab
let focusStart   = null // when current tab got focus
let profile      = 'Default'
let browser      = 'chrome'
let isServerUp   = false
let tabTitles    = {}   // tabId -> {title, url} cache

// ── Detect which browser we're in ───────────────────────
function detectBrowser() {
  const ua = navigator.userAgent
  // Check order: most specific first
  if (ua.includes('Edg/'))   return 'edge'
  if (ua.includes('Firefox'))return 'firefox'
  if (ua.includes('Brave'))  return 'brave'  // must be before Chrome check
  if (ua.includes('OPR/'))   return 'opera'  // Opera has OPR/ in UA
  if (ua.includes('Safari')) return 'safari'
  if (ua.includes('Chrome')) return 'chrome'
  // Fallback to detecting from environment if UA detection fails
  if (typeof browser !== 'undefined' && browser.runtime) {
    if (navigator.vendor === 'Google Inc.') return 'chrome'
    if (navigator.vendor === 'Apple Computer, Inc.') return 'safari'
  }
  console.warn('[TabVault] Could not detect browser, defaulting to chrome')
  return 'chrome'
}

// ── Detect current user profile ─────────────────────────
async function detectProfile() {
  try {
    const info = await chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' })
    if (info?.email) {
      profile = info.email
      return
    }
  } catch (_) {}
  // Fallback: read from storage if we saved it before
  try {
    const stored = await chrome.storage.local.get('tabvault_profile')
    if (stored.tabvault_profile) {
      profile = stored.tabvault_profile
      return
    }
  } catch (_) {}
  profile = 'Default'
}

// ── Add event to queue ───────────────────────────────────
function push(event) {
  const entry = {
    ...event,
    browser,
    profile,
    timestamp: event.timestamp ?? Date.now(),
  }
  queue.push(entry)
  // Persist queue to storage as safety backup
  chrome.storage.local.set({ tabvault_queue: queue }).catch(() => {})
}

// ── Flush queue to TabVault server ──────────────────────
async function flush() {
  if (queue.length === 0) return

  const batch = [...queue]
  queue = []
  chrome.storage.local.set({ tabvault_queue: [] }).catch(() => {})

  try {
    const res = await fetch(SERVER, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ events: batch }),
    })
    if (res.ok) {
      isServerUp = true
      const data = await res.json()
      console.log(`[TabVault] Sent ${batch.length} events → server OK`)
    } else {
      throw new Error(`Server ${res.status}`)
    }
  } catch (err) {
    // Server not running — put events back
    isServerUp = false
    queue = [...batch, ...queue]
    chrome.storage.local.set({ tabvault_queue: queue }).catch(() => {})
    console.warn('[TabVault] Server unreachable — queued for retry', err.message)
  }
}

// ── Save time spent on current active tab ───────────────
function saveCurrentTabTime() {
  if (!activeTabId || !focusStart) return
  const timeSpent = Date.now() - focusStart
  if (timeSpent < 1000) return // ignore < 1 second
  push({
    type:      'tab_focused',
    tabId:     activeTabId,
    title:     tabTitles[activeTabId]?.title  ?? '',
    url:       tabTitles[activeTabId]?.url    ?? '',
    timeSpent, // ms
  })
  focusStart = null
}

// ══════════════════════════════════════════════════════
// TAB EVENTS
// ══════════════════════════════════════════════════════

// New tab opened
chrome.tabs.onCreated.addListener((tab) => {
  if (!tab.url || tab.url === 'chrome://newtab/' || tab.url.startsWith('chrome://')) return
  tabTitles[tab.id] = { title: tab.title ?? '', url: tab.url ?? '' }
  push({
    type:  'tab_opened',
    tabId: tab.id,
    title: tab.title ?? '',
    url:   tab.url ?? '',
  })
})

// Tab URL or title changed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return
  if (!tab.url || tab.url.startsWith('chrome://')) return

  tabTitles[tabId] = { title: tab.title ?? '', url: tab.url ?? '' }
  push({
    type:  'tab_updated',
    tabId,
    title: tab.title ?? '',
    url:   tab.url ?? '',
  })
})

// Tab closed
chrome.tabs.onRemoved.addListener((tabId) => {
  // If this was the active tab, save time first
  if (tabId === activeTabId) {
    saveCurrentTabTime()
    activeTabId = null
  }
  push({
    type:      'tab_closed',
    tabId,
    title:     tabTitles[tabId]?.title ?? '',
    url:       tabTitles[tabId]?.url   ?? '',
    timeSpent: 0,
  })
  delete tabTitles[tabId]
})

// User switches to a different tab
chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  // Save time on the tab we're leaving
  saveCurrentTabTime()

  // Start tracking the new tab
  activeTabId = tabId
  focusStart  = Date.now()

  // Get tab details
  try {
    const tab = await chrome.tabs.get(tabId)
    if (tab.url && !tab.url.startsWith('chrome://')) {
      tabTitles[tabId] = { title: tab.title ?? '', url: tab.url ?? '' }
      // Only send tab_opened if this is a new tab, otherwise just track focus
      // Don't create duplicate records by sending tab_opened for existing tabs
      // The focus time will be recorded when user switches away in saveCurrentTabTime()
    }
  } catch (_) {}
})

// ══════════════════════════════════════════════════════
// WINDOW EVENTS (track when user leaves/returns to browser)
// ══════════════════════════════════════════════════════

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // User switched away from browser — pause timer
    saveCurrentTabTime()
    focusStart = null
  } else {
    // User came back to browser — resume timer
    if (activeTabId) {
      focusStart = Date.now()
    }
  }
})

// ══════════════════════════════════════════════════════
// HISTORY EVENTS
// ══════════════════════════════════════════════════════

chrome.history.onVisited.addListener((result) => {
  if (!result.url) return
  if (result.url.startsWith('chrome://')) return
  if (result.url.startsWith('chrome-extension://')) return
  if (result.url === 'about:blank') return

  push({
    type:     'history_visit',
    tabId:    0,
    title:    result.title ?? '',
    url:      result.url,
    duration: 0, // content.js sends actual duration via message
  })
})

// ══════════════════════════════════════════════════════
// MESSAGES FROM content.js
// ══════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'page_time' && sender.tab?.id) {
    // content.js reported how long user spent on a page
    push({
      type:      'history_visit',
      tabId:     sender.tab.id,
      title:     msg.title   ?? '',
      url:       msg.url     ?? '',
      duration:  msg.duration ?? 0, // seconds
      timestamp: msg.timestamp,
    })
  }

  if (msg.type === 'get_status') {
    // popup.js asking for current status
    return Promise.resolve({
      profile,
      browser,
      isServerUp,
      queueSize:  queue.length,
      activeTabId,
    })
  }
})

// ══════════════════════════════════════════════════════
// ALARM — flush every 30 seconds
// ══════════════════════════════════════════════════════

chrome.alarms.create(BATCH_ALARM, { periodInMinutes: 0.5 })
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === BATCH_ALARM) flush()
})

// ══════════════════════════════════════════════════════
// STARTUP — restore any unsent events
// ══════════════════════════════════════════════════════

async function init() {
  browser = detectBrowser()
  await detectProfile()

  // Restore unsent events from previous session
  try {
    const stored = await chrome.storage.local.get('tabvault_queue')
    if (stored.tabvault_queue?.length) {
      queue = stored.tabvault_queue
      console.log(`[TabVault] Restored ${queue.length} unsent events from storage`)
    }
  } catch (_) {}

  // Snapshot all currently open tabs on startup
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true })
    for (const tab of tabs) {
      if (!tab.url || tab.url.startsWith('chrome://')) continue
      tabTitles[tab.id] = { title: tab.title ?? '', url: tab.url ?? '' }
      push({
        type:  'tab_opened',
        tabId: tab.id,
        title: tab.title ?? '',
        url:   tab.url ?? '',
      })
    }
  } catch (_) {}

  console.log(`[TabVault] Started — browser: ${browser}, profile: ${profile}, queued: ${queue.length}`)
  // Flush immediately on start
  await flush()
}

init()
