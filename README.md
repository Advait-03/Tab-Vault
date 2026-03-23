# 🛡 TabVault — All Your Browsers, One Place

> Monitor all your browsers in one place. 100% local. Nothing leaves your machine.

---

## ✅ Supported Browsers

### Windows (Full Support)

| Browser | Detection | Extension | Notes |
|---|---|---|---|
| 🔴 Google Chrome | ✅ Auto-detected | ✅ Supported | Full tab + history tracking |
| 🔵 Microsoft Edge | ✅ Auto-detected | ✅ Supported | Built into Windows 10/11 |
| 🦁 Brave Browser | ✅ Auto-detected | ✅ Supported | Same extension as Chrome |
| 🟠 Mozilla Firefox | ✅ Auto-detected | ⚠️ Different install | Needs about:debugging method |
| 🎭 Opera | ✅ Auto-detected | ✅ Supported | Same extension as Chrome |

### Mac (Partial Support — coming in Part 4)

| Browser | Detection | Extension | Notes |
|---|---|---|---|
| 🔴 Google Chrome | 🔜 Part 4 | ✅ Supported | Manual install for now |
| 🧭 Safari | 🔜 Part 4 | ❌ Not supported | Apple blocks web extensions |
| 🟠 Firefox | 🔜 Part 4 | ⚠️ Different install | Needs about:debugging |
| 🦁 Brave | 🔜 Part 4 | ✅ Supported | Same as Chrome |

---

## ⚡ Quick Start (5 Commands)

Open `tabvault` folder in VS Code → press **Ctrl + `** → run one by one:

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
npm run dev
```

Open **http://localhost:3000** — the setup wizard will launch automatically on first visit!

---

## 🧙 First Launch Setup Wizard

On the very first time you open TabVault, you will see the setup wizard automatically.
It does 3 things:

1. **Scans your Windows machine** for installed browsers (checks Program Files + Registry)
2. **Shows only the browsers you actually have** — no clutter from browsers you don't use
3. **Guides you to install the extension** in each detected browser with step-by-step instructions

The wizard runs only once. After completion, TabVault goes straight to the dashboard on every future launch.

To re-run setup: click the ⚙️ icon in the Browser Launcher, or go to `http://localhost:3000/setup`

---

## 🔌 Installing the Extension

### Chrome / Edge / Brave / Opera (Same Steps)
```
1. Open the browser
2. Go to: chrome://extensions  (or edge://extensions, brave://extensions, opera://extensions)
3. Enable "Developer Mode" — toggle in the top right corner
4. Click "Load Unpacked"
5. Select the /extension folder inside your tabvault project
6. The 🛡 TabVault shield icon appears in your toolbar ✅
```

### Firefox (Different Steps)
```
1. Open Firefox
2. Go to: about:debugging#/runtime/this-firefox
3. Click "Load Temporary Add-on"
4. Navigate to your tabvault/extension folder
5. Select the manifest.json file
6. Extension loads ✅ (Note: reloads needed after Firefox restart)
```

### Verify It's Working
- Click the 🛡 TabVault icon in your toolbar
- Should show "✅ TabVault is running"
- Open a few tabs → wait 30 seconds → real data appears in dashboard

---

## 📱 Mobile Access (Same WiFi)

```bash
npm run dev:mobile
```
Find your IP: open Command Prompt → type `ipconfig` → look for **IPv4 Address**
Then open `http://YOUR_IP:3000` on your phone.

---

## 🛠️ All Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start at http://localhost:3000 |
| `npm run dev:mobile` | Start accessible on local network |
| `npm run build` | Production build |
| `npm run db:studio` | Visual database browser at localhost:5555 |
| `npm run db:seed` | Fill DB with 30 days demo data |
| `npm run db:reset` | ⚠️ Wipe all data |
| `npm run db:migrate` | Run migrations |
| `npm run db:generate` | Regenerate Prisma types |

---

## 🔍 Troubleshooting

| Problem | Fix |
|---|---|
| Setup wizard shows every time | Run: `npm run db:migrate` to create AppSettings table |
| No browsers detected | Make sure browsers are installed in default locations |
| Extension not connecting | Make sure `npm run dev` is running first |
| Cannot find @prisma/client | Run: `npx prisma generate` |
| Database errors | Run: `npm run db:reset` then `npm run db:seed` |
| Port 3000 in use | Run: `npm run dev -- --port 3001` |

---

## 📁 What's New in Part 3

```
tabvault/
├── app/
│   ├── setup/page.tsx          ← NEW: First launch setup wizard
│   └── api/
│       ├── browsers/route.ts   ← NEW: Scans Windows for browsers
│       └── setup/route.ts      ← NEW: Reads/writes setup state
├── prisma/
│   └── schema.prisma           ← UPDATED: Added DetectedBrowser + AppSettings models
└── components/
    └── BrowserLauncher.tsx     ← UPDATED: Shows only detected browsers
```

---

## 🗺️ Roadmap

- [x] Part 1 — Project setup + UI
- [x] Part 2 — Extension + real data
- [x] Part 3 — Setup wizard + browser detection
- [ ] Part 4 — Firefox/Safari ports + drag & drop categories
- [ ] Part 5 — AI features (Claude API)

---

Built with ❤️ · 100% Local · Your data never leaves your machine 🛡
