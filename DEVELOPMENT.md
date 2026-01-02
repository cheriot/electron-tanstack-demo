# Development

## Setup

```bash
pnpm install
```

## Development Instance

Dev mode uses a normal Tanstack Start dev server with vite and hot reloading.

Run both web-ui dev server and Electron together:

```bash
pnpm dev
```

Or run them separately:

```bash
pnpm dev:web      # web-ui only at http://localhost:3000
pnpm dev:desktop  # Electron only (requires web-ui running)
```

## Debugging

On Mac, look for logs in ~/Library/Logs/{appname}/main.log

