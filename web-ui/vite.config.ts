import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import denyImports from 'unplugin-deny-imports/vite'
import { preset } from 'unplugin-deny-imports/presets'


const config = defineConfig({
  server: {
    port: 3000,
    strictPort: true,
  },
  plugins: [
    devtools(),
    nitro({
      preset: 'node',
      output: {
        dir: '.output',
        serverDir: '.output/server',
        publicDir: '.output/public',
      },
      rollupConfig: {
        external: ['better-sqlite3'],
      },
    }),
    denyImports(preset({exclude: ['@tanstack/react-router'] })),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    // react's vite plugin must come after start's vite plugin
    tanstackStart(),
    viteReact(),
  ],
})

export default config
