import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the game works at any address, including GitHub Pages (/tycoon/).
export default defineConfig({
  base: './',
  plugins: [react()],
})
