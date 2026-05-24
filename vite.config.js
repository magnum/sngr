import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    {
      name: 'copy-netlify-redirects',
      closeBundle() {
        copyFileSync(resolve('netlify/_redirects'), resolve('dist/_redirects'))
      },
    },
  ],
  server: {
    allowedHosts: [
      'sngr.netlify.app',
      'sngr.m6i.it',
      'mbpromag.eu.ngrok.io',
      'localhost',
    ],
  },
})
