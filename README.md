# Electron & Tanstack Start

Demo of turning a Tanstack Start app into a desktop app. web-ui/ still runs as a web app for maximum optionality.

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
pnpm build
```

The packaged app will be in `desktop/out/`. It will run Nitro on localhost serving the web app. Strict CSP and a shared secret guard against XSS and other local processes.

```bash
open desktop/out/desktop-darwin-arm64/desktop.app
```

## Related Links

- [TanStack Start Hosting Guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [Nitro Node.js Runtime](https://nitro.build/deploy/runtimes/node)
- [Nitro Configuration](https://nitro.build/config)
- [Electron Forge](https://www.electronforge.io/)

## Generated From

- `pnpm dlx create-electron-app@latest desktop --template=vite-typescript`
- `pnpm create @tanstack/start@latest --no-git --tailwind --toolchain=eslint`