# Electron & Tanstack Start

Demo of turning a Tanstack Start app into a desktop app. web-ui/ still runs as a web app for maximum optionality.

## Directory Structure

```
/
├── desktop/     # Electron shell with embedded Nitro server
└── web-ui/      # Tanstack Start
```

## Setup

```bash
pnpm install
```

## Development

Run both web-ui dev server and Electron together:

```bash
pnpm dev
```

Or run them separately:

```bash
pnpm dev:web      # web-ui only at http://localhost:3000
pnpm dev:desktop  # Electron only (requires web-ui running)
```

## Production Build

Build web-ui and package Electron:

```bash
pnpm build
```

The packaged app will be in `desktop/out/`.

## How It Works

- **Development**: Electron loads from the web-ui Vite dev server (port 3000) with hot reload
- **Production**: Nitro server is embedded in Electron's main process, serving the app from localhost

Database files are stored in the OS-appropriate location:
- macOS: `~/Library/Application Support/<app-name>/`
- Windows: `%APPDATA%/<app-name>/`
- Linux: `~/.config/<app-name>/`

## Related Links

- [TanStack Start Hosting Guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [Nitro Node.js Runtime](https://nitro.build/deploy/runtimes/node)
- [Nitro Configuration](https://nitro.build/config)
- [Electron Forge](https://www.electronforge.io/)

## Generated From

- `pnpm dlx create-electron-app@latest desktop --template=vite-typescript`
- `pnpm create @tanstack/start@latest --no-git --tailwind --toolchain=eslint`