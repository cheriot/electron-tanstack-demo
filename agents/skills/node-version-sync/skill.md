---
name: node-version-sync
description: Diagnose and fix Node.js version mismatches between system Node, .nvmrc, and Electron's embedded Node. Use when you see NODE_MODULE_VERSION errors or native module compilation failures.
---

## Diagnosis Steps

### 1. Check Electron's Node Version

```bash
# From the desktop/ directory
./node_modules/.bin/electron -e "console.log('Node:', process.versions.node, 'ABI:', process.versions.modules)"
```

This shows:
- **Node version**: The Node.js version Electron embeds
- **ABI version**: The NODE_MODULE_VERSION native modules must match

### 2. Check Current .nvmrc

```bash
cat .nvmrc
```

### 3. Check System Node Version

```bash
node -e "console.log('Node:', process.version, 'ABI:', process.config.variables.node_module_version)"
```

### 4. Look Up Electron Releases

Visit https://releases.electronjs.org/ to find which Node.js version a specific Electron version uses.

## Fix Steps

### 1. Update .nvmrc to Match Electron

After checking Electron's Node version (step 1 above), update `.nvmrc`:

```bash
# Example: If Electron uses Node 22.21.1
echo "22" > .nvmrc
```

Use the major version number for flexibility.

### 2. Switch to the Correct Node Version

```bash
nvm install
nvm use
```

### 3. Clean Build Artifacts

```bash
pnpm run clean

# Clear Electron's node-gyp cache (if rebuild issues persist)
rm -rf ~/.electron-gyp

# Reinstall dependencies with correct Node
pnpm install
```

### 4. Rebuild Native Modules

See current package.json scripts for commands.

### 5. Test the Package

```bash
pnpm package
open out/desktop-darwin-arm64/desktop.app  # macOS
```

Inspect logs for the desktop application in the system's appData directory for errors. E.g. ~/Library/Logs/desktop/main.log

## Common Issues

### Electron Version Changed

When upgrading Electron:
1. Update `electron` in `desktop/package.json`
2. Run diagnosis steps above to find new Node version
3. Update `.nvmrc`
4. Clean and rebuild everything

## Quick Reference

| Electron | Node.js | ABI |
|----------|---------|-----|
| 39.x     | 22.x    | 140 |
| 38.x     | 22.x    | 136 |
| 37.x     | 22.x    | 131 |

Check https://releases.electronjs.org/ for current mappings.
