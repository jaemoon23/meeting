import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/meeting/',
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        meetings: resolve(__dirname, 'meetings.html'),
        projects: resolve(__dirname, 'projects.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
