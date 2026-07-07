import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes every asset reference relative, so the built app runs from
// ANY location without rebuilding — hosted at the root, hosted under a subpath
// (e.g. GitHub Pages /whodid/), or opened straight from an iCloud Drive folder
// on the Mac. See README → "맥·iOS에서 쓰기".
// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
})
