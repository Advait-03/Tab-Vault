-- CreateTable
CREATE TABLE "Tab" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tabId" INTEGER NOT NULL,
    "browser" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "favicon" TEXT,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "History" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "browser" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "favicon" TEXT,
    "visitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "categoryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "History_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📁',
    "color" TEXT NOT NULL DEFAULT '#8B86AE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DailyStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "totalTime" INTEGER NOT NULL DEFAULT 0,
    "tabsOpened" INTEGER NOT NULL DEFAULT 0,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DetectedBrowser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "browserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "executablePath" TEXT NOT NULL,
    "version" TEXT,
    "extensionInstalled" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Tab_browser_profile_idx" ON "Tab"("browser", "profile");

-- CreateIndex
CREATE INDEX "Tab_isOpen_idx" ON "Tab"("isOpen");

-- CreateIndex
CREATE INDEX "Tab_openedAt_idx" ON "Tab"("openedAt");

-- CreateIndex
CREATE INDEX "History_browser_profile_visitedAt_idx" ON "History"("browser", "profile", "visitedAt");

-- CreateIndex
CREATE INDEX "History_visitedAt_idx" ON "History"("visitedAt");

-- CreateIndex
CREATE INDEX "History_categoryId_idx" ON "History"("categoryId");

-- CreateIndex
CREATE INDEX "DailyStats_date_idx" ON "DailyStats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_date_browser_profile_key" ON "DailyStats"("date", "browser", "profile");

-- CreateIndex
CREATE UNIQUE INDEX "DetectedBrowser_browserId_key" ON "DetectedBrowser"("browserId");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_key_key" ON "AppSettings"("key");
