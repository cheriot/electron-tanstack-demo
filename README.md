# Electron & Tanstack Start

**WIP Goal**

Demo of turning a Tanstack Start app into a desktop app. web-ui/ still runs as a web app for maximum optionality.

## Directory Structure

```
/
├── desktop/     # Electron
└── web-ui/      # Tanstack Start
```

## Generate Code From

- pnpm dlx create-electron-app@latest desktop --template=vite-typescript
- pnpm create @tanstack/start@latest --no-git --tailwind --toolchain=eslint