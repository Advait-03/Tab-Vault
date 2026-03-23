'use client'
// app/setup/page.tsx
// First-launch setup wizard — shown only once
// Step 1: Scanning for browsers
// Step 2: Install extensions per detected browser
// Step 3: All done → redirect to dashboard

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ChevronRight, ExternalLink, RefreshCw, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────
interface DetectedBrowser {
  id:                 number
  browserId:          string
  name:               string
  executablePath:     string
  version:            string | null
  extensionInstalled: boolean
  icon:               string
  color:              string
  extensionUrl:       string
  installGuide:       string
  note?:              string
}

// ── Step indicator ─────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={cn(
          'transition-all duration-300 rounded-full',
          i < current  ? 'w-6 h-2 bg-bh-green'  :
          i === current ? 'w-8 h-2 bg-bh-green animate-pulse' :
                          'w-2 h-2 bg-white/10'
        )}/>
      ))}
    </div>
  )
}

// ── Main wizard ────────────────────────────────────────
export default function SetupPage() {
  const router                                    = useRouter()
  const [step, setStep]                           = useState(0) // 0=scanning, 1=extensions, 2=done
  const [scanning, setScanning]                   = useState(true)
  const [browsers, setBrowsers]                   = useState<DetectedBrowser[]>([])
  const [scanError, setScanError]                 = useState(false)
  const [markedInstalled, setMarkedInstalled]     = useState<Set<string>>(new Set())
  const [completing, setCompleting]               = useState(false)
  const [scanLog, setScanLog]                     = useState<string[]>([])

  // ── Step 0: Auto-scan on mount ───────────────────────
  useEffect(() => {
    if (step === 0) runScan()
  }, [])

  async function runScan() {
    setScanning(true)
    setScanError(false)
    setScanLog([])

    const logSteps = [
      'Checking C:\\Program Files...',
      'Checking C:\\Program Files (x86)...',
      'Reading Windows Registry...',
      'Checking AppData\\Local...',
      'Scanning for Chrome installations...',
      'Scanning for Edge installations...',
      'Scanning for Brave installations...',
      'Scanning for Firefox installations...',
      'Finalising results...',
    ]

    // Animated log lines
    for (let i = 0; i < logSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 280))
      setScanLog((prev) => [...prev, logSteps[i]])
    }

    try {
      const res  = await fetch('/api/browsers')
      const data = await res.json()
      setBrowsers(data.detected ?? [])
      await new Promise((r) => setTimeout(r, 400))
      setScanning(false)
      // Auto-advance to step 1 after brief pause
      setTimeout(() => setStep(1), 600)
    } catch {
      setScanError(true)
      setScanning(false)
    }
  }

  async function markInstalled(browserId: string) {
    setMarkedInstalled((prev) => new Set(prev).add(browserId))
    // Update in DB
    await fetch('/api/browsers', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ browserId, extensionInstalled: true }),
    })
  }

  async function completeSetup() {
    setCompleting(true)
    await fetch('/api/setup', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ completed: true }),
    })
    // Run seed if no data yet
    setTimeout(() => router.push('/'), 1200)
  }

  function openExtensionPage(url: string) {
    window.open(url, '_blank')
  }

  // ── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bh-bg bh-gradient-bg flex flex-col items-center justify-center p-6">

      {/* Card */}
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M18 3L32 10V22C32 30 18 35 18 35C18 35 4 30 4 22V10L18 3Z"
                  fill="rgba(200,255,87,0.08)" stroke="#C8FF57" strokeWidth="1.5"/>
            <path d="M18 7L29 13V22C29 28 18 32 18 32C18 32 7 28 7 22V13L18 7Z"
                  fill="rgba(200,255,87,0.04)"/>
            <rect x="11" y="17" width="14" height="3" rx="1.5" fill="#C8FF57"/>
            <rect x="11" y="22" width="9"  height="3" rx="1.5" fill="#C8FF57" opacity="0.55"/>
          </svg>
          <span className="font-black text-2xl tracking-tight">
            Tab<span className="text-bh-green">Vault</span>
          </span>
        </div>

        {/* ════════ STEP 0 — SCANNING ════════ */}
        {step === 0 && (
          <div className="bh-card p-8 animate-fade-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                              bg-bh-green/10 border border-bh-green/25 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-bh-green animate-blink"/>
                <span className="text-[11px] font-black text-bh-green font-mono uppercase tracking-wide">
                  First Launch Setup
                </span>
              </div>
              <h1 className="text-2xl font-black mb-2">
                {scanning ? 'Scanning your device…' : scanError ? 'Scan failed' : 'Scan complete!'}
              </h1>
              <p className="text-bh-text2 text-sm">
                {scanning
                  ? 'Looking for installed browsers on your Windows machine'
                  : scanError
                  ? 'Could not scan for browsers. Check that TabVault is running.'
                  : `Found ${browsers.length} browser${browsers.length !== 1 ? 's' : ''} installed`}
              </p>
            </div>

            {/* Scan log terminal */}
            <div className="bg-bh-s2 border border-white/[0.07] rounded-xl p-4 font-mono
                            text-xs mb-6 h-52 overflow-y-auto">
              <div className="text-bh-text3 mb-2">TabVault Scanner v0.3.0</div>
              {scanLog.map((line, i) => (
                <div key={i} className="text-bh-green opacity-80 leading-6 flex items-center gap-2">
                  <span className="text-bh-text3">›</span> {line}
                </div>
              ))}
              {scanning && (
                <div className="text-bh-green/50 flex items-center gap-1 mt-1">
                  <span className="text-bh-text3">›</span>
                  <span className="animate-pulse">_</span>
                </div>
              )}
              {!scanning && !scanError && (
                <div className="text-bh-green font-black mt-2 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5"/>
                  Scan complete — {browsers.length} browser{browsers.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>

            {/* Detected browsers mini preview */}
            {!scanning && !scanError && browsers.length > 0 && (
              <div className="flex gap-3 flex-wrap justify-center mb-6">
                {browsers.map((b) => (
                  <div key={b.browserId}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border
                               border-white/10 bg-bh-s2 text-sm font-bold"
                    style={{ borderColor: `${b.color}30` }}>
                    <span className="text-lg">{b.icon}</span>
                    <span>{b.name}</span>
                    {b.version && (
                      <span className="text-[10px] font-mono text-bh-text3">v{b.version.split('.')[0]}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {scanError && (
              <button onClick={runScan}
                className="w-full py-3 rounded-xl border border-bh-pink/30 bg-bh-pink/10
                           text-bh-pink font-black flex items-center justify-center gap-2 hover:bg-bh-pink/20 transition-all">
                <RefreshCw className="w-4 h-4"/> Retry Scan
              </button>
            )}
          </div>
        )}

        {/* ════════ STEP 1 — INSTALL EXTENSIONS ════════ */}
        {step === 1 && (
          <div className="bh-card p-8 animate-fade-up">
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                              bg-bh-green/10 border border-bh-green/25">
                <span className="text-[11px] font-black text-bh-green font-mono uppercase tracking-wide">
                  Step 2 of 3
                </span>
              </div>
              <StepIndicator current={1} total={3}/>
            </div>

            <h1 className="text-2xl font-black mt-4 mb-1">Install Extensions</h1>
            <p className="text-bh-text2 text-sm mb-6">
              Install the TabVault extension in each browser below so it can start tracking.
              You can skip any browser and do it later.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {browsers.map((b) => {
                const installed = markedInstalled.has(b.browserId) || b.extensionInstalled
                return (
                  <div key={b.browserId}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border transition-all',
                      installed
                        ? 'border-bh-green/30 bg-bh-green/5'
                        : 'border-white/[0.07] bg-bh-s2'
                    )}>
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 border"
                         style={{ background: `${b.color}18`, borderColor: `${b.color}30` }}>
                      {b.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm flex items-center gap-2">
                        {b.name}
                        {b.version && (
                          <span className="text-[10px] font-mono text-bh-text3">
                            v{b.version.split('.')[0]}
                          </span>
                        )}
                        {installed && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full
                                           bg-bh-green/15 text-bh-green border border-bh-green/25">
                            ✓ Installed
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-bh-text2 mt-0.5 font-mono truncate">
                        {b.installGuide}
                      </div>
                      {b.note && (
                        <div className="text-[10px] text-bh-yellow mt-0.5">⚠ {b.note}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {!installed ? (
                        <>
                          <button
                            onClick={() => openExtensionPage(b.extensionUrl)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black
                                       border transition-all hover:-translate-y-0.5"
                            style={{
                              color:        b.color,
                              borderColor:  `${b.color}40`,
                              background:   `${b.color}15`,
                            }}>
                            Open Extensions <ExternalLink className="w-3 h-3"/>
                          </button>
                          <button
                            onClick={() => markInstalled(b.browserId)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-bh-text3
                                       border border-white/10 hover:border-bh-green/30
                                       hover:text-bh-green transition-all text-center">
                            Mark as done ✓
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                                        bg-bh-green/10 border border-bh-green/25 text-bh-green
                                        text-[11px] font-black">
                          <CheckCircle className="w-3.5 h-3.5"/> Ready
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Instructions box */}
            <div className="bg-bh-s2 border border-white/[0.07] rounded-xl p-4 mb-6">
              <div className="text-[11px] font-black text-bh-yellow mb-2">
                📋 How to install in any browser:
              </div>
              <ol className="text-[11px] text-bh-text2 space-y-1 font-mono">
                <li>1. Click "Open Extensions" button above</li>
                <li>2. Enable <strong className="text-bh-text">Developer Mode</strong> (toggle in top right)</li>
                <li>3. Click <strong className="text-bh-text">Load Unpacked</strong></li>
                <li>4. Select the <strong className="text-bh-green">/extension</strong> folder inside your tabvault project</li>
                <li>5. The 🛡 TabVault icon will appear in your toolbar</li>
                <li>6. Click "Mark as done" above to confirm</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-bh-text2
                           font-bold hover:bg-bh-s2 transition-all text-sm">
                Skip for now
              </button>
              <button onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl bg-bh-green/15 border border-bh-green/35
                           text-bh-green font-black flex items-center justify-center gap-2
                           hover:bg-bh-green/25 transition-all text-sm">
                Continue <ChevronRight className="w-4 h-4"/>
              </button>
            </div>
          </div>
        )}

        {/* ════════ STEP 2 — DONE ════════ */}
        {step === 2 && (
          <div className="bh-card p-8 text-center animate-fade-up">
            <StepIndicator current={2} total={3}/>
            <div className="mt-6 mb-6">
              {/* Animated shield */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="animate-fade-up">
                    <path d="M40 8L68 24V48C68 64 40 76 40 76C40 76 12 64 12 48V24L40 8Z"
                          fill="rgba(200,255,87,0.1)" stroke="#C8FF57" strokeWidth="2"/>
                    <path d="M40 16L61 27V48C61 61 40 71 40 71C40 71 19 61 19 48V27L40 16Z"
                          fill="rgba(200,255,87,0.05)"/>
                    <rect x="28" y="38" width="24" height="5" rx="2.5" fill="#C8FF57"/>
                    <rect x="28" y="47" width="16" height="5" rx="2.5" fill="#C8FF57" opacity="0.6"/>
                    <rect x="28" y="56" width="10" height="5" rx="2.5" fill="#C8FF57" opacity="0.3"/>
                  </svg>
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-full bg-bh-green/20 blur-2xl -z-10"/>
                </div>
              </div>

              <h1 className="text-3xl font-black mb-3">
                You're all set! 🎉
              </h1>
              <p className="text-bh-text2 text-sm mb-2">
                TabVault found <strong className="text-bh-text">{browsers.length} browser{browsers.length !== 1 ? 's' : ''}</strong> on your machine.
              </p>
              <p className="text-bh-text2 text-sm mb-6">
                Your dashboard will only show <strong className="text-bh-green">browsers that are actually installed</strong> — no clutter from browsers you don't have.
              </p>

              {/* Summary of detected browsers */}
              <div className="flex gap-2 flex-wrap justify-center mb-8">
                {browsers.map((b) => (
                  <div key={b.browserId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
                    style={{ color: b.color, borderColor: `${b.color}30`, background: `${b.color}12` }}>
                    {b.icon} {b.name}
                    {(markedInstalled.has(b.browserId) || b.extensionInstalled) && (
                      <CheckCircle className="w-3 h-3"/>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={completeSetup}
                disabled={completing}
                className="w-full py-4 rounded-xl bg-bh-green text-bh-bg font-black text-base
                           flex items-center justify-center gap-2 hover:bg-bh-green/90
                           transition-all disabled:opacity-60 disabled:cursor-not-allowed
                           hover:-translate-y-0.5 active:scale-95">
                {completing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin"/> Opening Dashboard…
                  </>
                ) : (
                  <>
                    Open TabVault Dashboard <ArrowRight className="w-4 h-4"/>
                  </>
                )}
              </button>

              <p className="text-[11px] text-bh-text3 mt-4">
                You can always re-run setup from Settings · All data stays 100% local 🛡
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
