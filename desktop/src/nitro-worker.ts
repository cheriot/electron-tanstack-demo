// This script runs in a utilityProcess to start the Nitro server
// Environment variables are passed from the main process

import path from 'node:path'

async function main() {
  const serverDir = process.env.NITRO_SERVER_DIR
  if (!serverDir) {
    console.error('NITRO_SERVER_DIR not set')
    process.exit(1)
  }

  // Nitro auto-starts on import, so env vars must already be set by the parent process
  await import(path.join(serverDir, 'index.mjs'))
}

main().catch((err) => {
  console.error('Failed to start Nitro server:', err)
  process.exit(1)
})
