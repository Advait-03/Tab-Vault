const SERVER = 'http://localhost:3000/api/ingest'
const BATCH_ALARM = 'tabvault-flush'
const SNAPSHOT_ALARM = 'tabvault-snapshot'

let queue = []
let activeTabId = null
let focusStart = null
let profile = 'Default'
let browser = 'brave'
let isServerUp = false
let tabTitles = {}

async function detectBrowser() {
  try {
    if (navigator.userAgentData?.brands?.length) {
      const brands = navigator.userAgentData.brands.map((entry) => entry.brand.toLowerCase())
      if (brands.some((brand) => brand.includes('brave'))) return 'brave'
      if (brands.some((brand) => brand.includes('edge'))) return 'edge'
      if (brands.some((brand) => brand.includes('opera'))) return 'opera'
      if (brands.some((brand) => brand.includes('firefox'))) return 'firefox'
      if (brands.some((brand) => brand.includes('chrome'))) return 'chrome'
    }
  } catch {}

  try {
    if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
      const brave = await navigator.brave.isBrave()
      if (brave) return 'brave'
    }
  } catch {}

  const userAgent = navigator.userAgent
  if (userAgent.includes('Edg/')) return 'edge'
  if (userAgent.includes('OPR/')) return 'opera'
  if (userAgent.includes('Firefox')) return 'firefox'
  if (userAgent.includes('Brave')) return 'brave'
  if (userAgent.includes('Chrome')) return 'chrome'

  return 'brave'
}

function isTrackableUrl(url = '') {
  if (!url) return false
  return !(
    url.startsWith('chrome://') ||
    url.startsWith('brave://') ||
    url.startsWith('edge://') ||
    url.startsWith('opera://') ||
    url.startsWith('about:') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('devtools://')
  )
}

function normalizeTab(tab) {
  return {
    title: tab.title ?? '',
    url: tab.url ?? '',
  }
}

async function persistQueue() {
  try {
    await chrome.storage.local.set({ tabvault_queue: queue })
  } catch {}
}

async function loadConfig() {
  const stored = await chrome.storage.local.get([
    'tabvault_profile',
    'tabvault_profile_name',
    'tabvault_browser_override',
    'tabvault_queue',
  ])

  if (stored.tabvault_profile_name) {
    profile = stored.tabvault_profile_name
  } else if (stored.tabvault_profile) {
    profile = stored.tabvault_profile
  }

  if (stored.tabvault_browser_override) {
    browser = stored.tabvault_browser_override
  } else {
    browser = await detectBrowser()
  }

  if (stored.tabvault_queue?.length) {
    queue = stored.tabvault_queue
  }
}

async function detectProfile() {
  try {
    const info = await chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' })
    if (info?.email) {
      profile = info.email
      await chrome.storage.local.set({ tabvault_profile: profile })
      return
    }
  } catch {}

  if (!profile) {
    profile = 'Default'
  }
}

function push(event) {
  queue.push({
    ...event,
    browser,
    profile,
    timestamp: event.timestamp ?? Date.now(),
  })
  persistQueue()
}

async function flush() {
  if (!queue.length) return { ok: true, flushed: 0 }

  const batch = [...queue]
  queue = []
  await persistQueue()

  try {
    const response = await fetch(SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    })

    if (!response.ok) {
      throw new Error(`Server ${response.status}`)
    }

    isServerUp = true
    return { ok: true, flushed: batch.length }
  } catch (error) {
    isServerUp = false
    queue = [...batch, ...queue]
    await persistQueue()
    return { ok: false, flushed: 0, error: error.message }
  }
}

function saveCurrentTabTime() {
  if (!activeTabId || !focusStart) return

  const timeSpent = Date.now() - focusStart
  focusStart = null

  if (timeSpent < 1000) return

  push({
    type: 'tab_focused',
    tabId: activeTabId,
    title: tabTitles[activeTabId]?.title ?? '',
    url: tabTitles[activeTabId]?.url ?? '',
    timeSpent,
  })
}

async function captureOpenTabsSnapshot() {
  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (!tab.id || !isTrackableUrl(tab.url)) continue
    tabTitles[tab.id] = normalizeTab(tab)
    push({
      type: 'tab_snapshot',
      tabId: tab.id,
      title: tab.title ?? '',
      url: tab.url ?? '',
    })
  }
}

chrome.tabs.onCreated.addListener((tab) => {
  if (!tab.id || !isTrackableUrl(tab.url)) return
  tabTitles[tab.id] = normalizeTab(tab)
  push({
    type: 'tab_opened',
    tabId: tab.id,
    title: tab.title ?? '',
    url: tab.url ?? '',
  })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !isTrackableUrl(tab.url)) return
  tabTitles[tabId] = normalizeTab(tab)
  push({
    type: 'tab_updated',
    tabId,
    title: tab.title ?? '',
    url: tab.url ?? '',
  })
})

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    saveCurrentTabTime()
    activeTabId = null
  }

  push({
    type: 'tab_closed',
    tabId,
    title: tabTitles[tabId]?.title ?? '',
    url: tabTitles[tabId]?.url ?? '',
    timeSpent: 0,
  })

  delete tabTitles[tabId]
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  saveCurrentTabTime()
  activeTabId = tabId
  focusStart = Date.now()

  try {
    const tab = await chrome.tabs.get(tabId)
    if (!isTrackableUrl(tab.url)) return
    tabTitles[tabId] = normalizeTab(tab)
  } catch {}
})

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    saveCurrentTabTime()
    focusStart = null
    return
  }

  if (activeTabId) {
    focusStart = Date.now()
  }
})

chrome.history.onVisited.addListener((result) => {
  if (!isTrackableUrl(result.url)) return
  push({
    type: 'history_visit',
    tabId: 0,
    title: result.title ?? '',
    url: result.url,
    duration: 0,
  })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'page_time') {
    push({
      type: 'history_visit',
      tabId: sender.tab?.id ?? 0,
      title: message.title ?? '',
      url: message.url ?? '',
      duration: message.duration ?? 0,
      timestamp: message.timestamp ?? Date.now(),
    })
    sendResponse({ ok: true })
    return true
  }

  if (message.type === 'force_flush') {
    flush().then(sendResponse)
    return true
  }

  if (message.type === 'set_browser_override') {
    browser = message.browser || browser
    chrome.storage.local.set({ tabvault_browser_override: browser }).then(async () => {
      await captureOpenTabsSnapshot()
      const result = await flush()
      sendResponse({ ok: true, browser, result })
    })
    return true
  }

  if (message.type === 'set_profile_name') {
    profile = message.profile?.trim() || 'Default'
    chrome.storage.local.set({ tabvault_profile_name: profile }).then(() => {
      sendResponse({ ok: true, profile })
    })
    return true
  }

  if (message.type === 'get_status') {
    chrome.tabs.query({}).then((tabs) => {
      sendResponse({
        profile,
        browser,
        isServerUp,
        queueSize: queue.length,
        activeTabId,
        openTabCount: tabs.filter((tab) => isTrackableUrl(tab.url)).length,
      })
    })
    return true
  }

  return false
})

chrome.alarms.create(BATCH_ALARM, { periodInMinutes: 0.5 })
chrome.alarms.create(SNAPSHOT_ALARM, { periodInMinutes: 2 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === BATCH_ALARM) {
    await flush()
  }

  if (alarm.name === SNAPSHOT_ALARM) {
    await captureOpenTabsSnapshot()
    await flush()
  }
})

chrome.runtime.onInstalled.addListener(async () => {
  await loadConfig()
  await detectProfile()
  await captureOpenTabsSnapshot()
  await flush()
})

async function init() {
  await loadConfig()
  await detectProfile()
  await captureOpenTabsSnapshot()
  await flush()
}

init()
