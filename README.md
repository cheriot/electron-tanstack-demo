# Electron & Tanstack Start

Demo of turning a Tanstack Start app into a desktop app with Electron. web-ui/ still runs as a web app for maximum optionality.

The goal is to work on a new idea with Tanstack Start and not have to think about whether it will make more sense as a desktop or web app.

## Features

- Monorepo organization so web-ui/ can run inside the desktop app and as a web app with the same codebase.
- desktop/ follows [Electron's security best practices](https://www.electronjs.org/docs/latest/tutorial/security). Rerun [002-electron-security-audit.md](plans/002-electron-security-audit.md) for current status.
- desktop/ runs a server process built from web-ui/ secured by a shared secret. See [web-ui/src/middleware/electron-auth.ts](web-ui/src/middleware/electron-auth.ts) and [003-local-shared-secret.md](plans/003-local-shared-secret.md).
- Strict CSP to guard against XSS. See [web-ui/src/middleware/csp.ts](web-ui/src/middleware/csp.ts).
- A first e2e test of the packaged Electron app is included to confirm it all works. See [e2e/app.spec.ts](desktop/e2e/app.spec.ts) and [004-electron-e2e-test.md](plans/004-electron-e2e-test.md).

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


## Generated From

- [Electron Forge](https://www.electronforge.io/) `pnpm dlx create-electron-app@latest desktop --template=vite-typescript`
- [TanStack Start](https://tanstack.com/start/latest/docs/framework/react/overview) `pnpm create @tanstack/start@latest --no-git --tailwind --toolchain=eslint`