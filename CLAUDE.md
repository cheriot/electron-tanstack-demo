# Electron, Tanstack Start, & ai-sdk 6

Demo of turning a Tanstack Start app into a desktop app with Electron. web-ui/ still runs as a web app for maximum optionality.

The goal is to work on a new idea with Tanstack Start and not have to think about whether it will make more sense as a desktop or web app.

## Features

- Monorepo organization so web-ui/ can run inside the desktop app and as a web app with the same codebase.
- desktop/ follows [Electron's security best practices](https://www.electronjs.org/docs/latest/tutorial/security). Rerun [002-electron-security-audit.md](plans/002-electron-security-audit.md) for current status.
- desktop/ runs a server process built from web-ui/ secured by a shared secret. See [web-ui/src/middleware/electron-auth.ts](web-ui/src/middleware/electron-auth.ts) and [003-local-shared-secret.md](plans/003-local-shared-secret.md).
- Strict CSP to guard against XSS. See [web-ui/src/middleware/csp.ts](web-ui/src/middleware/csp.ts).
- A first e2e test of the packaged Electron app is included to confirm it all works. See [e2e/app.spec.ts](desktop/e2e/app.spec.ts) and [004-electron-e2e-test.md](plans/004-electron-e2e-test.md).
- 

## Directory Structure

```
/
├── desktop/     # Electron shell with embedded server
└── web-ui/      # Tanstack Start
```

## Development

See [Development.md](DEVELOPMENT.md).

## Production Build

Build web-ui and package Electron:

```bash
pnpm package
```

The packaged app will be in `desktop/out/`. Run it locally with

```bash
open desktop/out/desktop-darwin-arm64/desktop.app
```

Use `pnpm make` to create installers.

## Commands

### Development

```bash
pnpm install           # Install dependencies
pnpm dev               # Run both web-ui and desktop together
pnpm dev:web           # Run web-ui only at http://localhost:3000
pnpm dev:desktop       # Run Electron only (requires web-ui running)
```

### Testing & Quality

```bash
pnpm test:e2e          # Run e2e tests (packages app first)
pnpm lint              # Lint all packages
pnpm typecheck         # Type check all packages
```

### Web UI Specific

```bash
cd web-ui
pnpm dev               # Dev server on port 3000
pnpm build             # Build for production
pnpm test              # Run vitest tests
pnpm check             # Format and fix with prettier + eslint
pnpm db:generate       # Generate Drizzle migrations
pnpm db:migrate        # Apply migrations
pnpm db:push           # Push schema changes
pnpm db:studio         # Open Drizzle Studio
```

### Desktop Specific

```bash
cd desktop
pnpm start             # Start Electron without web-ui
pnpm package           # Package app (builds web-ui first)
pnpm make              # Create installers (builds web-ui first)
pnpm test:e2e          # Run Playwright e2e tests on packaged app
pnpm rebuild           # Rebuild native modules for Electron
```

### Shadcn Components

Use the latest version of Shadcn to install new components:

```bash
pnpm dlx shadcn@latest add button
```

## Architecture

### Dual Runtime Model

The codebase supports two execution modes with the same code:

1. **Web mode**: Standard Tanstack Start web app running on port 3000
2. **Desktop mode**: Electron app with embedded Nitro server

Key differences between modes:

- **Development**: Desktop uses web-ui's dev server (no auth required)
- **Production**: Desktop embeds a built Nitro server secured with `ELECTRON_AUTH_SECRET`

### Security Architecture

Two middleware layers protect the embedded server:

1. **electron-auth.ts**: Validates `x-electron-auth` header with shared secret (timing-safe comparison)
2. **csp.ts**: Content Security Policy with nonce-based script execution

Desktop generates a random secret on startup (desktop/src/server.ts) and passes it via headers when loading pages in the renderer.

### Database

- Uses Drizzle ORM with better-sqlite3
- Database location varies by environment:
  - Development: `./app.db` or `DATABASE_URL` env var
  - Production (Electron): `userData/app.db` via `ELECTRON_APP_PATH` env var
- Schema in web-ui/src/db/schema.ts

### oRPC API Layer

Type-safe RPC using oRPC:

- Router definitions: web-ui/src/orpc/router/
- Client setup: web-ui/src/orpc/client.ts
- Uses isomorphic functions to route server-side calls directly, client-side calls via fetch to `/api/rpc`
- Integrated with Tanstack Query via `createTanstackQueryUtils`

### Nitro Server (Production)

In production, desktop imports the built Nitro server from `.output/server/index.mjs`. Nitro auto-starts on import, so environment variables must be set before the import (see desktop/src/server.ts).

### Route Generation

Tanstack Router uses file-based routing with generated route tree in web-ui/src/routeTree.gen.ts. This file is auto-generated and should not be edited manually.
