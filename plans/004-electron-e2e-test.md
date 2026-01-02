# Plan: Playwright E2E Testing for Electron App (Production-like)

## Goal
Create a simple E2E test that launches the **packaged** Electron app (with embedded Nitro server) and verifies the page title is "TanStack Start Starter".

## Approach
Use `@playwright/test` with Playwright's `_electron` API to launch the packaged Electron executable. This tests the real production behavior including the embedded Nitro server startup.

---

## How Production Mode Works
From `desktop/src/server.ts`:
- `app.isPackaged` determines dev vs production
- Production: starts embedded Nitro server from `process.resourcesPath/.output/server`
- The packaged app includes the built web-ui

---

## Implementation Steps

### 1. Install Dependencies
```bash
cd desktop && pnpm add -D @playwright/test electron-playwright-helpers
```

### 2. Create Playwright Config
Create `desktop/playwright.config.ts`:
- 120 second timeout (server startup takes time)
- Single worker (Electron tests can't parallelize well)
- Reporter: list

### 3. Create E2E Test
Create `desktop/e2e/app.spec.ts`:
- Use `findLatestBuild()` and `parseElectronApp()` from `electron-playwright-helpers`
- Use `_electron.launch()` with the parsed app's executablePath
- Wait for first window with `electronApp.firstWindow()`
- Wait for page to load (domcontentloaded)
- Test: verify `page.title()` equals "TanStack Start Starter"
- Close app with `electronApp.close()`

### 4. Add npm Scripts
Update `desktop/package.json`:
```json
"test:e2e": "pnpm package && playwright test"
```

The script runs `pnpm package` first which:
1. Builds web-ui (`pnpm build:web`)
2. Packages Electron app (`electron-forge package`)

### 5. Update TypeScript Config
Add `e2e/**/*` to `desktop/tsconfig.json` include array.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `desktop/package.json` | Add deps + test:e2e script |
| `desktop/playwright.config.ts` | Create - Playwright config |
| `desktop/e2e/app.spec.ts` | Create - Title verification test |
| `desktop/tsconfig.json` | Add e2e to include array |

---

## Running Tests
```bash
cd desktop && pnpm test:e2e
```

This will:
1. Build web-ui
2. Package Electron app
3. Launch packaged app
4. Verify title is "TanStack Start Starter"
5. Close app

---

## Key References
- Page title: `web-ui/src/routes/__root.tsx:34`
- Electron main process: `desktop/src/main.ts`
- Server logic (dev vs prod): `desktop/src/server.ts:14-21`
- Packaged output: `desktop/out/`
