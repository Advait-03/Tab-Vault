// TabVault — extension/content.js
// Injected into every webpage.
// Accurately measures how long the user actually looks at each page.

(function () {
  // Don't run in iframes
  if (window.self !== window.top) return

  let startTime   = Date.now()
  let totalTime   = 0       // accumulated ms
  let isVisible   = !document.hidden

  // ── Track visibility changes ──────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page hidden — accumulate time
      if (isVisible) {
        totalTime += Date.now() - startTime
        isVisible  = false
      }
    } else {
      // Page visible again — restart timer
      startTime = Date.now()
      isVisible = true
    }
  })

  // ── Send time to background on page unload ────────
  function sendTime() {
    if (isVisible) {
      totalTime += Date.now() - startTime
    }
    const duration = Math.floor(totalTime / 1000) // seconds
    if (duration < 2) return // ignore < 2 seconds (accidental opens)

    try {
      chrome.runtime.sendMessage({
        type:      'page_time',
        url:       window.location.href,
        title:     document.title,
        duration,
        timestamp: Date.now(),
      })
    } catch (_) {
      // Extension context might be invalidated — use sendBeacon as fallback
      try {
        const payload = JSON.stringify({
          events: [{
            type:      'history_visit',
            browser:   'unknown',
            profile:   'unknown',
            tabId:     0,
            title:     document.title,
            url:       window.location.href,
            timestamp: Date.now(),
            duration,
          }],
        })
        navigator.sendBeacon('http://localhost:3000/api/ingest', payload)
      } catch (_) {}
    }
  }

  // Send when leaving page
  window.addEventListener('beforeunload', sendTime)
  window.addEventListener('pagehide',     sendTime)
})()
