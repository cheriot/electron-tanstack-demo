# Plan: Embed Tanstack Start in Electron

## Goal
Run the `web-ui/` Tanstack Start app inside `desktop/` Electron with an embedded Nitro server for fully offline operation.

## Architecture

```
Electron Main Process
├── Embedded Nitro Server (localhost:PORT)
│   ├── SSR, Server Functions, oRPC API
│   └── SQLite Database
└── BrowserWindow → loads http://localhost:PORT
```

## Implementation Steps

### 1. Configure web-ui Nitro for Node embedding
**File:** `web-ui/vite.config.ts`

**Why:** By default, Nitro builds a self-starting server. The `node` preset changes the output to export a request handler function instead, allowing us to control the server lifecycle (port, start/stop) from Electron's main process.

Add Nitro config for `node` preset and externalize native modules:
```typescript
nitro({
  config: {
    preset: 'node',
    output: { dir: '.output', serverDir: '.output/server', publicDir: '.output/public' },
    externals: ['better-sqlite3'],
  },
}),
```

### 2. Create server launcher module
**New file:** `desktop/src/server.ts`

- Export `startServer(isDev)` - returns port number
- Use `get-port` library for port selection (prefer 3000 in both modes)
- In dev mode: return the port web-ui is running on
- In production: dynamically import Nitro from `.output/server/index.mjs`, create HTTP server
- Export `stopServer()` for cleanup
- Set `ELECTRON_APP_PATH` env var for database location

```typescript
import getPort from 'get-port'
const port = await getPort({ port: 3000 })
```

### 3. Update Electron main process
**File:** `desktop/src/main.ts`

- Import and call `startServer()` before creating window
- Load from `http://localhost:3000` in dev mode
- Load from `http://127.0.0.1:${port}` in production
- Call `stopServer()` on app quit

### 4. Make database path configurable for OS-appropriate storage
**File:** `web-ui/src/db/index.ts`

Electron provides `app.getPath('userData')` which returns the OS-standard location for app data:
- macOS: `~/Library/Application Support/<app-name>/`
- Windows: `%APPDATA%/<app-name>/`
- Linux: `~/.config/<app-name>/`

The server launcher (step 2) sets `ELECTRON_APP_PATH` to this value before starting Nitro. The database code checks for it:

```typescript
import path from 'node:path'
import Database from 'better-sqlite3'

const dbPath = process.env.ELECTRON_APP_PATH
  ? path.join(process.env.ELECTRON_APP_PATH, 'app.db')
  : process.env.DATABASE_URL || './app.db'

const sqlite = new Database(dbPath)
```

This ensures all data files go to the proper OS location in production, while still working with the project directory in development.

### 5. Configure Electron Forge packaging
**File:** `desktop/forge.config.ts`

Electron Forge's `extraResource` option copies files into the packaged app's resources folder:

```typescript
packagerConfig: {
  extraResource: ['../web-ui/.output'],  // Copies entire .output directory
  asar: { unpack: '*.{node,dylib}' },    // Unpack native modules from ASAR
},
```

**How it works:**
1. `pnpm build` in web-ui creates `.output/server/index.mjs` (the Nitro handler)
2. Electron Forge copies `.output/` into the app resources during packaging
3. At runtime, access via `process.resourcesPath`:
   - macOS: `MyApp.app/Contents/Resources/.output/`
   - Windows: `MyApp/resources/.output/`
   - Linux: `MyApp/resources/.output/`

**In server.ts:**
```typescript
const serverDir = path.join(process.resourcesPath, '.output', 'server')
const { listener } = await import(path.join(serverDir, 'index.mjs'))
```

Also add `@electron/rebuild` for `better-sqlite3` native module.

### 6. Update desktop dependencies
**File:** `desktop/package.json`

Add:
- `better-sqlite3`, `get-port` (runtime)
- `@electron/rebuild`, `concurrently` (dev)
- Scripts: `"dev": "concurrently \"cd ../web-ui && pnpm dev\" \"sleep 3 && electron-forge start\""`

### 7. Create workspace configuration
**New files:** Root `package.json` and `pnpm-workspace.yaml`

Enable running both projects together with pnpm workspace commands.

## Files to Modify
- `web-ui/vite.config.ts` - Nitro node preset
- `web-ui/src/db/index.ts` - Dynamic DB path
- `desktop/src/main.ts` - Server lifecycle
- `desktop/forge.config.ts` - Build config
- `desktop/package.json` - Dependencies and scripts

## New Files
- `desktop/src/server.ts` - Server launcher
- `package.json` (root) - Workspace scripts
- `pnpm-workspace.yaml` - Workspace config

## Development Workflow
1. `pnpm dev` from root starts web-ui dev server (port 3000) and Electron
2. Hot reload works via web-ui Vite dev server

## Production Build
1. `pnpm build` in web-ui generates `.output/`
2. `pnpm make` in desktop packages Electron with embedded server
